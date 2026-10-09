/* 动词 自动/他动/被动/使动 标签（数据：词条的 voice / pair 字段；总表 voice.json）
   中→韩 时在题目上显示「动词·他动」，帮助区分 끝나다/끝내다、열다/열리다、먹다/먹이다 这类中文意思相同的词；
   答案/详情里再显示完整说明和对应词「↔ 끝나다（自动）」。 */
(function(root){
"use strict";
var NAME={"自":"自动","他":"他动","自他":"自他两用","被动":"被动","使动":"使动"};
var LONG={"自":"自动词：不及物，不带宾语 을/를","他":"他动词：及物，带宾语 을/를","自他":"自他两用：可以带 을/를，也可以不带",
  "被动":"被动：主语是被…的一方（不带 을/를）","使动":"使动：让/使…（带宾语 을/를）"};
var VO=null, P=null;
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function load(){   // 总表：旧错题本等没有 voice 字段的卡片用它补
  if(P) return P;
  P=fetch("voice.json?v=20261009",{cache:"default"}).then(function(r){return r.ok?r.json():{}}).then(function(d){VO=d||{}},function(){VO={}});
  return P;
}
function isVerbPos(p){p=String(p||"");return !p||(/动词/.test(p)&&!/^名词/.test(p))||p==="动"||/^动/.test(p)}
function of(c){   // → {voice, pair} 或 null
  if(!c) return null;
  if(c.voice&&NAME[c.voice]) return {voice:c.voice,pair:c.pair||[]};
  var m=VO&&c.ko&&VO[c.ko];
  if(m&&m.zh&&c.zh) for(var k in m.zh){if(String(c.zh).indexOf(k)>=0){m=m.zh[k];break}}   // 同形异义词按中文意思选
  if(m&&NAME[m.voice]&&isVerbPos(c.pos)) return {voice:m.voice,pair:m.pair||[]};
  return null;
}
/* 题目上的小标签文字：「动词·他动」；不是动词就原样返回词性 */
function tagText(c,pos){var v=of(c);pos=pos==null?(c&&c.pos):pos;return v?"动词·"+NAME[v.voice]:(pos||"")}
function badge(c){var v=of(c);return v?'<span class="vcb vc-'+esc(v.voice)+'" title="'+esc(LONG[v.voice])+'">'+esc(NAME[v.voice])+"</span>":""}
function pairText(c){var v=of(c);if(!v||!v.pair||!v.pair.length)return "";
  return v.pair.map(function(p){return p.ko+"（"+(NAME[p.voice]||p.voice||"")+"）"}).join("、")}
/* 详情里的一行：[他动] 他动词：及物… ↔ 끝나다（自动） */
function rowHTML(c){
  var v=of(c); if(!v) return "";
  var h='<div class="row vc-row">'+badge(c)+' <span class="vc-long">'+esc(LONG[v.voice])+"</span>";
  if(v.pair&&v.pair.length) h+='<div class="vc-pair">↔ '+v.pair.map(function(p){return '<b lang="ko">'+esc(p.ko)+"</b>（"+esc(NAME[p.voice]||p.voice||"")+"）"}).join("　")+"</div>";
  return h+"</div>";
}
root.TopikVoice={NAME:NAME,LONG:LONG,load:load,of:of,tagText:tagText,badge:badge,rowHTML:rowHTML,pairText:pairText};
load();
})(window);
