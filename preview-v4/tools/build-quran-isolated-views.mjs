/**
 * Bundle the original pinned Quran SVG *surah-view* files.
 * Their graphic markup must exactly match the original page SVG: only
 * the official viewBox may differ. No homemade crop geometry or Quran text.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {QURAN_SVG_PIN,validateVerifiedHafsSvg} from './build-quran-svg-pages.mjs';

const DIR=fileURLToPath(new URL('../assets/recitation/',import.meta.url));
const PIN=QURAN_SVG_PIN;
const ORIGINS=[
  'https://raw.githubusercontent.com/quran-ws/quran-svg/'+PIN+'/mushafs/hafs/kfqc/svg/',
  'https://cdn.jsdelivr.net/gh/quran-ws/quran-svg@'+PIN+'/mushafs/hafs/kfqc/svg/'
];
const polygonIds=svg=>new Set([...svg.matchAll(/<path\b[^>]*class="ayahPolygon"[^>]*>/g)]
  .map(([tag])=>Number(tag.match(/\bsurah="(\d+)"/)?.[1])).filter(Number.isInteger));
const box=svg=>svg.match(/\bviewBox="([^"]+)"/)?.[1];
const sameArtwork=(full,view)=>{
  const remove=svg=>svg.replace(/\bviewBox="[^"]+"/,'viewBox="SOURCE"');
  return remove(full)===remove(view);
};
export function validateOriginalSurahView(full,variant,page,surah){
  validateVerifiedHafsSvg(full,page);
  validateVerifiedHafsSvg(variant,page);
  const fullBox=box(full)?.split(/\s+/).map(Number);
  const viewBox=box(variant)?.split(/\s+/).map(Number);
  if(!sameArtwork(full,variant)||!Array.isArray(fullBox)||!Array.isArray(viewBox)
    ||fullBox.length!==4||viewBox.length!==4
    ||!fullBox.every(Number.isFinite)||!viewBox.every(Number.isFinite)
    ||viewBox[2]!==fullBox[2]||viewBox[3]<=0||viewBox[3]>=fullBox[3]
    ||viewBox[1]<fullBox[1]||viewBox[1]+viewBox[3]>fullBox[1]+fullBox[3]+.01
    ||!polygonIds(full).has(surah))throw new Error('unverified-source-surah-view-'+page+'-'+surah);
  return viewBox;
}
async function getPinnedSource(name,{fetchImpl=fetch}={}){
  let last=null;
  for(const origin of ORIGINS){
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),18000);
    try{
      const res=await fetchImpl(origin+name,{signal:controller.signal,redirect:'error'});
      if(!res.ok)throw new Error('HTTP-'+res.status);
      return await res.text();
    }catch(error){last=error;}
    finally{clearTimeout(timeout);}
  }
  throw new Error('source-variant-unavailable-'+name+':'+String(last?.message||last));
}
export async function bundleOriginalSurahViews({fetchImpl=fetch}={}){
  const path=join(DIR,'quran-course-page-map.json');
  const map=JSON.parse(await readFile(path,'utf8'));
  if(map?.sourcePin!==PIN||map?.schemaVersion!==1)throw new Error('unverified-course-map');
  const fullPages=new Map();
  const isolatedViews={};
  const wanted=new Map();
  for(const [surahString,pages] of Object.entries(map.surahs||{})){
    const surah=Number(surahString);
    for(const page of pages){
      if(!fullPages.has(page))
        fullPages.set(page,await readFile(join(DIR,'kfqc-hafs-page-'+page+'.svg'),'utf8'));
      if(polygonIds(fullPages.get(page)).size<2)continue;
      const key=page+':'+surah;
      wanted.set(key,{page,surah,full:fullPages.get(page)});
    }
  }
  const queue=[...wanted.values()];
  let next=0,reused=0,downloaded=0;
  await Promise.all(Array.from({length:Math.min(6,queue.length)},async()=>{
    while(next<queue.length){
      const {page,surah,full}=queue[next++];
      const name=page+'-surah'+surah+'.svg';
      const file=join(DIR,'kfqc-hafs-page-'+page+'-surah'+surah+'.svg');
      let svg;
      try{
        svg=await readFile(file,'utf8');
        validateOriginalSurahView(full,svg,page,surah);
        reused++;
      }catch{
        svg=await getPinnedSource(name,{fetchImpl});
        validateOriginalSurahView(full,svg,page,surah);
        await writeFile(file,svg,'utf8');
        downloaded++;
      }
      isolatedViews[page+':'+surah]={
        imagePath:'./assets/recitation/kfqc-hafs-page-'+page+'-surah'+surah+'.svg',
        viewBox:box(svg)
      };
    }
  }));
  const result={...map,isolatedViews:Object.fromEntries(Object.entries(isolatedViews).sort())};
  await writeFile(path,JSON.stringify(result,null,2)+'\n','utf8');
  console.log('Pinned original per-surah SVG views:',JSON.stringify({
    total:Object.keys(isolatedViews).length,reused,downloaded
  }));
  return result;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===fileURLToPath(new URL('file://'+process.argv[1]))){
  bundleOriginalSurahViews().catch(error=>{console.error(error);process.exitCode=1;});
}
