/* TOPIK II 第 54 题 · 题型总览 + 各类型逐句默写 + AI 批改 / 全文写作
   数据：writing/tpl54types.json；进度：localStorage topik.w54.types.v1（经 assets/sync.js 同步）
   AI：assets/ai.js（window.TopikAI.chatJSON，Key 只在用户本机 localStorage）
   深链接：?writing=54types[&type=cause|pros|solve|need|attitude|debate][&mode=drill|full|random] */
(function(){
"use strict";
var LS="topik.w54.types.v1";
var D=null, PROG=load(), host=null;
var st={view:"over",type:null,R:null,full:null,ai:{}};
window.addEventListener("topik-sync",function(){PROG=load()});

function load(){try{var v=JSON.parse(localStorage.getItem(LS));if(v&&typeof v==="object"){v.t=v.t||{};v.essays=Array.isArray(v.essays)?v.essays:[];return v}}catch(e){}return {t:{},essays:[]}}
function saveP(){try{localStorage.setItem(LS,JSON.stringify(PROG))}catch(e){}}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function toast(m){var t=document.getElementById("toast");if(!t)return;t.textContent=m;t.classList.add("show");clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove("show")},1800)}
function AI(){return window.TopikAI||null}
function aiOK(){var A=AI();return !!(A&&A.active())}
function T(id){if(!D)return null;for(var i=0;i<D.types.length;i++)if(D.types[i].id===id)return D.types[i];return null}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function sq(s){return String(s==null?"":s).normalize("NFC").replace(/[\s\u00a0\u3000]+/g,"").replace(/[\p{P}\p{S}]/gu,"")}
function len(s){return String(s||"").replace(/\n/g,"").length}

function ensure(){
  if(D) return Promise.resolve();
  return fetch("writing/tpl54types.json?v="+Date.now(),{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()}).then(function(d){D=d});
}

/* ---------- 本地判定：形态提示 + 差异高亮 ---------- */
var ADJ=/(필요|중요|다양|심각|바람직|가능|편리|원활|충분|적절|행복|불편|유용|위험|건강|부족|익숙|확실|분명|복잡|간단|자연스럽|어렵|쉽|많|좋|크|작|높|낮|넓|좁|길|짧)(한다|는다|ㄴ다)(?=[\s.,!?]|$)/;
function hints(u){
  var s=String(u||"").normalize("NFC"), h=[];
  if(/(습니다|ㅂ니다|세요|해요|이에요|예요|아요|어요)[.!?。]*\s*$/.test(s)) h.push("大作文必须用 -다 体（不要用 -습니다 / -아·어요）");
  var m=s.match(ADJ); if(m) h.push("形容词不能加 -ㄴ다/-는다：「"+m[0]+"」→「"+m[1]+(m[1]==="많"||m[1]==="좋"||m[1]==="크"||m[1]==="작"||m[1]==="높"||m[1]==="낮"||m[1]==="넓"||m[1]==="좁"||m[1]==="길"||m[1]==="짧"||m[1]==="어렵"||m[1]==="쉽"||m[1]==="자연스럽"?"다":"하다")+"」");
  return h;
}
function lcs(a,b){
  var n=a.length,m=b.length,dp=[],i,j;
  for(i=0;i<=n;i++){dp.push(new Uint16Array(m+1))}
  for(i=n-1;i>=0;i--)for(j=m-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
  var ka={},kb={};i=0;j=0;
  while(i<n&&j<m){if(a[i]===b[j]){ka[i]=1;kb[j]=1;i++;j++}else if(dp[i+1][j]>=dp[i][j+1])i++;else j++}
  return {a:ka,b:kb,n:dp[0][0]};
}
/* 只比非空白字符；返回 {model,user,ratio} 两段 HTML */
function diff(model,user){
  var A=Array.from(String(model).normalize("NFC")), B=Array.from(String(user).normalize("NFC"));
  var ai=[],bi=[],k;
  for(k=0;k<A.length;k++)if(!/[\s\p{P}]/u.test(A[k]))ai.push(k);
  for(k=0;k<B.length;k++)if(!/[\s\p{P}]/u.test(B[k]))bi.push(k);
  var r=lcs(ai.map(function(x){return A[x]}),bi.map(function(x){return B[x]}));
  var keepA={},keepB={};ai.forEach(function(x,i){if(r.a[i])keepA[x]=1});bi.forEach(function(x,i){if(r.b[i])keepB[x]=1});
  function paint(arr,keep,cls){var h="",open=false;arr.forEach(function(c,i){var bad=!/[\s\p{P}]/u.test(c)&&!keep[i];if(bad&&!open){h+='<mark class="'+cls+'">';open=true}if(!bad&&open){h+="</mark>";open=false}h+=esc(c)});if(open)h+="</mark>";return h}
  return {model:paint(A,keepA,"dm"),user:paint(B,keepB,"dx"),ratio:ai.length?r.n/Math.max(ai.length,bi.length):0};
}

/* ---------- 进度 ---------- */
function pg(id){return PROG.t[id]||(PROG.t[id]={seen:0,lastOk:0,lastN:0,lastAt:0})}
function markRound(id,ok,n){var p=pg(id);p.seen=(p.seen||0)+1;p.lastOk=ok;p.lastN=n;p.lastAt=Date.now();saveP()}

/* ---------- 视图 ---------- */
function seg(){
  var v=st.view;
  return '<div class="seg t54seg"><button type="button" data-t54="over" class="'+(v==="over"||v==="type"?"active":"")+'">📚 题型总览</button><button type="button" data-t54="drill" class="'+(v==="drill"?"active":"")+'">✏️ 逐句默写</button><button type="button" data-t54="full" class="'+(v==="full"?"active":"")+'">📝 全文写作</button></div>';
}
function aiBar(){
  var A=AI(); if(!A) return '<div class="minfo">AI 模块未加载</div>';
  return '<div class="minfo t54ai">🤖 AI 批改：'+(aiOK()?"已开启":(A.hasKey()?"已关闭":"未设置 Key"))+' <button type="button" class="gbtn ai-mini" data-t54="aiset">⚙️ 设置</button></div>';
}
function foot(){return '<footer><div>54 题型模板 · '+(D?D.types.length:0)+' 类</div><div><button type="button" data-t54="link">🔗 复制本页链接</button></div></footer>'}

function renderOver(){
  var h='<div class="t54">'+seg();
  h+='<div class="card"><b>怎么判断题型？</b><div class="minfo" style="margin-top:4px">54 题会给一段话 + 3 个提示问题。<b>看第 2、3 个问题的关键词</b>就能定类型；3 个问题 = 你的 3 个本论段落要点，按顺序全部回答。全文 600–700 자（含空格），-다 体，不要标题。</div>';
  h+='<div class="racts"><button type="button" class="gbtn pri" data-t54="rand">🎲 随机主题默写</button><button type="button" class="gbtn" data-t54="randfull">📝 随机主题全文写作</button></div></div>';
  h+='<div class="card" style="padding:0"><div style="overflow-x:auto"><table class="ctbl w54tbl"><tr><th>类型</th><th>问题里的关键词</th></tr>';
  D.types.forEach(function(t){h+='<tr><td><b>'+t.icon+' '+esc(t.name)+'</b><div class="minfo" lang="ko" style="margin:0">'+esc(t.ko)+'</div></td><td lang="ko">'+esc(t.qs.join(" / "))+'</td></tr>'});
  h+='</table></div></div>';
  D.types.forEach(function(t){
    var p=pg(t.id);
    h+='<div class="card t54type"><div class="t54h"><b>'+t.icon+' '+esc(t.name)+'</b> <span class="tag" lang="ko">'+esc(t.ko)+'</span></div>';
    h+='<div class="minfo">范文主题：<span lang="ko">'+esc(t.topic)+'</span>'+(p.seen?' · 默写 '+p.seen+' 轮，最近 '+p.lastOk+'/'+p.lastN:'')+'</div>';
    h+='<div class="racts"><button type="button" class="gbtn" data-t54="type" data-id="'+t.id+'">📖 结构与模板</button><button type="button" class="gbtn pri" data-t54="drillt" data-id="'+t.id+'">✏️ 默写</button>'+(t.id==="cause"?'<button type="button" class="gbtn" data-a="go54tpl">原因类骨架（旧）</button>':'')+'</div></div>';
  });
  h+='<div class="gcat">通用易错</div><div class="card"><ul class="w54chk">';
  h+='<li>全文用 <b>-다 体</b>：动词 -ㄴ/는다，形容词 -다，名词 이다。不要 -습니다 / -아·어요。</li>';
  h+='<li>⚠️ <b>形容词不加 -ㄴ다</b>：필요하다、중요하다、많다、어렵다（×필요한다 ×많는다 ×어려운다）。</li>';
  h+='<li><b>을/를 vs 이/가</b>：他动词宾语用 을/를（문제를 해결하다、영향을 미치다）；形容词 / 被动 / 되다 的主语用 이/가（문제가 해결되다、노력이 필요하다）。</li>';
  h+='<li>不写「나는 생각한다」过多；不要用口语 그래서·근데·너무，改用 따라서·그러나·매우。</li>';
  h+='<li>字数：600 不到会扣分，700 超出写不下；4 段 × 150–180 자最稳。</li></ul></div>';
  h+='</div>'+foot();
  host.innerHTML=h;
}

function renderType(){
  var t=T(st.type); if(!t){st.view="over";return renderOver()}
  var h='<div class="t54">'+seg()+'<div class="racts"><button type="button" class="gbtn" data-t54="over">← 总览</button></div>';
  h+='<div class="gcat">'+t.icon+' '+esc(t.name)+' · <span lang="ko">'+esc(t.ko)+'</span></div>';
  h+='<div class="card"><b>🔎 怎么认出来</b><ul class="w54chk">'+t.recog.map(function(x){return '<li>'+esc(x)+'</li>'}).join("")+'</ul>';
  h+='<div class="minfo">典型 3 个问题：</div><ol class="t54qs" lang="ko">'+t.qs.map(function(x){return '<li>'+esc(x)+'</li>'}).join("")+'</ol></div>';
  h+='<div class="card" style="padding:0"><div style="overflow-x:auto"><table class="ctbl w54tbl"><tr><th>段落</th><th>写什么</th><th>字数</th></tr>';
  t.paras.forEach(function(p){h+='<tr><td lang="ko"><b>'+esc(p.n)+'</b></td><td>'+esc(p.role)+'</td><td>'+esc(p.len)+'</td></tr>'});
  h+='<tr><td><b>合计</b></td><td>3 个问题各占一块，全部回答</td><td>600–700자</td></tr></table></div></div>';
  h+='<div class="gcat">万能句型</div>';
  t.tpl.forEach(function(x){h+='<div class="card t54tpl"><div lang="ko"><b>'+esc(x.ko)+'</b></div><div class="minfo" style="margin:2px 0 0">'+esc(x.zh)+'</div></div>'});
  h+='<div class="gcat">连接词</div><div class="card">'+t.conn.map(function(x){return '<span class="mlchip"><span lang="ko">'+esc(x.ko)+'</span> '+esc(x.zh)+'</span>'}).join(" ")+'</div>';
  h+='<div class="gcat">⚠️ 易错</div><div class="card"><ul class="w54chk">'+t.miss.map(function(x){return '<li>'+esc(x)+'</li>'}).join("")+'<li>全文 -다 体；形容词不加 -ㄴ다；宾语 을/를、形容词主语 이/가。</li></ul></div>';
  h+='<div class="gcat">范文：<span lang="ko">'+esc(t.topic)+'</span></div><div class="card t54essay">';
  t.paras.forEach(function(p,pi){
    var ss=t.essay.filter(function(s){return s.p===pi}); if(!ss.length) return;
    h+='<div class="minfo" style="margin:6px 0 2px"><b>'+esc(p.n)+'</b> · '+esc(p.role)+'</div><p lang="ko">'+ss.map(function(s){return esc(s.ko)}).join(" ")+'</p>';
  });
  h+='<div class="minfo">约 '+t.essay.reduce(function(a,s){return a+len(s.ko)+1},0)+' 자（骨架范文，考试时每个本论再加 1 句例子即可到 600+）</div>';
  h+='<div class="racts"><button type="button" class="gbtn pri" data-t54="drillt" data-id="'+t.id+'">✏️ 逐句默写这篇</button><button type="button" class="gbtn" data-t54="fullt" data-id="'+t.id+'">📝 用此类型写新主题</button>'+(t.id==="cause"?'<button type="button" class="gbtn" data-a="go54tpl">原因类可替换骨架</button>':'')+'</div></div>';
  h+='<div class="minfo">其他练习主题：<span lang="ko">'+t.more.map(esc).join(" · ")+'</span></div>';
  h+='</div>'+foot();
  host.innerHTML=h;
}

/* ---------- 逐句默写 ---------- */
function newRound(id,list){
  var t=T(id)||D.types[0];
  st.type=t.id; st.view="drill";
  var q=(list&&list.length?list:t.essay.map(function(s,i){return i}));
  st.R={t:t.id,q:q.slice(),i:0,ok:0,bad:0,missed:[],ans:{},st:"ask",typed:"",redo:!!(list&&list.length),done:false};
  st.ai={};
}
function renderDrill(){
  if(!st.R) newRound(st.type||pick(D.types).id);
  var R=st.R, t=T(R.t), n=R.q.length;
  var h='<div class="t54 wg">'+seg();
  h+='<div class="seg t54pick">'+D.types.map(function(x){return '<button type="button" data-t54="drillt" data-id="'+x.id+'" class="'+(x.id===t.id?"active":"")+'">'+x.icon+'</button>'}).join("")+'<button type="button" data-t54="rand">🎲</button></div>';
  h+='<div class="minfo"><b>'+t.icon+' '+esc(t.name)+'</b> · <span lang="ko">'+esc(t.topic)+'</span></div>';
  h+='<div class="bar"><span>'+(R.redo?"错句重练":"进度")+' <b>'+Math.min(R.i+1,n)+"/"+n+'</b></span><span class="sp"></span><span>对 <b style="color:var(--ok)">'+R.ok+'</b></span><span>错 <b style="color:var(--bad)">'+R.bad+'</b></span></div>';
  h+='<div class="progress"><i style="width:'+(n?Math.round(100*R.i/n):0)+'%"></i></div>';
  if(R.i>=n){
    if(!R.done){markRound(t.id,R.ok,n);R.done=true}
    var all=R.q.map(function(k){return R.ans[k]||""}).join(" ").trim();
    h+='<div class="card"><div class="score">'+R.ok+'<small>/'+n+'</small></div><div class="minfo" style="text-align:center">本轮完成'+(R.missed.length?' · 错 '+R.missed.length+' 句':" 🎉")+'</div>';
    h+='<div class="racts">'+(R.missed.length?'<button type="button" class="gbtn pri" data-t54="redo">重练错句（'+R.missed.length+'）</button>':'')+'<button type="button" class="gbtn" data-t54="drillt" data-id="'+t.id+'">再来一轮</button><button type="button" class="gbtn" data-t54="rand">🎲 换随机主题</button></div>';
    if(all&&!R.redo){
      h+='<div class="gcat">🤖 整篇 AI 批改</div><div class="minfo">把你本轮默写的全部句子交给 AI，对照范文逐句检查（同义改写只要语法和意思对就算对）。</div>';
      h+='<div class="racts"><button type="button" class="gbtn pri" data-t54="aiall">🤖 AI 批改整篇默写</button></div>'+aiBox("all");
    }
    h+=aiBar()+'</div></div>'+foot(); host.innerHTML=h; return;
  }
  var k=R.q[R.i], s=t.essay[k];
  h+='<div class="card"><div class="label"><span>看中文 → 写韩语</span><span class="tag">'+esc(t.paras[s.p].n)+' · 句 '+(k+1)+'</span></div>';
  h+='<div class="prompt sent">'+esc(s.zh)+'</div>';
  h+='<textarea class="answer" id="t54In" lang="ko" rows="3" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="写韩语（-다 体）…"'+(R.st!=="ask"?" disabled":"")+">"+esc(R.typed)+"</textarea>";
  if(R.st!=="ask"){
    var ok=R.st==="ok", d=diff(s.ko,R.typed||"");
    h+='<div class="fbx '+(ok?"ok":"bad")+'"><div class="title">'+(ok?"✓ 和范文一致":(R.typed?"✗ 和范文不同（相似度 "+Math.round(d.ratio*100)+"%）":"看答案"))+'</div>';
    h+='<div class="ansline" lang="ko">'+d.model+'</div>';
    if(R.typed) h+='<div class="mine">你写的：<span lang="ko">'+d.user+'</span></div>';
    if(!ok&&R.typed) h+='<div class="minfo">🟥 <mark class="dm">范文有、你漏掉/写错</mark> · 🟨 <mark class="dx">你多写/不同</mark></div>';
    var hs=hints(R.typed); if(hs.length) h+='<ul class="gai-err">'+hs.map(function(x){return '<li class="why">⚠️ '+esc(x)+'</li>'}).join("")+'</ul>';
    h+='</div>';
    if(!ok&&R.typed) h+='<div class="racts"><button type="button" class="gbtn pri" data-t54="ai1">🤖 AI 判：我的写法算对吗？</button></div>'+aiBox("s"+k);
  }
  h+='<div class="actions">'+(R.st==="ask"?'<button type="button" class="b-primary" data-t54="check">检查</button><button type="button" class="b-ghost" data-t54="giveup">不会，看答案</button>':'<button type="button" class="b-primary full" data-t54="next">下一句 →</button>')+'</div></div>';
  h+=aiBar()+'</div>'+foot();
  host.innerHTML=h;
  var ta=document.getElementById("t54In");
  if(ta&&R.st==="ask"){ta.addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();check()}});try{ta.focus({preventScroll:true})}catch(x){}}
}
function check(give){
  var R=st.R, t=T(R.t), k=R.q[R.i], ta=document.getElementById("t54In");
  R.typed=give?((ta&&ta.value)||""):((ta&&ta.value)||"");
  if(!give&&!R.typed.trim()){toast("先写一写");return}
  var ok=!give&&sq(R.typed)===sq(t.essay[k].ko)&&!hints(R.typed).length;
  R.ans[k]=R.typed;
  if(ok){R.ok++;R.st="ok"}else{R.bad++;R.missed.push(k);R.st="bad"}
  paint();
}
function aiPass(k){ /* AI 判对 → 计为对 */
  var R=st.R; if(!R) return; var i=R.missed.indexOf(k); if(i<0) return;
  R.missed.splice(i,1); R.bad--; R.ok++; R.st="ok";
}

/* ---------- AI ---------- */
var SYS_S=["你是严格但公正的韩语写作老师，批改备考 TOPIK 5 级的中国学习者在 TOPIK II 第54题（议论文）里的句子默写。只输出一个 JSON 对象。",
"判断学生句子本身是否是正确、自然、书面的韩语，并表达了中文意思。范文只是参考：用词或结构不同但语法正确、意思一致的改写算对（correct=true）。",
"必须指出的错误：助词错误（尤其宾语该用 을/를 却用 이/가，或形容词/被动句主语该用 이/가）、拼写错误、活用错误、时态错误、意思不符、漏掉关键内容。",
"文体规则：作文必须用 -다 体（动词 -ㄴ/는다、形容词 -다、名词 -이다）。用 -습니다/-아요/반말口语 → 错。形容词或 있다/없다 以外加 -ㄴ다/-는다（如 필요한다、중요한다、많는다）→ 错。",
"errors 中 wrong 必须是从学生答案原样摘出的片段；指不出具体片段就 correct=true。",
'输出：{"correct":true/false,"errors":[{"wrong":"","right":"","why":"简体中文"}],"corrected":"在学生答案上最小修改后的正确句子","tip":"📌 一条中文提示"}'].join("\n");
var SYS_ALL=["你是严格但公正的韩语写作老师。学生凭记忆默写了一篇 TOPIK 54 题范文。请逐句对照范文检查学生默写（同义改写只要语法正确、意思一致就算对），只输出一个 JSON 对象。",
"重点检查：助词（을/를 vs 이/가）、拼写、活用、-다 体（不得用 -습니다/-아요）、形容词误加 -ㄴ다（필요한다 等）、漏句或意思偏离。",
"wrong 必须是学生原文中的片段。用简体中文解释。",
'输出：{"summary":"整体评价（中文，2-3句）","ok_count":数字,"total":数字,"errors":[{"wrong":"","right":"","why":""}],"tip":"📌 最该注意的一点"}'].join("\n");
var SYS_FULL=["你是 TOPIK II 写作阅卷老师，按官方第54题标准给备考 5 级的中国学习者打分，满分 50。只输出一个 JSON 对象，说明一律用简体中文。",
"评分项：内容及课题完成 content（0-12：是否回答了全部 3 个提示问题、内容是否充实切题）；文章结构 structure（0-12：서론-본론-결론、段落、连接词）；语言使用 language（0-26：语法与词汇的多样性和准确性、书面语、-다 体）。",
"扣分重点：少于 600 자或明显不足要在 content 扣分；用 -습니다/-아요 或口语、形容词加 -ㄴ다（필요한다）、助词 을/를 与 이/가 混用、拼写错误。",
"errors 最多 12 条，wrong 必须从学生作文原样摘出。",
'输出：{"total":数字,"content":数字,"structure":数字,"language":数字,"level":"预计相当于几级水平的一句话","comment":"总评 2-4 句","good":["优点"],"errors":[{"wrong":"","right":"","why":""}],"better":"示范改写其中一段（韩语）","tip":"📌 下次最该改的一点"}'].join("\n");

function aiBox(key){
  var a=st.ai[key]; if(!a) return "";
  if(a.st==="wait") return '<div class="gai wait">🤖 AI 批改中…</div>';
  if(a.st==="err") return '<div class="gai err">🤖 '+esc(a.msg)+'</div>';
  var r=a.r, h="";
  function errs(L){return L&&L.length?'<ul class="gai-err">'+L.map(function(e){return '<li><span class="w" lang="ko">'+esc(e.wrong)+'</span> → <span class="r" lang="ko">'+esc(e.right)+'</span>'+(e.why?'<div class="why">'+esc(e.why)+'</div>':'')+'</li>'}).join("")+'</ul>':''}
  if(a.kind==="s"){
    h='<div class="gai '+(r.correct?"ok":"bad")+'"><div class="gai-t">🤖 '+(r.correct?"AI：这样写也对 ✓（已计为对）":"AI：有错误")+'</div>'+errs(r.errors);
    if(r.corrected&&!r.correct) h+='<div class="gai-fix">改正：<b lang="ko">'+esc(r.corrected)+'</b></div>';
  }else if(a.kind==="all"){
    h='<div class="gai"><div class="gai-t">🤖 '+esc(r.ok_count!=null?("约 "+r.ok_count+"/"+(r.total||"")+" 句正确"):"批改结果")+'</div><div>'+esc(r.summary||"")+'</div>'+errs(r.errors);
  }else{
    h='<div class="gai"><div class="gai-t">🤖 TOPIK 54 预估：<b>'+esc(r.total)+'</b> / 50</div><div class="minfo" style="margin:2px 0">内容 '+esc(r.content)+'/12 · 结构 '+esc(r.structure)+'/12 · 语言 '+esc(r.language)+'/26'+(r.level?' · '+esc(r.level):'')+'</div><div>'+esc(r.comment||"")+'</div>';
    if(r.good&&r.good.length) h+='<div style="margin-top:4px">👍 '+r.good.map(esc).join("；")+'</div>';
    h+=errs(r.errors);
    if(r.better) h+='<div class="gai-fix">示范改写：<div lang="ko"><b>'+esc(r.better)+'</b></div></div>';
  }
  if(r.tip) h+='<div class="gai-tip">'+esc(r.tip)+'</div>';
  return h+'</div>';
}
function cleanErr(L,text){return (Array.isArray(L)?L:[]).filter(function(e){return e&&typeof e==="object"&&e.wrong&&sq(text).indexOf(sq(e.wrong))>=0}).slice(0,12).map(function(e){return {wrong:String(e.wrong),right:String(e.right||""),why:String(e.why||"")}})}
function runAI(key,kind,sys,user,text,max,after){
  var A=AI(); if(!A){toast("AI 模块未加载");return}
  if(!A.active()){A.openSettings(function(){paint()});toast(A.hasKey()?"AI 判题已关闭，请开启":"先设置 DeepSeek Key");return}
  st.ai[key]={st:"wait",kind:kind}; paint();
  A.chatJSON(sys,user,{maxTokens:max||800,timeout:max>1000?60000:25000}).then(function(r){
    r.errors=cleanErr(r.errors,text);
    if(kind==="s"&&r.correct===false&&!r.errors.length) r.correct=true;
    st.ai[key]={st:"done",kind:kind,r:r}; if(after) after(r); paint();
  },function(e){st.ai[key]={st:"err",kind:kind,msg:(e&&e.message)||"AI 出错"};paint()});
}
function ai1(){
  var R=st.R,t=T(R.t),k=R.q[R.i],s=t.essay[k];
  runAI("s"+k,"s",SYS_S,{"题目类型":t.name,"作文主题":t.topic,"中文":s.zh,"范文句子":s.ko,"学生答案":R.typed},R.typed,800,function(r){if(r.correct)aiPass(k)});
}
function aiAll(){
  var R=st.R,t=T(R.t);
  var mine=R.q.map(function(k,i){return (i+1)+". "+(R.ans[k]||"（空）")}).join("\n");
  runAI("all","all",SYS_ALL,{"作文主题":t.topic,"范文（逐句）":R.q.map(function(k,i){return (i+1)+". "+t.essay[k].ko}).join("\n"),"中文提示":R.q.map(function(k,i){return (i+1)+". "+t.essay[k].zh}).join("\n"),"学生默写":mine},mine,1500);
}

/* ---------- 全文写作 ---------- */
function newFull(id){
  var t=T(id)||pick(D.types), topic=pick(t.more.concat([t.topic]));
  st.full={t:t.id,topic:topic,text:""}; st.view="full"; delete st.ai.full;
}
function renderFull(){
  if(!st.full) newFull(st.type);
  var F=st.full, t=T(F.t), key=topicKey(F.topic);
  var h='<div class="t54 wg">'+seg();
  h+='<div class="card"><div class="label"><span>'+t.icon+' '+esc(t.name)+'</span><span class="tag">600–700자 · -다 体</span></div>';
  h+='<div class="prompt" lang="ko" style="font-size:18px"><b>'+esc(F.topic)+'</b></div>';
  h+='<div class="minfo">提示问题（〇〇 = 本题主题）：</div><ol class="t54qs" lang="ko">'+t.qs.map(function(q){return '<li>'+esc(q)+'</li>'}).join("")+'</ol>';
  h+='<div class="racts"><button type="button" class="gbtn" data-t54="randfull">🎲 换题</button><button type="button" class="gbtn" data-t54="type" data-id="'+t.id+'">📖 看此类结构</button></div>';
  h+='<textarea class="answer" id="t54Full" lang="ko" rows="14" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="서론 → 본론 → 결론，600–700자…">'+esc(F.text)+'</textarea>';
  h+='<div class="minfo" id="t54Cnt">'+cnt(F.text)+'</div>';
  h+='<div class="racts"><button type="button" class="gbtn pri" data-t54="aifull">🤖 AI 按 TOPIK 评分（/50）</button></div>'+aiBox("full")+'</div>';
  var mine=PROG.essays.filter(function(e){return e.topic===F.topic});
  if(PROG.essays.length) h+='<div class="minfo">本机已评分 '+PROG.essays.length+' 篇'+(mine.length?' · 本题最近 '+mine[mine.length-1].total+'/50':'')+'</div>';
  h+=aiBar()+'</div>'+foot();
  host.innerHTML=h;
  var ta=document.getElementById("t54Full");
  if(ta) ta.addEventListener("input",function(){F.text=ta.value;var c=document.getElementById("t54Cnt");if(c)c.innerHTML=cnt(ta.value)});
  void key;
}
function topicKey(s){return String(s||"")}
function cnt(s){var n=len(s);return '字数（含空格）：<b style="color:'+(n>=600&&n<=700?"var(--ok)":n>700?"var(--bad)":"var(--warn)")+'">'+n+'</b> / 600–700'}
function aiFull(){
  var F=st.full,t=T(F.t),ta=document.getElementById("t54Full"); F.text=(ta&&ta.value)||F.text;
  if(len(F.text)<50){toast("先写作文（至少几句）");return}
  runAI("full","full",SYS_FULL,{"题型":t.name+"（"+t.ko+"）","题目":F.topic,"提示问题":t.qs,"字数":len(F.text),"学生作文":F.text},F.text,2500,function(r){
    var n=+r.total; if(isFinite(n)){PROG.essays.push({at:Date.now(),t:t.id,topic:F.topic,total:n,essay:F.text.slice(0,1200)});if(PROG.essays.length>30)PROG.essays=PROG.essays.slice(-30);saveP()}
  });
}

/* ---------- 对外 ---------- */
function paint(){
  if(!host) return;
  if(!D){host.innerHTML='<div class="card empty">加载中…</div>';return}
  if(st.view==="type") renderType(); else if(st.view==="drill") renderDrill(); else if(st.view==="full") renderFull(); else renderOver();
}
function render(box,opt){
  host=box; opt=opt||{};
  host.innerHTML='<div class="card empty">加载中…</div>';
  ensure().then(function(){
    var ty=T(opt.type)?opt.type:null;
    if(opt.mode==="random"){newRound(pick(D.types).id)}
    else if(opt.mode==="drill"){newRound(ty||pick(D.types).id)}
    else if(opt.mode==="full"){newFull(ty)}
    else if(ty){st.type=ty;st.view="type"}
    paint();
  }).catch(function(e){host.innerHTML='<div class="card empty">54 题型数据加载失败：'+esc(e.message)+'</div>'});
}
function link(){
  var b=(location.origin||"")+location.pathname+"?writing=54types";
  if(st.view==="type") return b+"&type="+st.type;
  if(st.view==="drill"&&st.R) return b+"&type="+st.R.t+"&mode=drill";
  if(st.view==="full") return b+"&mode=full"+(st.full?"&type="+st.full.t:"");
  return b;
}
function copyText(t){
  function fb(){var ta=document.createElement("textarea");ta.value=t;ta.style.cssText="position:fixed;opacity:0";document.body.appendChild(ta);ta.select();try{document.execCommand("copy");toast("链接已复制")}catch(x){prompt("请手动复制：",t)}document.body.removeChild(ta)}
  if(navigator.clipboard&&window.isSecureContext) navigator.clipboard.writeText(t).then(function(){toast("链接已复制")},fb); else fb();
}
function onClick(e){
  var b=e.target.closest("button[data-t54]"); if(!b||!host||!host.contains(b)) return false;
  var a=b.getAttribute("data-t54"), id=b.getAttribute("data-id");
  if(st.full){var ft=document.getElementById("t54Full");if(ft)st.full.text=ft.value}
  switch(a){
    case "over": st.view="over"; break;
    case "type": st.type=id; st.view="type"; break;
    case "drill": if(!st.R) newRound(st.type||pick(D.types).id); st.view="drill"; break;
    case "drillt": newRound(id); break;
    case "rand": newRound(pick(D.types).id); toast("随机："+T(st.R.t).name); break;
    case "full": if(!st.full) newFull(st.type); st.view="full"; break;
    case "fullt": newFull(id); break;
    case "randfull": if(st.full&&st.full.text.trim().length>20&&!confirm("换题会清空当前作文，确定？")) return true; newFull(null); break;
    case "check": check(false); return true;
    case "giveup": check(true); return true;
    case "next": st.R.i++; st.R.st="ask"; st.R.typed=""; break;
    case "redo": newRound(st.R.t,st.R.missed.slice()); break;
    case "ai1": ai1(); return true;
    case "aiall": aiAll(); return true;
    case "aifull": aiFull(); return true;
    case "aiset": if(AI()) AI().openSettings(function(){paint()}); return true;
    case "link": copyText(link()); return true;
  }
  paint(); try{host.scrollIntoView({block:"start"})}catch(x){}
  return true;
}
window.TopikW54Types={render:render,onClick:onClick,LS:LS,diff:diff,hints:hints};
})();
