import fs from 'node:fs';
import path from 'node:path';
const FILE_KEY = (()=>{try{const s=fs.readFileSync(path.join(process.cwd(),'api-key.js'),'utf8');const m=s.match(/CRICKETDATA_API_KEY\s*=\s*['\"]([^'\"]*)['\"]/);return String(m?.[1]||'').trim()}catch{return ''}})();

const cache = globalThis.__cricketV10Cache || (globalThis.__cricketV8Cache = new Map());
const BASE = process.env.CRICKETDATA_BASE_URL || 'https://api.cricapi.com/v1';
const MATCH_TTL = Number(process.env.CRICKET_MATCH_TTL_MS || 180000);
const DETAIL_TTL = Number(process.env.CRICKET_DETAIL_TTL_MS || 900000);
const FREE_ONLY = String(process.env.CRICKETDATA_FREE_ONLY ?? '1') !== '0';

function getKey(){ return String(process.env.CRICKETDATA_API_KEY || FILE_KEY || '').trim(); }
function json(res,status,body,headers={}){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Access-Control-Allow-Origin','*');
  for(const [k,v] of Object.entries(headers)) res.setHeader(k,String(v));
  res.end(JSON.stringify(body));
}

async function provider(type,id=''){
  const key=getKey();
  if(!key){ const e=new Error('API key is not configured. Paste it into api-key.js or set CRICKETDATA_API_KEY.'); e.status=503; throw e; }
  if(type==='scorecard' && FREE_ONLY){
    const e=new Error('Detailed scorecard is disabled in Free API mode. Live score feed is active.');
    e.status=402;
    throw e;
  }
  const path = type==='scorecard' ? '/match_scorecard' : type==='current' ? '/currentMatches' : '/cricScore';
  const qs = new URLSearchParams({apikey:key,offset:'0'});
  if(type==='scorecard') qs.set('id',id);
  const r=await fetch(`${BASE}${path}?${qs}`,{headers:{Accept:'application/json'}});
  const text=await r.text();
  let data;
  try{ data=JSON.parse(text); }catch{ data={raw:text}; }
  if(!r.ok || data?.status==='failure' || data?.error){
    const e=new Error(data?.reason||data?.message||data?.error||`Provider request failed (${r.status})`);
    e.status=r.status>=400?r.status:502;
    throw e;
  }
  return data;
}

async function cached(type,id,force){
  const key=`${type}:${id}`;
  const ttl=type==='scorecard'?DETAIL_TTL:MATCH_TTL;
  const hit=cache.get(key);
  if(!force && hit && Date.now()-hit.at<ttl){
    return {...hit.data,__meta:{cached:true,stale:false,ageMs:Date.now()-hit.at}};
  }
  try{
    const data=await provider(type,id);
    cache.set(key,{at:Date.now(),data});
    return {...data,__meta:{cached:false,stale:false,ageMs:0}};
  }catch(e){
    if(hit) return {...hit.data,__meta:{cached:true,stale:true,ageMs:Date.now()-hit.at}};
    throw e;
  }
}

export default async function handler(req,res){
  if(req.method==='OPTIONS'){
    res.statusCode=204;
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers','Content-Type');
    return res.end();
  }
  if(req.method!=='GET') return json(res,405,{error:'Method not allowed'});
  const type=String(req.query?.type||'matches');
  const id=String(req.query?.id||'');
  const force=String(req.query?.refresh||'')==='1';
  if(!['matches','current','scorecard'].includes(type)) return json(res,400,{error:'Invalid type'});
  if(type==='scorecard'&&!id) return json(res,400,{error:'Match id is required'});
  try{
    const data=await cached(type,id,force);
    return json(res,200,data,{
      'X-Cricket-Cache':data.__meta?.cached?'HIT':'MISS',
      'X-Cricket-Stale':data.__meta?.stale?'1':'0',
      'X-Cricket-Source':BASE.includes('cricapi.com')?'CricketData':'Custom provider'
    });
  }catch(e){
    return json(res,Number(e.status)||502,{error:e.message||'Cricket API request failed'});
  }
}
