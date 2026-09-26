import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {YASSER_QURAN_TERMS} from '../src/modules/yasser/quran/yasser-quran.js';

const source=await readFile(new URL('../src/modules/mashaal/quran/quran-surah-player.js',import.meta.url),'utf8');

test('Quran player can derive a usable duration from seekable ranges',()=>{
  assert.match(source,/rangeEnd\(audio\.seekable\)/);
  assert.match(source,/knownDuration/);
  assert.match(source,/progress\.disabled=false/);
});

test('Quran player accepts a verified duration fallback when tablet metadata is missing',()=>{
  assert.match(source,/durationSeconds=0/);
  assert.match(source,/Number\(durationSeconds\)>0\?Number\(durationSeconds\):0/);
  assert.equal(YASSER_QURAN_TERMS[1].memorization[0].durationSeconds,537.0968);
  assert.equal(YASSER_QURAN_TERMS[2].recitation[2].durationSeconds,613.4888);
});

test('Quran seek UI no longer reports a fake 0:00 total while duration is unknown',()=>{
  assert.match(source,/duration\?formatTime\(duration\):'--:--'/);
  assert.match(source,/audio\.addEventListener\('progress',updateProgress\)/);
  assert.match(source,/audio\.addEventListener\('canplay',updateProgress\)/);
});
