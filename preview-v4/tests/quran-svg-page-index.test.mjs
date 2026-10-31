import test from 'node:test';
import assert from 'node:assert/strict';
import {findOfficialHafsPage,pageIndexInCurriculum} from '../src/shared/quran/quran-svg-page-index.js';
import {readFile} from 'node:fs/promises';

function mockData(){
  const surahs=Array.from({length:114},(_,i)=>({
    number:i+1,ayahCount:10,pageNumber:1
  }));
  // Realistic Yasser course section: surah 38 starts at 453,
  // next chapter at 458; content below is TEST SYNTHETIC.
  surahs[37]={number:38,ayahCount:88,pageNumber:453};
  surahs[38]={number:39,ayahCount:75,pageNumber:458};
  const p=(ayahs)=>ayahs.map(ayahNumber=>({
    surahNumber:38,ayahNumber,polygon:'M 0 0 L 4 4 Z'
  }));
  return new Map([
    ['surah.json',surahs],
    ['453.json',p([1,2,3])],
    ['454.json',p([10,15])],
    ['455.json',p([24,25])],
    ['456.json',p([39,40,45])],
    ['457.json',p([60,88])],
    ['458.json',[{surahNumber:39,ayahNumber:1}]]
  ]);
}
function mockFetch(map,calls){
  return async url=>{
    const name=url.split('/').at(-1);calls.push(name);
    return {ok:map.has(name),json:async()=>structuredClone(map.get(name))};
  };
}
test('looks up a verse page from Quran SVG canonical JSON without inferring its position',async()=>{
  const calls=[],data=mockData(),cacheMap=new Map();
  const found=await findOfficialHafsPage(38,40,{fetchImpl:mockFetch(data,calls),cacheMap});
  assert.equal(found,456);
  assert.deepEqual(calls,['surah.json','455.json','457.json','456.json']);
  assert.equal(await findOfficialHafsPage(38,40,{fetchImpl:mockFetch(data,calls),cacheMap}),456);
  assert.equal(calls.length,4,'the pinned Quran SVG JSON responses are cached');
  assert.equal(pageIndexInCurriculum([{pageNumber:453},{pageNumber:456},{pageNumber:458}],456),1);
  assert.equal(pageIndexInCurriculum([{pageNumber:453}],456),-1);
});

test('rejects invalid ayah IDs and missing pages without inventing a result',async()=>{
  const calls=[],data=mockData(),fetchImpl=mockFetch(data,calls),cacheMap=new Map();
  assert.equal(await findOfficialHafsPage(38,89,{fetchImpl,cacheMap}),null);
  assert.equal(await findOfficialHafsPage(0,1,{fetchImpl,cacheMap}),null);
  assert.equal(await findOfficialHafsPage(38,0,{fetchImpl,cacheMap}),null);
  assert.equal(await findOfficialHafsPage(38,1.2,{fetchImpl,cacheMap}),null);
  assert.equal(await findOfficialHafsPage(38,88,{fetchImpl,cacheMap}),457);
  assert.equal(pageIndexInCurriculum([],457),-1);
});

test('only the opt-in Itqan player follows pages: original school progress is untouched',async()=>{
  const player=await readFile(new URL('../src/modules/mashaal/quran/quran-surah-player.js',import.meta.url),'utf8');
  assert.match(player,/autoFollowOfficialPages=false/);
  assert.match(player,/autoFollowOfficialPages:true/);
  assert.match(player,/findOfficialHafsPage\(sura,verse\)/);
  assert.match(player,/pageIndexInCurriculum\(pages,pageNumber\)/);
  assert.match(player,/if\(next>=0&&next!==pageIndex\)changePage\(next\)/);
  assert.match(player,/if\(destroyed\|\|ticket!==followTicket\|\|pageNumber==null\)return/);
});
