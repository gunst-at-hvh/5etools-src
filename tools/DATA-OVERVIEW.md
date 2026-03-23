# 5etools Datenstruktur – D&D 2024 Übersicht

## Source-Codes (2024 Edition)

| Code | Buch | Veröffentlicht | Hauptdatei |
|------|------|---------------|------------|
| `XPHB` | Player's Handbook (2024) | 2024-09-17 | `data/book/book-xphb.json` |
| `XDMG` | Dungeon Master's Guide (2024) | 2024-11-12 | `data/book/book-xdmg.json` |
| `XMM` | Monster Manual (2024) | 2025-02-18 | `data/book/book-xmm.json` |
| `XSAC` | Sage Advice Compendium (2024) | 2025-04-30 | `data/book/book-xsac.json` |

Vollständiges Source-Mapping: `data/books.json`

## Dateistruktur

```
data/
├── spells/
│   ├── spells-xphb.json      # Alle 2024 Spells (~580KB)
│   ├── spells-phb.json        # 2014 Spells (zum Vergleich)
│   ├── index.json             # Source → Dateiname Mapping
│   ├── sources.json           # Spell → Klassen Zuordnung
│   └── foundry.json           # Foundry VTT Kompatibilität
├── bestiary/
│   ├── bestiary-xphb.json     # 2024 PHB Kreaturen (Beschwörungen etc.)
│   ├── bestiary-xmm.json      # 2024 Monster Manual (~1.3MB)
│   └── bestiary-xdmg.json     # 2024 DMG Kreaturen
├── class/
│   ├── class-wizard.json       # Enthält sowohl PHB als auch XPHB Version
│   ├── class-fighter.json      # etc. für alle 13 Klassen
│   └── ...
├── book/
│   ├── book-xphb.json         # Volltext des 2024 PHB (~510KB)
│   ├── book-xdmg.json         # Volltext des 2024 DMG (~1.4MB)
│   └── book-xmm.json          # Volltext des 2024 MM (~420KB)
├── feats.json                  # Alle Feats (2014 + 2024 gemischt)
├── races.json                  # Alle Species/Races
├── backgrounds.json            # Alle Backgrounds
├── items.json                  # Alle Items (magisch + mundan)
├── items-base.json             # Basis-Items (Waffen, Rüstung)
├── optionalfeatures.json       # Eldritch Invocations, Manöver etc.
├── conditionsdiseases.json     # Conditions & Diseases
├── actions.json                # Aktionen (Attack, Dash, etc.)
├── variantrules.json           # Regelvarianten
├── skills.json                 # Skills
├── senses.json                 # Sinne
├── languages.json              # Sprachen
└── books.json                  # Metadaten aller Quellbücher
```

## JSON-Schemas nach Datentyp

### Spell (aus `data/spells/spells-xphb.json`)

```json
{
  "name": "Acid Splash",
  "source": "XPHB",
  "page": 239,
  "srd52": true,
  "basicRules2024": true,
  "level": 0,                          // 0 = Cantrip, 1-9 = Spell Level
  "school": "V",                       // V=Evocation, A=Abjuration, C=Conjuration,
                                       // D=Divination, E=Enchantment, I=Illusion,
                                       // N=Necromancy, T=Transmutation
  "time": [{"number": 1, "unit": "action"}],  // action, bonus, reaction, minute, hour
  "range": {
    "type": "point",                   // point, radius, line, cone, etc.
    "distance": {"type": "feet", "amount": 60}
  },
  "components": {"v": true, "s": true},       // v=verbal, s=somatic, m=material
  "duration": [{"type": "instant"}],           // instant, timed, permanent
  "entries": ["Regeltext mit {@markup}..."],
  "entriesHigherLevel": [{                     // At Higher Levels / Cantrip Upgrade
    "type": "entries",
    "name": "Cantrip Upgrade",
    "entries": ["..."]
  }],
  "scalingLevelDice": {                        // Optional: Skalierung
    "label": "Acid damage",
    "scaling": {"1": "1d6", "5": "2d6", "11": "3d6", "17": "4d6"}
  },
  "damageInflict": ["acid"],                   // Schadenstypen
  "savingThrow": ["dexterity"],                // Saving Throws
  "miscTags": ["SCL"],                         // SCL=Scaling, HL=Healing, etc.
  "areaTags": ["MT"]                           // MT=Multi-Target, S=Sphere, etc.
}
```

### Class (aus `data/class/class-wizard.json`)

```json
{
  "name": "Wizard",
  "source": "XPHB",           // oder "PHB" für 2014
  "page": 160,
  "edition": "one",           // "one" = 2024, "classic" = 2014
  "hd": {"number": 1, "faces": 6},
  "proficiency": ["int", "wis"],
  "spellcastingAbility": "int",
  "casterProgression": "full",         // full, half, third, pact
  "preparedSpells": "<$level$> + <$int_mod$>",
  "cantripProgression": [3, 3, 3, 4, ...],     // Cantrips known per level
  "startingProficiencies": {
    "weapons": ["..."],
    "armor": ["..."],
    "tools": ["..."],
    "skills": [{"choose": {"from": [...], "count": 2}}]
  },
  "classFeatures": ["Feature|Wizard||1|XPHB", ...],   // Level-Features
  "subclassTitle": "Wizard Subclass"
}
```

### Feat (aus `data/feats.json`)

```json
{
  "name": "Ability Score Improvement",
  "source": "XPHB",
  "page": 202,
  "srd52": true,
  "basicRules2024": true,
  "category": "G",              // G=General, O=Origin, EI=Epic, F=Fighting Style
  "prerequisite": [{"level": 4}],
  "repeatable": true,
  "ability": [{
    "choose": {
      "from": ["str", "dex", "con", "int", "wis", "cha"],
      "amount": 2
    }
  }],
  "entries": ["Regeltext..."]
}
```

### Race/Species (aus `data/races.json`)

```json
{
  "name": "Aasimar",
  "source": "XPHB",
  "page": 186,
  "edition": "one",
  "creatureTypes": ["humanoid"],
  "size": ["S", "M"],           // S=Small, M=Medium, L=Large
  "speed": 30,                  // oder Objekt: {"walk": 30, "fly": 50}
  "darkvision": 60,
  "resist": ["necrotic", "radiant"],
  "additionalSpells": [{
    "ability": "cha",
    "known": {"1": ["light|xphb#c"]}
  }],
  "entries": [
    {"type": "entries", "name": "Celestial Resistance", "entries": ["..."]}
  ],
  "soundClip": {"type": "internal", "path": "races/aasimar.mp3"}
}
```

### Background (aus `data/backgrounds.json`)

```json
{
  "name": "Aberrant Heir",
  "source": "EFA",
  "edition": "one",
  "ability": [{"choose": {"weighted": {"from": ["str","con","cha"], "weights": [2,1]}}}],
  "feats": [{"aberrant dragonmark|efa": true}],
  "skillProficiencies": [{"history": true, "intimidation": true}],
  "toolProficiencies": [{"disguise kit": true}],
  "startingEquipment": [{
    "a": ["dagger|xphb", "disguise kit|xphb", ...],
    "b": [{"value": 5000}]
  }],
  "entries": ["..."]
}
```

### Item (aus `data/items.json`)

```json
{
  "name": "Acid",
  "source": "XPHB",
  "page": 222,
  "srd52": true,
  "basicRules2024": true,
  "type": "G|XPHB",            // G=Gear, A=Armor, W=Weapon, WD=Wand, etc.
  "rarity": "none",            // none, common, uncommon, rare, very rare, legendary
  "weight": 1,
  "value": 2500,               // in Kupfermünzen (2500 = 25 GP)
  "entries": ["Regeltext..."]
}
```

### Monster/Creature (aus `data/bestiary/bestiary-xphb.json`)

```json
{
  "name": "Aberrant Spirit",
  "source": "XPHB",
  "page": 322,
  "summonedBySpell": "Summon Aberration|XPHB",
  "size": ["M"],
  "type": "aberration",
  "alignment": ["N"],
  "ac": [{"special": "11 + the spell's level"}],
  "hp": {"special": "40 + 10 for each spell level above 4"},
  "speed": {"walk": 30, "fly": {"number": 30, "condition": "(hover; Beholderkin only)"}},
  "str": 16, "dex": 10, "con": 15, "int": 16, "wis": 10, "cha": 6,
  "senses": ["Darkvision 60 ft."],
  "passive": 10,
  "immune": ["psychic"],
  "languages": ["Deep Speech"],
  "trait": [{"name": "Trait Name", "entries": ["..."]}],
  "action": [{"name": "Action Name", "entries": ["..."]}]
}
```

## Markup-System (Cross-References)

5etools nutzt ein eigenes Markup in `entries`-Texten:

| Markup | Bedeutung | Beispiel |
|--------|-----------|---------|
| `{@spell Name\|Source}` | Spell-Verweis | `{@spell Fireball\|XPHB}` |
| `{@item Name\|Source}` | Item-Verweis | `{@item Longsword\|XPHB}` |
| `{@creature Name\|Source}` | Monster-Verweis | `{@creature Dragon\|XMM}` |
| `{@class Name\|Source}` | Klassen-Verweis | `{@class Wizard\|XPHB}` |
| `{@condition Name\|Source}` | Condition | `{@condition Incapacitated\|XPHB}` |
| `{@damage XdY}` | Schadenswurf | `{@damage 2d6}` |
| `{@dice XdY}` | Würfelwurf | `{@dice 1d20}` |
| `{@dc X}` | Difficulty Class | `{@dc 15}` |
| `{@variantrule Name\|Source}` | Regelverweis | `{@variantrule Resistance\|XPHB}` |
| `{@action Name\|Source}` | Aktion | `{@action Attack\|XPHB}` |
| `{@filter Text\|page\|filter}` | Gefilterter Link | `{@filter cantrips\|spells\|level=0}` |
| `{@actSave ability}` | Saving Throw Aktion | `{@actSave wis}` |
| `{@actSaveFail}` | Bei fehlgeschlagenem Save | `{@actSaveFail}` |

## 2014 vs 2024 Unterscheidung

- **2024**: `"source": "XPHB"`, `"edition": "one"`, `"srd52": true`, `"basicRules2024": true`
- **2014**: `"source": "PHB"`, `"edition": "classic"`, `"srd": true`, `"basicRules": true`
- Einträge mit `"reprintedAs": ["Name|XPHB"]` sind 2014-Versionen die in 2024 übernommen wurden
- Beide Versionen koexistieren in denselben Dateien, gefiltert nach `source`

## Nützliche generierte Dateien

- `data/generated/gendata-spell-source-lookup.json` – Spell ↔ Klassen Zuordnung
- `data/generated/gendata-subclass-lookup.json` – Subclass-Referenzen
- `data/generated/gendata-tables.json` – Regeltabellen (Größen, Kosten etc.)
- `search/index.json` – Pre-built Suchindex (elasticlunr)
