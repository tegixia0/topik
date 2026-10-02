/* 📚 词库：TOPIK 中高级词汇（国立国语院《한국어 학습용 어휘 목록》中级B+高级C）
   数据：bank/index.json（词表）+ bank/o-NN.json（按学习顺序分块的详情）+ bank/c-<主题>.json（按主题的详情），由 tools/build_bank.py 生成
   本地记录：localStorage topik.bank.v1（间隔复习/每日计划），答错同时记入闪卡错题本 topik.wrong.v1 */
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var LS="topik.bank.v1", LS_WRONG="topik.wrong.v1";
var INT=[0,1,2,4,7,15,30];           // 间隔复习：答对一次升一级，对应 N 天后再复习
var M=null, W=[], BY={}, CAT={}, DET={}, LOADED={}, P=null;
var st=load();
var S=null;                           // 当前练习
var view={tab:st.opt.tab||"daily", cat:null, grp:0, pos:"", lvl:"", hfOnly:false};
function load(){var d;try{d=JSON.parse(localStorage.getItem(LS))}catch(e){}d=d&&typeof d==="object"?d:{};d.opt=d.opt||{};d.w=d.w||{};d.days=d.days||{};if(!d.opt.n)d.opt.n=50;if(!d.opt.src)d.opt.src="hf";if(!d.opt.mode)d.opt.mode="zh2ko";return d}
function save(){try{var ks=Object.keys(st.days).sort();while(ks.length>120){delete st.days[ks.shift()]}localStorage.setItem(LS,JSON.stringify(st))}catch(e){}}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function toast(m){var t=$("toast");if(!t)return;t.textContent=m;t.classList.add("show");clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove("show")},1700)}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function dstr(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function today(){return dstr(new Date())}
function addDays(s,n){var p=s.split("-"),d=new Date(+p[0],+p[1]-1,+p[2]);d.setDate(d.getDate()+n);return dstr(d)}
var ACC=window.TopikAcc||{load:function(){return Promise.resolve()},find:function(){return null},altsHTML:function(){return ""},okHTML:function(){return '<div class="title">✓ 对</div>'},copy:function(){},normalize:function(s){return String(s||"").replace(/\s+/g,"")},answerVariants:function(s){return [String(s||"").replace(/\s+/g,"")]}};
function norm(s){return ACC.normalize(s)}
function match(user,ans){var u=norm(user);if(!u)return false;return ACC.answerVariants(String(ans)).indexOf(u)>=0}
function canSpeak(){return "speechSynthesis" in window}
function speak(t){if(!canSpeak())return;try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(t);u.lang="ko-KR";u.rate=.9;speechSynthesis.speak(u)}catch(e){}}

/* ---------- 数据 ---------- */
function ensure(){
  if(P) return P;
  P=fetch("bank/index.json?v="+Date.now(),{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error(r.status+" bank/index.json");return r.json()}).then(function(d){
    M=d; W=[]; BY={}; CAT={};
    d.cats.forEach(function(c,i){c.i=i;CAT[c.id]=c});
    d.words.forEach(function(a,i){var w={ko:a[0],zh:a[1],cat:d.cats[a[2]].id,lvl:a[3],hf:a[4],pos:a[5],e:a[6],i:i};W.push(w);BY[w.ko]=w});
  });
  P.catch(function(){P=null});
  return P;
}
function chunkOf(w){return "o-"+String(Math.floor(w.i/M.chunk)).padStart(2,"0")}
function fetchPart(name){
  if(LOADED[name]) return LOADED[name];
  LOADED[name]=fetch("bank/"+name+".json?v="+encodeURIComponent(M.build||M.updated),{cache:"default"}).then(function(r){if(!r.ok)throw new Error(r.status+" "+name);return r.json()}).then(function(d){for(var k in d)DET[k]=d[k]});
  LOADED[name].catch(function(){delete LOADED[name]});
  return LOADED[name];
}
function details(list,prefer){   // 确保这些词的详情已加载
  var need={};
  list.forEach(function(w){if(!DET[w.ko]) need[prefer&&w.cat===prefer?"c-"+prefer:chunkOf(w)]=1});
  return Promise.all(Object.keys(need).map(fetchPart));
}
function card(w){var d=DET[w.ko]||{},c={t:"v",ko:w.ko,zh:w.zh,date:"词库"};for(var k in d)c[k]=d[k];return c}

/* ---------- 学习记录 ---------- */
function rec(ko){return st.w[ko]}
function learned(ko){var r=st.w[ko];return !!r&&r.s>=1}
function seen(ko){return !!st.w[ko]}
function isDue(ko,t){var r=st.w[ko];return !!r&&r.d<=t}
function dayRec(t){t=t||today();return st.days[t]||(st.days[t]={nw:[],done:[],src:st.opt.src})}
function mark(w,ok){
  var t=today(), r=st.w[w.ko]||{s:0,n:0,ok:0,bad:0,f:t};
  r.n++; r.l=t;
  if(ok){r.ok++;r.s=Math.min((r.s||0)+1,INT.length-1);r.d=addDays(t,INT[r.s])}
  else {r.bad++;r.s=0;r.d=addDays(t,1)}
  st.w[w.ko]=r;
  var dr=dayRec(t); if(dr.done.indexOf(w.ko)<0) dr.done.push(w.ko);
  save();
  var mk=S&&S.mode==="ko2zh"?"v_ko_zh":"v_zh_ko";
  if(!ok) wrongAdd(w,mk); else if(S&&S.review) wrongDel(w,mk);
}
function loadWrong(){try{return JSON.parse(localStorage.getItem(LS_WRONG))||{}}catch(e){return {}}}
function wrongAdd(w,mk){   // 和闪卡错题本同一格式：键 "v|韩语"，m[模式]=次数
  var all=loadWrong(),k="v|"+w.ko,c=card(w),e=all[k]||{t:"v",ko:w.ko,m:{}};
  e.zh=w.zh; e.date=e.date||"词库"; ["ex","exzh","pos","hanja","mem","tip","syn","ant"].forEach(function(f){if(c[f]!=null)e[f]=c[f]});
  e.m=e.m||{}; e.m[mk]=(e.m[mk]||0)+1; e.last=Date.now(); all[k]=e;
  try{localStorage.setItem(LS_WRONG,JSON.stringify(all))}catch(x){}
}
function wrongDel(w,mk){var all=loadWrong(),k="v|"+w.ko,e=all[k];if(!e||!e.m||e.date!=="词库")return;delete e.m[mk];if(!Object.keys(e.m).length)delete all[k];try{localStorage.setItem(LS_WRONG,JSON.stringify(all))}catch(x){}}
function streak(){
  var t=today(), n=0, d=t;
  if(!(st.days[d]&&st.days[d].done.length)) d=addDays(t,-1);
  while(st.days[d]&&st.days[d].done.length){n++;d=addDays(d,-1)}
  return n;
}

/* ---------- 来源 / 每日计划 ---------- */
function srcList(src){
  src=src||"hf";
  if(src==="hf") return W.filter(function(w){return w.hf});
  if(src==="all") return W;
  if(src.indexOf("cat:")===0){var c=src.slice(4);return catWords(c)}
  return W;
}
function catWords(c){return W.filter(function(w){return w.cat===c}).sort(function(a,b){return (b.hf-a.hf)||(a.i-b.i)})}
function srcName(src){if(src==="hf")return "⭐ 高频";if(src==="all")return "全部（高频优先）";if(src&&src.indexOf("cat:")===0){var c=CAT[src.slice(4)];return c?c.emoji+" "+c.name:src}return src}
function plan(regen){
  var t=today(), dr=dayRec(t), n=Math.max(5,Math.min(300,+st.opt.n||50));
  if(regen||dr.src!==st.opt.src||dr.nw.length<n){
    var keep=(!regen&&dr.src===st.opt.src)?dr.nw.slice():dr.nw.filter(function(k){return dr.done.indexOf(k)>=0});   // 换来源/改数量：只保留今天已经练过的
    var have={}; keep.forEach(function(k){have[k]=1});
    var list=keep.slice();
    srcList(st.opt.src).forEach(function(w){if(list.length<n&&!have[w.ko]&&!seen(w.ko)){list.push(w.ko);have[w.ko]=1}});
    if(list.join()!==dr.nw.join()||dr.src!==st.opt.src){dr.nw=list; dr.src=st.opt.src; save();}
  }
  var newW=dr.nw.map(function(k){return BY[k]}).filter(Boolean);
  var isNew={}; dr.nw.forEach(function(k){isNew[k]=1});
  var due=W.filter(function(w){var r=st.w[w.ko];return r&&r.d<=t&&!isNew[w.ko]&&!(r.l===t&&r.s>0)});
  return {nw:newW, due:due, dr:dr};
}

/* ---------- 渲染：外壳 ---------- */
function shell(){
  var b=$("bank"); if(!b) return;
  if(!$("bkTabs")){
    b.innerHTML='<div class="mtabs bk-tabs" id="bkTabs"><button type="button" data-tab="hf">⭐ 高频</button><button type="button" data-tab="cat">🗂 分类</button><button type="button" data-tab="daily">📅 每日'+esc(st.opt.n)+'</button><button type="button" data-tab="prog">📈 进度</button></div><div id="bkBody"><div class="card empty">加载中…</div></div><footer id="bkFoot"></footer>';
    $("bkTabs").addEventListener("click",function(e){var x=e.target.closest("button[data-tab]");if(!x)return;if(S&&S.active&&!confirm("正在练习，确定离开？（已答的记录会保留）"))return;S=null;view.cat=null;view.grp=0;setTab(x.getAttribute("data-tab"))});
  }
}
function setTab(t){
  if(["hf","cat","daily","prog"].indexOf(t)<0) t="daily";
  view.tab=t; st.opt.tab=t; save();
  Array.prototype.forEach.call(document.querySelectorAll("#bkTabs button"),function(b){b.classList.toggle("active",b.getAttribute("data-tab")===t)});
  var db=document.querySelector('#bkTabs button[data-tab="daily"]'); if(db) db.textContent="📅 每日"+st.opt.n;
  syncURL();
  render();
}
function syncURL(){
  try{
    var q=view.tab==="cat"&&view.cat?"?bank=cat&c="+encodeURIComponent(view.cat):"?bank="+(view.tab==="daily"?"daily":view.tab==="hf"?"hf":view.tab==="prog"?"progress":"cat");
    if(location.search.indexOf("bank=")>=0||location.search==="") history.replaceState(null,"",location.pathname+q);
  }catch(e){}
}
function render(){
  var body=$("bkBody"); if(!body) return;
  if(!M){body.innerHTML='<div class="card empty">加载中…</div>';return}
  if(S&&S.active){renderQuiz();return}
  if(view.tab==="hf") renderList("hf");
  else if(view.tab==="cat") {if(view.cat) renderList("cat:"+view.cat); else renderCats();}
  else if(view.tab==="daily") renderDaily();
  else renderProg();
  $("bkFoot").innerHTML='<div>词表：国立国语院《한국어 학습용 어휘 목록》(2003) 中级B '+M.counts.B+' + 高级C '+M.counts.C+' 词；中文对译·汉字·例句·语义分类参考国立国语院《한국어기초사전》。</div>';
}
function modeSeg(){
  return '<div class="seg" id="bkMode"><button type="button" data-m="zh2ko" class="'+(st.opt.mode==="zh2ko"?"active":"")+'">中→韩（打字）</button><button type="button" data-m="ko2zh" class="'+(st.opt.mode==="ko2zh"?"active":"")+'">韩→中（自评）</button></div>';
}
function bindMode(){var m=$("bkMode");if(m)m.onclick=function(e){var b=e.target.closest("button[data-m]");if(!b)return;st.opt.mode=b.getAttribute("data-m");save();render()}}
function lvlName(l){return l===1?"中级":"高级"}
function wordLi(w){
  var r=st.w[w.ko], badge=r?(r.s>=1?'<span class="bk-st ok">✓</span>':'<span class="bk-st bad">✗</span>'):"";
  return '<li data-ko="'+esc(w.ko)+'"><div class="bk-li"><span class="ko" lang="ko">'+esc(w.ko)+'</span> <span class="posb">'+esc(w.pos)+'</span>'+(w.hf?' <span class="bk-hf">⭐</span>':"")+' <span class="bk-lv l'+w.lvl+'">'+lvlName(w.lvl)+"</span>"+badge+'<br><span class="zh">'+esc(w.zh)+'</span></div><div class="bk-det"></div></li>';
}
function bindList(ul,prefer){
  if(!ul) return;
  ul.onclick=function(e){
    var li=e.target.closest("li[data-ko]"); if(!li||e.target.closest(".bk-det .speak")) return;
    var box=li.querySelector(".bk-det"); if(box.innerHTML){box.innerHTML="";return}
    var w=BY[li.getAttribute("data-ko")]; box.innerHTML='<div class="sub">加载中…</div>';
    details([w],prefer).then(function(){box.innerHTML=detailHTML(card(w))}).catch(function(err){box.innerHTML='<div class="sub">加载失败：'+esc(err.message)+"</div>"});
  };
}
function detailHTML(c){
  var b="";
  if(c.ex) b+='<div class="row"><span class="k">📝 例句</span><span lang="ko">'+esc(c.ex)+"</span>"+(c.exzh?'<div class="sub">'+esc(c.exzh)+"</div>":"")+"</div>";
  b+=infoBody(c);
  return '<div class="wi bk-wi">'+b+"</div>";
}
function chips(list,cls){
  return '<div class="chips">'+list.map(function(x){if(typeof x==="string")return '<span class="chip '+cls+'" lang="ko">'+esc(x)+"</span>";return '<span class="chip '+cls+'"><b lang="ko">'+esc(x.ko)+"</b>"+(x.zh?" <span>"+esc(x.zh)+"</span>":"")+"</span>"}).join("")+"</div>";
}
function infoBody(c){
  var b=ACC.altsHTML("v:"+c.ko);
  if(c.pos||c.hanja) b+='<div class="row">'+(c.pos?'<span class="posb">'+esc(c.pos)+"</span> ":"")+(c.hanja?'<span class="k" style="display:inline;margin-left:4px">汉字</span> <span class="hj">'+esc(c.hanja)+"</span>":"")+"</div>";
  if(c.mem) b+='<div class="row"><span class="k">🧠 记忆法</span>'+esc(c.mem)+"</div>";
  if(c.tip) b+='<div class="tipbox">⚠️ 易错：'+esc(c.tip)+"</div>";
  if(c.syn&&c.syn.length) b+='<div class="row"><span class="k">≈ 近义词 / 同类词</span>'+chips(c.syn,"syn")+"</div>";
  if(c.ant&&c.ant.length) b+='<div class="row"><span class="k">⇄ 反义词</span>'+chips(c.ant,"ant")+"</div>";
  return b;
}
function infoHTML(c,open){
  var b=infoBody(c); if(!b) return "";
  return '<details class="wi'+(open?" hot":"")+'" id="bkWi"'+(open?" open":"")+'><summary>📖 词性·记忆法·近反义词</summary><div class="body">'+b+"</div></details>";
}

/* ---------- 高频 / 分类 列表 ---------- */
var GRP=50;
function renderCats(){
  var h='<div class="card bk-intro"><div class="bk-h">🗂 按主题分类</div><div class="sub">共 '+M.counts.total+' 词，分成 '+M.cats.length+' 类（点开可看词表、按组练习）。分类依据国立国语院《한국어기초사전》的语义范畴，没有范畴的词按中文意思/词根/词性归类。</div></div>';
  h+='<div class="bk-cats">'+M.cats.map(function(c){
    var ws=catWords(c.id), ln=ws.filter(function(w){return learned(w.ko)}).length;
    return '<button type="button" class="bk-cat" data-c="'+c.id+'"><span class="e">'+c.emoji+'</span><span class="n">'+esc(c.name)+'</span><span class="c">'+c.n+' 词 · ⭐'+c.hf+'</span><span class="bk-mini"><i style="width:'+(c.n?Math.round(ln/c.n*100):0)+'%"></i></span></button>'}).join("")+"</div>";
  var pc={}; W.forEach(function(w){var p=w.pos.split("/")[0];p=({"名":"名词","动":"动词","形":"形容词","副":"副词"})[p]||"其他";pc[p]=(pc[p]||0)+1});
  h+='<div class="card" style="margin-top:10px"><div class="bk-h">🔤 按词性</div><div class="seg" id="bkPosAll">'+["名词","动词","形容词","副词","其他"].map(function(p){return '<button type="button" data-p="'+p+'">'+p+" "+(pc[p]||0)+"</button>"}).join("")+"</div></div>";
  $("bkBody").innerHTML=h;
  $("bkBody").querySelector(".bk-cats").onclick=function(e){var b=e.target.closest("button[data-c]");if(b){view.cat=b.getAttribute("data-c");view.grp=0;view.pos="";view.lvl="";syncURL();render();window.scrollTo(0,0)}};
  $("bkPosAll").onclick=function(e){var b=e.target.closest("button[data-p]");if(b){view.cat="all";view.grp=0;view.pos=b.getAttribute("data-p");view.lvl="";syncURL();render();window.scrollTo(0,0)}};
}
function posOK(w,p){if(!p)return true;var f=w.pos.split("/")[0];var m={"名词":"名","动词":"动","形容词":"形","副词":"副"};return m[p]?f===m[p]:["名","动","形","副"].indexOf(f)<0}
function renderList(src){
  var isHF=src==="hf", cid=isHF?null:src.slice(4), c=cid&&cid!=="all"?CAT[cid]:null;
  var base=isHF?srcList("hf"):(cid==="all"?W.slice():catWords(cid));
  var list=base.filter(function(w){return posOK(w,view.pos)&&(!view.lvl||String(w.lvl)===view.lvl)&&(!view.hfOnly||w.hf||isHF)});
  var ln=base.filter(function(w){return learned(w.ko)}).length;
  var h='<div class="card bk-intro">';
  if(isHF) h+='<div class="bk-h">⭐ 高频词 '+base.length+' 个 <span class="sub">（中级 '+M.counts.hfB+' · 高级 '+M.counts.hfC+'）</span></div><div class="sub bk-def">高频＝国立国语院《现代国语使用频度调查》(2002) 频度排名最靠前的 '+M.hfN+' 个中级(B)+高级(C)词；在本站 TOPIK II 阅读真题（第60·83·91·96回）里出现过的词，排名按 ×2 加权提前（'+M.counts.paper+' 个词在真题里出现过）。按频度从高到低排列。</div>';
  else h+='<button type="button" class="bk-back" id="bkBack">‹ 返回分类</button><div class="bk-h">'+(c?c.emoji+" "+esc(c.name):"🔤 全部词")+' <span class="sub">'+base.length+' 词</span></div>'+(c?'<div class="sub">'+esc(c.desc)+"</div>":"");
  h+='<div class="bk-prog"><span>已学会 <b>'+ln+"</b> / "+base.length+'</span><span class="bk-mini"><i style="width:'+(base.length?Math.round(ln/base.length*100):0)+'%"></i></span></div>';
  h+='<div class="seg bk-f" id="bkPos">'+["","名词","动词","形容词","副词","其他"].map(function(p){return '<button type="button" data-p="'+p+'" class="'+(view.pos===p?"active":"")+'">'+(p||"全部词性")+"</button>"}).join("")+"</div>";
  h+='<div class="seg bk-f" id="bkLvl">'+[["","中级+高级"],["1","中级"],["2","高级"]].map(function(x){return '<button type="button" data-l="'+x[0]+'" class="'+(view.lvl===x[0]?"active":"")+'">'+x[1]+"</button>"}).join("")+(isHF?"":'<button type="button" id="bkHfOnly" class="'+(view.hfOnly?"active":"")+'">只看⭐高频</button>')+"</div></div>";
  var ng=Math.max(1,Math.ceil(list.length/GRP)); if(view.grp>=ng) view.grp=0;
  var g=list.slice(view.grp*GRP,(view.grp+1)*GRP), gl=g.filter(function(w){return learned(w.ko)}).length;
  h+='<div class="card" style="margin-top:10px"><div class="wrow"><select id="bkGrp" aria-label="选择分组">'+Array.apply(null,{length:ng}).map(function(_,i){var s=list.slice(i*GRP,(i+1)*GRP),l=s.filter(function(w){return learned(w.ko)}).length;return '<option value="'+i+'"'+(i===view.grp?" selected":"")+">第 "+(i+1)+" 组 · "+(i*GRP+1)+"–"+(i*GRP+s.length)+(l?"（会 "+l+"）":"")+"</option>"}).join("")+"</select></div>";
  h+=modeSeg();
  h+='<div class="actions"><button type="button" class="b-primary" id="bkGo">练这一组（'+g.length+'）</button><button type="button" id="bkGoNew"'+(g.length-gl?"":" disabled")+'>只练没学会的（'+(g.length-gl)+'）</button></div>';
  h+='<ul class="list bk-list" id="bkUl">'+(g.length?g.map(wordLi).join(""):'<li class="empty">没有符合条件的词</li>')+"</ul></div>";
  $("bkBody").innerHTML=h;
  var pref=c?cid:null;
  bindMode(); bindList($("bkUl"),pref);
  if($("bkBack")) $("bkBack").onclick=function(){view.cat=null;view.pos="";view.lvl="";view.hfOnly=false;syncURL();render()};
  $("bkPos").onclick=function(e){var b=e.target.closest("button[data-p]");if(b){view.pos=b.getAttribute("data-p");view.grp=0;render()}};
  $("bkLvl").onclick=function(e){var b=e.target.closest("button[data-l]");if(b){view.lvl=b.getAttribute("data-l");view.grp=0;render();return}if(e.target.id==="bkHfOnly"){view.hfOnly=!view.hfOnly;view.grp=0;render()}};
  $("bkGrp").onchange=function(){view.grp=+this.value;render()};
  var label=(isHF?"⭐ 高频":(c?c.emoji+" "+c.name:"全部词"))+" · 第"+(view.grp+1)+"组";
  $("bkGo").onclick=function(){startQuiz(g,{label:label,prefer:pref})};
  $("bkGoNew").onclick=function(){startQuiz(g.filter(function(w){return !learned(w.ko)}),{label:label+"（没学会的）",prefer:pref})};
}

/* ---------- 每日 ---------- */
function renderDaily(){
  var p=plan(false), t=today(), dr=p.dr;
  var newLeft=p.nw.filter(function(w){return dr.done.indexOf(w.ko)<0});
  var doneNew=p.nw.length-newLeft.length;
  var opts='<option value="hf">⭐ 高频（按频度顺序）</option><option value="all">全部（先高频，再其余）</option><optgroup label="某个分类">'+M.cats.map(function(c){return '<option value="cat:'+c.id+'">'+c.emoji+" "+esc(c.name)+"（"+c.n+"）</option>"}).join("")+"</optgroup>";
  var h='<div class="card bk-intro"><div class="bk-h">📅 '+t.slice(5).replace("-","月")+'日 · 今日计划</div>';
  h+='<div class="bk-stats"><div><b>'+doneNew+'<small>/'+p.nw.length+'</small></b><span>新词</span></div><div><b>'+p.due.length+'</b><span>待复习</span></div><div><b>'+dr.done.length+'</b><span>今天已练</span></div><div><b>'+streak()+'</b><span>连续天数🔥</span></div></div>';
  h+='<div class="wrow" style="margin-top:10px"><label>来源</label><select id="bkSrc">'+opts+'</select></div>';
  h+='<div class="wrow"><label>每天新词</label><select id="bkN">'+[10,20,30,40,50,60,80,100,150,200].map(function(n){return '<option value="'+n+'"'+(+st.opt.n===n?" selected":"")+">"+n+" 个</option>"}).join("")+"</select></div>";
  h+=modeSeg();
  var all=p.due.concat(newLeft);
  h+='<div class="actions"><button type="button" class="b-primary full" id="bkToday"'+(all.length?"":" disabled")+'>'+(all.length?"开始今天的学习（复习 "+p.due.length+" + 新词 "+newLeft.length+"）":"今天的任务完成了 🎉")+'</button>';
  h+='<button type="button" id="bkRev"'+(p.due.length?"":" disabled")+'>只复习（'+p.due.length+'）</button><button type="button" id="bkNew"'+(newLeft.length?"":" disabled")+'>只学新词（'+newLeft.length+'）</button>';
  if(!newLeft.length) h+='<button type="button" class="b-ghost small full" id="bkMore">再加 '+st.opt.n+' 个新词</button>';
  h+="</div>";
  h+='<div class="sub" style="margin-top:8px">复习规则：答对 → 1/2/4/7/15/30 天后再出现；答错 → 明天再复习，并记入错题本。新词默认按「高频」顺序，没练过的才算新词。</div></div>';
  h+='<div class="card" style="margin-top:10px"><div class="bk-h">今天的新词（'+p.nw.length+'）· '+esc(srcName(st.opt.src))+'</div><ul class="list bk-list" id="bkUl">'+(p.nw.length?p.nw.map(wordLi).join(""):'<li class="empty">这个来源的词都学过了，换一个来源吧</li>')+"</ul></div>";
  if(p.due.length) h+='<div class="card" style="margin-top:10px"><div class="bk-h">待复习（'+p.due.length+'）</div><ul class="list bk-list" id="bkUl2">'+p.due.slice(0,200).map(wordLi).join("")+"</ul></div>";
  $("bkBody").innerHTML=h;
  $("bkSrc").value=st.opt.src;
  $("bkSrc").onchange=function(){st.opt.src=this.value;save();plan(true);render()};
  $("bkN").onchange=function(){st.opt.n=+this.value;save();plan(true);setTab("daily")};
  bindMode(); bindList($("bkUl")); bindList($("bkUl2"));
  $("bkToday").onclick=function(){startQuiz(p.due.concat(newLeft),{label:"📅 今日学习",review:true,daily:true,keepOrder:true})};
  $("bkRev").onclick=function(){startQuiz(p.due,{label:"🔁 复习",review:true,daily:true})};
  $("bkNew").onclick=function(){startQuiz(newLeft,{label:"🆕 今日新词",daily:true,keepOrder:true})};
  if($("bkMore")) $("bkMore").onclick=function(){
    var have={}; dr.nw.forEach(function(k){have[k]=1}); var add=[];
    srcList(st.opt.src).forEach(function(w){if(add.length<st.opt.n&&!have[w.ko]&&!seen(w.ko))add.push(w.ko)});
    if(!add.length){toast("这个来源没有新词了");return}
    dr.nw=dr.nw.concat(add); save(); render();
  };
}

/* ---------- 进度 ---------- */
function renderProg(){
  var t=today(), tot=W.length, ln=W.filter(function(w){return learned(w.ko)}).length, sn=Object.keys(st.w).length;
  var hfW=W.filter(function(w){return w.hf}), hfL=hfW.filter(function(w){return learned(w.ko)}).length;
  var bW=W.filter(function(w){return w.lvl===1}), cW=W.filter(function(w){return w.lvl===2});
  var due=W.filter(function(w){return isDue(w.ko,t)}).length, dr=st.days[t];
  function bar(a,b){return '<span class="bk-mini"><i style="width:'+(b?Math.round(a/b*100):0)+'%"></i></span>'}
  var h='<div class="card bk-intro"><div class="bk-h">📈 我的进度</div><div class="bk-stats"><div><b>'+ln+'</b><span>已学会 / '+tot+'</span></div><div><b>'+streak()+'</b><span>连续天数🔥</span></div><div><b>'+(dr?dr.done.length:0)+'</b><span>今天已练</span></div><div><b>'+due+'</b><span>今天待复习</span></div></div>';
  h+='<table class="stbl bk-tbl"><tr><th></th><th>已学会</th><th>总数</th><th></th></tr>'+
    [["⭐ 高频",hfL,hfW.length],["中级 B",bW.filter(function(w){return learned(w.ko)}).length,bW.length],["高级 C",cW.filter(function(w){return learned(w.ko)}).length,cW.length],["全部",ln,tot]].map(function(r){return "<tr><td>"+r[0]+"</td><td>"+r[1]+"</td><td>"+r[2]+"</td><td>"+bar(r[1],r[2])+"</td></tr>"}).join("")+"</table>";
  h+='<div class="sub">“已学会”＝至少答对过一次（之后按间隔复习）。练过但还没答对的：'+(sn-ln)+' 个。</div></div>';
  // 最近 14 天
  var days=[];for(var i=13;i>=0;i--){var d=addDays(t,-i);days.push([d,st.days[d]?st.days[d].done.length:0])}
  var mx=Math.max.apply(null,days.map(function(x){return x[1]}).concat([1]));
  h+='<div class="card" style="margin-top:10px"><div class="bk-h">最近 14 天</div><div class="bk-days">'+days.map(function(x){return '<div title="'+x[0]+'"><i style="height:'+Math.round(x[1]/mx*60)+'px"></i><b>'+(x[1]||"")+"</b><span>"+(+x[0].slice(8))+"</span></div>"}).join("")+"</div></div>";
  h+='<div class="card" style="margin-top:10px"><div class="bk-h">各分类</div><table class="stbl bk-tbl">'+M.cats.map(function(c){var ws=catWords(c.id),l=ws.filter(function(w){return learned(w.ko)}).length;return '<tr data-c="'+c.id+'"><td>'+c.emoji+" "+esc(c.name)+"</td><td>"+l+"/"+c.n+"</td><td>"+bar(l,c.n)+"</td></tr>"}).join("")+"</table></div>";
  h+='<footer><button type="button" id="bkReset">清空词库学习记录</button></footer>';
  $("bkBody").innerHTML=h;
  $("bkBody").querySelector(".bk-tbl:last-of-type").onclick=function(e){var r=e.target.closest("tr[data-c]");if(r){view.cat=r.getAttribute("data-c");setTab("cat")}};
  $("bkReset").onclick=function(){if(confirm("确定清空词库的学习记录（已学会/复习计划/每日记录）？错题本不受影响。")){st.w={};st.days={};save();render();toast("已清空")}};
}

/* ---------- 练习 ---------- */
function startQuiz(list,o){
  if(!list.length){toast("没有可练的词");return}
  o=o||{};
  S={active:true,q:o.keepOrder?list.slice():shuffle(list),i:0,ok:0,bad:0,missed:[],mode:st.opt.mode,label:o.label||"",review:!!o.review,prefer:o.prefer,requeued:{},st:"load",o:o};
  if(o.keepOrder&&o.review){ // 今日学习：复习词打乱放前面，新词按顺序
    var dueSet={}; list.forEach(function(w){if(seen(w.ko)&&st.w[w.ko].d<=today())dueSet[w.ko]=1});
    S.q=shuffle(list.filter(function(w){return dueSet[w.ko]})).concat(list.filter(function(w){return !dueSet[w.ko]}));
  }
  $("bkBody").innerHTML='<div class="card empty">加载词条…</div>';
  details(S.q,o.prefer).then(function(){S.st="ask";renderQuiz();window.scrollTo(0,0)}).catch(function(e){$("bkBody").innerHTML='<div class="card empty">加载失败：'+esc(e.message)+'<br><button type="button" class="gbtn" onclick="location.reload()">重试</button></div>'});
}
function cur(){return S.q[S.i]}
function hintOf(ko){var s=ko.replace(/\s+/g,"");return s.charAt(0)+Array(s.length).join("○")+"（"+s.length+" 个字）"}
function renderQuiz(){
  if(S.i>=S.q.length) return summary();
  var w=cur(), c=card(w), z=S.mode==="zh2ko", n=S.q.length;
  var h='<div class="bar"><span>'+esc(S.label)+'</span><span class="sp"></span><span><b>'+(S.i+1)+"/"+n+'</b></span><span>对 <b style="color:var(--ok)">'+S.ok+'</b></span><span>错 <b style="color:var(--bad)">'+S.bad+'</b></span></div><div class="progress"><i style="width:'+(S.i/n*100)+'%"></i></div>';
  h+='<div class="card" id="bkQuiz"><div class="label"><span>'+(z?"中文 → 写韩语单词":"韩语 → 想中文意思")+'</span><span class="tag pos">'+esc(w.pos)+" · "+lvlName(w.lvl)+(w.hf?" · ⭐":"")+'</span></div>';
  h+='<div class="prompt" lang="'+(z?"zh-CN":"ko")+'">'+esc(z?w.zh:w.ko)+(!z&&canSpeak()?' <button class="speak" id="bkSpk" aria-label="朗读">🔊</button>':"")+"</div>";
  h+='<div class="hintline" id="bkHint">'+(z?'<button type="button" id="bkHintBtn">显示提示</button>':"")+"</div>";
  h+='<textarea class="answer" id="bkAns" rows="1" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" lang="'+(z?"ko":"zh-CN")+'" placeholder="'+(z?"输入韩语…":"输入中文意思（可留空直接看答案）")+'"></textarea>';
  h+='<div class="feedback" id="bkFb"></div><div class="actions" id="bkActs"></div></div>';
  h+='<footer><button type="button" id="bkQuit">结束练习</button></footer>';
  $("bkBody").innerHTML=h;
  if($("bkSpk")) $("bkSpk").onclick=function(){speak(w.ko)};
  if($("bkHintBtn")) $("bkHintBtn").onclick=function(){$("bkHint").textContent="提示："+hintOf(w.ko)};
  var a=$("bkAns");
  a.addEventListener("input",function(){a.style.height="auto";a.style.height=Math.max(a.scrollHeight,54)+"px"});
  a.addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing&&e.keyCode!==229){e.preventDefault();e.stopPropagation();if(S.st==="ask")check()}});
  $("bkQuit").onclick=function(){if(S.i>0||confirm("结束这次练习？"))summary()};
  acts(z?[{t:"核对",c:"b-primary",f:check},{t:"不会 · 看答案",c:"b-ghost",f:giveUp}]:[{t:"看答案",c:"b-primary full",f:check}]);
  S.st="ask";
  try{a.focus({preventScroll:true})}catch(e){}
}
function acts(list){
  var box=$("bkActs"); box.innerHTML=list.map(function(b,i){return '<button type="button" data-i="'+i+'" class="'+(b.c||"")+'">'+b.t+"</button>"}).join("");
  box.onclick=function(e){var el=e.target.closest("button[data-i]");if(el)list[+el.getAttribute("data-i")].f()};
}
function exLine(c){return c.ex?'<div class="sub" lang="ko">例句：'+esc(c.ex)+"</div>"+(c.exzh?'<div class="sub">　　　'+esc(c.exzh)+"</div>":""):""}
function otherWord(user,w){   // 写成了别的词：告诉她那个词的意思
  var u=norm(user); for(var k in BY){if(k!==w.ko&&norm(k)===u)return BY[k]} return null;
}
function check(){
  if(S.st!=="ask") return;
  var w=cur(), c=card(w), a=$("bkAns"), user=a.value.trim(), fb=$("bkFb");
  if(S.mode==="zh2ko"){
    if(!user){toast("先输入韩语再核对");a.focus();return}
    a.disabled=true;
    if(match(user,w.ko)) return right(true);
    var alt=ACC.find("v:"+w.ko,user,match);
    if(alt) return right(true,alt);
    S.st="wrong1";
    var ow=otherWord(user,w);
    fb.className="feedback bad";
    fb.innerHTML='<div class="title">✗ 不对</div>你写的：<span lang="ko">'+esc(user)+"</span>"+(ow?'<div class="sub">「'+esc(ow.ko)+"」是另一个词："+esc(ow.zh)+"</div>":"")+'<br>正确：<div class="big" lang="ko">'+esc(w.ko)+"</div>"+exLine(c)+infoHTML(c,true);
    acts([{t:"再试一次",c:"b-primary",f:retry},{t:"下一张",f:function(){wrong()}},
      {t:ACC.BTN||"📋 复制给老师",c:"b-ghost small full acc-copy",f:function(){ACC.copy({deck:"📚 词库 · "+S.label,id:"v:"+w.ko,zh:w.zh,ans:w.ko,mine:user})}},
      {t:"其实我写对了（算对）",c:"b-ghost small full",f:function(){right(false)}}]);
    if(canSpeak()) speak(w.ko);
    return;
  }
  a.disabled=true; S.st="judge"; fb.className="feedback";
  fb.innerHTML=(user?'你写的：<span>'+esc(user)+"</span><br>":"")+'意思：<div class="big">'+esc(w.zh)+"</div>"+exLine(c)+'<div class="sub">意思接近就算对，翻译没有唯一标准。</div>'+infoHTML(c,false);
  acts([{t:"✓ 对",c:"b-ok",f:function(){right(false)}},{t:"✗ 不对",c:"b-bad",f:function(){
    mark(w,false); S.bad++; S.missed.push(w); requeue(w); S.st="wrong2";
    var d=$("bkWi"); if(d){d.open=true;d.classList.add("hot")}
    acts([{t:"记住了，下一张",c:"b-primary full",f:next}]);
  }}]);
}
function giveUp(){
  if(S.st!=="ask") return;
  var w=cur(), c=card(w); $("bkAns").disabled=true; S.st="wrong1";
  var fb=$("bkFb"); fb.className="feedback bad";
  fb.innerHTML='<div class="title">答案</div><div class="big" lang="ko">'+esc(w.ko)+"</div>"+exLine(c)+infoHTML(c,true);
  acts([{t:"记住了，下一张",c:"b-primary full",f:function(){wrong()}}]);
  if(canSpeak()) speak(w.ko);
}
function retry(){S.st="ask";var a=$("bkAns");a.disabled=false;a.value="";$("bkFb").innerHTML="";acts([{t:"核对",c:"b-primary",f:check},{t:"不会 · 看答案",c:"b-ghost",f:giveUp}]);a.focus()}
function requeue(w){if(!S.requeued[w.ko]){S.requeued[w.ko]=1;S.q.push(w)}}   // 答错的词本轮末尾再出现一次
function wrong(){var w=cur();mark(w,false);S.bad++;S.missed.push(w);requeue(w);next()}
function right(auto,alt){
  var w=cur(), c=card(w), again=S.requeued[w.ko]&&S.q.indexOf(w)!==S.i;
  if(!again) mark(w,true); S.ok++;
  if(auto){
    S.st="right"; var fb=$("bkFb"); fb.className="feedback ok";
    fb.innerHTML=(alt?ACC.okHTML(alt,w.ko)+'<div class="sub">你写的：<span lang="ko">'+esc($("bkAns").value.trim())+"</span></div>":'<div class="title">✓ 正确！</div><div class="big" lang="ko">'+esc(w.ko)+"</div>")+exLine(c)+infoHTML(c,false);
    acts([{t:"下一张",c:"b-primary full",f:next}]);
    var b=$("bkActs").querySelector("button"); if(b) b.focus();
    return;
  }
  next();
}
function next(){S.i++;S.st="ask";renderQuiz();try{$("bkQuiz").scrollIntoView({block:"nearest"})}catch(e){}}
function summary(){
  var miss=[],seenK={}; S.missed.forEach(function(w){if(!seenK[w.ko]){seenK[w.ko]=1;miss.push(w)}});
  var n=S.i, o=S.o; S.active=false;
  var h='<div class="card summary"><h2>本轮结束</h2><div class="nums">答了 '+n+' 张 · <span style="color:var(--ok)">对 '+S.ok+'</span> · <span style="color:var(--bad)">错 '+S.bad+"</span></div>";
  var dr=st.days[today()]; h+='<div class="sub">今天已练 '+(dr?dr.done.length:0)+' 个词 · 连续 '+streak()+' 天🔥</div>';
  if(miss.length) h+='<div class="sub" style="margin-top:8px">这轮的错词（已记入错题本，明天复习）：</div><ul class="list bk-list">'+miss.map(function(w){var c=card(w);return '<li><span class="ko" lang="ko">'+esc(w.ko)+'</span> <span class="posb">'+esc(w.pos)+'</span><br><span class="zh">'+esc(w.zh)+"</span>"+(c.mem?'<div class="mem">🧠 '+esc(c.mem)+"</div>":"")+(c.tip?'<div class="mem t">⚠️ '+esc(c.tip)+"</div>":"")+"</li>"}).join("")+"</ul>";
  h+='<div class="actions" id="bkSum"></div></div>';
  $("bkBody").innerHTML=h;
  var a=[];
  if(miss.length) a.push({t:"只练错词（"+miss.length+"）",c:"b-bad full",f:function(){startQuiz(miss,{label:"错词重练",prefer:o.prefer})}});
  a.push({t:o.daily?"回到每日计划":"回到列表",c:"b-primary full",f:function(){S=null;render()}});
  var box=$("bkSum"); box.innerHTML=a.map(function(b,i){return '<button type="button" data-i="'+i+'" class="'+b.c+'">'+b.t+"</button>"}).join("");
  box.onclick=function(e){var el=e.target.closest("button[data-i]");if(el)a[+el.getAttribute("data-i")].f()};
}

/* ---------- 入口 ---------- */
function open(o){
  o=o||{}; shell();
  if(o.tab){S=null; if(o.tab==="cat"){view.cat=o.c||null;view.grp=0;view.pos="";view.lvl=""} }
  var t=o.tab||view.tab;
  Promise.all([ensure(),ACC.load()]).then(function(){
    if(o.c&&!CAT[o.c]&&o.c!=="all"){toast("找不到这个分类");view.cat=null}
    setTab(t);
  }).catch(function(e){var b=$("bkBody");if(b)b.innerHTML='<div class="card empty">词库加载失败：'+esc(e.message)+"</div>"});
}
document.addEventListener("keydown",function(e){
  var b=$("bank"); if(!b||b.hidden||!S||!S.active||S.st==="ask") return;
  if(e.key==="Enter"&&document.activeElement.tagName!=="BUTTON"){var x=$("bkActs")&&$("bkActs").querySelector("button");if(x){e.preventDefault();x.click()}}
});
window.TopikBank={open:open,leaveOK:function(){return !(S&&S.active&&S.i>0)||confirm("正在练习，确定离开？（已答的记录会保留）")}};
})();
