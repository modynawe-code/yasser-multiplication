import test from 'node:test';
import assert from 'node:assert/strict';
import {expandQuranCoursePages} from '../src/shared/quran/quran-course-page-map.js';
import {KHALED_QURAN_TERMS} from '../src/modules/khaled/quran/khaled-quran.js';
import {YASSER_QURAN_TERMS} from '../src/modules/yasser/quran/yasser-quran.js';

const pin='b91d39e1065b57bdda3e94aca8ecf3575e50e1e6';

test('verified source page map includes all continuation pages of a short surah',()=>{
  const chapter=KHALED_QURAN_TERMS[2].find(x=>x.surahNumber===100);
  assert.ok(chapter);
  const pages=expandQuranCoursePages(chapter,{schemaVersion:1,sourcePin:pin,surahs:{100:[599,600]}});
  assert.deepEqual(pages.map(p=>p.pageNumber),[599,600]);
  assert.equal(pages[1].imagePath,'./assets/recitation/kfqc-hafs-page-600.svg');
  assert.ok(pages[1].imageUrl.endsWith('/600.svg'));
  assert.equal(pages[1].focusRegion,undefined);
});

test('verified map does not change Yasser original per-page mastery records',()=>{
  const original=YASSER_QURAN_TERMS[1].memorization[0];
  const pages=expandQuranCoursePages(original,{
    schemaVersion:1,sourcePin:pin,surahs:{68:[564,565,566]}
  });
  assert.equal(pages.length,original.mushafPages.length);
  assert.equal(pages[0],original.mushafPages[0]);
});

test('unknown or forged map falls back to course original safely',()=>{
  const chapter=KHALED_QURAN_TERMS[2].find(x=>x.surahNumber===100);
  for(const map of [null,{schemaVersion:1,sourcePin:'incorrect',surahs:{100:[599,600]}},
    {schemaVersion:1,sourcePin:pin,surahs:{100:[600]}},
    {schemaVersion:1,sourcePin:pin,surahs:{100:[599,599]}}]){
    const pages=expandQuranCoursePages(chapter,map);
    assert.equal(pages.length,1);
    assert.equal(pages[0],chapter.mushafPage);
  }
});
