/**
 * Verify whole-curriculum Itqan timings and original Hafs page geometry.
 * This checks source coverage, NOT acoustic synchronization quality.
 */
import {readFile} from 'node:fs/promises';
import {KHALED_QURAN_TERMS} from '../src/modules/khaled/quran/khaled-quran.js';
import {YASSER_QURAN_TERMS} from '../src/modules/yasser/quran/yasser-quran.js';
import {MASHAAL_RECITATION_MEDIA} from '../src/modules/mashaal/curriculum/recitation-media-manifest.js';

export function QuranCurriculumItems(){
  return {
    khaled:Object.values(KHALED_QURAN_TERMS).flat(),
    yasser:Object.values(YASSER_QURAN_TERMS).flatMap(t=>[...t.recitation,...t.memorization]),
    mashaal:MASHAAL_RECITATION_MEDIA
  };
}
function verseIds(svg,surahNumber){
  const verses=new Set();
  for(const match of svg.matchAll(/<path\b[^>]*class="ayahPolygon"[^>]*>/g)){
    const tag=match[0],chapter=Number(tag.match(/\bsurah="(\d+)"/)?.[1]);
    const ayah=Number(tag.match(/\bayah="(\d+)"/)?.[1]);
    if(chapter===surahNumber&&Number.isInteger(ayah)&&ayah>0)verses.add(ayah);
  }
  return verses;
}
export async function verifyQuranCurriculumCoverage({loadText=async url=>readFile(url,'utf8')}={}){
  const catalog=JSON.parse(await loadText(new URL('../assets/recitation/itqan-hafs-tracks.json',import.meta.url)));
  if(catalog?.schemaVersion!==1)throw new Error('missing-pinned-itqan-catalog');
  const items=QuranCurriculumItems(),cache=new Map(),report=[];
  for(const [learner,chapters] of Object.entries(items)){
    for(const chapter of chapters){
      const n=chapter.surahNumber,track=catalog.tracks[String(n)];
      if(!track?.ayahTimings?.length)throw new Error('no-matching-itqan-ayah-timings-'+learner+'-'+n);
      const pages=chapter.mushafPages||[chapter.mushafPage];
      const found=new Set();
      for(const page of pages){
        const no=page?.pageNumber;
        if(!Number.isInteger(no))throw new Error('missing-course-page-'+learner+'-'+n);
        if(!cache.has(no))cache.set(no,await loadText(new URL('../assets/recitation/kfqc-hafs-page-'+no+'.svg',import.meta.url)));
        for(const verse of verseIds(cache.get(no),n))found.add(verse);
      }
      const count=track.ayahTimings.length;
      const missing=Array.from({length:count},(_,i)=>i+1).filter(i=>!found.has(i));
      if(missing.length)throw new Error('incomplete-svg-ayah-geometry-'+learner+'-'+n+':'+missing.join(','));
      report.push({learner,surahNumber:n,ayahs:count,pages:pages.length});
    }
  }
  return report;
}
if(process.argv[1]&&new URL('file://'+process.argv[1]).href===import.meta.url){
  verifyQuranCurriculumCoverage().then(r=>
    console.log('Complete authentic SVG/Itqan curriculum coverage:',JSON.stringify({
      curriculumEntries:r.length,uniqueSurahs:new Set(r.map(s=>s.surahNumber)).size,
      totalAyahRecords:r.reduce((n,t)=>n+t.ayahs,0)
    }))
  ).catch(e=>{console.error(e);process.exitCode=1;});
}
