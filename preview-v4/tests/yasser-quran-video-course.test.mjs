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

test('Quran screen exposes interpretation as a primary study path',async()=>{
  const source=await read('src/modules/yasser/quran/yasser-quran.js');
  assert.match(source,/data-yq-mode="interpretation"/);
  assert.match(source,/id="yasserQuranQalamVideos"/);
  assert.match(source,/openYasserQalamVideoCourse/);
  assert.match(source,/6 دروس فيديو/);
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


test('Quran hierarchy uses compact term tabs, three primary paths and a resumable last activity',async()=>{
  const source=await read('src/modules/yasser/quran/yasser-quran.js');
  const css=await read('src/modules/yasser/quran/yasser-quran.css');
  assert.match(source,/الفصل الأول/);
  assert.match(source,/التلاوة/);
  assert.match(source,/الحفظ غيب/);
  assert.match(source,/التفسير/);
  assert.match(source,/id="yasserQuranContinue"/);
  assert.match(source,/function continueLast/);
  assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css,/\.yasser-quran-last/);
  assert.match(css,/\.yasser-quran-interpretation/);
});

test('Quran list cards remain touch-friendly while reducing vertical density',async()=>{
  const css=await read('src/modules/yasser/quran/yasser-quran.css');
  assert.match(css,/\.yasser-quran-surah[\s\S]*min-height:68px/);
  assert.match(css,/@media \(max-width:700px\)[\s\S]*min-height:66px/);
});
