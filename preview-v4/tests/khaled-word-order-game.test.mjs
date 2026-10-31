import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {KHALED_WORD_ORDER_STAGES,KHALED_WORD_ORDER_WORD_COUNT} from '../src/modules/khaled/literacy/word-order-game.js';
import {WORD_ORDER_AUDIO_CLIPS,WORD_ORDER_AUDIO_BY_WORD} from '../src/modules/khaled/literacy/word-order-audio-manifest.js';

test('Khaled word-order game keeps the two supplied stages and all 27 words together',()=>{
  assert.equal(KHALED_WORD_ORDER_STAGES.length,2);
  assert.deepEqual(KHALED_WORD_ORDER_STAGES.map(stage=>stage.words.length),[14,13]);
  assert.equal(KHALED_WORD_ORDER_WORD_COUNT,27);
  assert.equal(KHALED_WORD_ORDER_STAGES[0].words[0].word,'بَلَد');
  assert.equal(KHALED_WORD_ORDER_STAGES[1].words.at(-1).word,'قَصْدُ');
});

test('every game word has matching, non-empty piece data',()=>{
  for(const stage of KHALED_WORD_ORDER_STAGES){
    for(const item of stage.words){
      assert.ok(item.word.trim());
      assert.ok(item.parts.length>=3);
      assert.ok(item.parts.every(part=>typeof part==='string'&&part.trim()));
    }
  }
});

test('word playback maps only to bundled lesson voice clips and never synthesizes speech',async()=>{
  assert.equal(WORD_ORDER_AUDIO_CLIPS.length,12);
  assert.equal(Object.keys(WORD_ORDER_AUDIO_BY_WORD).length,12);
  for(const clip of WORD_ORDER_AUDIO_CLIPS){
    assert.ok(clip.end>clip.start,clip.id);
    const audio=await readFile(new URL(`../assets/audio/khaled/literacy/word-order/${clip.id}.mp3`,import.meta.url));
    assert.ok(audio.length>1000,clip.id+' audio file is present');
    assert.equal(audio.toString('latin1',0,3),'ID3');
  }
  const source=await readFile(new URL('../src/modules/khaled/literacy/word-order-game.js',import.meta.url),'utf8');
  assert.match(source,/new Audio\(/);
  assert.doesNotMatch(source,/createSpeechService|speakAndWait|speech\.speak/);
  const shell=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
  for(const name of ['word-order-game.js','word-order-game.css','word-order-audio-manifest.js'])assert.ok(shell.includes(name));
  assert.ok(shell.includes('KHALED_WORD_ORDER_AUDIO_ASSETS'));
  assert.match(shell,/shell-229/);
});
