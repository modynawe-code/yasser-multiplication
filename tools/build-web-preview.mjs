import { cp, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const source=join(root,'preview-v4');
const target=join(root,'dist-web-preview');
const indexPath=join(target,'index.html');
const release=/^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA||'')?process.env.GITHUB_SHA.slice(0,12):'local-dev';
const suffix=`?release=${release}`;

function replaceOnce(text,from,to,file){
  if(text.split(from).length!==2)throw new Error(`Missing or ambiguous ${file} release marker: ${from}`);
  return text.replace(from,to);
}

await rm(target,{recursive:true,force:true});
await cp(source,target,{recursive:true});

for(const entry of ['tests','tools','docs'])await rm(join(target,entry),{recursive:true,force:true});
for(const entry of ['package.json','package-lock.json'])await unlink(join(target,entry)).catch(()=>{});

// Critical for installed iOS PWAs: an older service worker may still serve its cached JS/CSS.
// A revisioned URL misses that old cache without clearing family learning progress or storage.
const moduleEdits=[
  ['src/startup-shell.js',"from './modules/hub/learner-hub-registry.js'"],
  ['src/main.js',"from './modules/hub/learner-hub-registry.js'"],
  ['src/main.js',"from './startup-shell.js'"],
  ['src/main.js',"from './modules/yasser/ui/yasser-home-shell.js'"],
  ['src/main.js',"from './modules/khaled/ui/khaled-home-shell.js'"],
  ['src/main.js',"from './modules/mashaal/ui/mashaal-shell.js'"]
];
for(const [file,from] of moduleEdits){
  const path=join(target,file);
  const contents=await readFile(path,'utf8');
  await writeFile(path,replaceOnce(contents,from,from.slice(0,-1)+suffix+"'",file),'utf8');
}
const registryPath=join(target,'src/modules/hub/learner-hub-registry.js');
const registry=await readFile(registryPath,'utf8');
const href="link.href='src/modules/hub/open-family-learner-grid.css'";
await writeFile(registryPath,replaceOnce(registry,href,"link.href='src/modules/hub/open-family-learner-grid.css"+suffix+"'",'hub stylesheet'),'utf8');

// Give changed interior routes the same release guarantee as the family launcher.
const interiorStyles=[
  ['src/modules/yasser/ui/yasser-home-shell.js',"src/modules/yasser/ui/yasser-home.css"],
  ['src/modules/khaled/ui/khaled-home-shell.js',"src/modules/khaled/ui/khaled-subject-gateway.css"],
  ['src/modules/mashaal/ui/mashaal-shell.js',"src/modules/mashaal/ui/mashaal-home.css"]
];
for(const [file,css] of interiorStyles){
  const path=join(target,file);
  const contents=await readFile(path,'utf8');
  await writeFile(path,replaceOnce(contents,css,css+suffix,file),'utf8');
}
const main='<script type="module" src="src/main.js"></script>';
const startup='<script type="module" src="src/startup-shell.js"></script>';
const bootstrap='<script>globalThis.__FAMILY_API_BASE_URL__="https://yasser-khaled-family-api.modynawe.workers.dev";globalThis.__FAMILY_DEPLOYMENT_MODE__="web-production";</script>';
let html=await readFile(indexPath,'utf8');
html=replaceOnce(html,startup,`<script type="module" src="src/startup-shell.js${suffix}"></script>`,'startup entry');
html=replaceOnce(html,main,`${bootstrap}<script type="module" src="src/main.js${suffix}"></script>`,'main entry');
html=replaceOnce(html,'<head>','<head><meta name="family-preview-release" content="'+release+'">','preview release label');
await writeFile(indexPath,html,'utf8');

await writeFile(join(target,'deployment-meta.json'),JSON.stringify({
  mode:'web-production',
  cloudSync:true,
  source:'preview-v4',
  release
},null,2)+'\n','utf8');

console.log(`Web preview package ready: ${target} (release ${release})`);
