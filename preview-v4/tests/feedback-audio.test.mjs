import test from 'node:test';
import assert from 'node:assert/strict';
import { SOUND_PATTERNS } from '../src/ui/audio/feedback-audio.js';

test('feedback sounds stay brief and low gain',()=>{
  for(const [name,pattern] of Object.entries(SOUND_PATTERNS)){
    assert.ok(pattern.length>=2,`${name} should be perceptible without being harsh`);
    const total=Math.max(...pattern.map(note=>(note.delay||0)+note.duration));
    assert.ok(total<=.35,`${name} should remain brief`);
    for(const note of pattern){
      assert.ok(note.gain<=.035,`${name} gain is too high`);
      assert.ok(note.frequency>=150&&note.frequency<=900,`${name} frequency is outside the intended soft range`);
    }
  }
});

test('required feedback cues are defined',()=>{
  assert.deepEqual(Object.keys(SOUND_PATTERNS).sort(),['achievement','correct','wrong']);
});
