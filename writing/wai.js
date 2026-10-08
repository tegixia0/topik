/* 写作 🤖 AI 评分（DeepSeek）—— 51·52 句子填空 / 53·54 作文。
   Key、开关、设置面板、请求、超时、错误处理都用共用模块 assets/ai.js（window.TopikAI，同一个 localStorage Key）。
   AI 批改记录只存在本机 localStorage：51·52 → topik.writing.ai.v1，53·54 → topik.w54.ai.v1；
   和老师的 writing/mylog.json / writing/essaylog.json 记录一起显示，标「🤖 AI」。AI 输出一律按纯文本转义后显示。
   53·54 配分（TOPIK 官方 쓰기 채점 기준）：53 = 内容及任务完成 7 + 文章结构 7 + 语言使用 16 = 30；
                                         54 = 内容及任务完成 12 + 文章结构 12 + 语言使用 26 = 50。 */
(function(){
"use strict";
var LS51="topik.writing.ai.v1", LS54="topik.w54.ai.v1";
var SPLIT={53:{content:7,structure:7,language:16,total:30},54:{content:12,structure:12,language:26,total:50}};
var CAT={content:"内容及任务完成",structure:"文章结构",language:"语言使用"};
var CFG={to51:45000,to54:90000};   // 超时（毫秒）：51·52 两句 45 秒，53·54 作文 90 秒

function AI(){return window.TopikAI||null}
function active(){var A=AI();return !!(A&&A.active())}
function hasKey(){var A=AI();return !!(A&&A.hasKey())}
function isOn(){var A=AI();return !!(A&&A.isOn())}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function str(x){return typeof x==="string"?x.trim():(x==null||typeof x==="object"?"":String(x).trim())}
function arr(x){return Array.isArray(x)?x:(x==null||x===""?[]:[x])}
function uniq(a){var o=[];a.forEach(function(x){if(x&&o.indexOf(x)<0)o.push(x)});return o}
function squash(s){return String(s==null?"":s).normalize("NFC").toLowerCase().replace(/[\s\u00a0\u3000]+/g,"").replace(/[\p{P}\p{S}]/gu,"")}
function inText(frag,text){var f=squash(frag);return !!f&&squash(text).indexOf(f)>=0}
function clamp(x,lo,hi){var n=typeof x==="number"?x:parseFloat(String(x==null?"":x).replace(/[^\d.\-]/g,""));if(!isFinite(n))return null;n=Math.round(n*2)/2;return Math.max(lo,Math.min(hi,n))}
function pin(s){s=str(s);return !s?"":(/^📌/.test(s)?s:"📌 "+s)}
function today(){var d=new Date();return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2)}
function hm(t){var d=new Date(t);return isFinite(d)?("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2):""}
function lsGet(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v&&typeof v==="object"?v:d}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function err(code,msg){var A=AI();if(A&&A.err)return A.err(code,msg);var e=new Error(msg);e.code=code;return e}
function call(sys,user,o){var A=AI();if(!A||!A.chatJSON)return Promise.reject(err("nokey","AI 模块没有加载"));return A.chatJSON(sys,user,o)}

/* ================= 51·52 ================= */
function sys5152(types){
  var list=Object.keys(types||{}).map(function(id){return id+"="+((types[id]||{}).name||id)}).join("；");
  return [
"你是一位严格但公正的 TOPIK II 写作阅卷老师，正在给备考 TOPIK 5 级的中国学习者批改第 51 / 52 题（在 ㉠、㉡ 处各填一句）。只输出一个 JSON 对象，不要输出任何其他文字。",
"【这不是比对任务】参考答案只是其中一种写法。只要学生写的句子本身正确、自然、符合题意并与空格前后的句子衔接，就给满分；用词、句型和参考答案不同绝不扣分。",
"【评分：TOPIK 标准，每个空 5 分，共 10 分】",
"- 5 分：内容恰当、与上下文衔接，语法、拼写、띄어쓰기、语体都正确。",
"- 3 分左右（3–4）：意思对，但有语法/拼写/띄어쓰기错误（只有很小的拼写或分写问题可给 4 分）。",
"- 1–2 分：只部分符合（内容不完整、只写对一半、与上下文衔接不好）。",
"- 0 分：没写，或意思不对、和上下文无关。",
"【检查】语法、拼写、띄어쓰기、上下文衔接：答案必须接得上空格前面和后面的句子（空格后面是理由、请求、提问、结果时要相应地写）。",
"【语体】51（实用文：邮件/通知/留言等）：用 -습니다/-ㅂ니다 正式体，需要时用敬语——写信人为读者做事用 드리다（알려 드리겠습니다、드리려고 합니다），读者的动作加 -시-（오시면、주시기 바랍니다）。52（说明文）：用 -다 体（-ㄴ/는다、-았/었다、-(으)ㄹ 것이다），不用 저/제/나/내。",
"【errors】每一条的 wrong 必须是从学生答案里原样照抄的片段；right 是改正后的写法；why 用简体中文简短说明。指不出学生答案里的具体片段，就不要列这条错误。满分的空 errors=[]。",
"【corrected】在学生答案的基础上做最小修改得到的正确句子（满分时照抄学生答案）。不要换成参考答案。",
"【tags】每个空从下面的错误类型 id 里选（可多选；满分或没有合适的就 []），只能用这些 id："+list,
"【tip】一条最重要、最能帮学生下次避免错误的规则，简体中文，以「📌」开头。",
"输出格式：{\"a\":{\"score\":0-5,\"correct\":true或false,\"errors\":[{\"wrong\":\"\",\"right\":\"\",\"why\":\"\"}],\"corrected\":\"\",\"tags\":[\"id\"]},\"b\":{同上},\"total\":0-10,\"tip\":\"📌 …\"}",
"a 是 ㉠，b 是 ㉡。correct=true 表示这个空拿满分 5 分。没写的空 score=0。"
  ].join("\n");
}
function payload5152(q,ans){
  var A=(q.ans&&q.ans.a)||[], B=(q.ans&&q.ans.b)||[], alt=q.alt||{};
  return {
    "题号":q.no,
    "题型":q.no===51?"51 实用文（邮件/通知/留言等，-습니다 正式体，注意敬语）":"52 说明文（-다 体，不用 저/제）",
    "标题":q.title||undefined,
    "原文（( ㉠ )、( ㉡ ) 是空格）":q.text,
    "中文翻译":q.zh||undefined,
    "参考答案":{"㉠":A.concat(alt.a||[]),"㉡":B.concat(alt.b||[])},
    "参考答案说明":q.ansType==="official"?"官方答案（只是其中一种写法）":"非官方参考答案（只是其中一种写法）",
    "学生答案":{"㉠":ans.a||"（没写）","㉡":ans.b||"（没写）"}
  };
}
function blank(r,ans,types){
  r=r&&typeof r==="object"?r:{};
  var a=str(ans), names={};
  Object.keys(types||{}).forEach(function(id){names[(types[id]||{}).name]=id});
  var errs=arr(r.errors).filter(function(e){return e&&typeof e==="object"}).map(function(e){return {wrong:str(e.wrong),right:str(e.right),why:str(e.why||e["错因"]||e.cause)}})
    .filter(function(e){return e.wrong&&e.wrong!==e.right&&inText(e.wrong,a)}).slice(0,8);
  var sc=clamp(r.score,0,5); if(sc===null) sc=r.correct===true?5:0;
  if(!a) sc=0;
  var ok=!!a&&sc>=5;
  var tags=ok?[]:uniq(arr(r.tags).map(function(t){t=str(t);return types&&types[t]?t:(names[t]||"")}));
  return {score:sc,correct:ok,errors:ok?[]:errs,corrected:str(r.corrected),tags:tags};
}
function grade5152(q,ans,types){
  ans={a:str(ans&&ans.a),b:str(ans&&ans.b)};
  if(!ans.a&&!ans.b) return Promise.reject(err("empty","两个空都还没写"));
  return call(sys5152(types),payload5152(q,ans),{timeout:CFG.to51,maxTokens:1500}).then(function(x){
    if(!x||typeof x!=="object"||(!x.a&&!x.b&&!x["㉠"]&&!x["㉡"])) throw err("json","AI 返回格式错误");
    var a=blank(x.a||x["㉠"],ans.a,types), b=blank(x.b||x["㉡"],ans.b,types);
    return {a:a,b:b,total:a.score+b.score,tip:pin(x.tip),ans:ans,at:Date.now()};
  });
}
/* 记录：每次 AI 评分存两条（㉠/㉡），格式和 mylog.json 的 entries 一样，再加 ai:true / score / errs / at */
function list51(){var d=lsGet(LS51,{entries:[]});return Array.isArray(d.entries)?d.entries.filter(function(e){return e&&e.q&&e.k}):[]}
function save51(q,res){
  var L=list51(), date=today();
  ["a","b"].forEach(function(k){
    var r=res[k], n=L.filter(function(e){return e.q===q.id&&e.k===k}).length;
    L.push({q:q.id,k:k,try:n+1,date:date,at:res.at,ai:true,ok:r.correct,score:r.score,ans:res.ans[k],
      cause:r.errors.map(function(e){return e.why?e.wrong+" → "+e.right+"："+e.why:e.wrong+" → "+e.right}).join("；"),
      fix:r.correct?"":r.corrected,errs:r.errors,tags:r.tags,tip:res.tip});
  });
  if(L.length>800) L=L.slice(L.length-800);
  lsSet(LS51,{v:1,entries:L});
}
function html5152(res,types){
  var tn=function(t){return ((types||{})[t]||{}).name||t};
  var h='<div class="gai wai '+(res.total>=10?"ok":"bad")+'"><div class="gai-t">🤖 AI 评分：'+res.total+"/10</div>";
  ["a","b"].forEach(function(k){
    var r=res[k], L=k==="a"?"㉠":"㉡";
    h+='<div class="wai-b"><div class="wai-bh">'+L+' <b>'+r.score+'</b>/5 '+(r.correct?'<span class="wai-ok">✓ 满分</span>':(res.ans[k]?'<span class="wai-x">✗</span>':'<span class="wai-x">（没写）</span>'))+"</div>";
    if(r.errors.length) h+='<ul class="gai-err">'+r.errors.map(function(e){return '<li><span class="w" lang="ko">'+esc(e.wrong)+'</span> → <span class="r" lang="ko">'+esc(e.right)+"</span>"+(e.why?'<div class="why">'+esc(e.why)+"</div>":"")+"</li>"}).join("")+"</ul>";
    if(!r.correct&&r.corrected) h+='<div class="gai-fix">✅ 改正：<b lang="ko">'+esc(r.corrected)+"</b></div>";
    if(r.tags.length) h+="<div>"+r.tags.map(function(t){return '<span class="mlchip">'+esc(tn(t))+"</span>"}).join("")+"</div>";
    h+="</div>";
  });
  if(res.tip) h+='<div class="gai-tip">'+esc(res.tip)+"</div>";
  return h+'<div class="wai-note">AI 评分仅供参考 · 已记入本机「🤖 AI」批改记录</div></div>';
}
function copy5152(res,types){
  var tn=function(t){return ((types||{})[t]||{}).name||t};
  var t="\n🤖 AI 评分（DeepSeek，仅供参考）："+res.total+"/10";
  ["a","b"].forEach(function(k){var r=res[k];
    t+="\n"+(k==="a"?"㉠":"㉡")+" "+r.score+"/5"+(r.correct?" ✓":"");
    r.errors.forEach(function(e){t+="\n  · "+e.wrong+" → "+e.right+(e.why?"（"+e.why+"）":"")});
    if(!r.correct&&r.corrected) t+="\n  AI 改正："+r.corrected;
    if(r.tags.length) t+="\n  类型："+r.tags.map(tn).join("、");
  });
  if(res.tip) t+="\nAI 提示："+res.tip;
  return t;
}

/* ================= 53·54 ================= */
function sys5354(tags){
  return [
"你是一位严格但公正的 TOPIK II 写作阅卷老师，按 TOPIK 官方评分标准批改中国学习者（目标 5 级）的第 53 / 54 题作文。只输出一个 JSON 对象，不要输出任何其他文字。",
"【配分（官方）】",
"53（30 分）：content 内容及任务完成 0–7，structure 文章结构 0–7，language 语言使用 0–16。",
"54（50 分）：content 内容及任务完成 0–12，structure 文章结构 0–12，language 语言使用 0–26。",
"score = content + structure + language。按真实 TOPIK 阅卷水平给分，不要因为是学习者就放宽。",
"【要求】",
"- 全文必须用 -다 体（-ㄴ/는다、-았/었다、-(으)ㄹ 것이다），不用 저/제/나/내，不用 -아요/-어요/-습니다，不用口语形式（근데、되게、너무 많이 같은）。",
"- 字数：53 要 200–300 字，54 要 600–700 字（含空格）。「字数」由系统计算，以它为准；不足或超出要在 content 里扣分并在 summary 里说明。",
"- 53：必须根据题目给出的图表/资料准确描述，数字、年份、单位、增减、比较都要和题目数据一致，不能编造或写错；开头交代调查/资料的主题。题目没有要求时不要写个人意见。",
"- 54：必须逐一回答题目里的每个小问题（通常一个问题一段），有 서론–본론–결론 的结构，论点前后一致。",
"- 不是比对任务：参考范文只是参考，学生用不同的表达、观点和结构，只要正确、得体、切题就不扣分。",
"- 重点检查这些常见错误：形容词/이다 错加 -ㄴ다（필요한다 ✗ → 필요하다，다른다 ✗ → 다르다）；宾语用了 이/가（应为 을/를）；拼写；书面作文里用口语形式；에 따라（根据/随着）与 에 따르면（据…显示）混用；时态；搭配；띄어쓰기。",
"【errors】按在作文中出现的顺序列出主要错误（最多 25 条）。每条 wrong 必须是从学生作文里原样照抄的片段（逐字，不要改动，也不要加省略号）；right 是改正；错因 用简体中文；tag 只能从这些标签里选一个："+tags.join("、")+"（实在没有合适的写「其他」）。",
"【rewrite】保留学生原来的观点、内容和段落结构，只改正错误、让表达更自然的完整作文（韩语，-다 体，字数符合要求）。",
"【rules】2–5 条学生下次一定要记住的规则，简体中文，每条以「📌」开头。",
"【summary】简体中文总评 2–4 句：哪里好、哪里扣分最多、下一步怎么提高。",
"【level_estimate】按这篇作文估计的 TOPIK 写作水平，例如「4级」「5级下限」。",
"输出格式：{\"score\":0,\"breakdown\":{\"content\":0,\"structure\":0,\"language\":0},\"level_estimate\":\"\",\"errors\":[{\"wrong\":\"\",\"right\":\"\",\"错因\":\"\",\"tag\":\"\"}],\"rewrite\":\"\",\"rules\":[\"📌 …\"],\"summary\":\"\"}"
  ].join("\n");
}
function payload5354(q,essay,n,chart){
  var L=q.no===53?"200–300":"600–700";
  return {
    "题号":q.no,"回次":"第"+q.round+"回",
    "题型":q.no===53?"53 图表/资料说明文（30 分，"+L+" 字）":"54 议论文（50 分，"+L+" 字）",
    "题目":q.ins,"题目材料":q.box||undefined,
    "必须回答的小问题":q.qs&&q.qs.length?q.qs:undefined,
    "图表数据（文字版，以此为准）":chart||undefined,
    "官方评分要点":q.grading&&q.grading.length?q.grading:undefined,
    "参考范文（只是参考，不是唯一答案）":q.model&&q.model.length?q.model.join("\n"):undefined,
    "字数要求":L+" 字（含空格）",
    "字数（系统计算，含空格和标点、不含换行）":n,
    "学生作文":essay
  };
}
function grade5354(q,essay,o){
  o=o||{}; essay=String(essay||"").trim();
  var no=+q.no===54?54:53, S=SPLIT[no], tags=uniq((o.tags||[]).concat(["其他"]));
  if(!essay) return Promise.reject(err("empty","作文还是空的"));
  var n=o.count!=null?o.count:essay.replace(/\r?\n/g,"").length;
  return call(sys5354(tags),payload5354(q,essay,n,o.chart),{timeout:CFG.to54,maxTokens:6000}).then(function(x){
    if(!x||typeof x!=="object") throw err("json","AI 返回格式错误");
    var b=x.breakdown&&typeof x.breakdown==="object"?x.breakdown:{}, bd={}, okb=true;
    Object.keys(CAT).forEach(function(k){var v=clamp(b[k]!=null?b[k]:b[CAT[k]],0,S[k]);if(v===null)okb=false;bd[k]=v});
    var sc=okb?bd.content+bd.structure+bd.language:clamp(x.score,0,S.total);
    if(sc===null) throw err("json","AI 返回格式错误（没有分数）");
    var errors=arr(x.errors).filter(function(e){return e&&typeof e==="object"}).map(function(e){
      var t=str(e.tag||(Array.isArray(e.tags)?e.tags[0]:e.tags)); if(tags.indexOf(t)<0) t="其他";
      return {wrong:str(e.wrong),right:str(e.right),cause:str(e["错因"]||e.cause||e.why),tags:[t]};
    }).filter(function(e){return e.wrong&&e.wrong!==e.right&&inText(e.wrong,essay)}).slice(0,30);   // 只留能在作文里原样找到、且确实有改动的
    return {no:no,score:sc,total:S.total,breakdown:okb?bd:null,level:str(x.level_estimate).slice(0,40),errors:errors,
      rewrite:str(x.rewrite),rules:arr(x.rules).map(pin).filter(Boolean).slice(0,8),summary:str(x.summary),essay:essay,n:n,at:Date.now()};
  });
}
/* 记录：格式和 essaylog.json 的 attempts 一样（date/try/score/essay/errors/rewrite/rules），再加 ai:true / at / breakdown / level / summary */
function all54(){var d=lsGet(LS54,{attempts:{}});return d.attempts&&typeof d.attempts==="object"?d.attempts:{}}
function list54(id){var L=all54()[id];return Array.isArray(L)?L.filter(function(a){return a&&a.essay}):[]}
function save54(q,res){
  var d=all54(), L=Array.isArray(d[q.id])?d[q.id]:(d[q.id]=[]);
  var att={ai:true,at:res.at,date:today(),try:L.length+1,score:res.score+"/"+res.total,essay:res.essay,n:res.n,errors:res.errors,rewrite:res.rewrite,rules:res.rules,
    breakdown:res.breakdown,level:res.level,summary:res.summary};
  L.push(att); if(L.length>40) d[q.id]=L.slice(L.length-40);
  if(!lsSet(LS54,{v:1,attempts:d})){   // 空间不够：去掉最旧的几篇再存
    Object.keys(d).forEach(function(k){if(d[k].length>5)d[k]=d[k].slice(-5)}); lsSet(LS54,{v:1,attempts:d});
  }
  return att;
}
function bdHTML(bd,no){
  var S=SPLIT[no]; if(!bd) return "";
  return '<div class="wai-bd">'+Object.keys(CAT).map(function(k){var v=bd[k],m=S[k];
    return '<div class="wai-row"><span class="lb">'+CAT[k]+'</span><span class="bar"><i style="width:'+Math.round(v/m*100)+'%"></i></span><span class="v"><b>'+v+"</b>/"+m+"</span></div>"}).join("")+"</div>";
}
function html5354(res){
  var h='<div class="gai wai wai54"><div class="gai-t">🤖 AI 评分：<b class="big">'+res.score+"</b>/"+res.total+(res.level?' <span class="wai-lv">预估 '+esc(res.level)+"</span>":"")+"</div>";
  h+=bdHTML(res.breakdown,res.no);
  h+='<div class="wai-cnt">字数 '+res.n+"（"+(res.no===53?"200–300":"600–700")+"）</div>";
  if(res.summary) h+='<div class="wai-sum">'+esc(res.summary)+"</div>";
  if(res.errors.length) h+='<div class="ah">❌ 错误（'+res.errors.length+' 处）</div><ul class="w54errs">'+res.errors.map(function(e){
    return '<li><div lang="ko"><span class="x">'+esc(e.wrong)+'</span> → <span class="o">'+esc(e.right)+"</span></div>"+(e.cause?'<div class="c">'+esc(e.cause)+"</div>":"")+'<div><span class="mlchip">'+esc(e.tags[0])+"</span></div></li>"}).join("")+"</ul>";
  if(res.rewrite) h+='<details class="wai-rw"><summary>✅ AI 改写示范（点开）</summary><div class="w54rw" lang="ko">'+esc(res.rewrite)+"</div></details>";
  if(res.rules.length) h+='<div class="ah">📌 要记住的规则</div><ul class="w54chk">'+res.rules.map(function(x){return "<li>"+esc(x)+"</li>"}).join("")+"</ul>";
  return h+'<div class="wai-note">AI 评分仅供参考 · 已记入「📚 我之前的作文」（🤖 AI，只存在本机）</div></div>';
}
function copy5354(res){
  var t="\n\n🤖 AI 评分（DeepSeek，仅供参考）："+res.score+"/"+res.total+(res.level?"（预估 "+res.level+"）":"");
  if(res.breakdown) t+="\n"+Object.keys(CAT).map(function(k){return CAT[k]+" "+res.breakdown[k]+"/"+SPLIT[res.no][k]}).join(" · ");
  if(res.summary) t+="\nAI 总评："+res.summary;
  if(res.errors.length) t+="\nAI 指出的错误：\n"+res.errors.map(function(e){return "· "+e.wrong+" → "+e.right+(e.cause?"（"+e.cause+"）":"")}).join("\n");
  return t;
}

/* ================= 共用 UI ================= */
function waitHTML(msg){return '<div class="gai wait">🤖 '+esc(msg||"AI 评分中…")+"</div>"}
function errHTML(e){
  var c=e&&e.code, set=c==="auth"||c==="nokey"||c==="balance";
  return '<div class="gai err">🤖 AI 评分失败：'+esc(e&&e.message||"出错了")+"。照常看参考答案、复制给老师即可。"+
    '<div class="gai-hint"><button type="button" class="gbtn" data-wai="retry">↻ 重试</button>'+(set?'<button type="button" class="gbtn" data-wai="set">⚙️ AI 判题设置</button>':"")+"</div></div>";
}
function hintHTML(){
  if(!AI()) return "";
  if(!hasKey()) return '<div class="gai-hint wai-hint">设置 DeepSeek Key 可开启 AI 评分 <button type="button" class="gbtn" data-wai="set">⚙️ 设置</button></div>';
  if(!isOn()) return '<div class="gai-hint wai-hint">AI 评分已关闭 <button type="button" class="gbtn" data-wai="set">⚙️ 开启</button></div>';
  return "";
}
function status(){return !AI()?"":(!hasKey()?"未设置 Key":(isOn()?"已开启":"已关闭"))}
function openSettings(){var A=AI();if(A)A.openSettings()}

window.TopikWAI={SPLIT:SPLIT,CAT:CAT,CFG:CFG,active:active,hasKey:hasKey,isOn:isOn,status:status,openSettings:openSettings,
  grade5152:grade5152,save51:save51,list51:list51,html5152:html5152,copy5152:copy5152,sys5152:sys5152,
  grade5354:grade5354,save54:save54,list54:list54,all54:all54,html5354:html5354,copy5354:copy5354,bdHTML:bdHTML,sys5354:sys5354,
  waitHTML:waitHTML,errHTML:errHTML,hintHTML:hintHTML,hm:hm,squash:squash};
})();
