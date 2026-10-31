import test from 'node:test';
import assert from 'node:assert/strict';
import {repeatSeekStartSeconds} from '../src/modules/mashaal/quran/quran-surah-player.js';

test('a repeated verse begins with a short lead-in instead of cutting its first phoneme',()=>{
  assert.equal(repeatSeekStartSeconds(3500),3.15);
  assert.equal(repeatSeekStartSeconds(350),0);
  assert.equal(repeatSeekStartSeconds(0),0);
  assert.equal(repeatSeekStartSeconds(-30),0);
  assert.equal(repeatSeekStartSeconds(Number.NaN),0);
});

test('repeat-seek implementation waits for seeked and cancellation avoids stale playback',async()=>{
  const {readFile}=await import('node:fs/promises');
  const source=await readFile(new URL('../src/modules/mashaal/quran/quran-surah-player.js',import.meta.url),'utf8');
  assert.match(source,/audio\.pause\(\);replaySeekPending=true;/);
  assert.match(source,/audio\.addEventListener\('seeked',resumeReplay,\{once:true\}\)/);
  assert.match(source,/if\(replaySeekPending\)return true;/);
  assert.match(source,/cancelReplaySeek\(\);destroyed=true/);
});
