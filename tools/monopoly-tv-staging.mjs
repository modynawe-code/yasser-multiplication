// Isolated Cloudflare staging; no credentials or player tokens are logged.
import {readFile,writeFile} from 'node:fs/promises';
const token=String(process.env.CLOUDFLARE_API_TOKEN||'');
const account=String(process.env.CLOUDFLARE_ACCOUNT_ID||'');
if(!token||!/^[a-f0-9]{32}$/.test(account))throw new Error('Missing authenticated Cloudflare staging access');
const dbName='monopoly-tv-staging-v1';
const frontName='monopoly-tv-staging',apiName='monopoly-tv-api-staging';
const frontend='https://'+frontName+'.modynawe.workers.dev',backend='https://'+apiName+'.modynawe.workers.dev';
async function cf(path,method='GET',body){
 const r=await fetch('https://api.cloudflare.com/client/v4'+path,{
   method,headers:{authorization:'Bearer '+token,'content-type':'application/json'},
   body:body===undefined?undefined:JSON.stringify(body)});
 const data=await r.json();
 if(!r.ok||data.success!==true)throw new Error('Cloudflare '+method+' failed: '+(data.errors||[]).map(x=>x.message).join('; '));
 return data.result;
}
const apiPath='/accounts/'+account+'/d1/database';
let databases=await cf(apiPath+'?per_page=100');
if(!Array.isArray(databases))throw new Error('D1 list shape unexpected');
let database=databases.find(x=>x.name===dbName);
if(!database){database=await cf(apiPath,'POST',{name:dbName});console.log('New private staging DB created');}
else console.log('Private staging DB already exists');
const id=String(database.uuid||database.id||'');
if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('Unexpected staging database id');
const conf=JSON.parse(await readFile('backend/wrangler.jsonc','utf8'));
conf.name=apiName;conf.vars={ALLOWED_ORIGINS:frontend,SESSION_TTL_DAYS:'3'};
conf.d1_databases=[{binding:'DB',database_name:dbName,database_id:id,migrations_dir:'migrations'}];
delete conf.ai;delete conf.ratelimits;
await writeFile('backend/wrangler.tv-staging.jsonc',JSON.stringify(conf,null,2)+'\n');
const web={name:frontName,compatibility_date:'2026-09-10',assets:{directory:'./dist-web-preview',not_found_handling:'single-page-application'}};
await writeFile('wrangler.monopoly-tv-staging.jsonc',JSON.stringify(web,null,2)+'\n');
const bootstrap='<script>globalThis.__FAMILY_API_BASE_URL__='+JSON.stringify(backend)+';globalThis.__FAMILY_DEPLOYMENT_MODE__="monopoly-tv-staging";</script>';
for(const route of ['monopoly-party/tv/index.html','monopoly-party/controller/index.html']){
 const path='dist-web-preview/'+route,s=await readFile(path,'utf8');
 if(!s.includes('</head>')||s.includes('__FAMILY_API_BASE_URL__'))throw new Error('Unrecognized TV page '+route);
 await writeFile(path,s.replace('</head>',bootstrap+'</head>'));
}
const indexPath='dist-web-preview/index.html',html=await readFile(indexPath,'utf8');
const prod='__FAMILY_API_BASE_URL__="https://yasser-khaled-family-api.modynawe.workers.dev"';
if(html.split(prod).length!==2)throw new Error('Production bootstrap not isolated');
await writeFile(indexPath,html.replace(prod,'__FAMILY_API_BASE_URL__="'+backend+'"'));
await writeFile('dist-web-preview/monopoly-party/staging-meta.json',JSON.stringify({
 release:process.env.GITHUB_SHA?.slice(0,12)||'unknown',mode:'isolated',frontend,backend,gameId:'family-monopoly'
},null,2));
console.log('Monopoly TV staging ready with dedicated D1; neither production Worker nor DB is modified.');
