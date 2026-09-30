#!/usr/bin/env python3
"""Create / update a category deck (分类词库) on the TOPIK site.

Usage:
  python3 add_category.py categories/taste.json            # build + commit + push
  python3 add_category.py categories/*.json --no-push       # build only
  python3 add_category.py --rebuild-index                   # just rebuild decks/categories.json

Input JSON (categories/<slug>.json):
  {"slug": "taste", "name": "味道", "emoji": "😋", "order": 1, "desc": "…", "notion": "味道",
   "vocab":   [{"ko","zh","pos","hint","ex","exzh","hanja","mem","tip","syn":[{"ko","zh"}],"ant":[…]}],
   "grammar": [{"ko","zh","point"}]}          # grammar optional

Output: decks/cat-<slug>.json (same shape as daily decks, "date" = "cat-<slug>"),
        decks/categories.json (index shown in the site's 分类 group),
        wordinfo.json (词性/记忆法/近反义词 merged, same rules as publish.py).
Deep link: https://tegixia0.github.io/topik/?cat=<slug>   (optional &mode=zh2ko|ko2zh|gko2zh|gzh2ko)
"""
import json
import os
import re
import subprocess
import sys

import publish as P

SLUG_RE = re.compile(r"[a-z0-9][a-z0-9-]*")


def load_cat(path):
    d = json.load(open(path, encoding="utf-8"))
    slug = str(d.get("slug") or os.path.splitext(os.path.basename(path))[0]).strip().lower()
    if not SLUG_RE.fullmatch(slug):
        raise ValueError("bad slug %r (use a-z, 0-9, -)" % slug)
    vocab = P._clean(d.get("vocab", []), "vocab")
    seen, uniq = set(), []
    for v in vocab:  # drop duplicate words inside one category
        if v["ko"] in seen:
            continue
        seen.add(v["ko"])
        uniq.append(v)
    deck = {"date": "cat-" + slug, "slug": slug, "name": d.get("name") or slug,
            "emoji": d.get("emoji", ""), "order": d.get("order", 99), "theme": d.get("name") or slug, "desc": d.get("desc", ""),
            "vocab": uniq, "grammar": P._clean(d.get("grammar", []), "grammar")}
    if not deck["vocab"] and not deck["grammar"]:
        raise ValueError("category %s is empty" % slug)
    return deck


def rebuild_cat_index():
    out = []
    for fn in sorted(os.listdir(P.DECKS)):
        m = re.fullmatch(r"cat-([a-z0-9-]+)\.json", fn)
        if not m:
            continue
        d = json.load(open(os.path.join(P.DECKS, fn), encoding="utf-8"))
        out.append({"id": d["date"], "slug": m.group(1), "name": d.get("name", m.group(1)),
                    "emoji": d.get("emoji", ""), "desc": d.get("desc", ""), "order": d.get("order", 99),
                    "vocab": len(d.get("vocab", [])), "grammar": len(d.get("grammar", []))})
    out.sort(key=lambda c: (c["order"], c["slug"]))
    with open(os.path.join(P.DECKS, "categories.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    return out


def main(argv):
    push = "--no-push" not in argv
    prefer = "--prefer-html" in argv  # category file values override wordinfo.json
    paths = [a for a in argv if not a.startswith("--")]
    if not paths and "--rebuild-index" not in argv:
        print(__doc__)
        return 2
    wi, failed, done = P.load_wordinfo(), [], []
    for p in paths:
        try:
            deck = load_cat(p)
            if prefer:  # an explicit empty syn/ant list in the category file clears the stored one
                raw = {v.get("ko"): v for v in json.load(open(p, encoding="utf-8")).get("vocab", [])}
                for v in deck["vocab"]:
                    for k in P.LIST_KEYS:
                        if k in raw.get(v["ko"], {}) and not raw[v["ko"]][k] and v["ko"] in wi:
                            wi[v["ko"]][k] = []
            miss, _ = P.enrich(deck, wi, prefer)
            P.write_deck(deck)
            done.append(deck["slug"])
            print("OK   cat-%s  vocab=%d grammar=%d  %s" % (deck["slug"], len(deck["vocab"]),
                                                          len(deck["grammar"]), deck["name"]))
            if miss:
                print("  WARNING missing 词性/记忆法: " + ", ".join(miss), file=sys.stderr)
        except Exception as e:  # noqa
            failed.append(p)
            print("FAIL %s: %s" % (p, e), file=sys.stderr)
    idx = rebuild_cat_index()
    P.save_wordinfo(wi)
    for c in idx:
        print("  %s %s  https://tegixia0.github.io/topik/?cat=%s" % (c["emoji"], c["name"], c["slug"]))
    if push:
        P.git("add", "-A", "decks", "wordinfo.json", "categories")
        if subprocess.run(["git", "-C", P.SITE, "diff", "--cached", "--quiet"]).returncode != 0:
            P.git("commit", "-m", "Update category deck " + ", ".join(done or ["index"]))
            try:
                P.git("pull", "--rebase", "-q", "origin", "main")
            except subprocess.CalledProcessError:
                pass
            P.git("push", "-q", "origin", "HEAD:main")
            print("Pushed. Live in ~1 min.")
        else:
            print("No changes to publish.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
