/* 老师认可的替代答案 —— 数据：accepted.json（用 tools/add_accepted.py 添加）
   所有打字闪卡共用：卡片ID（v:/w54:/wg:/gc:）、判对、「也可以写」、「📋 复制给老师」 */
(function(){
"use strict";
var DATA={cards:{}}, P=null;
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function load(force){
  if(P&&!force) return P;
  P=fetch("accepted.json?v="+Date.now(),{cache:"no-store"}).then(function(r){return r.ok?r.json():null})
    .then(function(d){DATA=d&&d.cards?d:{cards:{}}}).catch(function(){DATA={cards:{}}});
  return P;
}
function alts(id){var e=DATA.cards[id];return e&&Array.isArray(e.alts)?e.alts.filter(function(x){return x&&x.a}):[]}
/* test(input, altText) → 用各卡组自己的判分规则比较；返回命中的 {a,note} 或 null */
function find(id,input,test){var L=alts(id);for(var i=0;i<L.length;i++){try{if(test(input,L[i].a))return L[i]}catch(e){}}return null}
function okHTML(alt,std){
  return '<div class="acc-ok"><div class="acc-t">✅ 对（老师认可的写法）</div>'+
    (alt.note?'<div class="acc-n">💬 老师说明：'+esc(alt.note)+"</div>":"")+
    '<div class="acc-s">标准答案：<b lang="ko">'+esc(std)+"</b></div></div>";
}
function altsHTML(id){
  var L=alts(id); if(!L.length) return "";
  return '<div class="row acc-alts"><span class="rk k">✅ 也可以写（老师认可）</span>'+L.map(function(x){
    return '<div class="acc-a"><b lang="ko">'+esc(x.a)+"</b>"+(x.note?' <span class="acc-an">— '+esc(x.note)+"</span>":"")+"</div>"}).join("")+"</div>";
}
function text(o){
  return "【闪卡待判】卡组："+o.deck+" · 卡片ID："+o.id+"\n"+
    (o.extra?o.extra+"\n":"")+
    "中文："+o.zh+"\n标准答案："+o.ans+"\n我写的："+o.mine+"\n请帮我判断对不对，对的话加到正确答案里。";
}
function copy(o){
  var t=text(o), toast=function(m){var el=document.getElementById("toast");if(!el)return;el.textContent=m;el.classList.add("show");clearTimeout(el._h);el._h=setTimeout(function(){el.classList.remove("show")},1800)};
  var done=function(){toast("已复制，粘贴发给老师吧")};
  function fallback(){var ta=document.createElement("textarea");ta.value=t;ta.setAttribute("readonly","");ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();var ok=false;try{ok=document.execCommand("copy")}catch(e){}document.body.removeChild(ta);if(ok)done();else prompt("复制失败，请手动复制：",t)}
  if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).then(done,fallback)}else fallback();
}
var BTN="📋 复制给老师";
window.TopikAcc={load:load,alts:alts,find:find,okHTML:okHTML,altsHTML:altsHTML,text:text,copy:copy,BTN:BTN};
})();
