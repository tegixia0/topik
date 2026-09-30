"""Build reading/rounds.json from parsed official papers (tools/reading_src/{round}.json,
produced by tools/reading_parse.py from the official 2교시 PDFs) + annotations tools/rd{round}.py."""
import json, re, importlib.util, os
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.dirname(HERE)
ROUNDS=[91,83,96,60]
YEAR={60:'2018年10月',83:'2022年10月',91:'2023年11月',96:'2024年10月'}
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
    spec=importlib.util.spec_from_file_location(f'rd{r}',os.path.join(HERE,f'rd{r}.py')); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
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
    out['rounds'].append({'round':r,'label':f'第{r}回','date':YEAR.get(r,''),'count':cnt,'skipped':{str(k):v for k,v in skip.items()}})
os.makedirs(os.path.join(ROOT,'reading'),exist_ok=True)
json.dump(out,open(os.path.join(ROOT,'reading','rounds.json'),'w'),ensure_ascii=False,separators=(',',':'))
from collections import Counter
print('questions',len(out['questions']),'groups',len(out['groups']))
print(Counter(q['type'] for q in out['questions']))
for q in out['questions']:
    assert len(q['o'])==4 and all(q['opts']), q['id']
