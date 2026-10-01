import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('app.js','utf8');
const section=(start,end)=>{const a=source.indexOf(start),b=source.indexOf(end,a); if(a<0||b<0) throw new Error('missing '+start); return source.slice(a,b)};
const cleanSec=section('const clean=', 'function loadStore');
const normalizeSec=section('function extractRows', 'function normalizeMatches') + section('function normalizeMatches', 'function normalizeTeams') + section('function normalizeTeams', 'function scoreParts');
const scoreSec=section('function scoreParts', 'function scoreObj') + section('function scoreObj', 'window.addEventListener');
const code=`${cleanSec}\n${scoreSec}\n${normalizeSec}`;
const ctx={};vm.createContext(ctx);vm.runInContext(code,ctx);
const run=(p)=>vm.runInContext(`normalizeMatches(${JSON.stringify(p)})`,ctx);
const r=run({status:'success',data:[
 {match_id:'done-1',team1:{name:'India'},team2:{name:'Australia'},status:'India won by 6 wickets',dateTimeGMT:'2026-10-01T08:00:00Z',score:[{r:180,w:4,o:19.2,inning:'India Inning 1'},{r:176,w:7,o:20,inning:'Australia Inning 1'}]},
 {match_id:'live-1',teams:['England','South Africa'],status:'live',matchStarted:true,matchEnded:false,dateTimeGMT:'2026-10-01T10:00:00Z',score:[{r:50,w:2,o:6,inning:'England Inning 1'}]},
 {match_id:'up-1',team1:{name:'Pakistan'},team2:{name:'New Zealand'},status:'Match starts at 6 PM',matchStarted:false,dateTimeGMT:'2026-10-01T18:00:00Z'}
]});
if(r.length!==3) throw new Error(`expected 3, got ${r.length}`);
if(r.find(x=>x.id==='done-1')?.kind!=='completed') throw new Error('completed result not recognized');
if(r.find(x=>x.id==='live-1')?.kind!=='live') throw new Error('live result broken');
if(r.find(x=>x.id==='up-1')?.kind!=='upcoming') throw new Error('upcoming result broken');
const r2=run({data:[],results:[{id:'recent-1',teams:['Middlesex','Essex'],status:'Essex won by 60 runs',dateTimeGMT:'2026-09-30T14:30:00Z'}]});
if(r2.length!==1 || r2[0].kind!=='completed') throw new Error('results bucket not parsed');
console.log('PASS recent-results normalization');
