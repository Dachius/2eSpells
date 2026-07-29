#!/usr/bin/env python3
"""Parse cached WSC wizard-spell wikitext into JSON.

Outputs two files:
  ../../json/wsc.json  -- flat records matching the existing wizard.json schema
                          (drop-in: same 16 keys, school normalised to the 8
                          canonical schools, source = "WSC").
  ./wsc_full.json      -- rich records that preserve everything catalogued in
                          NOTES.md (multi-school, sub-schools, reversibility,
                          original sources, rarity, Combat & Tactics fields...).

Run from this directory after fetch_wsc.py has produced raw_pages.json + titles.json:
    python3 parse_wsc.py
"""
import json, re, os

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))

raw = json.load(open(os.path.join(HERE, "raw_pages.json")))
PAGES, NM = raw["pages"], raw["norm_map"]
TITLES = json.load(open(os.path.join(HERE, "titles.json")))

WIZ_KEYS = ["level", "name", "school", "class", "verbal", "somatic", "material",
            "materials", "range", "aoe", "castingTime", "duration", "save",
            "damage", "description", "source"]

# ---------------------------------------------------------------- infobox parse
def get_infobox(wt):
    m = re.search(r"\{\{\s*Infobox Spells", wt, re.I)
    if not m:
        return None
    i = m.start(); depth = 0; j = i
    while j < len(wt):
        if wt[j:j+2] == "{{":
            depth += 1; j += 2; continue
        if wt[j:j+2] == "}}":
            depth -= 1; j += 2
            if depth == 0:
                return wt[i:j], wt[:i] + wt[j:]
            continue
        j += 1
    return wt[i:], ""


def split_params(inner):
    inner = re.sub(r"^\{\{\s*Infobox Spells\s*", "", inner, flags=re.I)
    if inner.endswith("}}"):
        inner = inner[:-2]
    dt = dl = 0; cur = ""; parts = []; k = 0
    while k < len(inner):
        two = inner[k:k+2]
        if two == "{{": dt += 1; cur += two; k += 2; continue
        if two == "}}": dt -= 1; cur += two; k += 2; continue
        if two == "[[": dl += 1; cur += two; k += 2; continue
        if two == "]]": dl -= 1; cur += two; k += 2; continue
        ch = inner[k]
        if ch == "|" and dt == 0 and dl == 0:
            parts.append(cur); cur = ""; k += 1; continue
        cur += ch; k += 1
    parts.append(cur)
    params = {}
    for p in parts:
        if "=" in p:
            key, _, val = p.partition("=")
            params[key.strip().lower()] = val.strip()
    return params


def resolve(t):
    seen = set()
    while t in NM and t not in seen:
        seen.add(t); t = NM[t]
    return t

# ---------------------------------------------------------------- markup clean
def table_to_text(tbl):
    out = []
    for line in tbl.splitlines():
        s = line.strip()
        if s.startswith("{|") or s == "|}":
            continue
        if s.startswith("|+"):
            out.append(strip_markup(s[2:].strip())); continue
        if s.startswith("|-"):
            continue
        if s.startswith("!"):
            cells = re.split(r"\s*(?:\|\||!!)\s*", s[1:])
            out.append(" | ".join(strip_markup(c.strip()) for c in cells)); continue
        if s.startswith("|"):
            cells = re.split(r"\s*\|\|\s*", s[1:])
            out.append(" | ".join(strip_markup(c.strip()) for c in cells)); continue
        out.append(strip_markup(s))
    return "\n".join(x for x in out if x)


def replace_tables(text):
    out = ""; i = 0
    while i < len(text):
        if text[i:i+2] == "{|":
            depth = 1; j = i + 2
            while j < len(text) and depth:
                if text[j:j+2] == "{|": depth += 1; j += 2; continue
                if text[j:j+2] == "|}": depth -= 1; j += 2; continue
                j += 1
            out += "\n" + table_to_text(text[i:j]) + "\n"
            i = j
        else:
            out += text[i]; i += 1
    return out


def strip_templates(text):
    text = re.sub(r"\{\{\s*[Bb]r\s*\}\}", "\n", text)
    text = re.sub(r"\{\{\s*[Ff]rac\s*\|\s*([^|}]+?)\s*\|\s*([^|}]+?)\s*\}\}", r"\1/\2", text)
    prev = None
    while prev != text:
        prev = text
        text = re.sub(r"\{\{[^{}]*\}\}", "", text)
    return text


def strip_markup(text):
    if text is None:
        return ""
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    text = strip_templates(text)
    text = re.sub(r"\[\[\s*(?:File|Image|Category)\s*:[^\]]*\]\]", "", text, flags=re.I)
    text = re.sub(r"\[\[[^\]|]*\|([^\]]*)\]\]", r"\1", text)
    text = re.sub(r"\[\[([^\]]*)\]\]", r"\1", text)
    text = re.sub(r"\[https?://[^\s\]]+\s+([^\]]+)\]", r"\1", text)
    text = re.sub(r"\[https?://[^\s\]]+\]", "", text)
    text = text.replace("'''''", "").replace("'''", "").replace("''", "")
    text = re.sub(r"^\s*=+\s*(.*?)\s*=+\s*$", r"\1", text, flags=re.M)
    text = re.sub(r"<\s*br\s*/?\s*>", "\n", text, flags=re.I)
    text = re.sub(r"<ref[^>]*>.*?</ref>", "", text, flags=re.S | re.I)
    text = re.sub(r"<ref[^>]*/>", "", text, flags=re.I)
    text = re.sub(r"</?[a-zA-Z][^>]*>", "", text)
    text = (text.replace("­", "").replace("&nbsp;", " ")
            .replace("&amp;", "&").replace("&mdash;", "—")
            .replace("&ndash;", "–").replace("&quot;", '"')
            .replace("&minus;", "−"))
    return text


def clean_inline(text):
    t = strip_markup(text)
    t = t.replace("\n", " / ")
    return re.sub(r"\s+", " ", t).strip()


def clean_body(body):
    body = replace_tables(body)
    body = strip_markup(body)
    body = "\n".join(ln.rstrip() for ln in body.split("\n"))
    body = re.sub(r"[ \t]+", " ", body)
    body = re.sub(r" *\n *", "\n", body)
    body = re.sub(r"\n{3,}", "\n\n", body)
    return body.strip()

# ---------------------------------------------------------------- schools
_SUBSCHOOL = [
    (r"enchantment\s*/\s*charm", "enchantment"),
    (r"conjuration\s*/\s*summoning", "conjuration"),
    (r"illusion\s*/\s*phantasm", "illusion"),
    (r"invocation\s*/\s*evocation", "evocation"),
]
_CANON = [
    ("abjuration", "Abjuration"), ("alteration", "Alteration"),
    ("conjuration", "Conjuration"), ("summoning", "Conjuration"),
    ("divination", "Divination"),
    ("enchantment", "Enchantment"), ("charm", "Enchantment"),
    ("evocation", "Evocation"), ("invocation", "Evocation"),
    ("illusion", "Illusion"), ("phantasm", "Illusion"),
    ("necromancy", "Necromancy"),
]


def _canon_one(token):
    low = token.lower()
    for pat, repl in _SUBSCHOOL:
        low = re.sub(pat, repl, low)
    low = re.sub(r"\([^)]*\)", " ", low)
    low = re.sub(r"\s+", " ", low).strip()
    for key, canon in _CANON:
        if low.startswith(key):
            return canon
    return None


def school_fields(raw_school):
    """Return (canonical_primary, schoolsRaw, canonical_list, subSchools)."""
    # primary (non-italic) line is before the first {{br}}/<br>
    primary_line = re.split(r"\{\{\s*br\s*\}\}|<\s*br\s*/?\s*>", raw_school, flags=re.I)[0]
    primary = strip_markup(primary_line)
    primary = re.sub(r"\s+", " ", primary).strip().rstrip(",").strip()

    # sub-schools: italicised alternate-system tokens anywhere in the field
    subs = []
    for it in re.findall(r"''([^']+)''", raw_school):
        it = strip_markup(it).strip().strip("()").strip()
        if it:
            subs.append(it)

    if not primary and subs:           # only an alternate-system school present
        primary = subs[0]
    schools_raw = primary

    # canonical list from the standard primary line (split on , and /)
    canon = []
    cleaned = re.sub(r"\([^)]*\)", " ", primary)
    for tok in re.split(r"[,/]", cleaned):
        c = _canon_one(tok)
        if c and c not in canon:
            canon.append(c)
    canon_primary = canon[0] if canon else (schools_raw if schools_raw else "")
    return canon_primary, schools_raw, canon, subs

# ---------------------------------------------------------------- misc fields
def parse_sources(raw_source):
    s = re.sub(r"\{\{\s*br\s*\}\}", "\n", raw_source, flags=re.I)
    out = []
    for line in s.split("\n"):
        t = strip_markup(line).strip()
        if not t:
            continue
        if re.search(r"wizard'?s spell compendium", t, re.I):
            continue
        t = re.sub(r"\s*\(2e\)\s*$", "", t).strip()
        if t and t not in out:
            out.append(t)
    return out


def parse_level(raw_level, fallback):
    m = re.search(r"\d+", raw_level or "")
    return int(m.group()) if m else fallback


RARITY_RE = re.compile(r"\b(very rare|rare|uncommon|common)\b", re.I)


def parse_rarity(desc):
    m = re.search(r"Notes:\s*(.*)", desc)
    scope = m.group(1) if m else desc
    r = RARITY_RE.search(scope)
    return r.group(1).lower() if r else ""


def to_bool(v):
    return str(v).strip().startswith("1")

# ---------------------------------------------------------------- build
def build(entry):
    page = resolve(entry["title"])
    wt = PAGES.get(page)
    if wt is None:
        return None
    box = get_infobox(wt)
    if not box:
        return None
    inner, body = box
    p = split_params(inner)

    name = re.split(r"\{\{\s*br\s*\}\}|<\s*br\s*/?\s*>", p.get("name", ""), flags=re.I)[0]
    name = re.sub(r"\s+", " ", strip_markup(name)).strip() or entry["name"]
    level = parse_level(p.get("level", ""), entry["listLevel"])
    canon_primary, schools_raw, canon_list, subs = school_fields(p.get("school", ""))
    desc = clean_body(body)
    reversible = bool(re.search(r"\(\s*reversible\s*\)", p.get("name", ""), re.I)) \
        or bool(re.search(r"reverse of this spell|reversed,? this spell|the reverse,", desc, re.I))

    flat = {
        "level": level,
        "name": name,
        "school": canon_primary,
        "class": "Wizard",
        "verbal": to_bool(p.get("verbal", "0")),
        "somatic": to_bool(p.get("somatic", "0")),
        "material": to_bool(p.get("material", "0")),
        "materials": clean_inline(p.get("materials", "")),
        "range": clean_inline(p.get("range", "")),
        "aoe": clean_inline(p.get("aoe", "")),
        "castingTime": clean_inline(p.get("castingtime", "")),
        "duration": clean_inline(p.get("duration", "")),
        "save": clean_inline(p.get("save", "")),
        "damage": clean_inline(p.get("damage", "")),
        "description": desc,
        "source": "WSC",
    }

    rich = dict(flat)
    rich["levelRaw"] = clean_inline(p.get("level", ""))
    rich["schoolsRaw"] = schools_raw
    rich["schools"] = canon_list
    rich["subSchools"] = subs
    rich["reversible"] = reversible
    rich["originalSources"] = parse_sources(p.get("source", ""))
    rich["rarity"] = parse_rarity(desc)
    if p.get("sphere", "").strip():
        rich["sphere"] = clean_inline(p["sphere"])
    if p.get("requirements", "").strip():
        rich["requirements"] = clean_inline(p["requirements"])
    ct = {k: clean_inline(p[k]) for k in ("subtlety", "knockdown", "sensory", "critical")
          if p.get(k, "").strip()}
    if ct:
        rich["combatTactics"] = ct
    rich["wikiPage"] = page
    return flat, rich


def main():
    flats, richs, seen = [], [], set()
    skipped = dupes = 0
    for e in TITLES:
        page = resolve(e["title"])
        if page in seen:
            dupes += 1; continue
        seen.add(page)
        r = build(e)
        if r is None:
            skipped += 1; continue
        flats.append(r[0]); richs.append(r[1])

    flats.sort(key=lambda r: (r["level"], r["name"].lower()))
    richs.sort(key=lambda r: (r["level"], r["name"].lower()))

    # safety: flat records must match the existing wizard.json schema exactly
    for f in flats:
        assert list(f.keys()) == WIZ_KEYS, f"schema drift: {f['name']}"

    out_flat = os.path.join(REPO, "json", "wsc.json")
    out_rich = os.path.join(HERE, "wsc_full.json")
    json.dump(flats, open(out_flat, "w"), ensure_ascii=False, indent=2)
    json.dump(richs, open(out_rich, "w"), ensure_ascii=False, indent=2)
    print(f"Wrote {len(flats)} flat records   -> {out_flat}")
    print(f"Wrote {len(richs)} rich records   -> {out_rich}")
    print(f"(skipped {skipped} infobox-less, {dupes} redirect duplicates)")


if __name__ == "__main__":
    main()
