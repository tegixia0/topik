"""Build reading/rounds.json.
Two kinds of official source:
  * PDF_ROUNDS (60/83/91/96): official 2교시 PDFs parsed by tools/reading_parse.py / OCR → tools/reading_src/{round}.json
  * WEB_ROUNDS (35/36/37/41/47/52/64/102): topik.go.kr「토픽 기출문제 풀어보기」official reading scripts
    https://www.topik.go.kr/asset/exam/exam{n}/exam_{n}_2_r.js (text + answer key ca) →
    node tools/reading_src/parse_exam_r.js tools/reading_src/official {n} → tools/reading_src/official/{n}.json →
    tools/reading_official.py; 5–10 images: /asset/exam/exam{n}/images/{n}_2_2_{q}.png → reading/img/r{n}_q{q}.png
Annotations (Chinese translation / 解析 / 生词, self-written): tools/rd{round}.py — optional for WEB_ROUNDS
(questions without one are still playable, shown as “暂无解析”)."""
import json, re, importlib.util, os
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.dirname(HERE)
PDF_ROUNDS=[91,83,96,60]
WEB_ROUNDS=[102,64,52,47,41,37,36,35]
ROUNDS=sorted(PDF_ROUNDS+WEB_ROUNDS,reverse=True)
# year as listed on topik.go.kr (「2025년도 제102회 …」)
YEAR={35:'2014年',36:'2014年',37:'2014年',41:'2015年',47:'2016年',52:'2017年',60:'2018年',64:'2019年',83:'2022年',91:'2023年',96:'2024年',102:'2025年'}
HIDDEN='官方因版权未公开原文（저작권 관련 법령에 따라 지문 비공개）'
TYPES=[('grammar','语法填空',1,2),('synonym','近义表达替换',3,4),('ad','看图/广告主题',5,8),('match','内容一致(图表/短文)',9,12),
('order','排序',13,15),('blank','短文填空',16,18),('long','长文(填空+主旨/一致)',19,24),('headline','新闻标题',25,27),
('blank2','填空(说明文)',28,31),('match2','内容一致(说明文)',32,34),('theme','主旨',35,38),('insert','插入句子',39,41),('long2','长文(心情/态度/目的/填空)',42,50)]
def qtype(n):
    for t,l,a,b in TYPES:
        if a<=n<=b: return t
def sub(stem,n,t):
    s=stem or ''
    if '심정' in s: return '人物心情'
    if '태도' in s: return '作者态度'
    if '목적' in s: return '写作目的'
    if '주제' in s or '중심 생각' in s: return '主旨'
    if '같은 것' in s or '알 수 있는' in s: return '内容一致'
    if '보기' in s: return '插入句子'
    if '들어갈' in s: return '填空'
    return ''
def load(r):
    f=os.path.join(HERE,f'rd{r}.py')
    if not os.path.exists(f): return None
    spec=importlib.util.spec_from_file_location(f'rd{r}',f); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
import sys; sys.path.insert(0,HERE); import reading_official as RO
EMPTY=dict(tr='',k='',e='',o=[],v='',g='')
def web_round(r,out):
    m=load(r); ann=getattr(m,'ANN',{}) if m else {}
    skip={}; cnt=0; nann=0
    for q in RO.round_qs(r):
        n=q['n']
        if q['hidden']: skip[n]=HIDDEN if not skip else '同上'; continue
        a=ann.get(n) or EMPTY
        if a.get('e'): nann+=1
        gid=None; passage=q['passage']
        if q['group']:
            ga,gb=q['group']; gid=f'{r}-{ga}-{gb}'
            if gid not in out['groups']:
                out['groups'][gid]={'passage':q['gpassage'],'tr':(ann.get(ga) or {}).get('gtr') or (ann.get(ga) or {}).get('tr',''),'range':[ga,gb]}
        t=qtype(n)
        v=[x.split('|') for x in (a.get('v') or '').split(';') if x.strip()]
        out['questions'].append({'id':f'{r}-{n}','round':r,'n':n,'type':t,'sub':sub(q['stem'],n,t),'gid':gid,
            'instr':q['instr'],'stem':q['stem'],'passage':passage,'bogi':q['bogi'],'img':f'reading/img/r{r}_q{n}.png' if q['img'] else '',
            'opts':q['opts'],'ans':q['ans'],'tr':a.get('tr','') if not gid else '','k':a.get('k',''),'e':a.get('e',''),'o':a.get('o',[]),'v':v,'g':a.get('g','')})
        cnt+=1
    out['rounds'].append({'round':r,'label':f'第{r}回','date':YEAR.get(r,''),'count':cnt,'ann':nann,'src':'web','skipped':{str(k):v for k,v in skip.items()}})
def fix(txt,rules):
    for a,b in rules:
        if a and a in txt: txt=txt.replace(a,b)
    return txt
def clean(t):
    t=re.sub(r'\(\s+(㉠|㉡|㉢|㉣)\s+\)',r'( \1 )',t)
    t=re.sub(r'\(\s{2,}\)','(          )',t)
    t=re.sub(r' *\n *','\n',t)
    return t.strip()
out={'rounds':[],'types':[{'id':t,'label':l,'range':f'{a}–{b}'} for t,l,a,b in TYPES],'questions':[],'groups':{}}
for r in ROUNDS:
    if r in WEB_ROUNDS: web_round(r,out); continue
    src=json.load(open(os.path.join(HERE,'reading_src',f'{r}.json')))
    m=load(r); key=[int(x)-1 for x in m.KEY.split()]; assert len(key)==50
    skip=getattr(m,'SKIP',{})
    cnt=0
    for q in src:
        n=q['n']
        if n in skip: continue
        a=m.ANN[n]; rules=m.FIX.get(n,[])
        paras=list(q['passage']); bogi=q['bogi']
        if 39<=n<=41 and not bogi and paras:  # newer papers: given sentence printed first
            bogi=paras[0]; paras=paras[1:]
        passage=clean(fix('\n'.join(paras),rules))
        if n in getattr(m,'TEXT',{}): passage=m.TEXT[n]
        img=f'reading/img/r{r}_q{n}.png' if 5<=n<=10 else ''
        gid=None
        if q['group']:
            ga,gb=q['group']; gid=f'{r}-{ga}-{gb}'
            if gid not in out['groups']:
                grules=[]
                for k in range(ga+1,gb+1): grules+=m.FIX.get(k,[])
                out['groups'][gid]={'passage':clean(fix(passage if n==ga else passage,grules)),'tr':m.ANN[ga]['tr'],'range':[ga,gb]}
            passage=''
        v=[x.split('|') for x in a['v'].split(';') if x.strip()]
        t=qtype(n)
        out['questions'].append({'id':f'{r}-{n}','round':r,'n':n,'type':t,'sub':sub(q['stem'],n,t),'gid':gid,
            'instr':re.sub(r'\s+',' ',q['instr']).replace('(   )','(　)'),'stem':q['stem'],'passage':passage,'bogi':fix(bogi,rules),'img':img,
            'opts':q['opts'],'ans':key[n-1],'tr':a['tr'] if not gid else '','k':a['k'],'e':a['e'],'o':a['o'],'v':v,'g':a['g']})
        cnt+=1
    out['rounds'].append({'round':r,'label':f'第{r}回','date':YEAR.get(r,''),'count':cnt,'ann':cnt,'src':'pdf','skipped':{str(k):v for k,v in skip.items()}})
os.makedirs(os.path.join(ROOT,'reading'),exist_ok=True)
json.dump(out,open(os.path.join(ROOT,'reading','rounds.json'),'w'),ensure_ascii=False,separators=(',',':'))
from collections import Counter
print('questions',len(out['questions']),'groups',len(out['groups']))
print(Counter(q['type'] for q in out['questions']))
for q in out['questions']:
    assert len(q['opts'])==4 and all(q['opts']), q['id']
    assert len(q['o']) in (0,4), q['id']
    assert 0<=q['ans']<=3, q['id']
for r in out['rounds']: print(r['round'],r['count'],'题, 解析',r['ann'],'skipped',list(r['skipped']))
