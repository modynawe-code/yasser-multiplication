/**
 * Quran SVG (quran.ws / King Fahd Complex Hafs) is the source of verse geometry.
 * Read the exact existing page's embedded ayahPolygon nodes; never calculate
 * coordinates or write per-surah polygon tables.
 * Only shapes + the page's viewBox are returned, never untrusted SVG markup.
 */
export function parseOfficialAyahPolygons(svgText,surahNumber,{parserFactory=()=>new DOMParser()}={}){
  if(typeof svgText!=='string'||!svgText.startsWith('<')||svgText.length>5_000_000)return null;
  const n=Number(surahNumber);
  if(!Number.isInteger(n)||n<1||n>114)return null;
  const doc=parserFactory().parseFromString(svgText,'image/svg+xml');
  const svg=doc.documentElement;
  if(svg?.localName!=='svg'||svg.querySelector('parsererror'))return null;
  const viewBox=svg.getAttribute('viewBox')?.trim();
  if(!viewBox||viewBox.split(/\s+/).length!==4
    ||!viewBox.split(/\s+/).every(x=>Number.isFinite(Number(x))))return null;
  const paths=[];
  const keys=new Set();
  for(const node of svg.querySelectorAll('path.ayahPolygon')){
    const surah=Number(node.getAttribute('surah')),ayah=Number(node.getAttribute('ayah'));
    if(surah!==n)continue;
    const d=node.getAttribute('d');
    if(!Number.isInteger(ayah)||ayah<1||ayah>300||!d
      ||!/^[MmLlHhVvCcQqTtSsAaZz0-9eE+.,\s-]+$/.test(d)
      ||keys.has(ayah))return null;
    keys.add(ayah);
    paths.push({ayahKey:n+':'+ayah,d});
  }
  if(!paths.length)return null;
  return {viewBox,paths};
}
export async function fetchOfficialAyahPolygons(pageSource,surahNumber,{fetchImpl=fetch}={}){
  const url=new URL(pageSource,globalThis.location?.href||'https://example.test/');
  const trustedSameOrigin=url.origin===(globalThis.location?.origin||'none')
    &&/^\/assets\/recitation\/kfqc-hafs-page-\d+\.svg$/.test(url.pathname);
  const trustedPinned=
    url.hostname==='cdn.jsdelivr.net'&&/^\/gh\/quranpedia\/quran-svg@[a-f0-9]{40}\/mushafs\/hafs\/kfqc\/svg\/\d+\.svg$/.test(url.pathname)
    ||url.hostname==='raw.githubusercontent.com'&&/^\/quranpedia\/quran-svg\/[a-f0-9]{40}\/mushafs\/hafs\/kfqc\/svg\/\d+\.svg$/.test(url.pathname);
  // Localhost HTTP is permitted only for local automated verification.
  // Deployed applications and all remote SVG origins must use HTTPS.
  const localTest=trustedSameOrigin&&url.protocol==='http:'
    &&(url.hostname==='127.0.0.1'||url.hostname==='localhost');
  if(!((url.protocol==='https:'&&(trustedSameOrigin||trustedPinned))||localTest))
    throw new Error('untrusted-quran-svg-source');
  const response=await fetchImpl(url.href,{mode:'cors',redirect:'error'});
  if(!response.ok)throw new Error('quran-svg-unavailable');
  const text=await response.text();
  const result=parseOfficialAyahPolygons(text,surahNumber);
  if(!result)throw new Error('quran-svg-ayah-polygons-invalid');
  return result;
}
