import http from 'node:http';
import {spawn} from 'node:child_process';

const wait=ms=>new Promise(r=>setTimeout(r,ms));
function req(url){return new Promise((resolve,reject)=>{http.get(url,r=>{let s='';r.on('data',c=>s+=c);r.on('end',()=>resolve({status:r.statusCode,headers:r.headers,body:s}))}).on('error',reject)})}
const provider=http.createServer((req,res)=>{const u=new URL(req.url,'http://127.0.0.1');res.setHeader('Content-Type','application/json');if(u.pathname==='/v1/cricScore')return res.end(JSON.stringify({status:'success',data:[{id:'m1',match_id:'m1',teams:['India','Australia'],status:'live',venue:'Test Ground',format:'T20',score:[{r:121,w:3,o:14.2,inning:'India Inning 1'},{r:119,w:7,o:20,inning:'Australia Inning 1'}]}]}));if(u.pathname==='/v1/match_scorecard')return res.end(JSON.stringify({status:'success',data:{batting:[{name:'Batter One',runs:64,balls:41}],bowling:[{name:'Bowler One',wickets:2,overs:'4'}]}}));res.statusCode=404;res.end(JSON.stringify({status:'failure',message:'not found'}))});
await new Promise(r=>provider.listen(0,r));const pp=provider.address().port;const env={...process.env,PORT:'8098',CRICKETDATA_API_KEY:'test-key',CRICKETDATA_BASE_URL:`http://127.0.0.1:${pp}/v1`,CRICKETDATA_FREE_ONLY:'1',CRICKET_MATCH_TTL_MS:'60000',CRICKET_DETAIL_TTL_MS:'60000'};const app=spawn(process.execPath,['server.mjs'],{env,stdio:['ignore','pipe','pipe']});let out='';app.stdout.on('data',d=>out+=d);await wait(700);let failures=0;async function check(name,fn){try{await fn();console.log('PASS',name)}catch(e){failures++;console.error('FAIL',name,e.message)}}
await check('homepage',async()=>{const r=await req('http://127.0.0.1:8098/');if(r.status!==200||!r.body.includes('Cricket Live Score V8'))throw Error(`status ${r.status}`)});
await check('api key is configured',async()=>{const r=await req('http://127.0.0.1:8098/api/health');const j=JSON.parse(r.body);if(!j.providerConfigured||j.keySource!=='environment')throw Error('key config mismatch')});
await check('live feed',async()=>{const r=await req('http://127.0.0.1:8098/api/cricket?type=matches');const j=JSON.parse(r.body);if(r.status!==200||j.data?.[0]?.match_id!=='m1')throw Error('feed mismatch')});
await check('cache hit',async()=>{const r=await req('http://127.0.0.1:8098/api/cricket?type=matches');if(r.headers['x-cricket-cache']!=='HIT')throw Error('expected HIT')});
await check('free mode blocks premium scorecard',async()=>{const r=await req('http://127.0.0.1:8098/api/cricket?type=scorecard&id=m1');if(r.status!==402)throw Error(`expected 402 got ${r.status}`)});
await check('missing scorecard id',async()=>{const r=await req('http://127.0.0.1:8098/api/cricket?type=scorecard');if(r.status!==400)throw Error('expected 400')});
await check('invalid type',async()=>{const r=await req('http://127.0.0.1:8098/api/cricket?type=bad');if(r.status!==400)throw Error('expected 400')});
await check('api key file blocked',async()=>{const r=await req('http://127.0.0.1:8098/api-key.js');if(r.status!==403)throw Error(`expected 403 got ${r.status}`)});
await check('forced refresh',async()=>{const r=await req('http://127.0.0.1:8098/api/cricket?type=matches&refresh=1');if(r.headers['x-cricket-cache']!=='MISS')throw Error('expected MISS')});
app.kill();provider.close();if(failures)process.exit(1);console.log('ALL V8 ROUND-1 TESTS PASSED');
