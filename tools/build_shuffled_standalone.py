#!/usr/bin/env python3
"""Build a standalone offline HTML with all learned daily/category vocab, shuffled."""
import json, random, sys, os, html
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out=sys.argv[1] if len(sys.argv)>1 else "/workspace/topik-flashcards-all-shuffled.html"
ix=json.load(open(f"{root}/decks/index.json")); cats=json.load(open(f"{root}/decks/categories.json"))
wi=json.load(open(f"{root}/wordinfo.json"))
try: voice=json.load(open(f"{root}/voice.json"))
except Exception: voice={}
files=[e["date"] for e in ix]+[c["id"] for c in cats]
seen=set(); cards=[]
KEYS=["pos","hanja","mem","tip","syn","ant","voice","pair","hint","ex","exzh"]
for d in files:
    dk=json.load(open(f"{root}/decks/{d}.json"))
    for v in dk.get("vocab",[]):
        if v["ko"] in seen: continue
        seen.add(v["ko"]); c={"ko":v["ko"],"zh":v["zh"],"d":dk.get("date",d)}
        w=wi.get(v["ko"],{})
        for k in KEYS:
            x=v.get(k) if v.get(k) not in (None,"",[]) else w.get(k)
            if x not in (None,"",[]): c[k]=x
        vv=voice.get(v["ko"]) if isinstance(voice,dict) else None
        if isinstance(vv,dict):
            for k in ("voice","pair"):
                if vv.get(k) and k not in c: c[k]=vv[k]
        cards.append(c)
random.shuffle(cards)
tpl=open(f"{root}/tools/shuffled_template.html").read()
open(out,"w").write(tpl.replace("/*DATA*/[]",json.dumps(cards,ensure_ascii=False)))
print(len(cards),"words ->",out)
