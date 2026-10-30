/**
 * Build-time-only Itqan CMS adapter: fetch exact audio + ayah timings together
 * from each recitation's own folder. Never match timestamps with a different MP3.
 * Output used in the isolated pilot; no runtime cross-origin CMS dependency.
 */
import {writeFile,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
const API='https://api.cms.itqan.dev';
const DEST='assets/recitation/itqan-hafs-tracks.json';
const PAGE_SIZE=200;
const MAX_PAGES=10;

export function validateItqanTrack(track){
  const surah=Number(track?.surah_number);
  const timings=track?.ayahs_timings;
  const duration=Number(track?.duration_ms);
  let parsedAudio;
  try{parsedAudio=new URL(track?.audio_url);}catch{return null;}
  if(!Number.isInteger(surah)||surah<1||surah>114
    ||parsedAudio.protocol!=='https:'||!Number.isFinite(duration)||duration<=0
    ||!Array.isArray(timings)||!timings.length
    ||Number(track.ayahs_count)!==timings.length)return null;
  const cleaned=[];
  let last=0;
  for(let i=0;i<timings.length;i++){
    const a=timings[i],start=Number(a.start_ms),end=Number(a.end_ms);
    if(a.ayah_key!==surah+':'+(i+1)||!Number.isInteger(start)
      ||!Number.isInteger(end)||start<last||end<=start||end>duration+300)return null;
    cleaned.push({ayahKey:a.ayah_key,startMs:start,endMs:end});
    last=end;
  }
  return {surahNumber:surah,audioPath:parsedAudio.href,durationSeconds:duration/1000,ayahTimings:cleaned};
}
export function isHafsRecitation(r){
  const riwayah=String(r?.riwayah?.name||'').toLowerCase();
  return /hafs|حفص/i.test(riwayah)&&Number.isInteger(r.id)&&r.id>0;
}
async function fetchPage(url,fetchImpl){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),15000);
  try{
    const response=await fetchImpl(url.href,{headers:{Accept:'application/json','Accept-Language':'ar'},signal:controller.signal,redirect:'error'});
    if(!response.ok)throw new Error('itqan-http-'+response.status);
    const data=await response.json();
    if(!Number.isInteger(data?.count)||data.count<0||!Array.isArray(data.results)||data.results.length>PAGE_SIZE)
      throw new Error('itqan-invalid-page');
    return data;
  }finally{clearTimeout(timer);}
}
export async function listItqanPages(path,{fetchImpl=fetch}={}){
  if(!/^\/recitations\/(?:\d+\/)?$/.test(path))throw new Error('itqan-path-invalid');
  let total=null;const collected=[];
  for(let page=1;page<=MAX_PAGES;page++){
    const url=new URL(path,API);
    url.searchParams.set('page',String(page));
    url.searchParams.set('page_size',String(PAGE_SIZE));
    const response=await fetchPage(url,fetchImpl);
    if(total===null)total=response.count;
    if(total!==response.count||!response.results.length&&collected.length<total)
      throw new Error('itqan-incomplete-pagination');
    collected.push(...response.results);
    if(collected.length>=total)return collected.slice(0,total);
  }
  throw new Error('itqan-too-many-pages');
}
export async function buildItqanPilotCatalog({fetchImpl=fetch}={}){
  const recitations=(await listItqanPages('/recitations/',{fetchImpl}))
    .filter(isHafsRecitation)
    .sort((a,b)=>Number(b.surahs_count||0)-Number(a.surahs_count||0)||a.id-b.id);
  const failures=[];
  // Test a small number of real catalog candidates, never invent a reciter.
  for(const recitation of recitations.slice(0,12)){
    try{
      const raw=await listItqanPages('/recitations/'+recitation.id+'/',{fetchImpl});
      const tracks=raw.map(validateItqanTrack).filter(Boolean);
      const bySurah=new Map(tracks.map(track=>[track.surahNumber,track]));
      const mustHave=[1,...Array.from({length:22},(_,i)=>93+i),32,33,34,35,36,37,38,67,68];
      // Prefer wide curricular coverage; other surahs are enabled only if validated.
      if(!mustHave.every(n=>bySurah.has(n))){failures.push('id-'+recitation.id+':missing-covered-surahs');continue;}
      return {
        schemaVersion:1,
        source:'Itqan CMS https://api.cms.itqan.dev',
        recitationId:recitation.id,
        reciter:String(recitation.reciter?.name||'').slice(0,120),
        riwayah:String(recitation.riwayah?.name||'').slice(0,80),
        audioSource:'Itqan track audio_url; timing is embedded in that same track',
        tracks:Object.fromEntries([...bySurah].map(([k,v])=>[String(k),v]))
      };
    }catch(e){failures.push('id-'+recitation.id+':'+String(e.message).slice(0,100));}
  }
  throw new Error('No Itqan Hafs recitation with verified required tracks. '+failures.join('; '));
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  buildItqanPilotCatalog().then(async data=>{
    await mkdir(dirname(DEST),{recursive:true});
    await writeFile(DEST,JSON.stringify(data,null,2)+'\n','utf8');
    console.log('Itqan CMS validated original-track catalog:',JSON.stringify({
      recitationId:data.recitationId,reciter:data.reciter,riwayah:data.riwayah,
      surahs:Object.keys(data.tracks).length,missing:Array.from({length:114},(_,i)=>i+1).filter(i=>!data.tracks[String(i)]),required:'Khaled 1+93-114; Yasser 32-38+67-68; Mashaal 1+111-114'
    }));
  }).catch(error=>{console.error(error);process.exitCode=1;});
}
