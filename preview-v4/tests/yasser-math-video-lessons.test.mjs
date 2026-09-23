import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {YASSER_MATH_COURSE,YASSER_MATH_LESSONS,YASSER_MATH_PLAYLIST_ID} from '../src/modules/yasser/math/video-lesson-data.js';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Yasser math video course keeps the verified playlist and exactly 34 lesson slots',()=>{
  assert.equal(YASSER_MATH_PLAYLIST_ID,'PLyoodbH_5mVJEpMP0ZPJcyA9bFkTqbESX');
  assert.equal(YASSER_MATH_COURSE.totalLessons,34);
  assert.equal(YASSER_MATH_LESSONS.length,34);
  assert.deepEqual(YASSER_MATH_LESSONS.slice(0,3).map(item=>item.verifiedTitle),[
    'الخطوات الأربع لحل المسألة','العوامل الأولية','القوى والأسس'
  ]);
  assert.deepEqual(YASSER_MATH_LESSONS.map(item=>item.playlistIndex),Array.from({length:34},(_,i)=>i));
});

test('video lesson player is app-controlled and blocks direct interaction with the YouTube iframe',async()=>{
  const source=await read('src/modules/yasser/math/yasser-math-lessons.js');
  assert.match(source,/youtube-nocookie\.com/);
  assert.match(source,/controls:0/);
  assert.match(source,/disablekb:1/);
  assert.match(source,/rel:0/);
  assert.match(source,/iframe\.style\.pointerEvents='none'/);
  assert.match(source,/cueVideoById/);
  assert.match(source,/getPlaylistIndex/);
  assert.match(source,/expectedVideoId/);
  assert.match(source,/YT\.PlayerState\.ENDED/);
  assert.doesNotMatch(source,/youtube\.com\/watch/);
});

test('Yasser subject gateway exposes the curriculum video course',async()=>{
  const shell=await read('src/modules/yasser/ui/yasser-home-shell.js');
  assert.match(shell,/id="introMathLessons"/);
  assert.match(shell,/دروس الرياضيات/);
  assert.match(shell,/import\('\.\.\/math\/yasser-math-lessons\.js'\)/);
});

test('offline shell versions the video-course module files',async()=>{
  const worker=await read('service-worker.js');
  assert.match(worker,/src\/modules\/yasser\/math\/video-lesson-data\.js/);
  assert.match(worker,/src\/modules\/yasser\/math\/yasser-math-lessons\.js/);
  assert.match(worker,/src\/modules\/yasser\/math\/yasser-math-lessons\.css/);
});
