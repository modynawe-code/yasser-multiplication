import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createMashaalActivityViewModel } from '../src/modules/mashaal/ui/activity-view-model.js';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('completion-only activity uses one concise done label without duplicating a check glyph',()=>{
  const model=createMashaalActivityViewModel({
    id:'done-demo',skillId:'listen-repeat',interaction:'listening',evidenceType:'activity-completion',
    promptAr:'اسمعي ثم رددي.',audioPromptAr:'اسمعي ثم رددي.',stimulus:{kind:'recitation-audio',surahNameAr:'الإخلاص',surahNumber:112},choices:['done']
  });
  assert.equal(model.completionOnly,true);
  assert.equal(model.choices[0].label,'تم');
});

test('Quran completion control keeps the check visual compact and separated from the Mushaf frame',async()=>{
  const css=await read('src/modules/mashaal/quran/quran-surah-player.css');
  assert.match(css,/\.mashaal-activity-choices\{max-width:220px;margin:18px auto 0\}/);
  assert.match(css,/\.mashaal-choice\[data-choice="done"\]\{min-height:70px!important;display:grid!important;grid-template-columns:46px minmax\(0,1fr\)/);
  assert.match(css,/\.mashaal-choice\[data-choice="done"\] \.mashaal-choice-visual \.mashaal-visual\{width:46px;height:46px/);
});
