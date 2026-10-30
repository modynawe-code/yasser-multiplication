/**
 * Itqan CMS pilot catalog, generated during the isolated preview deployment.
 * The user opts in before swapping audio: never pair original Akhdar MP3
 * with a different reciter's timings. No remote CMS call at runtime.
 */
const CATALOG_PATH='./assets/recitation/itqan-hafs-tracks.json';
let cached=null;

export function isItqanPilotOrigin(location=globalThis.location){
  return String(location?.hostname||'').toLowerCase()==='family-learning-fatiha-pilot.modynawe.workers.dev'
    ||((location?.hostname==='localhost'||location?.hostname==='127.0.0.1')
      &&new URLSearchParams(location?.search||'').get('itqanPilot')==='1');
}
export function validateItqanCatalogTrack(catalog,surahNumber){
  const n=Number(surahNumber),item=catalog?.tracks?.[String(n)];
  if(catalog?.schemaVersion!==1||catalog?.source!=='Itqan CMS https://api.cms.itqan.dev'
     ||!Number.isInteger(catalog?.recitationId)||!catalog?.reciter
     ||!(/hafs|حفص/i).test(catalog?.riwayah||'')
     ||!Number.isInteger(n)||n<1||n>114||item?.surahNumber!==n)return null;
  let url;
  try{url=new URL(item.audioPath);}catch{return null;}
  if(url.protocol!=='https:'||!Number.isFinite(item.durationSeconds)||item.durationSeconds<=0
    ||!Array.isArray(item.ayahTimings)||item.ayahTimings.length===0)return null;
  let last=0;
  for(let i=0;i<item.ayahTimings.length;i++){
    const t=item.ayahTimings[i];
    if(t.ayahKey!==n+':'+String(i+1)||!Number.isInteger(t.startMs)
      ||!Number.isInteger(t.endMs)||t.startMs<last||t.endMs<=t.startMs
      ||t.endMs>item.durationSeconds*1000+300)return null;
    last=t.endMs;
  }
  return Object.freeze({
    surahNumber:n,
    audioPath:url.href,
    durationSeconds:item.durationSeconds,
    ayahTimings:Object.freeze(item.ayahTimings.map(t=>Object.freeze({...t}))),
    reciter:String(catalog.reciter),
    riwayah:String(catalog.riwayah),
    recitationId:catalog.recitationId,
    source:'Itqan CMS'
  });
}
export async function loadItqanTrack(surahNumber,{fetchImpl=globalThis.fetch,location=globalThis.location}={}){
  if(!isItqanPilotOrigin(location))return null;
  if(!cached)cached=fetchImpl(CATALOG_PATH,{cache:'no-cache'})
    .then(async response=>{
      if(!response.ok)throw new Error('itqan-manifest-unavailable');
      return response.json();
    }).catch(()=>null);
  return validateItqanCatalogTrack(await cached,surahNumber);
}
