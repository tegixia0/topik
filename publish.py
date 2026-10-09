#!/usr/bin/env python3
"""Publish a daily TOPIK flashcard deck to the GitHub Pages site.

Usage:
  python3 publish.py /workspace/topik-flashcards-2026-09-30.html   # daily HTML
  python3 publish.py some-deck.json                                 # or a deck JSON
  python3 publish.py a.html b.html ... [--no-push] [--rebuild-index] [--prefer-html]
  python3 publish.py decks/2026-09-2*.json --no-push                # re-enrich existing decks

Writes decks/YYYY-MM-DD.json, updates decks/index.json, then git commit + push.

Decks are vocab-focused: the site's 闪卡 only uses "vocab". A <script id="grammar-data">
block is optional; if present it is kept in the JSON but ignored by the site.

Word enrichment (词性/记忆法/易错/近义/反义) per vocab item:
  pos, hanja, mem, tip, syn=[{"ko","zh"}], ant=[{"ko","zh"}]
Sources: the item itself (daily HTML / deck JSON) and wordinfo.json (keyed by ko).
Default: existing non-empty wordinfo.json values win (keeps repeated words consistent);
fields the HTML provides for new words / empty fields are added to wordinfo.json.
--prefer-html: HTML values override and overwrite wordinfo.json.

Verb voice (动词 自/他/自他/被动/使动 + optional pair ↔ counterpart): voice.json is the master table
(see tools/apply_voice.py). Every vocab item whose pos contains 动词 gets "voice" (and "pair") from
voice.json; a voice given in the HTML for a verb that voice.json doesn't know yet is added to voice.json.
Verbs with no voice anywhere are listed as a WARNING.
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
WORDINFO = os.path.join(SITE, "wordinfo.json")
INFO_KEYS = ("pos", "hanja", "mem", "tip", "syn", "ant", "voice", "pair")
VOICE_JSON = os.path.join(SITE, "voice.json")
sys.path.insert(0, os.path.join(SITE, "tools"))
from apply_voice import load_voice, norm_voice, is_verb, resolve  # noqa: E402
LIST_KEYS = ("syn", "ant")


def _pair(x):
    """Accept {"ko","zh"} | ["ko","zh"] | "ko（zh）" / "ko(zh)" / "ko zh" / "ko：zh" → {"ko","zh"}."""
    if isinstance(x, dict):
        ko, zh = str(x.get("ko", "")).strip(), str(x.get("zh", "")).strip()
    elif isinstance(x, (list, tuple)) and x:
        ko, zh = str(x[0]).strip(), (str(x[1]).strip() if len(x) > 1 else "")
    else:
        t = str(x).strip()
        m = (re.match(r"^(.+?)\s*[（(]\s*(.*?)\s*[）)]$", t) or re.match(r"^(.+?)\s*[:：=]\s*(.+)$", t)
             or re.match(r"^([\uac00-\ud7a3][\uac00-\ud7a3 ]*?)\s+(\S.*)$", t))
        ko, zh = (m.group(1).strip(), m.group(2).strip()) if m else (t, "")
    return {"ko": ko, "zh": zh} if ko else None


def norm_list(v):
    if v is None or v == "":
        return []
    if isinstance(v, str):
        v = [p for p in re.split(r"\s*[;；|]\s*|\s*[,，、]\s*(?=[\uac00-\ud7a3])", v) if p.strip()]
    if isinstance(v, dict):
        v = [v]
    return [p for p in (_pair(x) for x in v) if p]


def info_of(it):
    """Extract normalized enrichment fields present (non-empty) on an item."""
    d = {}
    for k in INFO_KEYS:
        v = it.get(k)
        if k == "voice":
            if norm_voice(v):
                d[k] = norm_voice(v)
        elif k == "pair":
            lst = [{"ko": str(x.get("ko", "")).strip(), "voice": norm_voice(x.get("voice"))}
                   for x in (v if isinstance(v, list) else [v] if isinstance(v, dict) else []) if isinstance(x, dict)]
            lst = [x for x in lst if x["ko"] and x["voice"]]
            if lst:
                d[k] = lst
        elif k in LIST_KEYS:
            if v:
                lst = norm_list(v)
                if lst:
                    d[k] = lst
        elif v is not None and str(v).strip():
            d[k] = str(v).strip()
    return d


def load_wordinfo():
    try:
        return json.load(open(WORDINFO, encoding="utf-8"))
    except FileNotFoundError:
        return {}


def save_wordinfo(wi):
    with open(WORDINFO, "w", encoding="utf-8") as f:
        json.dump(dict(sorted(wi.items())), f, ensure_ascii=False, indent=1)
        f.write("\n")


def save_voice(vo):
    with open(VOICE_JSON, "w", encoding="utf-8") as f:
        items = sorted(vo.items())
        f.write("{\n")
        for i, (k, m) in enumerate(items):
            f.write(" " + json.dumps(k, ensure_ascii=False) + ": " + json.dumps(m, ensure_ascii=False)
                    + ("," if i < len(items) - 1 else "") + "\n")
        f.write("}\n")


def enrich(deck, wi, prefer_html=False, vo=None, no_voice=None):
    """Merge deck vocab <-> wordinfo. Returns (list of words missing pos/mem, changed?)."""
    missing, changed = [], False
    vo = {} if vo is None else vo
    for v in deck["vocab"]:
        own, stored = info_of(v), wi.get(v["ko"], {})
        merged = dict(own, **stored) if not prefer_html else dict(stored, **own)
        # 动词 自/他/被动/使动：voice.json 为准；HTML 给了而总表没有的 → 记进总表
        if is_verb(merged.get("pos")):
            if v["ko"] not in vo and own.get("voice"):
                vo[v["ko"]] = {"voice": own["voice"], **({"pair": own["pair"]} if own.get("pair") else {})}
                vo["__changed__"] = True
            if v["ko"] in vo:
                lab = resolve(vo[v["ko"]], v.get("zh"))
                merged["voice"] = lab["voice"]
                merged.pop("pair", None)
                if lab.get("pair"):
                    merged["pair"] = lab["pair"]
            elif no_voice is not None and not merged.get("voice") and merged.get("pos") != "辅助动词":
                no_voice.setdefault(v["ko"], deck["date"])
        else:
            merged.pop("voice", None); merged.pop("pair", None)
        for k in INFO_KEYS:  # write back to the deck in a stable order
            v.pop(k, None)
        for k in INFO_KEYS:
            if k in merged:
                v[k] = merged[k]
            elif k in LIST_KEYS and ("pos" in merged):
                v[k] = []
        new = {k: v[k] for k in INFO_KEYS if k in v}
        if new and new != stored:
            wi[v["ko"]] = new
            changed = True
        if not v.get("pos") or not v.get("mem"):
            missing.append(v["ko"])
    return missing, changed


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
        if kind == "vocab":
            d.update(info_of(it))
        for k, v in it.items():  # keep any extra fields
            if k not in d and k not in INFO_KEYS and isinstance(v, (str, int, float)) and v != "":
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
        vocab = _script_json(src, "vocab-data")
        # grammar-data is optional: the site's 闪卡 is vocab-only now (grammar lives in the 🧩 语法 module)
        try:
            grammar = _script_json(src, "grammar-data")
        except ValueError:
            grammar = []
    if not date or not DATE_RE.fullmatch(date):
        raise ValueError("no YYYY-MM-DD date found for %s" % path)
    deck = {"date": date, "theme": theme,
            "vocab": _clean(vocab, "vocab"), "grammar": _clean(grammar, "grammar")}
    if not deck["vocab"]:
        raise ValueError("deck %s has no vocab" % path)
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
    prefer_html = "--prefer-html" in argv
    wi = load_wordinfo()
    vo = load_voice()
    all_missing, no_voice = {}, {}
    paths = [a for a in argv if not a.startswith("--")]
    if not paths and "--rebuild-index" not in argv:
        print(__doc__)
        return 2
    dates, failed = [], []
    for p in paths:
        try:
            deck = load_deck(p)
            miss, _ = enrich(deck, wi, prefer_html, vo, no_voice)
            for w in miss:
                all_missing.setdefault(w, deck["date"])
            write_deck(deck)
            dates.append(deck["date"])
            print("OK   %s  vocab=%d grammar=%d  theme=%s" % (deck["date"], len(deck["vocab"]),
                                                            len(deck["grammar"]), deck["theme"]))
        except Exception as e:  # noqa
            failed.append(p)
            print("FAIL %s: %s" % (p, e), file=sys.stderr)
    rebuild_index()
    save_wordinfo(wi)
    if vo.pop("__changed__", False):
        save_voice(vo)
    if no_voice:
        print("WARNING: %d verb(s) without 自/他/被动/使动 label — add them to voice.json "
              "(then python3 tools/apply_voice.py): %s" % (len(no_voice), " ".join(no_voice)), file=sys.stderr)
    if all_missing:
        print("WARNING: %d word(s) missing 词性/记忆法 (add pos/mem in the HTML or wordinfo.json):"
              % len(all_missing), file=sys.stderr)
        for w, d in all_missing.items():
            print("  - %s  (%s)" % (w, d), file=sys.stderr)
    if push:
        git("add", "-A", "decks", "wordinfo.json", "voice.json")
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
