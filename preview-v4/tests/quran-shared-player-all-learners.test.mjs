import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {KHALED_QURAN_TERMS} from '../src/modules/khaled/quran/khaled-quran.js';
import {YASSER_QURAN_TERMS} from '../src/modules/yasser/quran/yasser-quran.js';
import {listMashaalRecitationChoices} from '../src/modules/mashaal/application/recitation-activity-factory.js';

test('three distinct curricula reuse shared Quran player without false per-ayah timing claims',async()=>{
  const yasser=await readFile(new URL('../src/modules/yasser/quran/yasser-quran.js',import.meta.url),'utf8');
  const khaled=await readFile(new URL('../src/modules/khaled/quran/khaled-quran.js',import.meta.url),'utf8');
  const mashaal=await readFile(new URL('../src/modules/mashaal/ui/mashaal-controller.js',import.meta.url),'utf8');
  const shared=await readFile(new URL('../src/modules/mashaal/quran/quran-surah-player.js',import.meta.url),'utf8');
  assert.match(yasser,/mountQuranSurahPlayer/);
  assert.match(khaled,/mountQuranSurahPlayer/);
  assert.match(shared,/mountQuranSurahPlayer/);
  assert.ok(mashaal.includes('recitation')||mashaal.includes('Recitation'));
  const khaledSurahs=new Set(Object.values(KHALED_QURAN_TERMS).flat().map(x=>x.surahNumber));
  const yasserSurahs=new Set(Object.values(YASSER_QURAN_TERMS)
    .flatMap(term=>[...term.recitation,...term.memorization]).map(x=>x.surahNumber));
  const mashaalSurahs=new Set(listMashaalRecitationChoices().map(x=>x.surahNumber));
  assert.equal(khaledSurahs.size,23);
  assert.equal(yasserSurahs.size,9);
  assert.deepEqual([...mashaalSurahs],[1,114,113,112,111]);
  assert.equal(yasserSurahs.has(1),false);
  assert.equal(mashaalSurahs.has(1),true);
  assert.equal(khaledSurahs.has(1),true);
});

test('mobile compact controls apply to all three shared-player contexts even without ayah timings',async()=>{
  const css=await readFile(new URL('../src/modules/mashaal/quran/quran-surah-player.css',import.meta.url),'utf8');
  assert.match(css,/\.quran-surah-player:not\(\.has-ayah-controls\) \.quran-transport/);
  assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/\.quran-surah-player\.has-ayah-controls \.quran-transport/);
});
