/* 📊 单词错误统计（闪卡 + 词库 共用）：localStorage topik.wstat.v1（经 sync.js 同步）
   w[韩语]={a:{zk,kz} 作答次数, b:{zk,kz,x} 答错次数, tb 计数开始后的答错次数, d:{日期:错次}, last 最后答错时间, c:{卡片信息}}
   - a / tb 从启用这个功能起开始记（老的词库记录 n/bad 会一次性并进来）；b 包含错词本里的旧次数（x=旧记录不知道方向）
   - 错误率 = tb / (a.zk+a.kz)，只算有作答记录的部分 */
(function(root){
"use strict";
var LS="topik.wstat.v1", LS_WRONG="topik.wrong.v1", LS_BANK="topik.bank.v1";
var CARD_F=["zh","hint","ex","exzh","date","pos","hanja","mem","tip","syn","ant","voice","pair"];
var DIR={v_zh_ko:"zk",v_ko_zh:"kz",zh2ko:"zk",ko2zh:"kz"};
function jget(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}}
function shDay(ts){return new Date((+ts||Date.now())+288e5).toISOString().slice(0,10)}
function sum(o){var s=0;for(var k in (o||{}))s+=+o[k]||0;return s}
function load(){var s=jget(LS);s=s&&typeof s==="object"?s:{};s.w=s.w&&typeof s.w==="object"?s.w:{};if(!s.seed)seed(s);return s}
function save(s){try{localStorage.setItem(LS,JSON.stringify(s))}catch(e){}}
function seed(s){   // 第一次：把错词本次数和词库记录并进来
  var wr=jget(LS_WRONG)||{}, bk=jget(LS_BANK)||{};
  Object.keys(wr).forEach(function(k){var e=wr[k];if(!e||e.t!=="v"||!e.ko)return;
    var r=s.w[e.ko]||(s.w[e.ko]={}); r.b=r.b||{};
    r.b.zk=Math.max(+r.b.zk||0,+(e.m||{}).v_zh_ko||0); r.b.kz=Math.max(+r.b.kz||0,+(e.m||{}).v_ko_zh||0);
    var d=e.d&&typeof e.d==="object"&&Object.keys(e.d).length?e.d:null;
    if(!d){d={};var t=sum(e.m)||1;if(e.last){d[shDay(e.last)]=1;if(t>1)d.early=t-1}else d.early=t}
    r.d=r.d||{}; for(var x in d) r.d[x]=Math.max(+r.d[x]||0,+d[x]||0);
    var ds=sum(r.d), bs=sum(r.b); if(ds>bs) r.b.x=(+r.b.x||0)+(ds-bs);
    r.last=Math.max(+r.last||0,+e.last||0)||undefined;
    r.c=r.c||{}; CARD_F.forEach(function(f){if(e[f]!=null&&r.c[f]==null)r.c[f]=e[f]});
  });
  Object.keys((bk&&bk.w)||{}).forEach(function(ko){var q=bk.w[ko];if(!q||!q.n)return;
    var r=s.w[ko]||(s.w[ko]={}); r.a=r.a||{}; r.a.x=(+r.a.x||0)+(+q.n||0); r.tb=(+r.tb||0)+(+q.bad||0);   // 词库旧记录：作答 n、错 bad（不分方向）
    var bs=sum(r.b); if((+q.bad||0)>bs){r.b=r.b||{};r.b.x=(+r.b.x||0)+((+q.bad)-bs)}
    if(q.bad&&!r.c){r.c={date:"词库"}}
  });
  s.seed=Date.now(); save(s);
}
/* 记一次作答。c={ko,zh,...}，mode=v_zh_ko|v_ko_zh */
function rec(c,mode,ok){
  if(!c||!c.ko) return;
  var s=load(), r=s.w[c.ko]||(s.w[c.ko]={}), dk=DIR[mode]||"zk";
  r.a=r.a||{}; r.a[dk]=(+r.a[dk]||0)+1;
  if(!ok){
    r.b=r.b||{}; r.b[dk]=(+r.b[dk]||0)+1; r.tb=(+r.tb||0)+1;
    r.d=r.d||{}; var t=shDay(); r.d[t]=(+r.d[t]||0)+1; r.last=Date.now();
    r.c=r.c||{}; CARD_F.forEach(function(f){var v=c[f]; if(v!=null&&v!==""&&!(Array.isArray(v)&&!v.length)) r.c[f]=v});
  }
  save(s);
}
function misses(r){return sum(r&&r.b)}
function tries(r){return sum(r&&r.a)}
function lastDay(r){if(r.last)return shDay(r.last);var ks=Object.keys(r.d||{}).filter(function(k){return k!=="early"}).sort();return ks.length?ks[ks.length-1]:(r.d&&r.d.early?"early":"")}

/* ---------- 分类 ---------- */
var CTX=null;
function gj(u,nc){return fetch(u+(nc?(u.indexOf("?")<0?"?":"&")+"v="+Date.now():""),{cache:nc?"no-store":"default"}).then(function(r){return r.ok?r.json():null}).catch(function(){return null})}
var POSN={"名":"名词","动":"动词","形":"形容词","副":"副词"};
function posName(p){p=String(p||"").split("/")[0].trim();if(!p)return "";var f=p.charAt(0);return POSN[f]||(/^(名词|动词|形容词|副词)$/.test(p)?p:"其他")}
var DIMS=[["theme","📅 每日主题 / 分类卡组"],["pos","🔤 词性"],["vo","🔁 动词 自动/他动/被动/使动"],["bank","📚 词库分类"],["lvl","📶 级别"]];
function ctx(){
  if(CTX) return CTX;
  var V=root.TopikVoice;
  CTX=Promise.all([gj("decks/index.json",1),gj("decks/categories.json",1),gj("bank/index.json",1),gj("wordinfo.json",1),V&&V.load?V.load():null]).then(function(a){
    var idx=a[0]||[], cats=a[1]||[], bk=a[2], WI=a[3]||{}, meta={}, T={};
    function addT(ko,id){(T[ko]=T[ko]||[]).indexOf(id)<0&&T[ko].push(id)}
    var files=idx.map(function(e){meta["theme:"+e.date]={dim:"theme",label:(e.theme||e.date),sub:e.date.slice(5).replace("-","/")};return e.date})
      .concat(cats.map(function(c){meta["theme:"+c.id]={dim:"theme",label:(c.emoji?c.emoji+" ":"")+c.name,sub:"分类卡组"};return c.id}));
    var BK={};
    if(bk&&bk.words){bk.cats.forEach(function(c){meta["bank:"+c.id]={dim:"bank",label:c.emoji+" "+c.name}});
      bk.words.forEach(function(x){BK[x[0]]={cat:bk.cats[x[2]].id,lvl:x[3],hf:x[4],pos:x[5],zh:x[1]}})}
    ["名词","动词","形容词","副词","其他"].forEach(function(p){meta["pos:"+p]={dim:"pos",label:p}});
    ["自","他","自他","被动","使动"].forEach(function(v){meta["vo:"+v]={dim:"vo",label:"动词·"+((V&&V.NAME[v])||v)}});
    meta["lvl:1"]={dim:"lvl",label:"中级（词库B）"};meta["lvl:2"]={dim:"lvl",label:"高级（词库C）"};meta["lvl:hf"]={dim:"lvl",label:"⭐ 高频"};meta["lvl:0"]={dim:"lvl",label:"词库外（只在每日/分类卡组）"};
    return Promise.all(files.map(function(f){return gj("decks/"+f+".json").then(function(d){(d&&d.vocab||[]).forEach(function(v){addT(v.ko,"theme:"+f);if(v.pos&&!WI[v.ko+"\u0000pos"])WI[v.ko+"\u0000pos"]=v.pos;if(v.voice)WI[v.ko+"\u0000vo"]=v.voice})})})).then(function(){
      function catsOf(ko,r){
        var c=(r&&r.c)||{}, b=BK[ko], out=(T[ko]||[]).slice();
        if(!out.length&&c.date&&/^(\d{4}-\d{2}-\d{2}|cat-.+)$/.test(c.date)&&meta["theme:"+c.date]) out.push("theme:"+c.date);
        var pos=c.pos||(WI[ko]&&WI[ko].pos)||WI[ko+"\u0000pos"]||(b&&b.pos)||"", pn=posName(pos); if(pn) out.push("pos:"+pn);
        var vv=V&&V.of?V.of({ko:ko,zh:c.zh||(b&&b.zh)||"",pos:pos,voice:c.voice||(WI[ko]&&WI[ko].voice)||WI[ko+"\u0000vo"]}):null; if(vv&&meta["vo:"+vv.voice]) out.push("vo:"+vv.voice);
        if(b){out.push("bank:"+b.cat);out.push("lvl:"+b.lvl);if(b.hf)out.push("lvl:hf")} else out.push("lvl:0");
        return out;
      }
      return {meta:meta,catsOf:catsOf,dims:DIMS,bank:BK};
    });
  });
  CTX.catch(function(){CTX=null});
  return CTX;
}
/* 解析 URL 里的 cat：pos:动词 / 动词 / theme:2026-10-12 / 복지 … → id 或 null */
function resolveCat(meta,q){
  if(!q) return null; q=String(q); if(meta[q]) return q;
  var ks=Object.keys(meta), i;
  for(i=0;i<ks.length;i++) if(meta[ks[i]].label===q||ks[i].split(":")[1]===q) return ks[i];
  for(i=0;i<ks.length;i++) if(meta[ks[i]].label.indexOf(q)>=0) return ks[i];
  if(meta["vo:"+q.replace(/^动词·?/,"").replace(/动$/,"")]) return "vo:"+q.replace(/^动词·?/,"").replace(/动$/,"");
  return null;
}
/* 所有答错过的词：[{ko,r,n,cats,...}]，按次数降序 */
function rows(X){
  var s=load(), out=[];
  Object.keys(s.w).forEach(function(ko){var r=s.w[ko],n=misses(r);if(!n)return;out.push({ko:ko,r:r,n:n,zh:(r.c&&r.c.zh)||(X.bank[ko]&&X.bank[ko].zh)||"",last:lastDay(r),cats:X.catsOf(ko,r)})});
  out.sort(function(a,b){return b.n-a.n||((b.r.last||0)-(a.r.last||0))});
  return out;
}
/* 每个类别汇总（只统计 dim 这个维度；dim 为空=全部维度） */
function summary(X,dim){
  var s=load(), agg={};
  Object.keys(s.w).forEach(function(ko){var r=s.w[ko],n=misses(r),a=tries(r);if(!n&&!a)return;
    X.catsOf(ko,r).forEach(function(id){var m=X.meta[id];if(!m||(dim&&m.dim!==dim))return;
      var g=agg[id]||(agg[id]={id:id,label:m.label,sub:m.sub||"",dim:m.dim,words:0,miss:0,tries:0,tb:0,m2:0});
      if(n){g.words++;g.miss+=n;if(n>=2)g.m2++}
      if(a){g.tries+=a;g.tb+=Math.min(+r.tb||0,a)}
    })});
  var L=Object.keys(agg).map(function(k){var g=agg[k];g.rate=g.tries>=5?g.tb/g.tries:null;return g}).filter(function(g){return g.words});
  L.sort(function(a,b){return b.miss-a.miss||((b.rate||0)-(a.rate||0))||b.words-a.words});
  return L;
}
/* 选练习的词 → 闪卡卡片 */
function pick(X,o){
  o=o||{}; var min=Math.max(1,+o.min||1), cid=o.cat?resolveCat(X.meta,o.cat):null;
  var L=rows(X).filter(function(x){return x.n>=min&&(!cid||x.cats.indexOf(cid)>=0)});
  if(o.top) L=L.slice(0,+o.top);
  var wr=jget(LS_WRONG)||{};
  return {cat:cid,label:cid?X.meta[cid].label:"",cards:L.map(function(x){
    var c={t:"v",ko:x.ko}, src=x.r.c||{}, e=wr["v|"+x.ko]||{};
    CARD_F.forEach(function(f){var v=e[f]!=null?e[f]:src[f];if(v!=null)c[f]=v});
    if(!c.zh) c.zh=x.zh; if(!c.date) c.date="词库"; if(!c.pos&&X.bank[x.ko]) c.pos=X.bank[x.ko].pos;
    c._n=x.n; return c})};
}
root.TopikWStat={LS:LS,load:load,rec:rec,ctx:ctx,rows:rows,summary:summary,pick:pick,resolveCat:resolveCat,misses:misses,tries:tries,lastDay:lastDay,posName:posName,DIMS:DIMS};
})(window);
