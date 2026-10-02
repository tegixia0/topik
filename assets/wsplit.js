/* 写作「专注写作」分屏：题目固定在上方（可收起/可滚动/可拖动高度），作文框占剩余高度，字数和复制按钮始终可见。
   用法：WSplit.attach(cardEl,{label:"…"})；card 内需有 .wsq（题目区）和 .wsa（作答区），可选 .wsk（分屏时保留的按钮行）。
   手机上作文框获得焦点时自动进入；用 visualViewport 跟随键盘弹出后的可视高度。 */
(function(){
"use strict";
var LS="topik.wsplit.v1", cur=null, pref=load();
function load(){try{var v=JSON.parse(localStorage.getItem(LS));return v&&typeof v==="object"?v:{h:40}}catch(e){return {h:40}}}
function save(){try{localStorage.setItem(LS,JSON.stringify(pref))}catch(e){}}
function auto(){return window.matchMedia&&(matchMedia("(max-width: 820px)").matches||matchMedia("(pointer: coarse)").matches)}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function fit(){
  if(!cur) return;
  if(!cur.card.isConnected){exit();return}
  var vv=window.visualViewport, h=vv?vv.height:innerHeight, t=vv?vv.offsetTop:0;
  var s=cur.card.style; s.top=t+"px"; s.height=h+"px";
  s.setProperty("--wsqmax",Math.round(h*pref.h/100)+"px");
  clearTimeout(fit._k); fit._k=setTimeout(keep,80);
}
function keep(){   // 作答区里有多个框（51·52 的 ㉠㉡）时，把正在写的框滚到可见处
  if(!cur) return; var a=cur.card.querySelector(".wsa"), t=document.activeElement;
  if(!a||!t||!a.contains(t)) return;
  var ar=a.getBoundingClientRect(), tr=t.getBoundingClientRect();
  if(tr.top<ar.top) a.scrollTop+=tr.top-ar.top-28; else if(tr.bottom>ar.bottom) a.scrollTop+=Math.min(tr.bottom-ar.bottom+8,tr.top-ar.top-28);
}
function setH(p){pref.h=Math.max(12,Math.min(65,Math.round(p)));save();if(cur){cur.card.classList.remove("ws-col");fit();syncBar()}}
function syncBar(){
  if(!cur) return; var c=cur.card, col=c.classList.contains("ws-col");
  var t=c.querySelector(".wsbar [data-ws=tog]"); if(t) t.textContent=col?"▼ 展开题目":"▲ 收起题目";
  var z=c.querySelector(".wsbar [data-ws=size]"); if(z){z.textContent=pref.h>=36?"题目小":"题目大";z.hidden=col}
}
function enter(card){
  if(cur&&cur.card===card) return;
  if(cur) exit();
  cur={card:card,y:window.scrollY};
  card.classList.add("ws-on"); document.documentElement.classList.add("ws-lock");
  fit(); syncBar();
  var q=card.querySelector(".wsq"); if(q) q.scrollTop=0;
}
function exit(){
  if(!cur) return; var c=cur.card, y=cur.y; cur=null;
  c.classList.remove("ws-on","ws-col"); c.style.top=c.style.height="";
  document.documentElement.classList.remove("ws-lock");
  if(c.isConnected){var f=c.querySelector(".wsa");try{(f||c).scrollIntoView({block:"start"})}catch(e){window.scrollTo(0,y)}
    var ta=c.querySelector(".wsa textarea");if(ta)ta.dispatchEvent(new Event("input"))}
}
function zoom(src,alt){
  var o=document.createElement("div"); o.className="wszoom";
  o.innerHTML='<button type="button" class="wsx" aria-label="关闭">✕</button><div class="wszi"><img src="'+esc(src)+'" alt="'+esc(alt)+'"></div><div class="wszh">点图放大/缩小 · 双指可缩放 · 点 ✕ 关闭</div>';
  document.body.appendChild(o);
  o.addEventListener("click",function(e){
    if(e.target.closest(".wsx")||e.target===o){o.remove();return}
    if(e.target.tagName==="IMG") o.classList.toggle("big");
  });
}
function attach(card,o){
  if(!card) return; o=o||{};
  if(cur&&!cur.card.isConnected) exit();
  if(card._ws) return; card._ws=true;
  card.classList.add("wsplit");
  var q=card.querySelector(".wsq"), a=card.querySelector(".wsa"); if(!q||!a) return;
  var bar=document.createElement("div"); bar.className="wsbar";
  bar.innerHTML='<button type="button" data-ws="tog">▲ 收起题目</button><span class="wsl">'+esc(o.label||"题目")+'</span><button type="button" data-ws="size">题目小</button><button type="button" data-ws="exit" aria-label="退出专注写作">✕ 退出</button>';
  card.insertBefore(bar,q);
  var grip=document.createElement("div"); grip.className="wsgrip"; grip.title="拖动调整题目高度";
  q.parentNode.insertBefore(grip,q.nextSibling);
  var lab=a.querySelector(".lab");
  if(lab){var b=document.createElement("button");b.type="button";b.className="wsgo";b.setAttribute("data-ws","go");b.textContent="↕ 专注写作";lab.appendChild(b)}
  card.addEventListener("click",function(e){
    var b=e.target.closest("[data-ws]");
    if(b){var k=b.getAttribute("data-ws");
      if(k==="go"){card._wsOff=false;enter(card);var ta=a.querySelector("textarea:not([disabled])");if(ta)try{ta.focus({preventScroll:true})}catch(x){ta.focus()}}
      else if(k==="exit"){card._wsOff=true;exit()}
      else if(k==="tog"){card.classList.toggle("ws-col");syncBar();fit()}
      else if(k==="size"){setH(pref.h>=36?25:40)}
      return}
    var im=e.target.closest(".wsq img"); if(im){e.preventDefault();zoom(im.currentSrc||im.src,im.alt)}
  });
  a.addEventListener("focusin",function(e){if(e.target.tagName!=="TEXTAREA")return;if(!card._wsOff&&auto())enter(card);if(cur&&cur.card===card)setTimeout(keep,60)});
  var drag=null;
  grip.addEventListener("pointerdown",function(e){if(!cur||cur.card!==card)return;drag={y:e.clientY,h:q.getBoundingClientRect().height};try{grip.setPointerCapture(e.pointerId)}catch(x){}e.preventDefault()});
  grip.addEventListener("pointermove",function(e){if(!drag)return;var vv=window.visualViewport,H=vv?vv.height:innerHeight;card.classList.remove("ws-col");pref.h=Math.max(12,Math.min(65,(drag.h+e.clientY-drag.y)/H*100));fit();syncBar()});
  var end=function(){if(drag){drag=null;setH(pref.h)}};
  grip.addEventListener("pointerup",end); grip.addEventListener("pointercancel",end);
}
if(window.visualViewport){visualViewport.addEventListener("resize",fit);visualViewport.addEventListener("scroll",fit)}
addEventListener("resize",fit);
addEventListener("keydown",function(e){if(e.key==="Escape"&&cur){cur.card._wsOff=true;exit()}});
setInterval(function(){if(cur&&!cur.card.isConnected)exit()},800);
window.WSplit={attach:attach,enter:enter,exit:exit,active:function(){return !!cur}};
})();
