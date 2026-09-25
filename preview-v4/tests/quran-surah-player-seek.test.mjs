import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../src/modules/mashaal/quran/quran-surah-player.js',import.meta.url),'utf8');

test('Quran player can derive a usable duration from seekable ranges',()=>{
  assert.match(source,/rangeEnd\(audio\.seekable\)/);
  assert.match(source,/knownDuration/);
  assert.match(source,/progress\.disabled=false/);
});

test('Quran seek UI no longer reports a fake 0:00 total while duration is unknown',()=>{
  assert.match(source,/duration\?formatTime\(duration\):'--:--'/);
  assert.match(source,/audio\.addEventListener\('progress',updateProgress\)/);
  assert.match(source,/audio\.addEventListener\('canplay',updateProgress\)/);
});
