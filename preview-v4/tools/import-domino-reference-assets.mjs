import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const UPSTREAM_REPO='andrew1407/Domino';
const UPSTREAM_COMMIT='3b483ad5eb07c399801cf35582590082fc2f32b4';
const SCRIPT_DIR=path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR=path.resolve(SCRIPT_DIR,'../assets/domino/tiles');

export function expectedDominoAssetNames(){
  const names=[];
  for(let high=0;high<=6;high++)for(let low=0;low<=high;low++)names.push(`${high}-${low}.svg`);
  return names;
}

async function fetchTile(name){
  const url=`https://raw.githubusercontent.com/${UPSTREAM_REPO}/${UPSTREAM_COMMIT}/client/public/static/tiles/${name}`;
  const response=await fetch(url,{headers:{'user-agent':'family-learning-domino-importer'}});
  if(!response.ok)throw new Error(`Failed ${name}: HTTP ${response.status}`);
  const content=await response.text();
  if(!/^<svg\b/i.test(content.trim())||!content.includes('viewBox="0 0 64 122"'))throw new Error(`Invalid SVG payload for ${name}`);
  return content;
}

async function main(){
  await mkdir(OUTPUT_DIR,{recursive:true});
  const names=expectedDominoAssetNames();
  for(const name of names){
    const content=await fetchTile(name);
    await writeFile(path.join(OUTPUT_DIR,name),content,'utf8');
    console.log(`imported ${name}`);
  }
  console.log(`Imported ${names.length} MIT domino tile assets from ${UPSTREAM_REPO}@${UPSTREAM_COMMIT}.`);
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error);process.exitCode=1;});
