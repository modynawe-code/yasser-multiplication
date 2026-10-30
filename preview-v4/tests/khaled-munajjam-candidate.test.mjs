import test from 'node:test';
import assert from 'node:assert/strict';
import {buildFatihaAlignmentCandidate} from '../tools/prepare-khaled-fatiha-alignment.mjs';

// Synthetic positions, NOT timings for Quran playback.
const ROWS=Array.from({length:7},(_,i)=>({
  sura_id:1,ayah_index:i,start:5+i*6,end:10+i*6,similarity_score:0.98
}));
const AUDIO_SHA='a'.repeat(64);
const VALID={actualSha256:AUDIO_SHA,expectedSha256:AUDIO_SHA,durationMs:52000};

test('Munajjam candidates are tied to the exact approved MP3, never auto-published',()=>{
  const c=buildFatihaAlignmentCandidate(ROWS,VALID);
  assert.equal(c.status,'REQUIRES_HUMAN_AUDIO_REVIEW');
  assert.equal(c.learnerScope,'candidate-only');
  assert.equal(c.approvedAudioSha256,AUDIO_SHA);
  assert.equal(c.ayahTimings.length,7);
  assert.deepEqual(c.ayahTimings.map(x=>x.ayahKey),['1:1','1:2','1:3','1:4','1:5','1:6','1:7']);
});

test('refuses missing/broken SHA256, low-confidence, missing, overlapping or inaccurate timestamps',()=>{
  assert.throws(()=>buildFatihaAlignmentCandidate(ROWS,{...VALID,actualSha256:'bad'}),/sha256-mismatch/);
  assert.throws(()=>buildFatihaAlignmentCandidate(ROWS.slice(1),VALID),/seven-fatiha-ayahs-required/);
  assert.throws(()=>buildFatihaAlignmentCandidate(ROWS.map((r,i)=>i===3?{...r,similarity_score:.5}:r),VALID),/low-confidence/);
  assert.throws(()=>buildFatihaAlignmentCandidate(ROWS.map((r,i)=>i===2?{...r,start:12}:r),VALID),/overlapping/);
  assert.throws(()=>buildFatihaAlignmentCandidate(ROWS,{...VALID,durationMs:30000}),/out-of-range/);
  assert.throws(()=>buildFatihaAlignmentCandidate(ROWS.map((r,i)=>i===1?{...r,ayah_index:3}:r),VALID),/invalid-ayah-number/);
});
