import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
async function readFileKey(){try{const s=await fs.readFile(path.join(__dirname,'api-key.js'),'utf8');const m=s.match(/CRICKETDATA_API_KEY\s*=\s*['\"]([^'\"]*)['\"]/);return String(m?.[1]||'').trim()}catch{return ''}}
let FILE_KEY=await readFileKey();
const port=Number(process.env.PORT||8080);
const BASE=process.env.CRICKETDATA_BASE_URL||'https://api.cricapi.com/v1';
const apiKey=String(process.env.CRICKETDATA_API_KEY||FILE_KEY||'').trim();
const FREE_ONLY=String(process.env.CRICKETDATA_FREE_ONLY ?? '1')!=='0';
const cache=new Map();
const ttl={matches:Number(process.env.CRICKET_MATCH_TTL_MS||180000),current:Number(process.env.CRICKET_MATCH_TTL_MS||180000),scorecard:Number(process.env.CRICKET_DETAIL_TTL_MS||900000)};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json'};
const send=(res,status,body,type='application/json; charset=utf-8',headers={})=>{res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':'*',...headers});res.end(type.startsWith('application/json')?JSON.stringify(body):body)};
async function provider(type,id=''){
  if(!apiKey){const e=new Error('API key is not configured. Paste it into api-key.js or set CRICKETDATA_API_KEY.');e.status=503;throw e}
  if(type==='scorecard'&&FREE_ONLY){const e=new Error('Detailed scorecard is disabled in Free API mode. Live score feed is active.');e.status=402;throw e}
  const p=type==='scorecard'?'/match_scorecard':type==='current'?'/currentMatches':'/cricScore';
  const qs=new URLSearchParams({apikey:apiKey,offset:'0'});if(type==='scorecard')qs.set('id',id);
  const r=await fetch(`${BASE}${p}?${qs}`,{headers:{Accept:'application/json'}});const text=await r.text();let data;try{data=JSON.parse(text)}catch{data={raw:text}}
  if(!r.ok||data?.status==='failure'||data?.error){const e=new Error(data?.reason||data?.message||data?.error||`Provider error (${r.status})`);e.status=r.status>=400?r.status:502;throw e}
  return data;
}
async function cached(type,id,force){const k=`${type}:${id}`,age=ttl[type]||ttl.matches,h=cache.get(k);if(!force&&h&&Date.now()-h.at<age)return{...h.data,__meta:{cached:true,stale:false,ageMs:Date.now()-h.at}};try{const data=await provider(type,id);cache.set(k,{at:Date.now(),data});return{...data,__meta:{cached:false,stale:false,ageMs:0}}}catch(e){if(h)return{...h.data,__meta:{cached:true,stale:true,ageMs:Date.now()-h.at}};throw e}}
const server=http.createServer(async(req,res)=>{try{const u=new URL(req.url,`http://${req.headers.host||'localhost'}`);if(req.method==='OPTIONS')return send(res,204,'','text/plain; charset=utf-8',{'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type'});
 if(u.pathname==='/api/health')return send(res,200,{ok:true,provider:'CricketData',providerConfigured:Boolean(apiKey),keySource:process.env.CRICKETDATA_API_KEY?'environment':FILE_KEY?'file':'none',freeOnly:FREE_ONLY,baseUrl:BASE==='https://api.cricapi.com/v1'?'official':'custom',time:new Date().toISOString(),matchTtlMs:ttl.matches,detailTtlMs:ttl.scorecard});
 if(u.pathname==='/api/cricket'){const type=u.searchParams.get('type')||'matches',id=u.searchParams.get('id')||'',force=u.searchParams.get('refresh')==='1';if(!['matches','current','scorecard'].includes(type))return send(res,400,{error:'Invalid type'});if(type==='scorecard'&&!id)return send(res,400,{error:'Match id is required'});try{const data=await cached(type,id,force);return send(res,200,data,'application/json; charset=utf-8',{'X-Cricket-Cache':data.__meta?.cached?'HIT':'MISS','X-Cricket-Stale':data.__meta?.stale?'1':'0'})}catch(e){return send(res,e.status||502,{error:e.message||'Cricket API request failed'})}}
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 const rel=u.pathname==='/'?'index.html':decodeURIComponent(u.pathname.replace(/^\//,''));
 if(rel==='api-key.js'||rel==='server.mjs'||rel.startsWith('api/'))return send(res,403,{error:'Forbidden'});
 const filePath=path.resolve(__dirname,rel);if(filePath!==__dirname&&!filePath.startsWith(__dirname+path.sep))return send(res,403,{error:'Forbidden'});const data=await fs.readFile(filePath);return send(res,200,data,mime[path.extname(filePath)]||'application/octet-stream');
 }catch(e){return send(res,404,{error:'Not found'})}});
server.listen(port,()=>console.log(`Cricket Live Score V10 running at http://localhost:${port}`));
