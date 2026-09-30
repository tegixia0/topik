#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成 writing/grammar.json（语法闪卡数据）和 writing/cheatsheet.html（速查页）。
内容在 tools/wg_data.py 里改；例句 ref 从 writing/questions.json 取真实题目句子。"""
import json, re, os, sys, html
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import wg_data as D

Q = {q["id"]: q for q in json.load(open(os.path.join(ROOT, "writing/questions.json"), encoding="utf-8"))["questions"]}
E = html.escape

def sent_of(ref, ai):
    qid, k = ref[:-1], ref[-1]
    q = Q[qid]; sym = "㉠" if k == "a" else "㉡"
    ans = q["ans"][k][ai]
    for s in re.split(r"(?<=[.?!])\s+", q["text"]):
        if sym in s:
            s = s.split("\n")[-1]
            s = re.sub(r"\(\s*[㉠㉡]\s*\)", lambda m: "\x01" if sym in m.group(0) else "…", s)
            before, after = s.split("\x01")
            return q, k, ans, before, after
    raise KeyError(ref)

def src_label(q, k=None, official_ans=True):
    lab = "第%d回 %d%s" % (q["round"], q["no"], ("㉠" if k == "a" else "㉡") if k else "")
    if q.get("src") == "recalled": lab += "（回忆版）"
    if k: lab += " · " + ("官方答案" if q.get("ansType") == "official" else "参考答案")
    return lab

def norm(s):
    s = re.sub(r"[^\uac00-\ud7a3\u3131-\u318e]", "", s)
    for a, b in (("으ㄹ", "을"), ("으ㄴ", "은"), ("으ㅁ", "음"), ("으ㅂ", "읍")):
        s = s.replace(a, b)
    return s

def expand(p):
    out = set()
    for alt in [a for a in re.split(r"\s+/\s+", p) if a.strip()]:
        todo = [alt]
        while todo:
            t = todo.pop()
            m = re.search(r"\(([^()]*)\)", t)
            if m:
                todo.append(t[:m.start()] + m.group(1) + t[m.end():]); todo.append(t[:m.start()] + t[m.end():]); continue
            m = re.search(r"(?:^|(?<=[^\uac00-\ud7a3\u3131-\u318e])|(?<=으))([\uac00-\ud7a3\u3131-\u318e])/([\uac00-\ud7a3\u3131-\u318e])", t)
            if m:
                todo.append(t[:m.start()] + m.group(1) + t[m.end():]); todo.append(t[:m.start()] + m.group(2) + t[m.end():]); continue
            n = norm(t)
            if n: out.add(n)
    return out

GMAP = {g[0]: g for g in D.GROUPS}
pats = []
for P in D.P:
    exs = []
    for e in P["ex"]:
        if "ref" in e:
            q, k, ans, b, a = sent_of(e["ref"], e.get("ai", 0))
            exs.append({"ko": b + ans + a, "hl": [len(b), len(b) + len(ans)], "zh": e["zh"], "src": src_label(q, k), "note": e.get("note", "")})
        else:
            exs.append({"ko": e["ko"], "zh": e["zh"], "src": "自拟例句"})
    keys = set(expand(re.split(r"\s+/\s+", P["p"])[0]))
    for a in P["ans"]: keys |= expand(a)
    g = GMAP[P["g"]]
    pats.append({"id": P["id"], "g": P["g"], "no": g[1], "p": P["p"], "zh": P["zh"], "att": P["att"], "mem": P["mem"],
                 "ex": exs, "cue": P["cue"], "err": P["err"], "keys": sorted(keys)})
honor = []
for i, (plain, hon, zh, note) in enumerate(D.HONOR):
    honor.append({"id": "hon-%02d" % i, "g": "honor", "no": 51, "plain": plain, "p": hon, "zh": zh, "note": note, "keys": sorted(expand(hon))})
formulas = []
for no, see, write, ex, ref in D.FORMULAS:
    lab = ""
    if ref:
        q = Q[ref]; lab = "第%d回%s" % (q["round"], "（回忆版）" if q.get("src") == "recalled" else "")
    formulas.append({"no": no, "see": see, "write": write, "ex": ex, "src": lab or "自拟"})

data = {"version": 2, "groups": [{"id": g[0], "no": g[1], "name": g[2], "desc": g[3]} for g in D.GROUPS],
        "patterns": pats, "honor": honor, "formulas": formulas,
        "mistakes": [{"t": t, "d": d, "pairs": pr} for t, d, pr in D.MISTAKES], "steps": D.STEPS}
json.dump(data, open(os.path.join(ROOT, "writing/grammar.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# ───────── HTML ─────────
def ko_code(s):  # wrap Korean runs in the text with <code>
    return re.sub(r"([\-~]?[\(\)\uac00-\ud7a3\u3131-\u318e/][\(\)\uac00-\ud7a3\u3131-\u318e/\-]*(?:\s[\(\)\uac00-\ud7a3\u3131-\u318e/\-]+)*[?]?)",
                  lambda m: '<span class="k" lang="ko">' + m.group(1) + "</span>", E(s))
def ex_html(ex):
    if "hl" in ex:
        a, b = ex["hl"]; ko = E(ex["ko"][:a]) + "<mark>" + E(ex["ko"][a:b]) + "</mark>" + E(ex["ko"][b:])
    else: ko = E(ex["ko"])
    h = '<div class="ex"><div class="exko" lang="ko">' + ko + '</div><div class="exzh">' + E(ex["zh"]) + '</div><div class="exsrc' + (" self" if ex["src"] == "自拟例句" else "") + '">' + E(ex["src"]) + "</div>"
    if ex.get("note"): h += '<div class="exnote">' + E(ex["note"]) + "</div>"
    return h + "</div>"
def fold(s): return E(s.lower())

out = ['<section class="cs2" id="cs2">',
       '<div class="cs-search"><input id="csQ" type="search" placeholder="🔍 搜：中文意思 / 句型 / 线索（如 只能、혹시、왜냐하면）" autocomplete="off"><button type="button" id="csQx" hidden>✕</button></div>',
       '<div class="seg cs-tabs" id="csTabs"><button type="button" data-cst="f" class="active">🧭 判断公式</button><button type="button" data-cst="p">📚 句型卡</button><button type="button" data-cst="m">⚠️ 常见错误</button><button type="button" data-cst="s">📝 步骤</button></div>',
       '<div class="cs-empty" id="csNone" hidden>没有找到，换个关键词试试。</div>']
# formulas
out.append('<div class="cs-pane" data-pane="f"><p class="cs-lead">看到空前/空后的线索 → 直接决定写什么。<b>黄色</b>是答案部分。</p>')
for no in (51, 52):
    out.append('<h4 class="cs-h">%d %s</h4><div class="fms">' % (no, "实用文" if no == 51 else "说明文"))
    for f in [x for x in formulas if x["no"] == no]:
        ex = E(f["ex"]); ex = re.sub(r"\(([^()]+)\)", r"<mark>\1</mark>", ex)
        out.append('<div class="fm cs-it" data-s="%s"><div class="fm-l"><span class="fm-tag">看到</span>%s</div><div class="fm-r"><span class="fm-tag w">写</span>%s</div><div class="fm-ex" lang="ko">%s <span class="fm-src">%s</span></div></div>'
                   % (fold(f["see"] + " " + f["write"] + " " + f["ex"]), ko_code(f["see"]), ko_code(f["write"]), ex, E(f["src"])))
    out.append("</div>")
out.append("</div>")
# patterns
out.append('<div class="cs-pane" data-pane="p" hidden><p class="cs-lead">点分组展开，点句型看：接法 · 怎么记 · 真题例句 · 线索 · 易错。</p>')
for no in (51, 52):
    out.append('<h4 class="cs-h">%d %s</h4>' % (no, "实用文 · 用 -습니다" if no == 51 else "说明文 · 用 -(ㄴ/는)다"))
    for g in [x for x in D.GROUPS if x[1] == no]:
        items = honor if g[0] == "honor" else [x for x in pats if x["g"] == g[0]]
        out.append('<details class="grp" data-g="%s"><summary><b>%s</b><span class="gd">%s</span><span class="gn">%d</span></summary><div class="grp-b">' % (g[0], E(g[2]), E(g[3]), len(items)))
        if g[0] == "honor":
            out.append('<div class="hon">')
            for h in items:
                out.append('<div class="hon-r cs-it" data-s="%s"><span class="hp" lang="ko">%s</span><span class="ha">→</span><span class="hh" lang="ko">%s</span><span class="hz">%s</span>%s</div>'
                           % (fold(" ".join([h["plain"], h["p"], h["zh"], h["note"]])), E(h["plain"]), E(h["p"]), E(h["zh"]), ('<span class="hn" lang="ko">' + E(h["note"]) + "</span>") if h["note"] else ""))
            out.append("</div>")
        else:
            for x in items:
                s = " ".join([x["p"], x["zh"], x["att"], x["mem"], x["cue"], x["err"]] + [e["ko"] + " " + e["zh"] for e in x["ex"]])
                body = ['<div class="row"><span class="rk">中文意思</span>' + E(x["zh"]) + "</div>",
                        '<div class="row"><span class="rk">接法</span>' + ko_code(x["att"]) + "</div>",
                        '<div class="row mem"><span class="rk">🧠 中文对照记忆</span>' + ko_code(x["mem"]) + "</div>",
                        '<div class="row"><span class="rk">例句</span>' + "".join(ex_html(e) for e in x["ex"]) + "</div>",
                        '<div class="row cue"><span class="rk">🔎 线索</span>' + ko_code(x["cue"]) + "</div>"]
                if x["err"]: body.append('<div class="row err"><span class="rk">⚠️ 易错</span>' + ko_code(x["err"]) + "</div>")
                out.append('<details class="pc cs-it" id="pc-%s" data-s="%s"><summary><span class="pk" lang="ko">%s</span><span class="pz">%s</span></summary><div class="pb">%s</div></details>'
                           % (x["id"], fold(s), E(x["p"]), E(x["zh"]), "".join(body)))
        out.append("</div></details>")
out.append("</div>")
# mistakes
out.append('<div class="cs-pane" data-pane="m" hidden><p class="cs-lead">你练习里反复出现的错误，写完对照检查一遍。</p>')
for m in D.MISTAKES:
    t, d, pr = m
    out.append('<div class="mst cs-it" data-s="%s"><div class="mt">%s</div><div class="md">%s</div>%s</div>' % (
        fold(t + d + " ".join(a + b for a, b in pr)), ko_code(t), ko_code(d),
        ("<ul class=\"prs\">" + "".join('<li><span class="x" lang="ko">✗ %s</span><span class="o" lang="ko">✓ %s</span></li>' % (E(a), E(b)) for a, b in pr) + "</ul>") if pr else ""))
out.append("</div>")
out.append('<div class="cs-pane" data-pane="s" hidden><ol class="steps">' + "".join("<li>%s</li>" % s for s in D.STEPS) + "</ol></div>")
out.append("</section>")
open(os.path.join(ROOT, "writing/cheatsheet.html"), "w", encoding="utf-8").write("\n".join(out) + "\n")
print("patterns:", len(pats), "honor:", len(honor), "formulas:", len(formulas), "mistakes:", len(D.MISTAKES))
