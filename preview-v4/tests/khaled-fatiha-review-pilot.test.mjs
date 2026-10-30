import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {getMashaalRecitationAsset} from '../src/modules/mashaal/curriculum/recitation-media-manifest.js';
import {FATIHA_REVIEW_CANDIDATE,verifiedFatihaReviewPilot} from '../src/modules/khaled/quran/fatiha-review-candidate.js';

const asset=getMashaalRecitationAsset('kfgqpc-ibrahim-al-akhdar-hafs-1');

test('Fatiha pilot uses the exact bundled Al-Akhdar Hafs audio and no cloud URL',()=>{
  assert.ok(asset);
  assert.equal(FATIHA_REVIEW_CANDIDATE.status,'ACOUSTIC_ONLY_UNVERIFIED');
  assert.equal(FATIHA_REVIEW_CANDIDATE.audioSha256,asset.sha256);
  const trial=verifiedFatihaReviewPilot(asset);
  assert.equal(trial.audioPath,asset.localPath);
  assert.equal(trial.mushafPage.imagePath,asset.mushafPage.imagePath);
  assert.equal(trial.ayahTimings.length,7);
  assert.equal(trial.ayahTimings[0].startMs,0);
  assert.equal(trial.ayahTimings[6].endMs,64957);
  assert.ok(trial.ayahTimings.every((row,i)=>row.ayahKey==='1:'+(i+1)));
});

test('Fatiha pilot fails closed on a different surah, file SHA, verse count or ordering',()=>{
  assert.equal(verifiedFatihaReviewPilot({...asset,sha256:'a'.repeat(64)}),null);
  assert.equal(verifiedFatihaReviewPilot({...asset,surahNumber:114}),null);
  assert.equal(verifiedFatihaReviewPilot(asset,{...FATIHA_REVIEW_CANDIDATE,ayahTimings:FATIHA_REVIEW_CANDIDATE.ayahTimings.slice(1)}),null);
  const altered=FATIHA_REVIEW_CANDIDATE.ayahTimings.map((row,i)=>i===4?{...row,startMs:4}:row);
  assert.equal(verifiedFatihaReviewPilot(asset,{...FATIHA_REVIEW_CANDIDATE,ayahTimings:altered}),null);
  assert.equal(verifiedFatihaReviewPilot(asset,{...FATIHA_REVIEW_CANDIDATE,status:'APPROVED'}),null);
});

test('trial controls are visible only on dedicated trial host, never default family preview',async()=>{
  const page=await readFile(new URL('../src/modules/khaled/quran/khaled-quran.js',import.meta.url),'utf8');
  assert.match(page,/hostname==='family-learning-fatiha-pilot\.modynawe\.workers\.dev'/);
  assert.match(page,/item\.surahNumber===1&&isFatihaReviewHost\(\)/);
  assert.match(page,/review\?\.audioPath\|\|item\.audioPath/);
  assert.match(page,/تجربة غير معتمدة/);
  assert.doesNotMatch(page,/hostname==='family-learning-preview\.modynawe\.workers\.dev'/);
});
