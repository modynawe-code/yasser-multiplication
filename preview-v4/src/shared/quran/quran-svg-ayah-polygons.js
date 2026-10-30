/**
 * Quran SVG (quran.ws / King Fahd Complex Hafs) is the source of verse geometry.
 * Read the exact existing page's embedded ayahPolygon nodes; never calculate
 * coordinates or write per-surah polygon tables.
 * Only shapes + the page's viewBox are returned, never untrusted SVG markup.
 */
// Derive an optional short-surah viewport from the actual page's verified
// verse polygons. A gap of at most eight SVG units preserves the title and
// basmala between two surahs without displaying the previous surah's verses.
// This is a presentation crop only: no Quran text or ayah polygon is changed.
export function deriveOfficialSurahCrop(viewBox,rows,surahNumber){
  const parts=String(viewBox||'').trim().split(/\s+/).map(Number);
  if(parts.length!==4||!parts.every(Number.isFinite)||parts[3]<=0)return null;
  if(!Array.isArray(rows)||!rows.length)return null;
  const groups=new Map();
  for(const row of rows){
    const surah=Number(row?.surah),top=Number(row?.top),bottom=Number(row?.bottom);
    if(!Number.isInteger(surah)||surah<1||surah>114
      ||!Number.isFinite(top)||!Number.isFinite(bottom)||bottom<=top)continue;
    const prev=groups.get(surah);
    groups.set(surah,prev
      ?{top:Math.min(prev.top,top),bottom:Math.max(prev.bottom,bottom)}
      :{top,bottom});
  }
  if(groups.size<2||!groups.has(Number(surahNumber)))return null;
  const target=groups.get(Number(surahNumber));
  const before=[...groups.entries()].filter(([n,b])=>n!==Number(surahNumber)&&b.bottom<=target.top)
    .map(([,b])=>b.bottom);
  const after=[...groups.entries()].filter(([n,b])=>n!==Number(surahNumber)&&b.top>=target.bottom)
    .map(([,b])=>b.top);
  const pageTop=parts[1],pageBottom=parts[1]+parts[3];
  const previous=before.length?Math.max(...before):null;
  const next=after.length?Math.min(...after):null;
  const top=previous===null?pageTop:previous+Math.min(8,(target.top-previous)/4);
  const bottom=next===null?pageBottom:target.bottom+Math.min(8,(next-target.bottom)/4);
  if(!(top<target.top&&bottom>target.bottom&&top>=pageTop&&bottom<=pageBottom))return null;
  return Object.freeze({top:(top-pageTop)/parts[3],height:(bottom-top)/parts[3]});
}

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
  const rows=[];
  for(const node of svg.querySelectorAll('path.ayahPolygon')){
    const surah=Number(node.getAttribute('surah')),ayah=Number(node.getAttribute('ayah'));
    const d=node.getAttribute('d');
    // Quranpedia bundled ayahPolygon nodes use M/L coordinate pairs.
    // Skip unsupported path commands rather than guessing geometry.
    if(Number.isInteger(surah)&&surah>=1&&surah<=114&&d
      &&/^[MmLlZz0-9+.,\\s-]+$/.test(d)){
      const values=d.match(/[-+]?(?:\\d*\\.\\d+|\\d+\\.?\\d*)/g)?.map(Number)||[];
      if(values.length>=4&&values.length%2===0&&values.every(Number.isFinite)){
        const ys=values.filter((_,i)=>i%2===1);
        rows.push({surah,top:Math.min(...ys),bottom:Math.max(...ys)});
      }
    }
    if(surah!==n)continue;
    if(!Number.isInteger(ayah)||ayah<1||ayah>300||!d
      ||!/^[MmLlHhVvCcQqTtSsAaZz0-9eE+.,\s-]+$/.test(d)
      ||keys.has(ayah))return null;
    keys.add(ayah);
    paths.push({ayahKey:n+':'+ayah,d});
  }
  if(!paths.length)return null;
  return {viewBox,paths,focusRegion:deriveOfficialSurahCrop(viewBox,rows,n)};
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
