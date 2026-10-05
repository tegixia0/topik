#!/usr/bin/env python3
"""老师认可的替代答案 → accepted.json（所有打字闪卡判对时都会接受）

  python3 tools/add_accepted.py CARD_ID "替代答案" ["老师说明"] [--commit]
  python3 tools/add_accepted.py --find "韩语或中文"        # 查卡片ID（可多个关键词，空格分隔 = 同时包含）
  python3 tools/add_accepted.py --show CARD_ID             # 看这张卡的标准答案和已认可的写法
  python3 tools/add_accepted.py --list                     # 列出所有已认可的写法
  python3 tools/add_accepted.py --remove CARD_ID "替代答案" [--commit]

卡片ID（和「📋 复制给老师」里的一致）：
  v:<韩语词>            每日/分类单词卡（各天、各分类共用），如 v:고령화
  w54:<id>              写作 53·54 闪卡（?cat=writing-5354），如 w54:p11
  wg:<id>               写作 51·52 语法闪卡（?cat=writing-grammar），如 wg:req-jusigi
  gc:<id>               语法闪卡 中→韩（?cat=grammar-core），如 gc:baram
  gc:<id>#<n>           语法闪卡 句子填空，第 n 句（从 0 起），如 gc:baram#0
  gd:<id>#<n>           语法整句练习（?grammar=drill），如 gd:baram#0

--commit：git add accepted.json → commit → pull --rebase → push（不 force；网络错误会重试）
"""
import argparse
import datetime
import glob
import json
import os
import re
import subprocess
import sys
import time

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REL = "accepted.json"
PATH = os.path.join(SITE, REL)


def jload(rel):
    with open(os.path.join(SITE, rel), encoding="utf-8") as f:
        return json.load(f)


def cards():
    """{id: {"deck","ko","zh","extra"}} for every typing flashcard on the site."""
    out = {}
    for fp in sorted(glob.glob(os.path.join(SITE, "decks", "*.json"))):
        name = os.path.basename(fp)[:-5]
        if name in ("index", "categories"):
            continue
        d = json.load(open(fp, encoding="utf-8"))
        for v in d.get("vocab") or []:
            if not v.get("ko"):
                continue
            e = out.setdefault("v:" + v["ko"], {"deck": "单词", "decks": [], "ko": v["ko"], "zh": v.get("zh", "")})
            e["decks"].append(name)
    if os.path.exists(os.path.join(SITE, "bank", "index.json")):   # 📚 词库：同样用 v:<韩语词>
        for w in jload("bank/index.json")["words"]:
            e = out.setdefault("v:" + w[0], {"deck": "单词", "decks": [], "ko": w[0], "zh": w[1]})
            e["decks"].append("词库")
    for c in jload("writing/w5354.json")["items"]:
        if c.get("card") is not False:
            out["w54:" + c["id"]] = {"deck": "writing-5354", "ko": c["ko"], "zh": c["zh"]}
    g = jload("writing/grammar.json")
    for c in g["patterns"] + g["honor"]:
        out["wg:" + c["id"]] = {"deck": "writing-grammar", "ko": c["p"], "zh": c["zh"]}
    for it in jload("grammar/grammar.json")["items"]:
        out["gc:" + it["id"]] = {"deck": "grammar-core 中→韩", "ko": it["f"], "zh": it["zh"]}
        for i, f in enumerate(it.get("fill") or []):
            out["gc:%s#%d" % (it["id"], i)] = {"deck": "grammar-core 填空", "ko": " / ".join(f["ans"]), "zh": f["zh"], "extra": f["ko"]}
        # 整句练习：prac + 干净例句（与 grammar.js drillsOf 一致）
        seen, drills = set(), []
        for e in (it.get("prac") or []) + (it.get("ex") or []):
            ko, zh = e.get("ko") or "", e.get("zh") or ""
            if not ko or not zh or "…" in ko or "..." in ko or "…" in zh or "..." in zh:
                continue
            if ko in seen:
                continue
            seen.add(ko); drills.append((ko, zh))
        for i, (ko, zh) in enumerate(drills):
            out["gd:%s#%d" % (it["id"], i)] = {"deck": "grammar-drill 整句", "ko": ko, "zh": zh}
    for e in out.values():
        if "decks" in e:
            e["deck"] = "单词（" + ", ".join(e.pop("decks")) + "）"
    return out


def load():
    if not os.path.exists(PATH):
        return {"version": 1, "updated": "", "cards": {}}
    with open(PATH, encoding="utf-8") as f:
        return json.load(f)


def dump(d):
    d["updated"] = datetime.date.today().isoformat()
    d["cards"] = dict(sorted(d["cards"].items()))
    with open(PATH, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
        f.write("\n")


def key(s, fold=False):
    """ignore spaces/punctuation like the site does; fold=True also treats 하였/했、되었/됐 as the same
    (53·54 闪卡判分时视为相同)"""
    s = re.sub(r"[^\w]|_", "", str(s)).lower()
    return s.replace("하였", "했").replace("되었", "됐") if fold else s


def git(*c, retry=1):
    for i in range(retry):
        r = subprocess.run(["git", "-C", SITE] + list(c))
        if r.returncode == 0:
            return
        if i < retry - 1:
            print("git %s failed, retrying in %ds…" % (c[0], 3 * (i + 1)))
            time.sleep(3 * (i + 1))
    sys.exit("git %s failed" % " ".join(c))


def commit(msg):
    git("add", REL)
    if subprocess.run(["git", "-C", SITE, "diff", "--cached", "--quiet"]).returncode == 0:
        print("nothing to commit")
        return
    git("commit", "-qm", msg)
    git("pull", "--rebase", "-q", retry=4)
    git("push", "-q", "origin", "HEAD:main", retry=4)
    print("pushed · live in ~1 min: https://tegixia0.github.io/topik/")


def show(cid, C, d):
    c = C.get(cid, {})
    e = d["cards"].get(cid, {})
    print("%s  [%s]" % (cid, c.get("deck", e.get("deck", "?"))))
    if c.get("extra"):
        print("  题目：" + c["extra"])
    print("  中文：" + c.get("zh", e.get("zh", "")))
    print("  标准答案：" + c.get("ko", e.get("ko", "")))
    for x in e.get("alts", []):
        print("  ✅ " + x["a"] + ("   — " + x["note"] if x.get("note") else ""))


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("card_id", nargs="?")
    p.add_argument("answer", nargs="?")
    p.add_argument("note", nargs="?", default="")
    p.add_argument("--find", metavar="TEXT")
    p.add_argument("--show", metavar="CARD_ID")
    p.add_argument("--list", action="store_true")
    p.add_argument("--remove", nargs=2, metavar=("CARD_ID", "ANSWER"))
    p.add_argument("--force", action="store_true", help="allow a CARD_ID that is not in the current data")
    p.add_argument("--commit", action="store_true")
    o = p.parse_args()
    d = load()
    C = cards()

    if o.find:
        terms = [t for t in o.find.split() if t]
        hits = [(k, c) for k, c in C.items()
                if all(t in (k + c["ko"] + c["zh"] + c.get("extra", "")) or key(t) in key(c["ko"] + c.get("extra", "")) for t in terms)]
        for k, c in hits[:60]:
            n = len(d["cards"].get(k, {}).get("alts", []))
            print("%-26s %s  ｜ %s%s  [%s]" % (k, c["ko"], c["zh"], ("  (已认可 %d)" % n) if n else "", c["deck"]))
        print("— %d 个结果%s" % (len(hits), "（只显示前 60）" if len(hits) > 60 else ""))
        return
    if o.show:
        show(o.show, C, d)
        return
    if o.list:
        for k in d["cards"]:
            show(k, C, d)
        return
    if o.remove:
        cid, ans = o.remove
        e = d["cards"].get(cid)
        if not e or not any(key(x["a"]) == key(ans) for x in e["alts"]):
            sys.exit("没有找到 %s 的写法「%s」" % (cid, ans))
        e["alts"] = [x for x in e["alts"] if key(x["a"]) != key(ans)]
        if not e["alts"]:
            del d["cards"][cid]
        dump(d)
        print("已删除 %s：%s" % (cid, ans))
        if o.commit:
            commit("accepted: 删除 %s「%s」" % (cid, ans))
        return
    if not o.card_id or not o.answer:
        p.print_help()
        sys.exit(1)

    cid, ans, note = o.card_id.strip(), o.answer.strip(), o.note.strip()
    if cid not in C and not o.force:
        near = [k for k in C if cid.split(":")[-1] and cid.split(":")[-1] in k][:8]
        sys.exit("找不到卡片ID %s。用 --find 查一下%s（确定要加就用 --force）" % (cid, "；相近：" + ", ".join(near) if near else ""))
    c = C.get(cid, {})
    fold = cid.startswith("w54:")
    if c and key(ans, fold) in [key(x, fold) for x in re.split(r"\s+/\s+", c["ko"])] + [key(c["ko"], fold)]:
        sys.exit("「%s」就是标准答案（判分时已算对），不用加" % ans)
    e = d["cards"].setdefault(cid, {"deck": c.get("deck", ""), "zh": c.get("zh", ""), "ko": c.get("ko", ""), "alts": []})
    if c:
        e.update(deck=c["deck"], zh=c["zh"], ko=c["ko"])
    for x in e["alts"]:
        if key(x["a"]) == key(ans):
            if note and x.get("note") != note:
                x["note"] = note
                print("已存在，更新说明")
                break
            print("已存在：%s（没有改动）" % x["a"])
            break
    else:
        e["alts"].append({"a": ans, "note": note} if note else {"a": ans})
        print("已添加")
    dump(d)
    show(cid, C, d)
    if o.commit:
        commit("accepted: %s +「%s」" % (cid, ans))


if __name__ == "__main__":
    main()
