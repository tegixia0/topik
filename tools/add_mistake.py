#!/usr/bin/env python3
"""Append a graded 写作 attempt to writing/mylog.json (my personal mistake log, shown on the site).

Usage:
  python3 tools/add_mistake.py ROUND QNO BLANK "her answer" "错因" "正确写法/下次怎么做" TAGS [options]
    ROUND  e.g. 35        QNO  51 | 52        BLANK  a | b | ㉠ | ㉡
    TAGS   comma-separated type ids or Chinese names, e.g. "obj,ctx" or "宾语助词,没扣题"
  options:
    --date YYYY-MM-DD   default: today (Asia/Shanghai box clock)
    --try N             attempt number; default = previous attempts on this blank + 1
    --ok                record a correct attempt (answer optional; cause/fix/tags may be "")
    --minor             a small issue (shown, but counted separately as 小问题)
    --commit            git pull --rebase, commit writing/mylog.json and push (never forces)
  python3 tools/add_mistake.py --types                         # list error types
  python3 tools/add_mistake.py --new-type ID "名称" "下次怎么做（一句话规则）"
Examples:
  python3 tools/add_mistake.py 35 51 a "물건들이 드리려고 합니다" "宾语用了 이" "물건들을 드리려고 합니다" obj
  python3 tools/add_mistake.py 36 51 b "" "" "" "" --ok
"""
import datetime, json, os, subprocess, sys

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG = os.path.join(SITE, "writing", "mylog.json")
QJSON = os.path.join(SITE, "writing", "questions.json")


def load():
    if os.path.exists(LOG):
        return json.load(open(LOG, encoding="utf-8"))
    return {"version": 1, "updated": "", "types": {}, "entries": []}


def save(d):
    d["updated"] = datetime.date.today().isoformat()
    d["entries"].sort(key=lambda e: (e["date"], e["q"], e["k"], e["try"]))
    with open(LOG, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
        f.write("\n")


def resolve_tags(d, tags):
    out = []
    for t in [x.strip() for x in tags.replace("，", ",").split(",") if x.strip()]:
        if t in d["types"]:
            out.append(t); continue
        hit = [k for k, v in d["types"].items() if t == v["name"] or t == v["name"].split()[0]]
        if not hit:
            hit = [k for k, v in d["types"].items() if t in v["name"]]
        if len(hit) == 1:
            out.append(hit[0]); continue
        sys.exit("unknown/ambiguous tag %r. Known types:\n%s\nAdd one with --new-type ID NAME RULE"
                 % (t, "\n".join("  %-10s %s" % (k, v["name"]) for k, v in d["types"].items())))
    return out


def add(d, rnd, qno, blank, ans, cause, fix, tags, date=None, tr=None, ok=False, minor=False):
    qid = "%s-%s" % (rnd, qno)
    ids = {q["id"] for q in json.load(open(QJSON, encoding="utf-8"))["questions"]}
    if qid not in ids:
        sys.exit("question %s not in writing/questions.json" % qid)
    k = {"a": "a", "b": "b", "㉠": "a", "㉡": "b"}.get(blank)
    if not k:
        sys.exit("BLANK must be a/b/㉠/㉡")
    if tr is None:
        tr = 1 + max([e["try"] for e in d["entries"] if e["q"] == qid and e["k"] == k] or [0])
    e = {"q": qid, "k": k, "try": int(tr), "date": date or datetime.date.today().isoformat(), "ok": bool(ok),
         "ans": ans, "cause": cause, "fix": fix, "tags": resolve_tags(d, tags) if not ok else []}
    if minor:
        e["minor"] = True
    d["entries"].append(e)
    return e


def main(a):
    d = load()
    if not a or a[0] in ("-h", "--help"):
        print(__doc__); return
    if a[0] == "--types":
        for k, v in d["types"].items():
            n = sum(1 for e in d["entries"] if k in e["tags"] and not e["ok"])
            print("%-10s %-18s %2d  %s" % (k, v["name"], n, v["rule"]))
        return
    if a[0] == "--new-type":
        _, tid, name, rule = a[:4]
        d["types"][tid] = {"name": name, "rule": rule}; save(d); print("added type", tid); return
    flags = {x for x in a if x in ("--ok", "--minor", "--commit")}
    opt = {}
    rest = []
    it = iter([x for x in a if x not in flags])
    for x in it:
        if x in ("--date", "--try"):
            opt[x[2:]] = next(it)
        else:
            rest.append(x)
    if len(rest) != 7:
        sys.exit("need 7 positional args: ROUND QNO BLANK ANSWER CAUSE FIX TAGS (see --help)")
    e = add(d, *rest, date=opt.get("date"), tr=opt.get("try"), ok="--ok" in flags, minor="--minor" in flags)
    save(d)
    wrong = sum(1 for x in d["entries"] if x["q"] == e["q"] and x["k"] == e["k"] and not x["ok"])
    print("OK %s %s 第%d次 %s  (this blank wrong %d×)" % (e["q"], "㉠㉡"[e["k"] == "b"], e["try"], "✓" if e["ok"] else "✗ " + ",".join(e["tags"]), wrong))
    if "--commit" in flags:
        g = lambda *c: subprocess.check_call(["git", "-C", SITE] + list(c))
        g("add", "writing/mylog.json")
        g("commit", "-qm", "写作易错记录 %s %s" % (e["q"], e["date"]))
        g("pull", "--rebase", "-q")
        g("push", "-q", "origin", "HEAD:main")
        print("pushed")


if __name__ == "__main__":
    main(sys.argv[1:])
