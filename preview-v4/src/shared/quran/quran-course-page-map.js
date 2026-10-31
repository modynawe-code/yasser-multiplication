/**
 * Verified page lists generated from the real Hafs SVG polygon inventory.
 * Never infer continuation pages or mutate the original artwork.
 */
const SOURCE_PIN='b91d39e1065b57bdda3e94aca8ecf3575e50e1e6';
const URL='./assets/recitation/quran-course-page-map.json';
let cached=null;
async function loadPinnedMap(fetchImpl){
  if(!cached)cached=fetchImpl(URL,{cache:'no-cache'})
    .then(r=>{if(!r.ok)throw Error('quran-course-pages-unavailable');return r.json();})
    .catch(()=>null);
  return cached;
}

// This path is emitted only after the build verifies the pinned per-surah
// SVG matches the full original file, byte-for-byte except the viewBox.
export function isolatedSurahView(page,surahNumber,map){
  const number=Number(page),surah=Number(surahNumber);
  if(map?.schemaVersion!==1||map?.sourcePin!==SOURCE_PIN
    ||!Number.isInteger(number)||number<1||number>604
    ||!Number.isInteger(surah)||surah<1||surah>114
    ||!map.surahs?.[String(surah)]?.includes(number))return null;
  const saved=map.isolatedViews?.[number+':'+surah];
  const expected='./assets/recitation/kfqc-hafs-page-'+number+'-surah'+surah+'.svg';
  const dims=String(saved?.viewBox||'').split(/\s+/).map(Number);
  if(saved?.imagePath!==expected||dims.length!==4||!dims.every(Number.isFinite)
    ||dims[2]<=0||dims[3]<=0)return null;
  return Object.freeze({imagePath:expected,viewBox:saved.viewBox});
}
export async function findBundledSurahView(page,surah,{fetchImpl=globalThis.fetch}={}){
  return isolatedSurahView(page,surah,await loadPinnedMap(fetchImpl));
}

/** Return only source-authenticated verse positions, never inferred offsets. */
export function pageForBundledQuranAyah(surahNumber,ayahNumber,map){
  const surah=Number(surahNumber),ayah=Number(ayahNumber);
  if(map?.schemaVersion!==1||map?.sourcePin!==SOURCE_PIN
    ||!Number.isInteger(surah)||surah<1||surah>114
    ||!Number.isInteger(ayah)||ayah<1||ayah>286)return null;
  const pages=map.surahs?.[String(surah)],versePages=map.ayahPages?.[String(surah)];
  if(!Array.isArray(pages)||!Array.isArray(versePages)||versePages.length<ayah)return null;
  const page=versePages[ayah-1];
  return Number.isInteger(page)&&pages.includes(page)?page:null;
}
export async function findBundledQuranAyahPage(surahNumber,ayahNumber,{fetchImpl=globalThis.fetch}={}){
  return pageForBundledQuranAyah(surahNumber,ayahNumber,await loadPinnedMap(fetchImpl));
}

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
    const view=isolatedSurahView(number,n,map);
    if(known)return view?Object.freeze({...known,isolatedImagePath:view.imagePath,isolatedViewBox:view.viewBox}):known;
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
      ...(view?{isolatedImagePath:view.imagePath,isolatedViewBox:view.viewBox}:{}),
      focusRegion:undefined
    });
  }).filter(Boolean);
}

export async function loadQuranCoursePages(chapter,{fetchImpl=globalThis.fetch}={}){
  const map=await loadPinnedMap(fetchImpl);
  return expandQuranCoursePages(chapter,map);
}
