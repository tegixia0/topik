#!/usr/bin/env python3
"""生成 writing/w5354.json（写作 53·54：速查 + 闪卡 + 真题）。数据源：tools/w5354_data.py"""
import json, os, re, sys, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import w5354_data as D
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def cnt(paras):  # 与页面一致：所有字符（含空格、标点），不含换行；段首缩进不计
    return sum(len(p) for p in paras)

groups = [dict(id=g, no=no, name=n, lead=l) for g, no, n, l in D.GROUPS]
gids = {g["id"] for g in groups}
items = []; bad = []
for i, it in enumerate(D.ITEMS):
    assert it["g"] in gids, it
    for k in ("ko", "zh", "mem", "err", "ex", "exzh", "src"):
        assert it.get(k), (k, it["ko"])
    if it["src"].startswith("官方范文"):
        rnd = int(re.search(r"第(\d+)回", it["src"]).group(1))
        body = "".join("".join(q["model"]) for q in D.QUESTIONS if q["round"] == rnd and q["modelType"] == "official")
        if it["ex"] not in body: bad.append((it["src"], it["ex"]))
    items.append(dict(id="p%02d" % (i + 1), **it))

if bad:
    for b in bad: print("例句不在官方范文里:", *b)
    sys.exit(1)
qs = []
for q in D.QUESTIONS:
    q = dict(q)
    assert q["no"] in (53, 54) and q["id"] == "%d-%d" % (q["round"], q["no"])
    q["kind"] = "real"; q["src"] = "official"
    q["img"] = "writing/img/w%d_53.png" % q["round"] if q["no"] == 53 else None
    if q["img"]: assert os.path.exists(os.path.join(ROOT, q["img"])), q["img"]
    q["n"] = cnt(q["model"])
    lo, hi = (200, 300) if q["no"] == 53 else (600, 700)
    flag = "" if lo <= q["n"] <= hi else "  <-- 超出目标字数"
    print("%-7s %-8s %4d字%s" % (q["id"], q["modelType"], q["n"], flag))
    qs.append(q)

out = dict(version=1, updated=datetime.date.today().isoformat(),
           overview={str(k): v for k, v in D.OVERVIEW.items()}, groups=groups, items=items,
           style=D.STYLE, tpl53=D.TPL53, check53=D.CHECK53, tpl54=D.TPL54, check54=D.CHECK54,
           questions=qs, sources=D.SOURCES)
p = os.path.join(ROOT, "writing", "w5354.json")
json.dump(out, open(p, "w"), ensure_ascii=False, indent=1)
print("items:", len(items), "cards:", sum(1 for x in items if x.get("card", True)), " 53:", sum(1 for q in qs if q["no"] == 53), " 54:", sum(1 for q in qs if q["no"] == 54), "->", p)
