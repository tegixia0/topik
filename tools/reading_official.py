"""Convert topik.go.kr「기출문제 풀어보기」official reading scripts (reading_src/official/{n}.json,
parsed from exam_{n}_2_r.js by reading_src/parse_exam_r.js) into the build format.
Text is official; only whitespace/line-wrap is normalised. Hard line-wraps copied from the
paper (<br/>) are re-joined; whether a wrap fell inside a word is decided by the wrap table
reading_src/official/wraps.json (generated once with a syllable-bigram spacing model, then
reviewed by hand)."""
import json, re, os
HERE=os.path.dirname(os.path.abspath(__file__)); OFF=os.path.join(HERE,'reading_src','official')
WR=os.path.join(OFF,'wraps.json')
WRAPS=json.load(open(WR)) if os.path.exists(WR) else {}
BR='\x00'
def ent(s):
    s=s.replace('&nbsp;',' ').replace('&nbsp',' ').replace('&middot;','·').replace('&middot','·').replace('&sup2;','²').replace('&sup2','²')
    s=s.replace('&lt;','<').replace('&gt;','>').replace('&amp;','&')
    return s
def segs(html):
    """split into (depth, text) segments by question_outline divs; <br> -> BR"""
    h=re.sub(r'<\s*/?\s*br\s*/?\s*>',BR,html,flags=re.I)
    h=re.sub(r'<\s*(/?)\s*U\b[^>]*>',lambda m:'<'+m.group(1)+'u>',h)
    h=re.sub(r'<u [^>]*>','<u>',h)
    h=re.sub(r'<\s*보\s*기\s*>','\x01',h)            # protect the literal <보기> marker
    out=[]; depth=0; pos=0; stack=[]
    for m in re.finditer(r'<div[^>]*>|</div>',h):
        t=h[pos:m.start()]
        if t.strip(' '+BR): out.append((depth,t))
        if m.group(0)=='</div>':
            if stack and stack.pop(): depth-=1
        else:
            qo='question_outline' in m.group(0); stack.append(qo)
            if qo: depth+=1
        pos=m.end()
    t=h[pos:]
    if t.strip(' '+BR): out.append((depth,t))
    return [(d,ent(re.sub(r'<(?!/?u>)[^>]+>','',t)).replace('\x01','<보기>')) for d,t in out]
BL='\x02'
# spaces the web script inserted where the printed line wrapped inside a word (checked against the PDF wording/spelling rules)
# typos in the web script, corrected to the official PDF wording (checked on the page images)
TEXTFIX={102:[('원기등','원기둥'),('층분한','충분한')],64:[('특징이 있 다 .','특징이 있다.'),('SNS상에서 이루어진다 ( ㉢ )','SNS상에서 이루어진다. ( ㉢ )')],52:[('노력이 필요하다..','노력이 필요하다.')]}
SPACEFIX={35:['수집 하려고','모양 에는'],41:['자리매김 되었다고','최대화 하고','활쏘기 에서는'],47:['교환 한다'],52:['상처 에는'],64:['보존 되어','판매 하는','달성 하는','출동 하거나','생물학자 이다','동물들 에게','서비 스를','떠들썩 팔랑나비']}
def tidy(s):
    s=s.replace('\u3000',' ').replace('∼','~').replace('～','~').replace('\U000f0854','『').replace('\U000f0855','』')
    s=s.replace('，',', ').replace('－','-')
    s=re.sub(r'(^|\n|\x00)\s*[(（](가|나|다|라)[)）]\s*',r'\1(\2) ',s)
    s=re.sub(r'（([가-라])）',r'(\1)',s)
    s=re.sub(r'\(\s*(㉠|㉡|㉢|㉣)\s*\)',r'( \1 )',s)
    s=re.sub(r'\(\s*\)',BL,s)
    s=re.sub(r'(?<![0-9])([.,!?])(?=[가-힣‘“(])',r'\1 ',s)          # 37/47 scripts dropped the space after punctuation
    s=re.sub(r'(\( (?:㉠|㉡|㉢|㉣) \)|'+BL+r')(?=[가-힣‘“])(?!에 )',r'\1 ',s)
    s=re.sub(r'(?<=[가-힣.,”’])(\( (?:㉠|㉡|㉢|㉣) \)|'+BL+')',r' \1',s)
    s=re.sub(r'(\( (?:㉠|㉡|㉢|㉣) \)|'+BL+r') ([.,])',r'\1\2',s)
    s=re.sub(r'[ \t]+',' ',s).replace(BL,'(          )')
    s=re.sub(r' *\n *','\n',s)
    return s.strip()
def unwrap(s,key,lines=False):
    """join hard-wrapped lines. lines=True keeps every break (order questions (가)…)."""
    parts=s.split(BR)
    out=''
    for i,p in enumerate(parts):
        if i==0: out=p; continue
        if lines or re.match(r'\s*(\((가|나|다|라)\)|（(가|나|다|라)）|<보\s*기>|<보기>)',p) or not p.strip() or not out.strip():
            out=out.rstrip()+'\n'+p.lstrip(); continue
        a=out.rstrip(); b=p.lstrip()
        if out!=a or p!=b: out=a+' '+b; continue          # explicit space at the wrap
        k=f'{key}|{a[-6:]}|{b[:6]}'
        out=a+('' if WRAPS.get(k)=='join' else ' ')+b
    return re.sub(r'\n{2,}','\n',out)
def junctions(r):
    """list hard wraps without explicit space (for building wraps.json)"""
    o=json.load(open(os.path.join(OFF,f'{r}.json'))); res=[]
    def scan(html,key):
        for d,t in segs(html):
            parts=t.split(BR)
            for i in range(1,len(parts)):
                a=parts[i-1]; b=parts[i]
                if a!=a.rstrip() or b!=b.lstrip() or not a.strip() or not b.strip(): continue
                if re.match(r'\s*(\(|（)(가|나|다|라)',b): continue
                res.append((f'{key}|{a.rstrip()[-6:]}|{b.lstrip()[:6]}',a.rstrip()[-6:],b.lstrip()[:6]))
    for q in o['qs'].values(): scan(q['title'],f"{r}-{q['n']}")
    for gi,g in enumerate(o['groups']): scan(g['sample'],f"{r}-g{g['qs'][0]}")
    return res
def hidden(s): return '공개하지 않습니다' in s or 'NOT disclosed' in s
def round_qs(r):
    out=_round_qs(r)
    for q in out:
        for a,b in TEXTFIX.get(r,[]):
            for f in ('passage','gpassage','bogi','stem'):
                if q[f]: q[f]=q[f].replace(a,b)
            q['opts']=[x.replace(a,b) for x in q['opts']]
        for w in SPACEFIX.get(r,[]):
            for f in ('passage','gpassage','bogi','stem'):
                if q[f]: q[f]=q[f].replace(w,w.replace(' ',''))
            q['opts']=[x.replace(w,w.replace(' ','')) for x in q['opts']]
    return out
def _round_qs(r):
    o=json.load(open(os.path.join(OFF,f'{r}.json'))); out=[]
    for g in o['groups']:
        instr=tidy(ent(re.sub(r'<[^>]+>','',re.sub(r'<\s*보\s*기\s*>','\x01',g['title']))).replace('\x01','<보기>'))
        instr=re.sub(r'^※\s*\[\s*\d+\s*[～~]\s*\d+\s*\]\s*','',instr)
        instr=re.sub(r'\(\s*\)\s*','( )',instr).replace('(          )','( )')
        instr=re.sub(r'(?<=[^ (])\(각 2',' (각 2',instr); instr=re.sub(r'([다.])\(각',r'\1 (각',instr)
        instr=re.sub(r'(\( \))(?=[가-힣])',r'\1',instr)
        ga,gb=g['qs'][0],g['qs'][-1]
        gp=None; ghid=False
        if g['end']==98:
            ghid=hidden(g['sample'])
            gp='\n'.join(tidy(unwrap(t,f'{r}-g{ga}')) for d,t in segs(g['sample']))
        for n in g['qs']:
            q=o['qs'][str(n)]; key=f'{r}-{n}'
            ss=segs(q['title']) if q['title']!='img' else []
            stem=passage=bogi=''
            if gp is not None:
                top=[t for d,t in ss if d==0]; inner=[t for d,t in ss if d>0]
                stem=tidy(unwrap(' '.join(top),key))
                if inner: bogi=tidy(unwrap(' '.join(inner),key))
            else:
                ps=[t for d,t in ss]
                pas=[t for t in ps if '㉠' in t]
                if 39<=n<=41 or (pas and len(ps)>1):
                    pa=pas[0] if pas else ps[-1]
                    bo=[t for t in ps if t is not pa]
                    # old style: <보기> nested inside the passage div
                    if '<보기>' in pa or '<보 기>' in pa:
                        i=pa.find('<보'); bo=[pa[i:]]+bo; pa=pa[:i]
                    passage=tidy(unwrap(pa,key)); bogi=tidy(unwrap(' '.join(bo),key))
                else:
                    passage=tidy(unwrap(BR.join(ps),key,lines=13<=n<=15))
            bogi=re.sub(r'^<보\s*기>\s*','',bogi).strip()
            opts=[tidy(ent(re.sub(r'<(?!/?u>)[^>]+>','',x))).replace('－','-').replace('–','-') for x in q['opts']]
            if 13<=n<=15: opts=[re.sub(r'\s*-\s*','-',x) for x in opts]
            out.append(dict(n=n,group=[ga,gb] if gp is not None else None,instr=instr,stem=stem,passage=passage if gp is None else '',
                gpassage=gp,hidden=ghid,bogi=bogi,opts=opts,ans=q['ans'],img=q['title']=='img'))
    return out
