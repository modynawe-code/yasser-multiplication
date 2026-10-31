/**
 * Pin and bundle original KFGQPC Hafs page SVGs used by the children.
 * No text transcription or generated Quran artwork. Fail closed at build.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {KHALED_QURAN_TERMS} from '../src/modules/khaled/quran/khaled-quran.js';
import {YASSER_QURAN_TERMS} from '../src/modules/yasser/quran/yasser-quran.js';
import {MASHAAL_RECITATION_MEDIA} from '../src/modules/mashaal/curriculum/recitation-media-manifest.js';

export const QURAN_SVG_PIN='b91d39e1065b57bdda3e94aca8ecf3575e50e1e6';
const GITHUB='https://raw.githubusercontent.com/quranpedia/quran-svg/'+QURAN_SVG_PIN+'/mushafs/hafs/kfqc/svg/';
const CDN='https://cdn.jsdelivr.net/gh/quranpedia/quran-svg@'+QURAN_SVG_PIN+'/mushafs/hafs/kfqc/svg/';
const DEST=fileURLToPath(new URL('../assets/recitation/',import.meta.url));

export function collectRequiredQuranPages(){
  const children={
    khaled:Object.values(KHALED_QURAN_TERMS).flat(),
    yasser:Object.values(YASSER_QURAN_TERMS).flatMap(term=>[...term.recitation,...term.memorization]),
    mashaal:MASHAAL_RECITATION_MEDIA
  };
  const unique=new Set();
  for(const [child,items] of Object.entries(children)){
    if(!items.length)throw new Error('empty-quran-curriculum-'+child);
    for(const item of items){
      const pages=Array.isArray(item.mushafPages)?item.mushafPages:[item.mushafPage];
      if(!pages.length)throw new Error('missing-mushaf-pages-'+child);
      for(const page of pages){
        const n=Number(page?.pageNumber);
        if(!Number.isInteger(n)||n<1||n>604
          ||page?.sourceId!=='kfgqpc-hafs-madinah-svg'
          ||page?.distributionCommit!==QURAN_SVG_PIN
          ||page?.offlineBundled!==true
          ||page?.imagePath!=='./assets/recitation/kfqc-hafs-page-'+n+'.svg')
          throw new Error('unverified-course-page-'+child+'-'+String(n));
        unique.add(n);
      }
    }
  }
  return Object.freeze([...unique].sort((a,b)=>a-b));
}

export function validateVerifiedHafsSvg(svg,page){
  if(typeof svg!=='string'||svg.length<300||svg.length>5_000_000
    ||!svg.includes('<svg')||!/<svg\b[^>]*\bviewBox="[0-9.\s-]+"/.test(svg)
    ||!/<path\b[^>]*class="ayahPolygon"/.test(svg)
    ||/<(?:script|foreignObject|iframe)\b/i.test(svg)
    ||/\bon(?:load|error|click)\s*=/i.test(svg))
    throw new Error('invalid-verified-hafs-svg-page-'+page);
  return true;
}

async function downloadPage(page,{fetchImpl=fetch}={}){
  const urls=[GITHUB+page+'.svg',CDN+page+'.svg'];
  let lastError;
  for(const url of urls){
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),18000);
    try{
      const response=await fetchImpl(url,{signal:controller.signal,redirect:'error'});
      if(!response.ok)throw new Error('status-'+response.status);
      const svg=await response.text();
      validateVerifiedHafsSvg(svg,page);
      return svg;
    }catch(error){lastError=error;}
    finally{clearTimeout(timeout);}
  }
  throw new Error('quran-svg-page-'+page+'-unavailable: '+String(lastError?.message||lastError));
}

export async function buildRequiredQuranPages({fetchImpl=fetch,concurrency=6}={}){
  const pages=collectRequiredQuranPages();
  if(!Number.isInteger(concurrency)||concurrency<1||concurrency>12)throw new Error('invalid-concurrency');
  await mkdir(DEST,{recursive:true});
  let next=0,downloaded=0,reused=0;
  await Promise.all(Array.from({length:Math.min(concurrency,pages.length)},async()=>{
    while(next<pages.length){
      const number=pages[next++];
      const file=join(DEST,'kfqc-hafs-page-'+number+'.svg');
      let existing=null;
      try{existing=await readFile(file,'utf8');validateVerifiedHafsSvg(existing,number);}
      catch{existing=null;}
      if(existing!==null){reused++;continue;}
      const body=await downloadPage(number,{fetchImpl});
      await writeFile(file,body,'utf8');
      downloaded++;
    }
  }));
  console.log('Verified Hafs pages bundled:',JSON.stringify({total:pages.length,reused,downloaded,pages}));
  return pages;
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===fileURLToPath(new URL('file://'+process.argv[1]))){
  buildRequiredQuranPages().catch(error=>{console.error(error);process.exitCode=1;});
}
