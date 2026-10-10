/* ☁️ 多设备进度同步（GitHub 私密 Gist）
   - Token（classic，只勾 gist 权限）只保存在这台设备的 localStorage（topik.sync.token），和 DeepSeek Key 一样不上传、不进仓库。
   - 同步的是学习进度（错题本 / 间隔复习 / 自评 / 练习记录 / AI 批改记录 …），不同步任何 Key / Token / 纯界面偏好。
   - 合并不覆盖：三方合并（上次同步的共同版本 base + 本机 + 云端），按数据形状逐条合并；没有共同版本时做“并集”合并，任何一边的数据都不丢。
   - 本文件必须在其它模块之前加载（拦截 localStorage.setItem 以便知道哪些进度改了）。 */
(function(root){
"use strict";

/* ---------- 同步哪些 key，以及每个 key 里各部分怎么合并 ---------- */
function byNum(f){return function(a,b){return (+a[f]||0)-(+b[f]||0)}}
function byStr(f){return function(a,b){var x=String(a[f]||""),y=String(b[f]||"");return x<y?-1:x>y?1:0}}
function chain(){var fs=arguments;return function(a,b){for(var i=0;i<fs.length;i++){var c=fs[i](a,b);if(c)return c}return 0}}
/* policy(path) → null（默认：对象逐键递归，数字取大，数组并集去重，其它按本 key 最后修改时间）
   {newer:cmp, max:[字段], min:[字段]}：整条记录取较新的一边（cmp>0 表示 a 较新），再把计数字段取最大
   {arr:true, id:fn, sort:fn, cap:n}：数组按 id 并集去重 */
var KEYS={
  "topik.wrong.v1":            {name:"单词错题本（闪卡 / 词库 / 阅读生词）", pol:null},
  "topik.bank.v1":             {name:"词库 间隔复习 + 每日计划", pol:function(p){
      if(p.length===2&&p[0]==="w") return {newer:chain(byStr("l"),byNum("n"),function(a,b){return ((a.ok||0)+(a.bad||0))-((b.ok||0)+(b.bad||0))}),max:["n","ok","bad"],min:["f"]};
      return null}},
  "topik.writing.v1":          {name:"写作 51·52 自评", pol:function(p){return p.length===2&&p[0]==="marks"?{newer:byNum("t")}:null}},
  "topik.wg.wrong.v1":         {name:"写作 51·52 语法闪卡错题", pol:null},
  "topik.w54.wrong.v1":        {name:"写作 53·54 闪卡错题", pol:null},
  "topik.writing.ai.v1":       {name:"写作 51·52 AI 评分记录", pol:function(p){
      return p.length===1&&p[0]==="entries"?{arr:true,id:function(e){return e&&typeof e==="object"?[e.q,e.k,e.at,e.try].join("|"):canon(e)},sort:byNum("at"),cap:800}:null}},
  "topik.w54.ai.v1":           {name:"写作 53·54 AI 批改记录", pol:function(p){
      return p.length===2&&p[0]==="attempts"?{arr:true,id:function(e){return e&&typeof e==="object"?(e.at||"")+"|"+String(e.essay||"").slice(0,40):canon(e)},sort:byNum("at"),cap:40}:null}},
  "topik.grammar.wrong.v1":    {name:"语法错题本", pol:null},
  "topik.grammar.drill.v1":    {name:"语法分类练进度", pol:function(p){return p.length===1?{newer:byNum("lastAt"),max:["seen"]}:null}},
  "topik.grammar.aiAccepted.v1":{name:"AI 判对后记住的写法", pol:function(p){return p.length===1?{arr:true,id:function(e){return e&&typeof e==="object"?String(e.a):canon(e)},sort:byNum("at")}:null}},
  "topik.reading.v1":          {name:"阅读 作答记录 + 错题本", pol:function(p){return p.length===2&&p[0]==="a"?{newer:byNum("t")}:null}},
  "topik.reading.last":        {name:"阅读 上次整套模拟成绩", pol:function(p){return p.length===0?{newer:byNum("t")}:null}},
  "topik.listening.v1":        {name:"听力 作答记录 + 错题本", pol:function(p){
      if(p.length===2&&p[0]==="a") return {newer:byNum("t")};
      if(p.length===2&&p[0]==="w") return {newer:byNum("last"),max:["n"]};
      return null}}
};
var SYNC_KEYS=Object.keys(KEYS);

/* ---------- 合并（纯函数，node 里也能测） ---------- */
function isObj(x){return x!==null&&typeof x==="object"&&!Array.isArray(x)}
function has(o,k){return Object.prototype.hasOwnProperty.call(o,k)}
function eq(a,b){
  if(a===b) return true;
  if(Array.isArray(a)){if(!Array.isArray(b)||a.length!==b.length)return false;for(var i=0;i<a.length;i++)if(!eq(a[i],b[i]))return false;return true}
  if(isObj(a)){if(!isObj(b))return false;var ka=Object.keys(a),kb=Object.keys(b);if(ka.length!==kb.length)return false;
    for(var j=0;j<ka.length;j++)if(!has(b,ka[j])||!eq(a[ka[j]],b[ka[j]]))return false;return true}
  return false;
}
function canon(x){
  if(Array.isArray(x)) return "["+x.map(canon).join(",")+"]";
  if(isObj(x)) return "{"+Object.keys(x).sort().map(function(k){return JSON.stringify(k)+":"+canon(x[k])}).join(",")+"}";
  return JSON.stringify(x===undefined?null:x);
}
function clone(x){return x===undefined?undefined:JSON.parse(JSON.stringify(x))}
/* b = 共同版本（没有就是 undefined），l = 本机，r = 云端。localWins：两边都改了同一个标量时谁赢（按该 key 的最后修改时间） */
function merge3(b,l,r,ctx){
  if(eq(l,r)) return l;
  if(eq(l,b)) return r;          // 只有云端改了（包括云端删除）
  if(eq(r,b)) return l;          // 只有本机改了（包括本机删除）
  if(l===undefined) return r;    // 一边删、一边又改了：保留数据
  if(r===undefined) return l;
  var pol=ctx.pol?ctx.pol(ctx.path):null;
  if(pol&&pol.newer&&isObj(l)&&isObj(r)){
    var c=pol.newer(l,r), w=clone(c>0?l:c<0?r:(ctx.localWins?l:r));
    (pol.max||[]).forEach(function(f){if(typeof l[f]==="number"||typeof r[f]==="number")w[f]=Math.max(+l[f]||0,+r[f]||0)});
    (pol.min||[]).forEach(function(f){if(l[f]!=null&&r[f]!=null)w[f]=l[f]<r[f]?l[f]:r[f]});
    return w;
  }
  if(Array.isArray(l)&&Array.isArray(r)) return mergeArr(b,l,r,pol&&pol.arr?pol:{});
  if(isObj(l)&&isObj(r)){
    var out={}, bo=isObj(b)?b:{};
    var ks=Object.keys(l).concat(Object.keys(r).filter(function(k){return !has(l,k)}));
    ks.forEach(function(k){
      var v=merge3(has(bo,k)?bo[k]:undefined, has(l,k)?l[k]:undefined, has(r,k)?r[k]:undefined, {pol:ctx.pol,path:ctx.path.concat(k),localWins:ctx.localWins});
      if(v!==undefined) out[k]=v;
    });
    return out;
  }
  if(typeof l==="number"&&typeof r==="number") return Math.max(l,r);   // 计数：取大
  return ctx.localWins?l:r;
}
function mergeArr(b,l,r,pol){
  var id=pol.id||canon, bs=null, rs={}, ls={}, out=[], seen={};
  if(Array.isArray(b)){bs={};b.forEach(function(x){bs[id(x)]=1})}
  r.forEach(function(x){rs[id(x)]=x}); l.forEach(function(x){ls[id(x)]=x});
  l.forEach(function(x){var k=id(x); if(seen[k])return; if(bs&&bs[k]&&!has(rs,k))return; seen[k]=1; out.push(x)});   // 云端删掉的不要
  r.forEach(function(x){var k=id(x); if(seen[k])return; if(bs&&bs[k]&&!has(ls,k))return; seen[k]=1; out.push(x)});   // 本机删掉的不要
  if(pol.sort){var idx=out.map(function(x,i){return [x,i]});idx.sort(function(p,q){return pol.sort(p[0],q[0])||p[1]-q[1]});out=idx.map(function(p){return p[0]})}
  if(pol.cap&&out.length>pol.cap) out=out.slice(out.length-pol.cap);
  return out;
}
function mergeKey(key,b,l,r,localWins){
  var K=KEYS[key]; return merge3(b,l,r,{pol:K&&K.pol,path:[],localWins:!!localWins});
}

var API={KEYS:KEYS,SYNC_KEYS:SYNC_KEYS,merge3:merge3,mergeKey:mergeKey,eq:eq,canon:canon};
if(typeof module!=="undefined"&&module.exports){module.exports=API;return}
if(typeof window==="undefined") return;

/* ====================== 浏览器部分 ====================== */
var LS_TOKEN="topik.sync.token", LS_GIST="topik.sync.gist", LS_BASE="topik.sync.base", LS_STATE="topik.sync.state",
    LS_UPD="topik.sync.upd", LS_DEV="topik.sync.device", LS_AUTO="topik.sync.auto",
    LS_LAST="topik.sync.last",    // {try:上次开始同步的时间, ok:上次成功同步的开始时间}（所有标签页共用，用来限制频率）
    LS_DIRTY="topik.sync.dirty";  // 本机最后一次改进度的时间（> last.ok 就表示还有没上传的改动）
var FILE="topik-progress.json", APIURL="https://api.github.com";
var INTERVAL=5*60*1000,   // 自动同步（拉取 + 合并 + 上传）最多每 5 分钟一次
    FLUSH_GAP=60*1000,     // 切到后台 / 关闭页面时，有未上传的改动就静默上传一次（但距上次同步至少 1 分钟）
    TIMEOUT=20000;
var store=null; try{store=window.localStorage}catch(e){}
var rawSet=null, rawRemove=null;
try{rawSet=Storage.prototype.setItem;rawRemove=Storage.prototype.removeItem}catch(e){}
function lsGet(k){try{return store?store.getItem(k):null}catch(e){return null}}
function lsSetRaw(k,v){try{if(v===null||v===undefined)rawRemove.call(store,k);else rawSet.call(store,k,v);return true}catch(e){return false}}
function jget(k,d){try{var v=JSON.parse(lsGet(k));return v==null?d:v}catch(e){return d}}
function jset(k,v){return lsSetRaw(k,v===undefined?null:JSON.stringify(v))}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function now(){return Date.now()}
function rid(){var s="";for(var i=0;i<12;i++)s+="abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random()*36)];return s}
function device(){var d=lsGet(LS_DEV);if(!d){d=rid();lsSetRaw(LS_DEV,d)}return d}
function getToken(){return String(lsGet(LS_TOKEN)||"").trim()}
function getGist(){return String(lsGet(LS_GIST)||"").trim()}
function configured(){return !!getToken()}
function autoOn(){return lsGet(LS_AUTO)!=="0"}
function mask(k){return k?"••••"+k.slice(-4):""}
function fmtTime(t){if(!t)return "";var d=new Date(t),p=function(n){return String(n).padStart(2,"0")};
  var td=new Date();var same=d.toDateString()===td.toDateString();
  return (same?"今天 ":(d.getMonth()+1)+"/"+d.getDate()+" ")+p(d.getHours())+":"+p(d.getMinutes())}

/* ---- 拦截本页对进度 key 的写入：记修改时间，等 5 分钟定时器统一上传 ---- */
var timer=null;
function last(){var o=jget(LS_LAST,{});return isObj(o)?o:{}}
function pending(){var d=+lsGet(LS_DIRTY)||0;return d>0&&d>=(+last().ok||0)}   // 有没上传的本机改动（跨标签页 / 刷新后也记得）
function sinceTry(){return now()-(+last().try||0)}
function due(){return sinceTry()>=INTERVAL}
function touched(k){
  if(!KEYS[k]) return;
  var t=now(), u=jget(LS_UPD,{}); u[k]=t; jset(LS_UPD,u); lsSetRaw(LS_DIRTY,String(t)); schedule();
}
if(store&&rawSet){
  try{
    Storage.prototype.setItem=function(k,v){var r=rawSet.apply(this,arguments);if(this===store)touched(String(k));return r};
    Storage.prototype.removeItem=function(k){var r=rawRemove.apply(this,arguments);if(this===store)touched(String(k));return r};
  }catch(e){}
}

/* ---- GitHub API ---- */
function E(code,msg){var e=new Error(msg);e.code=code;return e}
function gh(method,path,body,token){
  token=token||getToken(); if(!token) return Promise.reject(E("notoken","还没有设置 GitHub Token"));
  var ctl=typeof AbortController!=="undefined"?new AbortController():null, to=null;
  var p=new Promise(function(resolve,reject){
    to=setTimeout(function(){if(ctl)try{ctl.abort()}catch(e){}reject(E("timeout","连接 GitHub 超时"))},TIMEOUT);
    var h={"Accept":"application/vnd.github+json","Authorization":"Bearer "+token,"X-GitHub-Api-Version":"2022-11-28"};
    if(body!==undefined) h["Content-Type"]="application/json";
    fetch(APIURL+path,{method:method,headers:h,body:body===undefined?undefined:JSON.stringify(body),cache:"no-store",signal:ctl?ctl.signal:undefined})
      .then(function(r){
        if(r.status===401) throw E("auth","Token 无效或已过期（401），请重新创建");
        if(r.status===403||r.status===429){
          if(r.headers.get("x-ratelimit-remaining")==="0") throw E("rate","GitHub 请求次数用完了，稍后再试");
          throw E("forbidden","没有权限（"+r.status+"）：请确认 Token 勾选了 gist 权限");
        }
        if(r.status===404) throw E("notfound","找不到（404）");
        if(r.status===422) throw E("invalid","GitHub 拒绝了请求（422）");
        if(!r.ok) throw E("http","GitHub 出错（"+r.status+"）");
        var scopes=r.headers.get("x-oauth-scopes");
        return r.json().then(function(j){return {json:j,scopes:scopes}},function(){throw E("json","GitHub 返回格式错误")});
      })
      .then(resolve,function(e){reject(e&&e.code?e:E("net",navigator.onLine===false?"离线：联网后会自动同步":"网络错误，连不上 GitHub"))});
  });
  return p.then(function(x){clearTimeout(to);return x},function(e){clearTimeout(to);throw e});
}
function parseDoc(txt){
  if(!txt) return null;
  try{var d=JSON.parse(txt);return d&&d.app==="topik"&&isObj(d.data)?d:null}catch(e){throw E("json","云端同步文件损坏（不是有效的 JSON），为安全起见没有同步")}
}
function readGist(id){
  return gh("GET","/gists/"+encodeURIComponent(id)+"?t="+now()).then(function(x){
    var g=x.json, f=g&&g.files&&g.files[FILE];
    if(!f) return {doc:null,scopes:x.scopes};
    if(f.truncated&&f.raw_url){
      return fetch(f.raw_url,{cache:"no-store"}).then(function(r){if(!r.ok)throw E("http","读取云端文件失败（"+r.status+"）");return r.text()})
        .then(function(t){return {doc:parseDoc(t),scopes:x.scopes}});
    }
    return {doc:parseDoc(f.content),scopes:x.scopes};
  });
}
function findGist(){   // 这台设备有 Token 但没有 Gist ID：在你的 gist 里找同名文件
  var page=1;
  function next(){
    return gh("GET","/gists?per_page=100&page="+page+"&t="+now()).then(function(x){
      var L=Array.isArray(x.json)?x.json:[];
      for(var i=0;i<L.length;i++) if(L[i]&&L[i].files&&L[i].files[FILE]) return L[i].id;
      if(L.length<100||page>=10) return null;
      page++; return next();
    });
  }
  return next();
}
function createGist(doc){
  return gh("POST","/gists",{description:"TOPIK 学习进度同步（topik-sync，请勿公开）",public:false,files:(function(){var o={};o[FILE]={content:JSON.stringify(doc)};return o})()})
    .then(function(x){return x.json.id});
}
function writeGist(id,doc){
  var files={}; files[FILE]={content:JSON.stringify(doc)};
  return gh("PATCH","/gists/"+encodeURIComponent(id),{files:files});
}

/* ---- 读写本机进度 ---- */
function readLocal(){
  var o={};
  SYNC_KEYS.forEach(function(k){var s=lsGet(k);if(s==null)return;try{o[k]=JSON.parse(s)}catch(e){}});
  return o;
}

/* ---- 同步主流程：拉取 → 合并 → 写回本机 → 推送 ---- */
var running=null;
function setState(s){s.at=now();jset(LS_STATE,s);render()}
function state(){return jget(LS_STATE,{})}
function sync(opt){
  opt=opt||{};
  if(!configured()) return Promise.resolve({skipped:true});
  if(running) return running;
  if(timer){clearTimeout(timer);timer=null}
  var startAt=now(), L=last(); L.try=startAt; jset(LS_LAST,L);
  if(!opt.silent) render("syncing");
  var changed=[];
  running=Promise.resolve().then(function(){
    var gid=getGist();
    if(gid) return gid;
    return findGist().then(function(found){
      if(found){lsSetRaw(LS_GIST,found);return found}
      return "";   // 还没有：下面新建
    });
  }).then(function(gid){
    var local=readLocal(), upd=jget(LS_UPD,{}), base=jget(LS_BASE,null);
    var getRemote=gid?readGist(gid):Promise.resolve({doc:null});
    return getRemote.then(function(res){
      var remote=res.doc, scopes=res.scopes;
      var useBase=!!(base&&remote&&isObj(base.data)&&Array.isArray(remote.hist)&&remote.hist.indexOf(base.id)>=0);
      var merged={}, mupd={}, rdata=remote?remote.data:{}, rupd=remote&&isObj(remote.upd)?remote.upd:{};
      SYNC_KEYS.forEach(function(k){
        var b=useBase?base.data[k]:undefined, l=local[k], r=rdata[k];
        var v=mergeKey(k,b,l,r,(upd[k]||0)>=(rupd[k]||0));
        if(v!==undefined) merged[k]=v;
        var t=Math.max(upd[k]||0,rupd[k]||0); if(t) mupd[k]=t;
        if(!eq(v,l)){
          if(v===undefined) lsSetRaw(k,null);
          else if(!lsSetRaw(k,JSON.stringify(v))) throw E("quota","本机存储空间不够，合并结果写不进去");
          changed.push(k);
        }
      });
      var remoteSame=remote&&SYNC_KEYS.every(function(k){return eq(merged[k],rdata[k])});
      var finish=function(id){
        if(!jset(LS_BASE,{id:id,data:merged})) lsSetRaw(LS_BASE,null);   // 空间不够就不存 base（下次按并集合并，不会丢数据）
        jset(LS_UPD,mupd);
      };
      var warn=scopes&&scopes.split(",").map(function(s){return s.trim()}).filter(function(s){return s&&s!=="gist"}).length?"⚠️ 这个 Token 权限过大（"+scopes+"），建议重新创建一个只勾 gist 的":"";
      if(remoteSame){finish(remote.hist[remote.hist.length-1]);return {changed:changed,pushed:false,warn:warn}}
      var pid=rid();
      var doc={app:"topik",schema:1,updatedAt:new Date().toISOString(),device:device(),
        hist:((remote&&Array.isArray(remote.hist))?remote.hist:[]).concat(pid).slice(-300),upd:mupd,data:merged};
      var put=gid?writeGist(gid,doc):createGist(doc).then(function(id){lsSetRaw(LS_GIST,id);return id});
      return put.then(function(){finish(pid);return {changed:changed,pushed:true,warn:warn}});
    });
  }).then(function(res){
    var L2=last(); L2.ok=startAt; L2.try=Math.max(+L2.try||0,startAt); jset(LS_LAST,L2);   // 开始同步之后又改的，仍算未上传
    setState({ok:true,msg:res.warn||"",changed:res.changed.length,pushed:res.pushed});
    if(res.changed.length) applied(res.changed,opt);
    return res;
  },function(e){
    if(changed.length) applied(changed,opt);   // 已经写进本机的合并结果也要通知各模块
    if(e&&e.code==="notfound"&&getGist()) e=E("notfound","找不到 Gist "+getGist()+"（ID 填错了，或 Token 不是同一个 GitHub 账号）");
    setState({ok:false,msg:(e&&e.message)||"同步失败"});
    return {error:e};
  }).then(function(r){
    running=null; render();
    schedule();   // 还有没上传的改动（比如同步途中又做了题）：排到下一个 5 分钟
    return r;
  });
  return running;
}
/* 有未上传的改动时，在“距上次同步满 5 分钟”那一刻自动同步一次（已有定时器就不动它） */
function schedule(){
  if(!configured()||!autoOn()||timer||running||!pending()) return;
  var wait=Math.max(1000,INTERVAL-sinceTry());
  timer=setTimeout(function(){
    timer=null;
    if(!pending()) return;                 // 别的标签页已经传过了
    if(!due()){schedule();return}          // 别的标签页刚同步过：顺延
    if(document.visibilityState==="hidden"){autoSync({silent:true});return}
    autoSync({});
  },wait);
}
/* 自动同步：距上次同步不到 5 分钟就跳过 */
function autoSync(opt){
  if(!configured()||!autoOn()||running) return;
  if(!due()){schedule();return}
  sync(opt||{});
}

/* 合并带来了其他设备的进度：通知各模块重新读取（避免内存里的旧数据把新数据覆盖掉） */
var loadedAt=now(), interacted=false;
["pointerdown","keydown","touchstart"].forEach(function(ev){window.addEventListener(ev,function(){interacted=true},{capture:true,passive:true})});
function applied(keys,opt){
  try{window.dispatchEvent(new CustomEvent("topik-sync",{detail:{keys:keys}}))}catch(e){try{var ev=document.createEvent("CustomEvent");ev.initCustomEvent("topik-sync",false,false,{keys:keys});window.dispatchEvent(ev)}catch(x){}}
  if(opt.silent) return;   // 后台静默上传：不弹提示、不刷新
  var t=null; try{t=+sessionStorage.getItem("topik.sync.reloadAt")||0}catch(e){}
  if(opt.initial&&!interacted&&now()-loadedAt<15000&&now()-t>60000&&!sheetOpen()){
    try{sessionStorage.setItem("topik.sync.reloadAt",String(now()))}catch(e){}
    location.reload(); return;
  }
  toastMsg("☁️ 已合并其他设备的进度"+(opt.manual?"":"（切换页面后显示最新统计）"));
}
function toastMsg(m){var t=document.getElementById("toast");if(!t)return;t.textContent=m;t.classList.add("show");clearTimeout(t._sy);t._sy=setTimeout(function(){t.classList.remove("show")},2600)}

/* ---- 状态行 + 设置面板 ---- */
function statusText(mode){
  if(!configured()) return {cls:"off",t:"☁️ 多设备同步：未设置"};
  if(mode==="syncing"||running) return {cls:"",t:"☁️ 同步中…"};
  var s=state();
  if(!s.at) return {cls:"",t:"☁️ 已设置，等待第一次同步"};
  if(!s.ok) return {cls:"bad",t:"☁️ 同步失败："+s.msg+"（"+fmtTime(s.at)+"）"};
  var pend=pending()&&autoOn()?" · 有新进度，"+(due()?"稍后":"约 "+Math.max(1,Math.ceil((INTERVAL-sinceTry())/60000))+" 分钟内")+"自动上传":"";
  return {cls:s.msg?"warn":"ok",t:"☁️ 上次同步："+fmtTime(s.at)+pend+(s.msg?" · "+s.msg:"")};
}
function render(mode){
  var bar=document.getElementById("syncBar");
  if(bar){var s=statusText(mode);bar.innerHTML='<span class="sy-t '+s.cls+'">'+esc(s.t)+'</span><button type="button" class="sy-btn" data-sy="now"'+(configured()?"":" hidden")+'>立即同步</button><button type="button" class="sy-btn" data-sy="open">⚙️ 设置</button>'}
  var st=document.getElementById("syState"); if(st){var s2=statusText(mode);st.textContent=s2.t;st.className="minfo sy-t "+s2.cls}
}
function sheetOpen(){return !!document.getElementById("sySheet")}
function closeSheet(){
  var el=document.getElementById("sySheet"),back=document.getElementById("syBack");
  if(el){if(el._esc)document.removeEventListener("keydown",el._esc);el.remove()} if(back)back.remove();
}
function openSheet(){
  closeSheet(); if(window.TopikAI&&TopikAI.closeSettings) TopikAI.closeSettings();
  var back=document.createElement("div"); back.className="ai-back"; back.id="syBack";
  var el=document.createElement("div"); el.className="ai-sheet"; el.id="sySheet"; el.setAttribute("role","dialog"); el.setAttribute("aria-label","进度同步设置");
  var names=SYNC_KEYS.map(function(k){return KEYS[k].name});
  el.innerHTML='<h3>☁️ 进度同步（手机 ⇄ 电脑）</h3>'+
    '<p class="minfo">把学习进度（错题本、词库复习、写作 / 阅读 / 语法练习记录、AI 批改记录等）存到你自己 GitHub 账号里的一个<b>私密 Gist</b>，每 5 分钟最多自动同步一次（打开网站 / 回到前台时距上次同步满 5 分钟才拉取合并；做题产生的新进度由 5 分钟定时器上传；切到后台或关闭页面时如有没上传的进度，会静默补传一次）。想马上同步就点「立即同步」。两边的记录会合并，不会互相覆盖。</p>'+
    '<details class="sy-how"><summary>📋 第一次怎么设置？（点开）</summary><ol class="minfo">'+
      '<li>电脑上登录 GitHub，打开 <a href="https://github.com/settings/tokens/new?scopes=gist&amp;description=topik-sync" target="_blank" rel="noopener">创建 Token 页面</a>（classic token）。</li>'+
      '<li>Note 保持 topik-sync；Expiration 选 <b>No expiration</b>（或尽量长）；权限<b>只勾 gist</b>，其它都不要勾；点最下面 Generate token。</li>'+
      '<li>复制 ghp_ 开头的 Token，粘贴到下面，点「保存并同步」。第一次会自动在你的账号里建一个私密 Gist（topik-progress.json）。</li>'+
      '<li>在另一台设备（手机 / 电脑）打开本网站 → ⚙️ 设置，粘贴<b>同一个 Token</b>，保存。会自动找到同一个 Gist（找不到时再把下面显示的 Gist ID 粘过去）。</li>'+
    '</ol></details>'+
    '<label class="lb" for="syTok">GitHub Token（只需要 gist 权限）</label>'+
    '<input id="syTok" type="password" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="'+(configured()?"已保存 "+esc(mask(getToken()))+"（留空 = 不修改）":"粘贴 ghp_… Token")+'">'+
    '<label class="lb" for="syGist">Gist ID（可留空：自动查找 / 自动新建）</label>'+
    '<input id="syGist" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="留空自动" value="'+esc(getGist())+'">'+
    '<label class="ai-tog"><input type="checkbox" id="syAuto"'+(autoOn()?" checked":"")+'> 自动同步（最多每 5 分钟一次）</label>'+
    '<div class="minfo sy-t" id="syState"></div>'+
    '<div class="racts"><button type="button" class="gbtn pri" data-sy="save">保存并同步</button><button type="button" class="gbtn" data-sy="now">立即同步</button><button type="button" class="gbtn" data-sy="clear">清除 Token</button><button type="button" class="gbtn" data-sy="close">关闭</button></div>'+
    '<div class="ai-msg" id="syMsg" aria-live="polite"></div>'+
    '<details class="sy-how"><summary>同步哪些内容（'+names.length+' 项）</summary><ul class="minfo">'+names.map(function(x){return "<li>"+esc(x)+"</li>"}).join("")+'</ul></details>'+
    '<p class="minfo"><b>Token 只保存在这台设备的浏览器里</b>（localStorage），不会上传到网站或仓库，也不会被同步；DeepSeek Key 也不同步，每台设备各自设置。界面偏好（当前页面、选项卡等）不同步。'+
    (window.TopikAI?' <button type="button" class="gbtn ai-mini" data-sy="ai">🤖 AI 判题设置</button>':'')+'</p>';
  document.body.appendChild(back); document.body.appendChild(el);
  var tok=el.querySelector("#syTok"), gist=el.querySelector("#syGist"), msg=el.querySelector("#syMsg");
  function say(t,c){msg.textContent=t;msg.className="ai-msg"+(c?" "+c:"")}
  function go(){
    say("同步中…","");
    sync({manual:true}).then(function(r){
      gist.value=getGist(); render();
      if(r&&r.error) say("❌ "+r.error.message,"bad");
      else if(r&&r.skipped) say("先粘贴 Token","bad");
      else say("✅ 同步完成"+(r.changed.length?"，合并了 "+r.changed.length+" 项其他设备的进度":"")+(getGist()?" · Gist ID："+getGist():""),"ok");
    });
  }
  render();
  back.onclick=closeSheet;
  el.querySelector("#syAuto").onchange=function(){lsSetRaw(LS_AUTO,this.checked?"1":"0");say(this.checked?"已开启自动同步":"已关闭自动同步（可以手动点「立即同步」）","ok")};
  el.onclick=function(e){
    var b=e.target.closest("button[data-sy]"); if(!b) return; var a=b.getAttribute("data-sy");
    if(a==="close") closeSheet();
    else if(a==="ai"){closeSheet();if(window.TopikAI)TopikAI.openSettings()}
    else if(a==="clear"){if(confirm("清除这台设备保存的 GitHub Token？（云端和本机的学习进度都不受影响）")){lsSetRaw(LS_TOKEN,null);tok.value="";tok.placeholder="粘贴 ghp_… Token";render();say("已清除本机的 Token","ok")}}
    else if(a==="save"){
      var t=tok.value.replace(/\s+/g,""), g=gist.value.trim().replace(/^.*\/([0-9a-f]{20,})\/?$/i,"$1");
      if(t) lsSetRaw(LS_TOKEN,t);
      if(g!==getGist()){lsSetRaw(LS_GIST,g||null);lsSetRaw(LS_BASE,null)}   // 换了 Gist：重新按并集合并
      tok.value=""; tok.placeholder=configured()?"已保存 "+mask(getToken())+"（留空 = 不修改）":"粘贴 ghp_… Token";
      if(!configured()){say("先粘贴 Token","bad");return}
      go();
    }
    else if(a==="now"){if(!configured()){say("先粘贴 Token 并保存","bad");return}go()}
  };
  el._esc=function(e){if(e.key==="Escape")closeSheet()}; document.addEventListener("keydown",el._esc);
}

/* ---- 自动同步的时机 ---- */
function boot(){
  var bar=document.getElementById("syncBar");
  if(bar) bar.addEventListener("click",function(e){var b=e.target.closest("button[data-sy]");if(!b)return;
    if(b.getAttribute("data-sy")==="open") openSheet();
    else {b.disabled=true;sync({manual:true}).then(function(r){b.disabled=false;if(r&&r.error)toastMsg("❌ "+r.error.message);else if(r&&!r.skipped&&!r.changed.length)toastMsg("☁️ 已同步")})}});
  render();
  if(configured()&&autoOn()){
    if(due()) setTimeout(function(){autoSync({initial:true})},300);   // 距上次同步满 5 分钟才拉取（刷新 / 换页面不会重新同步）
    else schedule();                                                   // 否则只为没上传的改动排定时器
  }
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
function flush(){   // 切到后台 / 锁屏 / 关闭页面：有没上传的改动就静默补传（防止手机上进度丢在本机）
  if(!configured()||!autoOn()||running||!pending()||sinceTry()<FLUSH_GAP) return;
  sync({silent:true});
}
document.addEventListener("visibilitychange",function(){
  if(!configured()||!autoOn()) return;
  if(document.visibilityState==="hidden") flush();
  else autoSync({initial:false});      // 回到前台：距上次同步满 5 分钟才拉取
});
window.addEventListener("pagehide",flush);
window.addEventListener("online",function(){if(configured()&&autoOn()&&pending())autoSync({})});
setInterval(function(){render()},60000);   // 更新“今天 xx:xx”

root.TopikSync={sync:sync,open:openSheet,close:closeSheet,configured:configured,KEYS:KEYS,mergeKey:mergeKey,status:function(){return statusText().t}};
})(typeof window!=="undefined"?window:this);
