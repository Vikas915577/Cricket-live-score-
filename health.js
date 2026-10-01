import {CRICKETDATA_API_KEY as FILE_KEY} from '../api-key.js';
export default async function handler(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Access-Control-Allow-Origin','*');
  const key=String(process.env.CRICKETDATA_API_KEY||FILE_KEY||'').trim();
  const freeOnly=String(process.env.CRICKETDATA_FREE_ONLY ?? '1')!=='0';
  res.end(JSON.stringify({ok:true,provider:'CricketData',providerConfigured:Boolean(key),keySource:process.env.CRICKETDATA_API_KEY?'environment':FILE_KEY?'file':'none',freeOnly,time:new Date().toISOString(),matchTtlMs:Number(process.env.CRICKET_MATCH_TTL_MS||180000),detailTtlMs:Number(process.env.CRICKET_DETAIL_TTL_MS||900000)}));
}
