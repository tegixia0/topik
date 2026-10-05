#!/usr/bin/env python3
"""Generate vocabulary hints for grammar drill sentences (中→韩).

Writes `hints: [{ko, zh}, ...]` onto sentences in grammar/prac.json and
grammar.json (prac / ex / fill). Hints are harder content words with Chinese
glosses — never the grammar pattern itself, never a conjugated blank.
"""
from __future__ import annotations
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BASE = 0xAC00
JONG_SS, JONG_L, JONG_N, JONG_R = 20, 8, 4, 8  # ㅆ ㄹ ㄴ ㄹ

EXTRA = {
  "알람": "闹钟（铃声）", "지각하다": "迟到", "지각": "迟到", "짖다": "（狗）叫",
  "파악하다": "把握、掌握", "버스": "公交车", "늦다": "晚、迟", "우산": "伞",
  "품질": "质量", "설명": "说明", "연습": "练习", "실수": "失误、错误",
  "경기": "比赛", "진행하다": "进行", "보고서": "报告书", "이사": "搬家",
  "점심": "午饭", "종일": "整天、一整天", "집중": "集中", "집중하다": "集中",
  "약속": "约定、约会", "어기다": "违背、爽约", "유학": "留学", "카페": "咖啡馆",
  "들르다": "顺便去", "잠기다": "被锁上", "가격": "价格", "가져오다": "带来",
  "감기": "感冒", "입맛": "胃口、食欲", "고장": "故障", "휴대폰": "手机",
  "화면": "屏幕", "떨어뜨리다": "弄掉、掉落", "깨지다": "碎裂",
  "교통사고": "交通事故", "수업": "课", "파티": "派对", "생일": "生日",
  "시험": "考试", "키우다": "养育、抚养", "정신": "精神、头脑", "젖다": "湿、沾湿",
  "막히다": "堵住、堵车", "울리다": "响、鸣", "잘못": "错误地", "싸다": "便宜",
  "떠들다": "吵嚷、喧闹", "잠": "觉、睡眠", "길": "路", "바쁘다": "忙",
  "막다": "堵、挡", "떨어지다": "掉落", "산책": "散步", "우체국": "邮局",
  "다녀오다": "去一趟回来", "아침": "早饭、早上", "표": "票", "가수": "歌手",
  "태어나다": "出生", "데다": "烫伤、灼伤", "데이다": "烫伤", "청소": "打扫",
  "사진": "照片", "끄다": "关掉", "켜다": "打开、开灯", "신발": "鞋",
  "춥다": "冷", "따뜻하다": "暖和", "스트레스": "压力", "야근": "加班",
  "케이크": "蛋糕", "주소": "地址", "적다": "写下；少", "적어 두다": "记下来",
  "불": "灯、火", "켜지다": "亮起", "눈": "雪；眼睛", "끝나다": "结束",
  "재미있다": "有意思", "어렵다": "难", "가수": "歌手", "서울": "首尔",
  "겨울": "冬天", "영화": "电影", "주말": "周末", "책": "书", "읽어": "读",
  "요리": "做饭、料理", "손": "手", "방": "房间", "낮": "中午、白天",
  "물어보다": "询问", "나오다": "出来、被提到",
}

EASY = set("""
것 수 때 중 후 전 더 또 잘 못 안 좀 왜 그 이 저 나 너 우리 사람 일 말 집 물 밥 돈
시간 오늘 내일 어제 지금 여기 거기 정말 아주 너무 매우 조금 많다 적다 크다 작다 좋다 나쁘다
있다 없다 하다 되다 가다 오다 보다 먹다 마시다 자다 일어나다 앉다 서다 읽다 쓰다 듣다
말하다 생각하다 알다 모르다 싶다 같다 다르다 새롭다 어렵다 쉽다 필요하다 가능하다 중요하다
시작하다 끝나다 공부하다 일하다 살다 만나다 만들다 사다 팔다 주다 받다 넣다 빼다 열다 닫다
돕다 기다리다 가르치다 배우다 사용하다 이용하다 운동하다 전화하다 여행하다 준비하다 결정하다
선택하다 방문하다 참석하다 도착하다 출발하다 들어가다 나오다 올라가다 내려가다 돌아가다 보내다
가지다 함께 다시 계속 바로 먼저 나중에 벌써 아직 항상 자주 가끔 보통 갑자기 그래서 그러나
하지만 그리고 또는 위해 통해 대해 대한 관한 따라 의해 날 비 옷 문 손 발 눈 머리 마음
친구 선생님 학생 학교 회사 엄마 아빠 부모님 아이 남자 여자 분 개 번 쪽 등 씨 님 다 요
음 기 내 네 제 한국 버스 타다 일찍 하루 하나 둘 셋 두 세 네 다섯 많이 그냥 특히
가장 모든 어떤 무슨 이런 그런 저런 같은 다른 새로운 자신 저 그 수 줄 및 등 때 후 전
""".split())

PATTERN_BAN = set("""
바람 통 탓 덕분 겸 커녕 망정 바에 듯 듯이 만큼 뿐 김 채 대로 다가 더니 던데
거든 걸 나 모양 터 법 리 버리다 놓다 두다 말다 대다 하다 되다 싶다 것 수 줄 바
""".split())

PART = sorted([
  "으로부터", "에게서", "한테서", "으로서", "로써", "로서", "까지", "부터", "처럼",
  "만큼", "대로", "밖에", "이나", "이라도", "라도", "에서는", "에는", "으로는", "으로",
  "에서", "에게", "한테", "께서", "이란", "랑", "이랑", "하고", "보다", "마다", "씩",
  "의", "을", "를", "이", "가", "은", "는", "도", "만", "과", "와", "로", "에", "께", "요",
], key=len, reverse=True)


def decomp(ch):
  o = ord(ch) - BASE
  if 0 <= o <= 11171:
    return o // 588, (o % 588) // 28, o % 28
  return None


def comp(c, j, jong=0):
  return chr(BASE + c * 588 + j * 28 + jong)


def has_final_l(stem):
  d = decomp(stem[-1]) if stem else None
  return bool(d and d[2] == JONG_L)


def drop_final_l(stem):
  c, j, _ = decomp(stem[-1])
  return stem[:-1] + comp(c, j, 0)


def add_jong(stem, jong):
  """Add batchim to last syllable if it has none."""
  if not stem:
    return stem
  d = decomp(stem[-1])
  if not d or d[2] != 0:
    return stem + ("ㄴ" if jong == JONG_N else "ㄹ")
  c, j, _ = d
  return stem[:-1] + comp(c, j, jong)


def fuse_past(stem):
  out = set()
  if not stem:
    return out
  if stem.endswith("하"):
    out.add(stem[:-1] + "했")
    return out
  d = decomp(stem[-1])
  if not d:
    return out
  c, j, jong = d
  if jong == JONG_L or jong != 0:
    out.add(stem + "었")
    out.add(stem + "았")
    return out
  JUNG_I, JUNG_YEO, JUNG_WA = 20, 6, 9
  if j == JUNG_I:
    out.add(stem[:-1] + comp(c, JUNG_YEO, JONG_SS))
  elif j == 8:  # ㅗ
    out.add(stem + "았")
    out.add(stem[:-1] + comp(c, JUNG_WA, JONG_SS))
  elif j == 0:  # ㅏ
    out.add(stem[:-1] + comp(c, j, JONG_SS))
  else:
    out.add(stem[:-1] + comp(c, j, JONG_SS))
    out.add(stem + "었")
  return out



def b_irregular_forms(stem):
  """ㅂ irregular: 바쁘다→바빠/바빴, 춥다→추워/추웠."""
  out=set()
  if not stem: return out
  d=decomp(stem[-1])
  if not d or d[2]!=17:  # jong ㅂ
    return out
  c,j,_=d
  # drop ㅂ
  base=stem[:-1]+comp(c,j,0)
  # ㅡ + ㅏ/ㅓ → ㅏ/ㅓ on previous? 바쁘: 쁘 is ㅃ+ㅡ+ㅂ → 빠 (ㅃ+ㅏ)
  if j==18:  # ㅡ
    # use ㅏ if preceding vowel is ㅏ/ㅗ else ㅓ — approximate with ㅏ for ㅏ-series
    out.add(stem[:-1]+comp(c,0,0))  # 빠
    out.add(stem[:-1]+comp(c,0,JONG_SS))  # 빴
    out.add(stem[:-1]+comp(c,4,0))  # 뻐
    out.add(stem[:-1]+comp(c,4,JONG_SS))  # 뻤
  else:
    out.add(base+'워'); out.add(base+'와')
    out.add(base+'웠'); out.add(base+'왔')
  extra=set()
  for x in list(out):
    for s in ['요','어요','다','어','지','는데']:
      extra.add(x+s if not x.endswith('요') else x)
  out|=extra
  return {f for f in out if f}

def verb_forms(lemma):
  if not lemma.endswith("다") or len(lemma) < 2:
    return {lemma}
  stem = lemma[:-1]
  forms = {lemma, stem}
  if stem.endswith("하"):
    base = stem[:-1]
    for s in [
      "해요", "했다", "했어", "했어요", "하는", "할", "한", "해서", "하니",
      "하니까", "하면", "하면서", "하는데", "하자", "함", "하고", "하러", "하려",
      "하려고", "하느라고", "하느라",
    ]:
      forms.add(base + s)
    forms.update({stem + "는", stem + "고", stem + "면", stem + "다", add_jong(stem, JONG_N)})
    return {f for f in forms if f}

  if has_final_l(stem):
    s2 = drop_final_l(stem)
    for s in ["는", "은", "ㅂ니다", "니", "니까", "면", "세요", "느라고", "느라"]:
      forms.add(s2 + s)

  for s in [
    "는", "은", "을", "고", "면", "으면", "며", "면서", "니", "니까", "는데",
    "지", "죠", "겠어요", "네", "네요", "아요", "어요", "세요", "습니다", "ㅂ니다",
    "느라고", "느라", "도록", "려고", "러",
  ]:
    forms.add(stem + s)
  forms.add(add_jong(stem, JONG_N))
  forms.add(add_jong(stem, JONG_R))
  # ㅣ stem + 어 → 여/혀/겨… (잠기+어=잠겨)
  d = decomp(stem[-1]) if stem else None
  if d and d[2] == 0 and d[1] == 20:  # jung ㅣ
    yeo = stem[:-1] + comp(d[0], 6, 0)  # ㅕ
    forms.add(yeo)
    for s in ["서", "요", "도", "지", "져", "졌어요", "져서"]:
      forms.add(yeo + s)

  for pr in fuse_past(stem):
    forms.add(pr)
    for s in ["다", "어", "어요", "지", "는데", "더니", "으면", "을", "던", "을까", "으면"]:
      forms.add(pr + s)
  return {f for f in forms if f}


def clean_zh(zh):
  zh = str(zh or "")
  zh = re.split(r"[；;]", zh)[0]
  zh = re.split(r"[／/]", zh)[0]
  parts = [p.strip() for p in re.split(r"[、，]", zh) if p.strip()]
  zh = "、".join(parts[:2]) if parts else zh.strip()
  zh = re.sub(r"（[^）]*바람[^）]*）", "", zh)
  zh = re.sub(r"（-[^）]+）", "", zh)
  zh = re.sub(r"\(-[^)]+\)", "", zh)
  return zh.strip(" 、")


def load_gloss():
  idx = json.load(open(os.path.join(ROOT, "bank", "index.json")))
  gloss = {a[0]: {"zh": a[1], "lvl": a[3], "pos": a[5]} for a in idx["words"]}
  for p in os.listdir(os.path.join(ROOT, "decks")):
    if not p.endswith(".json") or p in ("index.json", "categories.json"):
      continue
    d = json.load(open(os.path.join(ROOT, "decks", p)))
    for v in d.get("vocab") or []:
      if v.get("ko") and v.get("zh") and v["ko"] not in gloss:
        gloss[v["ko"]] = {"zh": v["zh"], "lvl": 2, "pos": v.get("pos") or "*"}
  for k, v in EXTRA.items():
    gloss[k] = {"zh": v, "lvl": 2, "pos": "*"}
  gloss["지각"] = {"zh": "迟到", "lvl": 2, "pos": "名"}
  gloss["길"] = {"zh": "路", "lvl": 1, "pos": "名"}
  return gloss


def build_surface_index(gloss):
  """surface form -> best lemma."""
  idx = {}

  def add(surface, lemma, score):
    if not surface or len(surface) < 1:
      return
    prev = idx.get(surface)
    if not prev or score > prev[1]:
      idx[surface] = (lemma, score)

  for lemma, info in gloss.items():
    add(lemma, lemma, 100 + len(lemma))
    pos = info.get("pos") or ""
    if lemma.endswith("다") and ("动" in pos or "形" in pos or pos == "*" or lemma in EXTRA):
      stem = lemma[:-1]
      irregular_l = set()
      if has_final_l(stem):
        s2 = drop_final_l(stem)
        irregular_l = {s2 + s for s in ["는", "은", "ㅂ니다", "니", "니까", "면", "세요", "느라고", "느라"]}
      # ㅂ irregular surfaces
      irreg_b = b_irregular_forms(stem)
      for f in verb_forms(lemma) | irreg_b:
        score = 80 + len(f)
        if f in irregular_l:
          score = 55 + len(f)  # prefer regular 쓰느라고 over 쓸다's ㄹ-drop
        if f == stem:
          score = 45 + len(f)  # bare stem < noun
        add(f, lemma, score)
    # nouns: bare + common particles already handled by strip
  return idx


def strip_part(tok):
  for p in PART:
    if len(tok) > len(p) and tok.endswith(p):
      return tok[: -len(p)]
  return tok


def lookup_token(tok, gloss, surface):
  cands = []
  variants = [tok, strip_part(tok)]
  # also strip trailing 요
  if tok.endswith("요") and len(tok) > 1:
    variants.append(tok[:-1])
  for v in variants:
    if v in surface:
      cands.append(surface[v])
    # longest prefix against surface (min stem len 2)
    for L in range(min(len(v), 12), 1, -1):
      p = v[:L]
      if p in surface:
        cands.append(surface[p])
  if not cands:
    return None
  cands.sort(key=lambda x: -x[1])
  lem = cands[0][0]
  return lem if lem in gloss else None


def ban_set_for_item(it):
  ban = set(PATTERN_BAN)
  for t in re.findall(r"[가-힣]+", it.get("f") or ""):
    ban.add(t)
  for k in it.get("keys") or []:
    for t in re.findall(r"[가-힣]+", k):
      ban.add(t)
  return ban


def hints_for_sentence(ko, gloss, surface, ban, max_n=5):
  hints, got = [], set()
  for tok in re.findall(r"[가-힣]+", ko or ""):
    lem = lookup_token(tok, gloss, surface)
    REJECT={"쓸다","개다","타다","가다","오다","하다","되다","있다","없다","바"}
    if not lem or lem in EASY or lem in ban or lem in got or lem in REJECT:
      continue
    if len(lem) <= 1 and lem not in EXTRA:
      continue
    info = gloss.get(lem) or {}
    z = clean_zh(info.get("zh"))
    if not z or re.search(r"바람|（-|所…", z) and lem in PATTERN_BAN:
      continue
    # Prefer 지각하다 display for 지각
    if lem == "지각":
      lem = "지각하다"
      z = "迟到"
    got.add(lem)
    hints.append({"ko": lem, "zh": z, "lvl": info.get("lvl", 2), "len": len(lem)})
  hints.sort(key=lambda h: (-(1 if h["lvl"] == 2 else 0), -h["len"], h["ko"]))
  out = []
  for h in hints:
    if h["lvl"] == 1 and h["len"] <= 2 and sum(1 for x in out if x["_l"] == 2) >= 2:
      continue
    if h["ko"] in PATTERN_BAN:
      continue
    out.append({"ko": h["ko"], "zh": h["zh"], "_l": h["lvl"]})
    if len(out) >= max_n:
      break
  return [{"ko": x["ko"], "zh": x["zh"]} for x in out]


def is_clean_sentence(e):
  if not e or not e.get("ko") or not e.get("zh"):
    return False
  if re.search(r"…|\.\.\.", e["ko"]) or re.search(r"…|\.\.\.", e["zh"]):
    return False
  return True


def attach_hints_to_grammar(data, gloss=None, surface=None):
  gloss = gloss or load_gloss()
  surface = surface or build_surface_index(gloss)
  covered = empty = total = 0
  for it in data.get("items") or []:
    ban = ban_set_for_item(it)
    for key in ("prac", "ex", "fill"):
      arr = it.get(key) or []
      new = []
      for e in arr:
        ne = dict(e)
        if key == "fill":
          ko = re.sub(r"＿+", " ", e.get("ko") or "")
          fill_ban = set(ban)
          for a in e.get("ans") or []:
            for t in re.findall(r"[가-힣]+", a):
              fill_ban.add(t)
          hs = hints_for_sentence(ko, gloss, surface, fill_ban, max_n=4)
          # also try matching against chinese-side? skip
          # enrich from zh-known? no
          ne["hints"] = hs
          total += 1
          covered += 1 if hs else 0
          empty += 0 if hs else 1
        elif is_clean_sentence(e):
          hs = hints_for_sentence(e["ko"], gloss, surface, ban)
          ne["hints"] = hs
          total += 1
          covered += 1 if hs else 0
          empty += 0 if hs else 1
        new.append(ne)
      it[key] = new
  return covered, empty, total


def update_prac(gloss, surface, items_by_id=None):
  path = os.path.join(ROOT, "grammar", "prac.json")
  prac = json.load(open(path))
  n_sent = n_hint = 0
  for gid, sents in prac.items():
    ban = set(PATTERN_BAN)
    if items_by_id and gid in items_by_id:
      ban |= ban_set_for_item(items_by_id[gid])
    new = []
    for e in sents:
      ne = {k: v for k, v in e.items() if k != "hints"}
      # keep ko/zh only as source fields plus hints
      ne = {"ko": e["ko"], "zh": e["zh"]}
      if is_clean_sentence(e):
        hs = hints_for_sentence(e["ko"], gloss, surface, ban)
        ne["hints"] = hs
        n_sent += 1
        n_hint += 1 if hs else 0
      new.append(ne)
    prac[gid] = new
  with open(path, "w") as f:
    json.dump(prac, f, ensure_ascii=False, indent=1)
    f.write("\n")
  return n_sent, n_hint


def main():
  gloss = load_gloss()
  surface = build_surface_index(gloss)
  print("surface forms indexed:", len(surface))
  items_by_id = {}
  gpath = os.path.join(ROOT, "grammar", "grammar.json")
  if os.path.exists(gpath):
    g = json.load(open(gpath))
    items_by_id = {it["id"]: it for it in g.get("items") or []}
  n_sent, n_hint = update_prac(gloss, surface, items_by_id)
  print(f"prac.json: {n_hint}/{n_sent} sentences have vocab hints")
  # rebuild grammar from source then attach — or attach onto current
  # Prefer: run build_grammar then attach. Here attach to existing + prac already updated.
  import build_grammar  # noqa: F401 — side-effect rebuild
  # build_grammar writes fresh grammar.json without our attach — call attach after
  g = json.load(open(gpath))
  # re-merge prac with hints into items (build_grammar already loaded prac with hints)
  c, e, t = attach_hints_to_grammar(g, gloss, surface)
  with open(gpath, "w") as f:
    json.dump(g, f, ensure_ascii=False, separators=(",", ":"))
  print(f"grammar.json: {c}/{t} prompts have hints ({e} empty)")
  prac = json.load(open(os.path.join(ROOT, "grammar", "prac.json")))
  for gid in ("baram", "neurago", "tase", "tong"):
    print("---", gid)
    for s in prac.get(gid, [])[:2]:
      print(" ", s["zh"], "->", s.get("hints"))


if __name__ == "__main__":
  # Ensure tools/ on path for build_grammar import
  sys.path.insert(0, HERE)
  main()
