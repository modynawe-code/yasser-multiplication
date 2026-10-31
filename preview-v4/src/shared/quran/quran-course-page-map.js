/**
 * Verified page lists generated from the real Hafs SVG polygon inventory.
 * Never infer continuation pages or mutate the original artwork.
 */
const SOURCE_PIN='b91d39e1065b57bdda3e94aca8ecf3575e50e1e6';
const URL='./assets/recitation/quran-course-page-map.json';
let cached=null;

export function expandQuranCoursePages(chapter,map){
  const original=chapter?.mushafPage;
  const n=Number(chapter?.surahNumber);
  const existing=Array.isArray(chapter?.mushafPages)?chapter.mushafPages:[original];
  if(map?.schemaVersion!==1||map?.sourcePin!==SOURCE_PIN
    ||original?.distributionCommit!==SOURCE_PIN)return existing;
  const nums=map.surahs?.[String(n)];
  if(!Array.isArray(nums)||!nums.length||nums.length>20
    ||nums.some((v,i)=>!Number.isInteger(v)||v<1||v>604||(i&&v<=nums[i-1]))
    ||!nums.includes(Number(chapter.pageNumber)))return existing;
  return nums.map(number=>{
    const known=existing.find(p=>p?.pageNumber===number);
    if(known)return known;
    const url=String(original.imageUrl||'');
    if(!/\/\d+\.svg$/.test(url))return null;
    const fallbacks=(original.fallbackImageUrls||[]).map(raw=>
      String(raw).replace(/\/\d+\.svg$/, '/'+number+'.svg'));
    return Object.freeze({...original,
      pageNumber:number,
      imagePath:'./assets/recitation/kfqc-hafs-page-'+number+'.svg',
      imageUrl:url.replace(/\/\d+\.svg$/,'/'+number+'.svg'),
      fallbackImageUrls:Object.freeze(fallbacks),
      offlineBundled:true,
      focusRegion:undefined
    });
  }).filter(Boolean);
}

export async function loadQuranCoursePages(chapter,{fetchImpl=globalThis.fetch}={}){
  if(!cached)cached=fetchImpl(URL,{cache:'no-cache'})
    .then(r=>{if(!r.ok)throw Error('quran-course-pages-unavailable');return r.json();})
    .catch(()=>null);
  const map=await cached;
  return expandQuranCoursePages(chapter,map);
}
