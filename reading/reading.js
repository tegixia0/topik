/* TOPIK II 阅读真题练习模块 —— 数据：reading/rounds.json（官方公开真题 + 官方答案） */
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var LS="topik.reading.v1", LS_MOCK="topik.reading.mock.v1", LS_OPT="topik.reading.opt.v1", LS_VWRONG="topik.wrong.v1";
var D=null, Q=[], byId={}, groups={}, T={}, st=load(LS,{a:{},w:{}}), opt=load(LS_OPT,{tab:"prac",round:"all",type:"all",wrong:false,idx:0});
var timerId=null, root=null, NUM=["①","②","③","④"];
function load(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v&&typeof v==="object"?v:d}catch(e){return d}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
/* ☁️ 同步合并了其他设备的进度（assets/sync.js）：重新读取，避免内存里的旧数据覆盖 */
window.addEventListener("topik-sync",function(){st=load(LS,{a:{},w:{}});st.a=st.a||{};st.w=st.w||{}});
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function rich(s){return esc(s).replace(/&lt;(\/?)u&gt;/g,"<$1u>").replace(/\(\s*(㉠|㉡|㉢|㉣)\s*\)/g,"<b class=\"slot\">( $1 )</b>").replace(/\(\s{2,}\)/g,"<span class=\"blank\">(　　　　　)</span>").replace(/\n/g,"<br>")}
function plain(s){return String(s||"").replace(/<\/?u>/g,"")}
function toast(m){var t=$("toast");if(!t){alert(m);return}t.textContent=m;t.classList.add("show");clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove("show")},1800)}
function copy(txt,okMsg){
  if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(txt).then(function(){toast(okMsg||"已复制")},function(){prompt("复制下面的内容：",txt)})}
  else prompt("复制下面的内容：",txt);
}
var TIPS={
 grammar:["先看空格后面的句子：是结果、目的还是条件？再选连接语尾。","-다가（中途/意外）、-고 나서（先后）、-(으)려고（打算）、-느라고（忙着）是高频。","把选项逐个代入读一遍，语感不通的立刻排除。"],
 synonym:["先把划线部分翻成中文，再找意思一样的选项。","常考对：-기만 하면=-(으)ㄹ 때마다；-아/어 봐야=-ㄴ다고 해도；-는 바람에=-(으)ㄴ 탓에；-아/어야만 했다=-(으)ㄹ 수밖에 없었다。","注意正负方向：덕분에（好）≠ 탓에（坏）。"],
 ad:["抓关键词：마셔요→饮料；세탁/건조→洗衣房；등산+담배→火灾预防。","第8题常是“说明文字”：-(으)십시오/-면 안 됩니다→注意事项；선택하십시오/입력하십시오→方法。","不必读懂每个字，找名词和动词即可。"],
 match:["先读选项，再回原文/图表逐项核对，一个不符就排除。","图表题：注意“가장/두 번째/절반/~보다 높다”，用数字算一遍。","短文题：选项常把原文“换说法”，也常把“一开始/现在”“有/没有”偷换。"],
 order:["先排除不能开头的句子：以 그러나/그래서/그런데/또한/이/그/이런/이 때문에 开头的一般不能第一句。","第一句通常是话题引入或一般事实（~이 있다、누구나 ~）。","看选项只有两种开头，先定开头再看指示词衔接。"],
 blank:["空格前后各读一句，找同义复述或对比（하지만/-이 아니라）。","空格常是后文例子的概括：后面举例→空格填总结。","把答案代入，整段逻辑要通顺。"],
 long:["19题多为连接副词：만약↔-다면；비록↔-지만/-더라도；게다가=追加；반면=对比。","21题惯用语：열을 올리다（热衷）、머리를 맞대다（聚首商量）、손을 떼다（撒手）。","23题心情：看划线句前后的事件；24题内容一致逐项核对。"],
 headline:["标题常省略谓语和助词，先补全成句子。","高频词：껑충（猛增）、뒷전（被搁置）、미지수（未知数）、유력（很有可能）、고조（高涨）、지지부진（迟迟没进展）。","逗号前后常是“原因, 结果”或“事实, 评价”。"],
 blank2:["说明文填空：答案常是全文主题的换说法。","注意 그러나/그래서/이처럼 后面的句子，往往就是空格要填的核心。","排除“只是手段、不是目的”的选项。"],
 match2:["先读选项，再定位原文关键词。","常见陷阱：数字（1~2周/1年）、主体偷换（谁做的）、程度（가장/항상/전혀）。","原文没提到的选项直接排除。"],
 theme:["主旨通常在最后一两句或 그러나/하지만/따라서 之后。","找 -아/어야 한다、-(으)ㄹ 필요가 있다、중요하다、바람직하다 等作者观点句。","排除只讲背景/例子的选项。"],
 insert:["先读<보기>，找指示词（이/그/이러한）和连接词（그러나/그래서/또한）。","<보기>里的“이 방법/그 효과”必须放在方法/措施之后。","放进去后，前后句要自然衔接；后一句常是对<보기>的解释或结果。"],
 long2:["42题人物心情：看划线部分前后的事件和语气（서운하다=对亲近的人失望）。","46/50题作者态度：우려하다（担忧）/긍정적으로 평가하다（积极评价）/비판하다（批判）；看评价性词汇。","48题写作目的：看 하지만 之后作者的主张（지적하려고/주장하려고/강조하려고）。"]
};
function dataUrl(p){return p+(p.indexOf("?")<0?"?v=":"&v=")+Date.now().toString(36).slice(0,6)}
function ensure(){
  if(D) return Promise.resolve();
  return fetch(dataUrl("reading/rounds.json"),{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()}).then(function(d){
    D=d; groups=d.groups||{}; T={}; (d.types||[]).forEach(function(t){T[t.id]=t});
    Q=(d.questions||[]).slice().sort(function(a,b){return b.round-a.round||a.n-b.n}); byId={}; Q.forEach(function(q){byId[q.id]=q});
  });
}
function open(o){
  root=$("reading"); o=o||{};
  if(o.type){opt.type=o.type; opt.tab="prac"; opt.idx=0; opt.wrong=false; if(!o.round) opt.round="all"}
  if(o.round&&!o.type){opt.type="all"}
  if(o.round){opt.round=String(o.round); opt.tab="prac"; opt.idx=0}
  if(o.tab) opt.tab=o.tab;
  if(o.wrong){opt.wrong=true;opt.tab="prac";opt.idx=0}
  save(LS_OPT,opt);
  $("rBody").innerHTML='<div class="card empty">加载中…</div>';
  ensure().then(function(){
    if(opt.type!=="all"&&!T[opt.type]){toast("没有这个题型："+opt.type);opt.type="all"}
    if(opt.round!=="all"&&!D.rounds.some(function(r){return String(r.round)===opt.round})){
      toast("第"+opt.round+"回暂未收录；已显示全部回次"); opt.round="all";
    }
    setTab(opt.tab);
  }).catch(function(e){$("rBody").innerHTML='<div class="card empty">阅读题库加载失败：'+esc(e.message)+"</div>"});
}
function setTab(t){
  if(["prac","mock","wrong","tips"].indexOf(t)<0)t="prac";
  opt.tab=t; save(LS_OPT,opt);
  Array.prototype.forEach.call(document.querySelectorAll("#rtabs button"),function(b){b.classList.toggle("active",b.getAttribute("data-tab")===t)});
  if(t!=="mock"&&timerId){clearInterval(timerId);timerId=null}
  ({prac:renderPrac,mock:renderMock,wrong:renderWrong,tips:renderTips})[t]();
  window.scrollTo(0,0);
}
/* ---------- 单元（共享文章的题目放一起） ---------- */
function filtered(){
  return Q.filter(function(q){return (opt.round==="all"||String(q.round)===opt.round)&&(opt.type==="all"||q.type===opt.type)&&(!opt.wrong||st.w[q.id])});
}
function units(list){
  var out=[],cur=null;
  list.forEach(function(q){
    if(q.gid&&cur&&cur.gid===q.gid) cur.qs.push(q);
    else {cur={gid:q.gid,qs:[q]}; out.push(cur)}
  });
  return out;
}
function label(q){return "真题 第"+q.round+"回 第"+q.n+"题"}
function typeLabel(q){return (T[q.type]||{}).label||q.type}
function qHead(q){
  return '<span class="rtag real">'+label(q)+'</span><span class="rtag type">'+esc(typeLabel(q))+'</span>'+(q.sub?'<span class="rtag sub">'+esc(q.sub)+'</span>':"");
}
function passHTML(q){
  var h="";
  if(q.img) h+='<img class="rimg" loading="lazy" src="'+esc(q.img)+'" alt="第'+q.round+'回第'+q.n+'题 图片（原卷截图）">';
  if(q.passage&&!q.img) h+='<div class="rpass">'+rich(q.passage)+'</div>';
  if(q.bogi) h+='<div class="rbogi"><b>&lt;보기&gt;</b>'+rich(q.bogi)+'</div>';
  return h;
}
function unitHTML(u,mode){
  var q0=u.qs[0], h='<div class="rcard">';
  if(u.gid){
    var g=groups[u.gid]||{};
    h+='<div class="rhdr"><span class="rtag real">真题 第'+q0.round+'回 第'+g.range[0]+'～'+g.range[1]+'题</span> ※ '+esc(q0.instr)+'</div>';
    h+='<div class="rpass">'+rich(g.passage)+'</div>';
    if(mode!=="mock"&&g.tr) h+='<details class="tr"><summary>中文翻译（建议做完再看）</summary><div class="rx"><p>'+rich(g.tr)+'</p></div></details>';
  }
  u.qs.forEach(function(q){h+=qHTML(q,mode,!!u.gid)});
  return h+'</div>';
}
function qHTML(q,mode,inGroup){
  var h='<div class="rq" data-id="'+q.id+'">';
  if(!inGroup){h+='<div class="rhdr">'+qHead(q)+'<br>※ '+esc(q.instr)+'</div>'+passHTML(q)}
  else h+='<div class="rhdr">'+qHead(q)+'</div>'+(q.bogi?'<div class="rbogi"><b>&lt;보기&gt;</b>'+rich(q.bogi)+'</div>':"");
  if(q.stem) h+='<div class="rstem">'+q.n+'. '+rich(q.stem)+'</div>';
  var a=mode==="mock"?(mockSt()||{answers:{}}).answers[q.id]:null, rec=mode==="prac"?st.a[q.id]:null, done=mode==="review"||(rec&&rec.show);
  h+='<div class="ropts">';
  q.opts.forEach(function(o,i){
    var cls="ropt";
    if(mode==="mock"&&a===i) cls+=" sel";
    if(done){ if(i===q.ans) cls+=" ok"; else if(rec&&rec.c===i||mode==="review"&&q._my===i) cls+=" bad"; }
    h+='<button type="button" class="'+cls+'" data-q="'+q.id+'" data-i="'+i+'"'+(done?" disabled":"")+'><span class="n">'+NUM[i]+'</span><span>'+esc(o)+'</span></button>';
  });
  h+='</div><div class="rfb">'+(done?fbHTML(q,mode==="review"?q._my:rec.c):"")+'</div></div>';
  return h;
}
function fbHTML(q,my){
  var ok=my===q.ans, h='<div class="rres '+(ok?"ok":"bad")+'">'+(my==null?"未作答 · 正确答案 "+NUM[q.ans]:ok?"✔ 正确！":"✘ 选了 "+NUM[my]+" · 正确答案 "+NUM[q.ans])+'</div>';
  h+='<details class="rx"'+(ok?"":" open")+'><summary>解析 · 翻译 · 生词</summary>';
  h+='<h4>🔑 关键句</h4><p class="key">'+rich(q.k)+'</p>';
  h+='<h4>💡 解析</h4><p>'+rich(q.e)+'</p>';
  h+='<h4>选项逐条</h4><ol>'+q.o.map(function(x,i){return '<li>'+NUM[i]+' '+esc(x)+'</li>'}).join("")+'</ol>';
  var tr=q.tr||(q.gid&&groups[q.gid]?"（见上方文章的“中文翻译”）":"");
  if(tr) h+='<h4>中文翻译</h4><p>'+rich(tr)+'</p>';
  if(q.v&&q.v.length) h+='<h4>生词</h4><table class="vt">'+q.v.map(function(v){return '<tr><td>'+esc(v[0])+'</td><td>'+esc(v[1]||"")+'</td><td>'+esc(v[2]||"")+'</td></tr>'}).join("")+'</table>';
  if(q.g) h+='<h4>语法</h4><ul style="padding-left:18px;margin:2px 0">'+q.g.split(/[;；]/).filter(Boolean).map(function(x){return '<li>'+esc(x.trim())+'</li>'}).join("")+'</ul>';
  h+='<div class="racts"><button type="button" data-act="vocab" data-q="'+q.id+'">➕ 生词加入单词错题本</button><button type="button" data-act="copy" data-q="'+q.id+'" data-my="'+(my==null?"":my)+'">📋 复制题目发给老师</button>'+(opt.tab==="prac"?'<button type="button" data-act="redo" data-q="'+q.id+'">↺ 重做</button>':"")+'</div>';
  return h+'</details>';
}
/* ---------- 练习 ---------- */
function renderPrac(){
  var rounds=D.rounds.map(function(r){return '<option value="'+r.round+'"'+(opt.round===String(r.round)?" selected":"")+'>第'+r.round+'回（'+r.count+'题）</option>'}).join("");
  var base=Q.filter(function(q){return opt.round==="all"||String(q.round)===opt.round});
  var types=D.types.map(function(t){var n=base.filter(function(q){return q.type===t.id}).length;return n?'<option value="'+t.id+'"'+(opt.type===t.id?" selected":"")+'>'+t.range+' '+esc(t.label)+'（'+n+'）</option>':""}).join("");
  var wn=Object.keys(st.w).length, list=filtered(), us=units(list);
  if(opt.idx>=us.length) opt.idx=0;
  var done=list.filter(function(q){return st.a[q.id]}), okn=done.filter(function(q){return st.a[q.id].ok}).length;
  var h='<div class="fbar"><select id="rRound" aria-label="回次"><option value="all">全部回次</option>'+rounds+'</select><select id="rType" aria-label="题型"><option value="all">全部题型</option>'+types+'</select>'+
    '<button type="button" class="chip'+(opt.wrong?" on":"")+'" id="rWrongOnly">只看错题（'+wn+'）</button><button type="button" class="chip" id="rLink">🔗 链接</button></div>';
  h+='<div class="minfo">共 '+list.length+' 题 · 已做 '+done.length+(done.length?' · 正确率 '+Math.round(okn*100/done.length)+'%':"")+' · 选项一点即判，答错自动进阅读错题本</div>';
  if(!us.length){h+='<div class="card empty">'+(opt.wrong?"错题本是空的 🎉":"没有符合条件的题目")+'</div>';$("rBody").innerHTML=h;bindPrac();return}
  var nav='<div class="unav"><button type="button" data-nav="-1"'+(opt.idx<=0?" disabled":"")+'>◀ 上一题</button><span class="pos">'+(opt.idx+1)+' / '+us.length+'</span><button type="button" data-nav="1"'+(opt.idx>=us.length-1?" disabled":"")+'>下一题 ▶</button></div>';
  h+=nav+unitHTML(us[opt.idx],"prac")+nav;
  $("rBody").innerHTML=h; bindPrac(us);
}
function bindPrac(){
  var r=$("rRound"),t=$("rType"),w=$("rWrongOnly"),l=$("rLink");
  if(r) r.onchange=function(){opt.round=r.value;opt.idx=0;if(opt.type!=="all"&&!Q.some(function(q){return q.type===opt.type&&(opt.round==="all"||String(q.round)===opt.round)}))opt.type="all";save(LS_OPT,opt);renderPrac()};
  if(t) t.onchange=function(){opt.type=t.value;opt.idx=0;save(LS_OPT,opt);renderPrac()};
  if(w) w.onclick=function(){opt.wrong=!opt.wrong;opt.idx=0;save(LS_OPT,opt);renderPrac()};
  if(l) l.onclick=function(){var u=location.origin+location.pathname+"?reading=1"+(opt.type!=="all"?"&type="+opt.type:"")+(opt.round!=="all"?"&round="+opt.round:"");copy(u,"链接已复制")};
}
function answer(id,i){
  var q=byId[id]; if(!q) return;
  var ok=i===q.ans; st.a[id]={c:i,ok:ok,t:Date.now(),show:true};
  if(!ok) st.w[id]=(st.w[id]||0)+1; else if(opt.wrong&&st.w[id]) delete st.w[id];
  save(LS,st);
  var box=root.querySelector('.rq[data-id="'+id+'"]'); if(!box) return;
  Array.prototype.forEach.call(box.querySelectorAll(".ropt"),function(b,k){b.disabled=true;if(k===q.ans)b.classList.add("ok");else if(k===i)b.classList.add("bad")});
  box.querySelector(".rfb").innerHTML=fbHTML(q,i);
  toast(ok?"✔ 正确":"✘ 已加入阅读错题本");
}
/* ---------- 整套模拟 ---------- */
function mockSt(){var m=load(LS_MOCK,null);return m&&m.round?m:null}
function fmt(s){s=Math.max(0,Math.round(s));return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0")}
function left(m){return m.limit-(Date.now()-m.start)/1000}
function renderMock(){
  var m=mockSt();
  if(m&&!m.done){runMock(m);return}
  var h='<div class="card"><h3 style="margin:0 0 6px">整套模拟 · 70分钟</h3><p class="minfo">TOPIK II 读解 50题 / 70分钟。中途刷新不会丢失；时间到自动交卷，交卷后统计分数、各题型正确率，错题进错题本并显示解析。</p>';
  D.rounds.forEach(function(r){h+='<button type="button" class="gbtn pri" style="margin:4px 6px 4px 0" data-mock="'+r.round+'">开始 第'+r.round+'回（'+r.count+'题'+(r.count<50?"，缺"+(50-r.count)+"题":"")+'）</button>'});
  var last=load("topik.reading.last",null);
  if(last) h+='<p class="minfo">上次：第'+last.round+'回 '+last.score+'/'+last.full+' 分（'+new Date(last.t).toLocaleString()+'）</p>';
  var sk=D.rounds.filter(function(r){return Object.keys(r.skipped||{}).length});
  sk.forEach(function(r){h+='<p class="minfo">第'+r.round+'回 第'+Object.keys(r.skipped).join("、")+'题：'+esc(r.skipped[Object.keys(r.skipped)[0]])+'，不计分。</p>'});
  $("rBody").innerHTML=h+'</div>';
}
function startMock(round){
  var n=Q.filter(function(q){return String(q.round)===String(round)}).length;
  var m={round:+round,start:Date.now(),limit:Math.round(70*60*n/50),answers:{},done:false};
  save(LS_MOCK,m); runMock(m);
}
function runMock(m){
  var qs=Q.filter(function(q){return q.round===m.round}).sort(function(a,b){return a.n-b.n}), us=units(qs);
  var h='<div class="timerbar"><span class="t" id="mT">'+fmt(left(m))+'</span><span class="minfo" id="mCnt" style="margin:0">已答 '+Object.keys(m.answers).length+'/'+qs.length+'</span><span class="sp"></span><button type="button" class="gbtn" data-act="quit">放弃</button><button type="button" class="gbtn pri" data-act="submit">交卷</button></div>';
  h+='<div class="minfo">第'+m.round+'回 · '+qs.length+'题 · 限时 '+Math.round(m.limit/60)+' 分钟（按 50题/70分钟 比例）</div>';
  us.forEach(function(u){h+=unitHTML(u,"mock")});
  h+='<div style="text-align:center;margin:10px 0 30px"><button type="button" class="gbtn pri" data-act="submit">交卷</button></div>';
  $("rBody").innerHTML=h;
  if(timerId) clearInterval(timerId);
  timerId=setInterval(function(){var s=left(m),el=$("mT");if(!el){clearInterval(timerId);timerId=null;return}el.textContent=fmt(s);el.classList.toggle("low",s<300);if(s<=0){clearInterval(timerId);timerId=null;toast("时间到，自动交卷");submitMock()}},1000);
}
function submitMock(){
  var m=mockSt(); if(!m) return;
  if(timerId){clearInterval(timerId);timerId=null}
  var qs=Q.filter(function(q){return q.round===m.round}).sort(function(a,b){return a.n-b.n}), ok=0, byT={}, wrong=[];
  qs.forEach(function(q){var my=m.answers[q.id];var good=my===q.ans;if(good)ok++;else{wrong.push(q);if(my!=null)st.w[q.id]=(st.w[q.id]||0)+1}
    st.a[q.id]={c:my==null?-1:my,ok:good,t:Date.now(),show:false};
    var t=byT[q.type]||(byT[q.type]={n:0,ok:0});t.n++;if(good)t.ok++});
  save(LS,st);
  var used=Math.min(m.limit,(Date.now()-m.start)/1000);
  m.done=true; save(LS_MOCK,null); save("topik.reading.last",{round:m.round,score:ok*2,full:qs.length*2,t:Date.now()});
  var h='<div class="card"><div class="minfo">第'+m.round+'回 整套模拟结果 · 用时 '+fmt(used)+'</div><div class="score">'+(ok*2)+' <small>/ '+(qs.length*2)+' 分（'+ok+'/'+qs.length+' 题）</small></div>';
  h+='<table class="stbl"><tr><th>题型</th><th>正确</th><th>正确率</th></tr>'+D.types.filter(function(t){return byT[t.id]}).map(function(t){var x=byT[t.id];return '<tr><td>'+t.range+' '+esc(t.label)+'</td><td>'+x.ok+'/'+x.n+'</td><td>'+Math.round(x.ok*100/x.n)+'%</td></tr>'}).join("")+'</table>';
  h+='<div class="racts"><button type="button" class="gbtn pri" data-act="again">再做一套</button><button type="button" class="gbtn" data-act="towrong">去错题本练</button></div></div>';
  if(wrong.length){h+='<h3 style="margin:14px 2px 6px">错题解析（'+wrong.length+'）</h3>';
    units(wrong).forEach(function(u){u.qs.forEach(function(q){q._my=m.answers[q.id]});h+=unitHTML(u,"review")})}
  $("rBody").innerHTML=h; window.scrollTo(0,0);
}
/* ---------- 错题本 ---------- */
function renderWrong(){
  var ids=Object.keys(st.w).filter(function(id){return byId[id]}).sort(function(a,b){return byId[b].round-byId[a].round||byId[a].n-byId[b].n});
  var h='<div class="card"><h3 style="margin:0 0 4px">阅读错题本（'+ids.length+'）</h3><p class="minfo">在“只看错题”里做对一次就会移出。</p>';
  if(!ids.length) h+='<div class="empty">还没有错题 🎉</div>';
  else{
    h+='<div class="racts" style="margin-bottom:6px"><button type="button" class="gbtn pri" data-act="drill">▶ 练习错题</button><button type="button" class="gbtn" data-act="clearw">清空</button></div>';
    ids.forEach(function(id){var q=byId[id];h+='<div class="wl"><div class="s"><b>'+label(q)+'</b> · '+esc(typeLabel(q))+' · 错 '+st.w[id]+' 次<div>'+esc(plain(q.stem||q.passage||(groups[q.gid]||{}).passage||"").slice(0,60))+'</div></div><button type="button" class="gbtn" data-act="goto" data-q="'+id+'">去做</button></div>'});
  }
  $("rBody").innerHTML=h+'</div>';
}
/* ---------- 题型攻略 ---------- */
function renderTips(){
  var h='<div class="minfo">每个题型 2–3 条最实用的做题思路。点“去练”直接进入该题型练习。</div>';
  D.types.forEach(function(t){var n=Q.filter(function(q){return q.type===t.id}).length;
    h+='<div class="rcard tipc"><h3>'+t.range+'　'+esc(t.label)+' <span class="minfo">（题库 '+n+' 题）</span></h3><ul>'+(TIPS[t.id]||[]).map(function(x){return '<li>'+esc(x)+'</li>'}).join("")+'</ul><button type="button" class="gbtn pri" data-act="practype" data-type="'+t.id+'">去练 →</button></div>'});
  $("rBody").innerHTML=h;
}
/* ---------- 生词 → 单词错题本；复制题目 ---------- */
function addVocab(q){
  var w=load(LS_VWRONG,{}),n=0;
  (q.v||[]).forEach(function(v){if(!v[0]||!v[1])return;var k="v|"+v[0];
    var e=w[k]||{t:"v",ko:v[0],zh:v[1],hint:(v[2]?v[2]+" · ":"")+"阅读 "+label(q),ex:"",exzh:"",point:"",date:"reading",m:{}};
    if(!w[k])n++; e.m.v_zh_ko=(e.m.v_zh_ko||0)+1; e.last=Date.now(); w[k]=e});
  save(LS_VWRONG,w); toast(n?"已加入 "+n+" 个生词到单词错题本（闪卡→错题本）":"这些生词已经在错题本里了");
}
function copyQ(q,my){
  var g=q.gid?groups[q.gid]:null, t="【TOPIK II 读解 "+label(q)+"】"+typeLabel(q)+"\n※ "+q.instr+"\n";
  if(g) t+=plain(g.passage)+"\n"; else if(q.passage) t+=plain(q.passage)+"\n";
  if(q.img) t+="（图片题，见原卷）\n";
  if(q.bogi) t+="<보기> "+plain(q.bogi)+"\n";
  if(q.stem) t+=q.n+". "+plain(q.stem)+"\n";
  t+=q.opts.map(function(o,i){return NUM[i]+" "+o}).join("\n")+"\n";
  t+="我的答案："+(my===""||my==null||my<0?"未答":NUM[my])+"　正确答案："+NUM[q.ans]+"\n关键句："+plain(q.k)+"\n老师，这题我不太明白：";
  copy(t,"题目已复制，可以粘贴发给老师");
}
/* ---------- 事件 ---------- */
function bind(){
  $("rtabs").addEventListener("click",function(e){var b=e.target.closest("button[data-tab]");if(b)setTab(b.getAttribute("data-tab"))});
  $("rBody").addEventListener("click",function(e){
    var b=e.target.closest("button"); if(!b) return;
    var qid=b.getAttribute("data-q");
    if(b.classList.contains("ropt")){
      var i=+b.getAttribute("data-i");
      if(opt.tab==="mock"){var m=mockSt();if(!m)return;m.answers[qid]=i;save(LS_MOCK,m);
        Array.prototype.forEach.call(b.parentNode.querySelectorAll(".ropt"),function(x){x.classList.toggle("sel",x===b)});
        var c=$("mCnt");if(c)c.textContent="已答 "+Object.keys(m.answers).length+"/"+Q.filter(function(q){return q.round===m.round}).length;return}
      answer(qid,i); return;
    }
    var nav=b.getAttribute("data-nav"); if(nav){opt.idx+=+nav;save(LS_OPT,opt);renderPrac();window.scrollTo(0,0);return}
    var mk=b.getAttribute("data-mock"); if(mk){startMock(mk);return}
    var a=b.getAttribute("data-act"); if(!a) return;
    if(a==="vocab") addVocab(byId[qid]);
    else if(a==="copy") copyQ(byId[qid],b.getAttribute("data-my")===""?null:+b.getAttribute("data-my"));
    else if(a==="redo"){delete st.a[qid];save(LS,st);renderPrac()}
    else if(a==="submit"){var m=mockSt(),n=Q.filter(function(q){return m&&q.round===m.round}).length,d=m?Object.keys(m.answers).length:0;if(d<n&&!confirm("还有 "+(n-d)+" 题没答，确定交卷？"))return;submitMock()}
    else if(a==="quit"){if(confirm("放弃本次模拟？（不计分）")){save(LS_MOCK,null);if(timerId){clearInterval(timerId);timerId=null}renderMock()}}
    else if(a==="again"){renderMock()}
    else if(a==="towrong"||a==="drill"){opt.wrong=true;opt.round="all";opt.type="all";opt.idx=0;setTab("prac")}
    else if(a==="clearw"){if(confirm("清空阅读错题本？")){st.w={};save(LS,st);renderWrong()}}
    else if(a==="goto"){var q=byId[qid];opt.wrong=false;opt.round=String(q.round);opt.type="all";var us=units(filtered());opt.idx=Math.max(0,us.findIndex(function(u){return u.qs.some(function(x){return x.id===qid})}));delete st.a[qid];save(LS,st);setTab("prac")}
    else if(a==="practype"){opt.type=b.getAttribute("data-type");opt.round="all";opt.wrong=false;opt.idx=0;setTab("prac")}
  });
}
window.TopikReading={open:open,init:function(){bind()}};
})();
