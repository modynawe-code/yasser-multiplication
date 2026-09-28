import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MASHAAL_ARABIC_LETTERS,MASHAAL_ARABIC_SECTIONS,getMashaalArabicLetter } from '../src/modules/mashaal/curriculum/arabic-letter-curriculum.js';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Arabic learning curriculum exposes seven sections and all 28 Arabic letters',()=>{
  assert.equal(MASHAAL_ARABIC_SECTIONS.length,7);
  assert.deepEqual(MASHAAL_ARABIC_SECTIONS.map(item=>item.id),['letters','write','color','listen','words','stories','games']);
  assert.equal(MASHAAL_ARABIC_LETTERS.length,28);
  assert.equal(new Set(MASHAAL_ARABIC_LETTERS.map(item=>item.id)).size,28);
  assert.equal(new Set(MASHAAL_ARABIC_LETTERS.map(item=>item.letter)).size,28);
  assert.ok(MASHAAL_ARABIC_LETTERS.every(item=>item.words.length===3));
  assert.equal(getMashaalArabicLetter('ba')?.letter,'ب');
  assert.equal(getMashaalArabicLetter('haa')?.letter,'ه');
});

test('Mashaal shell exposes the Arabic hub and its dedicated view',async()=>{
  const shell=await read('src/modules/mashaal/ui/mashaal-shell.js');
  assert.match(shell,/id="mashaalArabicHub"/);
  assert.match(shell,/id="mashaalArabicSectionGrid"/);
  assert.match(shell,/id="mashaalArabicView"/);
  assert.match(shell,/id="mashaalArabicContent"/);
  assert.match(shell,/mashaal-arabic-learning\.css/);
});

test('Arabic hub controller supports section navigation and returns from linked activities',async()=>{
  const controller=await read('src/modules/mashaal/ui/mashaal-controller.js');
  assert.match(controller,/renderMashaalArabicSectionCards/);
  assert.match(controller,/mountMashaalArabicSection/);
  assert.match(controller,/openArabicSection/);
  assert.match(controller,/arabicActivityActive/);
  assert.match(controller,/رجوع للعربية/);
});

test('Arabic learning interactions include touch writing, coloring, listening, words, stories and games',async()=>{
  const ui=await read('src/modules/mashaal/ui/mashaal-arabic-learning.js');
  assert.match(ui,/pointerdown/);
  assert.match(ui,/pointermove/);
  assert.match(ui,/mode==='color'/);
  assert.match(ui,/renderListening/);
  assert.match(ui,/renderWords/);
  assert.match(ui,/STORY_ITEMS/);
  assert.match(ui,/GAME_ITEMS/);
});

test('Arabic learning modules are available on first-install offline cache',async()=>{
  const worker=await read('service-worker.js');
  for(const path of [
    './src/modules/mashaal/curriculum/arabic-letter-curriculum.js',
    './src/modules/mashaal/ui/mashaal-arabic-learning.js',
    './src/modules/mashaal/ui/mashaal-arabic-learning.css'
  ]) assert.ok(worker.includes(`'${path}'`),path);
  assert.match(worker,/shell-153/);
});
