import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pageSources} from '../src/modules/mashaal/quran/quran-surah-player.js';
import {KHALED_QURAN_TERMS} from '../src/modules/khaled/quran/khaled-quran.js';

const chapters=Object.values(KHALED_QURAN_TERMS).flat();
const chapter=n=>chapters.find(item=>item.surahNumber===n);

test('prefer the three verified, bundled Hafs SVG pages over external mirrors',()=>{
  for(const [surah,page] of [[1,1],[111,603],[113,604]]){
    const item=chapter(surah);
    assert.ok(item,'missing school chapter '+surah);
    const sources=pageSources(item.mushafPage);
    assert.equal(sources[0],`./assets/recitation/kfqc-hafs-page-${page}.svg`);
    assert.equal(new Set(sources).size,sources.length,'do not duplicate local fallback');
    assert.ok(sources.some(src=>src.startsWith('https://')),
      'retain verified remote mirrors for when local loading fails');
  }
});

test('do not invent local mushaf artwork when that page is not bundled',()=>{
  const remote=pageSources(chapter(93).mushafPage);
  assert.equal(remote[0],chapter(93).mushafPage.imageUrl);
  assert.ok(remote.every(src=>!src.startsWith('./assets/recitation/')));
  const otherSource=pageSources({
    sourceId:'unverified',pageNumber:1,imageUrl:'https://example.test/a.svg'
  });
  assert.deepEqual(otherSource,['https://example.test/a.svg']);
});

test('a failed page has a recoverable retry action without replacing Quran text',async()=>{
  const player=await readFile(new URL('../src/modules/mashaal/quran/quran-surah-player.js',import.meta.url),'utf8');
  assert.match(player,/retryPage\.addEventListener\('click',renderPage\)/);
  assert.match(player,/figure\.dataset\.imageError='true';retryPage\.hidden=false/);
  assert.match(player,/لا يتم استبدالها بنص مولّد/);
  assert.match(player,/root\.append\(panel\)/,'keep transport, progress and live status before training');
});
