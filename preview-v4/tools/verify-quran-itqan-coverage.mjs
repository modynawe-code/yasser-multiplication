/**
 * Source-verified whole-curriculum Itqan timings and original Hafs geometry.
 * Generates a page map from actual bundled SVG polygons instead of assuming
 * a short surah occupies only its nominal starting page.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {KHALED_QURAN_TERMS} from '../src/modules/khaled/quran/khaled-quran.js';
import {YASSER_QURAN_TERMS} from '../src/modules/yasser/quran/yasser-quran.js';
import {MASHAAL_RECITATION_MEDIA} from '../src/modules/mashaal/curriculum/recitation-media-manifest.js';
import {collectRequiredQuranPages,QURAN_SVG_PIN} from './build-quran-svg-pages.mjs';

export function QuranCurriculumItems(){
  return {
    khaled:Object.values(KHALED_QURAN_TERMS).flat(),
    yasser:Object.values(YASSER_QURAN_TERMS).flatMap(t=>[...t.recitation,...t.memorization]),
    mashaal:MASHAAL_RECITATION_MEDIA
  };
}
function polygonsForPage(svg){
  const result=new Map();
  for(const match of svg.matchAll(/<path\b[^>]*class="ayahPolygon"[^>]*>/g)){
    const tag=match[0],surah=Number(tag.match(/\bsurah="(\d+)"/)?.[1]);
    const ayah=Number(tag.match(/\bayah="(\d+)"/)?.[1]);
    if(!Number.isInteger(surah)||surah<1||surah>114||!Number.isInteger(ayah)||ayah<1)continue;
    if(!result.has(surah))result.set(surah,new Set());
    result.get(surah).add(ayah);
  }
  return result;
}
export async function verifyQuranCurriculumCoverage({
  loadText=async url=>readFile(url,'utf8'),writeMap=async value=>
    writeFile(new URL('../assets/recitation/quran-course-page-map.json',import.meta.url),
      JSON.stringify(value,null,2)+'\n','utf8')
}={}){
  const catalog=JSON.parse(await loadText(new URL('../assets/recitation/itqan-hafs-tracks.json',import.meta.url)));
  if(catalog?.schemaVersion!==1)throw new Error('missing-pinned-itqan-catalog');
  const sourcePages=collectRequiredQuranPages(),index=new Map();
  for(const n of sourcePages){
    const svg=await loadText(new URL('../assets/recitation/kfqc-hafs-page-'+n+'.svg',import.meta.url));
    index.set(n,polygonsForPage(svg));
  }
  const items=QuranCurriculumItems(),report=[],map={},ayahPages={};
  for(const [learner,chapters] of Object.entries(items)){
    for(const chapter of chapters){
      const n=chapter.surahNumber,track=catalog.tracks[String(n)];
      if(!track?.ayahTimings?.length)throw new Error('no-matching-itqan-ayah-timings-'+learner+'-'+n);
      const included=[],found=new Set();
      for(const page of sourcePages){
        const verses=index.get(page).get(n);
        if(!verses?.size)continue;
        included.push(page);
        for(const v of verses)found.add(v);
      }
      const count=track.ayahTimings.length;
      const missing=Array.from({length:count},(_,i)=>i+1).filter(i=>!found.has(i));
      if(missing.length)throw new Error('incomplete-svg-ayah-geometry-'+learner+'-'+n+':'+missing.join(','));
      const nominal=Number(chapter.pageNumber??chapter.mushafPage?.pageNumber);
      if(!included.includes(nominal))throw new Error('nominal-course-page-does-not-contain-surah-'+learner+'-'+n);
      const previous=map[String(n)];
      if(previous&&JSON.stringify(previous)!==JSON.stringify(included))
        throw new Error('inconsistent-course-page-map-'+n);
      map[String(n)]=included;
      const ayahPage=[];
      for(let verse=1;verse<=count;verse++){
        const matches=included.filter(page=>index.get(page).get(n)?.has(verse));
        if(!matches.length)throw new Error('missing-source-ayah-page-'+n+':'+verse);
        // An ayah may cross a page boundary. Its first printed page is
        // canonical for initial focus; next-page navigation remains available.
        ayahPage.push(matches[0]);
      }
      if(ayahPages[String(n)]&&JSON.stringify(ayahPages[String(n)])!==JSON.stringify(ayahPage))
        throw new Error('inconsistent-source-ayah-pages-'+n);
      ayahPages[String(n)]=ayahPage;
      report.push({learner,surahNumber:n,ayahs:count,pages:included.length});
    }
  }
  await writeMap({schemaVersion:1,sourcePin:QURAN_SVG_PIN,surahs:map,ayahPages});
  return report;
}
if(process.argv[1]&&new URL('file://'+process.argv[1]).href===import.meta.url){
  verifyQuranCurriculumCoverage().then(r=>
    console.log('Complete authentic SVG/Itqan curriculum coverage:',JSON.stringify({
      curriculumEntries:r.length,uniqueSurahs:new Set(r.map(s=>s.surahNumber)).size,
      totalAyahRecords:r.reduce((n,t)=>n+t.ayahs,0),multiPage:r.filter(x=>x.pages>1)
    }))
  ).catch(e=>{console.error(e);process.exitCode=1;});
}
