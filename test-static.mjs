import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const files=['index.html','app.js','styles.css','manifest.json','sw.js','server.mjs','api/cricket.js','api/health.js','api-key.js'];
for(const f of files){if(!fs.existsSync(f))throw new Error(`missing ${f}`)}
for(const f of ['app.js','server.mjs','api/cricket.js'])execFileSync(process.execPath,['--check',f],{stdio:'inherit'});
const app=fs.readFileSync('app.js','utf8');
if(/CRICKETDATA_API_KEY\s*=|apikey=[A-Za-z0-9_-]{10,}/i.test(app))throw new Error('secret-looking key in frontend');
const sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes("u.pathname.startsWith('/api/')"))throw new Error('service worker API bypass missing');
if(!fs.readFileSync('server.mjs','utf8').includes("rel==='api-key.js'"))throw new Error('api-key route block missing');
console.log('ROUND-2 STATIC/SECURITY TESTS PASSED');
