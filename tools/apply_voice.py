#!/usr/bin/env python3
"""动词 自/他/被动/使动 标签：把 voice.json（总表）写进所有词汇数据。

voice.json：{"끝내다": {"voice": "他", "pair": [{"ko": "끝나다", "voice": "自"}]}, ...}
  voice ∈ 自（自动词/不及物）| 他（他动词/及物，带 을/를）| 自他（自他两用）| 被动 | 使动
  pair（可选）：对应的另一半（自↔他、主动↔被动/使动），网站在答案/详情里显示「↔ 끝나다（自动）」
  zh（可选，同形异义词）：{"中文意思里的关键字": {"voice":…, "pair":[…]}}，如 먹다 默认「吃」=他，意思含「聋」时=自
只给 pos 含「动词」的词条加（「名词（X하다：动词）」和纯「辅助动词」不加），其它字段一律不动。

python3 tools/apply_voice.py          # 写入 bank/o-*.json bank/c-*.json wordinfo.json decks/*.json categories/*.json
python3 tools/apply_voice.py --check  # 只检查：列出没有标签的动词
"""
import json, os, sys, glob, hashlib
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICES = ("自", "他", "自他", "被动", "使动")
ALIAS = {"自动": "自", "自动词": "自", "不及物": "自", "他动": "他", "他动词": "他", "及物": "他", "自他两用": "自他",
         "被": "被动", "使": "使动", "被动词": "被动", "使动词": "使动"}


def load_voice():
    p = os.path.join(SITE, "voice.json")
    return json.load(open(p, encoding="utf-8")) if os.path.exists(p) else {}


def norm_voice(v):
    v = str(v or "").strip()
    v = ALIAS.get(v, v)
    return v if v in VOICES else ""


def is_verb(pos):
    pos = str(pos or "")
    return "动词" in pos and not pos.startswith("名词") and pos != "辅助动词"


def resolve(m, zh=None):
    """总表词条 + 这张卡的中文意思 → {"voice":…, "pair":[…]}（同形异义词按中文意思选）"""
    for key, alt in (m.get("zh") or {}).items():
        if zh and key in zh:
            m = alt; break
    d = {"voice": m["voice"]}
    if m.get("pair"): d["pair"] = m["pair"]
    return d


def label(ko, pos, VO, zh=None):
    """→ {"voice":…, "pair":[…]} 或 None"""
    if not is_verb(pos) or ko not in VO:
        return None
    return resolve(VO[ko], zh)


def put(entry, lab):
    """在原词条末尾加 voice/pair（不改其它字段）。返回是否有变化。"""
    before = (entry.get("voice"), entry.get("pair"))
    entry.pop("voice", None); entry.pop("pair", None)
    if lab:
        entry["voice"] = lab["voice"]
        if lab.get("pair"): entry["pair"] = lab["pair"]
    return before != (entry.get("voice"), entry.get("pair"))


def main(argv):
    check = "--check" in argv
    VO = load_voice()
    bad = {k: m for k, m in VO.items() if m.get("voice") not in VOICES or any(a.get("voice") not in VOICES for a in (m.get("zh") or {}).values())}
    if bad: sys.exit("voice.json: bad voice %r" % bad)
    nolab, stats, changed_files = set(), {}, []
    def dump_compact(p, d): json.dump(d, open(p, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    def dump_indent(p, d):
        with open(p, "w", encoding="utf-8") as f:
            json.dump(d, f, ensure_ascii=False, indent=1); f.write("\n")
    # 词库分块里没有中文意思：从 bank/index.json 取（同形异义词按意思选标签用）
    ZH = {w[0]: w[1] for w in json.load(open(os.path.join(SITE, "bank", "index.json"), encoding="utf-8"))["words"]}
    ZH_DECK = {}   # wordinfo.json 也没有中文意思：优先用每日/分类题库里的意思（wordinfo 的内容来自题库）
    for p in glob.glob(os.path.join(SITE, "decks", "*.json")) + glob.glob(os.path.join(SITE, "categories", "*.json")):
        d = json.load(open(p, encoding="utf-8"))
        if isinstance(d, dict):
            for v in d.get("vocab") or []:
                if isinstance(v, dict) and v.get("zh"): ZH_DECK.setdefault(v.get("ko"), v["zh"])
    jobs = []
    for p in sorted(glob.glob(os.path.join(SITE, "bank", "o-*.json")) + glob.glob(os.path.join(SITE, "bank", "c-*.json"))):
        jobs.append((p, "dict", dump_compact))
    jobs.append((os.path.join(SITE, "wordinfo.json"), "dict", dump_indent))
    for p in sorted(glob.glob(os.path.join(SITE, "decks", "*.json")) + glob.glob(os.path.join(SITE, "categories", "*.json"))):
        jobs.append((p, "vocab", dump_indent))
    for p, kind, dumper in jobs:
        d = json.load(open(p, encoding="utf-8"))
        if kind == "vocab" and not (isinstance(d, dict) and isinstance(d.get("vocab"), list)):
            continue
        items = list(d.items()) if kind == "dict" else [(v.get("ko"), v) for v in d["vocab"] if isinstance(v, dict)]
        ch = False
        for ko, e in items:
            zh = e.get("zh") or (ZH_DECK.get(ko) if p.endswith("wordinfo.json") else None) or ZH.get(ko) or ZH_DECK.get(ko)
            lab = label(ko, e.get("pos"), VO, zh)
            if is_verb(e.get("pos")) and not lab: nolab.add(ko)
            if lab: stats[lab["voice"]] = stats.get(lab["voice"], 0) + 1
            if not check: ch = put(e, lab) or ch
        if ch:
            dumper(p, d); changed_files.append(os.path.relpath(p, SITE))
    if not check and any(f.startswith("bank/") for f in changed_files):
        # 词库分块的缓存版本号（bank.js 用 ?v=build 请求分块）
        ip = os.path.join(SITE, "bank", "index.json"); idx = json.load(open(ip, encoding="utf-8"))
        hh = hashlib.md5()
        for f in sorted(glob.glob(os.path.join(SITE, "bank", "o-*.json")) + glob.glob(os.path.join(SITE, "bank", "c-*.json"))):
            hh.update(open(f, "rb").read())
        idx["build"] = hh.hexdigest()[:10]
        json.dump(idx, open(ip, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("labelled entries by voice (all files):", stats)
    print("changed files:", len(changed_files))
    if nolab: print("WARNING: verbs without a voice label (add to voice.json):", " ".join(sorted(nolab)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
