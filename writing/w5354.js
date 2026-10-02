/* 写作 53·54（图表说明 + 议论文）—— 数据：writing/w5354.json（由 tools/build_w5354.py 生成）
   速查 / 闪卡（中→韩打字、韩→中自评、错题本）/ 真题（官方公开试卷，作文框每次都是空白、不保存） */
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var LS_OPT="topik.w54.opt.v1", LS_W="topik.w54.wrong.v1";
var E={tags:{},attempts:{}};   // writing/essaylog.json：老师批改过的 53/54 作文（tools/add_essay.py 追加）
var D=null, GRP={}, CARDS=[], QS=[], QBY={}, opt=load(LS_OPT,{tab:"cheat",cst:"53",mode:"zh2ko",scope:"all",no:"53",cur:null}), W=load(LS_W,{}), R=null, revealed=false, search="";
if(opt.mode!=="ko2zh")opt.mode="zh2ko";
function load(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v&&typeof v==="object"?v:d}catch(e){return d}}
function save(){try{localStorage.setItem(LS_OPT,JSON.stringify(opt))}catch(e){}}
function saveW(){try{localStorage.setItem(LS_W,JSON.stringify(W))}catch(e){}}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function toast(m){var t=$("toast");if(!t)return;t.textContent=m;t.classList.add("show");clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove("show")},1800)}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function copyText(t,msg){
  var done=function(){toast(msg||"已复制")};
  function fallback(){var ta=document.createElement("textarea");ta.value=t;ta.setAttribute("readonly","");ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();try{document.execCommand("copy");done()}catch(e){prompt("复制失败，请手动复制：",t)}document.body.removeChild(ta)}
  if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).then(done,fallback)}else fallback();
}
function ensure(){
  if(D) return Promise.resolve();
  var lg=fetch("writing/essaylog.json?v="+Date.now(),{cache:"no-store"}).then(function(r){return r.ok?r.json():null}).then(function(d){if(d&&d.attempts){E=d;E.tags=E.tags||{}}}).catch(function(){});
  return Promise.all([lg,fetch("writing/w5354.json?v="+Date.now(),{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()})]).then(function(rs){var d=rs[1];
    D=d; GRP={}; d.groups.forEach(function(g){GRP[g.id]=g});
    CARDS=d.items.filter(function(c){return c.card!==false});
    QS=d.questions.slice().sort(function(a,b){return a.no-b.no||a.round-b.round}); QBY={}; QS.forEach(function(q){QBY[q.id]=q});
  });
}
function open(o){
  o=o||{};
  if(o.tab&&["cheat","cards","prac","wrong"].indexOf(o.tab)>=0) opt.tab=o.tab;
  if(o.mode==="zh2ko"||o.mode==="ko2zh"){opt.mode=o.mode;R=null}
  if(o.no==="53"||o.no==="54") opt.no=opt.cst=o.no;
  if(o.q){opt.tab="prac";opt.cur=o.q}
  save();
  $("w54Body").innerHTML='<div class="card empty">加载中…</div>';
  ensure().then(function(){
    if(opt.cur&&QBY[opt.cur]&&o.q) opt.no=String(QBY[opt.cur].no);
    setTab(opt.tab);
  }).catch(function(e){$("w54Body").innerHTML='<div class="card empty">53·54 数据加载失败：'+esc(e.message)+"</div>"});
}
function setTab(t){
  if(["cheat","cards","prac","wrong"].indexOf(t)<0)t="cheat";
  if(opt.tab==="prac"&&t!=="prac"&&!leaveOK())return;
  opt.tab=t; save();
  Array.prototype.forEach.call(document.querySelectorAll("#w54tabs button"),function(b){b.classList.toggle("active",b.getAttribute("data-tab")===t)});
  if(t==="cheat") renderCheat(); else if(t==="cards"){if(!R)newRound();renderCard()} else if(t==="prac") renderPrac(); else renderWrong();
}
function leaveOK(){var ta=$("w54Essay");if(ta&&ta.value.trim().length>20)return confirm("作文不会保存，离开后会清空。确定离开？（可以先点「复制给老师」）");return true}
function linkFor(t){
  var b=location.origin+location.pathname;
  if(t==="cards") return b+"?cat=writing-5354"+(opt.mode==="ko2zh"?"&mode=ko2zh":"");
  if(t==="prac") return b+"?writing=5354&tab=prac"+(opt.cur?"&q="+encodeURIComponent(opt.cur):"");
  if(t==="wrong") return b+"?writing=5354&tab=wrong";
  return b+"?writing=5354";
}
function foot(extra){return '<footer><div>'+(extra||"")+'</div><div><button type="button" data-a="link">🔗 复制本页链接</button></div></footer>'}

/* ---------- 速查 ---------- */
function exHTML(c){var off=c.src.indexOf("官方")===0;return '<div class="w54ex"><div class="ko" lang="ko">'+esc(c.ex)+'</div><div class="zh">'+esc(c.exzh)+'</div><span class="src'+(off?"":" self")+'">'+esc(c.src)+"</span></div>"}
function itemHTML(c,openIt){
  return '<details class="gi w54it" data-id="'+c.id+'"'+(openIt?" open":"")+'><summary><span class="f" lang="ko">'+esc(c.ko)+'</span><span class="z">'+esc(c.zh)+"</span></summary>"+
    '<div class="gbody"><div class="row"><span class="k">中文</span>'+esc(c.zh)+'</div><div class="row"><span class="k mem">记忆法</span>'+esc(c.mem)+'</div><div class="row"><span class="k err">⚠️ 易错</span>'+esc(c.err)+'</div><div class="row"><span class="k">例句</span></div>'+exHTML(c)+"</div></details>";
}
function match(c,q){if(!q)return true;q=q.toLowerCase();return (c.ko+c.zh+c.mem+c.err+c.ex+c.exzh).toLowerCase().indexOf(q)>=0||c.ko.replace(/\s/g,"").indexOf(q.replace(/\s/g,""))>=0}
function tplHTML(rows,check,no){
  var txt=rows.map(function(r){return r[1]}).join("\n");
  return '<details class="gi w54tpl" open><summary><span class="f">📝 '+no+' 模板骨架</span><span class="z">填空就能写</span></summary><div class="gbody">'+
    rows.map(function(r){return '<div class="tplrow"><div class="tk">'+esc(r[0])+'</div><div class="tv" lang="ko">'+esc(r[1])+"</div></div>"}).join("")+
    '<div class="row"><span class="k warn">✅ 交卷前检查</span></div><ul class="w54chk">'+check.map(function(x){return "<li>"+esc(x)+"</li>"}).join("")+"</ul>"+
    '<div class="racts"><button type="button" class="gbtn" data-a="copytpl" data-t="'+esc(txt)+'">📋 复制模板</button></div></div></details>';
}
function styleHTML(){
  return '<details class="gi"><summary><span class="f">🔁 语体：-습니다 → -ㄴ다</span><span class="z">53、54 通用</span></summary><div class="gbody"><div style="overflow-x:auto"><table class="ctbl"><tr><th>✗ 口语/敬语</th><th>✓ 写作用</th><th>说明</th></tr>'+
    D.style.map(function(r){return '<tr><td lang="ko">'+esc(r[0])+'</td><td lang="ko"><b>'+esc(r[1])+"</b></td><td>"+esc(r[2])+"</td></tr>"}).join("")+"</table></div></div></details>";
}
function renderCheat(){
  var no=opt.cst==="54"?"54":"53", q=search.trim();
  var h='<div class="seg w54seg" data-w54="cst"><button type="button" data-v="53" class="'+(no==="53"?"active":"")+'">53 图表说明</button><button type="button" data-v="54" class="'+(no==="54"?"active":"")+'">54 议论文</button></div>';
  h+='<input class="gsearch" id="w54Q" type="search" placeholder="搜索：증가 / 原因 / 영향 / 让步…（53、54 一起搜）" value="'+esc(search)+'" autocomplete="off">';
  h+='<div id="w54CS">'+cheatBody(no,q)+"</div>";
  $("w54Body").innerHTML=h+foot("句型 "+D.items.length+" 个 · 例句标“官方范文”的逐字取自该回官方 모범답안");
  var inp=$("w54Q"); inp.oninput=function(){search=this.value;$("w54CS").innerHTML=cheatBody(no,search.trim())};
}
function cheatBody(no,q){
  var h="";
  if(q){
    var hit=D.items.filter(function(c){return match(c,q)});
    D.groups.forEach(function(g){var L=hit.filter(function(c){return c.g===g.id});if(!L.length)return;
      h+='<div class="gcat">'+g.no+" · "+esc(g.name)+"</div>"+L.map(function(c){return itemHTML(c,hit.length<=3)}).join("")});
    return h||'<div class="card empty">没有找到「'+esc(q)+"」</div>";
  }
  var ov=D.overview[no];
  h+='<details class="gi w54ov" open><summary><span class="f">📌 '+esc(ov.title)+'</span></summary><div class="gbody"><ul class="w54chk">'+ov.pts.map(function(x){return "<li>"+esc(x)+"</li>"}).join("")+"</ul></div></details>";
  D.groups.filter(function(g){return String(g.no)===no}).forEach(function(g){
    h+='<div class="gcat">'+esc(g.name)+'</div><div class="minfo">'+esc(g.lead)+"</div>";
    h+=D.items.filter(function(c){return c.g===g.id}).map(function(c){return itemHTML(c,false)}).join("");
  });
  h+='<div class="gcat">模板 · 语体</div>';
  h+=no==="53"?tplHTML(D.tpl53,D.check53,"53"):tplHTML(D.tpl54,D.check54,"54");
  h+=styleHTML();
  return h;
}

/* ---------- 闪卡 ---------- */
function pool(sc){
  sc=sc||opt.scope;
  if(sc==="wrong") return CARDS.filter(function(c){return W[c.id]});
  if(sc==="53") return CARDS.filter(function(c){return GRP[c.g].no===53});
  if(sc==="54") return CARDS.filter(function(c){return GRP[c.g].no===54&&c.g!=="v54"});
  if(sc==="vocab") return CARDS.filter(function(c){return c.g==="v54"});
  return CARDS.slice();
}
function newRound(list,redo){R={q:shuffle(list||pool()),i:0,ok:0,bad:0,missed:[],st:"ask",typed:"",redo:!!redo}}
/* 判分：只比较韩文字母；展开 (으)、(에)、을/를 这类写法；하였/했、되었/됐 视为相同 */
function canon(t){return t.replace(/[^\uac00-\ud7a3\u3131-\u318e]/g,"").replace(/으ㄹ/g,"을").replace(/으ㄴ/g,"은").replace(/으ㅁ/g,"음").replace(/하였/g,"했").replace(/되었/g,"됐")}
function expand(s){
  var out={}, parts=String(s||"").split(/\s+\/\s+/), todo=parts.length>1?parts.concat([parts.join("")]):parts.slice(), n=0;
  todo=todo.map(function(x){return x.replace(/\s+/g,"")});
  while(todo.length&&n++<400){var t=todo.pop(),m=t.match(/\(([^()]*)\)/);
    if(m){todo.push(t.replace(m[0],m[1]));todo.push(t.replace(m[0],""));continue}
    m=t.match(/([\uac00-\ud7a3\u3131-\u318e])\/([\uac00-\ud7a3\u3131-\u318e])/);
    if(m){todo.push(t.replace(m[0],m[1]));todo.push(t.replace(m[0],m[2]));continue}
    t=canon(t); if(t) out[t]=1}
  return Object.keys(out);
}
function strip(k){return k.replace(/^[\u3131-\u318e]+/,"").replace(/^(을|를|은|는|이|가|의|에|과|와)(?=.{3,})/,"")}
function keysOf(c){if(!c._k){var k={};[c.ko].concat(c.alts||[]).forEach(function(a){expand(a).forEach(function(x){k[x]=1})});c._k=Object.keys(k)}return c._k}
function check(c,input){
  var U=expand(input); if(!U.length) return false;
  var K=keysOf(c), S=K.map(strip);
  return U.some(function(u){var su=strip(u);
    if(K.indexOf(u)>=0||S.indexOf(su)>=0) return true;
    if(S.some(function(s){return s.length>=3&&su.length<=s.length+4&&su.slice(-s.length)===s})) return true;   // 前面多写了词干也算对，如「증가한 것으로 나타났다」
    return K.some(function(k){var J={"ㄴ":4,"ㄹ":8,"ㅁ":16}[k.charAt(0)], rest=k.slice(1); if(!J||rest.length<2||u.length<rest.length+1||u.length>rest.length+5||u.slice(-rest.length)!==rest) return false;
      var ch=u.charCodeAt(u.length-rest.length-1)-0xAC00; return ch>=0&&ch<11172&&ch%28===J});   // 「증가한 반면」「할 것으로」：词干＋ㄴ/ㄹ/ㅁ 收音
  });
}
function cardInfo(c,openIt){
  return '<details class="wi'+(openIt?" hot":"")+'"'+(openIt?" open":"")+'><summary>📖 记忆法 · 易错 · 例句</summary><div class="body wgc">'+
    '<div class="row"><span class="rk">中文意思</span>'+esc(c.zh)+"</div>"+
    '<div class="row"><span class="rk">韩语</span><b lang="ko" style="color:#ffd98a">'+esc(c.ko)+"</b></div>"+
    '<div class="row mem"><span class="rk">🧠 记忆法</span>'+esc(c.mem)+"</div>"+
    '<div class="row err"><span class="rk">⚠️ 易错</span>'+esc(c.err)+"</div>"+
    '<div class="row"><span class="rk">例句</span>'+exHTML(c)+"</div>"+
    '<div class="row" style="color:var(--muted);font-size:13px">'+GRP[c.g].no+" · "+esc(GRP[c.g].name)+"</div></div></details>";
}
function renderCard(){
  var cnt=function(sc){return pool(sc).length};
  var h='<div class="wg">';
  h+='<div class="seg" data-w54="mode"><button type="button" data-v="zh2ko" class="'+(opt.mode==="zh2ko"?"active":"")+'">中→韩（打字）</button><button type="button" data-v="ko2zh" class="'+(opt.mode==="ko2zh"?"active":"")+'">韩→中（自评）</button></div>';
  h+='<div class="seg" data-w54="scope">'+[["all","全部"],["53","53"],["54","54"],["vocab","万能词"],["wrong","错题本"]].map(function(x){var n=cnt(x[0]);return '<button type="button" data-v="'+x[0]+'" class="'+(opt.scope===x[0]&&!R.redo?"active":"")+'"'+(n===0&&x[0]!=="wrong"?" disabled":"")+">"+x[1]+" "+n+"</button>"}).join("")+"</div>";
  if(R.redo) h+='<div class="seg"><button type="button" class="active" data-a="exitredo">只练本轮错题（'+R.q.length+'）✕ 退出</button></div>';
  var n=R.q.length;
  h+='<div class="bar"><span>进度 <b>'+Math.min(R.i+1,n)+"/"+n+'</b></span><span class="sp"></span><span>对 <b style="color:var(--ok)">'+R.ok+'</b></span><span>错 <b style="color:var(--bad)">'+R.bad+"</b></span></div>";
  h+='<div class="progress"><i style="width:'+(n?Math.round(100*R.i/n):0)+'%"></i></div>';
  var ft=foot("共 "+CARDS.length+" 张 · 53 "+cnt("53")+" · 54 "+cnt("54")+" · 万能词 "+cnt("vocab")+' · <button type="button" data-a="clear">清空错题本</button>');
  if(!n){$("w54Body").innerHTML=h+'<div class="card empty">'+(opt.scope==="wrong"?"53·54 错题本是空的 🎉<br>去「全部」练一轮吧。":"没有卡片")+"</div></div>"+ft;return}
  if(R.i>=n){$("w54Body").innerHTML=h+summary()+"</div>"+ft;return}
  var c=R.q[R.i], g=GRP[c.g];
  h+='<div class="card" id="w54Card"><div class="label"><span>'+(opt.mode==="zh2ko"?"看中文 → 写韩语句型/词":"看韩语 → 想中文意思")+'</span><span class="tag">'+g.no+" · "+esc(g.name)+"</span></div>";
  if(opt.mode==="zh2ko"){
    h+='<div class="prompt">'+esc(c.zh)+"</div>";
    h+='<div class="cueline">🔎 '+g.no+"题 · "+esc(g.name)+(W[c.id]?' · <span style="color:var(--bad)">错过 '+W[c.id].n+" 次</span>":"")+"</div>";
    h+='<textarea class="answer" id="w54In" lang="ko" rows="1" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="写韩语（占位的 A/N/○○ 可以省略）"'+(R.st!=="ask"?" disabled":"")+">"+esc(R.typed||"")+"</textarea>";
  }else{
    h+='<div class="prompt" lang="ko">'+esc(c.ko)+"</div>";
  }
  h+='<div id="w54Fb">'+(R.st==="ask"?"":feedback(c))+"</div>";
  h+='<div class="actions">'+buttons()+"</div></div></div>";
  $("w54Body").innerHTML=h+ft;
  var t=$("w54In"); if(t&&R.st==="ask"){t.addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.isComposing){e.preventDefault();submit()}});try{t.focus({preventScroll:true})}catch(x){}}
}
function feedback(c){
  if(opt.mode==="zh2ko"){var ok=R.st==="ok";
    return '<div class="fbx '+(ok?"ok":"bad")+'"><div class="title">'+(ok?"✓ 对了":(R.typed?"✗ 不对":"看答案"))+'</div><div class="ansline" lang="ko">'+esc(c.ko)+"</div>"+(R.typed?'<div class="mine">你写的：<span lang="ko">'+esc(R.typed)+"</span></div>":"")+"</div>"+cardInfo(c,!ok);}
  return '<div class="fbx"><div class="ansline">'+esc(c.zh)+"</div></div>"+cardInfo(c,R.st==="bad"||R.st==="shown");
}
function buttons(){
  if(opt.mode==="zh2ko"){
    if(R.st==="ask") return '<button type="button" class="b-primary" data-a="check">检查</button><button type="button" class="b-ghost" data-a="giveup">不会，看答案</button>';
    if(R.st==="bad") return '<button type="button" class="b-ok" data-a="actually">其实我写对了</button><button type="button" class="b-primary" data-a="next">下一张 →</button>';
    return '<button type="button" class="b-primary full" data-a="next">下一张 →</button>';
  }
  if(R.st==="ask") return '<button type="button" class="b-primary full" data-a="show">看中文意思</button>';
  if(R.st==="shown") return '<button type="button" class="b-ok" data-a="know">记住了 ✓</button><button type="button" class="b-bad" data-a="dunno">没记住 ✗</button>';
  return '<button type="button" class="b-primary full" data-a="next">下一张 →</button>';
}
function mark(c,ok){
  if(ok){R.ok++; if(opt.scope==="wrong"||R.redo){delete W[c.id];saveW()}}
  else{R.bad++; R.missed.push(c); var w=W[c.id]||{n:0}; w.n++; w.t=Date.now(); W[c.id]=w; saveW()}
}
function submit(){
  var c=R.q[R.i], t=$("w54In"); if(!c||!t) return;
  R.typed=t.value.trim(); if(!R.typed){toast("先写一下；不会就点「不会，看答案」");return}
  var ok=check(c,R.typed); R.st=ok?"ok":"bad"; mark(c,ok); renderCard();
  if(!ok) setTimeout(function(){var f=$("w54Fb");if(f)try{f.scrollIntoView({block:"nearest",behavior:"smooth"})}catch(e){}},30);
}
function next(){R.i++;R.st="ask";R.typed="";renderCard();try{$("w54").scrollIntoView({block:"start"})}catch(e){}}
function summary(){
  var n=R.q.length, pct=n?Math.round(100*R.ok/n):0;
  var h='<div class="card summary"><h2>'+(R.redo?"错题重练结束":"本轮结束")+'</h2><div class="nums">共 '+n+' 张 · <span style="color:var(--ok)">对 '+R.ok+'</span> · <span style="color:var(--bad)">错 '+R.bad+"</span> · 正确率 "+pct+"%</div>";
  if(R.missed.length) h+='<div style="color:var(--muted);font-size:14px">本轮错题（已记入 53·54 错题本）：</div><ul class="list">'+R.missed.map(function(c){return '<li><span class="ko" lang="ko">'+esc(c.ko)+'</span><br><span class="zh">'+esc(c.zh)+"</span></li>"}).join("")+"</ul>";
  h+='<div class="actions">'+(R.missed.length?'<button type="button" class="b-bad full" data-a="redo">只练错题（'+R.missed.length+"）</button>":"")+'<button type="button" class="b-primary" data-a="again">再来一轮</button><button type="button" data-a="wrongbook">错题本（'+pool("wrong").length+"）</button></div></div>";
  return h;
}

/* ---------- 错题本 ---------- */
function renderWrong(){
  var L=CARDS.filter(function(c){return W[c.id]}).sort(function(a,b){return (W[b.id].n-W[a.id].n)||(W[b.id].t-W[a.id].t)});
  var h='<div class="card"><h2 style="margin:0 0 4px;font-size:20px">53·54 错题本（'+L.length+'）</h2><div style="color:var(--muted);font-size:14.5px">闪卡答错或“没记住”的句型会进来；在错题本/重练里答对就自动移出。只存在本机浏览器。</div>';
  if(!L.length) h+='<div class="empty">还没有错题。去「闪卡」练一轮吧。</div>';
  else h+='<div class="actions"><button type="button" class="b-bad full" data-a="dowrong">只练错题（'+L.length+"）</button></div>";
  h+="</div>";
  h+=L.map(function(c){return itemHTML(c,false).replace('<span class="z">','<span class="z"><span class="wn">✗'+W[c.id].n+"</span> ")}).join("");
  h=essayTagsHTML()+h;
  $("w54Body").innerHTML=h+foot('<button type="button" data-a="clear">清空错题本</button>');
}

/* ---------- 真题 ---------- */
function qList(){return QS.filter(function(q){return opt.no==="all"||String(q.no)===opt.no})}
function qLabel(q){return "真题 第"+q.round+"回"}
function kindZh(q){return q.no===53?"图表说明":"议论文"}
function chartText(q){
  var t="";
  if(q.chart) t+=q.chart.map(function(r){return r.filter(function(x){return x!==""}).join(" | ")}).join("\n");
  if(q.chartNote) t+=(t?"\n":"")+q.chartNote;
  return t;
}
function chartHTML(q){
  if(!q.chart) return "";
  var h='<div style="overflow-x:auto"><table class="ctbl w54tbl">'+q.chart.map(function(r,i){return "<tr>"+r.map(function(x){return i===0?"<th lang=\"ko\">"+esc(x)+"</th>":"<td lang=\"ko\">"+esc(x)+"</td>"}).join("")+"</tr>"}).join("")+"</table></div>";
  if(q.chartNote) h+='<div class="minfo" lang="ko" style="margin-top:6px">'+esc(q.chartNote)+"</div>";
  return h;
}
function lim(q){return q.no===53?[200,300]:[600,700]}
function renderPrac(){
  var list=qList(), idx=0;
  for(var i=0;i<list.length;i++) if(list[i].id===opt.cur){idx=i;break}
  var q=list[idx]; if(q){opt.cur=q.id;save()}
  var c=function(no){return QS.filter(function(x){return no==="all"||String(x.no)===no}).length};
  var h='<div class="seg" data-w54="no">'+[["all","全部"],["53","53 图表"],["54","54 议论文"]].map(function(x){return '<button type="button" data-v="'+x[0]+'" class="'+(opt.no===x[0]?"active":"")+'">'+x[1]+" "+c(x[0])+"</button>"}).join("")+"</div>";
  var done=list.filter(function(x){return atts(x.id).length});
  if(done.length) h+='<div class="w54done"><span class="lb">📚 做过</span>'+done.map(function(x){return '<button type="button" class="'+(x.id===(q&&q.id)?"on":"")+'" data-a="goq" data-q="'+esc(x.id)+'">第'+x.round+"回 "+x.no+' <span class="dn">'+esc(attBadge(x.id))+"</span></button>"}).join("")+"</div>";
  h+='<div class="wrow"><select id="w54Pick" aria-label="选择题目">'+list.map(function(x,i){return '<option value="'+i+'"'+(i===idx?" selected":"")+">"+(i+1)+". "+qLabel(x)+" · "+x.no+"번 "+kindZh(x)+(atts(x.id).length?" ✓ "+attBadge(x.id):"")+"</option>"}).join("")+"</select></div>";
  if(!q){$("w54Body").innerHTML=h+'<div class="card empty">没有题目</div>';return}
  var L=lim(q);
  h+='<div class="card" id="w54QCard"><div class="qhead"><span class="no">'+q.no+'번</span><span class="badge real">'+qLabel(q)+'</span><span class="badge">'+kindZh(q)+" · "+L[0]+"–"+L[1]+'字</span>'+(atts(q.id).length?'<span class="badge done">'+esc(attBadge(q.id))+"</span>":"")+'<span style="margin-left:auto;color:var(--muted);font-size:14px">'+(idx+1)+"/"+list.length+"</span></div>";
  h+='<div class="w54ins" lang="ko">'+esc(q.ins)+"</div>";
  if(q.box) h+='<div class="passage" lang="ko">'+esc(q.box)+(q.qs?'<ul class="w54qs">'+q.qs.map(function(x){return "<li>"+esc(x)+"</li>"}).join("")+"</ul>":"")+"</div>";
  else if(q.qs) h+='<ul class="w54qs">'+q.qs.map(function(x){return "<li>"+esc(x)+"</li>"}).join("")+"</ul>";
  if(q.img) h+='<img class="rimg" src="'+esc(q.img)+'" alt="第'+q.round+'回 53题 原卷图表" loading="lazy">';
  if(q.chart) h+='<details class="gi" open><summary><span class="f">📊 图表数据（文字版）</span><span class="z">数字照抄原卷</span></summary><div class="gbody">'+chartHTML(q)+"</div></details>";
  h+='<details class="gi"><summary><span class="f">🇨🇳 中文题意</span></summary><div class="gbody">'+esc(q.zh)+"</div></details>";
  h+='<details class="gi"><summary><span class="f">💡 写前提示</span><span class="z">想好了再看</span></summary><div class="gbody"><ul class="w54chk">'+tips(q).map(function(x){return "<li>"+esc(x)+"</li>"}).join("")+"</ul></div></details>";
  if(q.note&&q.round===35) h+='<div class="note">'+esc(q.note)+"</div>";
  h+=histHTML(q);
  h+='<div class="wfield" id="w54Field"><div class="lab">✍️ 我的作文 <span style="font-weight:400;color:var(--muted);font-size:13px">（不保存，每次打开都是空白）</span></div>';
  h+='<textarea class="answer w54essay" id="w54Essay" lang="ko" rows="'+(q.no===53?8:14)+'" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="'+(q.no===53?"用 -ㄴ다/-였다 体描述图表，200–300字…":"서론–본론–결론，每个问题一段，600–700字…")+'"></textarea>';
  h+='<div class="w54cnt" id="w54Cnt"></div></div>';
  h+='<div class="actions"><button type="button" class="b-primary full" data-a="copyessay">📋 复制给老师</button><button type="button" class="b-ghost full small" data-a="reveal">'+(revealed?"收起参考答案":"看参考答案")+"</button></div>";
  h+='<div id="w54Rev"></div>';
  h+='<div class="wnav"><button type="button" class="btn small" data-a="prev"'+(idx===0?" disabled":"")+'>← 上一题</button><button type="button" class="btn b-primary small" data-a="nextq">'+(idx>=list.length-1?"回到第 1 题":"下一题 →")+"</button></div></div>";
  $("w54Body").innerHTML=h+foot("真题 "+QS.length+" 题：53 × "+c("53")+" · 54 × "+c("54")+"（全部来自官方公开试卷；范文标“官方”的来自官方 정답 및 채점기준표）");
  var ta=$("w54Essay"); ta.value=""; ta.addEventListener("input",updCnt); updCnt();
  if(revealed) renderRev();
}
/* ---------- 我之前的作文（writing/essaylog.json） ---------- */
function atts(id){return ((E.attempts||{})[id]||[]).slice().sort(function(a,b){return a.try-b.try})}
function shortScore(s){s=String(s||"").trim();var t=s.replace(/^约\s*/,"").replace(/\s*\/\s*\d+\s*(分)?$/,"");return /^[\d.]+(\s*[–~\-]\s*[\d.]+)?$/.test(t)?t.replace(/\s+/g,"")+"分":s}
function attBadge(id){var L=atts(id);if(!L.length)return "";var sc=shortScore(L[L.length-1].score);return "已做 "+L.length+" 次"+(sc?" · 最近 "+sc:"")}
function markEssay(t,errs){   // 在原文里给错误片段标红（只标能原样找到的）
  var R=[];(errs||[]).forEach(function(e){var w=String(e.wrong||"");if(w.length<2)return;var i=t.indexOf(w);while(i>=0){R.push([i,i+w.length]);i=t.indexOf(w,i+w.length)}});
  R.sort(function(a,b){return a[0]-b[0]||b[1]-a[1]});var out="",p=0;
  R.forEach(function(r){if(r[0]<p)return;out+=esc(t.slice(p,r[0]))+'<mark>'+esc(t.slice(r[0],r[1]))+"</mark>";p=r[1]});
  return out+esc(t.slice(p));
}
function chips(ts){return (ts||[]).map(function(t){return '<span class="mlchip">'+esc(t)+"</span>"}).join("")}
function attHTML(a,last){
  var h='<details class="w54att"'+(last?" open":"")+'><summary><b>第'+a.try+"次</b> · "+esc(a.date)+(a.score?' · <span class="sc">'+esc(a.score)+"</span>":"")+(a.errors&&a.errors.length?' · 错误 '+a.errors.length+" 处":"")+"</summary>";
  h+='<div class="ah">✍️ 我写的</div><div class="w54mine" lang="ko">'+markEssay(a.essay||"",a.errors)+"</div>";
  if(a.errors&&a.errors.length) h+='<div class="ah">❌ 主要错误</div><ul class="w54errs">'+a.errors.map(function(e){return '<li><div lang="ko"><span class="x">'+esc(e.wrong)+'</span> → <span class="o">'+esc(e.right)+"</span></div>"+(e.cause?'<div class="c">'+esc(e.cause)+"</div>":"")+(e.tags&&e.tags.length?"<div>"+chips(e.tags)+"</div>":"")+"</li>"}).join("")+"</ul>";
  if(a.rewrite) h+='<div class="ah">✅ 改写示范</div><div class="w54rw" lang="ko">'+esc(a.rewrite)+"</div>";
  if(a.rules&&a.rules.length) h+='<div class="ah">📌 要记住的规则</div><ul class="w54chk">'+a.rules.map(function(x){return "<li>"+esc(x)+"</li>"}).join("")+"</ul>";
  return h+"</details>";
}
function histHTML(q){
  var L=atts(q.id); if(!L.length) return "";
  var last=L[L.length-1];
  return '<div class="w54hwrap"><details class="gi w54hist" id="w54Hist"><summary><span class="f">📚 我之前的作文（'+L.length+' 次）</span><span class="z">最近 '+esc(last.date)+(last.score?" · "+esc(shortScore(last.score)):"")+'</span></summary><div class="gbody"><div class="minfo">建议先在下面空白框重写一遍，再展开对照。</div>'+
    L.slice().reverse().map(function(a,i){return attHTML(a,i===0)}).join("")+'</div></details>'+
    '<div class="actions"><button type="button" class="b-primary full w54redo" data-a="rewrite">🔁 重做（空白重写，第 '+(L.length+1)+' 次）</button></div></div>';
}
function rewrite(){
  var ta=$("w54Essay"), hs=$("w54Hist"); if(!ta) return;
  if(ta.value.trim()&&!confirm("清空作文框，从头重写？")) return;
  ta.value=""; updCnt(); if(hs) hs.open=false;
  try{$("w54Field").scrollIntoView({block:"start",behavior:"smooth"})}catch(e){}
  try{ta.focus({preventScroll:true})}catch(e){ta.focus()}
  toast("开始第 "+(atts(opt.cur).length+1)+" 次，加油 💪");
}
function goQid(id){
  var q=QBY[id]; if(!q) return;
  if(opt.tab==="prac"&&id!==opt.cur&&!leaveOK()) return;
  if(opt.no!=="all"&&opt.no!==String(q.no)) opt.no=String(q.no);
  opt.cur=id; revealed=false; save();
  if(opt.tab==="prac") renderPrac(); else setTab("prac");
  try{$("w54").scrollIntoView({block:"start"})}catch(e){}
}
function essayTagsHTML(){
  var by={}, n=0;
  Object.keys(E.attempts||{}).forEach(function(id){atts(id).forEach(function(a){n++;(a.errors||[]).forEach(function(e){(e.tags&&e.tags.length?e.tags:["其他"]).forEach(function(t){(by[t]=by[t]||[]).push({id:id,a:a,e:e})})})})});
  var ts=Object.keys(by).sort(function(a,b){return by[b].length-by[a].length||a.localeCompare(b)});
  if(!n) return "";
  var h='<div class="card"><h2 style="margin:0 0 4px;font-size:20px">✍️ 作文易错点（'+n+' 篇批改）</h2><div style="color:var(--muted);font-size:14.5px">老师批改的 53/54 作文错误，按类型从多到少。点例子去那道题重做。</div></div>';
  ts.forEach(function(t,i){
    h+='<details class="mtype"'+(i<3?" open":"")+'><summary><span>'+esc(t)+'</span><span class="cnt">'+by[t].length+" 次</span></summary>";
    if(E.tags[t]) h+='<div class="rule">✅ 下次怎么做：'+esc(E.tags[t])+"</div>";
    by[t].forEach(function(x){var q=QBY[x.id];
      h+='<div class="ex" data-q="'+esc(x.id)+'"><div class="src">'+(q?"第"+q.round+"回 "+q.no+"번":esc(x.id))+" · 第"+x.a.try+"次 · "+esc(x.a.date)+' ›</div><div lang="ko"><span style="color:var(--bad)">'+esc(x.e.wrong)+'</span> → <span style="color:var(--ok)">'+esc(x.e.right)+'</span></div><div style="color:var(--muted);font-size:13px">'+esc(x.e.cause)+"</div></div>"});
    h+="</details>";
  });
  return h;
}
function tips(q){
  if(q.tips) return q.tips;
  var t=["题目有 "+q.qs.length+" 个问题 → 写 "+q.qs.length+" 段，一个问题一段"];
  q.qs.forEach(function(x,i){t.push("第"+(i+1)+"段回答：「"+x+"」")});
  t.push("开头别照抄题目说明，换成自己的话；全文 -ㄴ다 体，不用 나/저");
  return t;
}
function countOf(s){return s.replace(/\r?\n/g,"").length}
function updCnt(){
  var ta=$("w54Essay"), q=QBY[opt.cur], el=$("w54Cnt"); if(!ta||!q||!el) return;
  var n=countOf(ta.value), ns=ta.value.replace(/\s/g,"").length, L=lim(q), cls=n<L[0]?"lo":(n>L[1]?"hi":"ok");
  el.className="w54cnt "+cls;
  el.innerHTML='字数 <b>'+n+'</b> / 目标 '+L[0]+"–"+L[1]+' <span class="st">'+(n===0?"":cls==="lo"?"还差 "+(L[0]-n)+" 字":cls==="hi"?"超出 "+(n-L[1])+" 字":"✓ 字数合格")+'</span><span class="sub">含空格和标点、不含换行（≈原稿纸格数）· 不含空格 '+ns+"</span>";
  ta.style.height="auto"; ta.style.height=Math.max(ta.scrollHeight,q.no===53?200:320)+"px";
}
function renderRev(){
  var q=QBY[opt.cur], r=$("w54Rev"); if(!q||!r) return;
  if(!revealed){r.innerHTML="";return}
  var off=q.modelType==="official";
  var h='<div class="reveal"><div class="ansbox"><div class="h">'+(off?'<span class="badge real">官方模范答案</span>':'<span class="badge rec">参考范文（自编）</span>')+' <span style="color:var(--muted);font-size:13px">'+q.n+"字</span></div>";
  h+='<div class="w54model" lang="ko">'+q.model.map(function(p){return "<p>"+esc(p)+"</p>"}).join("")+"</div>";
  if(q.grading) h+='<div class="exp"><b>官方评分要点</b><ul class="w54chk">'+q.grading.map(function(x){return "<li>"+esc(x)+"</li>"}).join("")+"</ul></div>";
  if(q.note&&q.round!==35) h+='<div class="note">📝 '+esc(q.note)+"</div>";
  if(q.n>lim(q)[1]) h+='<div class="note">📝 这篇官方范文 '+q.n+' 字，超过了 '+lim(q)[1]+' 字的要求；自己写的时候请控制在范围内。</div>';
  h+="</div></div>";
  r.innerHTML=h;
}
function copyEssay(){
  var q=QBY[opt.cur], ta=$("w54Essay"); if(!q||!ta) return;
  var txt=ta.value.trim();
  if(!txt&&!confirm("作文还是空的，仍然复制题目？")) return;
  var title=q.ins+(q.box?"\n"+q.box:"")+(q.qs?"\n"+q.qs.map(function(x){return "· "+x}).join("\n"):"");
  var ct=chartText(q); if(ct) title+="\n[图表内容]\n"+ct;
  copyText("【TOPIK II 写作】"+qLabel(q)+" · 第"+q.no+"题（"+kindZh(q)+"）\n题目："+title+(atts(q.id).length?"\n（这是我第 "+(atts(q.id).length+1)+" 次写这道题）":"")+"\n我的作文："+(txt||"（未填写）")+"\n请帮我批改语法、语体、结构和是否符合题目要求，谢谢！","已复制，可以粘贴发给老师");
}
function goQ(d){var list=qList(), i=0;for(var k=0;k<list.length;k++)if(list[k].id===opt.cur)i=k;
  if(!leaveOK())return; i=(i+d+list.length)%list.length; opt.cur=list[i].id; revealed=false; save(); renderPrac(); try{$("w54").scrollIntoView({block:"start"})}catch(e){}}

/* ---------- 事件 ---------- */
function bind(){
  var root=$("w54"); if(!root||root._b) return; root._b=true;
  $("w54tabs").addEventListener("click",function(e){var b=e.target.closest("button[data-tab]");if(b)setTab(b.getAttribute("data-tab"))});
  $("w54Body").addEventListener("change",function(e){if(e.target.id==="w54Pick"){var list=qList(),i=+e.target.value;if(!leaveOK()){e.target.value=String(list.indexOf(QBY[opt.cur]));return}opt.cur=list[i].id;revealed=false;save();renderPrac()}});
  $("w54Body").addEventListener("click",function(e){
    var ex=e.target.closest(".ex[data-q]"); if(ex){goQid(ex.getAttribute("data-q"));return}
    var b=e.target.closest("button"); if(!b) return;
    var seg=b.closest(".seg[data-w54]");
    if(seg&&b.hasAttribute("data-v")){var k=seg.getAttribute("data-w54"),v=b.getAttribute("data-v");
      if(k==="cst"){opt.cst=v;save();renderCheat();return}
      if(k==="no"){if(!leaveOK())return;opt.no=v;opt.cur=null;revealed=false;save();renderPrac();return}
      opt[k]=v;save();if(k==="scope"||R.redo)newRound();else{R.st="ask";R.typed=""}renderCard();return}
    var a=b.getAttribute("data-a"); if(!a) return;
    var c=R&&R.q[R.i];
    switch(a){
      case "link": copyText(linkFor(opt.tab),"链接已复制"); return;
      case "copytpl": copyText(b.getAttribute("data-t"),"模板已复制"); return;
      case "clear": if(confirm("确定清空 53·54 闪卡错题本？")){W={};saveW();if(opt.scope==="wrong")newRound();setTab(opt.tab);toast("已清空")} return;
      case "check": submit(); return;
      case "giveup": R.typed=($("w54In")||{}).value||"";R.st="bad";mark(c,false);renderCard(); return;
      case "actually": R.bad--;R.ok++;R.missed.pop();var w=W[c.id];if(w){w.n--;if(w.n<=0)delete W[c.id];saveW()}R.st="ok";toast("好的，算你对 👍");renderCard(); return;
      case "next": next(); return;
      case "show": R.st="shown";renderCard(); return;
      case "know": mark(c,true);next(); return;
      case "dunno": mark(c,false);R.st="bad";renderCard(); return;
      case "redo": newRound(R.missed.slice(),true);renderCard(); return;
      case "exitredo": case "again": newRound();renderCard(); return;
      case "wrongbook": opt.scope="wrong";save();newRound();renderCard(); return;
      case "dowrong": opt.scope="wrong";save();newRound();setTab("cards"); return;
      case "copyessay": copyEssay(); return;
      case "rewrite": rewrite(); return;
      case "goq": goQid(b.getAttribute("data-q")); return;
      case "reveal": revealed=!revealed;b.textContent=revealed?"收起参考答案":"看参考答案";renderRev();if(revealed){try{$("w54Rev").scrollIntoView({block:"start",behavior:"smooth"})}catch(x){}} return;
      case "prev": goQ(-1); return;
      case "nextq": goQ(1); return;
    }
  });
}
window.TopikW54={open:open,init:bind,leaveOK:leaveOK};
})();
