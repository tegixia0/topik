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
  console.log(`\n${fails?fails+" FAILED":"ALL PASSED"}`); process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2)});
