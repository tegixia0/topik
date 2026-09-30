"""tools/grammar_data.py → grammar/grammar.json (with auto-check keys)."""
import json, re, os, itertools
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.dirname(HERE)
import sys; sys.path.insert(0,HERE)
import grammar_data as gd
H=re.compile(r'[^가-힣ㄱ-ㅎ]')
def expand(form):
    outs=set()
    for part in re.split(r'／',form):
        part=part.strip()
        part=re.sub(r'^(N|V|A)\s*','',part); part=part.replace('N','').replace('V-','').replace('A-','')
        opts=[part]
        # optional parentheses
        res=[]
        for p in opts:
            pieces=re.split(r'(\([^)]*\))',p); choices=[]
            for pc in pieces:
                if pc.startswith('('): choices.append(['',pc[1:-1]])
                else: choices.append([pc])
            for combo in itertools.product(*choices): res.append(''.join(combo))
        res2=[]
        for p in res:
            # x/y single-char alternatives
            pieces=re.split(r'([가-힣ㄱ-ㅎ]/[가-힣ㄱ-ㅎ])',p); choices=[]
            for pc in pieces:
                if re.fullmatch(r'[가-힣ㄱ-ㅎ]/[가-힣ㄱ-ㅎ]',pc): choices.append(pc.split('/'))
                else: choices.append([pc])
            for combo in itertools.product(*choices): res2.append(''.join(combo))
        for p in res2:
            k=H.sub('',p).replace('으ㄴ','은').replace('으ㄹ','을').replace('으ㅁ','음')
            if re.search(r'으는|으[아-힣]*ㄴ가',k): continue
            if k: outs.add(k)
    return sorted(outs,key=len,reverse=True)
EXTRA={'dammalida':['단말이다','란말이다','단말이에요'],'ina':['나마','이나마'],'irado':['라도','이라도'],'yamalro':['야말로','이야말로'],
 'mulron':['은물론','는물론','물론','은물론이고','는물론이고'],'gineunkeonyeong':['기는커녕','은커녕','는커녕','커녕'],'nabo':['나보다','은가보다','ㄴ가보다','나봐요'],
 'tase':['탓에','는탓에','은탓에','ㄴ탓에'],'deokbun':['덕분에','은덕분에','ㄴ덕분에'],'lgeol':['을걸','ㄹ걸','을걸요','ㄹ걸요'],'janayo':['잖아요','잖아'],'geodeunyo':['거든요'],'neurago':['느라','느라고'],
 'lsubakke':['을수밖에없다','ㄹ수밖에없다','수밖에없다'],'bwatja':['아봤자','어봤자','봤자','아봐야','어봐야'],'nota':['아놓다','어놓다','놓다'],'duda':['아두다','어두다','두다']}
cats=dict(gd.CATS)
out={'cats':[{'id':k,'label':v} for k,v in gd.CATS],'cmp':gd.CMP,'items':[]}
for g in gd.G:
    keys=expand(g['f'])+EXTRA.get(g['id'],[])
    fills=[]
    for f in g['fill']:
        ko,zh,ans=f.split('｜'); fills.append({'ko':ko,'zh':zh,'ans':[a.strip() for a in ans.split('/')]})
    ex=[]
    for e in g['ex']:
        p=e.split('｜'); ex.append({'ko':p[0],'zh':p[1],'src':p[2] if len(p)>2 else ''})
    out['items'].append({**{k:g[k] for k in ('id','f','cat','zh','mem','join','use','err','cmp')},'ex':ex,'fill':fills,'keys':sorted(set(keys))})
os.makedirs(os.path.join(ROOT,'grammar'),exist_ok=True)
json.dump(out,open(os.path.join(ROOT,'grammar','grammar.json'),'w'),ensure_ascii=False,separators=(',',':'))
print('items',len(out['items']),'cmp',len(out['cmp']),'real-ex',sum(1 for i in out['items'] for e in i['ex'] if e['src'].startswith('真题')))
for i in out['items'][:6]+out['items'][40:44]: print(i['f'],i['keys'])
