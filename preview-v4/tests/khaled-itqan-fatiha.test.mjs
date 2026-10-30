import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
  isIbrahimAlAkhdarHafs,validateFatihaTrack,loadItqanFatiha
} from '../src/modules/khaled/quran/itqan-fatiha.js';

// Synthetic TEST-ONLY offsets: never used as real Quran timestamps.
const TEST_TIMINGS=Array.from({length:7},(_,index)=>({
  ayah_key:`1:${index+1}`,start_ms:index*1000,end_ms:(index+1)*1000
}));
const TRACK={surah_number:1,ayahs_count:7,duration_ms:7000,
  audio_url:'https://cdn.itqan.dev/test-only-fatiha.mp3',ayahs_timings:TEST_TIMINGS};
const RECITER={id:123,reciter:{name:'Ibrahim Al Akhdar'},riwayah:{name:'Hafs'}};

function stubFetch(routes){
  return async url=>{
    const key=new URL(url).pathname+new URL(url).search;
    if(!Object.hasOwn(routes,key))return {ok:false,status:404};
    return {ok:true,json:async()=>routes[key]};
  };
}

test('optional Itqan client requires the exact chosen reciter and Hafs narration',()=>{
  assert.equal(isIbrahimAlAkhdarHafs(RECITER),true);
  assert.equal(isIbrahimAlAkhdarHafs({reciter:{name:'إبراهيم الأخضر'},riwayah:{name:'حفص'}}),true);
  assert.equal(isIbrahimAlAkhdarHafs({reciter:{name:'Mishary Rashid Alafasy'},riwayah:{name:'Hafs'}}),false);
  assert.equal(isIbrahimAlAkhdarHafs({reciter:{name:'Ibrahim Al Akhdar'},riwayah:{name:'Warsh'}}),false);
});

test('timings must match one complete seven-ayah Al-Fatiha track and HTTPS audio',()=>{
  assert.deepEqual(validateFatihaTrack(TRACK)?.ayahTimings.map(t=>t.ayahKey),TEST_TIMINGS.map(t=>t.ayah_key));
  assert.equal(validateFatihaTrack({...TRACK,audio_url:'http://unsafe.test/001.mp3'}),null);
  assert.equal(validateFatihaTrack({...TRACK,ayahs_timings:TEST_TIMINGS.slice(0,6)}),null);
  assert.equal(validateFatihaTrack({...TRACK,ayahs_timings:TEST_TIMINGS.map((t,i)=>i===4?{...t,start_ms:200}:t)}),null);
  assert.equal(validateFatihaTrack({...TRACK,ayahs_timings:TEST_TIMINGS.map((t,i)=>i===2?{...t,ayah_key:'1:4'}:t)}),null);
});

test('loads audio and timestamps from the same Itqan track, never from the existing recording',async()=>{
  const requests=[];
  const fetcher=stubFetch({
    '/recitations/':{results:[RECITER],next:null},
    '/recitations/123/':{results:[TRACK],next:null}
  });
  const result=await loadItqanFatiha({fetchImpl:async(url,options)=>{
    requests.push([url,options?.headers?.Accept]);
    return fetcher(url);
  }});
  assert.equal(result.audioPath,TRACK.audio_url);
  assert.equal(result.ayahTimings.length,7);
  assert.deepEqual(requests.map(item=>new URL(item[0]).pathname),['/recitations/','/recitations/123/']);
  assert.ok(requests.every(item=>item[1]==='application/json'));
});

test('fails closed when Al Akhdar is unavailable or verse timings have gaps/invalid duration',async()=>{
  const noReciter=stubFetch({'/recitations/':{results:[{...RECITER,reciter:{name:'Other'}}],next:null}});
  await assert.rejects(loadItqanFatiha({fetchImpl:noReciter}),/matching-akhdar/);
  const wrongTimings=stubFetch({
    '/recitations/':{results:[RECITER],next:null},
    '/recitations/123/':{results:[{...TRACK,duration_ms:2000}],next:null}
  });
  await assert.rejects(loadItqanFatiha({fetchImpl:wrongTimings}),/matching-fatiha/);
});

test('pagination cannot redirect the browser to third-party hosts',async()=>{
  const malicious=stubFetch({'/recitations/':{results:[],next:'https://other.example/api/recitations/'}});
  await assert.rejects(loadItqanFatiha({fetchImpl:malicious}),/unexpected-itqan-pagination/);
});

test('pilot is limited to Khaled Fatiha and older three-child player paths stay compatible',async()=>{
  const khaled=await readFile(new URL('../src/modules/khaled/quran/khaled-quran.js',import.meta.url),'utf8');
  const shared=await readFile(new URL('../src/modules/mashaal/quran/quran-surah-player.js',import.meta.url),'utf8');
  assert.match(khaled,/if\(item\.surahNumber===1\)/);
  assert.match(khaled,/const verified=await loadItqanFatiha\(\)/);
  assert.match(khaled,/ayahTimings:verified\.ayahTimings/);
  assert.match(shared,/ayahTimings=null/);
  assert.match(shared,/if\(ayahs\.length\)/);
  assert.match(shared,/clearAyahSelection\(\)/);
});
