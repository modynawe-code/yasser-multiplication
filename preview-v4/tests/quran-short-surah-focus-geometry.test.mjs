import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {KHALED_QURAN_TERMS} from '../src/modules/khaled/quran/khaled-quran.js';

// Regression against actual bundled Quranpedia/KFGQPC polygon geometry.
// Do not infer words or manufacture a Quran page; only check crop boundaries.
function ayahVerticalBounds(svg,surahNumber){
  const y=[];
  for(const hit of svg.matchAll(/<path class="ayahPolygon"[^>]*>/g)){
    const node=hit[0];
    if(node.match(/\bsurah="(\d+)"/)?.[1]!==String(surahNumber))continue;
    const d=node.match(/\bd="([^"]+)"/)?.[1];
    assert.ok(d,'SVG ayah path must contain verified geometry');
    const numbers=[...d.matchAll(/-?\d+(?:\.\d+)?/g)].map(value=>Number(value[0]));
    assert.equal(numbers.length%2,0,'bundle geometry is rectangular coordinate pairs');
    for(let i=1;i<numbers.length;i+=2)y.push(numbers[i]);
  }
  assert.ok(y.length,'surah '+surahNumber+' has no polygon data');
  return {top:Math.min(...y),bottom:Math.max(...y)};
}

test('short-surah crops do not hide any ayah polygons on bundled Hafs pages 603 and 604',async()=>{
  const pages=new Map(await Promise.all([603,604].map(async number=>[
    number,await readFile(new URL(`../assets/recitation/kfqc-hafs-page-${number}.svg`,import.meta.url),'utf8')
  ])));
  const chapters=Object.values(KHALED_QURAN_TERMS).flat()
    .filter(item=>pages.has(item.pageNumber));
  assert.equal(chapters.length,6,'regression must cover all bundled short surahs');
  for(const chapter of chapters){
    const region=chapter.mushafPage.focusRegion;
    assert.equal(region?.surahNumber,chapter.surahNumber);
    const svg=pages.get(chapter.pageNumber);
    const viewBox=svg.match(/\bviewBox="([^"]+)"/)?.[1]?.split(/\s+/).map(Number);
    assert.equal(viewBox?.length,4);
    const [,minY,,height]=viewBox;
    const min=minY+region.top*height,max=minY+(region.top+region.height)*height;
    const bounds=ayahVerticalBounds(svg,chapter.surahNumber);
    assert.ok(bounds.top>=min-.02,
      `Surah ${chapter.surahNumber} verse clipped above: ${bounds.top}<${min}`);
    assert.ok(bounds.bottom<=max+.02,
      `Surah ${chapter.surahNumber} verse clipped below: ${bounds.bottom}>${max}`);
  }
});
