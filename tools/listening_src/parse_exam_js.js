// node tools/listening_src/parse_exam_js.js 83 <dir>  →  official_83.json
// 输入：topik.go.kr「토픽 기출문제 풀어보기」用的官方题目脚本 https://www.topik.go.kr/asset/exam/exam{n}/exam_{n}_2_h.js（含题干、选项、正答 ca）
const fs=require("fs"), path=require("path"); const n=process.argv[2], dir=process.argv[3]||"."; process.chdir(dir);
let src=fs.readFileSync(`exam_${n}_2_h.js`,"utf8");
const out={round:+n,groups:[],qs:{}}; let cur=null;
global.img_url="IMG"; 
global.Display_Example=function(type,title){cur={title:title.replace(/<[^>]+>/g,"").trim()};out.groups.push(cur)};
global.Display_Exam=function(qno,type,title,qq,a1,a2,a3,a4,e1,e2,e3,e4,imgTitle){
  out.qs[qno]={n:qno,instr:cur.title,stem:String(title||"").replace(/<[^>]+>/g,"").trim(),qq:qq||"",opts:[a1,a2,a3,a4],alts:[e1,e2,e3,e4].filter(x=>x!=null).length?[e1,e2,e3,e4]:null};
};
src=src.replace(/\bvar\s+/g,"global.__v=");
// simpler: evaluate in function scope
const f=new Function("Display_Example","Display_Exam","img_url",fs.readFileSync(`exam_${n}_2_h.js`,"utf8")+";return {ca:ca,mp3:Exam_mp3,exam_url:exam_url};");
const r=f(global.Display_Example,global.Display_Exam,"IMG");
const ca=r.ca.split(",").map(Number);
Object.values(out.qs).forEach(q=>{q.ans=ca[q.n-1]-1});
out.mp3=r.mp3; out.exam_url=r.exam_url;
fs.writeFileSync(path.join(__dirname,`official_${n}.json`),JSON.stringify(out,null,1));
console.log(n,Object.keys(out.qs).length,"qs",ca.length,"answers",out.mp3,out.exam_url);
