#!/usr/bin/env python3
"""每日可下载闪卡 HTML 生成器（模板：tools/flashcard_template.html）。

  python3 tools/build_flashcards.py vocab.json --date 2026-10-10 --theme "住房／不动产与居住" [-o out.html]
  python3 tools/build_flashcards.py /workspace/topik-flashcards-2026-10-09.html     # 旧 HTML → 用新模板重新生成（原地覆盖）

vocab.json：单词数组，或 {"theme":…, "vocab":[…]}；字段同 README「每日 HTML 的数据格式」。
动词自动补 voice（自/他/自他/被动/使动）和 pair（对应词），数据来自 voice.json；
不在 voice.json 里的动词会打 WARNING —— 请把它加进 voice.json（或直接在单词里写 "voice"）。
生成的 HTML 在 中→韩 题目上显示「动词·他动」小标签，答案里显示说明和「↔ 끝나다（自动）」。
然后照常：python3 publish.py <生成的 HTML>
"""
import argparse, html, json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from apply_voice import load_voice, norm_voice, is_verb, resolve  # noqa: E402

TEMPLATE = os.path.join(HERE, "flashcard_template.html")


def from_html(path):
    src = open(path, encoding="utf-8").read()
    m = re.search(r'<script[^>]*\bid=["\']vocab-data["\'][^>]*>(.*?)</script>', src, re.S | re.I)
    if not m: sys.exit("no vocab-data in %s" % path)
    vocab = json.loads(m.group(1).strip())
    t = re.search(r'<div class="sub">(.*?)</div>', src, re.S)
    sub = html.unescape(re.sub(r"<[^>]+>", "", t.group(1))).strip() if t else ""
    t2 = re.match(r"今日[：:]\s*(.*?)\s*(?:·|$)", sub)
    return vocab, (t2.group(1).strip() if t2 else "")


def add_voice(vocab, vo):
    missing = []
    for v in vocab:
        if not isinstance(v, dict): continue
        if not is_verb(v.get("pos")):
            continue
        ko = v.get("ko", "")
        if ko in vo:
            lab = resolve(vo[ko], v.get("zh"))
            v["voice"] = lab["voice"]
            v.pop("pair", None)
            if lab.get("pair"): v["pair"] = lab["pair"]
        elif norm_voice(v.get("voice")):
            v["voice"] = norm_voice(v["voice"])
        else:
            missing.append(ko)
    return missing


def render(vocab, theme):
    tpl = open(TEMPLATE, encoding="utf-8").read()
    data = json.dumps(vocab, ensure_ascii=False).replace("</", "<\\/")
    return tpl.replace("__THEME__", html.escape(theme or "")).replace("__VOCAB_JSON__", data)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src"); ap.add_argument("--date"); ap.add_argument("--theme"); ap.add_argument("-o", "--out")
    a = ap.parse_args()
    if a.src.lower().endswith(".html"):
        vocab, theme = from_html(a.src); out = a.out or a.src
    else:
        d = json.load(open(a.src, encoding="utf-8"))
        vocab = d.get("vocab", []) if isinstance(d, dict) else d
        theme = d.get("theme", "") if isinstance(d, dict) else ""
        date = a.date or (d.get("date") if isinstance(d, dict) else None)
        if not a.out and not date: sys.exit("--date or -o is required")
        out = a.out or os.path.join("/workspace", "topik-flashcards-%s.html" % date)
    theme = a.theme or theme
    missing = add_voice(vocab, load_voice())
    open(out, "w", encoding="utf-8").write(render(vocab, theme))
    nv = sum(1 for v in vocab if isinstance(v, dict) and v.get("voice"))
    print("wrote %s  (%d words, %d verbs labelled)" % (out, len(vocab), nv))
    if missing:
        print("WARNING: verbs without 自/他/被动/使动 label (add to voice.json): " + " ".join(missing), file=sys.stderr)


if __name__ == "__main__":
    main()
