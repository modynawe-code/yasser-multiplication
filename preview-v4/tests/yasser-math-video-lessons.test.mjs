import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {YASSER_MATH_CHAPTERS,YASSER_MATH_COURSE,YASSER_MATH_LESSONS,YASSER_MATH_PLAYLIST_ID,classifyYasserMathLessonTitle} from '../src/modules/yasser/math/video-lesson-data.js';

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
  assert.match(source,/strict-origin-when-cross-origin/);
  assert.match(source,/youtubePlayerVars/);
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


test('curriculum map keeps five current semester chapters and classifies YouTube-style titles',()=>{
  assert.equal(YASSER_MATH_CHAPTERS.length,5);
  assert.equal(YASSER_MATH_CHAPTERS.reduce((sum,chapter)=>sum+chapter.lessons.length,0),35);
  assert.equal(classifyYasserMathLessonTitle('حل تدريبات التمثيل بالنقاط - رياضيات الصف السادس')?.chapterId,'chapter-2');
  assert.equal(classifyYasserMathLessonTitle('ضرب الكسور العشرية في أعداد كلية - سادس')?.chapterId,'chapter-3');
  assert.equal(classifyYasserMathLessonTitle('الطول في النظام المتري - رياضيات سادس')?.chapterId,'chapter-5');
});

test('lesson UI groups resolved playlist videos under curriculum chapters',async()=>{
  const source=await read('src/modules/yasser/math/yasser-math-lessons.js');
  const css=await read('src/modules/yasser/math/yasser-math-lessons.css');
  assert.match(source,/classifyYasserMathLessonTitle/);
  assert.match(source,/math-chapter-section/);
  assert.match(source,/جاري ترتيب عناوين الدروس/);
  assert.match(css,/\.math-chapter-lessons/);
});


test('lesson list uses compact collapsible chapter navigation',async()=>{
  const source=await read('src/modules/yasser/math/yasser-math-lessons.js');
  const css=await read('src/modules/yasser/math/yasser-math-lessons.css');
  assert.match(source,/<details class="math-chapter-section"/);
  assert.match(source,/<summary class="math-chapter-head"/);
  assert.match(css,/math-chapter-head::-webkit-details-marker/);
});


test('math video fullscreen falls back to an in-app viewport mode when element fullscreen is unavailable',async()=>{
  const source=await read('src/modules/yasser/math/yasser-math-lessons.js');
  const css=await read('src/modules/yasser/math/yasser-math-lessons.css');
  assert.match(source,/document\.fullscreenEnabled/);
  assert.match(source,/math-player-expanded/);
  assert.match(source,/toggleMathPlayerFullscreen/);
  assert.match(source,/fullscreenchange/);
  assert.match(css,/body\.math-player-expanded/);
  assert.match(css,/\.math-player-dialog:fullscreen/);
});


test('lesson UI presents concise curriculum titles and explicit progress semantics',async()=>{
  const source=await read('src/modules/yasser/math/yasser-math-lessons.js');
  assert.match(source,/cleanYoutubeLessonTitle/);
  assert.match(source,/الدروس المكتملة/);
  assert.match(source,/mathLastProgress/);
  assert.match(source,/آخر درس:/);
});

test('player keeps core navigation controls and auto-completes near the end',async()=>{
  const source=await read('src/modules/yasser/math/yasser-math-lessons.js');
  assert.match(source,/id="mathPrevLesson"/);
  assert.match(source,/id="mathNextControl"/);
  assert.match(source,/current\/duration>=\.95/);
  assert.match(source,/يُسجل الدرس مكتملًا تلقائيًا عند مشاهدة 95%/);
});

test('mobile lesson cards and player use compact responsive layouts',async()=>{
  const css=await read('src/modules/yasser/math/yasser-math-lessons.css');
  assert.match(css,/grid-template-columns:86px minmax\(0,1fr\) auto/);
  assert.match(css,/grid-template-areas:[\s\S]*"prev back play forward next"/);
  assert.match(css,/math-complete-fallback/);
  assert.match(css,/@media\(orientation:landscape\) and \(max-height:600px\)/);
});


test('portrait expanded video preserves 16:9 instead of stretching the YouTube stage',async()=>{
  const css=await read('src/modules/yasser/math/yasser-math-lessons.css');
  assert.match(css,/@media \(orientation:portrait\) and \(max-width:820px\)/);
  assert.match(css,/body\.math-player-expanded \.math-player-stage[\s\S]*aspect-ratio:16\/9/);
  assert.match(css,/body\.math-player-expanded \.math-player-dialog[\s\S]*display:flex/);
});


test('active playback unlocks the iframe so skippable YouTube ads can be controlled',async()=>{
  const source=await read('src/modules/yasser/math/yasser-math-lessons.js');
  assert.match(source,/function setLessonIframeInteractive/);
  assert.match(source,/pointerEvents=enabled\?'auto':'none'/);
  assert.match(source,/function startLessonPlayback/);
  assert.match(source,/setLessonIframeInteractive\(true\)/);
  assert.match(source,/setLessonIframeInteractive\(false\)/);
});
