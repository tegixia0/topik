/* node tools/test_sync_merge.js —— assets/sync.js 合并逻辑的测试 */
const S=require("../assets/sync.js"), assert=require("assert");
let n=0; function t(name,f){f();n++;console.log("ok -",name)}
const M=(k,b,l,r,lw)=>S.mergeKey(k,b,l,r,lw);

t("单词错题本：两边各加不同的词 → 并集；同一词计数取大",()=>{
  const l={"v|가다":{t:"v",ko:"가다",zh:"去",m:{v_zh_ko:2},last:100},"v|오다":{t:"v",ko:"오다",m:{v_zh_ko:1},last:50}};
  const r={"v|가다":{t:"v",ko:"가다",zh:"去",m:{v_zh_ko:1,v_ko_zh:1},last:200},"v|보다":{t:"v",ko:"보다",m:{v_ko_zh:1},last:70}};
  const m=M("topik.wrong.v1",undefined,l,r,true);
  assert.deepStrictEqual(Object.keys(m).sort(),["v|가다","v|보다","v|오다"]);
  assert.deepStrictEqual(m["v|가다"].m,{v_zh_ko:2,v_ko_zh:1}); assert.strictEqual(m["v|가다"].last,200);
});
t("单词错题本：本机答对移出（删除），云端没改 → 删除同步过去；不会被复活",()=>{
  const b={"v|가다":{m:{v_zh_ko:1},last:1},"v|오다":{m:{v_zh_ko:1},last:1}};
  const l={"v|오다":{m:{v_zh_ko:1},last:1}};
  const r=JSON.parse(JSON.stringify(b)); r["v|새"]={m:{v_zh_ko:1},last:5};
  const m=M("topik.wrong.v1",b,l,r,true);
  assert.deepStrictEqual(Object.keys(m).sort(),["v|새","v|오다"]);
});
t("清空错题本：另一台没改 → 清空同步；另一台同时加了新错题 → 新的保留",()=>{
  const b={"v|a":{m:{x:1},last:1}};
  assert.deepStrictEqual(M("topik.wrong.v1",b,{},b,true),{});
  const r={"v|a":{m:{x:1},last:1},"v|b":{m:{x:1},last:9}};
  assert.deepStrictEqual(Object.keys(M("topik.wrong.v1",b,{},r,true)),["v|b"]);
});
t("一边删、一边改同一条 → 保留（不丢数据）",()=>{
  const b={"v|a":{m:{x:1},last:1}}, r={"v|a":{m:{x:2},last:9}};
  assert.deepStrictEqual(M("topik.wrong.v1",b,{},r,true),r);
});
t("词库 SRS：同一个词取较近复习的一边，计数取大，首次日期取早",()=>{
  const l={opt:{n:50,src:"hf",mode:"zh2ko",tab:"daily"},w:{"가다":{s:3,n:5,ok:4,bad:1,f:"2026-09-01",l:"2026-10-08",d:"2026-10-15"}},days:{"2026-10-08":{nw:["가다"],done:["가다"],src:"hf"}}};
  const r={opt:{n:50,src:"hf",mode:"zh2ko",tab:"prog"},w:{"가다":{s:0,n:4,ok:3,bad:1,f:"2026-08-30",l:"2026-10-09",d:"2026-10-10"},"오다":{s:1,n:1,ok:1,bad:0,f:"2026-10-09",l:"2026-10-09",d:"2026-10-10"}},days:{"2026-10-08":{nw:["가다","오다"],done:["오다"],src:"hf"},"2026-10-09":{nw:[],done:["가다"],src:"hf"}}};
  const m=M("topik.bank.v1",undefined,l,r,true);
  assert.deepStrictEqual(m.w["가다"],{s:0,n:5,ok:4,bad:1,f:"2026-08-30",l:"2026-10-09",d:"2026-10-10"});
  assert.ok(m.w["오다"]);
  assert.deepStrictEqual(m.days["2026-10-08"].nw,["가다","오다"]);
  assert.deepStrictEqual(m.days["2026-10-08"].done,["가다","오다"]);
  assert.ok(m.days["2026-10-09"]);
  assert.strictEqual(m.opt.tab,"daily");   // 标量冲突：本机较新
  assert.strictEqual(M("topik.bank.v1",undefined,l,r,false).opt.tab,"prog");
});
t("写作自评 marks：同一题取 t 较新",()=>{
  const l={marks:{q1:{a:"none",t:10},q2:{a:"full",b:"full",t:5}}}, r={marks:{q1:{a:"full",b:"part",t:20},q3:{a:"part",t:1}}};
  const m=M("topik.writing.v1",undefined,l,r,true);
  assert.deepStrictEqual(m.marks.q1,{a:"full",b:"part",t:20}); assert.ok(m.marks.q2&&m.marks.q3);
});
t("阅读：作答取较新，错题计数取大",()=>{
  const l={a:{x:{c:1,ok:false,t:5,show:true}},w:{x:2}}, r={a:{x:{c:2,ok:true,t:9,show:true},y:{c:0,ok:true,t:1,show:false}},w:{x:1,z:1}};
  const m=M("topik.reading.v1",undefined,l,r,true);
  assert.strictEqual(m.a.x.c,2); assert.deepStrictEqual(m.w,{x:2,z:1}); assert.ok(m.a.y);
});
t("听力：作答取 t 较新；错题 {n,c,last,tag} 取 last 较新、n 取大；本机移出错题本会传播",()=>{
  const l={a:{"96-1":{c:1,ok:false,t:5},"83-2":{c:0,ok:true,t:3}},w:{"96-1":{n:2,c:1,last:5,tag:"para"}}};
  const r={a:{"96-1":{c:0,ok:true,t:9}},w:{"96-1":{n:1,c:3,last:7,tag:""},"83-5":{n:1,c:2,last:2}}};
  const m=M("topik.listening.v1",undefined,l,r,true);
  assert.deepStrictEqual(m.a["96-1"],{c:0,ok:true,t:9}); assert.ok(m.a["83-2"]);
  assert.deepStrictEqual(m.w["96-1"],{n:2,c:3,last:7,tag:""}); assert.ok(m.w["83-5"]);
  assert.ok(S.eq(M("topik.listening.v1",m,m,m,true),m));
  const b={a:{},w:{"83-5":{n:1,c:2,last:2},"96-3":{n:1,c:0,last:1}}}, l2={a:{},w:{"96-3":{n:1,c:0,last:1}}}, r2={a:{"96-9":{c:2,ok:true,t:4}},w:{"83-5":{n:1,c:2,last:2},"96-3":{n:1,c:0,last:1}}};
  assert.deepStrictEqual(M("topik.listening.v1",b,l2,r2,false),{a:{"96-9":{c:2,ok:true,t:4}},w:{"96-3":{n:1,c:0,last:1}}});
  assert.ok(!S.KEYS["topik.listening.opt.v1"]);
});
t("阅读上次模拟成绩：取 t 较新",()=>{
  assert.strictEqual(M("topik.reading.last",undefined,{round:96,score:60,t:1},{round:91,score:70,t:2},true).round,91);
});
t("语法分类练进度：取 lastAt 较新，seen 取大",()=>{
  const m=M("topik.grammar.drill.v1",undefined,{c1:{seen:12,lastOk:3,lastN:10,lastAt:5}},{c1:{seen:8,lastOk:9,lastN:10,lastAt:7}},true);
  assert.deepStrictEqual(m.c1,{seen:12,lastOk:9,lastN:10,lastAt:7});
});
t("语法错题本 {n,last}：并集，计数取大；本机答对删除传播",()=>{
  const b={g1:{n:1,last:1},g2:{n:2,last:2}}, l={g2:{n:2,last:2},g3:{n:1,last:3}}, r={g1:{n:1,last:1},g2:{n:3,last:4}};
  assert.deepStrictEqual(M("topik.grammar.wrong.v1",b,l,r,true),{g2:{n:3,last:4},g3:{n:1,last:3}});
});
t("AI 判对记住的写法：按写法 a 去重并集",()=>{
  const m=M("topik.grammar.aiAccepted.v1",undefined,{g1:[{a:"A",at:1},{a:"B",at:3}]},{g1:[{a:"A",at:2},{a:"C",at:2}],g2:[{a:"D",at:1}]},true);
  assert.deepStrictEqual(m.g1.map(x=>x.a),["A","C","B"]); assert.ok(m.g2);
});
t("51·52 AI 记录：entries 并集去重、按时间排序",()=>{
  const e=(q,k,at)=>({q,k,at,try:1,ai:true});
  const m=M("topik.writing.ai.v1",undefined,{v:1,entries:[e("a","a",1),e("a","b",1),e("c","a",5)]},{v:1,entries:[e("a","a",1),e("a","b",1),e("b","a",3)]},true);
  assert.deepStrictEqual(m.entries.map(x=>x.q+x.at),["a1","a1","b3","c5"]);
});
t("53·54 AI 批改：每题 attempts 并集，最多 40",()=>{
  const A=(at)=>({ai:true,at,essay:"글"+at});
  const l={v:1,attempts:{q:Array.from({length:30},(_,i)=>A(i*2))}}, r={v:1,attempts:{q:Array.from({length:30},(_,i)=>A(i*2+1)),p:[A(1)]}};
  const m=M("topik.w54.ai.v1",undefined,l,r,true);
  assert.strictEqual(m.attempts.q.length,40); assert.strictEqual(m.attempts.q[39].at,59); assert.ok(m.attempts.p);
});
t("只有一边改了 → 原样采用（包括计数减少）",()=>{
  const b={c:{n:3,t:1}}, l={c:{n:2,t:1}};
  assert.deepStrictEqual(M("topik.wg.wrong.v1",b,l,b,true),l);
  assert.deepStrictEqual(M("topik.wg.wrong.v1",b,b,l,true),l);
});
t("key 只在一边存在 → 采用存在的一边；都没有 → undefined",()=>{
  assert.deepStrictEqual(M("topik.w54.wrong.v1",undefined,undefined,{a:{n:1}},true),{a:{n:1}});
  assert.strictEqual(M("topik.w54.wrong.v1",undefined,undefined,undefined,true),undefined);
});
t("合并结果稳定：再合并一次不变（不会来回改）",()=>{
  const l={a:{x:{c:1,ok:false,t:5}},w:{x:2}}, r={a:{x:{c:2,ok:true,t:9}},w:{z:1}};
  const m=M("topik.reading.v1",undefined,l,r,true);
  assert.ok(S.eq(M("topik.reading.v1",m,m,m,true),m));
  assert.ok(S.eq(M("topik.reading.v1",undefined,m,r,true),m));
});
t("不同步的 key：Key/Token/界面偏好",()=>{
  ["topik.ai.deepseek.key","topik.sync.token","topik.sync.gist","topik.view","topik.mode","topik.ai.on","topik.reading.mock.v1"].forEach(k=>assert.ok(!S.KEYS[k],k));
});
console.log(n+" tests passed");
