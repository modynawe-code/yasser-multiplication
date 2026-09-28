import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MASHAAL_ARABIC_LETTERS,MASHAAL_ARABIC_SECTIONS,getMashaalArabicLetter } from '../src/modules/mashaal/curriculum/arabic-letter-curriculum.js';
import { listMashaalArabicImageAssets } from '../src/modules/mashaal/curriculum/arabic-letter-image-bank.js';
import { createMashaalArabicProgress } from '../src/modules/mashaal/application/arabic-progress.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('Arabic learning curriculum exposes seven sections and all 28 Arabic letters',()=>{
  assert.equal(MASHAAL_ARABIC_SECTIONS.length,7);
  assert.deepEqual(MASHAAL_ARABIC_SECTIONS.map(item=>item.id),['letters','write','color','listen','words','stories','games']);
  assert.equal(MASHAAL_ARABIC_LETTERS.length,28);
  assert.equal(new Set(MASHAAL_ARABIC_LETTERS.map(item=>item.id)).size,28);
  assert.equal(new Set(MASHAAL_ARABIC_LETTERS.map(item=>item.letter)).size,28);
  assert.ok(MASHAAL_ARABIC_LETTERS.every(item=>item.words.length===3));
  assert.ok(MASHAAL_ARABIC_LETTERS.every(item=>item.items.length===3));
  assert.equal(getMashaalArabicLetter('ba')?.letter,'ب');
  assert.equal(getMashaalArabicLetter('haa')?.letter,'ه');
});

test('Arabic letter image bank contains 84 unique local SVG assets and every file exists',async()=>{
  const assets=listMashaalArabicImageAssets();
  assert.equal(assets.length,84);
  assert.equal(new Set(assets).size,84);
  assert.ok(assets.every(path=>path.startsWith('./assets/oer/twemoji/arabic/')&&path.endsWith('.svg')));
  for(const asset of assets)await readFile(new URL('../'+asset.replace(/^\.\//,''),import.meta.url));
});

test('Mashaal shell exposes the Arabic hub and its dedicated view',async()=>{
  const shell=await read('src/modules/mashaal/ui/mashaal-shell.js');
  assert.match(shell,/id="mashaalArabicHub"/);
  assert.match(shell,/id="mashaalArabicSectionGrid"/);
  assert.match(shell,/id="mashaalArabicView"/);
  assert.match(shell,/id="mashaalArabicContent"/);
  assert.match(shell,/mashaal-arabic-learning\.css/);
});

test('Arabic hub controller supports section navigation',async()=>{
  const controller=await read('src/modules/mashaal/ui/mashaal-controller.js');
  assert.match(controller,/renderMashaalArabicSectionCards/);
  assert.match(controller,/mountMashaalArabicSection/);
  assert.match(controller,/openArabicSection/);
});

test('Arabic learning interactions include pictures, tracing checks, coloring, word building and three picture games',async()=>{
  const ui=await read('src/modules/mashaal/ui/mashaal-arabic-learning.js');
  assert.match(ui,/imageNode/);
  assert.match(ui,/pointerdown/);
  assert.match(ui,/getImageData/);
  assert.match(ui,/تحققي/);
  assert.match(ui,/ممحاة/);
  assert.match(ui,/renderWordBuilder/);
  assert.match(ui,/renderArabicGames/);
  assert.match(ui,/الحرف الأول/);
  assert.match(ui,/الصورة المناسبة/);
  assert.match(ui,/الصورة الدخيلة/);
});

test('Arabic progress tracks new, learning and mastered letter states without touching the main learner store',()=>{
  const memory=new Map();
  const storage={
    getItem:key=>memory.has(key)?memory.get(key):null,
    setItem:(key,value)=>memory.set(key,value),
    removeItem:key=>memory.delete(key)
  };
  const tracker=createMashaalArabicProgress({storage});
  assert.equal(tracker.status('ba'),'new');
  tracker.record('ba','view');
  assert.equal(tracker.status('ba'),'learning');
  for(let index=0;index<6;index+=1)tracker.record('ba','game',{correct:true});
  tracker.record('ba','writing',{correct:true});
  tracker.record('ba','word',{correct:true});
  assert.equal(tracker.status('ba'),'mastered');
  const summary=tracker.summary(MASHAAL_ARABIC_LETTERS.map(item=>item.id));
  assert.equal(summary.mastered,1);
  assert.equal(summary.total,28);
});

test('Arabic learning modules and 84-image bank are included in the first-install offline shell',async()=>{
  const worker=await read('service-worker.js');
  for(const path of [
    './src/modules/mashaal/curriculum/arabic-letter-image-bank.js',
    './src/modules/mashaal/curriculum/arabic-letter-curriculum.js',
    './src/modules/mashaal/application/arabic-progress.js',
    './src/modules/mashaal/ui/mashaal-arabic-learning.js',
    './src/modules/mashaal/ui/mashaal-arabic-learning.css'
  ]) assert.ok(worker.includes("'"+path+"'"),path);
  assert.match(worker,/MASHAAL_ARABIC_TWEMOJI_ASSETS/);
  assert.match(worker,/\.\.\.MASHAAL_ARABIC_TWEMOJI_ASSETS/);
  assert.match(worker,/shell-155/);
});

test('Arabic listening still teaches letter names and examples instead of isolated synthetic vowel sounds',async()=>{
  const curriculum=await read('src/modules/mashaal/curriculum/arabic-letter-curriculum.js');
  const ui=await read('src/modules/mashaal/ui/mashaal-arabic-learning.js');
  assert.doesNotMatch(curriculum,/sound:/);
  assert.doesNotMatch(ui,/letter\.sound|target\.sound|state\.letter\.sound/);
  assert.match(ui,/اسمعي اسم الحرف/);
  assert.match(ui,/هذا حرف/);
});
