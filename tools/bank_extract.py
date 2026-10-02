#!/usr/bin/env python3
"""词库原始数据抽取（只在更新源数据时运行一次）→ tools/bank_src/base.json

源数据（不进仓库，太大）：
  1. 国立国语院《한국어 학습용 어휘 목록》(2003) 官方 xls：
     https://www.korean.go.kr/front/etcData/etcDataView.do?etc_seq=71  → /workspace/nikl.xls
  2. 国立国语院《한국어기초사전》全量导出（含中文对译、汉字原语、例句、语义范畴、关联词）
     Hugging Face 镜像 hac541309/basic_korean_dict（xls_20230601，CC BY-SA）
     → /workspace/krdict/kd.parquet （python3 tools/bank_extract.py --parse 会转成 kd_rows.json）
用法：python3 tools/bank_extract.py [--nikl PATH] [--kd PATH]
"""
import json, re, sys, os, collections, argparse
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "bank_src", "base.json")

KEYS=["표제어","구분","품사","고유어 여부","원어","발음","활용","검색용 이형태","어휘 등급","의미 범주","주제 및 상황 범주","관련어","가봐라","파생어","의미 참고","전체 참고","문형 참고","문형","뜻풀이","용례","다중 매체 정보"]
LANGS=["몽골어","베트남어","타이어","인도네시아어","러시아어","영어","일본어","프랑스어","스페인어","아랍어","중국어"]
def parse_kd(path):
    import pyarrow.parquet as pq
    texts = pq.read_table(path).column("text").to_pylist()
    ALL = KEYS+[l+" 대역어 뜻풀이" for l in LANGS]+[l+" 대역어" for l in LANGS]+["부표제어 뜻풀이","부표제어 용례","부표제어 문형 참고","부표제어 문형","부표제어 관련어","부표제어 의미 참고","부표제어 전체 참고","부표제어"]+[l+" 부표제어 대역어 뜻풀이" for l in LANGS]+[l+" 부표제어 대역어" for l in LANGS]
    ALL = sorted(set(ALL), key=len, reverse=True)
    pat = re.compile(r'(?:^|, )('+'|'.join(re.escape(k) for k in ALL)+r'): ')
    keep = {"표제어","구분","품사","고유어 여부","원어","발음","어휘 등급","의미 범주","주제 및 상황 범주","관련어","뜻풀이","용례","중국어 대역어","중국어 대역어 뜻풀이","활용","의미 참고"}
    out = []
    for i, x in enumerate(texts):
        ms = list(pat.finditer(x)); d = {}
        for j, m in enumerate(ms):
            k = m.group(1); v = x[m.end():ms[j+1].start() if j+1 < len(ms) else len(x)]
            if k in keep and k not in d: d[k] = v.strip()
        d["_i"] = i; out.append(d)
    return out

POSN={'명':'명사','동':'동사','형':'형용사','부':'부사','관':'관형사','의':'의존 명사','대':'대명사','수':'수사','감':'감탄사','보':'보조','고':'고유 명사','불':'불'}
HAN = re.compile(r'[\u3400-\u9fff\uf900-\ufaff]')
import unicodedata
from opencc import OpenCC
_cc = OpenCC("t2s")
VAR = {"祕":"秘","絕":"绝","絶":"绝","豐":"丰","豊":"丰","畵":"画","畫":"画","鄰":"邻","隣":"邻","礙":"碍","鬪":"斗","硏":"研","姸":"妍","卽":"即","晩":"晚","淸":"清","靑":"青","眞":"真","値":"值","戶":"户","內":"内","敎":"教","說":"说","稅":"税","銳":"锐","脫":"脱","閱":"阅","悅":"悦","兌":"兑","黃":"黄","溫":"温","強":"强","強":"强","步":"步","涉":"涉","吳":"吴","僞":"伪","爲":"为","呂":"吕","搖":"摇","謠":"谣","遙":"遥","舍":"舍","揭":"揭","渴":"渴","節":"节","郞":"郎","廊":"廊","朗":"朗","效":"效","飮":"饮","尙":"尚","黑":"黑","團":"团","變":"变","彎":"弯","蠻":"蛮","俱":"俱","奧":"奥","粧":"妆","裝":"装","莊":"庄","壯":"壮","狀":"状","將":"将","獎":"奖","醬":"酱","漿":"浆","邊":"边","擧":"举","譽":"誉","與":"与","擴":"扩","鑛":"矿","廣":"广","曉":"晓","燒":"烧","繩":"绳","蠅":"蝇","竝":"并","並":"并","幷":"并","册":"册","冊":"册","敍":"叙","敘":"叙","蔘":"参","參":"参","慘":"惨","豫":"预","紀":"纪","記":"记"}
def simp(s):
    s = unicodedata.normalize("NFKC", s or "")
    return _cc.convert("".join(VAR.get(c, c) for c in s))
def hanonly(s): return "".join(HAN.findall(unicodedata.normalize("NFKC", s or "")))
def hjmatch(nikl, won):
    a = simp(hanonly(nikl))
    for alt in (won or "").split("/"):
        b = simp(alt.replace("-", ""))
        if b == a: return True
        if len(b) == len(a) and all(x == y or not HAN.match(x) for x, y in zip(b, a)) and any(HAN.match(x) for x in b): return True
        if simp(hanonly(alt)) == a: return True
    return False

def examples(r):
    ex = []
    for line in (r.get("용례") or "").split("\n"):
        m = re.match(r"<문장>\s*(.+)", line.strip())
        if m:
            s = m.group(1).strip()
            if 8 <= len(s) <= 42: ex.append(s)
    ex.sort(key=len)
    return ex[:2]

def rel(r):
    o = {}
    for line in (r.get("관련어") or "").split("\n"):
        m = re.match(r"(유의어|반대말|참고어|준말|본말|큰말|작은말|센말|여린말|높임말|낮춤말|비슷한말)\s+(.+)", line.strip())
        if m:
            k = {"유의어":"syn","비슷한말":"syn","반대말":"ant"}.get(m.group(1))
            if k: o.setdefault(k, []).extend(re.sub(r"\d+$", "", w.strip()) for w in m.group(2).split(","))
    return o

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--nikl", default="/workspace/nikl.xls")
    ap.add_argument("--kd", default="/workspace/krdict/kd.parquet")
    ap.add_argument("--rows", default="/workspace/krdict/kd_rows.json")
    a = ap.parse_args()
    if os.path.exists(a.rows): rows = json.load(open(a.rows))
    else:
        rows = parse_kd(a.kd); json.dump(rows, open(a.rows, "w"), ensure_ascii=False)
    by = collections.defaultdict(list)
    for r in rows:
        if r.get("구분") == "단어" and "표제어" in r: by[r["표제어"]].append(r)
    import xlrd
    s = xlrd.open_workbook(a.nikl).sheet_by_index(0)
    items = []
    for i in range(1, s.nrows):
        rank, w, p, h, g = s.row_values(i)
        if g not in ("B", "C"): continue
        if p.strip() == "고": continue          # 专有名词（地名/人名）不收
        items.append(dict(w=w.strip(), ko=re.sub(r"\d+$", "", w.strip()), pos=p.strip(), hint=str(h).strip(), lvl=g,
                          rank=int(rank) if rank != "" else 99999))
    def toks(h): return [t for t in re.split(r"[\s~;,]+", h) if len(t) >= 2 and not HAN.search(t)]
    merged = collections.OrderedDict()
    for it in items:
        pk = POSN.get(it["pos"], "")
        cands = by.get(it["ko"], [])
        c2 = [r for r in cands if pk and (r.get("품사", "").replace(" ", "") == pk.replace(" ", "") or (pk == "보조" and "보조" in r.get("품사", "")))]
        if not c2: c2 = [r for r in cands if r.get("품사") not in ("어미", "접사", "조사")] or cands
        hj = hanonly(it["hint"]) if HAN.search(it["hint"]) and not re.search(r"[가-힣]{2,}", it["hint"]) else ""
        hjbad = False
        if hj:
            c3 = [r for r in c2 if hjmatch(hj, r.get("원어"))]
            if c3: c2 = c3
            elif all(not r.get("원어") for r in c2): pass      # 基础词典没标原语：沿用 NIKL 汉字
            else: hjbad = bool(c2)
        T = toks(it["hint"])
        def sc(r):
            t = (r.get("용례") or "") + (r.get("뜻풀이") or "")
            return -sum(1 for x in T if x in t)
        c2 = sorted(c2, key=lambda r: (sc(r), r["_i"]))
        hom = dict(w=it["w"], pos=it["pos"], hint=it["hint"], lvl=it["lvl"], rank=it["rank"], hj=hj, hjbad=hjbad)
        if c2 and not hjbad:
            p0 = c2[0]
            same = [r for r in c2 if r.get("원어") == p0.get("원어") and r.get("활용") == p0.get("활용") and r.get("품사") == p0.get("품사")]
            hom.update(kpos=p0.get("품사"), origin=p0.get("고유어 여부"), wonEo=(p0.get("원어") or "").split("/")[0],
                       pron=(p0.get("발음") or "").split("/")[0].replace("ː", ""), klvl=p0.get("어휘 등급"),
                       senses=[dict(zh=r.get("중국어 대역어", ""), zhd=r.get("중국어 대역어 뜻풀이", ""), kd=r.get("뜻풀이", ""),
                                    cat=r.get("의미 범주", ""), th=r.get("주제 및 상황 범주", ""), ex=examples(r), **rel(r)) for r in same[:5]])
            others = []
            for r in cands:
                if r.get("원어") != p0.get("원어") and r.get("어휘 등급") in ("초급", "중급", "고급"):
                    key = (r.get("원어") or "", r.get("품사"))
                    if key not in [(o["h"], o["p"]) for o in others]:
                        others.append(dict(h=r.get("원어") or "", p=r.get("품사"), zh=r.get("중국어 대역어", ""), lv=r.get("어휘 등급")))
            hom["homographs"] = others[:3]
        e = merged.setdefault(it["ko"], dict(ko=it["ko"], homs=[]))
        e["homs"].append(hom)
    out = []
    for ko, e in merged.items():
        e["lvl"] = "B" if any(h["lvl"] == "B" for h in e["homs"]) else "C"
        e["rank"] = min(h["rank"] for h in e["homs"])
        out.append(e)
    # lookup for syn/ant zh (any krdict headword, first sense)
    look = {}
    for r in rows:
        k = r.get("표제어")
        if k and k not in look and r.get("구분") == "단어" and r.get("중국어 대역어"): look[k] = r["중국어 대역어"]
    need = set()
    for e in out:
        for h in e["homs"]:
            for s_ in h.get("senses", []):
                need.update(s_.get("syn", [])); need.update(s_.get("ant", []))
    json.dump(dict(source="NIKL 한국어 학습용 어휘 목록(2003) B+C + 한국어기초사전(xls_20230601)", words=out,
                   lookup={k: look[k] for k in sorted(need) if k in look}),
              open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
    print(len(out), "words →", OUT, os.path.getsize(OUT) // 1024, "KB")
    bad = [h["w"] for e in out for h in e["homs"] if not h.get("senses")]
    print("no krdict match:", len(bad), bad)
main()
