// node tools/reading_src/parse_exam_r.js <dir> 35 36 ...  →  tools/reading_src/official/{n}.json
// 输入：topik.go.kr「토픽 기출문제 풀어보기」官方读解题目脚本 https://www.topik.go.kr/asset/exam/exam{n}/exam_{n}_2_r.js
//（题干/文章 HTML、四个选项、<보기>、正答 ca；图片题的图在 /asset/exam/exam{n}/images/{exam_url}_{qno}.png）
const fs=require("fs"),path=require("path");const dir=process.argv[2];
for(const n of process.argv.slice(3)){
  const out={round:+n,groups:[],qs:{}};let cur=null;
  const DE=function(type,title,sample,a1,a2,a3,a4,end){cur={title:String(title||""),sample:String(sample||""),opts:[a1,a2,a3,a4],end:+end||0,qs:[]};out.groups.push(cur)};
  const DX=function(qno,type,title,qq,a1,a2,a3,a4,e1,e2,e3,e4,imgTitle){out.qs[qno]={n:qno,type:type,title:String(title||""),qq:String(qq||""),opts:[a1,a2,a3,a4].map(x=>String(x==null?"":x)),imgTitle:imgTitle||"",g:out.groups.length-1};cur.qs.push(qno)};
  const src=fs.readFileSync(path.join(dir,`exam_${n}_2_r.js`),"utf8");
  const r=new Function("Display_Example","Display_Exam","img_url",src+";return {ca:ca,exam_url:exam_url,title:Display_Exam_Title};")(DE,DX,"IMG");
  const ca=r.ca.split(",").map(Number);
  for(const q of Object.values(out.qs)) q.ans=ca[q.n-1]-1;
  out.exam_url=r.exam_url;out.title=r.title;out.ca=ca;
  fs.writeFileSync(path.join(__dirname,"official",`${n}.json`),JSON.stringify(out,null,1));
  console.log(n,Object.keys(out.qs).length,"qs",ca.length,"ans",r.exam_url,"img:",Object.values(out.qs).filter(q=>q.title=="img").map(q=>q.n).join(","));
}
