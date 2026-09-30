import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 8080);
const key = process.env.CRICLIVE_API_KEY || '';
const cache = new Map();
const TTL = { live: 180000, schedule: 43200000, scorecard: 900000, commentary: 900000 };

const mime = {
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json'
};
const send = (res,status,body,type='application/json; charset=utf-8') => { res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});res.end(type.startsWith('application/json')?JSON.stringify(body):body); };
const providerPaths = (type,id='') => ({
  live:['/api/v1/live-scores','/api/v1/cricket/live','/v1/matches/live'],
  schedule:['/api/v1/schedule','/api/v1/cricket/schedule','/v1/schedule'],
  scorecard:[`/api/v1/match/${encodeURIComponent(id)}/scorecard`,`/api/v1/cricket/match/${encodeURIComponent(id)}/scorecard`,`/v1/matches/${encodeURIComponent(id)}/scorecard`],
  commentary:[`/api/v1/match/${encodeURIComponent(id)}/commentary`,`/api/v1/cricket/match/${encodeURIComponent(id)}/commentary`,`/v1/matches/${encodeURIComponent(id)}/commentary`]
})[type];

async function providerFetch(type,id){
 if(!key) throw new Error('CRICLIVE_API_KEY is not configured.');
 let last;
 for(const p of providerPaths(type,id)){
   const r=await fetch(`https://cricketliveapi.com${p}`,{headers:{Authorization:`Bearer ${key}`,Accept:'application/json'}});
   const text=await r.text();let data={};try{data=JSON.parse(text)}catch{data={raw:text}};
   last={r,data};if(r.status!==404)return data;
 }
 if(last?.r) { const e=new Error(last.data?.message||`Provider error (${last.r.status})`);e.status=last.r.status;throw e; }
 throw new Error('Provider endpoint not found.');
}
async function cached(type,id){
 const k=`${type}:${id}`;const hit=cache.get(k);if(hit&&Date.now()-hit.at<TTL[type])return hit.data;const data=await providerFetch(type,id);cache.set(k,{at:Date.now(),data});return data;
}

const server=http.createServer(async (req,res)=>{
 try{
  const u=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  if(u.pathname==='/api/cricket'){
    const type=u.searchParams.get('type')||'live';const id=u.searchParams.get('id')||'';
    if(!TTL[type])return send(res,400,{error:'Invalid type'});
    if(['scorecard','commentary'].includes(type)&&!id)return send(res,400,{error:'Match id is required'});
    try{return send(res,200,await cached(type,id));}catch(e){return send(res,e.status||500,{error:e.message,hint:'Set CRICLIVE_API_KEY in your environment.'});}
  }
  const filePath=u.pathname==='/'?path.join(__dirname,'index.html'):path.join(__dirname,u.pathname.replace(/^\//,''));
  if(!filePath.startsWith(__dirname))return send(res,403,{error:'Forbidden'});
  const data=await fs.readFile(filePath);send(res,200,data,mime[path.extname(filePath)]||'application/octet-stream');
 }catch(e){send(res,404,{error:'Not found'});}
});
server.listen(port,()=>console.log(`Cricket Live Score running at http://localhost:${port}`));
