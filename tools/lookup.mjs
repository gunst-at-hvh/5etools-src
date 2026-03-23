#!/usr/bin/env node

/**
 * Schnelles CLI-Lookup für D&D 2024 Regeln.
 *
 * Usage:
 *   node tools/lookup.mjs spell "Fireball"
 *   node tools/lookup.mjs feat "Alert"
 *   node tools/lookup.mjs class "Wizard"
 *   node tools/lookup.mjs monster "Aboleth"
 *   node tools/lookup.mjs race "Aasimar"
 *   node tools/lookup.mjs item "Longsword"
 *   node tools/lookup.mjs search "fire"        # Suche über alle Kategorien
 *
 * Benötigt: Zuerst `node tools/extract-2024.mjs` ausführen.
 */

import {readFileSync, existsSync} from "fs";
import {join, dirname} from "path";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "data-2024.json");

// --- Helpers ---

const SCHOOL_MAP = {
	A: "Abjuration", C: "Conjuration", D: "Divination", E: "Enchantment",
	V: "Evocation", I: "Illusion", N: "Necromancy", T: "Transmutation",
};

function stripMarkup (text) {
	if (typeof text !== "string") return text;
	return text
		.replace(/\{@\w+\s+([^|}]+?)(?:\|[^}]*)?\}/g, "$1")
		.replace(/\{@\w+\s+([^}]+)\}/g, "$1");
}

function flattenEntries (entries, depth = 0) {
	if (!entries) return "";
	const indent = "  ".repeat(depth);
	const lines = [];
	for (const entry of entries) {
		if (typeof entry === "string") {
			lines.push(indent + stripMarkup(entry));
		} else if (entry && typeof entry === "object") {
			if (entry.name) lines.push(`\n${indent}### ${entry.name}`);
			if (entry.entries) lines.push(flattenEntries(entry.entries, depth + 1));
			if (entry.items) {
				for (const item of entry.items) {
					if (typeof item === "string") {
						lines.push(`${indent}  • ${stripMarkup(item)}`);
					} else if (item?.name && item?.entries) {
						lines.push(`${indent}  • ${item.name}: ${stripMarkup(flattenEntries(item.entries))}`);
					} else if (item?.entries) {
						lines.push(flattenEntries(item.entries, depth + 1));
					}
				}
			}
		}
	}
	return lines.join("\n");
}

// --- Formatters ---

function fmtSpell (s) {
	const level = s.level === 0 ? "Cantrip" : `Level ${s.level}`;
	const school = SCHOOL_MAP[s.school] || s.school;
	const time = (s.time || []).map(t => `${t.number} ${t.unit}`).join(", ");
	const range = s.range?.distance ? `${s.range.distance.amount} ${s.range.distance.type}` : s.range?.type || "?";
	const comp = [s.components?.v && "V", s.components?.s && "S", s.components?.m && `M (${typeof s.components.m === "string" ? s.components.m : s.components.m?.text || "material"})`].filter(Boolean).join(", ");
	const dur = (s.duration || []).map(d => d.type === "timed" ? `${d.duration.amount} ${d.duration.type}${d.concentration ? " (Concentration)" : ""}` : d.type).join(", ");

	let out = `\n  ✦ ${s.name} — ${level} ${school}\n`;
	out += `  Source: ${s.source} p.${s.page}\n`;
	out += `  Casting Time: ${time}\n`;
	out += `  Range: ${range}\n`;
	out += `  Components: ${comp}\n`;
	out += `  Duration: ${dur}\n`;
	if (s.damageInflict) out += `  Damage: ${s.damageInflict.join(", ")}\n`;
	if (s.savingThrow) out += `  Save: ${s.savingThrow.join(", ")}\n`;
	out += `\n${flattenEntries(s.entries)}\n`;
	if (s.entriesHigherLevel) out += `\n${flattenEntries(s.entriesHigherLevel)}\n`;
	return out;
}

function fmtClass (c) {
	let out = `\n  ✦ ${c.name} — ${c.source}\n`;
	out += `  Hit Die: d${c.hd?.faces || "?"}\n`;
	out += `  Saves: ${(c.proficiency || []).join(", ")}\n`;
	if (c.spellcastingAbility) out += `  Spellcasting: ${c.spellcastingAbility}\n`;
	if (c.casterProgression) out += `  Caster: ${c.casterProgression}\n`;
	return out;
}

function fmtFeat (f) {
	let out = `\n  ✦ ${f.name} — Feat (${f.category || "?"})\n`;
	out += `  Source: ${f.source} p.${f.page}\n`;
	if (f.prerequisite) {
		const prereqs = f.prerequisite.map(p => {
			const parts = [];
			if (p.level) parts.push(`Level ${typeof p.level === "number" ? p.level : p.level.level}`);
			if (p.ability) parts.push(JSON.stringify(p.ability));
			if (p.spellcasting) parts.push("Spellcasting");
			return parts.join(", ") || JSON.stringify(p);
		});
		out += `  Prerequisites: ${prereqs.join("; ")}\n`;
	}
	out += `\n${flattenEntries(f.entries)}\n`;
	return out;
}

function fmtRace (r) {
	const speed = typeof r.speed === "number" ? `${r.speed} ft.` : Object.entries(r.speed || {}).map(([k, v]) => `${k}: ${typeof v === "number" ? v : v.number} ft.`).join(", ");
	let out = `\n  ✦ ${r.name} — Species\n`;
	out += `  Source: ${r.source} p.${r.page}\n`;
	out += `  Size: ${(r.size || []).join("/")}\n`;
	out += `  Speed: ${speed}\n`;
	if (r.darkvision) out += `  Darkvision: ${r.darkvision} ft.\n`;
	if (r.resist) out += `  Resistance: ${r.resist.join(", ")}\n`;
	out += `\n${flattenEntries(r.entries)}\n`;
	return out;
}

function fmtMonster (m) {
	const hp = m.hp?.average ? `${m.hp.average} (${m.hp.formula})` : m.hp?.special || "?";
	const ac = (m.ac || []).map(a => typeof a === "number" ? a : a.ac || a.special || "?").join(", ");
	let out = `\n  ✦ ${m.name} — ${m.type} (${(m.size || []).join("/")})\n`;
	out += `  Source: ${m.source} p.${m.page}\n`;
	out += `  AC: ${ac}  |  HP: ${hp}\n`;
	out += `  STR ${m.str} DEX ${m.dex} CON ${m.con} INT ${m.int} WIS ${m.wis} CHA ${m.cha}\n`;
	if (m.speed) {
		const speeds = Object.entries(m.speed).filter(([k]) => k !== "canHover").map(([k, v]) => `${k}: ${typeof v === "number" ? v : v.number} ft.`).join(", ");
		out += `  Speed: ${speeds}\n`;
	}
	if (m.immune) out += `  Immune: ${m.immune.join(", ")}\n`;
	if (m.resist) out += `  Resist: ${m.resist.join(", ")}\n`;
	if (m.trait) out += `\n  Traits:\n${flattenEntries(m.trait, 1)}\n`;
	if (m.action) out += `\n  Actions:\n${flattenEntries(m.action, 1)}\n`;
	return out;
}

function fmtItem (i) {
	const gp = i.value ? `${(i.value / 100).toFixed(i.value % 100 ? 2 : 0)} GP` : "?";
	let out = `\n  ✦ ${i.name} — Item\n`;
	out += `  Source: ${i.source} p.${i.page}\n`;
	out += `  Rarity: ${i.rarity || "none"}  |  Value: ${gp}`;
	if (i.weight) out += `  |  Weight: ${i.weight} lb.`;
	out += "\n";
	out += `\n${flattenEntries(i.entries)}\n`;
	return out;
}

function fmtGeneric (entry) {
	let out = `\n  ✦ ${entry.name}\n`;
	out += `  Source: ${entry.source}${entry.page ? ` p.${entry.page}` : ""}\n`;
	if (entry.entries) out += `\n${flattenEntries(entry.entries)}\n`;
	return out;
}

// --- Category mapping ---

const CATEGORY_MAP = {
	spell: {key: "spell", fmt: fmtSpell},
	spells: {key: "spell", fmt: fmtSpell},
	class: {key: "class", fmt: fmtClass},
	classes: {key: "class", fmt: fmtClass},
	feat: {key: "feat", fmt: fmtFeat},
	feats: {key: "feat", fmt: fmtFeat},
	race: {key: "race", fmt: fmtRace},
	races: {key: "race", fmt: fmtRace},
	species: {key: "race", fmt: fmtRace},
	monster: {key: "monster", fmt: fmtMonster},
	monsters: {key: "monster", fmt: fmtMonster},
	creature: {key: "monster", fmt: fmtMonster},
	item: {key: "item", fmt: fmtItem},
	items: {key: "item", fmt: fmtItem},
	background: {key: "background", fmt: fmtGeneric},
	backgrounds: {key: "background", fmt: fmtGeneric},
	condition: {key: "condition", fmt: fmtGeneric},
	action: {key: "action", fmt: fmtGeneric},
};

// --- Main ---

if (!existsSync(DATA_PATH)) {
	console.error("Fehler: data-2024.json nicht gefunden. Zuerst ausführen:\n  node tools/extract-2024.mjs");
	process.exit(1);
}

const [,, category, ...queryParts] = process.argv;
const query = queryParts.join(" ");

if (!category || !query) {
	console.log(`Usage: node tools/lookup.mjs <category> <name>

Categories: spell, feat, class, race/species, monster, item, background, condition, action
Special:    search <term>  (sucht über alle Kategorien)`);
	process.exit(0);
}

const data = JSON.parse(readFileSync(DATA_PATH, "utf-8"));

if (category === "search") {
	const term = query.toLowerCase();
	const searchable = ["spell", "monster", "class", "subclass", "feat", "race", "background", "item", "baseitem", "optionalfeature", "condition", "action", "variantrule"];
	let found = 0;
	for (const key of searchable) {
		const arr = data[key];
		if (!Array.isArray(arr)) continue;
		const matches = arr.filter(e => e.name?.toLowerCase().includes(term));
		if (matches.length > 0) {
			console.log(`\n── ${key} (${matches.length} Treffer) ──`);
			for (const m of matches.slice(0, 10)) {
				console.log(`  • ${m.name} (${m.source} p.${m.page || "?"})`);
			}
			if (matches.length > 10) console.log(`  ... und ${matches.length - 10} weitere`);
			found += matches.length;
		}
	}
	if (found === 0) console.log(`Keine Treffer für "${query}"`);
	else console.log(`\n${found} Treffer gesamt.`);
	process.exit(0);
}

const cat = CATEGORY_MAP[category.toLowerCase()];
if (!cat) {
	console.error(`Unbekannte Kategorie: "${category}"\nVerfügbar: ${Object.keys(CATEGORY_MAP).join(", ")}, search`);
	process.exit(1);
}

const arr = data[cat.key];
if (!Array.isArray(arr) || arr.length === 0) {
	console.log(`Keine Daten in Kategorie "${cat.key}"`);
	process.exit(0);
}

// Exact match first, then fuzzy
const exact = arr.find(e => e.name?.toLowerCase() === query.toLowerCase());
if (exact) {
	console.log(cat.fmt(exact));
	process.exit(0);
}

const fuzzy = arr.filter(e => e.name?.toLowerCase().includes(query.toLowerCase()));
if (fuzzy.length === 0) {
	console.log(`Kein Treffer für "${query}" in ${cat.key}`);
} else if (fuzzy.length === 1) {
	console.log(cat.fmt(fuzzy[0]));
} else {
	console.log(`${fuzzy.length} Treffer für "${query}":\n`);
	for (const f of fuzzy.slice(0, 20)) {
		console.log(`  • ${f.name} (${f.source} p.${f.page || "?"})`);
	}
	if (fuzzy.length > 20) console.log(`  ... und ${fuzzy.length - 20} weitere`);
	console.log(`\nFür Details: node tools/lookup.mjs ${category} "${fuzzy[0].name}"`);
}
