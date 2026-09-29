#!/usr/bin/env python3
"""Publish a daily TOPIK flashcard deck to the GitHub Pages site.

Usage:
  python3 publish.py /workspace/topik-flashcards-2026-09-30.html   # daily HTML
  python3 publish.py some-deck.json                                 # or a deck JSON
  python3 publish.py a.html b.html ... [--no-push] [--rebuild-index]

Writes decks/YYYY-MM-DD.json, updates decks/index.json, then git commit + push.
"""
import html as htmlmod
import json
import os
import re
import subprocess
import sys

SITE = os.path.dirname(os.path.abspath(__file__))
DECKS = os.path.join(SITE, "decks")
DATE_RE = re.compile(r"(\d{4}-\d{2}-\d{2})")


def _script_json(src, sid):
    m = re.search(r'<script[^>]*\bid=["\']%s["\'][^>]*>(.*?)</script>' % sid, src, re.S | re.I)
    if m:
        return json.loads(m.group(1).strip())
    # fallback: `const VOCAB = [...];` style inline arrays
    name = {"vocab-data": "VOCAB", "grammar-data": "GRAMMAR"}[sid]
    m = re.search(r"\b%s\s*=\s*(\[.*?\])\s*;" % name, src, re.S)
    if m:
        return json.loads(m.group(1))
    raise ValueError("could not find %s data" % sid)


def _theme(src):
    m = re.search(r'<div class="sub">(.*?)</div>', src, re.S)
    if not m:
        return ""
    sub = htmlmod.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip()
    m2 = re.match(r"今日[：:]\s*(.*?)\s*(?:·|$)", sub)
    return m2.group(1).strip() if m2 else ""


def _clean(items, kind):
    out = []
    for it in items:
        if not isinstance(it, dict):
            continue
        ko, zh = str(it.get("ko", "")).strip(), str(it.get("zh", "")).strip()
        if not ko or not zh:
            continue
        d = {"ko": ko, "zh": zh}
        keys = ("hint", "ex") if kind == "vocab" else ("point",)
        for k in keys:
            if it.get(k):
                d[k] = str(it[k]).strip()
        for k, v in it.items():  # keep any extra fields
            if k not in d and isinstance(v, (str, int, float)) and v != "":
                d[k] = v
        out.append(d)
    return out


def load_deck(path):
    src = open(path, encoding="utf-8").read()
    m = DATE_RE.search(os.path.basename(path))
    if path.lower().endswith(".json"):
        data = json.loads(src)
        date = data.get("date") or (m and m.group(1))
        theme = data.get("theme", "")
        vocab, grammar = data.get("vocab", []), data.get("grammar", [])
    else:
        date = m and m.group(1)
        theme = _theme(src)
        vocab, grammar = _script_json(src, "vocab-data"), _script_json(src, "grammar-data")
    if not date or not DATE_RE.fullmatch(date):
        raise ValueError("no YYYY-MM-DD date found for %s" % path)
    deck = {"date": date, "theme": theme,
            "vocab": _clean(vocab, "vocab"), "grammar": _clean(grammar, "grammar")}
    if not deck["vocab"] and not deck["grammar"]:
        raise ValueError("deck %s is empty" % path)
    return deck


def write_deck(deck):
    os.makedirs(DECKS, exist_ok=True)
    p = os.path.join(DECKS, deck["date"] + ".json")
    with open(p, "w", encoding="utf-8") as f:
        json.dump(deck, f, ensure_ascii=False, indent=1)
        f.write("\n")
    return p


def rebuild_index():
    entries = []
    for fn in os.listdir(DECKS):
        if fn == "index.json" or not re.fullmatch(r"\d{4}-\d{2}-\d{2}\.json", fn):
            continue
        d = json.load(open(os.path.join(DECKS, fn), encoding="utf-8"))
        entries.append({"date": d["date"], "theme": d.get("theme", ""),
                        "vocab": len(d.get("vocab", [])), "grammar": len(d.get("grammar", []))})
    entries.sort(key=lambda e: e["date"], reverse=True)
    with open(os.path.join(DECKS, "index.json"), "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=1)
        f.write("\n")
    return entries


def git(*args):
    return subprocess.run(["git", "-C", SITE] + list(args), check=True,
                          capture_output=True, text=True).stdout


def main(argv):
    push = "--no-push" not in argv
    paths = [a for a in argv if not a.startswith("--")]
    if not paths and "--rebuild-index" not in argv:
        print(__doc__)
        return 2
    dates, failed = [], []
    for p in paths:
        try:
            deck = load_deck(p)
            write_deck(deck)
            dates.append(deck["date"])
            print("OK   %s  vocab=%d grammar=%d  theme=%s" % (deck["date"], len(deck["vocab"]),
                                                            len(deck["grammar"]), deck["theme"]))
        except Exception as e:  # noqa
            failed.append(p)
            print("FAIL %s: %s" % (p, e), file=sys.stderr)
    rebuild_index()
    if push:
        git("add", "-A", "decks")
        if subprocess.run(["git", "-C", SITE, "diff", "--cached", "--quiet"]).returncode != 0:
            msg = "Add deck " + ", ".join(dates) if dates else "Update deck index"
            git("commit", "-m", msg)
            try:
                git("pull", "--rebase", "-q", "origin", "main")
            except subprocess.CalledProcessError:
                pass
            git("push", "-q", "origin", "HEAD:main")
            print("Pushed. Live in ~1 min: https://tegixia0.github.io/topik/")
        else:
            print("No changes to publish.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
