import fs from 'node:fs';
import vm from 'node:vm';
import http from 'node:http';
import {spawn} from 'node:child_process';

const source=fs.readFileSync('app.js','utf8');
const cleanSec=source.slice(source.indexOf('const clean='), source.indexOf('function loadStore'));
const scoreStart=source.indexOf('function scoreObj(x)');
const normStart=source.indexOf('function canonicalId');
const scoreFn=source.slice(source.indexOf('function scoreParts'), source.indexOf('function scoreObj(x)')) + source.slice(scoreStart, source.indexOf("window.addEventListener"));
const normFns=source.slice(normStart, source.indexOf('function scoreObj(x)'));
const ctx={}; vm.createContext(ctx); vm.runInContext(`${cleanSec}\n${normFns}\n${scoreFn}`,ctx);
const run=(p)=>vm.runInContext(`normalizeMatches(${JSON.stringify(p)})`,ctx);

const payload={status:'success',data:[
  {match_id:'wi-live',teams:['West Indies','India'],status:'live',matchStarted:true,matchEnded:false,dateTimeGMT:'2026-10-01T07:00:00Z',score:[{r:102,w:2,o:15.4,inning:'West Indies Inning 1'}]},
  {match_id:'wi-recent',teams:['India','West Indies'],status:'India won by 8 wickets',matchStarted:true,matchEnded:false,dateTimeGMT:'2026-09-30T10:00:00Z',score:[{r:406,w:2,o:28.3,inning:'India Inning 1'},{r:405,w:7,o:50,inning:'West Indies Inning 1'}]},
  {match_id:'up',teams:['India','West Indies'],status:'Match starts at 7 PM',matchStarted:false,matchEnded:false,dateTimeGMT:'2026-10-03T13:30:00Z'}
]};
const rows=run(payload);
if(rows.length!==3) throw Error('Expected 3 normalized matches');
if(rows.find(x=>x.id==='wi-live')?.kind!=='live') throw Error('Live match classification failed');
if(rows.find(x=>x.id==='wi-recent')?.kind!=='completed') throw Error('Recent result classification failed');
if(rows.find(x=>x.id==='up')?.kind!=='upcoming') throw Error('Upcoming classification failed');
if(rows.find(x=>x.kind==='completed')?.teams?.[0]?.name!=='India') throw Error('Recent team parsing failed');
if(!rows.find(x=>x.kind==='completed')?.result.toLowerCase().includes('won by 8 wickets')) throw Error('Recent result text failed');
const order=rows.map(x=>x.kind).join(',');
if(order!=='live,upcoming,completed') throw Error('Global sort not as expected');

const payload2={data:[],results:[{id:'r2',team1:{name:'Australia'},team2:{name:'England'},status:'Match drawn',dateTimeGMT:'2026-09-29T12:00:00Z'}]};
const r2=run(payload2);
if(r2.length!==1||r2[0].kind!=='completed') throw Error('Results bucket parse failed');
const futureWithOldScore=run({data:[{id:'future',teams:['A','B'],status:'Starts at 8 PM',matchStarted:false,dateTimeGMT:'2099-10-01T12:00:00Z',score:[{r:1,w:0,o:0.1,inning:'A Inning 1'}]}]});
if(futureWithOldScore[0].kind!=='upcoming') throw Error('Upcoming misclassified from score presence');
console.log('PASS V10 normalization: live + recent + upcoming + results bucket');

const wait=ms=>new Promise(r=>setTimeout(r,ms));
const req=(url)=>new Promise((resolve,reject)=>http.get(url,res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:b}))}).on('error',reject));
const provider=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://127.0.0.1');
  res.setHeader('content-type','application/json');
  if(u.pathname==='/v1/cricScore') return res.end(JSON.stringify(payload));
  if(u.pathname==='/v1/currentMatches') return res.end(JSON.stringify({status:'success',data:payload.data.filter(x=>x.status==='live')}));
  res.statusCode=404;res.end(JSON.stringify({status:'failure',message:'not found'}));
});
await new Promise(r=>provider.listen(0,r));
const pp=provider.address().port;
const env={...process.env,PORT:'8110',CRICKETDATA_API_KEY:'test-key',CRICKETDATA_BASE_URL:`http://127.0.0.1:${pp}/v1`,CRICKETDATA_FREE_ONLY:'1',CRICKET_MATCH_TTL_MS:'60000'};
const app=spawn(process.execPath,['server.mjs'],{cwd:process.cwd(),env,stdio:['ignore','pipe','pipe']});
await wait(600);
let failures=0;
async function check(name,fn){try{await fn();console.log('PASS',name)}catch(e){failures++;console.error('FAIL',name,e.message)}}
await check('health configured',async()=>{const r=await req('http://127.0.0.1:8110/api/health');const j=JSON.parse(r.body);if(r.status!==200||!j.providerConfigured)throw Error('health failed')});
await check('cricScore feed',async()=>{const r=await req('http://127.0.0.1:8110/api/cricket?type=matches');const j=JSON.parse(r.body);if(r.status!==200||j.data.length!==3)throw Error('cricScore feed failed')});
await check('cache HIT',async()=>{const r=await req('http://127.0.0.1:8110/api/cricket?type=matches');if(r.headers['x-cricket-cache']!=='HIT')throw Error('cache not HIT')});
await check('current endpoint',async()=>{const r=await req('http://127.0.0.1:8110/api/cricket?type=current');if(r.status!==200)throw Error('current endpoint failed')});
await check('key file blocked',async()=>{const r=await req('http://127.0.0.1:8110/api-key.js');if(r.status!==403)throw Error('api-key file exposed')});
app.kill();provider.close();
if(failures)process.exit(1);
console.log('PASS V10 server API tests');
