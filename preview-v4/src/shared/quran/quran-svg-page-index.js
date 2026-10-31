/**
 * Page lookup from the *published Quran SVG index* (Hafs / KFGQPC).
 * We do not calculate or duplicate page boundaries. See:
 * https://quran.ws/docs/build/display-page/
 * Pinned to the same immutable edition currently used by the family app.
 */
const COMMIT='b91d39e1065b57bdda3e94aca8ecf3575e50e1e6';
const BASE='https://cdn.jsdelivr.net/gh/quranpedia/quran-svg@'+COMMIT+'/mushafs/hafs/kfqc/json/';
const MAX_PAGE=604;
const cache=new Map();

async function fetchIndexedJson(path,{fetchImpl=fetch,cacheMap=cache}={}){
  if(path!=='surah.json'&&!/^(?:[1-9]\d?|[1-5]\d\d|60[0-4])\.json$/.test(path))
    throw new Error('invalid-quran-svg-json-path');
  if(cacheMap.has(path))return cacheMap.get(path);
  const request=(async()=>{
    const response=await fetchImpl(BASE+path,{mode:'cors',redirect:'error'});
    if(!response?.ok)throw new Error('quran-svg-index-unavailable');
    return response.json();
  })();
  cacheMap.set(path,request);
  try{return await request;}catch(error){cacheMap.delete(path);throw error;}
}
export async function findOfficialHafsPage(surahNumber,ayahNumber,{
  fetchImpl=fetch,cacheMap=cache
}={}){
  const surah=Number(surahNumber),ayah=Number(ayahNumber);
  if(!Number.isInteger(surah)||surah<1||surah>114||!Number.isInteger(ayah)||ayah<1||ayah>286)
    return null;
  const chapters=await fetchIndexedJson('surah.json',{fetchImpl,cacheMap});
  if(!Array.isArray(chapters)||chapters.length!==114)return null;
  const current=chapters[surah-1],next=chapters[surah];
  if(current?.number!==surah||!Number.isInteger(current.ayahCount)
    ||ayah>current.ayahCount
    ||!Number.isInteger(current.pageNumber)
    ||current.pageNumber<1||current.pageNumber>MAX_PAGE)return null;
  let lo=current.pageNumber;
  const nextStart=Number(next?.pageNumber);
  let hi=Number.isInteger(nextStart)&&nextStart>=lo&&nextStart<=MAX_PAGE
    ?nextStart:MAX_PAGE;
  // Identifies pages by surah:ayah from official JSON, not by text or timing.
  while(lo<=hi){
    const mid=Math.floor((lo+hi)/2);
    const rows=await fetchIndexedJson(mid+'.json',{fetchImpl,cacheMap});
    if(!Array.isArray(rows)||!rows.length||rows.length>300)return null;
    const normalized=rows.map(entry=>({
      surah:Number(entry.surahNumber),ayah:Number(entry.ayahNumber)
    }));
    if(normalized.some(p=>p.surah===surah&&p.ayah===ayah))return mid;
    const last=normalized.at(-1);
    if(!Number.isInteger(last.surah)||!Number.isInteger(last.ayah))return null;
    if(last.surah<surah||(last.surah===surah&&last.ayah<ayah))lo=mid+1;
    else hi=mid-1;
  }
  return null;
}
export function pageIndexInCurriculum(pages,pageNumber){
  if(!Number.isInteger(pageNumber))return -1;
  return pages.findIndex(page=>Number(page?.pageNumber)===pageNumber);
}
