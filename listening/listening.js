/* TOPIK II 🎧 听力：攻略 + 真题练习 —— 数据：listening/data.json（tools/build_listening.py 生成）
   官方来源：topik.go.kr 公开的第96回、第83回 TOPIK II 듣기（题目 / 正答 / 듣기 대본 / MP3）；中文翻译与解析为本站自写。
   进度：localStorage "topik.listening.v1" = {a:{题id:{c:所选,ok,t}}, w:{题id:{n:错次数,c:最近所选,last:时间,tag:错因}}}（☁️ assets/sync.js 同步） */
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var LS="topik.listening.v1", LS_OPT="topik.listening.opt.v1";
var D=null, Q=[], byId={}, SETS={}, TY={}, root=null, NUM=["①","②","③","④"];
var st=load(LS,{a:{},w:{}}), opt=load(LS_OPT,{tab:"guide",round:"96",type:"idea",seq:"round",cur:null,view:"list",rate:1});
st.a=st.a||{}; st.w=st.w||{};
function load(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v&&typeof v==="object"?v:d}catch(e){return d}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
window.addEventListener("topik-sync",function(){st=load(LS,{a:{},w:{}});st.a=st.a||{};st.w=st.w||{};if(root&&!root.hidden&&D&&opt.view!=="q")setTab(opt.tab,true)});
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function br(s){return esc(s).replace(/\n/g,"<br>")}
function toast(m){var t=$("toast");if(!t){alert(m);return}t.textContent=m;t.classList.add("show");clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove("show")},1800)}
var TAGS={wd:"单词没听懂",turn:"没抓住转折",para:"没认出同义改写",ear:"语速快/没听清"};
/* ---------- 攻略标签 ---------- */
var ST={
 preread:"听前先读选项",pic:"看图 / 图表题",next:"接下一句（4–8）",act:"接下来做什么（9–12）",
 detail:"内容一致：细节偷换",para:"同义改写 vs 原词照搬",extreme:"极端词 / 限定词",opinion:"观点句＝中心思想",
 attitude:"态度 / 说话方式词",pair2:"两题互相印证",signal:"信号词",before:"39 题：对话之前",manner:"说话方式题"
};
function exLinks(tag,max,prefer){
  var ids=(prefer||[]).slice(); Q.forEach(function(q){if(q.st.indexOf(tag)>=0&&ids.indexOf(q.id)<0)ids.push(q.id)});
  ids=ids.slice(0,max||8);
  return ids.length?'<div class="lexs">真题例子：'+ids.map(qLink).join("")+'</div>':"";
}
function qLink(id){var q=byId[id];if(!q)return "";return '<button type="button" class="lex'+(st.w[id]?" bad":st.a[id]?" ok":"")+'" data-go="'+id+'">'+q.round+'回 '+q.n+'题</button>'}
function L(id,txt){return '<a href="#" class="lq" data-go="'+id+'">'+(txt||id.replace("-","回 ")+"题")+'</a>'}
/* ---------- 攻略正文 ---------- */
function guideHTML(){
  var h='';
  h+='<div class="card tipc lg-toc"><h3>🎧 TOPIK II 听力攻略</h3><p class="minfo" style="margin:0 0 6px">每条技巧都配了真题例子（第96回 / 第83回官方真题），点一下直接去听、去做。</p><div class="lg-toclist">'+
     [["lg-facts","考试概况"],["lg-types","各题号怎么做"],["lg-guess","没听懂时怎么选"],["lg-signal","信号词"],["lg-daily","每天怎么练"]].map(function(x){return '<a href="#'+x[0]+'" data-jump="'+x[0]+'">'+x[1]+'</a>'}).join("")+'</div></div>';

  h+='<div class="card tipc" id="lg-facts"><h3>① 考试概况（按官方真题核对过）</h3><table class="ltbl">'+
   '<tr><td>题量 / 时间</td><td><b>50 题，约 60 分钟</b>（第1节 1교시 前半；后面接写作）。每题 2 分，满分 100。</td></tr>'+
   '<tr><td>放几遍</td><td><b>1–20 题每段只放一遍</b>（广播说“한 번 읽겠습니다”）；<b>21–50 题一段话对应两道题，放两遍</b>（“두 번 읽겠습니다 … 다시 들으십시오”）。所以不是“全部只放一遍”。</td></tr>'+
   '<tr><td>题间空隙</td><td>两题之间只有十秒左右：<b>上一题一选完，立刻读下一题的选项</b>，别回头纠结。</td></tr>'+
   '<tr><td>题型比例</td><td>“들은 내용과 같은 것（内容一致）”一套卷里有 <b>17 题</b>（13–16 + 21–50 里的偶数题等），“중심 생각/중심 내용”有 <b>9 题</b>（17–21、25、31、37、41）——这两类做好就稳了一半。</td></tr>'+
   '</table><p class="minfo">第96回和第83回 21–50 题的题干顺序完全一样（只有 44、50 题略有不同），说明题型位置很固定，可以提前知道每道题要听什么。</p></div>';

  h+='<div class="card tipc" id="lg-types"><h3>② 各题号怎么做</h3>';
  h+=sec("preread","听前先读选项（所有题）",'<li>选项比音频先到：利用空隙扫一遍四个选项，<b>找出它们的差别</b>（谁？做什么？时间/数字？正面还是负面？），听的时候就只盯这个差别。</li><li>选项里反复出现的名词就是话题，先在脑子里准备好相关单词。</li>',["96-1","83-2","96-14"]);
  h+=sec("pic","1–3 看图 / 图表",'<li>1–2 是对话场景：四张图通常是同一场所的不同动作，<b>抓“谁在对谁做什么”</b>，别被听到的名词带跑（'+L("83-1")+'：听到“展厅”就选展品图是陷阱）。</li><li>3 是图表：一张折线/柱状（趋势、数字）+ 一张排名，干扰项最常见的是<b>顺序对调、数字对调、趋势写反</b>（'+L("83-3")+'、'+L("96-3")+'）。听到 꾸준히 늘다（持续增长）、감소하다、그 뒤를 이어（紧随其后）要立刻对图。</li>',["83-1","83-3","96-3"]);
  h+=sec("next","4–8 接下一句",'<li>只回应<b>最后一句话</b>：是提问就选回答，是建议就选接受/拒绝的理由。</li><li>和对话已知事实矛盾的直接删（'+L("83-5")+'：对方还没找到工作，选项却说“找到了”）。</li>',["83-5","96-4","96-7"]);
  h+=sec("act","9–12 女的接下来做什么",'<li>答案几乎都在<b>后半段：一方提议（그럼 ~할게요 / ~해 줄래요?），女的答应</b>（'+L("83-12")+'：“그렇게 해 주세요”指的就是前一句的提议）。</li><li>两类必删：<b>已经做完的事</b>、<b>男的要做的事</b>（'+L("96-9")+'、'+L("83-11")+'）。还要注意 먼저（先）——问的是“马上”做什么（'+L("96-10")+'）。</li>',["83-9","96-9","96-10"]);
  h+=sec("detail","13–16 及所有“들은 내용과 같은 것”",'<li>13 对话、14 广播通知（딩동댕）、15 新闻、16 采访。<b>边听边在选项上打 ✗</b>，听完剩下的就是答案。</li><li>干扰项的五种改法：<b>数字/时间</b>（'+L("83-16")+'：70岁才开始≠画了70年）、<b>主体</b>（谁做的，'+L("83-22")+'）、<b>顺序</b>（'+L("96-16")+'）、<b>有/没有、做过/没做过</b>（'+L("96-13")+'：안 해 봤는데）、<b>正反颠倒</b>（'+L("96-45")+'：最厚→最薄）。</li><li>“将来时 vs 已经”也常被换：-ㄹ 예정이다 / -기로 했다 ↔ -았/었다（'+L("96-22")+'：아직 출시도 좀 남았는데＝还没上市）。</li>',["96-14","83-14","96-16"]);
  h+=sec("opinion","17–21、25、31、37、41 中心思想",'<li>看清问的是<b>谁</b>的想法（17–21、25、31 问男的，37 问女的；'+L("83-19")+'有一项其实是女的想法）。</li><li>答案是一句<b>观点</b>，而不是事实或例子：录音里找 -아/어야 하다、-는 게 좋다、-(으)면 좋겠다、-(으)ㄹ 필요가 있다、중요하다 这类句子（'+L("83-21")+'：-ㄹ 필요가 있어요 → “설문 조사의 계획을 잘 세워야 한다”）。</li><li>17–20 常在<b>男的最后一句</b>亮出想法（'+L("83-17")+'、'+L("96-17")+'）。</li>',["83-17","83-21","96-25"]);
  h+=sec("pair2","21–50 一段两题：先看两道题干",'<li>21–50 每段放两遍：<b>第一遍抓整体（中心/意图/态度），第二遍核对细节（内容一致）</b>。</li><li>固定搭配（两回一致）：21 中心思想+22 一致｜23 在做什么+24｜25 中心+26｜27 意图+28｜29 是谁+30｜31 中心+32 态度｜33 主题+34｜35 在做什么+36｜37 女的中心+38｜39 对话之前+40｜41 演讲中心+42｜43 主题+44 原因｜45 一致+46 说话方式｜47 一致+48 态度｜49 一致+50 方式/态度。</li><li>23/35“在做什么”看整段话的<b>功能</b>：안내（通知指引）、요청（请求）、소감（感想）……（'+L("96-23")+'、'+L("83-35")+'）。29“是谁”听开头主持人怎么介绍他（'+L("83-29")+'）。</li>',["83-23","96-29","83-33"]);
  h+=sec("before","39 题：对话之前说了什么",'<li>39 题录音是一段对谈的<b>中途</b>，第一句常是“그렇다면/그럼 ~거군요/거죠?”——这是在<b>复述前面说过的内容</b>，答案就藏在这一句里（'+L("83-39")+'、'+L("96-39")+'）。</li><li>后面新说出来的内容反而不是“之前”的（'+L("96-39")+'③ 是陷阱）。</li>',["83-39","96-39"]);
  h+=sec("manner","32、46、48、50 态度 / 说话方式",'<li>先判断<b>正面还是负面</b>，再挑具体的动词（见下面“态度词”表）。</li><li>听到 첫째·둘째 / 먼저·다음으로 → 나열（列举，'+L("96-46")+'）；听到“예를 들어” → 예시；听到 반면/~와 달리 → 비교。</li><li>最后一句（시급하다、필요하다、~해야 할 것입니다）往往决定态度（'+L("96-48")+'），그럼에도 불구하고 之后才是真正立场（'+L("83-50")+'）。</li>',["83-48","96-32","83-46"]);
  h+='</div>';

  h+='<div class="card tipc lg-hot" id="lg-guess"><h3>③ 🔥 没听懂时怎么选</h3><p class="minfo" style="margin:0 0 6px">下面是从官方真题的选项设计里总结的<b>经验规律</b>，不是百分之百的规则；能听懂时永远以内容为准，听不懂时用它们提高命中率。</p>';
  h+=sec("para","1. 原词照搬的选项要警惕，正确答案多是“换说法”",'<li>出题人常把录音里的<b>原词</b>拼进一个错误的句子里，专骗“只听到几个词”的人：'+L("83-25")+'（把“저장（储存）”另造成“储存空间”）、'+L("96-31")+'（“단속（取缔）”→“增加取缔设备”）、'+L("96-29")+'（选项都带“해양”）、'+L("83-42")+'（“종이”）。</li><li>正确答案则常换成同义表达：'+L("96-49")+' 录音“24시간 내내 태양을 볼 수 있는”→ 答案“항상 태양 빛을 받을 수 있다”；'+L("96-14")+' “영업시간도 한 시간 연장”→“영업시간이 늘어난다”。</li><li>做法：听不懂时，<b>先删“词全对、意思不对”的选项</b>，在剩下的里选意思最概括的那个。</li>',["83-25","96-31","96-14"]);
  h+=sec("extreme","2. 带极端词 / 限定词的选项多半是陷阱（但不绝对）",'<li>모든·누구나·항상·전혀·반드시·절대·-만（只）把范围说死了，经常和录音不符：'+L("96-14")+'（모든 고객 → 其实只有消费满5万的）、'+L("96-15")+'（모든 참가자 → 规定时间内到的才有）、'+L("96-38")+'（“만”只有病人能用 → 其实家属、医护都能用）。</li><li><b>反例</b>：录音本身就说了“全部/一直”时，带这个词的就是答案——'+L("83-15")+'（등산객 모두를 발견 → “모두 구조되었다”是正确答案）、'+L("96-49")+'（항상）。所以它只用来<b>在拿不准时排除</b>，不能看到就删。</li>',["96-14","96-15","96-38","83-15"]);
  h+=sec("opinion","3. 中心思想题：只选“观点句”",'<li>四个选项里，<b>写成 -아/어야 한다、-는 것이 좋다、-(으)면 좋겠다、-이 필요하다、-이 중요하다 的那一两项</b>优先考虑；纯事实描述（“~했다/~이다”）一般是内容一致题的写法。</li><li>再用常识和说话人身份筛：专家/老师类说话人的主张通常是“要做好计划、要考虑环境、制度要改进”这类合理建议（'+L("83-21")+'、'+L("83-25")+'、'+L("96-31")+'）。</li><li>注意别选<b>对方</b>（另一个人）的观点（'+L("83-19")+'、'+L("96-21")+'）。</li>',["83-20","96-20","96-37"]);
  h+='<div class="lsec"><h4 id="lg-attitude">4. 态度词速查（32、48、50 / 27 意图）</h4><table class="ltbl vt2">'+
    [["강조하다","强调","正面：“~가 중요합니다/필요합니다”反复说",'83-50'],["높이 평가하다 / 긍정적","高度评价 / 积极","全程说好处",'83-48'],["일관되게 주장하다","一贯坚持主张","被反对后不改口",'83-32'],["반박하다","反驳","对方说A，他举例说不是",'96-32'],["지적하다 / 비판하다","指出（问题）/ 批判","“문제는 ~”、“~지 못하고 있습니다”",'96-27'],["촉구하다 / 제안하다","敦促 / 提议","“~해야 할 것입니다”、“~하는 게 어때요?”",'96-48'],["우려하다 / 걱정하다","担忧","“~까 봐 걱정”、“부작용”",'83-48'],["회의적 / 부정적","怀疑 / 否定","“과연 ~일까요?”",""],["유보하다 / 신중하다","保留 / 慎重","“좀 더 지켜봐야”",""],["기대하다 / 전망하다","期待 / 展望","“앞으로 ~할 것으로 보입니다”",""]].map(function(r){return '<tr><td><b>'+r[0]+'</b></td><td>'+r[1]+'</td><td>'+r[2]+(r[3]?' '+L(r[3]):"")+'</td></tr>'}).join("")+
    '</table><ul><li>听不懂时：先判断正/负方向，<b>和整段语气方向相反的直接删</b>（'+L("83-48")+'：他全程正面，“警惕/担忧”两项可以先删）。</li></ul>'+exLinks("attitude",6)+'</div>';
  h+=sec("pair2","5. 用一组的另一道题来推",'<li>同一段的两道题，<b>题干和选项本身就透露内容</b>：'+L("96-44")+'题干“소금을 한곳에 쌓아 두는 이유”已经告诉你在讲制盐 → '+L("96-43")+'选“소금을 생산하는 과정”；'+L("83-44")+'题干“참가자들이 얼굴 사진을 기억한 이유”说明是个实验 → '+L("83-43")+'。</li><li>“内容一致”题的四个选项合起来几乎就是一份内容提要：中心思想题要和它们<b>不矛盾</b>（'+L("83-21")+' ↔ '+L("83-22")+'）。</li>',["96-43","83-43","83-21"]);
  h+='<div class="lsec"><h4>6. 实在没听懂：最后三招</h4><ul><li><b>常识猜</b>：TOPIK 的答案不会违背常识和“正能量”——环境要保护、计划要做好、制度要完善、问题要解决。选项里有明显偏激、消极或荒谬的先删。</li><li><b>选“概括”不选“局部”</b>：主题/中心题里，只讲开头一个例子或背景的选项常是陷阱（'+L("83-33")+'、'+L("96-43")+'）。</li><li><b>绝不空着</b>：TOPIK 答错不扣分，空着＝0分。实在不会就按上面删完后随便选一个，立刻看下一题选项——不要因为一道题丢掉下一道。</li></ul></div>';
  h+='</div>';

  h+='<div class="card tipc" id="lg-signal"><h3>④ 信号词：听到就竖起耳朵</h3><table class="ltbl vt2">'+
    [["그런데 / 근데","可是、不过（话锋一转）","83-21"],["하지만 / 그러나","但是（后面常是主张）","83-39"],["사실(은)","其实（纠正前面说法）","96-21"],["그래서 / 따라서","所以（后面是结论）","96-49"],["결국 / 결과적으로","最终、结果",""],["그러니까 / 즉","也就是说（换说法 → 常是答案）",""],["요즘 / 최근","最近（引出话题）","83-18"],["오히려","反而（和预期相反）","83-37"],["그럼에도 불구하고","尽管如此（真正立场在后面）","83-49"],["무엇보다 / 특히","最重要的是 / 特别是","96-25"],["~는 게 어때요? / ~자","…怎么样？/ 一起…吧（提议）","83-27"],["그렇다면 / 그럼 ~거군요","那么就是说…（复述前文，39题）","96-39"]].map(function(r){return '<tr><td><b>'+r[0]+'</b></td><td>'+r[1]+(r[2]?' '+L(r[2]):"")+'</td></tr>'}).join("")+
    '</table>'+exLinks("signal",6)+'</div>';

  h+='<div class="card tipc" id="lg-daily"><h3>⑤ 每天怎么练（30–40 分钟）</h3><ol class="lol">'+
    '<li><b>完整做</b>：在“真题练习”里选一回或一组题，像考场一样<b>只听不暂停</b>（21–50 可以听两遍），先选答案。</li>'+
    '<li><b>对答案</b>：看解析，<b>给每道错题点一个错因</b>：单词没听懂 / 没抓住转折 / 没认出同义改写 / 没听清。</li>'+
    '<li><b>看原文重听</b>：打开 대본，边看边听，把没听出来的那句标出来；再<b>不看原文</b>听一遍。</li>'+
    '<li><b>跟读（shadowing）</b>：用 0.8× 速度，落后半拍跟着读关键句 3 遍，再 1× 跟读。</li>'+
    '<li><b>按错因补</b>：单词 → 把“生词”加入词库；转折 → 复习上面的信号词；同义改写 → 把“录音原句 ↔ 正确选项”抄成一对一对记。</li>'+
    '</ol><p class="minfo">错题本会统计你的错因，最多的那一类就是你下周的重点。</p></div>';
  return h;
}
function sec(tag,title,lis,prefer){return '<div class="lsec"><h4 id="lg-'+tag+'-'+(title.length)+'">'+title+'</h4><ul>'+lis+'</ul>'+exLinks(tag,6,prefer)+'</div>'}

/* ---------- 数据 ---------- */
function ensure(){
  if(D) return Promise.resolve();
  return fetch("listening/data.json?v="+Date.now().toString(36).slice(0,6),{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()}).then(function(d){
    D=d; Q=d.questions; byId={}; Q.forEach(function(q){byId[q.id]=q});
    SETS={}; d.sets.forEach(function(s){SETS[s.id]=s}); TY={}; d.types.forEach(function(t){TY[t.id]=t});
  });
}
function open(o){
  root=$("listening"); o=o||{};
  if(o.tab) opt.tab=o.tab;
  if(o.round){opt.round=String(o.round); if(!o.tab) opt.tab="prac"; opt.view="list"}
  if(o.type){opt.type=o.type; opt.tab="type"; opt.view="list"}
  save(LS_OPT,opt);
  $("lBody").innerHTML='<div class="card empty">加载中…</div>';
  ensure().then(function(){
    if(!D.rounds.some(function(r){return String(r.round)===opt.round})) opt.round=String(D.rounds[0].round);
    if(o.q&&byId[o.q]){go(o.q);return}
    if(o.type&&!TY[o.type]) toast("没有这个题型："+o.type);
    setTab(opt.tab);
  }).catch(function(e){$("lBody").innerHTML='<div class="card empty">听力题库加载失败：'+esc(e.message)+"</div>"});
}
function setTab(t,keep){
  if(["guide","prac","type","wrong"].indexOf(t)<0) t="guide";
  if(t!==opt.tab||!keep) opt.view="list";
  opt.tab=t; save(LS_OPT,opt);
  Array.prototype.forEach.call(document.querySelectorAll("#ltabs button"),function(b){b.classList.toggle("active",b.getAttribute("data-tab")===t)});
  stopAudio();
  if(opt.view==="q"&&opt.cur&&byId[opt.cur]){renderQ();return}
  ({guide:renderGuide,prac:renderPrac,type:renderType,wrong:renderWrong})[t]();
  if(!keep) window.scrollTo(0,0);
}
function stopAudio(){var a=root&&root.querySelector("audio");if(a){try{a.pause()}catch(e){}}}
/* ---------- 攻略 ---------- */
function renderGuide(){ $("lBody").innerHTML=guideHTML()+srcNote(); }
function srcNote(){return '<div class="minfo lsrc">真题来源：TOPIK 官网 <a href="'+esc(D.board)+'" target="_blank" rel="noopener">topik.go.kr 기출문제</a> 公开的 '+D.rounds.map(function(r){return "第"+r.round+"回"}).join("、")+' TOPIK II 듣기（题目、正答、듣기 대본、MP3）。中文翻译与解析为本站自写，仅供学习。</div>'}
/* ---------- 真题练习：回次 → 按题号分组的题目列表 ---------- */
function stat(list){var d=0,ok=0;list.forEach(function(q){var a=st.a[q.id];if(a){d++;if(a.ok)ok++}});return {d:d,ok:ok,n:list.length}}
function chip(q){var a=st.a[q.id];return '<button type="button" class="lchip'+(a?(a.ok?" ok":" bad"):"")+'" data-go="'+q.id+'" data-seq="round">'+q.n+'</button>'}
function renderPrac(){
  var h='<div class="fbar">'+D.rounds.map(function(r){var s=stat(Q.filter(function(q){return q.round===r.round}));return '<button type="button" class="chip lr'+(opt.round===String(r.round)?" on2":"")+'" data-round="'+r.round+'">'+esc(r.label)+' <small>'+s.d+'/50</small></button>'}).join("")+'</div>';
  var R=+opt.round, list=Q.filter(function(q){return q.round===R}), s=stat(list);
  h+='<div class="minfo">第'+R+'回 · 已做 '+s.d+'/50'+(s.d?' · 正确率 '+Math.round(s.ok*100/s.d)+'%':"")+' · 点题号开始（绿=对，红=错）</div>';
  D.groups.forEach(function(g){
    var qs=list.filter(function(q){return q.n>=g.a&&q.n<=g.b}), gs=stat(qs);
    h+='<div class="card lgrp"><div class="lgh"><b>'+esc(g.label)+'</b><span>'+gs.d+'/'+gs.n+'</span></div><div class="lchips">'+qs.map(chip).join("")+'</div></div>';
  });
  h+='<div class="racts"><button type="button" class="gbtn pri" data-act="start" data-round="'+R+'">▶ 从第一道没做的开始</button><button type="button" class="gbtn" data-act="resetround" data-round="'+R+'">↺ 清空本回作答</button></div>';
  $("lBody").innerHTML=h+srcNote();
}
/* ---------- 按题型练 ---------- */
function renderType(){
  var h='<div class="minfo">两回真题混在一起按题型练；同一题型的套路会越做越熟。</div><div class="ltypes">';
  D.types.forEach(function(t){
    var qs=Q.filter(function(q){return q.type===t.id}); if(!qs.length) return; var s=stat(qs);
    h+='<button type="button" class="card ltype" data-type="'+t.id+'"><b>'+esc(t.name)+'</b><small>第 '+esc(t.nos)+' 题 · '+qs.length+' 道</small><span class="bk-mini"><i style="width:'+Math.round(s.d*100/s.n)+'%"></i></span><small>已做 '+s.d+(s.d?' · 对 '+s.ok:"")+'</small></button>';
  });
  $("lBody").innerHTML=h+'</div>'+srcNote();
}
/* ---------- 错题本 ---------- */
function renderWrong(){
  var ids=Object.keys(st.w).filter(function(id){return byId[id]}).sort(function(a,b){return (st.w[b].last||0)-(st.w[a].last||0)});
  var h='';
  if(!ids.length){$("lBody").innerHTML='<div class="card empty">还没有错题。去“真题练习”做一回吧！</div>';return}
  var cnt={}; ids.forEach(function(id){var t=st.w[id].tag;if(t)cnt[t]=(cnt[t]||0)+1});
  h+='<div class="card"><b>错题 '+ids.length+' 道</b><div class="minfo" style="margin:4px 0 0">错因：'+(Object.keys(TAGS).map(function(k){return TAGS[k]+' <b>'+(cnt[k]||0)+'</b>'}).join(" · "))+'</div>'+
     '<div class="racts" style="margin-top:8px"><button type="button" class="gbtn pri" data-act="startwrong">▶ 连续练错题</button></div></div>';
  ids.forEach(function(id){var q=byId[id],w=st.w[id];
    h+='<div class="wl"><div class="s"><b>第'+q.round+'回 '+q.n+'题</b> · '+esc((TY[q.type]||{}).name||"")+' · 错 '+(w.n||1)+' 次'+(w.c!=null&&w.c>=0?' · 上次选 '+NUM[w.c]:"")+(w.tag?' · <span class="ltag on">'+esc(TAGS[w.tag]||w.tag)+'</span>':"")+'<div>'+esc(q.stem||q.instr)+'</div></div><button type="button" class="gbtn" data-go="'+id+'" data-seq="wrong">去做</button></div>'});
  $("lBody").innerHTML=h;
}
/* ---------- 题目序列 ---------- */
function seqList(){
  if(opt.seq==="type") return Q.filter(function(q){return q.type===opt.type}).map(function(q){return [q.id]});
  if(opt.seq==="wrong") return Object.keys(st.w).filter(function(id){return byId[id]}).sort().map(function(id){return [id]});
  var R=+opt.round, out=[], seen={};
  Q.filter(function(q){return q.round===R}).forEach(function(q){if(seen[q.set]){out[seen[q.set]-1].push(q.id)}else{out.push([q.id]);seen[q.set]=out.length}});
  return out;
}
function go(id,seq){
  var q=byId[id]; if(!q) return;
  if(seq) opt.seq=seq; else if(opt.seq==="type"&&q.type!==opt.type||opt.seq==="wrong"&&!st.w[id]||!opt.seq) opt.seq="round";
  if(opt.seq==="round") opt.round=String(q.round);
  if(opt.tab==="guide"||opt.tab==="type"&&opt.seq!=="type"||opt.tab==="wrong"&&opt.seq!=="wrong") opt.tab=opt.seq==="type"?"type":opt.seq==="wrong"?"wrong":"prac";
  opt.cur=id; opt.view="q"; save(LS_OPT,opt);
  Array.prototype.forEach.call(document.querySelectorAll("#ltabs button"),function(b){b.classList.toggle("active",b.getAttribute("data-tab")===opt.tab)});
  stopAudio(); renderQ(); window.scrollTo(0,0);
}
function renderQ(){
  var L0=seqList(), idx=-1;
  L0.forEach(function(u,i){if(u.indexOf(opt.cur)>=0)idx=i});
  if(idx<0){ L0=[[opt.cur]]; idx=0 }
  var ids=L0[idx], qs=ids.map(function(i){return byId[i]}), q0=qs[0], S=SETS[q0.set];
  var title=opt.seq==="type"?"按题型："+((TY[opt.type]||{}).name||""):opt.seq==="wrong"?"错题本":"第"+q0.round+"回";
  var h='<div class="unav"><button type="button" data-act="back">← 列表</button><span class="pos">'+esc(title)+' · '+(idx+1)+'/'+L0.length+'</span><button type="button" data-act="prev"'+(idx>0?"":" disabled")+'>上一个</button><button type="button" data-act="next"'+(idx<L0.length-1?"":" disabled")+'>下一个</button></div>';
  var rng=S.a===S.b?"第"+S.a+"题":"第"+S.a+"～"+S.b+"题";
  h+='<div class="rcard"><div class="rhdr"><span class="rtag real">真题 第'+q0.round+'回 '+rng+'</span>'+(ids.length<(S.b-S.a+1)?'<span class="rtag sub">本段共 '+(S.b-S.a+1)+' 题，这里只练第'+q0.n+'题</span>':"")+'<br>'+esc(q0.instr)+'</div>';
  h+='<div class="laud"><audio id="lAudio" controls preload="metadata" src="'+esc(S.audio)+'"></audio>'+
     '<div class="lctl"><span class="minfo">'+(S.twice?"考场放两遍 → 可以再听一遍":"考场只放一遍")+'</span><span class="lrate">'+[0.8,1,1.2].map(function(r){return '<button type="button" data-rate="'+r+'" class="'+(opt.rate===r?"on":"")+'">'+r+'×</button>'}).join("")+'</span><button type="button" class="gbtn" data-act="replay">↺ 从头听</button></div></div>';
  qs.forEach(function(q){h+=qHTML(q)});
  var allDone=qs.every(function(q){return st.a[q.id]&&st.a[q.id].show!==false});
  h+='<div class="lscript"'+(allDone?"":" hidden")+'><details class="rx" open><summary>📜 대본（官方听力原文）</summary><p class="ko">'+br(S.script)+'</p></details><details class="rx"'+(qs.some(function(q){return !(st.a[q.id]||{}).ok})?" open":"")+'><summary>🇨🇳 中文翻译</summary><p>'+br(S.tr)+'</p></details></div>';
  h+='</div>';
  if(idx<L0.length-1) h+='<div class="racts"><button type="button" class="gbtn pri lnext" data-act="next">下一个 →</button></div>';
  $("lBody").innerHTML=h;
  var a=$("lAudio"); if(a){a.playbackRate=opt.rate||1; a.addEventListener("ratechange",function(){},false)}
}
function qHTML(q){
  var rec=st.a[q.id], done=rec&&rec.show!==false;
  var h='<div class="rq" data-id="'+q.id+'"><div class="rhdr"><span class="rtag type">'+esc((TY[q.type]||{}).name||"")+'</span></div>';
  if(q.stem) h+='<div class="rstem">'+q.n+'. '+esc(q.stem)+'</div>'; else h+='<div class="rstem">'+q.n+'.</div>';
  h+='<div class="ropts'+(q.img?" limg":"")+'">';
  q.opts.forEach(function(o,i){
    var cls="ropt"; if(done){if(i===q.ans)cls+=" ok";else if(rec.c===i)cls+=" bad"}
    h+='<button type="button" class="'+cls+'" data-q="'+q.id+'" data-i="'+i+'"'+(done?" disabled":"")+'><span class="n">'+NUM[i]+'</span>'+(q.img?'<img loading="lazy" src="'+esc(q.img[i])+'" alt="第'+q.round+'回第'+q.n+'题 选项'+NUM[i]+'（原卷图片）">':'<span>'+esc(o)+'</span>')+'</button>';
  });
  h+='</div><div class="rfb">'+(done?fbHTML(q,rec.c):"")+'</div></div>';
  return h;
}
function fbHTML(q,my){
  var ok=my===q.ans, w=st.w[q.id];
  var h='<div class="rres '+(ok?"ok":"bad")+'">'+(ok?"✔ 正确！":"✘ 选了 "+NUM[my]+" · 正确答案 "+NUM[q.ans])+'</div>';
  if(w&&!ok) h+='<div class="ltags"><span class="minfo">错因：</span>'+Object.keys(TAGS).map(function(k){return '<button type="button" class="ltag'+(w.tag===k?" on":"")+'" data-tag="'+k+'" data-q="'+q.id+'">'+TAGS[k]+'</button>'}).join("")+'</div>';
  h+='<details class="rx" open><summary>解析</summary><h4>💡 为什么选 '+NUM[q.ans]+'</h4><p>'+esc(q.e)+'</p>';
  if(q.trap) h+='<h4>🪤 陷阱</h4><p>'+esc(q.trap)+'</p>';
  if(q.st&&q.st.length) h+='<h4>📌 对应攻略</h4><p>'+q.st.map(function(t){return '<a href="#" class="lq" data-guide="'+t+'">'+esc(ST[t]||t)+'</a>'}).join(" · ")+'</p>';
  if(q.v&&q.v.length) h+='<h4>生词</h4><table class="vt">'+q.v.map(function(v){return '<tr><td>'+esc(v[0])+'</td><td>'+esc(v[1])+'</td></tr>'}).join("")+'</table>';
  h+='<div class="racts"><button type="button" data-act="redo" data-q="'+q.id+'">↺ 重做</button>'+(w?'<button type="button" data-act="unwrong" data-q="'+q.id+'">✓ 已掌握，移出错题本</button>':"")+'</div></details>';
  return h;
}
function answer(id,i){
  var q=byId[id]; if(!q) return; var ok=i===q.ans;
  st.a[id]={c:i,ok:ok,t:Date.now()};
  if(!ok){var w=st.w[id]||{n:0}; w.n=(w.n||0)+1; w.c=i; w.last=Date.now(); st.w[id]=w}
  save(LS,st); renderQ();
  var el=root.querySelector('.rq[data-id="'+id+'"] .rres'); if(el&&el.scrollIntoView) el.scrollIntoView({block:"center",behavior:"smooth"});
}
function guideJump(t){
  opt.tab="guide"; opt.view="list"; save(LS_OPT,opt); setTab("guide");
  var el=null; var hs=root.querySelectorAll('[id^="lg-'+t+'"]'); if(hs.length) el=hs[0];
  if(t==="attitude"||t==="manner") el=$("lg-attitude")||el;
  if(el) setTimeout(function(){el.scrollIntoView({block:"start"})},30);
}
function bind(){
  $("ltabs").addEventListener("click",function(e){var b=e.target.closest("button[data-tab]");if(b){opt.view="list";setTab(b.getAttribute("data-tab"))}});
  $("lBody").addEventListener("click",function(e){
    var t=e.target, b;
    if((b=t.closest("[data-jump]"))){e.preventDefault();var el=$(b.getAttribute("data-jump"));if(el)el.scrollIntoView({block:"start",behavior:"smooth"});return}
    if((b=t.closest("[data-go]"))){e.preventDefault();go(b.getAttribute("data-go"),b.getAttribute("data-seq")||(opt.tab==="guide"?"round":null));return}
    if((b=t.closest("[data-guide]"))){e.preventDefault();guideJump(b.getAttribute("data-guide"));return}
    if((b=t.closest("button.ropt"))){if(!b.disabled)answer(b.getAttribute("data-q"),+b.getAttribute("data-i"));return}
    if((b=t.closest("[data-round]"))&&!b.hasAttribute("data-act")){opt.round=b.getAttribute("data-round");save(LS_OPT,opt);renderPrac();return}
    if((b=t.closest("[data-type]"))){opt.type=b.getAttribute("data-type");var f=Q.filter(function(q){return q.type===opt.type});var nd=f.filter(function(q){return !st.a[q.id]})[0]||f[0];if(nd)go(nd.id,"type");return}
    if((b=t.closest("[data-rate]"))){opt.rate=+b.getAttribute("data-rate");save(LS_OPT,opt);var a=$("lAudio");if(a)a.playbackRate=opt.rate;Array.prototype.forEach.call(root.querySelectorAll("[data-rate]"),function(x){x.classList.toggle("on",+x.getAttribute("data-rate")===opt.rate)});return}
    if((b=t.closest("[data-tag]"))){var id=b.getAttribute("data-q"),k=b.getAttribute("data-tag");if(st.w[id]){st.w[id].tag=st.w[id].tag===k?"":k;st.w[id].last=Date.now();save(LS,st);Array.prototype.forEach.call(b.parentNode.querySelectorAll(".ltag"),function(x){x.classList.toggle("on",x.getAttribute("data-tag")===st.w[id].tag)})}return}
    if(!(b=t.closest("[data-act]"))) return;
    var act=b.getAttribute("data-act"), qid=b.getAttribute("data-q");
    if(act==="back"){opt.view="list";save(LS_OPT,opt);setTab(opt.tab)}
    else if(act==="prev"||act==="next"){var L0=seqList(),i=-1;L0.forEach(function(u,k){if(u.indexOf(opt.cur)>=0)i=k});var j=i+(act==="next"?1:-1);if(j>=0&&j<L0.length){opt.cur=L0[j][0];save(LS_OPT,opt);stopAudio();renderQ();window.scrollTo(0,0)}}
    else if(act==="replay"){var a=$("lAudio");if(a){a.currentTime=0;a.playbackRate=opt.rate||1;var p=a.play();if(p&&p.catch)p.catch(function(){})}}
    else if(act==="redo"){delete st.a[qid];save(LS,st);renderQ()}
    else if(act==="unwrong"){delete st.w[qid];save(LS,st);toast("已移出错题本");renderQ()}
    else if(act==="start"){var R=+b.getAttribute("data-round"),f=Q.filter(function(q){return q.round===R}),nd=f.filter(function(q){return !st.a[q.id]})[0]||f[0];go(nd.id,"round")}
    else if(act==="startwrong"){var ids=Object.keys(st.w).filter(function(id){return byId[id]}).sort();if(ids.length)go(ids[0],"wrong")}
    else if(act==="resetround"){var R2=+b.getAttribute("data-round");if(confirm("清空第"+R2+"回的作答记录？（错题本保留）")){Q.forEach(function(q){if(q.round===R2)delete st.a[q.id]});save(LS,st);renderPrac()}}
  });
}
window.TopikListening={open:open,init:function(){bind()}};
})();
