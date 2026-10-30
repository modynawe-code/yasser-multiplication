import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {deriveOfficialSurahCrop,parseOfficialAyahPolygons} from '../src/shared/quran/quran-svg-ayah-polygons.js';

// Read original ayah polygons only; never inspect or rewrite Quran wording.
function verifiedRows(svg){
  return [...svg.matchAll(/<path class="ayahPolygon"[^>]*>/g)].flatMap(([tag])=>{
    const surah=Number(tag.match(/\bsurah="(\d+)"/)?.[1]);
    const d=tag.match(/\sd="([^"]+)"/)?.[1]||'';
    const numbers=d.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)/g)?.map(Number)||[];
    const ys=numbers.filter((_,i)=>i%2===1);
    return Number.isInteger(surah)&&ys.length
      ?[{surah,top:Math.min(...ys),bottom:Math.max(...ys)}]:[];
  });
}

test('source-derived crops include every verse and exclude previous verses for six bundled short surahs',async()=>{
  for(const [page,surahs] of [[603,[109,110,111]],[604,[112,113,114]]]){
    const svg=await readFile(new URL(`../assets/recitation/kfqc-hafs-page-${page}.svg`,import.meta.url),'utf8');
    const viewBox=svg.match(/\bviewBox="([^"]+)"/)?.[1];
    const [,pageY,,pageH]=viewBox.split(/\s+/).map(Number);
    const rows=verifiedRows(svg);
    for(const surah of surahs){
      const crop=deriveOfficialSurahCrop(viewBox,rows,surah);
      assert.ok(crop,`missing verified source-derived crop for surah ${surah}`);
      const current=rows.filter(row=>row.surah===surah);
      assert.ok(current.length);
      const top=pageY+crop.top*pageH,bottom=top+crop.height*pageH;
      assert.ok(current.every(row=>row.top>=top-.01&&row.bottom<=bottom+.01),
        `surah ${surah} clipped authentic ayah artwork`);
      assert.ok(rows.filter(row=>row.surah!==surah&&row.bottom<=current[0].top)
        .every(row=>row.bottom<=top+.01),`surah ${surah} shows preceding surah verse`);
    }
  }
});

test('missing or unsupported polygon geometry cannot produce fabricated crop',()=>{
  assert.equal(deriveOfficialSurahCrop('0 0 345 550',[],107),null);
  assert.equal(deriveOfficialSurahCrop('bad viewbox',[{surah:107,top:100,bottom:200}],107),null);
  assert.equal(deriveOfficialSurahCrop('0 0 345 550',[{surah:107,top:100,bottom:200}],107),null);
  assert.equal(deriveOfficialSurahCrop('0 0 345 550',[
    {surah:106,top:130,bottom:190},{surah:107,top:252,bottom:388},{surah:108,top:450,bottom:525}
  ],107)?.top,(190+8)/550);
});


test('the actual SVG parser exposes correct source crop, not only the pure helper',async()=>{
  const svg=await readFile(new URL('../assets/recitation/kfqc-hafs-page-604.svg',import.meta.url),'utf8');
  const parserFactory=()=>({
    parseFromString(text){
      const viewBox=text.match(/<svg[^>]*viewBox="([^"]+)"/)?.[1];
      const nodes=[...text.matchAll(/<path class="ayahPolygon"[^>]+\/>/g)]
        .map(([tag])=>({
          getAttribute(name){
            return tag.match(new RegExp('(?:^|\\s)'+name+'="([^"]*)"'))?.[1]??null;
          }
        }));
      return {documentElement:{
        localName:'svg',getAttribute:name=>name==='viewBox'?viewBox:null,
        querySelector:()=>null,querySelectorAll:()=>nodes
      }};
    }
  });
  const result=parseOfficialAyahPolygons(svg,113,{parserFactory});
  assert.equal(result?.paths.length,5,'all verified surah Al-Falaq ayah shapes must parse');
  assert.ok(result.focusRegion?.height>0,
    'a valid multi-surah Quran SVG must yield a source-derived focus region');
  assert.ok(result.focusRegion.top>0&&result.focusRegion.top<.35,
    'Al-Falaq crop starts below Al-Ikhlas, including the heading');
});
