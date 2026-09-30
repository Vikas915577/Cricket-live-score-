const demoMatches=[
{id:'demo-1',kind:'live',status:'LIVE',series:'Demo • Asia T20 Cup',venue:'Dubai International Stadium',teams:[{name:'India',score:'178/5',ov:'18.2'},{name:'Sri Lanka',score:'—',ov:'—'}],result:'Demo feed — connect API for real score',batters:[['Suryakumar Yadav','64','38'],['Rishabh Pant','31','22'],['Hardik Pandya','18','9']],bowlers:[['Wanindu Hasaranga','3/29','4'],['Matheesha Pathirana','1/34','4']],balls:[['4','Suryakumar','cover drive','4'],['1','Pant','single','1'],['6','Suryakumar','maximum over midwicket','6'],['W','Pant','caught at long-on','W']]},
{id:'demo-2',kind:'live',status:'LIVE',series:'Demo • T20 International',venue:'Melbourne Cricket Ground',teams:[{name:'Australia',score:'142/3',ov:'16.4'},{name:'England',score:'—',ov:'—'}],result:'Demo feed — connect API for real score',batters:[['Travis Head','72','44'],['Mitchell Marsh','41','29']],bowlers:[['Adil Rashid','1/26','4'],['Mark Wood','1/31','4']],balls:[['6','Head','straight hit','6'],['4','Marsh','pull shot','4'],['1','Head','quick single','1']]},
{id:'demo-3',kind:'upcoming',status:'UPCOMING',series:'Demo • India Tour',venue:'Narendra Modi Stadium, Ahmedabad',teams:[{name:'India',score:'—',ov:'—'},{name:'New Zealand',score:'—',ov:'—'}],result:'Demo fixture'},
{id:'demo-4',kind:'upcoming',status:'UPCOMING',series:'Demo • ODI Series',venue:'Newlands, Cape Town',teams:[{name:'South Africa',score:'—',ov:'—'},{name:'Pakistan',score:'—',ov:'—'}],result:'Demo fixture'},
{id:'demo-5',kind:'completed',status:'COMPLETED',series:'Demo • T20 International',venue:'Kensington Oval, Bridgetown',teams:[{name:'West Indies',score:'164/7',ov:'20'},{name:'Bangladesh',score:'151/9',ov:'20'}],result:'Demo result'},
{id:'demo-6',kind:'completed',status:'COMPLETED',series:'Demo • ODI Series',venue:'Perth Stadium',teams:[{name:'India',score:'287/8',ov:'50'},{name:'Australia',score:'279',ov:'49.3'}],result:'Demo result'}
];
let matches=[...demoMatches];

const players=[
{name:'Virat Kohli',team:'India',role:'Batter',runs:1864,avg:48.7,sr:93.2,wk:0},
{name:'Jasprit Bumrah',team:'India',role:'Bowler',runs:74,avg:10.5,sr:72.1,wk:38},
{name:'Suryakumar Yadav',team:'India',role:'Batter',runs:1284,avg:41.8,sr:171.2,wk:0},
{name:'Travis Head',team:'Australia',role:'Batter',runs:1498,avg:44.1,sr:164.7,wk:0},
{name:'Wanindu Hasaranga',team:'Sri Lanka',role:'All-rounder',runs:484,avg:27.6,sr:141.3,wk:46},
{name:'Ben Stokes',team:'England',role:'All-rounder',runs:965,avg:33.4,sr:137.8,wk:21}
];

const teams=[
{name:'India',p:8,w:6,l:2,nrr:'+1.42',pts:12},
{name:'Australia',p:8,w:5,l:3,nrr:'+0.86',pts:10},
{name:'England',p:8,w:4,l:4,nrr:'+0.18',pts:8},
{name:'Sri Lanka',p:8,w:4,l:4,nrr:'+0.02',pts:8},
{name:'New Zealand',p:8,w:3,l:5,nrr:'-0.31',pts:6},
{name:'Pakistan',p:8,w:2,l:6,nrr:'-0.88',pts:4}
];

const news=[
['Live data is now API-ready','This build connects through a server-side proxy so your cricket API key does not sit in the browser.','Now'],
['Match Centre','Open a live match to load scorecard and commentary from the provider when available.','Now'],
['Free API mode','The default integration uses CricLive API free tier; cache is used to reduce quota usage.','Now'],
['Fallback mode','If the API is missing or unavailable, the app stays usable with demo data instead of breaking.','Now']
];

let state={
  tab:'home',filter:'all',query:'',detailId:null,detailTab:'scorecard',dark:localStorage.getItem('cricket-dark')==='1',
  fav:JSON.parse(localStorage.getItem('cricket-fav')||'[]'),apiStatus:'checking',apiMessage:'Checking live cricket API…',lastApiUpdate:null,
  detailCache:{}
};
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=(s='')=>String(s).replace(/\s+/g,' ').trim();
function filteredMatches(){return matches.filter(m=>(state.filter==='all'||m.kind===state.filter)&&(!state.query||JSON.stringify(m).toLowerCase().includes(state.query.toLowerCase())));}
function ad(type='native'){return `<div class="ad ${type}">Advertisement • non-blocking placement</div>`}
function statusChip(){
  const text=state.apiStatus==='online'?'● LIVE API':state.apiStatus==='offline'?'● DEMO / OFFLINE':'● CHECKING API';
  const cls=state.apiStatus==='online'?'api-online':state.apiStatus==='offline'?'api-offline':'api-checking';
  return `<span class="api-chip ${cls}">${text}</span>`;
}
function matchCard(m){
return `<article class="match" data-match="${esc(m.id)}">
<div class="match-top"><span>${esc(m.series)}</span><span class="${m.kind==='live'?'live':m.kind==='upcoming'?'up':'done'}">${esc(m.status)}</span></div>
<div class="teams">${m.teams.map(t=>`<div class="team"><span class="team-name">${esc(t.name)}</span><span><b class="team-score">${esc(t.score)}</b> <span class="team-ov">${t.ov&&t.ov!=='—'?'('+esc(t.ov)+' ov)':''}</span></span></div>`).join('')}</div>
<div class="result">${esc(m.result)}</div><div class="venue">📍 ${esc(m.venue)}</div></article>`;
}
function nav(){return [['home','🏠','Home'],['matches','🏏','Matches'],['scorecards','📋','Scorecards'],['players','👤','Players'],['more','•••','More']];}
function render(){
document.body.className=state.dark?'dark':'';
let content='';
if(state.tab==='home') content=homePage();
else if(state.tab==='matches') content=matchesPage();
else if(state.tab==='scorecards') content=scorecardsPage();
else if(state.tab==='players') content=playersPage();
else content=morePage();
$('#app').innerHTML=`<main class="app">
<header class="top"><div class="brand"><div class="logo">🏏</div><div><h1>Cricket Live Score</h1><p>V4 • Real API integration</p></div></div><div class="actions"><div class="hide-mobile">${statusChip()}</div><button class="btn" data-action="refresh">↻ Refresh</button><button class="btn hide-mobile" data-action="notify">🔔</button><button class="btn icon" data-action="theme">${state.dark?'☀️':'🌙'}</button></div></header>
${content}</main><nav class="bottom">${nav().map(x=>`<button class="${state.tab===x[0]?'active':''}" data-tab="${x[0]}">${x[1]}<br>${x[2]}</button>`).join('')}</nav><div class="toast" id="toast"></div>
<div class="modal" id="modal"><div class="sheet" id="sheet"></div></div>`;
bind();
}

function homePage(){
const live=matches.filter(m=>m.kind==='live'), upcoming=matches.filter(m=>m.kind==='upcoming');
const sourceText=state.apiStatus==='online'?`API connected • ${state.lastApiUpdate?new Date(state.lastApiUpdate).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):'updated recently'}`:state.apiMessage;
return `<section class="hero card"><div class="hero-grid"><div><div class="eyebrow">LIVE CRICKET • MATCH CENTRE</div><h2>Real scores, one screen.</h2><p>Live matches, scorecards, commentary, players, tournaments, analytics and alerts. ${esc(sourceText)}</p><div class="hero-actions"><button class="btn primary" data-action="open-live">🔴 Open Live Match</button><button class="btn" data-tab="players">👤 Players</button><button class="btn" data-tab="more">🏆 Tournament</button></div></div><div class="hero-side">${live.slice(0,2).map(m=>`<div class="mini-live"><div class="row"><span>${esc(m.series)}</span><span class="live-dot">● LIVE</span></div><div class="row" style="margin-top:5px"><span>${esc(m.teams[0]?.name||'Team 1')}</span><span class="score">${esc(m.teams[0]?.score||'—')}</span></div><div class="row"><span>${esc(m.teams[1]?.name||'Team 2')}</span><span class="muted">${esc(m.teams[1]?.score||'—')}</span></div></div>`).join('')}</div></div></section>
<div class="api-panel"><div><b>${state.apiStatus==='online'?'🟢 Live API connected':'🟡 Demo fallback active'}</b><span class="muted">${esc(state.apiMessage)}</span></div><button class="btn" data-action="refresh">Refresh data</button></div>
<div class="section-head"><h2>📊 Today's snapshot</h2><span class="muted">${state.lastApiUpdate?`Last update ${new Date(state.lastApiUpdate).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`:'API check on startup'}</span></div>
<div class="stats-row"><div class="stat"><small>Live matches</small><b>${live.length}</b></div><div class="stat"><small>Upcoming</small><b>${upcoming.length}</b></div><div class="stat"><small>Players tracked</small><b>${players.length}</b></div><div class="stat"><small>News today</small><b>${news.length}</b></div></div>
<div class="layout"><div class="main-col">
<div class="section-head"><h2>🔴 Live Now</h2><span class="muted">Tap for Match Center</span></div><div class="grid">${live.length?live.map(matchCard).join(''):'<div class="card muted">No live matches right now.</div>'}</div>${ad('native')}
<div class="section-head"><h2>📅 Upcoming Matches</h2><span class="muted">Schedule</span></div><div class="grid">${upcoming.length?upcoming.map(matchCard).join(''):'<div class="card muted">No upcoming fixtures available.</div>'}</div>
<div class="section-head"><h2>📰 Cricket Feed</h2></div><div class="grid">${news.map(n=>`<article class="news"><h3>${esc(n[0])}</h3><p>${esc(n[1])}</p><time>${esc(n[2])}</time></article>`).join('')}</div>${ad('banner')}</div>
<aside class="side"><section class="card"><div class="section-head" style="margin-top:0"><h2>🏆 Points Table</h2><span class="muted">Demo</span></div>${tableHtml(teams.slice(0,5))}<button class="btn" style="width:100%;margin-top:8px" data-action="open-tournament">View tournament</button></section><section class="card"><div class="section-head" style="margin-top:0"><h2>🔥 Top Form</h2></div>${players.slice(0,4).map(p=>`<div class="player" data-player="${esc(p.name)}"><div class="avatar">${esc(p.name.split(' ').map(s=>s[0]).join(''))}</div><div class="player-info"><div class="player-name">${esc(p.name)}</div><div class="player-meta">${esc(p.role)} • ${p.runs} runs</div></div><span class="pill">${p.wk?`${p.wk} W`:`SR ${p.sr}`}</span></div>`).join('')}</section></aside></div>`;
}
function matchesPage(){
const list=filteredMatches();
return `<div class="toolbar"><div class="search"><input id="search" placeholder="Search team, series, venue" value="${esc(state.query)}"><button class="btn" data-action="clear">Clear</button></div></div>
<div class="chips">${[['all','All'],['live','🔴 Live'],['upcoming','📅 Upcoming'],['completed','✅ Completed']].map(c=>`<button class="btn chip ${state.filter===c[0]?'active':''}" data-filter="${c[0]}">${c[1]}</button>`).join('')}</div>
<div class="section-head"><h2>All Matches</h2><span class="muted">${list.length} found</span></div>${ad('banner')}<div class="grid">${list.length?list.map(matchCard).join(''):'<div class="card muted">No matches found.</div>'}</div>`;
}
function scorecardsPage(){
const list=matches.filter(m=>m.kind==='live'||m.kind==='completed');
return `<div class="section-head"><h2>📋 Match Center</h2><span class="muted">Open a match for API details</span></div><div class="grid">${list.length?list.map(matchCard).join(''):'<div class="card muted">No live/completed matches.</div>'}</div>${ad('native')}`;
}
function playersPage(){
return `<div class="toolbar"><div class="search"><input id="playerSearch" placeholder="Search player or team"></div></div>
<div class="section-head"><h2>👤 Player Center</h2><span class="muted">Profiles & performance</span></div><div class="grid">${players.map(p=>`<article class="player" data-player="${esc(p.name)}"><div class="avatar">${esc(p.name.split(' ').map(s=>s[0]).join(''))}</div><div class="player-info"><div class="player-name">${esc(p.name)}</div><div class="player-meta">${esc(p.team)} • ${esc(p.role)}</div></div><span class="pill">${p.wk?`${p.wk} W`:`${p.sr} SR`}</span><button class="fav" data-fav="${esc(p.name)}">${state.fav.includes(p.name)?'★':'☆'}</button></article>`).join('')}</div>`;
}
function morePage(){
return `<section class="card"><div class="eyebrow">BIG FEATURES</div><h2 style="margin:5px 0 3px">Cricket Hub</h2><p class="muted">Tournament center, analytics, alerts and a lightweight cricket assistant.</p></section>
<div class="grid3" style="margin-top:10px"><section class="card"><div class="kpi green">6</div><b>Teams tracked</b><div class="muted">Points table, NRR, fixtures</div></section><section class="card"><div class="kpi blue">12</div><b>Analytics blocks</b><div class="muted">UI ready for production feed</div></section><section class="card"><div class="kpi amber">4</div><b>Alert types</b><div class="muted">Toss, wicket, innings, result</div></section></div>
<div class="section-head"><h2>🏆 Tournament Center</h2></div><section class="card">${tableHtml(teams)}<div class="section-head"><h2>Fixtures</h2><span class="muted">latest local feed</span></div>${matches.slice(0,6).map(m=>`<div class="ball"><div><b>${esc(m.teams[0]?.name||'TBC')} vs ${esc(m.teams[1]?.name||'TBC')}</b><div class="muted">${esc(m.venue||'Venue TBC')}</div></div><span class="pill">${esc(m.status)}</span></div>`).join('')}</section>
${ad('native')}
<div class="section-head"><h2>📈 Advanced Analytics</h2></div><section class="card"><div class="bar-wrap"><div class="bar-row"><span>Batting power</span><div class="bar"><i style="width:78%"></i></div><b>78%</b></div><div class="bar-row"><span>Bowling control</span><div class="bar"><i style="width:65%"></i></div><b>65%</b></div><div class="bar-row"><span>Fielding</span><div class="bar"><i style="width:83%"></i></div><b>83%</b></div><div class="bar-row"><span>Death overs</span><div class="bar"><i style="width:72%"></i></div><b>72%</b></div></div><p class="muted">Illustrative analytics; only live score/scorecard/commentary are sourced from the API in V4.</p></section>
<div class="section-head"><h2>🤖 Cricket Assistant</h2></div><section class="card"><p class="muted">Ask a quick cricket question.</p><div class="search"><input id="ask" placeholder="e.g. India's live match?"><button class="btn primary" data-action="ask">Ask</button></div><div id="answer" class="muted" style="margin-top:9px">Try: “live matches”, “India next”, or “top players”.</div></section>`;
}
function tableHtml(rows){
return `<table class="table"><thead><tr><th>#</th><th>Team</th><th>Pts</th><th>NRR</th></tr></thead><tbody>${rows.map((t,i)=>`<tr><td>${i+1}</td><td><b>${esc(t.name)}</b></td><td>${t.pts}</td><td>${esc(t.nrr)}</td></tr>`).join('')}</tbody></table>`;
}
function openMatch(id){
state.detailId=id;state.detailTab='scorecard';renderModal();
}
function currentMatch(){return matches.find(x=>String(x.id)===String(state.detailId));}
function renderModal(){
const m=currentMatch();if(!m)return;
const p=m.batters||[],b=m.bowlers||[],balls=m.balls||[];
const score=m.teams?.[0]||{name:'Team 1',score:'—',ov:'—'};
const cache=state.detailCache[m.id]||{};
$('#sheet').innerHTML=`<div class="sheet-head"><div><b>${esc(m.series)}</b><div class="muted">${esc(m.venue)}</div></div><button class="close" data-action="close">✕</button></div>
<div class="scoreboard" style="margin-top:12px"><div><div class="muted">${esc(m.status)}</div><div class="big-score">${esc(score.name)} ${esc(score.score)}</div><div class="score-sub">${esc(m.result)}</div></div><div class="pill">${esc(m.teams?.[1]?.name||'Team 2')} ${esc(m.teams?.[1]?.score||'—')}</div></div>
<div class="formtabs">${[['scorecard','Scorecard'],['commentary','Commentary'],['stats','Stats']].map(x=>`<button class="btn ${state.detailTab===x[0]?'primary':''}" data-detail="${x[0]}">${x[1]}</button>`).join('')}</div>
${state.detailTab==='scorecard'?scorecardHtml(m,cache.scorecard):state.detailTab==='commentary'?commentaryHtml(m,cache.commentary):statsHtml(m)}${ad('native')}`;
$('#modal').classList.add('open');bindModal();
if(state.detailTab==='scorecard'&&!cache.scorecard&&String(m.id).indexOf('demo-')!==0) loadDetail('scorecard',m.id);
if(state.detailTab==='commentary'&&!cache.commentary&&String(m.id).indexOf('demo-')!==0) loadDetail('commentary',m.id);
}
function scorecardHtml(m,data){
const parsed=parseScorecard(data);
const p=parsed.batting.length?parsed.batting:m.batters||[];
const b=parsed.bowling.length?parsed.bowling:m.bowlers||[];
return `<div class="detail-grid"><section class="subcard"><h3>Batting</h3>${p.length?p.map(x=>scoreRow(x)).join(''):'<div class="muted">Scorecard data will load here when the provider returns batting details.</div>'}</section><section class="subcard"><h3>Bowling</h3>${b.length?b.map(x=>scoreRow(x,true)).join(''):'<div class="muted">Bowling data pending.</div>'}</section></div>${data?'<div class="source-note">✓ Scorecard loaded from cricket API</div>':''}`;
}
function scoreRow(x,bowling=false){
if(Array.isArray(x))return `<div class="score-line" style="padding:7px 0;border-bottom:1px solid var(--line)"><span>${esc(x[0])}</span><b>${esc(x[1])} <span class="muted">${esc(x[2]||'')}</span></b></div>`;
const name=x.name||x.player||x.batter||x.bowler||'Player';
const main=bowling?(x.wickets??x.w??x.overs??''): (x.runs??x.r??x.score??'');
const sub=bowling?(x.overs??x.o??x.economy??''):(x.balls??x.b??x.dismissal??'');
return `<div class="score-line" style="padding:7px 0;border-bottom:1px solid var(--line)"><span>${esc(name)}</span><b>${esc(main)} <span class="muted">${esc(sub)}</span></b></div>`;
}
function commentaryHtml(m,data){
const items=parseCommentary(data);
const fallback=m.balls||[];
return `<section class="subcard"><h3>Ball-by-ball</h3><div class="timeline">${items.length?items.map(x=>ballHtml(x)).join(''):fallback.length?fallback.map(x=>ballHtml(x)).join(''):'<div class="muted">Commentary data will load here when the provider returns ball-by-ball events.</div>'}</div></section>${data?'<div class="source-note">✓ Commentary loaded from cricket API</div>':''}`;
}
function ballHtml(x){
if(Array.isArray(x)) return `<div class="ball"><div class="ball-left"><div class="ball-badge">${esc(x[3]||x[0])}</div><div class="desc"><b>${esc(x[1]||'')}</b><div class="muted">${esc(x[2]||'')}</div></div></div><span class="val">${esc(x[3]||'')}</span></div>`;
const value=x.runs??x.score??x.result??x.event??'';
const batter=x.batter||x.striker||x.player||x.name||'';
const text=x.commentary||x.text||x.description||x.message||'';
const over=x.over||x.ball||'';
return `<div class="ball"><div class="ball-left"><div class="ball-badge">${esc(value||over||'•')}</div><div class="desc"><b>${esc(batter||'Ball event')}</b><div class="muted">${esc(text||over)}</div></div></div><span class="val">${esc(value)}</span></div>`;
}
function statsHtml(m){
return `<section class="subcard"><h3>Match Analytics</h3><div class="bar-wrap"><div class="bar-row"><span>Live score</span><div class="bar"><i style="width:88%"></i></div><b>API</b></div><div class="bar-row"><span>Commentary</span><div class="bar"><i style="width:${m.kind==='live'?82:48}%"></i></div><b>${m.kind==='live'?'ON':'—'}</b></div><div class="bar-row"><span>Data freshness</span><div class="bar"><i style="width:${state.apiStatus==='online'?76:22}%"></i></div><b>${state.apiStatus==='online'?'OK':'DEMO'}</b></div></div><p class="muted">No prediction or betting values are generated. This screen only visualizes provider data availability.</p></section>`;
}
function parseScorecard(data){
let root=data?.data||data?.scorecard||data||{};
const innings=root?.innings||root?.scores||root?.data?.innings||[];
const arr=Array.isArray(innings)?innings:[];
const batting=[];const bowling=[];
for(const inn of arr){
  const ba=inn?.batting||inn?.batsmen||inn?.batters||[];
  const bo=inn?.bowling||inn?.bowlers||[];
  if(Array.isArray(ba)) batting.push(...ba);
  if(Array.isArray(bo)) bowling.push(...bo);
}
if(!batting.length && Array.isArray(root?.batting)) batting.push(...root.batting);
if(!bowling.length && Array.isArray(root?.bowling)) bowling.push(...root.bowling);
return {batting,bowling};
}
function parseCommentary(data){
const root=data?.data||data||{};
const c=root?.commentary||root?.comments||root?.deliveries||root?.balls||root?.events||[];
return Array.isArray(c)?c:[];
}
function bind(){
document.querySelectorAll('[data-tab]').forEach(x=>x.onclick=()=>{state.tab=x.dataset.tab;render()});
document.querySelectorAll('[data-filter]').forEach(x=>x.onclick=()=>{state.filter=x.dataset.filter;render()});
document.querySelectorAll('[data-match]').forEach(x=>x.onclick=()=>openMatch(x.dataset.match));
document.querySelectorAll('[data-player]').forEach(x=>x.onclick=e=>{if(e.target.dataset.fav)return;playerDetail(x.dataset.player)});
document.querySelectorAll('[data-fav]').forEach(x=>x.onclick=e=>{e.stopPropagation();const n=x.dataset.fav;state.fav=state.fav.includes(n)?state.fav.filter(v=>v!==n):[...state.fav,n];localStorage.setItem('cricket-fav',JSON.stringify(state.fav));render()});
document.querySelectorAll('[data-action="theme"]').forEach(x=>x.onclick=()=>{state.dark=!state.dark;localStorage.setItem('cricket-dark',state.dark?'1':'0');render()});
document.querySelectorAll('[data-action="clear"]').forEach(x=>x.onclick=()=>{state.query='';render()});
document.querySelectorAll('[data-action="notify"]').forEach(x=>x.onclick=notify);
document.querySelectorAll('[data-action="refresh"]').forEach(x=>x.onclick=()=>loadAll(true));
document.querySelectorAll('[data-action="open-live"]').forEach(x=>x.onclick=()=>{const live=matches.find(m=>m.kind==='live');if(live)openMatch(live.id)});
document.querySelectorAll('[data-action="open-tournament"]').forEach(x=>x.onclick=()=>{state.tab='more';render()});
const s=$('#search');if(s){s.oninput=e=>{state.query=e.target.value;render();$('#search')?.focus()}}
const ps=$('#playerSearch');if(ps){ps.oninput=e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('[data-player]').forEach(x=>x.style.display=x.dataset.player.toLowerCase().includes(q)?'flex':'none')}}
const ask=$('#ask');if(ask)ask.onkeydown=e=>{if(e.key==='Enter')assistant()};
document.querySelector('[data-action="ask"]')?.addEventListener('click',assistant);
}
function bindModal(){
document.querySelectorAll('[data-action="close"]').forEach(x=>x.onclick=()=>$('#modal').classList.remove('open'));
document.querySelectorAll('[data-detail]').forEach(x=>x.onclick=()=>{state.detailTab=x.dataset.detail;renderModal()});
$('#modal').onclick=e=>{if(e.target.id==='modal')$('#modal').classList.remove('open')};
}
function playerDetail(name){
const p=players.find(x=>x.name===name);if(!p)return;state.detailId=null;
$('#modal').classList.add('open');$('#sheet').innerHTML=`<div class="sheet-head"><div><b>Player Profile</b><div class="muted">${esc(p.team)} • ${esc(p.role)}</div></div><button class="close" data-action="close">✕</button></div><div class="player" style="margin-top:12px"><div class="avatar" style="width:58px;height:58px">${esc(p.name.split(' ').map(s=>s[0]).join(''))}</div><div class="player-info"><div class="player-name" style="font-size:17px">${esc(p.name)}</div><div class="player-meta">${esc(p.team)} • ${esc(p.role)}</div></div><button class="fav" data-fav="${esc(p.name)}">${state.fav.includes(p.name)?'★':'☆'}</button></div><div class="stats-row" style="margin-top:10px"><div class="stat"><small>Runs</small><b>${p.runs}</b></div><div class="stat"><small>Average</small><b>${p.avg}</b></div><div class="stat"><small>Strike Rate</small><b>${p.sr}</b></div><div class="stat"><small>Wickets</small><b>${p.wk}</b></div></div>${ad('native')}<section class="subcard" style="margin-top:10px"><h3>Recent Form</h3><div class="bar-wrap"><div class="bar-row"><span>Last 5</span><div class="bar"><i style="width:78%"></i></div><b>78%</b></div><div class="bar-row"><span>Venue</span><div class="bar"><i style="width:66%"></i></div><b>66%</b></div><div class="bar-row"><span>Opposition</span><div class="bar"><i style="width:84%"></i></div><b>84%</b></div></div></section>`;bindModal();
}
function assistant(){
const v=($('#ask')?.value||'').toLowerCase();let ans='Try asking about live matches, India next match, or top players.';
if(v.includes('live')) ans=`There are ${matches.filter(m=>m.kind==='live').length} live matches in the current app feed.`;
else if(v.includes('india')&&v.includes('next')) ans='Open Matches and use the Upcoming filter for India fixtures.';
else if(v.includes('top')) ans=`Top form list: ${players.slice(0,3).map(p=>p.name).join(', ')}.`;
$('#answer').textContent=ans;
}
function notify(){
if(!('Notification' in window)){toast('Notifications are not supported here.');return}
Notification.requestPermission().then(p=>{if(p==='granted'){new Notification('Cricket Live Score',{body:'You can now build match alerts in the live app.'});toast('Notifications enabled.')}})
}
async function apiFetch(url){
const r=await fetch(url,{headers:{Accept:'application/json'},cache:'no-store'});
const text=await r.text();let data={};try{data=JSON.parse(text)}catch{}
if(!r.ok) throw new Error(data?.error||`API request failed (${r.status})`);
return data;
}
function normalizeLive(root){
let raw=root?.data??root?.matches??root?.results??root?.match??[];
if(!Array.isArray(raw)) raw=[raw];
return raw.filter(Boolean).map((m,i)=>{
 const teamsRaw=m.teams??m.teamNames??[];
 let names=Array.isArray(teamsRaw)?teamsRaw.slice(0,2):clean(teamsRaw).split(/\s+vs\s+|\s+v\s+|\s+versus\s+/i).slice(0,2);
 const team1=m.team1||m.home_team||m.homeTeam; const team2=m.team2||m.away_team||m.awayTeam;
 if(team1) names[0]=typeof team1==='string'?team1:team1.name||team1.shortname;
 if(team2) names[1]=typeof team2==='string'?team2:team2.name||team2.shortname;
 if(!names[0]) names[0]='Team 1'; if(!names[1]) names[1]='Team 2';
 const scoreData=Array.isArray(m.score)?m.score:[];
 const scoreText=typeof m.score==='string'?m.score:clean(m.score_text||m.scoreText||'');
 const scores=[{text:scoreText,ov:''},{text:'—',ov:''}];
 scoreData.forEach((s,idx)=>{if(idx>1)return;scores[idx]={text:`${s.r??s.runs??'—'}${s.w!=null?'/'+s.w:''}`,ov:s.o??s.overs??''};});
 if(!scoreData.length && m.scorecard){
   const sc=Array.isArray(m.scorecard)?m.scorecard:[];sc.slice(0,2).forEach((s,idx)=>{scores[idx]={text:s.score||`${s.r??'—'}${s.w!=null?'/'+s.w:''}`,ov:s.o??s.overs??''}})
 }
 const statusText=clean(m.status||m.state||'');
 const lower=statusText.toLowerCase();
 const isLive=Boolean(m.isLive||m.live||lower.includes('live')||lower.includes('in play')||m.matchStarted&&!m.matchEnded);
 const isDone=Boolean(m.matchEnded||lower.includes('won by')||lower.includes('completed')||lower.includes('result')||lower==='finished');
 const kind=isLive?'live':isDone?'completed':'upcoming';
 return {id:String(m.id??m.match_id??m.matchId??`api-${i}-${clean(names.join('-'))}`),kind,status:isLive?'LIVE':isDone?'COMPLETED':'UPCOMING',series:clean(m.series||m.tournament||m.league||m.format||'Cricket Match'),venue:clean(m.venue||m.ground||m.location||'Venue TBC'),teams:names.map((n,idx)=>({name:clean(typeof n==='object'?n.name||n.shortname:n),score:scores[idx].text||'—',ov:String(scores[idx].ov||'')})),result:clean(m.result||m.summary||m.status||m.last_ball||'')||'Live score available'};
});
}
async function loadAll(force=false){
state.apiStatus='checking';state.apiMessage='Loading cricket data…';render();
try{
 const live=await apiFetch(`/api/cricket?type=live${force?'&refresh=1':''}`);
 const liveMatches=normalizeLive(live);
 if(liveMatches.length){
   const nonLive=matches.filter(m=>m.kind!=='live' || String(m.id).startsWith('demo-'));
   matches=[...liveMatches,...nonLive.filter(m=>m.kind!=='live')];
 } else {
   matches=matches.filter(m=>String(m.id).startsWith('demo-'));
 }
 state.apiStatus='online';state.apiMessage=liveMatches.length?`${liveMatches.length} live/current matches loaded from API.`:'API connected, but no current matches were returned.';state.lastApiUpdate=Date.now();
 render();
 loadSchedule(false).catch(()=>{});
 if(window._apiTimer)clearInterval(window._apiTimer);window._apiTimer=setInterval(()=>loadAll(false),180000);
}catch(e){
 state.apiStatus='offline';state.apiMessage=String(e.message||e);if(!matches.length)matches=[...demoMatches];render();
 toast('API unavailable — demo data kept.');
}
}
async function loadSchedule(force=false){
try{
 const res=await apiFetch(`/api/cricket?type=schedule${force?'&refresh=1':''}`);const scheduled=normalizeSchedule(res);
 if(scheduled.length){const live=matches.filter(m=>m.kind==='live');matches=[...live,...scheduled];if(state.tab!=='home')render();}
}catch(e){/* schedule is optional; keep existing data */}
}
function normalizeSchedule(root){
let raw=root?.data??root?.matches??root?.results??[];if(!Array.isArray(raw))raw=[raw];
return raw.filter(Boolean).map((m,i)=>{
 const teamsRaw=m.teams??[];let names=Array.isArray(teamsRaw)?teamsRaw.slice(0,2):clean(teamsRaw).split(/\s+vs\s+|\s+v\s+/i).slice(0,2);if(!names[0])names[0]='Team 1';if(!names[1])names[1]='Team 2';
 return {id:String(m.id??m.match_id??m.matchId??`schedule-${i}`),kind:m.matchEnded?'completed':'upcoming',status:m.matchEnded?'COMPLETED':'UPCOMING',series:clean(m.series||m.tournament||m.league||m.format||'Cricket Match'),venue:clean(m.venue||m.ground||'Venue TBC'),teams:names.map(n=>({name:clean(typeof n==='object'?n.name||n.shortname:n),score:'—',ov:''})),result:clean(m.dateTime||m.date||m.startTime||m.status||'Fixture')};
});
}
async function loadDetail(type,id){
try{const data=await apiFetch(`/api/cricket?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`);state.detailCache[id]={...(state.detailCache[id]||{}),[type]:data};renderModal();}
catch(e){toast(`${type==='scorecard'?'Scorecard':'Commentary'} unavailable`);}
}
function toast(s){const t=$('#toast');if(!t)return;t.textContent=s;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
render();
loadAll(false);
