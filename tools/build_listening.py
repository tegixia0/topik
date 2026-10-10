#!/usr/bin/env python3
"""生成 listening/data.json（🎧 听力：攻略 + 真题）。
来源（全部官方，topik.go.kr）：
  - 题干 / 选项 / 正答：topik.go.kr「기출문제 풀어보기」官方题目脚本 exam_{n}_2_h.js
    → tools/listening_src/parse_exam_js.js 解析为 official_{n}.json
  - 듣기 대본：topik.go.kr 자료실 公开的 「{n}회 TOPIK II 듣기 대본」PDF
    （83回是文字版 pdftotext；96回是扫描件：300dpi OCR 后逐句对照原 PDF + 原音频校对）→ script{n}.py
  - 音频：官方 1교시 듣기 MP3，ffmpeg 按 cuts_{n}.json 切成每题一段（21–50 配对题只保留第一遍，页面上可再听），
    单声道 22.05kHz 48kbps → listening/audio/{n}/qNN.mp3
  - 1–3 题图片：官方题目图片 → listening/img/
中文翻译 / 解析 / 陷阱 / 攻略标签 / 生词（ann{n}.py）是本站自写评注。
用法：python3 tools/build_listening.py
"""
import json, os, re, sys, importlib, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(HERE, "listening_src")
sys.path.insert(0, SRC)

ROUNDS = [
    dict(round=96, year="2024年7月", label="第96回（2024）"),
    dict(round=83, year="2022年7月", label="第83回（2022）"),
]
BOARD = "https://www.topik.go.kr/TWSTDY/TWSTDY0080.do"   # 기출문제 자료실

# 题号分组（真题里按题号顺序出现的题型）
GROUPS = [
    ((1, 3), "1–3 看图 / 图表"),
    ((4, 8), "4–8 接下一句"),
    ((9, 12), "9–12 女的接下来做什么"),
    ((13, 16), "13–16 内容一致"),
    ((17, 20), "17–20 男子的中心想法"),
    ((21, 50), "21–50 一段听两题（放两遍）"),
]
# 按题型练（按题干判断）
TYPES = [
    ("pic", "看图 / 图表", "1–3"),
    ("next", "接下一句", "4–8"),
    ("act", "接下来做什么", "9–12"),
    ("match", "内容一致", "13–16、22、24…"),
    ("idea", "中心想法 / 中心内容", "17–21、25、31、37、41"),
    ("doing", "说话人在做什么", "23、35"),
    ("intent", "说话的意图 / 目的", "27"),
    ("who", "说话人是谁", "29"),
    ("attitude", "说话人的态度", "32、48、50"),
    ("topic", "在讲什么（主题）", "33、43"),
    ("before", "对话之前的内容", "39"),
    ("detail", "原因 / 细节", "44 等"),
    ("manner", "说话方式", "46、50"),
]

def qtype(n, stem):
    s = re.sub(r"\s+", "", stem)
    if n <= 3: return "pic"
    if n <= 8: return "next"
    if n <= 12: return "act"
    if "같은것" in s: return "match"
    if "중심생각" in s or "중심내용" in s: return "idea"
    if "태도" in s: return "attitude"
    if "말하는방식" in s or "말하고있는방식" in s: return "manner"
    if "무엇을하고있는지" in s: return "doing"
    if "의도" in s or "목적" in s: return "intent"
    if "누구" in s: return "who"
    if "대화전" in s or "앞의내용" in s or "대화앞" in s: return "before"
    if "무엇에대한" in s or "제목" in s: return "topic"
    return "detail"

def pair_sets():
    out = []
    n = 21
    while n <= 50:
        out.append((n, n + 1)); n += 2
    return out

def vocab(v):
    res = []
    for item in (v or "").split(";"):
        item = item.strip()
        if not item: continue
        ko, _, zh = item.partition("|")
        res.append([ko.strip(), zh.strip()])
    return res

def main():
    data = dict(
        build=datetime.date.today().isoformat(),
        board=BOARD,
        groups=[dict(a=a, b=b, label=l) for (a, b), l in GROUPS],
        types=[dict(id=i, name=nm, nos=nos) for i, nm, nos in TYPES],
        rounds=[], sets=[], questions=[],
    )
    for R in ROUNDS:
        n = R["round"]
        off = json.load(open(os.path.join(SRC, f"official_{n}.json"), encoding="utf-8"))
        S = importlib.import_module(f"script{n}").S
        A = importlib.import_module(f"ann{n}").A
        cuts = json.load(open(os.path.join(SRC, f"cuts_{n}.json")))
        assert len(off["qs"]) == 50, n
        # 题组：1–20 每题一段，21–50 两题一段
        units = [(k, k) for k in range(1, 21)] + pair_sets()
        for a, b in units:
            assert a in S, (n, a)
            sid = f"{n}-{a}"
            ann = A[a]
            audio = f"listening/audio/{n}/q{a:02d}.mp3"
            assert os.path.exists(os.path.join(ROOT, audio)), audio
            c = cuts[str(a)]
            data["sets"].append(dict(id=sid, round=n, a=a, b=b, audio=audio,
                                     dur=round(c[1] - c[0], 1), twice=a >= 21,
                                     script=S[a].strip(), tr=ann["tr"].strip()))
            for q in range(a, b + 1):
                o = off["qs"][str(q)]
                an = A[q]
                opts = [re.sub(r"<[^>]+>", "", x or "").strip() for x in o["opts"]]
                img = None
                if q <= 3:
                    img = [f"listening/img/l{n}_q{q}_{i}.png" for i in range(1, 5)]
                    for p in img: assert os.path.exists(os.path.join(ROOT, p)), p
                    opts = ["", "", "", ""]   # 选项是图片
                st = [t for t in an["st"].split(",") if t]
                data["questions"].append(dict(
                    id=f"{n}-{q}", round=n, n=q, set=sid,
                    type=qtype(q, o["stem"] or o["instr"]),
                    instr=re.sub(r"\s+", " ", o["instr"]).strip(),
                    stem=re.sub(r"\s+", " ", o["stem"] or "").strip(),
                    opts=opts, img=img, ans=o["ans"],
                    e=an["e"].strip(), trap=an.get("trap", "").strip(), st=st, v=vocab(an.get("v")),
                ))
        data["rounds"].append(dict(round=n, label=R["label"], year=R["year"], count=50,
                                   pdf=f"https://www.topik.go.kr", note="官方题目、正答、듣기 대본、MP3"))
    # 自检
    for q in data["questions"]:
        assert q["ans"] in (0, 1, 2, 3), q["id"]
        assert len(q["opts"]) == 4, q["id"]
    out = os.path.join(ROOT, "listening", "data.json")
    json.dump(data, open(out, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    from collections import Counter
    print("wrote", out, os.path.getsize(out), "bytes;", len(data["questions"]), "questions;",
          dict(Counter(q["type"] for q in data["questions"])))

if __name__ == "__main__":
    main()
