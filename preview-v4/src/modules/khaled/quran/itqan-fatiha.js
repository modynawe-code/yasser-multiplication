// Optional, on-demand Itqan pilot. No API keys, user identifiers, or existing audio are sent.
const API_ORIGIN='https://api.cms.itqan.dev';
const MAX_PAGES=16;

function normalizeName(value){
  return String(value||'').normalize('NFKD').toLowerCase()
    .replace(/[\u064b-\u065f\u0670]/g,'').replace(/[إأآٱ]/g,'ا')
    .replace(/[^\p{L}]+/gu,' ').trim();
}

export function isIbrahimAlAkhdarHafs(recitation){
  const reciter=normalizeName(recitation?.reciter?.name);
  const riwayah=normalizeName(recitation?.riwayah?.name);
  const knownReciter=/(?:^|\s)ابراهيم\s+الاخضر(?:$|\s)/u.test(reciter)
    || /\bibrahim\s+(?:al\s*)?akhdar\b/i.test(reciter);
  return knownReciter&&(/(?:^|\s)حفص(?:$|\s)/u.test(riwayah)||/\bhafs\b/i.test(riwayah));
}

export function validateFatihaTrack(track){
  if(Number(track?.surah_number)!==1||Number(track?.ayahs_count)!==7)return null;
  let url;
  try{url=new URL(track.audio_url);}catch{return null;}
  if(url.protocol!=='https:')return null;
  const duration=Number(track.duration_ms);
  if(!Number.isFinite(duration)||duration<=0)return null;
  if(!Array.isArray(track.ayahs_timings)||track.ayahs_timings.length!==7)return null;

  const timings=[];
  let previousEnd=0;
  for(let index=0;index<7;index++){
    const item=track.ayahs_timings[index];
    const start=Number(item?.start_ms),end=Number(item?.end_ms);
    if(item?.ayah_key!==`1:${index+1}`
      ||!Number.isInteger(start)||!Number.isInteger(end)
      ||start<previousEnd||end<=start||end>duration+500)return null;
    timings.push(Object.freeze({ayahKey:item.ayah_key,startMs:start,endMs:end}));
    previousEnd=end;
  }
  return Object.freeze({audioPath:url.href,ayahTimings:Object.freeze(timings),durationSeconds:duration/1000});
}

async function readPages(fetchImpl,initialPath){
  const all=[],seen=new Set();
  let url=new URL(initialPath,API_ORIGIN);
  for(let page=0;page<MAX_PAGES&&url;page++){
    if(url.origin!==API_ORIGIN||!url.pathname.startsWith('/recitations/')||seen.has(url.href)){
      throw new Error('unexpected-itqan-pagination');
    }
    seen.add(url.href);
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),7000);
    let response;
    try{
      response=await fetchImpl(url.href,{headers:{Accept:'application/json'},signal:controller.signal});
    }finally{clearTimeout(timeout);}
    if(!response?.ok)throw new Error('itqan-api-unavailable');
    const data=await response.json();
    if(!Array.isArray(data?.results))throw new Error('invalid-itqan-response');
    all.push(...data.results);
    url=data.next?new URL(data.next,url):null;
  }
  if(url)throw new Error('itqan-pagination-limit');
  return all;
}

export async function loadItqanFatiha({fetchImpl=fetch}={}){
  const recitations=await readPages(fetchImpl,'/recitations/');
  const matches=recitations.filter(isIbrahimAlAkhdarHafs);
  if(!matches.length)throw new Error('matching-akhdar-recitation-unavailable');
  for(const recitation of matches){
    const id=Number(recitation.id);
    if(!Number.isSafeInteger(id)||id<=0)continue;
    const tracks=await readPages(fetchImpl,`/recitations/${id}/`);
    for(const track of tracks){
      const validated=validateFatihaTrack(track);
      if(validated)return validated; // Timings and audio URL are from the SAME Itqan track.
    }
  }
  throw new Error('matching-fatiha-timings-unavailable');
}
