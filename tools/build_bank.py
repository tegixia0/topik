#!/usr/bin/env python3
"""📚 词库：tools/bank_src/base.json（bank_extract.py 生成）+ tools/bank_src/manual*.txt（人工补充）
+ wordinfo.json（已有的手写词条优先）→ bank/index.json、bank/o-NN.json（按学习顺序分块）、bank/c-<cat>.json（按主题）

python3 tools/build_bank.py            # 生成
python3 tools/build_bank.py --stats    # 只打印统计
人工补充格式（manual*.txt，一行一个词，字段用 " | " 分隔，第一个字段是韩语词）：
  가꾸다 | mem=… | tip=… | syn=꾸미다(装饰), 기르다(养) | ant=… | zh=… | cat=daily | ex=… | exzh=… | pos=… | hanja=…
"""
import json, re, os, sys, glob, collections, unicodedata
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from opencc import OpenCC
_cc = OpenCC("t2s")
HAN = re.compile(r"[\u3400-\u9fff\uf900-\ufaff]")
VAR = {"祕":"秘","絕":"绝","絶":"绝","豐":"丰","豊":"丰","畵":"画","畫":"画","鄰":"邻","隣":"邻","鬪":"斗","硏":"研","姸":"妍","卽":"即","晩":"晚","淸":"清","靑":"青","眞":"真","値":"值","戶":"户","內":"内","敎":"教","說":"说","稅":"税","銳":"锐","脫":"脱","閱":"阅","悅":"悦","黃":"黄","溫":"温","強":"强","吳":"吴","僞":"伪","爲":"为","搖":"摇","謠":"谣","遙":"遥","郞":"郎","飮":"饮","尙":"尚","竝":"并","並":"并","幷":"并","冊":"册","敍":"叙","敘":"叙","蔘":"参","豫":"预","擧":"举","譽":"誉","與":"与","擴":"扩","鑛":"矿","廣":"广","曉":"晓","燒":"烧","繩":"绳","彎":"弯","蠻":"蛮","變":"变","奧":"奥","粧":"妆","狀":"状","將":"将","獎":"奖","醬":"酱","邊":"边","團":"团","揷":"插","徵":"征","德":"德","惠":"惠","既":"既","旣":"既","槪":"概","慨":"慨","卷":"卷","券":"券","圈":"圈","拔":"拔","髮":"发","發":"发","廢":"废","撥":"拨","潑":"泼","黙":"默","默":"默","步":"步","渉":"涉","渴":"渴","揭":"揭","謁":"谒","歲":"岁","歷":"历","曆":"历","戰":"战","單":"单","彈":"弹","憚":"惮","禪":"禅","蟬":"蝉","嘆":"叹","歎":"叹","漢":"汉","難":"难","灘":"滩","攤":"摊","懷":"怀","壞":"坏","環":"环","還":"还","寶":"宝","實":"实","賣":"卖","讀":"读","續":"续","贖":"赎","觸":"触","獨":"独","濁":"浊","燭":"烛","屬":"属","囑":"嘱","國":"国","圍":"围","衛":"卫","衞":"卫","違":"违","偉":"伟","緯":"纬","韓":"韩","會":"会","繪":"绘","檜":"桧","黨":"党","當":"当","擋":"挡","嘗":"尝","償":"偿","賞":"赏","掌":"掌","莊":"庄","裝":"装","壯":"壮","粧":"妆","藏":"藏","臟":"脏","贓":"赃","髒":"脏","經":"经","輕":"轻","徑":"径","莖":"茎","頸":"颈","勁":"劲","醫":"医","藝":"艺","藥":"药","樂":"乐","礫":"砾","兒":"儿","亞":"亚","惡":"恶","壓":"压","厭":"厌","鹽":"盐","驗":"验","險":"险","檢":"检","儉":"俭","劍":"剑","劒":"剑","斂":"敛","臉":"脸","戀":"恋","蠶":"蚕","鐵":"铁","體":"体","禮":"礼","豐":"丰","豔":"艳","聽":"听","廳":"厅","應":"应","價":"价","假":"假","兩":"两","滿":"满","輛":"辆","佛":"佛","拂":"拂","沸":"沸","弗":"弗","凉":"凉","涼":"凉","乘":"乘","剩":"剩","晝":"昼","盡":"尽","燼":"烬","畫":"画","劃":"划","處":"处","據":"据","劇":"剧","巨":"巨","拒":"拒","炬":"炬","距":"距","渠":"渠","擇":"择","澤":"泽","譯":"译","驛":"驿","釋":"释","辭":"辞","亂":"乱","竊":"窃","齒":"齿","齡":"龄","龍":"龙","龜":"龟","麥":"麦","麵":"面","麪":"面","黙":"默","點":"点","黨":"党","鬱":"郁","鬭":"斗"}
def simp(s):
    s = unicodedata.normalize("NFKC", s or "")
    return _cc.convert("".join(VAR.get(c, c) for c in s))
def isHan(c): return bool(HAN.match(c))

ORDER_CHUNK = 250
HF_N = 1500
CATS = [  # id, emoji, name, desc
 ("society","🏛️","社会·政治·法律","社会活动、社会问题、政治行政、法律治安"),
 ("economy","💰","经济·消费","经济活动、金钱、消费、产业"),
 ("environment","🌱","环境·资源","环境问题、资源能源、灾害"),
 ("nature","🌦️","自然·天气·动植物","天气气候、地形、动植物"),
 ("education","🎓","教育·学习","学校、教学、学术、考试"),
 ("health","🏥","健康·医疗·身体","身体部位、疾病症状、治疗、生理"),
 ("tech","💻","科技·媒体·通信","科学技术、电脑网络、媒体、通信"),
 ("culture","🎨","文化·艺术·休闲","艺术、文学、历史传统、宗教、体育、旅行爱好"),
 ("emotion","💗","情感·性格·态度","情绪、性格、待人态度"),
 ("relation","🤝","人物·人际·家庭","各类人物、人际关系、家庭亲属、恋爱婚姻"),
 ("work","💼","工作·职场","职业、职场生活、职位"),
 ("daily","🏠","日常生活（衣食住行）","饮食、居住、穿着、交通、购物、日常行为"),
 ("thinking","💬","思维·语言·表达","认知思考、说话表达、语言"),
 ("action","🏃","动作·变化","身体动作、行为、变化（多为动词）"),
 ("state","🎯","形容词·状态","性质、形状、程度、感觉（多为形容词）"),
 ("time","🕒","时间·数量·位置","时间、顺序、频率、数量、方位、地区"),
 ("abstract","🧩","抽象概念","能力、关系、方式、结果等抽象名词"),
 ("adverb","🔗","副词·连接·虚词","副词、连接词、冠形词、依存名词、感叹词"),
]
CAT_IDS = [c[0] for c in CATS]
SEM = {  # 基础词典「의미 범주」→ 主题
 "개념 > 시간":"time","개념 > 순서":"time","개념 > 빈도":"time","개념 > 수":"time","개념 > 양":"time","개념 > 세는 말":"time",
 "개념 > 위치 및 방향":"time","개념 > 지역":"time","개념 > 지시":"time","개념 > 인칭":"relation","개념 > 의문":"adverb",
 "개념 > 정도":"state","개념 > 모양":"state","개념 > 색깔":"state","개념 > 밝기":"state","개념 > 온도":"state","개념 > 속도":"state","개념 > 성질":"state",
 "개념 > 접속":"adverb","인간 > 감정":"emotion","인간 > 태도":"emotion","인간 > 성격":"emotion","인간 > 신체 행위":"action","인간 > 신체에 가하는 행위":"action",
 "인간 > 인지 행위":"thinking","인간 > 감각":"state","인간 > 소리":"state","인간 > 신체 부위":"health","인간 > 신체 내부 구성":"health","인간 > 생리 현상":"health",
 "인간 > 체력 상태":"health","인간 > 신체 변화":"health","인간 > 용모":"health","인간 > 사람의 종류":"relation","인간 > 능력":"abstract",
 "사회 생활 > 언어 행위":"thinking","사회 생활 > 말":"thinking","사회 생활 > 사회 활동":"society","사회 생활 > 사회 행사":"society","사회 생활 > 사회 생활 상태":"society",
 "사회 생활 > 인간관계":"relation","사회 생활 > 직업":"work","사회 생활 > 직장 생활":"work","사회 생활 > 직위":"work","사회 생활 > 직장":"work",
 "사회 생활 > 교통 이용 장소":"daily","사회 생활 > 교통 수단":"daily","사회 생활 > 교통 이용 행위":"daily","사회 생활 > 매체":"tech","사회 생활 > 소통 수단":"tech","사회 생활 > 통신 행위":"tech",
 "삶 > 친족 관계":"relation","삶 > 가족 행사":"relation","삶 > 병과 증상":"health","삶 > 치료 행위":"health","삶 > 치료 시설":"health","삶 > 약품류":"health",
 "삶 > 여가 활동":"culture","삶 > 여가 시설":"culture","삶 > 여가 도구":"culture","삶 > 일상 행위":"daily","삶 > 삶의 행위":"daily","삶 > 삶의 상태":"daily",
 "자연 > 재해":"environment","자연 > 자원":"environment",
}
SEM_TOP = {"경제 생활":"economy","교육":"education","자연":"nature","동식물":"nature","식생활":"daily","주생활":"daily","의생활":"daily","정치와 행정":"society","문화":"culture","종교":"culture"}
THEME = [("직장","work"),("직업","work"),("집 구하기","daily"),("집안일","daily"),("주거","daily"),("물건 사기","daily"),("교통","daily"),("요리","daily"),("음식","daily"),("식문화","daily"),("하루 생활","daily"),("복장","daily"),("외모","health"),("실수담","daily"),("문제 해결","daily"),("한국 생활","daily"),("초대","relation"),
 ("학교","education"),("교육","education"),("언어","thinking"),("사건","society"),("인간관계","relation"),("연애","relation"),("가족","relation"),("소개하기","relation"),("여행","culture"),("취미","culture"),("스포츠","culture"),("공연","culture"),("예술","culture"),("대중 문화","culture"),("문학","culture"),("역사","culture"),("문화","culture"),("주말","culture"),("여가","culture"),
 ("감정","emotion"),("성격","emotion"),("심리","emotion"),("건강","health"),("보건","health"),("지리","nature"),("날씨","nature"),("환경","environment"),("공공","society"),("대중 매체","tech"),("컴퓨터","tech"),("과학","tech"),("언론","tech"),("사회","society"),("정치","society"),("법","society"),("철학","abstract"),("경제","economy"),("인사","thinking"),("감사","thinking"),("전화","tech"),("시간","time")]
KW = [  # 中文对译关键词 → 主题（按顺序，先命中先用）
 ("environment",["环境","污染","资源","能源","垃圾","生态","灾","排放","节约","回收","碳"]),
 ("economy",["经济","价","钱","费","金","税","贸易","市场","投资","消费","商","货","银行","贷","利息","收入","财","股","产业","企业","生产","销售","买","卖","存款","工资","薪","预算","支出","汇率","成本"]),
 ("health",["病","医","药","健康","症","治疗","疼","痛","伤","身体","手术","患","疾","营养","癌","卫生","牙","血","骨","皮肤","呼吸"]),
 ("education",["教","学","考试","课","校","研究","论文","知识","专业","成绩","作业","毕业","讲义","老师"]),
 ("society",["政","法","选举","国家","社会","犯罪","警","军","战","权","制度","公民","议","官","公共","民主","福利","人口","律","罪","审判","诉","舆论","机关","行政","政府","治安","福祉","团体"]),
 ("tech",["科学","技术","电脑","网","电子","信息","数据","机器","程序","媒体","广播","新闻","报纸","电视","手机","通信","实验","发明","电话","软件","画面","节目"]),
 ("culture",["艺术","文化","音乐","电影","文学","历史","传统","宗教","画","舞","诗","小说","演出","剧","博物","旅行","旅游","体育","运动","比赛","游戏","庆典","节日","展览","作品","歌","佛","教会"]),
 ("work",["工作","职","公司","上班","业务","雇","老板","同事","会议","求职","员工","辞职","退休","录用","经营","事务"]),
 ("relation",["家","父","母","兄","姐","弟","妹","朋友","夫","妻","婚","恋","亲","邻居","子女","孩子","爱人","人士","人物","者"]),
 ("nature",["天","雨","雪","风","山","海","河","江","森林","树","花","草","动物","植物","鸟","鱼","虫","气候","季节","阳光","土","石","地球","宇宙","星","月亮","太阳"]),
 ("daily",["饭","菜","食","吃","喝","衣","穿","鞋","房","屋","住","车","交通","路","洗","打扫","睡","厨","购物","商店","家具","搬家"]),
 ("emotion",["心","情","感","怒","喜","悲","乐","哭","笑","烦","怕","担心","幸福","孤独","害羞","自信","性格","态度","骄傲","尊重","感激","失望","满足","后悔","羡慕","讨厌"]),
 ("thinking",["说","言","语","话","想","思","认为","判断","记","忘","理解","意见","讨论","主张","表达","解释","提问","回答","告诉","叙述","议论","考虑","分析","认识","知道"]),
 ("time",["时","年","月","日","期","间","前","后","左","右","上","下","内","外","数","量","次","第","初","末","周","每"]),
]
POSZH = {"명사":"名词","동사":"动词","형용사":"形容词","부사":"副词","관형사":"冠形词","의존 명사":"依存名词","대명사":"代词","수사":"数词","감탄사":"感叹词","보조 동사":"辅助动词","보조 형용사":"辅助形容词"}
NPOS = {"명":"명사","동":"동사","형":"형용사","부":"부사","관":"관형사","의":"의존 명사","대":"대명사","수":"수사","감":"감탄사","보":"보조 동사","불":"명사"}
POS_SHORT = {"名词":"名","动词":"动","形容词":"形","副词":"副","冠形词":"冠","依存名词":"依","代词":"代","数词":"数","感叹词":"叹","辅助动词":"辅","辅助形容词":"辅"}

def jload(p): return json.load(open(p, encoding="utf-8"))
def split_zh(s):
    s = re.sub(r"\(无对应词汇\)|（无对应词汇）", "", s or "")
    out = []
    for t in re.split(r"[，,、；;]", s):
        t = t.strip().strip("。")
        if t and t not in out: out.append(t)
    return out

BAD_TOK = re.compile(r"用于|表示|用在|……|\.\.\.|指的是|助词|语尾|词尾")
def good_tok(x): return bool(x) and len(x) <= 9 and not BAD_TOK.search(x)
def zh_join(p):
    """第一义项的 1–2 个对译用、连接；后面的义项用；"""
    if not p: return ""
    if len(p) >= 2 and len(p[0]) + len(p[1]) <= 8: return "、".join(p[:2]) + "".join("；" + x for x in p[2:])
    return "；".join(p)

def parse_manual():
    M = {}
    for fp in sorted(glob.glob(os.path.join(HERE, "bank_src", "manual*.txt"))):
        for ln, line in enumerate(open(fp, encoding="utf-8"), 1):
            line = line.rstrip("\n")
            if not line.strip() or line.lstrip().startswith("#"): continue
            parts = [p.strip() for p in line.split(" | ")]
            ko = parts[0]; e = M.setdefault(ko, {})
            for p in parts[1:]:
                if "=" not in p: print("WARN manual", fp, ln, p); continue
                k, v = p.split("=", 1); k = k.strip(); v = v.strip()
                if k in ("syn", "ant"):
                    lst = []
                    for x in re.split(r"[,，;；]\s*", v):
                        x = x.strip()
                        if not x: continue
                        m = re.match(r"(.+?)[（(](.+)[）)]$", x)
                        lst.append({"ko": m.group(1).strip(), "zh": m.group(2).strip()} if m else {"ko": x, "zh": ""})
                    e[k] = lst
                else: e[k] = v
    return M

def classify(word, kpos, senses, hanja_s, zh):
    if kpos in ("부사","관형사","감탄사","보조 동사","보조 형용사","의존 명사","대명사"): return "adverb", "pos"
    if kpos == "수사": return "time", "pos"
    for s in senses:
        for c in (s.get("cat") or "").split("\n"):
            c = c.strip()
            if not c: continue
            if c in SEM:
                v = SEM[c]
                if v == "state" and kpos == "동사": v = "action"
                return v, "sem"
            top = c.split(" > ")[0]
            if top in SEM_TOP: return SEM_TOP[top], "sem"
    for s in senses:
        th = (s.get("th") or "").split("\n")[0]
        for k, v in THEME:
            if th and k in th: return v, "theme"
    return None, None

def kw_class(zh, kpos):
    for cat, kws in KW:
        if cat == "time" and kpos != "명사": continue
        for k in kws:
            if k in zh: return cat
    return None

def align(ko, won):
    """원어 ↔ 韩文音节逐字对齐：返回 [(音节, 汉字或None)]；对不上返回 None"""
    w = unicodedata.normalize("NFKC", (won or "").split("/")[0]).replace("-", "").replace(" ", "")
    k = ko.replace(" ", "")
    if not w or not any(isHan(c) for c in w) or len(w) != len(k): return None
    out = []
    for a, b in zip(k, w):
        if isHan(b): out.append((a, b))
        elif b == a: out.append((a, None))
        else: return None
    return out

def auto_mem(ko, kpos, won, zhs, origin):
    al = align(ko, won)
    if not al: return "", ""
    hs = "".join(h for _, h in al if h)
    hz = simp(hs)
    segs = []
    for a, h in al:
        if h: segs.append(a + "(" + simp(h) + ")")
        elif segs and not segs[-1].endswith(")"): segs[-1] += a
        else: segs.append(a)
    pieces = "+".join(segs)
    tail = ""
    rest = "".join(a for a, h in al if not h)
    if rest.endswith("하다"): tail = "；＋하다 → " + ("形容词" if kpos == "형용사" else "动词")
    elif rest.endswith("되다"): tail = "；＋되다 → 被动/自动（“被…/变得…”）"
    elif rest.endswith("시키다"): tail = "；＋시키다 → 使动（“使…”）"
    elif rest.endswith("스럽다"): tail = "；＋스럽다 → 形容词（“有…的样子”）"
    elif rest == "히" or rest.endswith("히"): tail = "；＋히 → 副词"
    mem = "汉字词 " + pieces + " → " + hz + tail + "。"
    tip = ""
    zj = "".join(zhs)
    if len(hz) >= 2:
        overlap = sum(1 for c in set(hz) if c in zj)
        if overlap == 0:
            tip = "汉字是「" + hz + "」，但韩语意思是「" + (zhs[0] if zhs else "") + "」，别按中文字面理解。"
        elif hz not in zj and overlap < len(set(hz)) and zhs:
            mem = mem[:-1] + "（中文常说「" + zhs[0] + "」）。"
    return mem, tip

SUFFIX_RULES = [  # 固有词/派生词 拆词记忆
 ("어지다","变得…（-아/어지다：状态变化）"),("아지다","变得…（-아/어지다：状态变化）"),("워지다","变得…（ㅂ不规则 + -어지다）"),
 ("스럽다","…스럽다＝“有…的样子/感觉”"),("롭다","…롭다＝“充满…/具有…”"),("답다","…답다＝“像…一样、有…的样子”"),
 ("하다",""),("되다",""),("시키다","…시키다＝“使…、让…”"),("거리다","…거리다＝“反复地…（拟声拟态动词）”"),("대다","…대다＝“不停地…”"),
]

def auto_native(ko, kpos, zhs, kdlook, banknames):
    """派生/合成词的拆词说明（只在能找到组成部分的中文意思时生成）"""
    z = lambda w: (split_zh(kdlook.get(w, "")) or [""])[0]
    if kpos in ("부사",) and ko.endswith("히") and (ko[:-1] + "하다") in kdlook:
        b = ko[:-1] + "하다"; return b + "（" + z(b) + "）→ 去掉 하다 加 히 → 副词“…地”。"
    if kpos == "부사" and ko.endswith("이") and len(ko) >= 3 and (ko[:-1] + "다") in kdlook:
        b = ko[:-1] + "다"; return b + "（" + z(b) + "）→ 词干 + 이 → 副词“…地”。"
    for suf, note in (("어지다", "-아/어지다＝“变得…”"), ("아지다", "-아/어지다＝“变得…”"), ("워지다", "ㅂ不规则：-ㅂ다 → -워지다＝“变得…”")):
        if ko.endswith(suf):
            stem = ko[:-len(suf)]
            for base in (stem + "다", stem + "ㅂ다", stem + "하다"):
                if base in kdlook: return base + "（" + z(base) + "）+ " + note + "。"
            if suf == "워지다":
                # 어려워지다 ← 어렵다：把最后音节加ㅂ받침
                last = stem[-1]; code = ord(last) - 0xAC00
                if 0 <= code < 11172 and code % 28 == 0:
                    b = stem[:-1] + chr(ord(last) + 17) + "다"
                    if b in kdlook: return b + "（" + z(b) + "）+ " + note + "。"
    if ko.endswith("스럽다") and ko[:-3] in kdlook: return ko[:-3] + "（" + z(ko[:-3]) + "）+ 스럽다“有…的感觉/样子” → " + (zhs[0] if zhs else "") + "。"
    if ko.endswith("롭다") and ko[:-2] in kdlook: return ko[:-2] + "（" + z(ko[:-2]) + "）+ 롭다“充满…” → " + (zhs[0] if zhs else "") + "。"
    if ko.endswith("시키다") and ko[:-3] in kdlook: return ko[:-3] + "（" + z(ko[:-3]) + "）+ 시키다“使…” → " + (zhs[0] if zhs else "") + "。"
    if ko.endswith("하다") and len(ko) > 2 and ko[:-2] in kdlook and z(ko[:-2]): return ko[:-2] + "（" + z(ko[:-2]) + "）+ 하다 → " + (zhs[0] if zhs else "") + "。"
    if ko.endswith("되다") and len(ko) > 2 and ko[:-2] in kdlook and z(ko[:-2]): return ko[:-2] + "（" + z(ko[:-2]) + "）+ 되다（被动/变成）→ " + (zhs[0] if zhs else "") + "。"
    if ko.endswith("없다") and len(ko) > 2 and ko[:-2] in kdlook: return ko[:-2] + "（" + z(ko[:-2]) + "）+ 없다（没有）→ " + (zhs[0] if zhs else "") + "。"
    if ko.endswith("있다") and len(ko) > 2 and ko[:-2] in kdlook: return ko[:-2] + "（" + z(ko[:-2]) + "）+ 있다（有）→ " + (zhs[0] if zhs else "") + "。"
    # 两段合成：A+B 都是词典词（名词+名词 / 名词+动词…）
    s = ko.replace(" ", "")
    best = None
    for i in range(1, len(s)):
        a, b = s[:i], s[i:]
        if a in kdlook and b in kdlook and z(a) and z(b) and len(a) + len(b) >= 3:
            if best is None or min(len(a), len(b)) > min(len(best[0]), len(best[1])): best = (a, b)
    if best:
        a, b = best; return "拆词：" + a + "（" + z(a) + "）+ " + b + "（" + z(b) + "）→ " + (zhs[0] if zhs else "") + "。"
    return ""

def reading_tokens():
    p = os.path.join(SITE, "reading", "rounds.json")
    if not os.path.exists(p): return set(), ""
    d = jload(p); lem = set(); texts = []
    for q in d.get("questions", []):
        for v in q.get("v") or []:
            if v: lem.add(v[0])
        texts += [q.get("passage") or "", q.get("stem") or ""] + list(q.get("opts") or [])
    g = d.get("groups") or {}
    for k, v in (g.items() if isinstance(g, dict) else enumerate(g)):
        if isinstance(v, dict): texts.append(v.get("passage") or "")
    return lem, "\n".join(texts)

def fmt_hanja(won_list):
    out = []
    for won in won_list:
        h = unicodedata.normalize("NFKC", won.split("/")[0]).replace("-", "")
        h = "".join(c for c in h if isHan(c))
        if not h: continue
        s = simp(h)
        x = h if s == h else h + "（" + s + "）"
        if x not in out: out.append(x)
    return " / ".join(out)

def main():
    stats_only = "--stats" in sys.argv
    base = jload(os.path.join(HERE, "bank_src", "base.json"))
    look = base.get("lookup", {})
    rows_look = {}
    M = parse_manual()
    WI = jload(os.path.join(SITE, "wordinfo.json")) if os.path.exists(os.path.join(SITE, "wordinfo.json")) else {}
    lem, rtext = reading_tokens()
    words = base["words"]
    # 词典查询表：本词库词 + 关联词
    kdlook = dict(look)
    for e in words:
        for h in e["homs"]:
            if h.get("senses"): kdlook.setdefault(e["ko"], h["senses"][0]["zh"])
    extra_look = jload(os.path.join(HERE, "bank_src", "lookup_extra.json")) if os.path.exists(os.path.join(HERE, "bank_src", "lookup_extra.json")) else {}
    for k, v in extra_look.items(): kdlook.setdefault(k, v)
    zh_by_ko = {}
    out = []
    for e in words:
        ko = e["ko"]; m = M.get(ko, {})
        zh_parts, hanja_won, poss, senses_all, tips, exs, syn, ant = [], [], [], [], [], [], [], []
        kpos0 = None; origin0 = None; won0 = None; pron0 = None
        for h in e["homs"]:
            ss = h.get("senses") or []
            kpos = h.get("kpos") or NPOS.get(h["pos"], "명사")
            if kpos0 is None: kpos0, origin0, won0, pron0 = kpos, h.get("origin"), h.get("wonEo"), h.get("pron")
            pz = POSZH.get(kpos, kpos)
            if pz not in poss: poss.append(pz)
            if h.get("wonEo"): hanja_won.append(h["wonEo"])
            elif h.get("hj"): hanja_won.append(h["hj"])
            toks = []
            used = set(x for p in zh_parts for x in p)
            for i, s_ in enumerate(ss):
                t = [x for x in split_zh(s_["zh"]) if good_tok(x) and x not in used and x not in toks]
                if not t: continue
                if i == 0: toks.extend(t[:2])
                elif len(e["homs"]) == 1 and len("".join(toks)) < 8 and len(toks) < 3: toks.append(t[0])
                if len(toks) >= 3: break
            anygood = any(good_tok(x) for s_ in ss for x in split_zh(s_["zh"]))
            if not toks and ss and not anygood:
                d = (ss[0].get("zhd") or "").strip("。")
                if d: toks = [d[:14] + ("…" if len(d) > 14 else "")]
            if toks: zh_parts.append(toks)
            senses_all += ss
            for s in ss[:1]:
                exs += s.get("ex", [])
            for s in ss:
                syn += s.get("syn", []); ant += s.get("ant", [])
            for o in h.get("homographs", []):
                hz = fmt_hanja([o["h"]]) if o["h"] else "固有词"
                oz = (split_zh(o["zh"]) or [""])[0]
                if oz and not any(oz in "".join(p) for p in zh_parts):
                    tips.append(ko + (("（" + hz + "）") if hz else "") + "＝" + oz)
        zh = "；".join(zh_join(p) for p in zh_parts)
        while len(zh) > 22 and "；" in zh: zh = zh.rsplit("；", 1)[0]
        if m.get("zh"): zh = m["zh"]
        zhs = split_zh(zh.replace("；", "，"))
        zh_by_ko[ko] = "、".join(zhs[:2]) if zhs and len("".join(zhs[:2])) <= 7 else (zhs[0] if zhs else "")
        pos = "/".join(poss)
        if pos in ("动词", "形容词") and ko.endswith("하다") and origin0 in ("한자어", "혼종어"): pos = pos + "（하다" + pos + "）"
        elif pos == "动词" and ko.endswith("되다") and origin0 in ("한자어", "혼종어"): pos = "动词（되다动词）"
        hanja = fmt_hanja(hanja_won)
        mem, ftip = auto_mem(ko, kpos0, won0, zhs, origin0)
        if not mem and origin0 in ("고유어", "혼종어", None, "외래어"):
            if origin0 == "외래어" and won0 and re.match(r"[A-Za-z]", won0): mem = "外来词：来自英语 " + won0 + "，按读音记。"
            else: mem = auto_native(ko, kpos0, zhs, kdlook, None)
        tip_parts = []
        if ftip: tip_parts.append(ftip)
        if pron0 and pron0.replace(" ", "") != ko.replace(" ", "") and re.fullmatch(r"[가-힣 ]+", pron0):
            tip_parts.append("发音 [" + pron0 + "]，拼写是 " + ko + "。")
        if tips: tip_parts.append("同形词：" + "；".join(tips[:2]) + "。")
        tip = " ".join(tip_parts)
        cat, how = classify(ko, kpos0, senses_all, hanja, zh)
        e_out = dict(ko=ko, zh=zh, pos=pos, lvl=e["lvl"], rank=e["rank"])
        if hanja: e_out["hanja"] = hanja
        e_out["mem"] = mem; e_out["tip"] = tip
        e_out["_syn"] = [x for x in dict.fromkeys(syn) if x and x != ko][:3]
        e_out["_ant"] = [x for x in dict.fromkeys(ant) if x and x != ko][:2]
        if exs: e_out["ex"] = exs[0]
        e_out["_cat"] = cat; e_out["_kpos"] = kpos0; e_out["_how"] = how
        # 只给有 1 个以上 “主要”中文对译的近义词候选
        e_out["_tok"] = zhs[:2]
        out.append(e_out)
    # 近义词候选：同一个中文对译 + 同一词性
    tokmap = collections.defaultdict(list)
    for e in out:
        for t in e["_tok"]:
            if len(t) >= 2 and good_tok(t): tokmap[(t, e["_kpos"])].append(e["ko"])
    for e in out:
        ko = e["ko"]; m = M.get(ko, {})
        def zz(w):
            if zh_by_ko.get(w): return zh_by_ko[w]
            t = [x for x in split_zh(kdlook.get(w, "")) if good_tok(x)]
            return t[0] if t else ""
        syn = [{"ko": w, "zh": zz(w)} for w in e.pop("_syn")]
        for t in e["_tok"]:
            for w in tokmap.get((t, e["_kpos"]), []):
                if w != ko and w not in [s["ko"] for s in syn] and not (w.startswith(ko) or ko.startswith(w)) and len(syn) < 3:
                    syn.append({"ko": w, "zh": zz(w)})
        ant = [{"ko": w, "zh": zz(w)} for w in e.pop("_ant")]
        e["syn"] = syn; e["ant"] = ant
        # 已有手写词条（wordinfo.json）优先，然后人工补充覆盖
        wi = WI.get(ko) or {}
        for k in ("pos", "hanja", "mem", "tip", "syn", "ant"):
            if wi.get(k): e[k] = wi[k]
        for k in ("zh", "pos", "hanja", "mem", "tip", "syn", "ant", "ex", "exzh"):
            if k in m: e[k] = m[k]
        if m.get("tipadd"): e["tip"] = (e.get("tip", "") + " " + m["tipadd"]).strip()
        if m.get("cat"): e["_cat"] = m["cat"]; e["_how"] = "manual"
        if not e["_cat"]:
            c = kw_class(e["zh"], e["_kpos"])
            if c: e["_cat"] = c; e["_how"] = "kw"
        if not e["_cat"]:
            # 派生词：去掉词尾查词根的主题
            e["_cat"] = None
        e.pop("_tok")
    bycat = {e["ko"]: e["_cat"] for e in out if e["_cat"]}
    for e in out:
        if not e["_cat"]:
            for suf in ("하다", "되다", "시키다", "스럽다", "적", "히", "화", "성", "감", "력", "자", "상", "롭다"):
                if e["ko"].endswith(suf) and e["ko"][:-len(suf)] in bycat:
                    e["_cat"] = bycat[e["ko"][:-len(suf)]]; e["_how"] = "root"; break
        if not e["_cat"]:
            e["_cat"] = {"형용사": "state", "동사": "action"}.get(e["_kpos"], "abstract"); e["_how"] = "pos"
        if e["_cat"] in ("state",) and e["_kpos"] == "동사": e["_cat"] = "action"
    # 高频：频度排名 + 阅读真题加权
    def inpaper(e):
        ko = e["ko"]
        if ko in lem: return True
        if len(ko) >= 2 and not ko.endswith("다") and ko in rtext: return True
        if ko.endswith("다") and len(ko) >= 4 and ko[:-1] in rtext: return True
        return False
    for e in out:
        e["paper"] = inpaper(e)
        e["_score"] = e["rank"] / (2.0 if e["paper"] else 1.0)
    out.sort(key=lambda e: (e["_score"], e["rank"]))
    for i, e in enumerate(out): e["hf"] = 1 if i < HF_N else 0
    hf = out[:HF_N]; rest = sorted(out[HF_N:], key=lambda e: e["rank"])
    order = hf + rest
    def enriched(e):
        return bool(e.get("pos") and e.get("mem") and (e.get("syn") or e.get("ant")) and e.get("zh"))
    st = collections.Counter()
    for e in order:
        st["total"] += 1; st["lvl" + e["lvl"]] += 1
        if e["hf"]: st["hf"] += 1; st["hf_lvl" + e["lvl"]] += 1
        if enriched(e): st["enriched"] += 1; st["hf_enriched" if e["hf"] else "rest_enriched"] += 1
        if not e.get("mem"): st["no_mem"] += 1; st["hf_no_mem" if e["hf"] else "rest_no_mem"] += 1
        if not e.get("zh"): st["no_zh"] += 1
        if e["paper"]: st["paper"] += 1
        st["how_" + str(e["_how"])] += 1
    cc = collections.Counter(e["_cat"] for e in order); chf = collections.Counter(e["_cat"] for e in hf)
    print(dict(st)); print({c: (cc[c], chf[c]) for c in CAT_IDS})
    if stats_only: return order
    # 输出
    bd = os.path.join(SITE, "bank"); os.makedirs(bd, exist_ok=True)
    for f in glob.glob(os.path.join(bd, "o-*.json")) + glob.glob(os.path.join(bd, "c-*.json")): os.remove(f)
    DK = ("pos", "hanja", "mem", "tip", "syn", "ant", "ex", "exzh")
    def det(e):
        d = {}
        for k in DK:
            v = e.get(k)
            if v: d[k] = v
        return d
    idx = []
    for i, e in enumerate(order):
        ps = e["pos"].split("（")[0].split("/")
        idx.append([e["ko"], e["zh"], CAT_IDS.index(e["_cat"]), 1 if e["lvl"] == "B" else 2, e["hf"], "/".join(POS_SHORT.get(p, p[:1]) for p in ps), 1 if enriched(e) else 0])
    for c0 in range(0, len(order), ORDER_CHUNK):
        part = order[c0:c0 + ORDER_CHUNK]
        json.dump({e["ko"]: det(e) for e in part}, open(os.path.join(bd, "o-%02d.json" % (c0 // ORDER_CHUNK)), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    for cid in CAT_IDS:
        part = [e for e in order if e["_cat"] == cid]
        json.dump({e["ko"]: det(e) for e in part}, open(os.path.join(bd, "c-%s.json" % cid), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    import datetime
    import hashlib
    hh = hashlib.md5()
    for f in sorted(glob.glob(os.path.join(bd, "o-*.json")) + glob.glob(os.path.join(bd, "c-*.json"))): hh.update(open(f, "rb").read())
    meta = dict(version=1, build=hh.hexdigest()[:10], updated=datetime.date.today().isoformat(), chunk=ORDER_CHUNK, hfN=HF_N,
                counts=dict(total=len(order), B=st["lvlB"], C=st["lvlC"], hf=st["hf"], hfB=st["hf_lvlB"], hfC=st["hf_lvlC"], enriched=st["enriched"], paper=st["paper"]),
                cats=[dict(id=c[0], emoji=c[1], name=c[2], desc=c[3], n=cc[c[0]], hf=chf[c[0]]) for c in CATS],
                fields=["ko", "zh", "cat", "lvl(1=中级B,2=高级C)", "hf", "pos", "enriched"], words=idx)
    json.dump(meta, open(os.path.join(bd, "index.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    tot = sum(os.path.getsize(f) for f in glob.glob(os.path.join(bd, "*.json")))
    print("wrote bank/: index %d KB, total %d KB" % (os.path.getsize(os.path.join(bd, "index.json")) // 1024, tot // 1024))
    return order
if __name__ == "__main__": main()
