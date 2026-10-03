import { cp, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const source=join(root,'preview-v4');
const target=join(root,'dist-web-preview');
const indexPath=join(target,'index.html');

await rm(target,{recursive:true,force:true});
await cp(source,target,{recursive:true});

for(const entry of ['tests','tools','docs'])await rm(join(target,entry),{recursive:true,force:true});
for(const entry of ['package.json','package-lock.json'])await unlink(join(target,entry)).catch(()=>{});

const marker='<script type="module" src="src/main.js"></script>';
const previewBootstrap='<script>globalThis.__FAMILY_API_DISABLED__=true;globalThis.__FAMILY_DEPLOYMENT_MODE__="web-preview";</script>';
const html=await readFile(indexPath,'utf8');
if(!html.includes(marker))throw new Error('preview-v4 main module marker was not found');
if((html.match(new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length!==1)throw new Error('preview-v4 main module marker must be unique');
await writeFile(indexPath,html.replace(marker,`${previewBootstrap}${marker}`),'utf8');

await writeFile(join(target,'deployment-meta.json'),JSON.stringify({
  mode:'web-preview',
  cloudSync:false,
  source:'preview-v4'
},null,2)+'\n','utf8');

console.log(`Web preview package ready: ${target}`);
