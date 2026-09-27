import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { listMashaalPlayExperiences,getMashaalPlayExperience } from '../src/modules/mashaal/application/play-experiences.js';

test('Mashaal home play library exposes all eighteen interactive experiences directly',()=>{
  const items=listMashaalPlayExperiences();
  assert.equal(items.length,18);
  assert.equal(new Set(items.map(item=>item.activityId)).size,18);
  assert.ok(items.every(item=>item.available));
  for(const title of ['مدينة الحروف','مطبخ مشاعل','عدّي الحيوانات','لعبة الذاكرة','ذاكرة الحيوانات','ذاكرة الطبيعة','مزرعة أو برية؟','حديقة مشاعل','رحلة الشجرة','حديقة الحيوانات','متاهة الحيوانات','مختبر مشاعل','ألوان الطبيعة','قصة مشاعل','مغامرة جمع البذور','بزل الصور','بزل الحيوان','بزل ألوان الطبيعة']){
    assert.ok(items.some(item=>item.title===title),title);
  }
});

test('play experience lookup returns the exact activity and curriculum skill',()=>{
  const game=getMashaalPlayExperience('kg3-animal-maze-duck-01');
  assert.equal(game.title,'متاهة الحيوانات');
  assert.equal(game.skillId,'observe-reason');
  assert.equal(game.available,true);
});

test('Mashaal home and controller expose direct game navigation',async()=>{
  const shell=await readFile(new URL('../src/modules/mashaal/ui/mashaal-shell.js',import.meta.url),'utf8');
  const controller=await readFile(new URL('../src/modules/mashaal/ui/mashaal-controller.js',import.meta.url),'utf8');
  const css=await readFile(new URL('../src/modules/mashaal/ui/mashaal-home.css',import.meta.url),'utf8');
  assert.match(shell,/id="mashaalPlayLibrary"/);
  assert.match(shell,/id="mashaalPlayGrid"/);
  assert.match(shell,/>ألعابي</);
  assert.match(controller,/openPlayExperience/);
  assert.match(controller,/playLibraryActive/);
  assert.match(controller,/رجوع للألعاب/);
  assert.match(controller,/اختاري لعبة ثانية/);
  assert.match(css,/grid-template-areas:"hero daily" "hero plays" "hero prompt" "hero domains" "hero status"/);
});

test('daily mission count keeps numeric order inside RTL layout',async()=>{
  const css=await readFile(new URL('../src/modules/mashaal/ui/mashaal-daily-mission.css',import.meta.url),'utf8');
  assert.match(css,/\.mashaal-daily-progress\{[^}]*direction:ltr;unicode-bidi:isolate/);
});
