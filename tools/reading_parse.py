import re, subprocess, json, sys
OPT='①②③④'
JOIN=set('참여|하기 영구적|으로 집중|하다 촬영|하는 방지|하기 가능|하도록 사람|들이 오후|였다. 중이|었다. 답변|하고 효율적|으로 안전|벨트를 수거|하기가 초등|학생들을 빠져|나와 전화|번호를 높아지는|지를 회사|에서 면허증|을 운전|해야 나이팅게|일이다. 설득|함으로써 왼쪽|으로 계획|이다. 세금|이다. 세대|들은 따뜻|함에 보존|되도록 방법만|으로는'.split())
SUF=re.compile(r'^(하(기|는|다|도록|였|고|게|며|지|면|여)|했|으로|들이|들은|들을|들의|적으로|었다|였다)')
def pg(pdf,p):
    t=subprocess.run(['pdftotext','-f',str(p),'-l',str(p),'-layout',pdf,'-'],capture_output=True,text=True).stdout
    t=t.replace('～','~').replace('－','-').replace('∼','~')
    t=re.sub(r'[\uE000-\uF8FF\U000F0000-\U000FFFFF]','',t)
    return t
def joinlines(ls):
    # ls: list of (indent,text); returns list of paragraphs
    if not ls: return []
    base=min(i for i,_ in ls)
    paras=[]; cur=''
    for k,(ind,s) in enumerate(ls):
        newp = k>0 and ind>=base+2 and not s.startswith('(')
        if s.startswith('<보') : newp=True
        if newp and cur: paras.append(cur); cur=''
        if not cur: cur=s
        else:
            prev=cur
            if (prev.split()[-1]+'|'+s.split()[0]) in JOIN:
                cur=prev+s
            else: cur=prev+' '+s
    if cur: paras.append(cur)
    return paras
def parse(pdf,a,b):
    ev=[]
    for p in range(a,b+1):
        for ln in pg(pdf,p).split('\n'):
            s=ln.strip()
            if not s: continue
            if re.match(r'^제\s*\d+\s*회',s) or re.match(r'^\d{1,2}$',s) or s.startswith('TOPIK'): continue
            ind=len(ln)-len(ln.lstrip())
            m=re.match(r'^※\s*\[(\d+)~(\d+)\]\s*(.*)$',s)
            if m: ev.append(['H',int(m[1]),int(m[2]),m[3],p]); continue
            m=re.match(r'^(\d{1,2})\.\s*(.*)$',s)
            if m and ind<8: ev.append(['Q',int(m[1]),m[2],p,ind]); continue
            if s[0] in OPT: ev.append(['O',s]); continue
            ev.append(['T',s,ind])
    res={}; hdr=None; q=None; groups={}; cont=False
    for k,e in enumerate(ev):
        if e[0]=='H':
            hdr={'a':e[1],'b':e[2],'instr':e[3],'lines':[],'page':e[4]}; groups[(e[1],e[2])]=hdr; q=None; cont=True
        elif e[0]=='Q' and hdr is None: continue
        elif e[0]=='Q':
            q={'n':e[1],'first':e[2],'lines':[],'opts':[],'page':e[3],'hdr':(hdr['a'],hdr['b'])}; res[e[1]]=q
        elif e[0]=='O': q['opts'].append(e[1])
        else:
            if hdr is None: continue
            if q is None:
                if cont and re.search(r'점\)$',e[1]) and not hdr['lines']:
                    hdr['instr']+=' '+e[1]; continue
                hdr['lines'].append((e[2],e[1]))
            else: q['lines'].append((e[2],e[1]))
    out=[]
    for n in sorted(res):
        r=res[n]; h=groups[r['hdr']]
        o=' '.join(r['opts']); opts={}; key=None
        for x in re.split(r'([①②③④])',o):
            if x in OPT: key=x
            elif key: opts[key]=re.sub(r'\s+',' ',x).strip()
        group = bool(h['lines'])
        if group:
            passage=joinlines(h['lines']); stem=r['first']; own=r['lines']
        else:
            own=[]
            ls=([(99,r['first'])] if r['first'] else [])+r['lines']
            if ls and ls[0][0]==99: ls[0]=(min([i for i,_ in ls[1:]] or [0])+2,ls[0][1])
            passage=joinlines(ls); stem=''
        bogi=''
        allp=passage+joinlines(own) if group else passage
        # extract bogi
        np=[]
        for pgh in (passage if not group else passage):
            np.append(pgh)
        if not group:
            for i,pgh in enumerate(passage):
                if pgh.startswith('<보'):
                    bogi=' '.join(passage[i:]).replace('<보 기>','').replace('<보기>','').strip(); passage=passage[:i]; break
        else:
            ownp=joinlines(own)
            for i,pgh in enumerate(ownp):
                if pgh.startswith('<보'):
                    bogi=' '.join(ownp[i:]).replace('<보 기>','').replace('<보기>','').strip()
        out.append({'n':n,'group':[h['a'],h['b']] if group else None,'instr':h['instr'],'stem':stem,'passage':passage,'bogi':bogi,'opts':[opts.get(c,'') for c in OPT],'page':r['page']})
    return out
if __name__=='__main__':
    pdf,a,b,dst=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]),sys.argv[4]
    d=parse(pdf,a,b); json.dump(d,open(dst,'w'),ensure_ascii=False,indent=1)
    for q in d:
        print(f"## {q['n']} grp={q['group']} [{q['instr']}]")
        if q['stem']: print('  STEM:',q['stem'])
        if not q['group'] or q['n']==q['group'][0]:
            for p in q['passage']: print('  P:',p)
        if q['bogi']: print('  BOGI:',q['bogi'])
        print('  O:',' | '.join(q['opts']))
