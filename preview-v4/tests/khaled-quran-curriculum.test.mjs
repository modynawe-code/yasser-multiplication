import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { KHALED_QURAN_TERMS } from '../src/modules/khaled/quran/khaled-quran.js';

const names=term=>KHALED_QURAN_TERMS[term].map(item=>item.surahNameAr);

test('Khaled Quran matches Saudi grade-one general-education semester coverage',()=>{
  assert.deepEqual(names(1),['الفاتحة','الناس','الفلق','الإخلاص','المسد','النصر','الكافرون','الكوثر','الماعون','قريش','الفيل','الهمزة','العصر','التكاثر','القارعة']);
  assert.deepEqual(names(2),['العاديات','الزلزلة','البينة','القدر','العلق','التين','الشرح','الضحى']);
});

test('every Khaled surah uses verified Ibrahim Al-Akhdar audio and pinned Madinah mushaf artwork',()=>{
  for(const term of [1,2])for(const item of KHALED_QURAN_TERMS[term]){
    assert.match(item.audioPath,/cdn\.quran\.ws\/KFGQPC\/resources\/quran-audios\/akhdar-sura\/sura\/10-\d{3}D00-A02\.mp3$/);
    assert.match(item.mushafPage.imageUrl,/quranpedia\/quran-svg@[a-f0-9]{40}\/mushafs\/hafs\/kfqc\/svg\/\d+\.svg$/);
  }
});

test('Khaled home exposes a dedicated Quran entry without mixing Quran into math skills',async()=>{
  const shell=await readFile(new URL('../src/modules/khaled/ui/khaled-home-shell.js',import.meta.url),'utf8');
  assert.match(shell,/id="khaledQuranOpen"/);
  assert.match(shell,/القرآن الكريم/);
  assert.match(shell,/createKhaledQuranController/);
});
