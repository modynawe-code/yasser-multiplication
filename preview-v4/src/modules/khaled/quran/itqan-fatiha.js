// Optional, on-demand Itqan pilot. No API keys, user identifiers, or existing audio are sent.
const API_ORIGIN='https://api.cms.itqan.dev';
const MAX_PAGES=10;
const PAGE_SIZE=200;

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

async function readPages(fetchImpl,path){
  // Itqan uses count/page/page_size, NOT a "next" cursor.
  // Use only fixed, read-only recitation endpoints to avoid redirecting requests.
  const initial=new URL(path,API_ORIGIN);
  if(initial.origin!==API_ORIGIN
    ||!/^\/recitations\/(?:\d+\/)?$/.test(initial.pathname)
    ||initial.search||initial.hash)throw new Error('unexpected-itqan-path');
  const all=[];
  let total=null;
  for(let page=1;page<=MAX_PAGES;page++){
    const url=new URL(initial.href);
    url.searchParams.set('page',String(page));
    url.searchParams.set('page_size',String(PAGE_SIZE));
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),7000);
    let response;
    try{
      response=await fetchImpl(url.href,{
        headers:{Accept:'application/json','Accept-Language':'ar'},
        signal:controller.signal,
        redirect:'error'
      });
    }finally{clearTimeout(timeout);}
    if(!response?.ok)throw new Error('itqan-api-unavailable');
    const data=await response.json();
    if(!Number.isSafeInteger(data?.count)||data.count<0||!Array.isArray(data.results)
      ||data.results.length>PAGE_SIZE)throw new Error('invalid-itqan-response');
    if(total===null)total=data.count;
    if(data.count!==total)throw new Error('changed-itqan-result-count');
    if(data.results.length===0&&all.length<total)throw new Error('incomplete-itqan-pagination');
    all.push(...data.results);
    if(all.length>=total)return all.slice(0,total);
  }
  throw new Error('itqan-pagination-limit');
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
