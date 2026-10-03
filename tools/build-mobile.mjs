import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const source=path.join(root,'preview-v4');
const target=path.join(root,'dist-mobile');

const excluded=new Set([
  path.join(source,'tests'),
  path.join(source,'package.json'),
  path.join(source,'package-lock.json'),
  path.join(source,'node_modules')
]);

await rm(target,{recursive:true,force:true});
await mkdir(target,{recursive:true});
await cp(source,target,{
  recursive:true,
  force:true,
  filter(src){
    const absolute=path.resolve(src);
    for(const item of excluded){
      if(absolute===item||absolute.startsWith(`${item}${path.sep}`))return false;
    }
    return true;
  }
});

console.log(`Mobile web bundle ready: ${target}`);
