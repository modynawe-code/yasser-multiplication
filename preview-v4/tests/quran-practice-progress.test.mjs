import test from 'node:test';
import assert from 'node:assert/strict';
import {
  practiceStorageKey,loadQuranPractice,markQuranPractice,
  getQuranPracticeStage,validPracticeVerse
} from '../src/shared/quran/quran-practice-progress.js';
import {readFile} from 'node:fs/promises';
const mock=()=>{
  const data=new Map();
  return {
    data,getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)
  };
};
const fixed={now:()=>'2026-10-30T12:00:00.000Z'};
test('range completion only changes isolated Quran practice records for the intended child',()=>{
  const storage=mock();
  assert.equal(markQuranPractice('khaled',{surahNumber:93,fromAyah:1,toAyah:4,stage:'listened'},{storage,...fixed}),true);
  assert.equal(getQuranPracticeStage('khaled',93,4,{storage}).stage,'listened');
  assert.equal(getQuranPracticeStage('yasser',93,4,{storage}),null);
  assert.equal(getQuranPracticeStage('mashaal',93,4,{storage}),null);
  assert.equal(loadQuranPractice('khaled',{storage}).last.ayahNumber,1);
  assert.ok([...storage.data.keys()].every(key=>key.startsWith('family-learning:quran-practice:v1:')));
  assert.equal(storage.data.has('family-learning:yasser:quran:v1'),false);
});
test('repetition and self-review are manually confirmed; never infer memorization from playback',()=>{
  const storage=mock(),base={surahNumber:1,fromAyah:2,toAyah:3};
  for(const stage of ['listened','repeated','reviewed']){
    assert.equal(markQuranPractice('yasser',{...base,stage},{storage,...fixed}),true);
  }
  assert.equal(getQuranPracticeStage('yasser',1,2,{storage}).stage,'reviewed');
  assert.equal(getQuranPracticeStage('yasser',1,2,{storage}).attempts,3);
  markQuranPractice('yasser',{...base,stage:'listened'},{storage,...fixed});
  assert.equal(getQuranPracticeStage('yasser',1,3,{storage}).stage,'reviewed','do not downgrade earned manual review');
  assert.equal(markQuranPractice('mashaal',{...base,stage:'reviewed'},{storage,...fixed}),false,'no KG3 exam scores');
  assert.equal(markQuranPractice('mashaal',{...base,stage:'repeated'},{storage,...fixed}),true);
  assert.equal(getQuranPracticeStage('mashaal',1,2,{storage}).stage,'repeated');
});
test('invalid, huge, corrupted and inaccessible progress fail safely',()=>{
  const storage=mock();
  const b={surahNumber:38,fromAyah:1,toAyah:2,stage:'reviewed'};
  assert.equal(practiceStorageKey('invalid-child'),null);
  assert.equal(validPracticeVerse(1,0),false);
  assert.equal(markQuranPractice('hacker',b,{storage,...fixed}),false);
  assert.equal(markQuranPractice('yasser',{...b,stage:'mastered'},{storage,...fixed}),false);
  assert.equal(markQuranPractice('yasser',{...b,toAyah:80},{storage,...fixed}),false);
  assert.equal(markQuranPractice('yasser',{...b,fromAyah:7,toAyah:4},{storage,...fixed}),false);
  storage.data.set(practiceStorageKey('yasser'),'{corrupt-json');
  assert.equal(loadQuranPractice('yasser',{storage}).last,null);
  assert.equal(markQuranPractice('yasser',b,{storage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}},...fixed}),false);
});
test('all three Quran routes receive the same learner-aware player, preserving old page progress',async()=>{
  const paths=[
    '../src/modules/yasser/quran/yasser-quran.js',
    '../src/modules/khaled/quran/khaled-quran.js',
    '../src/modules/mashaal/ui/mashaal-controller.js'
  ];
  const source=await Promise.all(paths.map(p=>readFile(new URL(p,import.meta.url),'utf8')));
  assert.match(source[0],/learnerId:'yasser'/);
  assert.match(source[1],/learnerId:'khaled'/);
  assert.match(source[2],/learnerId:'mashaal'/);
  assert.match(source[0],/const STORAGE_KEY='family-learning:yasser:quran:v1'/);
  const player=await readFile(new URL('../src/modules/mashaal/quran/quran-surah-player.js',import.meta.url),'utf8');
  assert.match(player,/const selectRange=async \(start,end\)=>/);
  assert.match(player,/start===end\?'اكتمل تكرار الآية '/);
  assert.match(player,/markQuranPractice\(learnerId,/);
  assert.match(player,/figure\.classList\.toggle\('quran-practice-blind',practiceBlind\)/);
  assert.match(player,/autoFollowOfficialPages:true/);
});
