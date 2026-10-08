const fs=require("fs"), path=require("path"), vm=require("vm");
/* 语法打字卡判分单元测试（句末语体归一）：node tools/test_grammar_checker.js */
const SITE=path.dirname(__dirname);
function makeCtx(withAccepted){
  const ls={};
  const ctx={console, Promise, setTimeout, clearTimeout,
    localStorage:{getItem:k=>ls[k]??null,setItem:(k,v)=>{ls[k]=String(v)},removeItem:k=>{delete ls[k]}},
    document:{getElementById:()=>null,querySelectorAll:()=>[]},
    fetch:(u)=>{const f=u.split("?")[0]; if(f==="accepted.json"&&!withAccepted) return Promise.resolve({ok:false,json:()=>Promise.resolve(null)});
      const t=fs.readFileSync(path.join(SITE,f),"utf8"); return Promise.resolve({ok:true,json:()=>Promise.resolve(JSON.parse(t))})}};
  ctx.window=ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(SITE+"/assets/accepted.js","utf8"),ctx);
  vm.runInContext(fs.readFileSync(SITE+"/grammar/grammar.js","utf8"),ctx);
  return ctx;
}
let fails=0;
function t(name,cond,info){console.log((cond?"PASS ":"FAIL ")+name+(info?"  → "+info:""));if(!cond)fails++}
(async()=>{
  for(const withAcc of [false,true]){
    const W=makeCtx(withAcc), T=W.TopikGrammar._t; await T.ensure();
    console.log(`\n=== full judge, mode=sent, accepted.json ${withAcc?"LOADED":"EMPTY (normalization only)"} ===`);
    const D=JSON.parse(fs.readFileSync(SITE+"/grammar/grammar.json","utf8"));
    const J=(id,si,typed)=>{const r=T.judgeAs("sent",{id,si,fi:0},typed);return r};
    const show=r=>r===null?"✘ wrong":typeof r==="object"?(r.reg?"✓ reg("+r.reg+")":"✓ teacher-alt"):"✓ "+r;
    const pass=[["neurago",3,"아이들을 키우느라고 정신이 없었어요."],["gie",0,"시간이 남기에 카페에 들렀어"],
      ["tong",2,"옆집이 공사하는 통에 잠을 한숨도 못 잤어요."],["eumeuro",2,"눈 밑 떨림의 주된 원인은 피로이므로 푹 쉬면 증상은 완화돼요."],
      ["eumeuro",2,"눈 밑 떨림의 주된 원인은 피로이므로 푹 쉬면 증상은 완화됩니다."],["kkabwa",1,"비가 올까 봐 우산을 챙겼다."],
      ["neurago",3,"아이들을 키우느라고 정신이 없었습니다"],["tong",2,"옆집이 공사하는 통에 잠을 한숨도 못 잤어"]];
    for(const [id,si,u] of pass){const r=J(id,si,u); t(`MUST PASS gd:${id}#${si} 「${u}」`,!!r,show(r))}
    const failC=[["gillae",0,"가격이 싸길래 두를 샀어요"],["gohaeseo",2,"비가 내리기도 하고 해서 집에서 쉈어요"],
      ["neurago",3,"아이들을 키우느라고 정신이 없어요."],["gie",0,"시간이 남기에 카페를 들렀어"],["tong",2,"옆집이 공사하는 통에 잠을 한숨도 못 자요."],
      ["kkabwa",1,"비가 올까 봐 우산을 챙길 거예요."]];
    for(const [id,si,u] of failC){const r=J(id,si,u); t(`MUST FAIL gd:${id}#${si} 「${u}」`,!r,show(r))}
  }
  // pure normalization unit checks
  const W=makeCtx(false), T=W.TopikGrammar._t; await T.ensure();
  const eq=(u,s)=>!!T.regMatch(T.norm(u),[T.norm(s)]);
  console.log("\n=== ending normalization (regMatch) ===");
  const yes=[["정신이 없었어요","정신이 없었다"],["들렀어","들렀다"],["못 잤어요","못 잤다"],["못 잤습니다","못 잤다"],["못 잤어","못 잤어요"],
    ["먹겠어요","먹겠다"],["먹겠어","먹겠습니다"],["가겠다","가겠어요"],["완화돼요","완화된다"],["완화됩니다","완화된다"],["완화돼","완화됩니다"],
    ["간다","가요"],["간다","가"],["간다","갑니다"],["먹는다","먹어요"],["먹는다","먹어"],["먹는다","먹습니다"],["한다","해요"],["공부한다","공부합니다"],["공부해","공부한다"],
    ["되었다","됐어요"],["됐다","됐어요"],["하였다","했어요"],["했다","했습니다"],["갔어요","갔다"],["하여요","해요"],
    ["학생이다","학생이에요"],["학생이야","학생입니다"],["의사예요","의사다"],["의사야","의사입니다"],["아니에요","아니다"],["아니야","아닙니다"],
    ["좋다","좋아요"],["바쁘다","바빠요"],["크다","커요"],["춥다","추워요"],["모른다","몰라요"],["만든다","만들어요"],["만듭니다","만들어"],["듣는다","들어요"],
    ["마신다","마셔요"],["본다","봐요"],["준다","줘요"],["기다린다","기다려요"],["갈 거예요","갈 거다"],["갈 거야","갈 겁니다"],["있었어요","있었다"]];
  for(const [a,b] of yes) t(`same: ${a} ≈ ${b}`,eq(a,b));
  const no=[["잤어요","잔다"],["갔다","가요"],["먹었다","먹겠다"],["두를 샀어요","두 개 샀어요"],["쉈어요","쉬었어요"],
    ["조심해","조심하세요"],["조심하세요","조심한다"],["가 주세요","가 준다"],["가십시오","갑니다"],["먹어라","먹어"],["가자","간다"],["갑시다","갑니다"],["먹읍시다","먹습니다"],
    ["비가 와서 갔다","비가 오고 갔다"],["와서","오고"],["먹어서","먹었다"],["을게요","을 거예요"],["학생을 만났다","학생이 만났어요"]];
  for(const [a,b] of no) t(`different: ${a} ≠ ${b}`,!eq(a,b)&&!eq(b,a));
  console.log("\n=== gc: grammar-core ===");
  const g=(mode,id,fi,u)=>T.judgeAs(mode,{id,si:0,fi},u);
  const D=JSON.parse(fs.readFileSync(SITE+"/grammar/grammar.json","utf8"));
  const fillOf=(ans0)=>{for(const it of D.items)(it.fill||[]).forEach((f,i)=>{if(f.ans[0]===ans0)fillOf.r=[it.id,i,f.ko]});return fillOf.r};
  let [fid,fi,ko]=fillOf("버렸어요"); let r=g("fill",fid,fi,"버렸어"); t(`fill end-blank ${ko} 「버렸어」`, r&&r.reg, JSON.stringify(r));
  [fid,fi,ko]=fillOf("셈이다"); r=g("fill",fid,fi,"셈이야"); t(`fill end-blank ${ko} 「셈이야」`, r&&r.reg, JSON.stringify(r));
  [fid,fi,ko]=fillOf("두세요"); r=g("fill",fid,fi,"둬"); t(`fill request ${ko} 「둬」 stays wrong`, !r, JSON.stringify(r));
  [fid,fi,ko]=fillOf("다가"); r=g("fill",fid,fi,"다가요"); t(`fill mid-sentence ${ko} 「다가요」 stays wrong`, !r, JSON.stringify(r));
  [fid,fi,ko]=fillOf("느라고"); r=g("fill",fid,fi,"느라고요"); t(`fill mid-sentence ${ko} 「느라고요」 stays wrong`, !r, JSON.stringify(r));
  const it=D.items.find(x=>x.f.includes("모양이다")); r=g("zh2ko",it.id,0,"-는 모양이에요"); t(`zh2ko ${it.f} 「-는 모양이에요」`, r&&r.reg, JSON.stringify(r));
  const it2=D.items.find(x=>x.f==="-는 바람에"); r=g("zh2ko",it2.id,0,"-는 바람에요"); t(`zh2ko ${it2.f} 「-는 바람에요」 stays wrong`, !r, JSON.stringify(r));
  // regression: all standard answers + teacher alts still judged correct exactly as before
  const W2=makeCtx(true), T2=W2.TopikGrammar._t; await T2.ensure();
  let bad=0,n=0;
  for(const it of D.items){ const seen=new Set(); let si=0;
    for(const e of (it.prac||[]).concat(it.ex||[])){const k=e.ko||"",z=e.zh||""; if(!k||!z||/…|\.\.\./.test(k+z)||seen.has(k))continue; seen.add(k);
      n++; if(T2.judgeAs("sent",{id:it.id,si,fi:0},k)!=="std") bad++; si++;}
  }
  t(`regression: all ${n} drill standard answers still exact "std"`, bad===0, bad+" not std");
  const acc=JSON.parse(fs.readFileSync(SITE+"/accepted.json","utf8")).cards; let ab=0,an=0;
  for(const [cid,e] of Object.entries(acc)){ if(!cid.startsWith("gd:"))continue; const [id,si]=cid.slice(3).split("#");
    for(const x of e.alts){an++; const r=T2.judgeAs("sent",{id,si:+si,fi:0},x.a); if(!(r&&typeof r==="object"&&!r.reg)) {ab++;console.log("  alt not teacher-matched:",cid,x.a,JSON.stringify(r))}}}
  t(`regression: all ${an} gd: teacher alts still show as teacher-accepted`, ab===0);
  // ---- N을/를 하다 = N하다 ----
  console.log("\n=== N을 하다 ＝ N하다 ===");
  const T3=makeCtx(false).TopikGrammar._t; await T3.ensure();
  const heq=(a,b)=>{const x=T3.hadaFold(T3.norm(a)),y=T3.hadaFold(T3.norm(b));return x===y||!!T3.regMatch(x,[y])};
  for(const [a,b] of [["예약을 해야","예약해야"],["운동을 해요","운동해요"],["매일 운동을 한다","매일 운동한다"],["숙제를 할 때","숙제할 때"],["일을 했다","일했다"],
    ["공부를 하고 잤다","공부하고 잤다"],["전화를 했더니","전화했더니"],["산책을 하곤 해요","산책하곤 해요"],["유학을 할 수 있었어요","유학할 수 있었어요"],["질문을 합니다","질문합니다"],["실수를 하다니","실수하다니"]])
    t(`same: ${a} ≈ ${b}`,heq(a,b));
  for(const [a,b] of [["사과를 한 개 샀다","사과 한 개 샀다"],["사과를 하나 샀다","사과 하나 샀다"],["고통을 함께 나눴다","고통 함께 나눴다"],["이를 해결하고자","이 해결하고자"],
    ["하루를 하루같이","하루 하루같이"],["할머니를 할머니라","할머니 할머니라"],["책을 해외로","책 해외로"],["예약을 해야 자리를 보장받을 수 있어요","예약해야 자리가 보장돼요"],["예약을 해야","예약이 해야"],["친구를 하루 종일 기다렸다","친구 하루 종일 기다렸다"],["사과를 할머니께 드렸다","사과 할머니께 드렸다"],["돈을 합쳐서","돈 합쳐서"]])
    t(`different: ${a} ≠ ${b}`,!heq(a,b));
  const Jh=(id,si,u)=>T3.judgeAs("sent",{id,si,fi:0},u);
  let rr=Jh("aya",1,"예약해야 자리를 보장받을 수 있어요."); t("MUST PASS gd:aya#1 「예약해야 자리를 보장받을 수 있어요.」",!!rr,JSON.stringify(rr));
  rr=Jh("aya",1,"예약해야 자리를 보장받을 수 있다."); t("MUST PASS gd:aya#1 「예약해야 자리를 보장받을 수 있다.」 (hada + register)",!!rr,JSON.stringify(rr));
  rr=Jh("aya",1,"예약해야 자리가 보장돼요."); t("gd:aya#1 「예약해야 자리가 보장돼요.」 stays wrong locally (AI's job)",!rr,JSON.stringify(rr));
  rr=Jh("kkabwa",0,"늦을까 봐 택시를 불렀어요."); t("gd:kkabwa#0 「택시를 불렀어요」 stays wrong locally (AI's job)",!rr,JSON.stringify(rr));
  // cross-match with fold + register across all drill sentences
  const Ds=JSON.parse(fs.readFileSync(SITE+"/grammar/grammar.json","utf8"));
  const S=[...new Set(Ds.items.flatMap(it=>(it.prac||[]).concat(it.ex||[]).map(e=>e.ko).filter(k=>k&&!/…|\.\.\./.test(k))))].map(T3.norm);
  let col=[];for(let i=0;i<S.length;i++)for(let j=i+1;j<S.length;j++)if(T3.sameAns(S[i],S[j]))col.push(S[i]+" ⇔ "+S[j]);
  col.forEach(x=>console.log("  collide:",x));
  t(`cross-match ${S.length} drill sentences (fold+register): only the 2 known register twins`,col.length===2,col.length+" collisions");
  // ---- AI verdict post-check (ai.js verify) ----
  console.log("\n=== AI verdict post-check ===");
  const C=makeCtx(false); vm.runInContext(fs.readFileSync(SITE+"/assets/ai.js","utf8"),C); await C.TopikGrammar._t.ensure();
  const V=(res,p)=>C.TopikAI.verify(JSON.parse(JSON.stringify(res)),p,C.TopikGrammar._t.sameAns);
  let v=V({correct:false,errors:[{wrong:"자리를",right:"자리를",why:"x"}],corrected:"예약해야 자리를 보장받을 수 있어요",tip:""},{type:"sent",user:"예약해야 자리가 보장돼요."});
  t("aya#1: quoted fragment 「자리를」 not in answer → flipped correct",v.correct&&v.flipped==="nofrag",JSON.stringify(v));
  v=V({correct:false,errors:[{wrong:"택시를 불렀어요",right:"택시를 탔어요",why:"x"}],corrected:"늦을까 봐 택시를 탔어요.",tip:""},{type:"sent",user:"늦을까 봐 택시를 불렀어요."});
  t("kkabwa#0: real fragment but different corrected → stays wrong (prompt handles synonyms)",!v.correct,JSON.stringify(v));
  v=V({correct:false,errors:[{wrong:"택시를불렀어요",right:"x",why:"x"}],corrected:"늦을까 봐 택시를 불렀다",tip:""},{type:"sent",user:"늦을까 봐 택시를 불렀어요."});
  t("corrected equals answer up to speech level → flipped correct",v.correct&&v.flipped==="same",JSON.stringify(v));
  v=V({correct:false,errors:[{wrong:"예약을 해야",right:"x",why:"x"}],corrected:"예약을 해야 자리를 보장받을 수 있어요",tip:""},{type:"sent",user:"예약을 해야 자리를 보장받을 수 있어요"});
  t("corrected identical → flipped correct",v.correct&&v.flipped==="same");
  v=V({correct:false,errors:[{wrong:"예약 을해야",right:"x",why:"x"}],corrected:"예약해야 자리를 보장받을 수 있어요",tip:""},{type:"sent",user:"예약을 해야 자리를 보장받을 수 있어요."});
  t("corrected equal via N을 하다 fold → flipped correct (fragment matched ignoring spaces)",v.correct&&v.flipped==="same",JSON.stringify(v));
  v=V({correct:false,errors:[{wrong:"책이",right:"책을",why:"x"}],corrected:"나는 책을 읽었다",tip:""},{type:"sent",user:"나는 책이 읽었다"});
  t("real particle error → stays wrong",!v.correct&&v.errors.length===1);
  v=V({correct:false,errors:[{wrong:"",right:"x",why:"x"}],corrected:"",tip:""},{type:"sent",user:"아무거나"});
  t("empty fragment → flipped correct",v.correct&&v.flipped==="nofrag");
  v=V({correct:false,errors:[{wrong:"갔을걸요",right:"갔을 거예요",why:"x"}],corrected:"을 거예요",tip:""},{type:"fill",sentence:"민수 씨는 아마 벌써 집에 갔＿＿.",user:"을걸요"});
  t("fill: fragment quoted from the filled-in sentence counts → stays wrong",!v.correct);
  v=V({correct:true,errors:[{wrong:"없는말",right:"x",why:"x"}],corrected:"",tip:""},{type:"sent",user:"아무거나"});
  t("correct=true untouched",v.correct&&!v.flipped&&v.errors.length===1);
  // ---- teacher-accepted answers always match (regression: gd:geodeun#0) ----
  console.log("\n=== teacher-accepted answers ===");
  const TA4=makeCtx(true), T4=TA4.TopikGrammar._t; await T4.ensure();
  const isAlt=r=>!!(r&&typeof r==="object"&&r.a&&!r.reg&&!r.aimem);
  for(const u of ["준비를 끝내거든 알려 주세요.","준비를 끝내거든 알려 주세요","준비를 끝내거든 알려주세요"]){
    const r=T4.judgeAs("sent",{id:"geodeun",si:0,fi:0},u); t(`gd:geodeun#0 「${u}」 → teacher-accepted`,isAlt(r),JSON.stringify(r));
  }
  const ACCJ=JSON.parse(fs.readFileSync(SITE+"/accepted.json","utf8")).cards; let scan=0, scanBad=[];
  for(const [id,e] of Object.entries(ACCJ)){
    let mode,card;
    if(id.startsWith("gd:")){const [g,si]=id.slice(3).split("#");mode="sent";card={id:g,si:+si,fi:0}}
    else if(id.startsWith("gc:")){const [g,fi]=id.slice(3).split("#");mode=fi===undefined?"zh2ko":"fill";card={id:g,si:0,fi:fi===undefined?0:+fi}}
    else continue;
    for(const x of e.alts) for(const u of [x.a, x.a.replace(/[.!?。．！？]+\s*$/,"")]){scan++; const r=T4.judgeAs(mode,card,u); if(!isAlt(r)) scanBad.push(id+" 「"+u+"」 → "+JSON.stringify(r))}
  }
  scanBad.forEach(x=>console.log("  ✘",x));
  t(`scan: all accepted gd:/gc: texts pass as teacher-accepted, with and without final punctuation (${scan} checks)`,scanBad.length===0,scanBad.length+" failed");
  // ---- stale page: accepted.json changes while the page stays open ----
  console.log("\n=== accepted.json refresh while page stays open ===");
  let accBody={version:1,cards:{}}, failNext=false, nFetch=0;
  const ls2={}, C2={console,Promise,setTimeout,clearTimeout,Date,localStorage:{getItem:k=>ls2[k]??null,setItem:(k,v)=>{ls2[k]=String(v)}},document:{getElementById:()=>null},
    fetch:u=>{const f=u.split("?")[0]; if(f==="accepted.json"){nFetch++; if(failNext){failNext=false;return Promise.reject(new TypeError("offline"))} return Promise.resolve({ok:true,json:()=>Promise.resolve(JSON.parse(JSON.stringify(accBody)))})}
      return Promise.resolve({ok:true,json:()=>Promise.resolve(JSON.parse(fs.readFileSync(path.join(SITE,f),"utf8")))})}};
  C2.window=C2; vm.createContext(C2);
  vm.runInContext(fs.readFileSync(SITE+"/assets/accepted.js","utf8"),C2); vm.runInContext(fs.readFileSync(SITE+"/grammar/grammar.js","utf8"),C2);
  const T5=C2.TopikGrammar._t; await T5.ensure();
  const J5=u=>T5.judgeAs("sent",{id:"geodeun",si:0,fi:0},u);
  t("page opened before the alt existed → not accepted yet",!J5("준비를 끝내거든 알려 주세요"));
  accBody={version:1,cards:{"gd:geodeun#0":ACCJ["gd:geodeun#0"]}};
  await C2.TopikAcc.refresh(60000); t("refresh within 60 s does not refetch",!J5("준비를 끝내거든 알려 주세요"));
  await C2.TopikAcc.refresh(0); t("refresh when stale picks up the new alt",isAlt(J5("준비를 끝내거든 알려 주세요")));
  failNext=true; await C2.TopikAcc.refresh(0); t("a failed refresh keeps the existing accepted answers",isAlt(J5("준비를 끝내거든 알려 주세요")));
  console.log(`\n${fails?fails+" FAILED":"ALL PASSED"}`); process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2)});
