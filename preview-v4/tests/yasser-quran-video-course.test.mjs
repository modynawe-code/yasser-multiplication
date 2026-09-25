import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Yasser Quran exposes the six-video Surat Al-Qalam playlist',async()=>{
  const source=await read('src/modules/yasser/quran/yasser-quran-videos.js');
  assert.match(source,/PLSHONothJlCHJyUn3yaMpoRmXZEZXEQ5q/);
  assert.match(source,/lessonCount:6/);
  assert.match(source,/تفسير سورة القلم/);
  assert.match(source,/fvc-theme-quran/);
});

test('Quran screen links to the interpretation video course',async()=>{
  const source=await read('src/modules/yasser/quran/yasser-quran.js');
  assert.match(source,/id="yasserQuranQalamVideos"/);
  assert.match(source,/openYasserQalamVideoCourse/);
  assert.match(source,/6 دروس قصيرة/);
});

test('shared family video course keeps progress, navigation, fullscreen and YouTube fallback',async()=>{
  const source=await read('src/shared/video-course/video-course.js');
  assert.match(source,/createVideoCourse/);
  assert.match(source,/fvcPrev/);
  assert.match(source,/fvcNext/);
  assert.match(source,/fvcFullscreen/);
  assert.match(source,/\.95/);
  assert.match(source,/nativeFallback/);
  assert.match(source,/youtube\.com\/embed/);
});


test('shared video course module parses and exports its factory',async()=>{
  const module=await import('../src/shared/video-course/video-course.js');
  assert.equal(typeof module.createVideoCourse,'function');
});
