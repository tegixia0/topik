/* TOPIK II 第 54 题 · 原因类万能模板（详解 + 逐句默写 + AI 批改）
   进度：localStorage topik.w54.tpl.v1（可同步）
   AI：assets/ai.js（window.TopikAI.chatJSON，Key 只在用户本机 localStorage）
   深链接：?writing=54tpl 或 ?writing=5354&tab=54tpl
   范文主题：1인 가구 증가（考试时把例子换成题面现象即可） */
(function(){
"use strict";
var LS="topik.w54.tpl.v1", LS_VIEW="topik.w54.tpl.view";
var PROG=load(LS,{}), view=loadView(), R=null, ai={};
var TOPIC="1인 가구";
window.addEventListener("topik-sync",function(){PROG=load(LS,{})});

function load(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v&&typeof v==="object"?v:d}catch(e){return d}}
function saveP(){try{localStorage.setItem(LS,JSON.stringify(PROG))}catch(e){}}
function loadView(){try{return localStorage.getItem(LS_VIEW)==="drill"?"drill":"guide"}catch(e){return"guide"}}
function saveView(){try{localStorage.setItem(LS_VIEW,view)}catch(e){}}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function toast(m){var t=document.getElementById("toast");if(!t)return;t.textContent=m;t.classList.add("show");clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove("show")},1800)}
function copyText(t,msg){
  var done=function(){toast(msg||"已复制")};
  function fb(){var ta=document.createElement("textarea");ta.value=t;ta.setAttribute("readonly","");ta.style.cssText="position:fixed;opacity:0";document.body.appendChild(ta);ta.select();try{document.execCommand("copy");done()}catch(x){prompt("请手动复制：",t)}document.body.removeChild(ta)}
  if(navigator.clipboard&&window.isSecureContext) navigator.clipboard.writeText(t).then(done,fb); else fb();
}
function AI(){return window.TopikAI||null}
function aiOK(){var A=AI();return !!(A&&A.active())}
function sq(s){return String(s==null?"":s).normalize("NFC").replace(/[\s\u00a0\u3000]+/g,"").replace(/[\p{P}\p{S}]/gu,"")}

/* ---------- 语法要点（例均取自 1인 가구 范文） ---------- */
var GRAM=[
  {f:"에 대한",zh:"关于……的",ex:"1인 가구에 대한 관심",tip:"N에 대한 N。不要写成「에 대해서의」。"},
  {f:"-기 때문이다",zh:"是因为……",ex:"가치관이 확산되기 때문이다",tip:"前接词干。原因段首选；句末保持 …기 때문이다。"},
  {f:"-게 되다",zh:"变得…… / 最终……",ex:"혼자 사는 것을 자연스럽게 받아들이게 된다",tip:"前接词干，表变化结果。"},
  {f:"-(으)ㄴ/는 점",zh:"……这一点",ex:"주거·생활비용 부담이 커지는 점",tip:"整句理由名词化。动现在 -는、过去 -(으)ㄴ；形 -(으)ㄴ。"},
  {f:"반면",zh:"另一方面",ex:"긍정적인 측면에서는 … 반면 …",tip:"对比优缺点。也常见「-는 반면」。"},
  {f:"-(으)ㄹ 수 있다",zh:"能够 / 可以……",ex:"시간을 자율적으로 쓸 수 있다",tip:"⚠️ 若写成「(으)로 수 있다」是漏了 ㄹ，应为「(으)ㄹ 수 있다」。"},
  {f:"에 따라",zh:"随着 / 根据……",ex:"사회 구조의 변화에 따라",tip:"表背景或依据。"},
  {f:"살펴보고자 한다",zh:"拟探讨……",ex:"원인과 영향을 살펴보고자 한다",tip:"论文式开场，比「알아보겠다」更书面。"}
];

/* ---------- 四段骨架：全文用「1인 가구」填好的可背范文 ---------- */
var PARAS=[
  {id:"p1",title:"第1段 · 提出现象与写作目的",sents:[
    {id:"p1s1",ko:"현대 사회에서 1인 가구 현상이 점차 두드러지면서 사람들의 생활 방식에도 변화가 나타나고 있다.",
      skel:"현대 사회에서 〇〇 현상이 점차 두드러지면서 사람들의 생활 방식에도 변화가 나타나고 있다.",
      zh:"在现代社会，一人家庭现象逐渐凸显，人们的生活方式也出现了变化。",
      tip:"开篇点出现象。范文用「1인 가구」；考试换成题面现象。「-면서」表伴随。"},
    {id:"p1s2",ko:"과거와 달리 오늘날에는 1인 가구에 대한 관심이 높아지고 있다.",
      skel:"과거와 달리 오늘날에는 〇〇에 대한 관심이 높아지고 있다.",
      zh:"与过去不同，如今人们对一人家庭的关注正在提高。",
      tip:"对比过去与现在。「에 대한」＝关于……的。可把「1인 가구」换成题面词。"},
    {id:"p1s3",ko:"따라서 이 글에서는 1인 가구가 나타나는 원인과 개인 및 사회에 미치는 영향을 살펴보고자 한다.",
      skel:"따라서 이 글에서는 〇〇이/가 나타나는 원인과 개인 및 사회에 미치는 영향을 살펴보고자 한다.",
      zh:"因此本文将探讨一人家庭出现的原因及其对个人与社会的影响。",
      tip:"点明结构：原因 + 个人/社会影响。「가구」末音开，用「가」。考试时按题面选 이/가。"}
  ]},
  {id:"p2",title:"第2段 · 原因（본론①）",sents:[
    {id:"p2s1",ko:"먼저 1인 가구가 나타나는 데에는 여러 가지 원인이 있다.",
      skel:"먼저 〇〇이/가 나타나는 데에는 여러 가지 원인이 있다.",
      zh:"首先，一人家庭的出现有多种原因。",
      tip:"原因段总起。「-는 데에는」＝在……方面 / 之所以……。"},
    {id:"p2s2",ko:"첫째, 개인주의와 독립적인 삶을 중시하는 가치관이 확산되기 때문이다.",
      skel:"첫째, [원인 1]기 때문이다.",
      zh:"第一，是因为重视个人主义与独立生活的价值观正在扩散。",
      tip:"「…기 때문이다」前接词干。范文＝원인1；考试换成题面原因。也可默写旧槽位 [원인 1]。"},
    {id:"p2s3",ko:"이러한 상황에서는 혼자 사는 것을 자연스럽게 받아들이게 된다.",
      skel:"이러한 상황에서는 [구체적인 설명]게 된다.",
      zh:"在这种情况下，人们就会自然地接受独自生活。",
      tip:"「…게 되다」前接词干。范文＝具体说明；可换成题面展开句。"},
    {id:"p2s4",ko:"둘째, 주거·생활비용 부담이 커지는 점도 중요한 원인 중 하나이다.",
      skel:"둘째, [원인 2](으)ㄴ/는 점도 중요한 원인 중 하나이다.",
      zh:"第二，居住与生活费用负担加重这一点也是重要原因之一。",
      tip:"「…는 점」名词化理由。动现在用 -는。范文＝원인2；考试可换。"},
    {id:"p2s5",ko:"특히 만혼·비혼 증가와 사회 구조의 변화에 따라 이러한 현상은 더욱 뚜렷해지고 있다.",
      skel:"특히 [변화의 배경]에 따라 이러한 현상은 더욱 뚜렷해지고 있다.",
      zh:"尤其随着晚婚·不婚增加与社会结构的变化，这一现象正变得更加明显。",
      tip:"「에 따라」＝随着……。背景可写成「기술 발전」等，按题面换。"}
  ]},
  {id:"p3",title:"第3段 · 对个人的影响（본론②）",sents:[
    {id:"p3s1",ko:"이러한 현상은 개인의 생활에도 다양한 변화를 가져온다.",
      zh:"这一现象也给个人生活带来各种变化。",
      tip:"个人影响段总起。本句无槽，可直接背。"},
    {id:"p3s2",ko:"긍정적인 측면에서는 시간을 자율적으로 쓸 수 있다는 점이 있다.",
      skel:"긍정적인 측면에서는 [개인적 장점](으)ㄹ 수 있다는 점이 있다.",
      zh:"从积极方面看，可以自主支配时间这一点值得指出。",
      tip:"⚠️ 正确为「(으)ㄹ 수 있다」（不是 로 수）。范文＝개인적 장점；考试换成题面优点。"},
    {id:"p3s3",ko:"반면 외로움과 생활비 부담이 커진다는 어려움도 생길 수 있다.",
      skel:"반면 [개인적 부담 또는 문제]다는 어려움도 생길 수 있다.",
      zh:"另一方面，也可能出现「孤独感与生活费负担加重」这样的困难。",
      tip:"「…다는」前接完整小句（예: …커진다는）。不要只填名词。"},
    {id:"p3s4",ko:"따라서 개인이 경험하는 변화에는 장점과 부담이 함께 존재한다.",
      zh:"因此个人所经历的变化中，优点与负担并存。",
      tip:"个人段小结：正反并提。"}
  ]},
  {id:"p4",title:"第4段 · 对社会的影响与收束（결론）",sents:[
    {id:"p4s1",ko:"사회적으로는 소형 주택과 배달 서비스에 대한 수요가 증가할 수 있다.",
      skel:"사회적으로는 [사회적 변화 1]에 대한 수요가 증가할 수 있다.",
      zh:"在社会层面，对小型住宅与外卖服务的需求可能增加。",
      tip:"「에 대한 수요」前接名词。范文＝사회적 변화1；考试换成相关产业/设施。"},
    {id:"p4s2",ko:"이는 관련 산업을 활성화하는 계기가 되지만, 동시에 고독사와 같은 문제도 드러낼 수 있다.",
      skel:"이는 [긍정적 영향]는 계기가 되지만, 동시에 [부정적 영향]와/과 같은 문제도 드러낼 수 있다.",
      zh:"这既能成为激活相关产业的契机，同时也可能暴露出孤独死之类的问题。",
      tip:"前空：冠形词干＋「는 계기」（활성화하＋는）。后空：名词＋와/과。"},
    {id:"p4s3",ko:"결국 1인 가구 현상은 개인의 선택만으로 설명하기 어려우며, 사회 구조와 가치관의 변화까지 함께 보여 주는 현상이라고 할 수 있다.",
      skel:"결국 〇〇 현상은 개인의 선택만으로 설명하기 어려우며, 사회 구조와 가치관의 변화까지 함께 보여 주는 현상이라고 할 수 있다.",
      zh:"总之，一人家庭现象难以仅用个人选择来解释，可以说它也一并反映了社会结构和价值观的变化。",
      tip:"收束：个人＋社会结构＋价值观。保持 -다 体。考试把「1인 가구」换成题面。"}
  ]}
];

var ALL=[]; PARAS.forEach(function(p){p.sents.forEach(function(s){s.para=p.id;s.ptitle=p.title;ALL.push(s)})});
ALL.forEach(function(s,i){s.i=i});

var FULL_KO=PARAS.map(function(p){return "【"+p.title+"】\n"+p.sents.map(function(s){return s.ko}).join("\n")}).join("\n\n");
var NOTE="下面是用「1인 가구 증가」填好的完整骨架范文，方便背结构与语法。考试时把例子换成题面现象、原因与影响，并扩写到 600–700 字（含空格）。全文用 -(ㄴ/는)다 体，不要用 -습니다 / -아/어요。";

/* 槽位：韩文标签 → 中文等同写法（默写旧骨架时仍可用） */
var SLOTS={
  "원인 1":["원인1","원인 １","原因1","原因 1"],
  "구체적인 설명":["具体说明","具体的说明"],
  "원인 2":["원인2","原因2","原因 2"],
  "변화의 배경":["变化的背景","变化背景"],
  "개인적 장점":["个人优点","个人长处"],
  "개인적 부담 또는 문제":["个人负担或问题","个人负担","个人问题"],
  "사회적 변화 1":["사회적 변화1","社会变化1","社会变化 1"],
  "긍정적 영향":["积极影响","正面影响"],
  "부정적 영향":["消极影响","负面影响"]
};

/* ---------- 判分 ---------- */
function letters(t){
  var n=window.TopikAcc&&TopikAcc.normalize?TopikAcc.normalize(t):String(t||"").normalize("NFC").replace(/[\s\p{P}\p{S}]/gu,"");
  return n.replace(/[^\uac00-\ud7a3\u3131-\u318e〇○●§\u4e00-\u9fff0-9A-Za-z]/g,"")
    .replace(/[〇○●]/g,"〇")
    .replace(/하였/g,"했").replace(/되었/g,"됐");
}
function expandMorph(s){
  var raw=String(s||"").normalize("NFC"), todo=[raw], out={}, n=0;
  while(todo.length&&n++<600){
    var t=todo.pop(), m;
    if((m=t.match(/\(으\)ㄴ\/는/))){todo.push(t.replace(m[0],"은"));todo.push(t.replace(m[0],"는"));todo.push(t.replace(m[0],"ㄴ"));continue}
    if((m=t.match(/\(으\)ㄹ/))){todo.push(t.replace(m[0],"을"));todo.push(t.replace(m[0],"ㄹ"));continue}
    if((m=t.match(/\(으\)/))){todo.push(t.replace(m[0],"으"));todo.push(t.replace(m[0],""));continue}
    if((m=t.match(/\(([^()]*)\)/))){todo.push(t.replace(m[0],m[1]));todo.push(t.replace(m[0],""));continue}
    if((m=t.match(/([\uac00-\ud7a3〇])\/([\uac00-\ud7a3〇])/))){todo.push(t.replace(m[0],m[1]));todo.push(t.replace(m[0],m[2]));continue}
    out[letters(t)]=1;
  }
  return Object.keys(out);
}
function unifySlots(s){
  var t=String(s||"");
  t=t.replace(/[\[【]\s*([^\]】]+?)\s*[\]】]/g,function(_,inner){
    var key=inner.replace(/\s+/g,"");
    var hit=null;
    Object.keys(SLOTS).forEach(function(k){
      if(hit) return;
      if(k.replace(/\s+/g,"")===key||k===inner) hit=k;
      else if(SLOTS[k].some(function(a){return a.replace(/\s+/g,"")===key||a===inner})) hit=k;
    });
    return "§"+(hit||inner)+"§";
  });
  return t;
}
function politeBad(u){
  var s=String(u||"").normalize("NFC").replace(/\s+/g,"");
  return /(습니다|ㅂ니다|입니까|세요|해요|이에요|예요|아요|어요)[.!?。]*$/.test(s);
}
/* 范文主答案 + 旧骨架 + 把主题换成 〇〇 的变体 */
function candList(s){
  var list=[], seen={};
  function add(x){if(!x)return;var k=String(x);if(seen[k])return;seen[k]=1;list.push(x)}
  add(s.ko); add(s.skel);
  if(s.alts) s.alts.forEach(add);
  if(s.ko&&s.ko.indexOf(TOPIC)>=0){
    add(s.ko.split(TOPIC).join("〇〇"));
    add(s.ko.split(TOPIC).join("OO"));
  }
  return list;
}
function matchOne(std, input){
  var S=expandMorph(unifySlots(std)).map(letters);
  var U=expandMorph(unifySlots(input)).map(letters);
  if(!U.length) return null;
  if(U.some(function(u){return S.indexOf(u)>=0})) return {ok:true};
  function bare(x){return x.replace(/〇+/g,"").replace(/§[^§]+§/g,"").replace(/1인가구/g,"")}
  var bS=S.map(bare), bU=U.map(bare);
  if(bS.some(function(s){return s.length>=8&&bU.indexOf(s)>=0})) return {ok:true,loose:true};
  return {ok:false};
}
function matchSent(stdOrSent, input){
  if(!String(input||"").trim()) return null;
  if(politeBad(input)) return {ok:false,why:"大作文请用 -다 体（不要用 -습니다 / -아·어요）"};
  var cands;
  if(stdOrSent&&typeof stdOrSent==="object"&&stdOrSent.ko) cands=candList(stdOrSent);
  else cands=[stdOrSent];
  var i,r,best=null;
  for(i=0;i<cands.length;i++){
    r=matchOne(cands[i],input);
    if(r&&r.ok) return r;
    if(r) best=r;
  }
  return best||{ok:false};
}

/* ---------- 进度 ---------- */
function pg(){return PROG.cause||(PROG.cause={seen:0,lastOk:0,lastN:ALL.length,lastAt:0})}
function markRound(ok,n){var p=pg();p.seen=(p.seen||0)+1;p.lastOk=ok;p.lastN=n;p.lastAt=Date.now();PROG.cause=p;saveP()}

/* ---------- 轮次状态 ---------- */
function newRound(startAt, list){
  var q=list&&list.length?list.slice():ALL.slice();
  var i=0;
  if(list==null&&startAt!=null){
    i=Math.max(0,Math.min(ALL.length-1,+startAt||0));
    q=ALL.slice(i);
  }
  R={q:q,i:0,ok:0,bad:0,missed:[],ans:{},st:"ask",typed:"",tries:0,counted:false,fixed:false,why:"",redo:!!(list&&list.length),done:false};
  ai={};
}
function cur(){return R&&R.q[R.i]}

/* ---------- AI（镜像 tpl54types：原因类骨架默写） ---------- */
var SYS_S=["你是严格但公正的韩语写作老师，批改备考 TOPIK 5 级的中国学习者在 TOPIK II 第54题「原因类骨架默写」里的句子。只输出一个 JSON 对象。",
"判断学生句子本身是否是正确、自然、书面的韩语，并表达了中文意思。范文只是参考：用词或结构不同但语法正确、意思一致的 -다 体改写算对（correct=true）。",
"必须指出的错误：助词错误（을/를 vs 이/가）、拼写错误、活用错误、时态错误、意思不符、漏掉关键内容。",
"文体规则：必须用 -다 体。用 -습니다/-아요/반말 → 错。形容词误加 -ㄴ다/-는다（필요한다、많는다）→ 错。",
"errors 中 wrong 必须是从学生答案原样摘出的片段；指不出具体片段就 correct=true。",
'输出：{"correct":true/false,"errors":[{"wrong":"","right":"","why":"简体中文"}],"corrected":"在学生答案上最小修改后的正确句子","tip":"📌 一条中文提示"}'].join("\n");
var SYS_ALL=["你是严格但公正的韩语写作老师。学生凭记忆默写了 TOPIK 54 题「原因类」骨架范文（主题：1인 가구 증가）。请逐句对照范文检查（同义 -다 体改写只要语法正确、意思一致就算对），只输出一个 JSON 对象。",
"重点检查：助词（을/를 vs 이/가）、拼写、活用、-다 体、形容词误加 -ㄴ다、漏句或意思偏离。",
"wrong 必须是学生原文中的片段。用简体中文解释。",
'输出：{"summary":"整体评价（中文，2-3句）","ok_count":数字,"total":数字,"errors":[{"wrong":"","right":"","why":""}],"tip":"📌 最该注意的一点"}'].join("\n");

function aiBar(){
  var A=AI(); if(!A) return '<div class="minfo">AI 模块未加载</div>';
  return '<div class="minfo t54ai">🤖 AI 批改：'+(aiOK()?"已开启":(A.hasKey()?"已关闭":"未设置 Key"))+' <button type="button" class="gbtn ai-mini" data-tpl-a="aiset">⚙️ 设置</button></div>';
}
function aiBox(key){
  var a=ai[key]; if(!a) return "";
  if(a.st==="wait") return '<div class="gai wait">🤖 AI 批改中…</div>';
  if(a.st==="err") return '<div class="gai err">🤖 '+esc(a.msg)+'</div>';
  var r=a.r, h="";
  function errs(L){return L&&L.length?'<ul class="gai-err">'+L.map(function(e){return '<li><span class="w" lang="ko">'+esc(e.wrong)+'</span> → <span class="r" lang="ko">'+esc(e.right)+'</span>'+(e.why?'<div class="why">'+esc(e.why)+'</div>':'')+'</li>'}).join("")+'</ul>':''}
  if(a.kind==="s"){
    h='<div class="gai '+(r.correct?"ok":"bad")+'"><div class="gai-t">🤖 '+(r.correct?"AI：这样写也对 ✓（已计为对）":"AI：有错误")+'</div>'+errs(r.errors);
    if(r.corrected&&!r.correct) h+='<div class="gai-fix">改正：<b lang="ko">'+esc(r.corrected)+'</b></div>';
  }else{
    h='<div class="gai"><div class="gai-t">🤖 '+esc(r.ok_count!=null?("约 "+r.ok_count+"/"+(r.total||"")+" 句正确"):"批改结果")+'</div><div>'+esc(r.summary||"")+'</div>'+errs(r.errors);
  }
  if(r.tip) h+='<div class="gai-tip">'+esc(r.tip)+'</div>';
  return h+'</div>';
}
function cleanErr(L,text){return (Array.isArray(L)?L:[]).filter(function(e){return e&&typeof e==="object"&&e.wrong&&sq(text).indexOf(sq(e.wrong))>=0}).slice(0,12).map(function(e){return {wrong:String(e.wrong),right:String(e.right||""),why:String(e.why||"")}})}
function runAI(key,kind,sys,user,text,max,after){
  var A=AI(); if(!A){toast("AI 模块未加载");return}
  if(!A.active()){A.openSettings(function(){paint()});toast(A.hasKey()?"AI 判题已关闭，请开启":"先设置 AI Key");return}
  ai[key]={st:"wait",kind:kind}; paint();
  A.chatJSON(sys,user,{maxTokens:max||800,timeout:max>1000?60000:25000}).then(function(r){
    r.errors=cleanErr(r.errors,text);
    if(kind==="s"&&r.correct===false&&!r.errors.length) r.correct=true;
    ai[key]={st:"done",kind:kind,r:r}; if(after) after(r); paint();
  },function(e){ai[key]={st:"err",kind:kind,msg:(e&&e.message)||"AI 出错"};paint()});
}
function aiPass(){
  if(!R||R.st==="ok") return;
  var c=cur(), i=R.missed.indexOf(c);
  if(i>=0){R.missed.splice(i,1); if(R.bad>0)R.bad--; R.ok++}
  else if(R.counted){if(R.bad>0)R.bad--; R.ok++}
  else {R.ok++}
  R.st="ok"; R.fixed=true; R.counted=true;
}
function ai1(){
  var c=cur(); if(!c||!R.typed||!R.typed.trim()){toast("先写一写");return}
  runAI("s"+c.id,"s",SYS_S,{"题目类型":"原因类骨架默写","作文主题":"1인 가구 증가","中文":c.zh,"范文句子":c.ko,"学生答案":R.typed},R.typed,800,function(r){if(r.correct)aiPass()});
}
function aiAll(){
  if(!R) return;
  var mine=R.q.map(function(s,i){return (i+1)+". "+(R.ans[s.id]||"（空）")}).join("\n");
  runAI("all","all",SYS_ALL,{"作文主题":"1인 가구 증가","范文（逐句）":R.q.map(function(s,i){return (i+1)+". "+s.ko}).join("\n"),"中文提示":R.q.map(function(s,i){return (i+1)+". "+s.zh}).join("\n"),"学生默写":mine},mine,1500);
}

/* ---------- 详解 ---------- */
function renderGuide(box){
  var p=pg(), h='<div class="tpl54">';
  h+=viewSeg("guide");
  h+='<div class="card tpl54-warn"><b>⚠️ 骨架提示</b><div>'+esc(NOTE)+'</div>';
  h+='<div class="minfo" style="margin-top:6px">范文主题：<b lang="ko">1인 가구 증가</b>（一人家庭增加）</div>';
  if(p.seen) h+='<div class="minfo" style="margin-top:6px">本机默写：练过 '+p.seen+' 轮 · 最近对 '+(p.lastOk||0)+'/'+(p.lastN||ALL.length)+'</div>';
  h+='</div>';

  h+='<div class="gcat">如何填写（先看填好的例子）</div><div class="card"><ul class="w54chk">';
  h+='<li><b>现象词</b>：范文全文用 <span lang="ko">1인 가구</span>。考试＝换成题面现象（如 재택근무）。</li>';
  h+='<li><b>원인 1</b> 例：<span lang="ko">개인주의와 독립적인 삶을 중시하는 가치관이 확산되기 때문이다</span></li>';
  h+='<li><b>구체 설명</b> 例：<span lang="ko">혼자 사는 것을 자연스럽게 받아들이게 된다</span></li>';
  h+='<li><b>원인 2</b> 例：<span lang="ko">주거·생활비용 부담이 커지는 점</span></li>';
  h+='<li><b>변화 배경</b> 例：<span lang="ko">만혼·비혼 증가와 사회 구조의 변화</span></li>';
  h+='<li><b>개인 장점</b> 例：<span lang="ko">시간을 자율적으로 쓸 수 있다</span>（注意 <b>ㄹ</b> 수 있다）</li>';
  h+='<li><b>개인 부담</b> 例：<span lang="ko">외로움과 생활비 부담이 커진다는</span></li>';
  h+='<li><b>社会</b> 例：수요＝소형 주택과 배달 서비스；계기＝관련 산업을 활성화하는；문제＝고독사</li>';
  h+='<li>默写以范文句为准；旧槽位写法（〇〇 / [원인 1]）仍判对。考试＝整篇换成题面内容并扩写。</li>';
  h+='</ul><div class="racts"><button type="button" class="gbtn" data-tpl-a="copyall">📋 复制完整范文骨架</button><button type="button" class="gbtn pri" data-tpl-a="godrill">✏️ 开始逐句默写</button><button type="button" class="gbtn" data-a="go54types">📚 其他题型（利弊/对策/必要性/态度/观点）</button></div></div>';

  h+='<div class="gcat">语法要点</div><div class="card" style="padding:0"><div style="overflow-x:auto"><table class="ctbl w54tbl"><tr><th>语法</th><th>意思</th><th>用法</th></tr>';
  GRAM.forEach(function(g){
    h+='<tr><td lang="ko"><b>'+esc(g.f)+'</b></td><td>'+esc(g.zh)+'</td><td>'+esc(g.tip)+(g.ex?'<div class="minfo" lang="ko" style="margin:2px 0 0">例：'+esc(g.ex)+'</div>':"")+'</td></tr>';
  });
  h+='</table></div></div>';

  PARAS.forEach(function(para){
    h+='<div class="gcat">'+esc(para.title)+'</div>';
    para.sents.forEach(function(s){
      h+='<details class="gi tpl54-sent" open><summary><span class="f">句 '+(s.i+1)+'</span><span class="z">'+esc(s.zh)+'</span></summary><div class="gbody">';
      h+='<div class="tplrow"><div class="tk">韩语范文</div><div class="tv" lang="ko">'+esc(s.ko)+'</div></div>';
      if(s.skel) h+='<div class="row"><span class="k">可替换骨架</span><span lang="ko">'+esc(s.skel)+'</span></div>';
      h+='<div class="row"><span class="k">中文</span>'+esc(s.zh)+'</div>';
      h+='<div class="row"><span class="k mem">填空 / 语法</span>'+esc(s.tip)+'</div>';
      h+='<div class="racts"><button type="button" class="gbtn" data-tpl-a="drillat" data-i="'+s.i+'">✏️ 从这句开始默写</button></div>';
      h+='</div></details>';
    });
  });
  h+='<div class="card tpl54-warn" style="margin-top:10px"><b>再次提醒</b><div>'+esc(NOTE)+'</div></div></div>';
  box.innerHTML=h+footHTML();
}

function viewSeg(active){
  return '<div class="seg" data-tpl="view"><button type="button" data-v="guide" class="'+(active==="guide"?"active":"")+'">📖 详解</button><button type="button" data-v="drill" class="'+(active==="drill"?"active":"")+'">✏️ 逐句默写</button></div>';
}
function retryBtn(){return '<div class="racts gretry-row"><button type="button" class="gbtn gretry" data-tpl-a="retry">✏️ 再写一次</button></div>'}
function drillBtns(){
  if(R.st==="ask") return '<button type="button" class="b-primary" data-tpl-a="check">检查</button><button type="button" class="b-ghost" data-tpl-a="giveup">不会，看答案</button>';
  return '<button type="button" class="b-primary full" data-tpl-a="next">下一句 →</button>';
}

/* ---------- 默写 ---------- */
function renderDrill(box){
  if(!R) newRound(0);
  var p=pg(), n=R.q.length, c=cur();
  var h='<div class="tpl54 wg">'+viewSeg("drill");
  h+='<div class="minfo">范文主题：<b lang="ko">1인 가구 증가</b> · 背填好的句子；考试再换成题面</div>';
  h+='<div class="bar"><span>'+(R.redo?"错句重练":"进度")+' <b>'+Math.min(R.i+1,n)+"/"+n+'</b></span><span class="sp"></span><span>对 <b style="color:var(--ok)">'+R.ok+'</b></span><span>错 <b style="color:var(--bad)">'+R.bad+'</b></span></div>';
  h+='<div class="progress"><i style="width:'+(n?Math.round(100*R.i/n):0)+'%"></i></div>';
  if(p.seen) h+='<div class="minfo">历史：练过 '+p.seen+' 轮 · 最近 '+(p.lastOk||0)+'/'+(p.lastN||ALL.length)+'</div>';

  if(R.i>=n){
    if(!R.done){markRound(R.ok,n);R.done=true}
    var hasAns=R.q.some(function(s){return !!(R.ans[s.id]&&String(R.ans[s.id]).trim())});
    h+='<div class="card"><div class="score">'+R.ok+'<small>/'+n+'</small></div>';
    h+='<div class="minfo" style="text-align:center">'+(R.redo?"错句重练":"本轮")+'完成'+(R.missed.length?' · 错了 '+R.missed.length+' 句':" 🎉")+'</div>';
    h+='<div class="racts">';
    if(R.missed.length) h+='<button type="button" class="gbtn pri" data-tpl-a="redomiss">重练错句（'+R.missed.length+'）</button>';
    h+='<button type="button" class="gbtn'+(R.missed.length?"":" pri")+'" data-tpl-a="again">完整再来一轮</button>';
    h+='<button type="button" class="gbtn" data-tpl-a="guide">回详解</button></div>';
    if(hasAns&&!R.redo){
      h+='<div class="gcat">🤖 整篇 AI 批改</div><div class="minfo">把你本轮默写的全部句子交给 AI，对照范文逐句检查（同义改写只要语法和意思对就算对）。</div>';
      h+='<div class="racts"><button type="button" class="gbtn pri" data-tpl-a="aiall">🤖 AI 批改整篇默写</button></div>'+aiBox("all");
    }
    h+=aiBar()+'</div></div>';
    box.innerHTML=h+footHTML(); return;
  }

  h+='<div class="card" id="tpl54Card">';
  h+='<div class="label"><span>看中文 → 写韩语范文句</span><span class="tag">'+esc(c.ptitle)+' · 句 '+(c.i+1)+'</span></div>';
  if(R.tries) h+='<div class="gretry-note">✏️ 第 '+(R.tries+1)+' 次写 · 答案已隐藏'+(R.counted?'，第一次仍记为错':'')+'</div>';
  h+='<div class="prompt sent">'+esc(c.zh)+'</div>';
  h+='<div class="cueline">💡 默写范文（1인 가구…）；旧写法 〇〇 / [원인 1] 仍算对；保持 -다 体</div>';
  h+='<textarea class="answer" id="tpl54In" lang="ko" rows="3" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="写韩语范文句…"'+(R.st!=="ask"?" disabled":"")+">"+esc(R.typed||"")+"</textarea>";
  h+='<div id="tpl54Fb">';
  if(R.st==="ok"||R.st==="bad"){
    var ok=R.st==="ok";
    h+='<div class="fbx '+(ok?"ok":"bad")+'"><div class="title">'+(ok?("✓ 对了"+(R.fixed?"（重写/AI 后答对）":"")):("✗ "+(R.why||"不对")))+'</div>';
    h+='<div class="ansline" lang="ko">'+esc(c.ko)+'</div>';
    if(R.typed) h+='<div class="mine">你写的：<span lang="ko">'+esc(R.typed)+'</span></div>';
    h+='</div><div class="row" style="margin-top:8px"><span class="k mem">提示</span>'+esc(c.tip)+'</div>';
    if(!ok) h+=retryBtn();
    if(!ok&&R.typed&&R.typed.trim()){
      h+='<div class="racts"><button type="button" class="gbtn pri" data-tpl-a="ai1">🤖 AI 判：我的写法算对吗？</button></div>'+aiBox("s"+c.id);
    }
  }
  h+='</div><div class="actions">'+drillBtns()+'</div></div>';
  h+=aiBar()+'</div>';
  box.innerHTML=h+footHTML();
  var ta=document.getElementById("tpl54In");
  if(ta&&R.st==="ask"){
    ta.addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();doCheck()}});
    try{ta.focus({preventScroll:true})}catch(x){}
  }
}
function footHTML(){return '<footer><div>54 原因类万能模板 · '+ALL.length+' 句 · 范文 1인 가구</div><div><button type="button" data-tpl-a="link">🔗 复制本页链接</button></div></footer>'}

function doCheck(){
  var ta=document.getElementById("tpl54In"); R.typed=(ta&&ta.value)||"";
  var c=cur(); R.ans[c.id]=R.typed;
  var r=matchSent(c,R.typed);
  if(r&&r.ok){
    if(!R.counted){R.ok++;R.st="ok"} else{R.fixed=true;R.st="ok";toast("重写后答对 👍")}
  }else{
    if(!R.counted){R.bad++;R.missed.push(c);R.counted=true}
    R.st="bad"; R.why=(r&&r.why)||"";
  }
  paint();
}
function doGiveup(){
  var ta=document.getElementById("tpl54In"); R.typed=(ta&&ta.value)||"";
  var c=cur(); R.ans[c.id]=R.typed;
  if(!R.counted){R.bad++;R.missed.push(c);R.counted=true}
  R.st="bad"; R.why=""; paint();
}
function doRetry(){R.st="ask";R.typed="";R.tries=(R.tries||0)+1;R.why=""; if(cur()) delete ai["s"+cur().id]; paint()}
function doNext(){R.i++;R.st="ask";R.typed="";R.tries=0;R.counted=false;R.fixed=false;R.why="";paint()}

/* ---------- 对外 ---------- */
var host=null;
function paint(){if(!host)return; if(view==="drill") renderDrill(host); else renderGuide(host)}
function render(box,opt){
  host=box;
  if(opt&&opt.view) view=opt.view==="drill"?"drill":"guide";
  if(opt&&opt.start!=null){view="drill";newRound(+opt.start)}
  else if(view==="drill"&&!R) newRound(0);
  saveView(); paint();
}
function onClick(e){
  var b=e.target.closest("button"); if(!b||!host||!host.contains(b)) return false;
  var seg=b.closest(".seg[data-tpl]");
  if(seg&&b.hasAttribute("data-v")){
    view=b.getAttribute("data-v")==="drill"?"drill":"guide"; saveView();
    if(view==="drill"&&!R) newRound(0);
    if(view==="guide") R=null;
    paint(); return true;
  }
  var a=b.getAttribute("data-tpl-a"); if(!a) return false;
  if(a==="copyall"){copyText(FULL_KO+"\n\n——\n"+NOTE,"范文骨架已复制");return true}
  if(a==="godrill"||a==="again"){view="drill";saveView();newRound(0);paint();return true}
  if(a==="guide"){view="guide";saveView();R=null;paint();return true}
  if(a==="drillat"){view="drill";saveView();newRound(+b.getAttribute("data-i")||0);paint();return true}
  if(a==="check"){doCheck();return true}
  if(a==="giveup"){doGiveup();return true}
  if(a==="retry"){doRetry();return true}
  if(a==="next"){doNext();return true}
  if(a==="ai1"){ai1();return true}
  if(a==="aiall"){aiAll();return true}
  if(a==="aiset"){if(AI()) AI().openSettings(function(){paint()});return true}
  if(a==="redomiss"){
    if(!R||!R.missed.length){ return true}
    var miss=R.missed.slice(); view="drill"; saveView(); newRound(0,miss); paint(); return true;
  }
  if(a==="link"){copyText((location.origin||"")+location.pathname+"?writing=54tpl","链接已复制");return true}
  return true;
}

window.TopikW54Tpl={render:render,onClick:onClick,LS:LS,ALL:ALL,matchSent:matchSent,TOPIC:TOPIC,AI:AI,runAI:runAI,setView:function(v){view=v==="drill"?"drill":"guide";saveView()}};
})();
