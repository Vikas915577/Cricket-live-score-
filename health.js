import fs from 'node:fs';
import path from 'node:path';
const FILE_KEY = (()=>{try{const s=fs.readFileSync(path.join(process.cwd(),'api-key.js'),'utf8');const m=s.match(/CRICKETDATA_API_KEY\s*=\s*['\"]([^'\"]*)['\"]/);return String(m?.[1]||'').trim()}catch{return ''}})();
export default async function handler(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Access-Control-Allow-Origin','*');
  const key=String(process.env.CRICKETDATA_API_KEY||FILE_KEY||'').trim();
  const freeOnly=String(process.env.CRICKETDATA_FREE_ONLY ?? '1')!=='0';
  res.end(JSON.stringify({ok:true,provider:'CricketData',providerConfigured:Boolean(key),keySource:process.env.CRICKETDATA_API_KEY?'environment':FILE_KEY?'file':'none',freeOnly,time:new Date().toISOString(),matchTtlMs:Number(process.env.CRICKET_MATCH_TTL_MS||180000),detailTtlMs:Number(process.env.CRICKET_DETAIL_TTL_MS||900000)}));
}
