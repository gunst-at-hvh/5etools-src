#!/usr/bin/env node

/**
 * Extrahiert alle D&D 2024 Daten (XPHB, XDMG, XMM) aus dem 5etools data/ Verzeichnis
 * und erzeugt eine zusammengefasste JSON-Datei.
 *
 * Usage: node tools/extract-2024.mjs [--out tools/data-2024.json]
 */

import {readFileSync, writeFileSync, readdirSync, existsSync} from "fs";
import {join, dirname} from "path";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA = join(ROOT, "data");

const SOURCES_2024 = new Set(["XPHB", "XDMG", "XMM", "XSAC"]);

const outPath = process.argv.includes("--out")
	? process.argv[process.argv.indexOf("--out") + 1]
	: join(__dirname, "data-2024.json");

function readJson (path) {
	return JSON.parse(readFileSync(path, "utf-8"));
}

function filterBySource (arr) {
	if (!Array.isArray(arr)) return [];
	return arr.filter(entry => entry.source && SOURCES_2024.has(entry.source));
}

// --- Spells (subdirectory with index) ---
function extractSpells () {
	const spellFiles = [
		join(DATA, "spells", "spells-xphb.json"),
	];
	const spells = [];
	for (const f of spellFiles) {
		if (!existsSync(f)) continue;
		const data = readJson(f);
		if (data.spell) spells.push(...filterBySource(data.spell));
	}
	return spells;
}

// --- Bestiary (subdirectory) ---
function extractBestiary () {
	const dir = join(DATA, "bestiary");
	const files = readdirSync(dir).filter(f => f.startsWith("bestiary-x") && f.endsWith(".json"));
	const monsters = [];
	for (const f of files) {
		const data = readJson(join(dir, f));
		if (data.monster) monsters.push(...filterBySource(data.monster));
	}
	return monsters;
}

// --- Classes (subdirectory, each file may contain both editions) ---
function extractClasses () {
	const dir = join(DATA, "class");
	const files = readdirSync(dir).filter(f => f.startsWith("class-") && f.endsWith(".json"));
	const classes = [];
	const subclasses = [];
	const classFeatures = [];
	const subclassFeatures = [];
	for (const f of files) {
		const data = readJson(join(dir, f));
		if (data.class) classes.push(...filterBySource(data.class));
		if (data.subclass) subclasses.push(...filterBySource(data.subclass));
		if (data.classFeature) classFeatures.push(...filterBySource(data.classFeature));
		if (data.subclassFeature) subclassFeatures.push(...filterBySource(data.subclassFeature));
	}
	return {classes, subclasses, classFeatures, subclassFeatures};
}

// --- Top-level JSON files ---
function extractTopLevel (filename, key) {
	const path = join(DATA, filename);
	if (!existsSync(path)) return [];
	const data = readJson(path);
	return filterBySource(data[key] || []);
}

// --- Main ---
console.log("Extrahiere D&D 2024 Daten...\n");

const spells = extractSpells();
const monsters = extractBestiary();
const {classes, subclasses, classFeatures, subclassFeatures} = extractClasses();
const feats = extractTopLevel("feats.json", "feat");
const races = extractTopLevel("races.json", "race");
const backgrounds = extractTopLevel("backgrounds.json", "background");
const items = extractTopLevel("items.json", "item");
const itemsBase = extractTopLevel("items-base.json", "baseitem");
const optionalFeatures = extractTopLevel("optionalfeatures.json", "optionalfeature");
const conditions = extractTopLevel("conditionsdiseases.json", "condition");
const diseases = extractTopLevel("conditionsdiseases.json", "disease");
const actions = extractTopLevel("actions.json", "action");
const variantRules = extractTopLevel("variantrules.json", "variantrule");
const skills = extractTopLevel("skills.json", "skill");
const senses = extractTopLevel("senses.json", "sense");
const languages = extractTopLevel("languages.json", "language");

const result = {
	_meta: {
		sources: [...SOURCES_2024],
		extractedAt: new Date().toISOString(),
		description: "D&D 2024 Regeldaten extrahiert aus 5etools",
	},
	spell: spells,
	monster: monsters,
	class: classes,
	subclass: subclasses,
	classFeature: classFeatures,
	subclassFeature: subclassFeatures,
	feat: feats,
	race: races,
	background: backgrounds,
	item: items,
	baseitem: itemsBase,
	optionalfeature: optionalFeatures,
	condition: conditions,
	disease: diseases,
	action: actions,
	variantrule: variantRules,
	skill: skills,
	sense: senses,
	language: languages,
};

// Statistiken
const stats = Object.entries(result)
	.filter(([k]) => k !== "_meta")
	.map(([k, v]) => [k, Array.isArray(v) ? v.length : 0])
	.filter(([, count]) => count > 0);

console.log("Kategorie             Anzahl");
console.log("─".repeat(38));
for (const [key, count] of stats) {
	console.log(`${key.padEnd(22)}${String(count).padStart(6)}`);
}
const total = stats.reduce((sum, [, c]) => sum + c, 0);
console.log("─".repeat(38));
console.log(`${"GESAMT".padEnd(22)}${String(total).padStart(6)}`);

writeFileSync(outPath, JSON.stringify(result, null, "\t"), "utf-8");
console.log(`\nGespeichert: ${outPath}`);
