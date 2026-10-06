/* 🤖 AI 判题（DeepSeek）—— 语法整句 gd: / 语法闪卡 gc: 本地判错时再请 AI 判一次。
   安全：API Key 只保存在用户自己浏览器的 localStorage（topik.ai.deepseek.key），浏览器直连 api.deepseek.com；
   仓库、代码、日志里都没有、也不能放任何 Key。 */
(function(){
"use strict";
var LS_KEY="topik.ai.deepseek.key", LS_ON="topik.ai.on", LS_ACC="topik.grammar.aiAccepted.v1";
var CFG={api:"https://api.deepseek.com/chat/completions",model:"deepseek-chat",timeout:20000};
function ls(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lset(k,v){try{if(v===null||v===undefined)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){}}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function getKey(){return String(ls(LS_KEY)||"").trim()}
function setKey(k){k=String(k||"").replace(/\s+/g,""); lset(LS_KEY,k||null)}
function hasKey(){return !!getKey()}
function isOn(){var v=ls(LS_ON); return v===null?true:v==="1"}
function setOn(v){lset(LS_ON,v?"1":"0")}
function active(){return hasKey()&&isOn()}
function mask(k){return k?"••••"+k.slice(-4):""}
function err(code,msg){var e=new Error(msg);e.code=code;return e}

/* ---- 请求（带 20 秒超时；错误统一成简短中文） ---- */
function call(body,key){
  key=String(key||getKey()).trim();
  if(!key) return Promise.reject(err("nokey","还没有设置 DeepSeek Key"));
  var ctl=typeof AbortController!=="undefined"?new AbortController():null, timer=null, timedOut=false;
  return new Promise(function(resolve,reject){
    timer=setTimeout(function(){timedOut=true;if(ctl)try{ctl.abort()}catch(e){}reject(err("timeout","AI 超时（"+Math.round(CFG.timeout/1000)+" 秒）"))},CFG.timeout);
    fetch(CFG.api,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},body:JSON.stringify(body),signal:ctl?ctl.signal:undefined})
      .then(function(r){
        if(r.status===401) throw err("auth","Key 无效（401）");
        if(r.status===402) throw err("balance","DeepSeek 余额不足（402）");
        if(r.status===429) throw err("rate","请求太频繁，稍后再试（429）");
        if(!r.ok) throw err("http","AI 服务出错（"+r.status+"）");
        return r.json().catch(function(){throw err("json","AI 返回格式错误")});
      })
      .then(resolve,function(e){reject(e&&e.code?e:err("net","网络错误，连不上 DeepSeek"))});
  }).then(function(d){clearTimeout(timer);return d},function(e){clearTimeout(timer);throw timedOut?err("timeout","AI 超时（"+Math.round(CFG.timeout/1000)+" 秒）"):e});
}
function contentOf(d){
  var t=d&&d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content;
  if(typeof t!=="string"||!t.trim()) throw err("json","AI 返回格式错误");
  t=t.trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"");
  try{return JSON.parse(t)}catch(e){throw err("json","AI 返回格式错误")}
}
function str(x){return typeof x==="string"?x.trim():(x==null?"":String(x))}

var SYS=[
"你是一位严格但公正的韩语老师，正在批改一位备考 TOPIK 5 级的中国学习者的韩语练习。只输出一个 JSON 对象，不要输出任何其他文字。",
"【权威依据】",
"- 「标准答案」和「其他认可答案」是正确的，它们使用的语法形式是权威的。「目标语法说明」（形式、接法、限制、常见错误）是这个语法固定的规则。",
"- 绝对不要把学生答案往与标准答案语法形式不同的方向“改正”。例如标准答案用 -는 바람에，就绝不能建议 -은 바람에 / -ㄴ 바람에；凡是学生答案中与标准答案（或认可答案）相同的形式，都不是错误。",
"【判为正确】",
"- 学生答案与标准答案只有同义或等价的差别时，correct=true。例如：안 V 与 V-지 않다（안 울리는 = 울리지 않는）；同义词（下雨用 오다 / 내리다）；口语中可以接受的助词省略；句末语体不同（-다体 / -요体 / 반말 / -ㅂ니다体）；标点符号不同。",
"- 使用了目标语法或功能等价、符合「目标语法说明」规则的语法，也算使用了目标语法。",
"【判为错误】只有出现真正的错误时才 correct=false：",
"- 语法错误（包括违反目标语法的接法/限制）、助词错误（特别是宾语用了 이/가 而不是 을/를）、拼写错误、时态错误、意思与中文不符、用词错误、缺少目标语法、句子不完整。",
"- errors 里每一条的 wrong 必须是从学生答案中原样摘出的具体片段（逐字照抄）。如果你指不出学生答案里的具体错误片段，就必须 correct=true、errors=[]。",
"- minor=true 表示答案正确、只有띄어쓰기（空格）问题；其他情况 minor=false。",
"输出 JSON 格式：",
'{"correct": true 或 false, "minor": true 或 false, "errors": [{"wrong": "从学生答案原样摘出的错误片段", "right": "正确写法", "why": "简体中文解释"}], "corrected": "在学生答案基础上做最小修改后的正确韩语", "tip": "📌 一条简短的中文规则提示"}',
"- errors 只列真正的问题；完全正确时为 []（minor 时列出空格问题）。",
"- corrected 尽量保留学生原来的用词和结构，只改真正的错误，改法要和标准答案的语法形式一致；已经正确就原样给出。",
"- why 和 tip 一律用简体中文。"
].join("\n");
var TYPE={
  sent:"整句翻译：把中文翻成完整的韩语句子",
  fill:"句子填空：学生只写了＿＿处的部分。请把学生答案填回句子后整体判断；corrected 只给＿＿处应填的内容",
  zh2ko:"写语法形式：根据中文意思写出对应的韩语语法形式（如 -는 바람에）。判断是否为同一语法或功能等价、适合这个中文意思的语法"
};
/* p: {type, zh, sentence?, std, accepted[], grammar?, grammarInfo?, user} → {correct, minor, errors[], corrected, tip} */
function judge(p){
  var u={"题型":TYPE[p.type]||p.type,"中文":p.zh,"题目句子（含空格）":p.sentence||undefined,"标准答案":p.std,
    "其他认可答案":(p.accepted&&p.accepted.length)?p.accepted:undefined,"目标语法":p.grammar||undefined,"目标语法说明":p.grammarInfo||undefined,"学生答案":p.user};
  return call({model:CFG.model,temperature:0,max_tokens:800,stream:false,response_format:{type:"json_object"},
    messages:[{role:"system",content:SYS},{role:"user",content:JSON.stringify(u)}]}).then(function(d){
    var o=contentOf(d);
    if(!o||typeof o!=="object"||typeof o.correct!=="boolean") throw err("json","AI 返回格式错误");
    var errors=Array.isArray(o.errors)?o.errors.filter(function(x){return x&&typeof x==="object"}).slice(0,8).map(function(x){return {wrong:str(x.wrong),right:str(x.right),why:str(x.why)}}):[];
    return {correct:o.correct,minor:o.minor===true,errors:errors,corrected:str(o.corrected),tip:str(o.tip)};
  });
}
function test(key){
  return call({model:CFG.model,temperature:0,max_tokens:20,stream:false,response_format:{type:"json_object"},
    messages:[{role:"user",content:'Reply with the JSON object {"ok": true} only.'}]},key).then(function(d){
    if(!d||!d.choices) throw err("json","AI 返回格式错误"); return true;
  });
}

/* ---- AI 判对后本机记住的写法（只在这台设备） ---- */
function accLoad(){try{var v=JSON.parse(ls(LS_ACC));return v&&typeof v==="object"?v:{}}catch(e){return {}}}
function accList(id){var L=accLoad()[id];return Array.isArray(L)?L.filter(function(x){return x&&x.a}):[]}
function accAdd(id,a,note){
  a=String(a||"").trim(); if(!id||!a) return;
  var d=accLoad(), L=Array.isArray(d[id])?d[id]:(d[id]=[]);
  if(!L.some(function(x){return x&&x.a===a})) L.push({a:a,at:Date.now(),note:note||""});
  lset(LS_ACC,JSON.stringify(d));
}
function accCount(){var d=accLoad(),n=0;Object.keys(d).forEach(function(k){if(Array.isArray(d[k]))n+=d[k].length});return n}
function accClear(){lset(LS_ACC,null)}

/* ---- ⚙️ 设置面板（底部弹出） ---- */
function openSettings(onClose){
  closeSettings();
  var back=document.createElement("div"); back.className="ai-back"; back.id="aiBack";
  var el=document.createElement("div"); el.className="ai-sheet"; el.id="aiSheet"; el.setAttribute("role","dialog"); el.setAttribute("aria-label","AI 判题设置");
  function state(){var k=getKey();return k?"已保存 Key："+mask(k)+(isOn()?" · AI 判题已开启":" · AI 判题已关闭"):"还没有保存 Key（不设置也能正常练习）"}
  el.innerHTML='<h3>⚙️ AI 判题设置（DeepSeek）</h3>'+
    '<p class="minfo">本地判错时，自动请 DeepSeek 再判一次（语法整句 / 语法闪卡）。<b>Key 只保存在这台设备的浏览器里</b>（localStorage），不会上传到网站或仓库；请求直接从浏览器发到 api.deepseek.com，费用记在你的 DeepSeek 账户。</p>'+
    '<label class="lb" for="aiKey">DeepSeek API Key</label>'+
    '<input id="aiKey" type="password" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="'+(hasKey()?"已保存（留空 = 不修改）":"粘贴 DeepSeek API Key")+'">'+
    '<div class="minfo" id="aiState">'+esc(state())+'</div>'+
    '<label class="ai-tog"><input type="checkbox" id="aiOn"'+(isOn()?" checked":"")+'> 开启 AI 判题</label>'+
    '<div class="racts"><button type="button" class="gbtn pri" data-ai="save">保存</button><button type="button" class="gbtn" data-ai="test">测试</button><button type="button" class="gbtn" data-ai="clear">清除 Key</button><button type="button" class="gbtn" data-ai="close">关闭</button></div>'+
    '<div class="ai-msg" id="aiMsg" aria-live="polite"></div>'+
    '<div class="minfo ai-acc">AI 判对后本机记住的写法：<b id="aiAccN">'+accCount()+'</b> 条 <button type="button" class="gbtn ai-mini" data-ai="clearacc">清空</button></div>'+
    '<div class="minfo">没有 Key：在 platform.deepseek.com 创建一个，粘贴到上面，保存后点「测试」。</div>';
  document.body.appendChild(back); document.body.appendChild(el);
  var inp=el.querySelector("#aiKey"), msg=el.querySelector("#aiMsg");
  function say(t,cls){msg.textContent=t;msg.className="ai-msg"+(cls?" "+cls:"")}
  function refresh(){el.querySelector("#aiState").textContent=state();inp.placeholder=hasKey()?"已保存（留空 = 不修改）":"粘贴 DeepSeek API Key"}
  function close(){closeSettings(); if(onClose) onClose()}
  back.onclick=close;
  el.querySelector("#aiOn").onchange=function(){setOn(this.checked);refresh();say(this.checked?"已开启 AI 判题":"已关闭 AI 判题","ok")};
  el.onclick=function(e){
    var b=e.target.closest("button[data-ai]"); if(!b) return; var a=b.getAttribute("data-ai");
    if(a==="close") close();
    else if(a==="save"){var v=inp.value.trim(); if(v) setKey(v); setOn(el.querySelector("#aiOn").checked); inp.value=""; refresh(); say(hasKey()?"已保存（只存在本机）":"还没有输入 Key",hasKey()?"ok":"bad")}
    else if(a==="clear"){setKey(""); inp.value=""; refresh(); say("已清除本机保存的 Key","ok")}
    else if(a==="clearacc"){if(confirm("清空 AI 判对后记住的写法？")){accClear();el.querySelector("#aiAccN").textContent="0";say("已清空","ok")}}
    else if(a==="test"){
      var k=inp.value.trim()||getKey(); if(!k){say("先输入 Key","bad");return}
      b.disabled=true; say("测试中…","");
      test(k).then(function(){say("✅ 连接成功（"+CFG.model+"）"+(inp.value.trim()?" · 记得点「保存」":""),"ok")},function(e){say("❌ "+(e&&e.message||"测试失败"),"bad")}).then(function(){b.disabled=false});
    }
  };
  el._esc=function(e){if(e.key==="Escape")close()}; document.addEventListener("keydown",el._esc);
  setTimeout(function(){try{inp.focus()}catch(e){}},50);
}
function closeSettings(){
  var el=document.getElementById("aiSheet"), back=document.getElementById("aiBack");
  if(el){if(el._esc)document.removeEventListener("keydown",el._esc);el.remove()} if(back) back.remove();
}

window.TopikAI={CFG:CFG,getKey:getKey,setKey:setKey,hasKey:hasKey,isOn:isOn,setOn:setOn,active:active,
  judge:judge,test:test,accList:accList,accAdd:accAdd,accCount:accCount,accClear:accClear,
  openSettings:openSettings,closeSettings:closeSettings};
})();
