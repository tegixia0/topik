#!/usr/bin/env python3
"""Append a graded 写作 53/54 essay attempt to writing/essaylog.json (shown on the site under 真题 → 📚 我之前的作文).

Usage:
  python3 tools/add_essay.py attempt.json [--commit]          # JSON file (or "-" for stdin), see README
  python3 tools/add_essay.py --q 35-53 --score "约15–18/30" --essay-file essay.txt \\
        --error "필요한다고|필요하다고|形容词引用用 -다고|形容词-ㄴ다" --error "…" \\
        --rewrite-file rewrite.txt --rule "规则1" --rule "规则2" [--date YYYY-MM-DD] [--try N] [--commit]
      --essay / --rewrite TEXT can be used instead of the *-file options.
      --error "WRONG|RIGHT|错因|TAG1,TAG2"  (repeatable; tags comma-separated)
  python3 tools/add_essay.py --list                            # all attempts
  python3 tools/add_essay.py --tags                            # tag counts + rules
  python3 tools/add_essay.py --tag-rule TAG "一句话规则"         # set/replace the rule shown for a tag
Options:
  --date   default today (box clock, Asia/Shanghai)
  --try    default = previous attempts on this question + 1
  --commit git add + commit writing/essaylog.json, git pull --rebase, push (never forces; retries network errors)
JSON keys: q (or id), date, try, score, essay, errors[{wrong,right,cause,tags}], rewrite, rules[].
  Chinese aliases accepted: 主要错误 / 改写示范 / 规则 / 错因 / tag (string, comma-separated).
"""
import argparse, datetime, json, os, subprocess, sys, time

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG = os.path.join(SITE, "writing", "essaylog.json")
QJSON = os.path.join(SITE, "writing", "w5354.json")
REL = "writing/essaylog.json"


def load():
    if os.path.exists(LOG):
        return json.load(open(LOG, encoding="utf-8"))
    return {"version": 1, "updated": "", "tags": {}, "attempts": {}}


def save(d):
    d["updated"] = datetime.date.today().isoformat()
    d["attempts"] = {k: sorted(v, key=lambda a: a["try"]) for k, v in sorted(d["attempts"].items(), key=lambda kv: (int(kv[0].split("-")[0]) if kv[0].split("-")[0].isdigit() else 0, kv[0]))}
    with open(LOG, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
        f.write("\n")


def split_tags(t):
    if isinstance(t, list):
        return [x.strip() for x in t if str(x).strip()]
    return [x.strip() for x in str(t or "").replace("，", ",").split(",") if x.strip()]


def norm_error(e):
    if isinstance(e, str):
        p = [x.strip() for x in e.split("|")]
        if len(p) < 3:
            sys.exit("--error needs WRONG|RIGHT|错因[|TAGS]: %r" % e)
        p += [""] * (4 - len(p))
        e = {"wrong": p[0], "right": p[1], "cause": p[2], "tags": p[3]}
    out = {"wrong": e.get("wrong", ""), "right": e.get("right", ""), "cause": e.get("cause", e.get("错因", "")),
           "tags": split_tags(e.get("tags", e.get("tag", "")))}
    if not out["wrong"] and not out["right"]:
        sys.exit("error item needs wrong/right: %r" % e)
    return out


def norm(a):
    qid = a.get("q") or a.get("id")
    rules = a.get("rules", a.get("规则", []))
    if isinstance(rules, str):
        rules = [x.strip() for x in rules.replace("；", ";").split(";") if x.strip()]
    return {"q": qid, "date": a.get("date") or datetime.date.today().isoformat(), "try": a.get("try"),
            "score": a.get("score", ""), "essay": (a.get("essay") or "").strip(),
            "errors": [norm_error(e) for e in a.get("errors", a.get("主要错误", []))],
            "rewrite": (a.get("rewrite", a.get("改写示范", "")) or "").strip(), "rules": rules}


def add(d, a):
    a = norm(a)
    qid = a.pop("q")
    ids = {q["id"] for q in json.load(open(QJSON, encoding="utf-8"))["questions"]}
    if qid not in ids:
        sys.exit("question %r not in writing/w5354.json (ids look like 35-53, 102-54)" % qid)
    try:
        datetime.date.fromisoformat(a["date"])
    except ValueError:
        sys.exit("bad date %r (YYYY-MM-DD)" % a["date"])
    if not a["essay"]:
        sys.exit("essay text is empty")
    L = d["attempts"].setdefault(qid, [])
    a["try"] = int(a["try"]) if a["try"] else 1 + max([x["try"] for x in L] or [0])
    if any(x["try"] == a["try"] for x in L):
        sys.exit("%s already has try %d (use --try or omit it)" % (qid, a["try"]))
    L.append(a)
    new = sorted({t for e in a["errors"] for t in e["tags"]} - set(d["tags"]))
    return qid, a, new


def git(*c, retry=1):
    for i in range(retry):
        r = subprocess.run(["git", "-C", SITE] + list(c))
        if r.returncode == 0:
            return
        if i < retry - 1:
            print("git %s failed, retrying in %ds…" % (c[0], 3 * (i + 1))); time.sleep(3 * (i + 1))
    sys.exit("git %s failed" % " ".join(c))


def commit(msg):
    git("add", REL)
    git("commit", "-qm", msg)
    git("pull", "--rebase", "-q", retry=4)
    git("push", "-q", "origin", "HEAD:main", retry=4)
    print("pushed")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("file", nargs="?")
    p.add_argument("--q"); p.add_argument("--date"); p.add_argument("--try", dest="tr", type=int)
    p.add_argument("--score", default=""); p.add_argument("--essay"); p.add_argument("--essay-file")
    p.add_argument("--rewrite", default=""); p.add_argument("--rewrite-file")
    p.add_argument("--error", action="append", default=[]); p.add_argument("--rule", action="append", default=[])
    p.add_argument("--list", action="store_true"); p.add_argument("--tags", action="store_true")
    p.add_argument("--tag-rule", nargs=2, metavar=("TAG", "RULE"))
    p.add_argument("--commit", action="store_true")
    o = p.parse_args()
    d = load()
    if o.list:
        for q, L in d["attempts"].items():
            for a in L:
                print("%-7s 第%d次 %s %-12s 错误 %d" % (q, a["try"], a["date"], a["score"], len(a["errors"])))
        return
    if o.tags:
        cnt = {}
        for L in d["attempts"].values():
            for a in L:
                for e in a["errors"]:
                    for t in e["tags"]:
                        cnt[t] = cnt.get(t, 0) + 1
        for t in sorted(set(cnt) | set(d["tags"]), key=lambda t: -cnt.get(t, 0)):
            print("%-10s %2d  %s" % (t, cnt.get(t, 0), d["tags"].get(t, "")))
        return
    if o.tag_rule:
        d["tags"][o.tag_rule[0]] = o.tag_rule[1]; save(d); print("rule set for", o.tag_rule[0])
        if o.commit:
            commit("53·54 易错规则 %s" % o.tag_rule[0])
        return
    if o.file:
        src = sys.stdin if o.file == "-" else open(o.file, encoding="utf-8")
        a = json.load(src)
        for k, v in (("q", o.q), ("date", o.date), ("try", o.tr)):
            if v: a[k] = v
    else:
        if not o.q:
            p.error("give a JSON file or --q")
        rd = lambda f: open(f, encoding="utf-8").read() if f else None
        a = {"q": o.q, "date": o.date, "try": o.tr, "score": o.score, "essay": rd(o.essay_file) or o.essay or "",
             "errors": o.error, "rewrite": rd(o.rewrite_file) or o.rewrite, "rules": o.rule}
    qid, a, new = add(d, a)
    save(d)
    print("OK %s 第%d次 %s %s · 错误 %d 条 · 共 %d 次" % (qid, a["try"], a["date"], a["score"], len(a["errors"]), len(d["attempts"][qid])))
    if new:
        print("note: new tags without a rule: %s  (optional: --tag-rule TAG \"规则\")" % ", ".join(new))
    if o.commit:
        commit("53·54 作文记录 %s 第%d次 %s" % (qid, a["try"], a["date"]))


if __name__ == "__main__":
    main()
