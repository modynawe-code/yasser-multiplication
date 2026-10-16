import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { KHALED_SCIENCE_ATLAS,KHALED_SCIENCE_ATLAS_WIDTH,KHALED_SCIENCE_ATLAS_HEIGHT,KHALED_SCIENCE_ATLAS_PARTS } from '../src/modules/khaled/science/khaled-science-atlas-manifest.js';
import { KHALED_SCIENCE_CHAPTERS,KHALED_SCIENCE_LESSONS,KHALED_SCIENCE_ACTIVITY_COUNT } from '../src/modules/khaled/science/khaled-science-curriculum.js';
import { KHALED_SCIENCE_LESSONS as RUNTIME_LESSONS } from '../src/modules/khaled/science/khaled-science-data.js';

const read=path=>readFile(new URL(`../${path}`,import.meta.url));

test('science curriculum covers all five chapters and worksheet pages 2 through 17',()=>{
  assert.equal(KHALED_SCIENCE_CHAPTERS.length,5);
  assert.equal(KHALED_SCIENCE_LESSONS.length,16);
  assert.equal(KHALED_SCIENCE_ACTIVITY_COUNT,137);
  assert.deepEqual(KHALED_SCIENCE_CHAPTERS.map(chapter=>chapter.lessons.length),[3,3,3,3,4]);
  const pages=[...new Set(KHALED_SCIENCE_LESSONS.flatMap(lesson=>lesson.activities.map(activity=>activity.sourcePage)))].sort((a,b)=>a-b);
  assert.deepEqual(pages,Array.from({length:16},(_,index)=>index+2));
});

test('all worksheet artwork references resolve in the atlas',()=>{
  assert.equal(KHALED_SCIENCE_ATLAS_WIDTH,1120);
  assert.equal(KHALED_SCIENCE_ATLAS_HEIGHT,1820);
  const missing=[];
  for(const lesson of KHALED_SCIENCE_LESSONS)for(const activity of lesson.activities){
    for(const option of activity.options||[])if(option.art&&!KHALED_SCIENCE_ATLAS[option.art])missing.push(`${activity.id}:${option.art}`);
    for(const pair of activity.pairs||[])for(const key of [pair.leftArt,pair.art])if(key&&!KHALED_SCIENCE_ATLAS[key])missing.push(`${activity.id}:${key}`);
    for(const item of activity.items||[])if(item.art&&!KHALED_SCIENCE_ATLAS[item.art])missing.push(`${activity.id}:${item.art}`);
  }
  assert.deepEqual(missing,[]);
});

test('runtime exposes every activity through supported interactive types',()=>{
  assert.equal(RUNTIME_LESSONS.length,16);
  assert.equal(RUNTIME_LESSONS.reduce((sum,lesson)=>sum+lesson.activities.length,0),137);
  const allowed=new Set(['single','multi','truefalse','matching']);
  const ids=new Set();
  for(const lesson of RUNTIME_LESSONS)for(const activity of lesson.activities){assert.ok(allowed.has(activity.type),activity.type);assert.ok(!ids.has(activity.id),activity.id);ids.add(activity.id);}
  assert.equal(ids.size,137);
});

test('science atlas parts reconstruct a real complete WebP worksheet atlas',async()=>{
  assert.equal(KHALED_SCIENCE_ATLAS_PARTS.length,19);
  const encoded=(await Promise.all(KHALED_SCIENCE_ATLAS_PARTS.map(async path=>(await read(path)).toString('utf8').trim()))).join('');
  const data=Buffer.from(encoded,'base64');
  assert.ok(data.length>50000);
  assert.equal(data.subarray(0,4).toString('ascii'),'RIFF');
  assert.equal(data.subarray(8,12).toString('ascii'),'WEBP');
  assert.equal(data.readUInt32LE(4)+8,data.length);
});

test('science runtime keeps independent progress, speech and worksheet imagery',async()=>{
  const runtime=(await read('src/modules/khaled/science/khaled-science.js')).toString('utf8');
  assert.match(runtime,/family-learning:khaled:science:v1/);
  assert.match(runtime,/createSpeechService/);
  assert.match(runtime,/KHALED_SCIENCE_ATLAS_PARTS/);
  assert.match(runtime,/decodeAtlasPart/);
  assert.match(runtime,/sources\.join\(''\)/);
  assert.match(runtime,/new Blob\(\[atlasBytes\],\{type:'image\/webp'\}\)/);
  assert.match(runtime,/URL\.createObjectURL/);
  assert.match(runtime,/activity\.type==='single'/);
  assert.match(runtime,/activity\.type==='multi'/);
  assert.match(runtime,/activity\.type==='matching'/);
  assert.match(runtime,/activity\.type==='truefalse'/);
  assert.match(runtime,/activity\.type==='sequence'/);
});