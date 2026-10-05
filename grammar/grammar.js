/* TOPIK 中高级语法（中国人视角）—— 数据：grammar/grammar.json（由 tools/build_grammar.py 生成）
   分类针对性练习：整句中→韩打字 / 韩→中自评（不提示语法名），深链接 ?grammar=drill&cat=<id> */
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var LS_OPT="topik.grammar.opt.v1", LS_W="topik.grammar.wrong.v1", LS_DRILL="topik.grammar.drill.v1";
var D=null, byId={}, CAT={}, opt=load(LS_OPT,{tab:"list",mode:"fill",scope:"all"}), W=load(LS_W,{}), PROG=load(LS_DRILL,{}), R=null, search="";
var MODES={zh2ko:"中→韩（写语法）",fill:"句子填空（写形式）",ko2zh:"韩→中（自评）",sent:"整句 中→韩",sentzh:"整句 韩→中"};
var SENT_MODES={sent:1,sentzh:1};
function load(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v&&typeof v==="object"?v:d}catch(e){return d}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function toast(m){var t=$("toast");if(!t){alert(m);return}t.textContent=m;t.classList.add("show");clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove("show")},1800)}
function norm(s){return window.TopikAcc&&TopikAcc.normalize?TopikAcc.normalize(s):String(s||"").normalize("NFC").replace(/[^가-힣ㄱ-ㅎ]/g,"")}
function answerNorms(s){return window.TopikAcc&&TopikAcc.answerVariants?TopikAcc.answerVariants(s):[norm(s)]}
function answerList(xs){var out=[];xs.forEach(function(x){answerNorms(x).forEach(function(k){if(k&&out.indexOf(k)<0)out.push(k)})});return out}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function isSent(){return !!SENT_MODES[opt.mode]}
/* 每条语法的练习整句：优先自拟 prac，再补干净例句（去掉省略号） */
function drillsOf(it){
  var out=[], seen={};
  function push(e){
    if(!e||!e.ko||!e.zh) return;
    if(/…|\.\.\./.test(e.ko)||/…|\.\.\./.test(e.zh)) return;
    var k=e.ko; if(seen[k]) return; seen[k]=1;
    out.push({ko:e.ko,zh:e.zh});
  }
  (it.prac||[]).forEach(push);
  (it.ex||[]).forEach(push);
  return out;
}
function catCount(cid){return D.items.filter(function(it){return it.cat===cid}).length}
function catDrillCount(cid){
  var n=0; D.items.forEach(function(it){if(it.cat===cid)n+=drillsOf(it).length}); return n;
}
function ensure(){
  if(D) return Promise.resolve();
  return Promise.all([window.TopikAcc?TopikAcc.load():null,fetch("grammar/grammar.json?v="+Date.now().toString(36).slice(0,6),{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()})]).then(function(rs){var d=rs[1];
    D=d; byId={}; d.items.forEach(function(it){byId[it.id]=it}); CAT={}; d.cats.forEach(function(c){CAT[c.id]=c.label});
  });
}
function open(o){
  o=o||{};
  if(o.tab) opt.tab=o.tab;
  if(o.mode&&MODES[o.mode]) opt.mode=o.mode;
  if(o.scope) opt.scope=o.scope;
  save(LS_OPT,opt);
  $("gBody").innerHTML='<div class="card empty">加载中…</div>';
  ensure().then(function(){
    if(o.g&&byId[o.g]){opt.tab="list";search=byId[o.g].f}
    var drillCat=o.drillCat||(o.grammar==="drill"&&o.cat)||null;
    if(drillCat&&CAT[drillCat]){
      opt.tab="cards"; opt.scope=drillCat;
      /* 深链接默认中→韩整句；显式 mode=sentzh 才自评 */
      opt.mode=(o.mode&&MODES[o.mode])?o.mode:"sent";
      if(!isSent()) opt.mode="sent";
      save(LS_OPT,opt); newRound(); setTab("cards"); return;
    }
    if(o.grammar==="drill"){ setTab("drill"); return; }
    setTab(opt.tab,o.g);
  }).catch(function(e){$("gBody").innerHTML='<div class="card empty">语法数据加载失败：'+esc(e.message)+"</div>"});
}
function setTab(t,focus){
  if(["list","cmp","drill","cards","wrong"].indexOf(t)<0)t="list";
  opt.tab=t; save(LS_OPT,opt);
  Array.prototype.forEach.call(document.querySelectorAll("#gtabs button"),function(b){b.classList.toggle("active",b.getAttribute("data-tab")===t)});
  if(t==="list") renderList(focus); else if(t==="cmp") renderCmp(); else if(t==="drill") renderDrillIndex(); else if(t==="cards"){if(!R)newRound();renderCard()} else renderWrong();
}
/* ---------- 语法卡片 ---------- */
function exHTML(e){var real=/^真题/.test(e.src);return '<div class="gex"><div class="ko">'+esc(e.ko)+(e.src?'<span class="src'+(real?"":" self")+'">'+esc(e.src)+'</span>':"")+'</div><div class="zh">'+esc(e.zh)+'</div></div>'}
function cmpHTML(id){
  var c=D.cmp[id]; if(!c) return "";
  return '<div style="overflow-x:auto"><table class="ctbl"><tr><th>语法</th><th>中文</th><th>语感/用法</th><th>限制</th></tr>'+c.rows.map(function(r){return '<tr>'+r.map(function(x){return '<td>'+esc(x)+'</td>'}).join("")+'</tr>'}).join("")+'</table></div><div class="ctip">💡 '+esc(c.tip)+'</div>';
}
function bodyHTML(it){
  var h='<div class="gbody">';
  h+='<div class="row"><span class="k">中文</span>'+esc(it.zh)+'</div>';
  h+='<div class="row"><span class="k mem">记法</span>'+esc(it.mem)+'</div>';
  h+='<div class="row"><span class="k">接法</span>'+esc(it.join)+'</div>';
  h+='<div class="row"><span class="k warn">语感/限制</span>'+esc(it.use)+'</div>';
  h+='<div class="row"><span class="k err">常见错误</span>'+esc(it.err)+'</div>';
  h+='<div class="row"><span class="k">例句</span></div>'+it.ex.map(exHTML).join("");
  if(it.cmp&&D.cmp[it.cmp]) h+='<details class="tr"><summary>⚖️ 易混对比：'+esc(D.cmp[it.cmp].title)+'</summary>'+cmpHTML(it.cmp)+'</details>';
  return h+'</div>';
}
function itemHTML(it,openIt){return '<details class="gi" id="g-'+it.id+'"'+(openIt?" open":"")+'><summary><span class="f">'+esc(it.f)+'</span><span class="z">'+esc(it.zh)+'</span></summary>'+bodyHTML(it)+'</details>'}
function match(it,q){
  if(!q) return true; var n=norm(q), l=q.toLowerCase();
  if(n&&(it.keys.some(function(k){return k.indexOf(n)>=0||n.indexOf(k)>=0&&k.length>1})||norm(it.f).indexOf(n)>=0)) return true;
  return (it.zh+it.mem+it.use+CAT[it.cat]+it.ex.map(function(e){return e.ko+e.zh}).join("")).toLowerCase().indexOf(l)>=0;
}
function renderList(focus){
  var h='<input class="gsearch" id="gQ" type="search" placeholder="搜索：바람에 / 因为 / 让步 / 推测…" value="'+esc(search)+'" autocomplete="off">';
  h+='<div class="minfo">'+D.items.length+' 个 TOPIK II 高频语法 · 按功能分组 · 点开看中文说法、记法、接法、限制、易混对比、例句。每组可点「练这一类」做整句针对性练习。</div><div id="gList"></div>';
  $("gBody").innerHTML=h; drawList(focus);
  $("gQ").oninput=function(){search=this.value;drawList()};
}
function drawList(focus){
  var its=D.items.filter(function(it){return match(it,search)}), h="", few=its.length<=3;
  D.cats.forEach(function(c){var xs=its.filter(function(it){return it.cat===c.id});if(!xs.length)return;
    var dn=0; xs.forEach(function(it){dn+=drillsOf(it).length});
    var pg=PROG[c.id]||{};
    h+='<div class="gcat-row"><div class="gcat">'+esc(c.label)+'（'+xs.length+'）</div>'+
      '<button type="button" class="gbtn gdrill-btn" data-drill="'+c.id+'">🎯 练这一类 · '+dn+'题</button></div>';
    if(pg.seen) h+='<div class="minfo" style="margin:-2px 2px 6px">本机进度：练过 '+esc(String(pg.seen))+' 次 · 最近对 '+(pg.lastOk||0)+'/'+(pg.lastN||0)+'</div>';
    h+=xs.map(function(it){return itemHTML(it,few||it.id===focus)}).join("")});
  $("gList").innerHTML=h||'<div class="card empty">没找到，换个关键词试试</div>';
  if(focus){var el=$("g-"+focus);if(el)setTimeout(function(){el.scrollIntoView({block:"start"})},50)}
}
function renderCmp(){
  var h='<div class="minfo">'+Object.keys(D.cmp).length+' 组最容易混的语法，用中文一眼看懂区别。点语法名跳到详细卡片。</div>';
  Object.keys(D.cmp).forEach(function(id){var c=D.cmp[id],mem=D.items.filter(function(it){return it.cmp===id});
    h+='<div class="rcard" id="c-'+id+'"><h3 style="margin:0 0 6px;font-size:16px">'+esc(c.title)+'</h3>'+cmpHTML(id)+
      '<div class="racts">'+mem.map(function(it){return '<button type="button" class="gbtn" data-go="'+it.id+'">'+esc(it.f)+'</button>'}).join("")+'</div></div>'});
  $("gBody").innerHTML=h;
}
/* ---------- 按分类挑（针对性练习入口） ---------- */
function renderDrillIndex(){
  var h='<div class="card"><h3 style="margin:0 0 6px">🎯 按分类挑 · 针对性练习</h3>'+
    '<p class="minfo" style="margin:0 0 10px">每一类单独出整句题：中文→打韩语（自动判分），或韩→中自评。题干<strong>不出现语法名称</strong>，答完再看中文意思、记忆法、易错。进度存在本机。</p>'+
    '<div class="racts" style="margin-bottom:8px"><button type="button" class="gbtn" data-a="drillall">全部语法整句练一遍</button></div></div>';
  h+='<div class="gdrill-grid">';
  D.cats.forEach(function(c){
    var n=catCount(c.id), dn=catDrillCount(c.id), pg=PROG[c.id]||{};
    h+='<div class="gdrill-card">'+
      '<div class="gdrill-title">'+esc(c.label)+'</div>'+
      '<div class="minfo">'+n+' 个语法 · '+dn+' 道整句</div>'+
      (pg.seen?'<div class="minfo">练过 '+pg.seen+' 次 · 最近 '+(pg.lastOk||0)+'/'+(pg.lastN||0)+(pg.lastAt?' · '+ago(pg.lastAt):"")+'</div>':'<div class="minfo">还没练过</div>')+
      '<div class="racts"><button type="button" class="gbtn pri" data-drill="'+c.id+'">▶ 练这一类</button>'+
      '<button type="button" class="gbtn" data-drill="'+c.id+'" data-drill-mode="sentzh">韩→中</button></div></div>';
  });
  h+='</div>';
  $("gBody").innerHTML=h;
}
function ago(ts){
  var d=Date.now()-ts; if(d<6e4)return "刚刚"; if(d<36e5)return Math.floor(d/6e4)+" 分钟前"; if(d<864e5)return Math.floor(d/36e5)+" 小时前"; return Math.floor(d/864e5)+" 天前";
}
function startCatDrill(catId, mode){
  opt.scope=catId; opt.mode=mode||"sent"; opt.tab="cards"; save(LS_OPT,opt);
  newRound(); setTab("cards");
}
/* ---------- 闪卡 / 整句练习 ---------- */
function pool(){
  var its=D.items.slice();
  if(opt.scope==="wrong") its=its.filter(function(it){return W[it.id]});
  else if(opt.scope!=="all") its=its.filter(function(it){return it.cat===opt.scope});
  if(opt.mode==="fill") its=its.filter(function(it){return it.fill&&it.fill.length});
  if(isSent()) its=its.filter(function(it){return drillsOf(it).length});
  return its;
}
function newRound(list){
  var its=list||pool();
  var q=[];
  if(isSent()){
    /* 每个语法抽若干整句；分类练习尽量把该类句子都练到（上限 40） */
    var cards=[];
    its.forEach(function(it){
      var ds=drillsOf(it);
      ds.forEach(function(d,si){cards.push({id:it.id,si:si,fi:0})});
    });
    shuffle(cards);
    var cap=opt.scope==="all"?24:40;
    q=cards.slice(0,Math.min(cap,cards.length));
  }else{
    its=list||shuffle(pool()).slice(0,15);
    q=its.map(function(it){return {id:it.id,fi:Math.floor(Math.random()*(it.fill.length||1)),si:0}});
  }
  R={q:q,i:0,ok:0,bad:0,missed:[],st:"ask",typed:"",sent:isSent()};
}
/* 卡片ID：中→韩 "gc:<id>"；填空 "gc:<id>#<fi>"；整句 "gd:<id>#<si>" */
function cid(c){
  if(isSent()) return "gd:"+c.id+"#"+c.si;
  return "gc:"+c.id+(opt.mode==="fill"?"#"+c.fi:"");
}
function sentOf(c){var it=byId[c.id], ds=drillsOf(it); return ds[c.si]||ds[0]}
function judge(c,typed){   // "std" / {a,note} 老师认可 / "ok" 宽松判对 / null 错
  var it=byId[c.id], n=norm(typed); if(!n) return null;
  var std;
  if(opt.mode==="sent"){
    var s=sentOf(c); std=answerList([s.ko]);
  }else if(opt.mode==="zh2ko"){
    std=answerList(it.keys.concat([it.f]));
  }else{
    std=answerList((it.fill[c.fi]||it.fill[0]).ans);
  }
  if(std.indexOf(n)>=0) return "std";
  var alt=window.TopikAcc&&TopikAcc.find(cid(c),typed,function(u,a){var x=norm(u);return answerNorms(a).some(function(k){return !!k&&(x===k||(k.length>=2&&x.slice(-k.length)===k&&x.length<=k.length+4))})});
  if(alt) return alt;
  return checkAns(c,typed)?"ok":null;
}
function checkAns(c,typed){
  var it=byId[c.id], n=norm(typed); if(!n) return false;
  if(opt.mode==="sent"){
    var s=sentOf(c), ans=answerList([s.ko]);
    if(ans.indexOf(n)>=0) return true;
    /* 宽松：差 1–2 个音节、或只多/少了礼貌体语尾时仍算对 */
    return ans.some(function(a){
      if(!a) return false;
      if(n===a) return true;
      if(Math.abs(n.length-a.length)<=2 && (n.indexOf(a)>=0||a.indexOf(n)>=0) && Math.min(n.length,a.length)>=8) return true;
      /* 해요/합니다/하다 语尾互换（句末） */
      var strip=function(x){return x.replace(/(습니다|ㅂ니다|해요|하세요|예요|이에요|입니다|다|요)$/,"")};
      return strip(n)===strip(a)&&strip(n).length>=6;
    });
  }
  if(opt.mode==="zh2ko"){
    return it.keys.some(function(k){return n===k||(k.length>=2&&n.length>=2&&(n.slice(-k.length)===k||(k.slice(-n.length)===n&&n.length>=k.length-1)))});
  }
  var ans=answerList((it.fill[c.fi]||it.fill[0]).ans);
  return ans.some(function(a){return n===a||n.slice(-a.length)===a||(a.slice(-n.length)===n&&n.length>=a.length-1)});
}
function markW(id,bad){var w=W[id];if(bad){w=W[id]||{n:0};w.n++;w.last=Date.now();W[id]=w}else if(opt.scope==="wrong"&&w){delete W[id]}save(LS_W,W)}
function markDrillProg(){
  if(!isSent()||opt.scope==="all"||opt.scope==="wrong"||!CAT[opt.scope]||!R) return;
  var p=PROG[opt.scope]||{seen:0}; p.seen=(p.seen||0)+1; p.lastOk=R.ok; p.lastN=R.q.length; p.lastAt=Date.now();
  PROG[opt.scope]=p; save(LS_DRILL,PROG);
}
function renderCard(){
  var scopes='<option value="all">全部（'+D.items.length+'）</option><option value="wrong"'+(opt.scope==="wrong"?" selected":"")+'>语法错题本（'+Object.keys(W).length+'）</option>'+D.cats.map(function(c){var n=D.items.filter(function(it){return it.cat===c.id}).length;return '<option value="'+c.id+'"'+(opt.scope===c.id?" selected":"")+'>'+esc(c.label)+'（'+n+'）</option>'}).join("");
  var modeKeys=isSent()||opt.tab==="drill"?["sent","sentzh","zh2ko","fill","ko2zh"]:["zh2ko","fill","ko2zh","sent","sentzh"];
  /* 闪卡栏优先显示当前相关模式；整句模式排前面当 scope 是分类时 */
  if(opt.scope!=="all"&&opt.scope!=="wrong") modeKeys=["sent","sentzh","zh2ko","fill","ko2zh"];
  var h='<div class="fbar">'+modeKeys.map(function(m){return '<button type="button" class="chip'+(opt.mode===m?" on":"")+'" data-mode="'+m+'" style="'+(opt.mode===m?"background:var(--accent);border-color:var(--accent);color:#fff":"")+'">'+MODES[m]+'</button>'}).join("")+'</div>';
  h+='<div class="fbar"><select id="gScope" aria-label="范围">'+scopes+'</select><button type="button" class="chip" id="gLink">🔗 链接</button>'+(isSent()&&opt.scope!=="all"&&opt.scope!=="wrong"?'<button type="button" class="chip" data-a="todrill">📋 分类目录</button>':"")+'</div>';
  if(isSent()&&CAT[opt.scope]) h+='<div class="minfo">🎯 针对性练习：'+esc(CAT[opt.scope])+' · 题干不显示语法名 · 答完看记法</div>';
  if(!R||!R.q.length){$("gBody").innerHTML=h+'<div class="card empty">'+(opt.scope==="wrong"?"语法错题本是空的 🎉":"这个范围没有题")+'</div>';bindCard();return}
  if(R.i>=R.q.length){if(R._progSaved!==1){markDrillProg();R._progSaved=1}$("gBody").innerHTML=h+summaryHTML();bindCard();return}
  var c=R.q[R.i], it=byId[c.id], f=it.fill[c.fi]||it.fill[0], s=isSent()?sentOf(c):null;
  h+='<div class="bar"><span>进度 <b>'+(R.i+1)+'/'+R.q.length+'</b></span><span class="sp"></span><span>对 <b style="color:var(--ok)">'+R.ok+'</b></span><span>错 <b style="color:var(--bad)">'+R.bad+'</b></span></div>';
  h+='<div class="card">';
  if(opt.mode==="sent"){
    h+='<div class="minfo">把下面的中文翻成韩语整句（打字）</div><div class="gq">'+esc(s.zh)+'</div>';
  }else if(opt.mode==="sentzh"){
    h+='<div class="minfo">先在心里翻译成中文，再看答案自评（不显示语法名）</div><div class="gq ko">'+esc(s.ko)+'</div>';
  }else if(opt.mode==="zh2ko"){
    h+='<div class="minfo">'+esc(CAT[it.cat])+' · 写出对应的韩语语法形式（如 -는 바람에）</div><div class="gq">'+esc(it.zh)+'</div>';
    if(it.ex[0]) h+='<div class="gsub">例：'+esc(it.ex[0].zh)+'</div>';
  }else if(opt.mode==="fill"){
    h+='<div class="minfo">填空：写出＿＿处的语法形式（只写空格部分即可）</div><div class="gq ko">'+esc(f.ko)+'</div><div class="gsub">'+esc(f.zh)+'</div>';
  }else{
    h+='<div class="minfo">'+esc(CAT[it.cat])+' · 先在心里说出中文意思和用法，再看答案自评</div><div class="gq ko">'+esc(it.f)+'</div>';
  }
  if(opt.mode==="sent"){
    if(R.st==="ask") h+='<input class="ginput" id="gIn" lang="ko" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="输入韩语整句…"><div class="racts"><button type="button" class="gbtn pri" data-a="check">检查</button><button type="button" class="gbtn" data-a="giveup">不会，看答案</button></div>';
    else{
      var good=R.st==="ok", ansTxt=s.ko, TA=window.TopikAcc;
      if(good&&R.acc&&TA) h+='<div class="gfb ok">'+TA.okHTML(R.acc,ansTxt)+'<div class="minfo">你的答案：'+esc(R.typed)+'</div></div>';
      else h+='<div class="gfb '+(good?"ok":"bad")+'"><div class="t">'+(good?"✔ 正确":"✘ 再看看")+'</div><div class="gans" lang="ko">'+esc(ansTxt)+'</div>'+(R.typed?'<div class="minfo">你的答案：'+esc(R.typed)+'</div>':"")+'</div>';
      if(TA) h+=TA.altsHTML(cid(c)).replace('class="row acc-alts"','class="row acc-alts" style="margin-top:8px"');
      h+='<div class="g-reveal"><div class="row"><span class="k">语法</span><b lang="ko">'+esc(it.f)+'</b> · '+esc(it.zh)+'</div>'+
        '<div class="row"><span class="k mem">记法</span>'+esc(it.mem)+'</div>'+
        '<div class="row"><span class="k err">易错</span>'+esc(it.err)+'</div></div>';
      h+='<div class="racts">'+(good?"":(R.typed?'<button type="button" class="gbtn" data-a="actually">其实我写对了</button>':""))+'<button type="button" class="gbtn pri" data-a="next">下一题 ▶</button>'+(!good&&R.typed&&TA?'<button type="button" class="gbtn acc-copy" data-a="askt">'+TA.BTN+'</button>':"")+'</div>';
      h+='<details class="gi" style="margin-top:10px"><summary><span class="f">'+esc(it.f)+'</span><span class="z">完整卡片</span></summary>'+bodyHTML(it)+'</details>';
    }
  }else if(opt.mode==="sentzh"){
    if(R.st==="ask") h+='<div class="racts"><button type="button" class="gbtn pri" data-a="show">显示答案</button></div>';
    else{
      h+='<div class="gans" style="font-size:17px">'+esc(s.zh)+'</div>';
      h+='<div class="g-reveal"><div class="row"><span class="k">语法</span><b lang="ko">'+esc(it.f)+'</b> · '+esc(it.zh)+'</div>'+
        '<div class="row"><span class="k mem">记法</span>'+esc(it.mem)+'</div>'+
        '<div class="row"><span class="k err">易错</span>'+esc(it.err)+'</div></div>';
      h+=(R.st==="shown"?'<div class="racts"><button type="button" class="gbtn pri" data-a="know">✔ 会了</button><button type="button" class="gbtn" data-a="dunno">✘ 不会</button></div>':'<div class="racts"><button type="button" class="gbtn pri" data-a="next">下一题 ▶</button></div>');
      h+='<details class="gi" style="margin-top:10px"><summary><span class="f">'+esc(it.f)+'</span><span class="z">完整卡片</span></summary>'+bodyHTML(it)+'</details>';
    }
  }else if(opt.mode!=="ko2zh"){
    if(R.st==="ask") h+='<input class="ginput" id="gIn" lang="ko" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="输入韩语…"><div class="racts"><button type="button" class="gbtn pri" data-a="check">检查</button><button type="button" class="gbtn" data-a="giveup">不会，看答案</button></div>';
    else{
      var good2=R.st==="ok", ansTxt2=opt.mode==="fill"?f.ans.join(" / "):it.f, TA2=window.TopikAcc;
      if(good2&&R.acc&&TA2) h+='<div class="gfb ok">'+TA2.okHTML(R.acc,ansTxt2)+'<div class="minfo">你的答案：'+esc(R.typed)+'</div></div>';
      else h+='<div class="gfb '+(good2?"ok":"bad")+'"><div class="t">'+(good2?"✔ 正确":"✘ 再看看")+'</div><div class="gans">'+esc(ansTxt2)+'</div>'+(R.typed?'<div class="minfo">你的答案：'+esc(R.typed)+'</div>':"")+'</div>';
      if(TA2) h+=TA2.altsHTML(cid(c)).replace('class="row acc-alts"','class="row acc-alts" style="margin-top:8px"');
      h+='<div class="racts">'+(good2?"":(R.typed?'<button type="button" class="gbtn" data-a="actually">其实我写对了</button>':""))+'<button type="button" class="gbtn pri" data-a="next">下一题 ▶</button>'+(!good2&&R.typed&&TA2?'<button type="button" class="gbtn acc-copy" data-a="askt">'+TA2.BTN+'</button>':"")+'</div>';
      h+='<details class="gi"'+(good2?"":" open")+' style="margin-top:10px"><summary><span class="f">'+esc(it.f)+'</span><span class="z">完整卡片</span></summary>'+bodyHTML(it)+'</details>';
    }
  }else{
    if(R.st==="ask") h+='<div class="racts"><button type="button" class="gbtn pri" data-a="show">显示答案</button></div>';
    else h+='<div class="gans" style="font-size:17px">'+esc(it.zh)+'</div>'+bodyHTML(it)+(R.st==="shown"?'<div class="racts"><button type="button" class="gbtn pri" data-a="know">✔ 会了</button><button type="button" class="gbtn" data-a="dunno">✘ 不会</button></div>':'<div class="racts"><button type="button" class="gbtn pri" data-a="next">下一题 ▶</button></div>');
  }
  h+='</div>';
  $("gBody").innerHTML=h; bindCard();
  var inp=$("gIn"); if(inp){inp.focus();inp.onkeydown=function(e){if(e.key==="Enter"&&!e.isComposing){e.preventDefault();submit()}}}
}
function summaryHTML(){
  var h='<div class="card"><div class="score">'+R.ok+' <small>/ '+R.q.length+'</small></div>';
  if(isSent()&&CAT[opt.scope]) h+='<div class="minfo">「'+esc(CAT[opt.scope])+'」本轮完成</div>';
  if(R.missed.length){
    var uniq=[]; R.missed.forEach(function(id){if(uniq.indexOf(id)<0)uniq.push(id)});
    h+='<div class="minfo">这轮错的：</div>'+uniq.map(function(id){return itemHTML(byId[id],false)}).join("");
  }
  h+='<div class="racts">'+(R.missed.length?'<button type="button" class="gbtn pri" data-a="redo">重练错的（'+R.missed.length+'）</button>':"")+'<button type="button" class="gbtn'+(R.missed.length?"":" pri")+'" data-a="again">再来一轮</button><button type="button" class="gbtn" data-a="todrill">分类目录</button><button type="button" class="gbtn" data-a="wrongbook">练语法错题本</button></div></div>';
  return h;
}
function submit(){
  var inp=$("gIn"); if(!inp) return; var c=R.q[R.i]; R.typed=inp.value.trim();
  if(!R.typed){toast("先写一下，或者点“不会”");return}
  var j=judge(c,R.typed), ok=!!j; R.acc=(j&&typeof j==="object")?j:null; R.st=ok?"ok":"bad";
  if(ok){R.ok++;markW(c.id,false)}else{R.bad++;R.missed.push(c.id);markW(c.id,true)}
  renderCard();
}
function next(){R.i++;R.st="ask";R.typed="";R.acc=null;renderCard();window.scrollTo(0,0)}
function bindCard(){
  var s=$("gScope"); if(s) s.onchange=function(){opt.scope=s.value;save(LS_OPT,opt);newRound();renderCard()};
  var l=$("gLink"); if(l) l.onclick=function(){
    var u=location.origin+location.pathname;
    if(isSent()&&opt.scope!=="all"&&opt.scope!=="wrong") u+="?grammar=drill&cat="+encodeURIComponent(opt.scope)+(opt.mode==="sentzh"?"&mode=sentzh":"");
    else if(isSent()) u+="?grammar=drill&mode="+encodeURIComponent(opt.mode);
    else u+="?cat=grammar-core&mode="+opt.mode+(opt.scope&&opt.scope!=="all"?"&scope="+encodeURIComponent(opt.scope):"");
    if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(u).then(function(){toast("链接已复制")});else prompt("复制链接：",u);
  };
}
function renderWrong(){
  var ids=Object.keys(W).filter(function(id){return byId[id]}).sort(function(a,b){return W[b].n-W[a].n});
  var h='<div class="card"><h3 style="margin:0 0 4px">语法错题本（'+ids.length+'）</h3><p class="minfo">闪卡 / 整句练习答错自动加入；在“错题本”范围里答对就移出。</p>';
  if(ids.length) h+='<div class="racts" style="margin-bottom:8px"><button type="button" class="gbtn pri" data-a="wrongbook">▶ 练错题</button><button type="button" class="gbtn" data-a="drillwrong">▶ 错题整句练</button><button type="button" class="gbtn" data-a="clearw">清空</button></div>'+ids.map(function(id){return itemHTML(byId[id],false)}).join("");
  else h+='<div class="empty">还没有错题 🎉</div>';
  $("gBody").innerHTML=h+'</div>';
}
function bind(){
  $("gtabs").addEventListener("click",function(e){var b=e.target.closest("button[data-tab]");if(b)setTab(b.getAttribute("data-tab"))});
  $("gBody").addEventListener("click",function(e){
    var b=e.target.closest("button"); if(!b) return;
    var go=b.getAttribute("data-go"); if(go){search="";setTab("list",go);return}
    var drill=b.getAttribute("data-drill"); if(drill){startCatDrill(drill,b.getAttribute("data-drill-mode")||"sent");return}
    var m=b.getAttribute("data-mode"); if(m){opt.mode=m;save(LS_OPT,opt);newRound();renderCard();return}
    var a=b.getAttribute("data-a"); if(!a) return; var c=R&&R.q[R.i];
    if(a==="check") submit();
    else if(a==="giveup"){R.typed="";R.st="bad";R.bad++;R.missed.push(c.id);markW(c.id,true);renderCard()}
    else if(a==="actually"){R.bad--;R.ok++;R.missed.pop();var w=W[c.id];if(w){w.n--;if(w.n<=0)delete W[c.id];save(LS_W,W)}R.st="ok";toast("好的，算你对 👍");renderCard()}
    else if(a==="next") next();
    else if(a==="askt"){
      var TA=window.TopikAcc; if(!TA) return;
      if(opt.mode==="sent"){var s2=sentOf(c);TA.copy({deck:"语法整句练习（grammar-drill）",id:cid(c),extra:"题目："+s2.zh,zh:s2.zh,ans:s2.ko,mine:R.typed})}
      else{var it2=byId[c.id],f2=it2.fill[c.fi]||it2.fill[0];TA.copy(opt.mode==="fill"?{deck:"语法闪卡·句子填空（grammar-core）",id:cid(c),extra:"题目："+f2.ko,zh:f2.zh,ans:f2.ans.join(" / "),mine:R.typed}:{deck:"语法闪卡·中→韩（grammar-core）",id:cid(c),zh:it2.zh,ans:it2.f,mine:R.typed})}
    }
    else if(a==="show"){R.st="shown";renderCard()}
    else if(a==="know"){R.ok++;markW(c.id,false);next()}
    else if(a==="dunno"){R.bad++;R.missed.push(c.id);markW(c.id,true);R.st="judged";renderCard()}
    else if(a==="redo"){
      if(isSent()){
        var miss=R.missed.slice(), cards=[];
        miss.forEach(function(id){var it=byId[id],ds=drillsOf(it);ds.forEach(function(d,si){cards.push({id:id,si:si,fi:0})})});
        shuffle(cards); R={q:cards.slice(0,Math.min(40,cards.length)),i:0,ok:0,bad:0,missed:[],st:"ask",typed:"",sent:true};
      }else newRound(R.missed.map(function(id){return byId[id]}));
      renderCard();
    }
    else if(a==="again"){newRound();renderCard()}
    else if(a==="wrongbook"){opt.scope="wrong";if(isSent())opt.mode="zh2ko";save(LS_OPT,opt);newRound();setTab("cards")}
    else if(a==="drillwrong"){opt.scope="wrong";opt.mode="sent";save(LS_OPT,opt);newRound();setTab("cards")}
    else if(a==="todrill"){setTab("drill")}
    else if(a==="drillall"){opt.scope="all";opt.mode="sent";save(LS_OPT,opt);newRound();setTab("cards")}
    else if(a==="clearw"){if(confirm("清空语法错题本？")){W={};save(LS_W,W);renderWrong()}}
  });
}
window.TopikGrammar={open:open,init:bind};
})();
