import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MASHAAL_ARABIC_LETTERS,MASHAAL_ARABIC_SECTIONS,getMashaalArabicLetter } from '../src/modules/mashaal/curriculum/arabic-letter-curriculum.js';
import { listMashaalArabicImageAssets } from '../src/modules/mashaal/curriculum/arabic-letter-image-bank.js';
import { createMashaalArabicProgress } from '../src/modules/mashaal/application/arabic-progress.js';
import { MASHAAL_ARABIC_MINI_STORIES } from '../src/modules/mashaal/curriculum/arabic-mini-stories.js';
import { MASHAAL_ARABIC_LETTER_AUDIO,MASHAAL_ARABIC_LETTER_AUDIO_SOURCE,listMashaalArabicLetterAudioAssets,createMashaalArabicLetterAudioPlayer } from '../src/modules/mashaal/curriculum/arabic-letter-audio.js';
import { MASHAAL_ARABIC_COLORING_PAGES,MASHAAL_ARABIC_COLORING_SOURCE,listMashaalArabicColoringAssets } from '../src/modules/mashaal/curriculum/arabic-coloring-pages.js';

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
    './src/modules/mashaal/curriculum/arabic-letter-audio.js',
    './src/modules/mashaal/curriculum/arabic-coloring-pages.js',
    './src/modules/mashaal/curriculum/arabic-mini-stories.js',
    './src/modules/mashaal/application/arabic-progress.js',
    './src/modules/mashaal/ui/mashaal-arabic-learning.js',
    './src/modules/mashaal/ui/mashaal-arabic-coloring.js',
    './src/modules/mashaal/ui/mashaal-arabic-learning.css'
  ]) assert.ok(worker.includes("'"+path+"'"),path);
  assert.match(worker,/MASHAAL_ARABIC_TWEMOJI_ASSETS/);
  assert.match(worker,/\.\.\.MASHAAL_ARABIC_TWEMOJI_ASSETS/);
  assert.match(worker,/MASHAAL_ARABIC_LETTER_AUDIO_ASSETS/);
  assert.match(worker,/\.\.\.MASHAAL_ARABIC_LETTER_AUDIO_ASSETS/);
  assert.match(worker,/MASHAAL_ARABIC_COLORING_ASSETS/);
  assert.match(worker,/\.\.\.MASHAAL_ARABIC_COLORING_ASSETS/);
  assert.match(worker,/shell-\d+/);
});

test('Arabic letter names use official local recordings instead of TTS',async()=>{
  const curriculum=await read('src/modules/mashaal/curriculum/arabic-letter-curriculum.js');
  const ui=await read('src/modules/mashaal/ui/mashaal-arabic-learning.js');
  assert.doesNotMatch(curriculum,/sound:/);
  assert.doesNotMatch(ui,/letter\.sound|target\.sound|state\.letter\.sound/);
  assert.doesNotMatch(ui,/onSpeak\?\.\('هذا حرف/);
  assert.doesNotMatch(ui,/speakTarget/);
  assert.match(ui,/letterAudio\.play/);
  assert.match(ui,/MASHAAL_ARABIC_LETTER_AUDIO_SOURCE/);
  assert.match(ui,/اسمعي اسم الحرف/);
});


test('Arabic mini stories provide six three-scene picture sequences and an ordering interaction',async()=>{
  assert.equal(MASHAAL_ARABIC_MINI_STORIES.length,6);
  assert.ok(MASHAAL_ARABIC_MINI_STORIES.every(story=>story.scenes.length===3));
  assert.equal(new Set(MASHAAL_ARABIC_MINI_STORIES.map(story=>story.id)).size,6);
  assert.ok(MASHAAL_ARABIC_MINI_STORIES.every(story=>story.scenes.every(scene=>scene.image.endsWith('.svg')&&scene.word&&scene.text)));
  const ui=await read('src/modules/mashaal/ui/mashaal-arabic-learning.js');
  assert.match(ui,/renderMiniStories/);
  assert.match(ui,/رتّبي الأحداث/);
  assert.match(ui,/ترتيب القصة/);
  assert.match(ui,/MASHAAL_ARABIC_MINI_STORIES/);
});


test('official Qatar Awqaf letter audio maps all 28 app letters to local Qasr MP3 files',async()=>{
  const assets=listMashaalArabicLetterAudioAssets();
  assert.equal(Object.keys(MASHAAL_ARABIC_LETTER_AUDIO).length,28);
  assert.equal(assets.length,28);
  assert.equal(new Set(assets).size,28);
  assert.equal(MASHAAL_ARABIC_LETTER_AUDIO.alif.sourceIndex,1);
  assert.equal(MASHAAL_ARABIC_LETTER_AUDIO.waw.sourceIndex,27);
  assert.equal(MASHAAL_ARABIC_LETTER_AUDIO.ya.sourceIndex,29);
  assert.ok(!Object.values(MASHAAL_ARABIC_LETTER_AUDIO).some(item=>item.sourceIndex===28));
  assert.equal(MASHAAL_ARABIC_LETTER_AUDIO_SOURCE.reading,'القصر');
  assert.match(MASHAAL_ARABIC_LETTER_AUDIO_SOURCE.organization,/وزارة الأوقاف/);
  for(const asset of assets){
    assert.match(asset,/^\.\/assets\/audio\/mashaal\/arabic-letters\/[a-z]+\.mp3$/);
    const bytes=await readFile(new URL('../'+asset.replace(/^\.\//,''),import.meta.url));
    assert.ok(bytes.byteLength>1000,asset);
  }
});

test('official letter audio player opens the matching local recording and stops the previous one',async()=>{
  const played=[],paused=[];
  class FakeAudio{
    constructor(url){this.url=url;this.currentTime=0;this.preload='';this.playsInline=false;}
    async play(){played.push(this.url);}
    pause(){paused.push(this.url);}
  }
  const player=createMashaalArabicLetterAudioPlayer({AudioCtor:FakeAudio});
  assert.equal(await player.play('ba'),true);
  assert.match(played.at(-1),/\/ba\.mp3$/);
  assert.equal(await player.play('ya'),true);
  assert.match(played.at(-1),/\/ya\.mp3$/);
  assert.match(paused.at(-1),/\/ba\.mp3$/);
  assert.equal(await player.play('missing'),false);
  player.stop();
  assert.match(paused.at(-1),/\/ya\.mp3$/);
});

test('official audio source attribution is preserved beside the imported files',async()=>{
  const source=await read('assets/audio/mashaal/arabic-letters/SOURCE.txt');
  assert.match(source,/وزارة الأوقاف والشؤون الإسلامية/);
  assert.match(source,/دولة قطر/);
  assert.match(source,/الحقوق للمصدر الأصلي/);
  assert.match(source,/العنصر 28.*الهمزة/);
});


test('first picture coloring batch contains five local line-art pages',async()=>{
  assert.equal(MASHAAL_ARABIC_COLORING_PAGES.length,5);
  assert.deepEqual(MASHAAL_ARABIC_COLORING_PAGES.map(item=>item.word),['أرنب','بطة','تمساح','ثعلب','جمل']);
  assert.deepEqual(MASHAAL_ARABIC_COLORING_PAGES.map(item=>item.letterId),['alif','ba','ta','tha','jim']);
  assert.equal(MASHAAL_ARABIC_COLORING_SOURCE.license,'CC BY-SA 4.0');
  const assets=listMashaalArabicColoringAssets();
  assert.equal(new Set(assets).size,5);
  for(const asset of assets){
    assert.match(asset,/^\.\/assets\/oer\/openmoji\/coloring\/[a-z]+\.svg$/);
    const svg=await readFile(new URL('../'+asset.replace(/^\.\//,''),import.meta.url),'utf8');
    assert.match(svg,/stroke=/);
    assert.match(svg,/fill="none"/);
  }
});

test('picture coloring UI paints beneath a persistent line-art overlay with touch tools',async()=>{
  const ui=await read('src/modules/mashaal/ui/mashaal-arabic-coloring.js');
  const parentUi=await read('src/modules/mashaal/ui/mashaal-arabic-learning.js');
  assert.match(ui,/mashaal-coloring-outline/);
  assert.match(ui,/mashaal-coloring-paint/);
  assert.match(ui,/pointerdown/);
  assert.match(ui,/destination-out/);
  assert.match(ui,/تراجع/);
  assert.match(ui,/ممحاة/);
  assert.match(ui,/مسح/);
  assert.match(parentUi,/mountMashaalArabicColoring/);
});
