import test from 'node:test';
import assert from 'node:assert/strict';
import {validateItqanTrack,isHafsRecitation,listItqanPages} from '../tools/build-itqan-cms-tracks.mjs';
import {validateItqanCatalogTrack,isItqanEnabledOrigin,loadItqanTrack} from '../src/shared/quran/itqan-catalog-source.js';

const track={surah_number:114,ayahs_count:6,duration_ms:30000,
  audio_url:'https://cdn.itqan.dev/test-only-an-nas.mp3',
  ayahs_timings:Array.from({length:6},(_,i)=>({ayah_key:'114:'+(i+1),start_ms:i*5000,end_ms:(i+1)*5000}))};
const accepted=validateItqanTrack(track);
const catalog={schemaVersion:1,source:'Itqan CMS https://api.cms.itqan.dev',
  recitationId:11,reciter:'مقرئ الاختبار',riwayah:'حفص عن عاصم',
  tracks:{'114':accepted}};

test('Itqan CMS track keeps the exact HTTPS audio and all per-ayah timings from one row',()=>{
  assert.equal(isHafsRecitation({id:11,riwayah:{name:'حفص عن عاصم'}}),true);
  assert.equal(isHafsRecitation({id:11,riwayah:{name:'ورش'}}),false);
  assert.deepEqual(accepted.ayahTimings.map(x=>x.ayahKey),['114:1','114:2','114:3','114:4','114:5','114:6']);
  assert.equal(validateItqanCatalogTrack(catalog,114)?.audioPath,track.audio_url);
  assert.equal(validateItqanCatalogTrack(catalog,114)?.reciter,'مقرئ الاختبار');
});

test('rejects duplicate, reordered or truncated ayah timing rows and wrong recitation',()=>{
  assert.equal(validateItqanTrack({...track,ayahs_timings:track.ayahs_timings.slice(0,5)}),null);
  assert.equal(validateItqanTrack({...track,ayahs_timings:track.ayahs_timings.map((t,i)=>i===4?{...t,ayah_key:'114:3'}:t)}),null);
  assert.equal(validateItqanTrack({...track,ayahs_timings:track.ayahs_timings.map((t,i)=>i===4?{...t,start_ms:100}:t)}),null);
  assert.equal(validateItqanTrack({...track,audio_url:'http://insecure.test/a.mp3'}),null);
  assert.equal(validateItqanCatalogTrack({...catalog,riwayah:'ورش'},114),null);
  assert.equal(validateItqanCatalogTrack(catalog,1),null);
  assert.equal(validateItqanCatalogTrack({...catalog,tracks:{'114':{...accepted,surahNumber:1}}},114),null);
});

test('Itqan CMS integration remains isolated and does not access the trial catalog on ordinary sites',async()=>{
  assert.equal(isItqanEnabledOrigin({hostname:'family-learning-fatiha-pilot.modynawe.workers.dev'}),true);
  assert.equal(isItqanEnabledOrigin({hostname:'family-learning-preview.modynawe.workers.dev'}),true);
  assert.equal(isItqanEnabledOrigin({hostname:'modynawe-code.github.io'}),false);
  let called=0;
  const outside=await loadItqanTrack(114,{
    location:{hostname:'modynawe-code.github.io'},
    fetchImpl:async()=>{called++;return {ok:true,json:async()=>catalog};}
  });
  assert.equal(outside,null);assert.equal(called,0);
});

test('pagination uses official count/page and refuses missing data',async()=>{
  const calls=[];
  const fake=async url=>{
    const q=new URL(url);
    calls.push(q.searchParams.get('page'));
    const page=Number(q.searchParams.get('page'));
    return{ok:true,json:async()=>({count:201,results:page===1?Array(200).fill({id:1}):[{id:2}]})};
  };
  const rows=await listItqanPages('/recitations/',{fetchImpl:fake});
  assert.equal(rows.length,201);
  assert.deepEqual(calls,['1','2']);
  await assert.rejects(listItqanPages('/forbidden/',{fetchImpl:fake}),/itqan-path-invalid/);
});
