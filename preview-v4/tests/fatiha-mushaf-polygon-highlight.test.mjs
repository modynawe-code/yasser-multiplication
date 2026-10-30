import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {FATIHA_PAGE1_POLYGONS,matchFatihaPage1Polygons} from '../src/modules/mashaal/quran/fatiha-page1-polygons.js';
import {getMashaalRecitationAsset} from '../src/modules/mashaal/curriculum/recitation-media-manifest.js';
import {verifiedFatihaReviewPilot} from '../src/modules/khaled/quran/fatiha-review-candidate.js';

const official=getMashaalRecitationAsset('kfgqpc-ibrahim-al-akhdar-hafs-1');
const fatihaTrial=verifiedFatihaReviewPilot(official);

test('overlay paths are a byte-for-byte geometry match to seven original King Fahd Hafs ayahPolygon paths',async()=>{
  const svg=await readFile(new URL('../assets/recitation/kfqc-hafs-page-1.svg',import.meta.url),'utf8');
  assert.equal(svg.match(/\bviewBox="([^"]+)"/)?.[1],FATIHA_PAGE1_POLYGONS.viewBox);
  const paths=[...svg.matchAll(/<path\b(?=[^>]*class="ayahPolygon")(?=[^>]*\bayah="(\d+)")(?=[^>]*\bsurah="(\d+)")[^>]*\bd="([^"]+)"\s*\/>/g)]
    .map(match=>({ayah:Number(match[1]),surah:Number(match[2]),d:match[3]}));
  assert.equal(paths.length,7);
  assert.ok(paths.every((item,index)=>item.surah===1&&item.ayah===index+1));
  assert.deepEqual(FATIHA_PAGE1_POLYGONS.paths.map(item=>item.d),paths.map(item=>item.d));
});

test('verse overlay fails safely when using different surah/page/SVG geometry or missing timings',()=>{
  assert.equal(matchFatihaPage1Polygons(official.mushafPage,1,fatihaTrial.ayahTimings),FATIHA_PAGE1_POLYGONS);
  assert.equal(matchFatihaPage1Polygons(official.mushafPage,114,fatihaTrial.ayahTimings),null);
  assert.equal(matchFatihaPage1Polygons({...official.mushafPage,pageNumber:2},1,fatihaTrial.ayahTimings),null);
  assert.equal(matchFatihaPage1Polygons({...official.mushafPage,imagePath:'./assets/recitation/another.svg'},1,fatihaTrial.ayahTimings),null);
  assert.equal(matchFatihaPage1Polygons({...official.mushafPage,offlineBundled:false},1,fatihaTrial.ayahTimings),null);
  assert.equal(matchFatihaPage1Polygons({...official.mushafPage,focusRegion:{top:0,height:.5}},1,fatihaTrial.ayahTimings),null);
  assert.equal(matchFatihaPage1Polygons(official.mushafPage,1,[]),null);
  const broken=fatihaTrial.ayahTimings.map((row,index)=>index===2?{...row,ayahKey:'1:4'}:row);
  assert.equal(matchFatihaPage1Polygons(official.mushafPage,1,broken),null);
});

test('player maps original vector paths onto the existing image, synchronizes active ayah, and offers touch and keyboard input',async()=>{
  const player=await readFile(new URL('../src/modules/mashaal/quran/quran-surah-player.js',import.meta.url),'utf8');
  const css=await readFile(new URL('../src/modules/mashaal/quran/quran-surah-player.css',import.meta.url),'utf8');
  assert.match(player,/fetchOfficialAyahPolygons\(src,surahNumber\)/);
  assert.doesNotMatch(player,/matchFatihaPage1Polygons\(/);
  assert.match(player,/document\.createElementNS\(ns,'svg'\)/);
  assert.match(player,/verseOverlay\.setAttribute\('viewBox',geometry\.viewBox\)/);
  assert.match(player,/path\.setAttribute\('d',item\.d\)/);
  assert.match(player,/path\.addEventListener\('click'/);
  assert.match(player,/path\.addEventListener\('keydown'/);
  assert.match(player,/path\.classList\.toggle\('is-current',isCurrent\)/);
  assert.match(player,/audio\.addEventListener\('timeupdate',\(\)=>\{updateProgress\(\);handleAyahBoundary\(\);paintListeningAyah\(\);\}\)/);
  assert.match(player,/fetchOfficialAyahPolygons\(src,surahNumber\)/);
  assert.match(player,/const showHighlightedVerseOnMushaf=\(\)=>/);
  assert.match(player,/visible<Math\.min\(260,rect\.height\/2\)/);
  assert.match(player,/selectAyah\(index,\{revealInMushaf:true\}\)/);
  assert.match(css,/\.quran-mushaf-ayah-path\.is-current/);
  assert.match(css,/\.quran-surah-player\.has-ayah-controls \.quran-transport/);
});
