# Wizard's Spell Compendium (WSC) scrape — data catalog & modeling notes

Scraped from the AD&D 2e Fandom wiki
([Spell List A‑Z](https://adnd2e.fandom.com/wiki/Wizard's_Spell_Compendium_Spell_List_A-Z))
via the MediaWiki API on 2026‑06‑27. **1,884 unique wizard spells** (the list page
links 1,891 entries; 7 are redirects to the same page).

## Files produced

| File | What | Schema |
|------|------|--------|
| `../../json/wsc.json` | **Drop‑in** flat records | Exactly the 16 keys of `wizard.json`, `source:"WSC"`, `school` normalised to the 8 canonical schools. Ready to `concat()` into the app. |
| `wsc_full.json` | **Rich** records | Superset of the flat schema + every dimension below, kept structured for the rework. |
| `raw_pages.json` | Cached raw wikitext of every page | — (lets `parse_wsc.py` re‑run with no network) |
| `titles.json` | Title / list‑name / list‑level for each entry | — |

Regenerate: `python3 fetch_wsc.py` (re‑scrapes, ~38 API calls) then `python3 parse_wsc.py`.
Re‑parse only (offline, instant): `python3 parse_wsc.py`.

---

## Catalog of inconsistencies & structural richness

These are the "interesting" things the source data carries that the current flat
schema flattens or drops. Each is already captured in `wsc_full.json` under the
named field, so a rework can pick any of them up.

### 1. Multi‑school spells — `schools`, `schoolsRaw`
2e spells frequently belong to **several schools at once**. The infobox lists them
comma/slash‑separated, primary first.
- **317** spells map to ≥2 of the 8 standard schools (e.g. *Abi‑Dalzim's Horrid
  Wilting* = `Alteration, Necromancy`; *Fireflow* = `Alteration, Evocation`).
- `school` (flat) keeps only the **primary** so the existing exact‑match school
  filter keeps working; `schools` (rich) is the full canonical list, `schoolsRaw`
  the verbatim string.
- **Modeling idea:** let a spell match *any* of its schools in the school filter;
  show all schools in the info box.

### 2. Sub‑schools / alternate magic systems — `subSchools`
The infobox carries a **second, italic school line** naming the WSC "paths" and
elemental systems. **765** spells have one or more. Vocabulary seen (counts approx):
`Shadow 64, Artifice 56, Force 56, Mentalism 54, Song 52, Geometry 45, Dimension 44,
Alchemy 41, Water 31, Air 26, Earth 23, Fire 20, Metamagic 12, Chronomancy 11, Wood 1`,
plus combinations (`Alchemy, Water`, `Dimension, Shadow`, …).
- A handful of spells are **only** an alternate system (no standard school) — e.g.
  the 32 **Chronomancy** spells, 1 pure **Alchemy**. For these the flat `school`
  falls back to the alternate name (so they show *something*, but match no button).
- **Modeling idea:** sub‑school as a separate facet/filter (elementalist, chronomancer,
  Al‑Qadim, artificer, song mage…). This is genuinely new taxonomy vs. the PHB data.

### 3. Al‑Qadim "Provinces" & elemental tags
Inside the school field as parentheticals: `(Province: Flame | Sand | Sea | Wind)`
and elemental `(Air, Earth, Fire, Water)`. Currently stripped from `school`; the raw
form survives in `schoolsRaw`/`subSchools`. ~30 spells. Province ↔ element mapping is
an Al‑Qadim thing (Flame→Fire, Sand→Earth, Sea→Water, Wind→Air).

### 4. Reversible spells — `reversible`
**110** spells are reversible (`(Reversible)` in the name, or "the reverse of this
spell…" in the text). The reverse is currently buried in the description.
- **Modeling idea:** flag + optionally split the reverse into its own searchable form.

### 5. Original sources — `originalSources`
Every WSC spell is a **reprint**; the infobox names where it first appeared. **920**
have a parseable original source. ~240 distinct, e.g. *Pages From the Mages* (142),
*Tome of Magic* (62), *Player's Option: Spells & Magic* (46), *Chronomancer* (28),
*Complete Book of Necromancers* (21), *Oriental Adventures* (21), plus dozens of
*Dragon Magazine* issues. The flat file collapses all to `source:"WSC"`.
- **Modeling idea:** a real provenance field — filter by "spells from Dragon Magazine",
  show the citation, dedupe against PHB/ToM (see #9).

### 6. Rarity — `rarity`
**1,465** spells carry a rarity (`common / uncommon / rare / very rare`) in their
"Notes:" line — often class‑conditional ("Uncommon for Air mages; rare for others").
Parsed best‑effort into `rarity`; the nuance stays in the description.
- **Modeling idea:** rarity badge / filter; campaign availability.

### 7. Combat & Tactics fields — `combatTactics`
**46** spells (the *Player's Option: Spells & Magic* point‑cast set) carry extra
infobox fields `subtlety`, `knockdown`, `sensory`, `critical`. Not in the PHB schema;
preserved as a `combatTactics` object. Also: a few `sphere` (wizard spells with priest
spheres!) and `requirements` fields.

### 8. Field‑value inconsistencies (normalization opportunities)
The source is hand‑entered, so short fields vary:
- **save:** `None`(1139) `Special`(315) `Neg.`(260) `1/2`(79) `Negate`(49) `Negates`(9)
  plus `none`, `Neg`, `None or Neg.`, conditional strings. (`{{frac|1|2}}` already → `1/2`.)
  Existing data uses `None / Negate / 1/2 / Special` — worth a normalization map.
- **castingTime:** mixes integers, `1 rd.` vs `1 round`, `1 turn`, `1 hr.`, dice
  (`1d4 turns`), and edition‑conditional values (`2 (CWH) / 3 (WSC)`).
- **level:** 1,879 are plain ints; **5 are edition‑conditional** strings
  (`3 (Sha'ir) / 4 (WSC)`, `Special`, …) — flat `level` takes the first integer,
  `levelRaw` keeps the original. One genuine **level‑10** spell: *Create Mythal*.

### 9. Overlap with existing `wizard.json`
**398** of the 1,884 WSC names already exist in the current `wizard.json`
(*Burning Hands*, *Charm Person*, *Fireball*, …) — WSC is a superset compilation.
Adding WSC wholesale means duplicate rows unless deduped. Decide per the rework:
keep both (filter by source), prefer existing, or merge provenance.

### 10. Title / naming quirks
- 5 "The Simbul's …" spells are linked without the leading *"The"* on the list page
  (red links); resolved by falling back to the real `The …` title.
- Names may carry `{{br}}(Reversible)` / sub‑titles in the infobox; flattened to the
  base name (full list name kept in `titles.json`).

---

## Suggested shape for a richer schema (if/when reworking)

```jsonc
{
  "name": "Abi-Dalzim's Horrid Wilting",
  "level": 8,
  "schools": ["Alteration", "Necromancy"],   // array, any-match filter
  "subSchools": ["Water"],                     // elemental / path facet
  "reversible": false,
  "components": { "v": true, "s": true, "m": true, "materials": "a bit of sponge" },
  "range": "20 yards/level", "aoe": "30-foot cube",
  "castingTime": "8", "duration": "Instantaneous", "save": "1/2",
  "rarity": "rare",
  "sources": ["Tome of Magic", "Wizard's Spell Compendium"],
  "description": "…"
}
```

All of the above is already present per‑spell in `wsc_full.json`.
