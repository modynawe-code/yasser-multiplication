import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateOriginalSurahView} from '../tools/build-quran-isolated-views.mjs';
import {isolatedSurahView,expandQuranCoursePages}
  from '../src/shared/quran/quran-course-page-map.js';
import {KHALED_QURAN_TERMS} from '../src/modules/khaled/quran/khaled-quran.js';

const pin='b91d39e1065b57bdda3e94aca8ecf3575e50e1e6';
const map={schemaVersion:1,sourcePin:pin,surahs:{107:[602]},
  isolatedViews:{'602:107':{
    imagePath:'./assets/recitation/kfqc-hafs-page-602-surah107.svg',
    viewBox:'0 192.26 345 211.09'
  }}};
test('original publisher SVG view cannot alter even one glyph or polygon',async()=>{
  const original=await readFile(new URL('../assets/recitation/kfqc-hafs-page-604.svg',import.meta.url),'utf8');
  const view=original.replace(/viewBox="[^"]+"/,'viewBox="0 153.04 345 179.56"');
  assert.deepEqual(validateOriginalSurahView(original,view,604,113),[0,153.04,345,179.56]);
  assert.throws(()=>validateOriginalSurahView(original,
    view.replace('class="ayahPolygon"','class="fakePolygon"'),604,113));
  assert.throws(()=>validateOriginalSurahView(original,
    view.replace('153.04','1000'),604,113));
});
test('source-pinned views never trust forged filenames or origin',()=>{
  assert.equal(isolatedSurahView(602,107,map)?.viewBox,'0 192.26 345 211.09');
  assert.equal(isolatedSurahView(603,107,map),null);
  assert.equal(isolatedSurahView(602,107,{...map,sourcePin:'bad'}),null);
  assert.equal(isolatedSurahView(602,107,{...map,isolatedViews:{
    '602:107':{imagePath:'https://evil.invalid/mushaf.svg',viewBox:'0 0 345 100'}
  }}),null);
});
test('Khaled chapter keeps original SVG and adds source-native isolated artwork',()=>{
  const chapter=KHALED_QURAN_TERMS[1].find(c=>c.surahNumber===107);
  const [page]=expandQuranCoursePages(chapter,map);
  assert.equal(page.imagePath,chapter.mushafPage.imagePath);
  assert.equal(page.isolatedImagePath,
    './assets/recitation/kfqc-hafs-page-602-surah107.svg');
  assert.equal(page.isolatedViewBox,'0 192.26 345 211.09');
});
