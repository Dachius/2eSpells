#!/usr/bin/env python3
"""Scrape the Wizard's Spell Compendium A-Z list and cache every spell page.

Self-contained: extracts the spell titles from the list page, batch-fetches the
wikitext of all spell pages via the MediaWiki API, resolves redirects, and falls
back to a "The <name>" title / search for any red-linked pages.

Writes (next to this script):
    titles.json     -- [{title, name, listLevel}, ...]
    raw_pages.json  -- {"pages": {finalTitle: wikitext}, "norm_map": {from: to}}

Then run parse_wsc.py to produce json/wsc.json + wsc_full.json.
"""
import json, time, re, os, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
UA = "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0"
API = "https://adnd2e.fandom.com/api.php"
LIST_PAGE = "Wizard's Spell Compendium Spell List A-Z"


def api_get(params):
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except Exception as ex:
            print(f"  retry {attempt+1}: {ex}", flush=True)
            time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"failed: {url}")


def extract_titles(wikitext):
    rows = re.findall(
        r"\|\s*'*\[\[\s*([^\]|]+?)\s*\|\s*([^\]]+?)\s*\]\]'*\s*\|\|\s*Level\s*(\d+)",
        wikitext, re.S)
    extra = re.findall(r"\|\s*'*\[\[\s*([^\]|]+?)\s*\]\]'*\s*\|\|\s*Level\s*(\d+)",
                       wikitext, re.S)
    byt = {}
    for t, d, l in rows:
        byt.setdefault(t, {"title": t, "name": d, "listLevel": int(l)})
    for t, l in extra:
        byt.setdefault(t, {"title": t, "name": t, "listLevel": int(l)})
    return list(byt.values())


def main():
    print("Fetching list page...", flush=True)
    lst = api_get({"action": "parse", "page": LIST_PAGE,
                   "prop": "wikitext", "format": "json"})
    titles = extract_titles(lst["parse"]["wikitext"]["*"])
    json.dump(titles, open(os.path.join(HERE, "titles.json"), "w"),
              ensure_ascii=False, indent=0)
    print(f"Extracted {len(titles)} spell titles.", flush=True)

    pages, norm_map = {}, {}
    wanted = [e["title"] for e in titles]
    BATCH = 50
    for i in range(0, len(wanted), BATCH):
        chunk = wanted[i:i + BATCH]
        data = api_get({"action": "query", "prop": "revisions", "rvprop": "content",
                        "rvslots": "main", "format": "json", "redirects": "1",
                        "titles": "|".join(chunk)})
        q = data.get("query", {})
        for m in q.get("normalized", []):
            norm_map[m["from"]] = m["to"]
        for m in q.get("redirects", []):
            norm_map[m["from"]] = m["to"]
        for _, pg in q.get("pages", {}).items():
            revs = pg.get("revisions")
            if revs:
                pages[pg["title"]] = revs[0]["slots"]["main"].get("*", "")
        print(f"  {min(i+BATCH, len(wanted))}/{len(wanted)} fetched "
              f"({len(pages)} pages)", flush=True)
        time.sleep(0.3)

    def resolve(t):
        seen = set()
        while t in norm_map and t not in seen:
            seen.add(t); t = norm_map[t]
        return t

    # red links: try "The <name>" then a search
    missing = [t for t in wanted if resolve(t) not in pages]
    for t in missing:
        cand = "The " + t
        data = api_get({"action": "query", "prop": "revisions", "rvprop": "content",
                        "rvslots": "main", "format": "json", "titles": cand})
        pg = next(iter(data["query"]["pages"].values()))
        if "revisions" not in pg:
            srch = api_get({"action": "query", "list": "search", "format": "json",
                            "srsearch": t, "srlimit": 1})["query"]["search"]
            if not srch:
                print(f"  UNRESOLVED: {t}", flush=True); continue
            cand = srch[0]["title"]
            data = api_get({"action": "query", "prop": "revisions", "rvprop": "content",
                            "rvslots": "main", "format": "json", "titles": cand})
            pg = next(iter(data["query"]["pages"].values()))
        if "revisions" in pg:
            pages[pg["title"]] = pg["revisions"][0]["slots"]["main"].get("*", "")
            norm_map[t] = pg["title"]
            print(f"  recovered {t!r} -> {pg['title']!r}", flush=True)
        time.sleep(0.3)

    json.dump({"pages": pages, "norm_map": norm_map},
              open(os.path.join(HERE, "raw_pages.json"), "w"), ensure_ascii=False)
    still = [t for t in wanted if resolve(t) not in pages]
    print(f"Done. {len(pages)} pages cached. Still unresolved: {len(still)}", flush=True)


if __name__ == "__main__":
    main()
