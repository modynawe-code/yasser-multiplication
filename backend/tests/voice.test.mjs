import test from 'node:test';
import assert from 'node:assert/strict';
import { NATURAL_TTS_BACKEND,normalizeVoiceRequest } from '../src/voice.mjs';

test('natural TTS backend is pinned to Saudi Arabic warm voice',()=>{
  assert.equal(NATURAL_TTS_BACKEND.model,'xai/grok-tts');
  assert.equal(NATURAL_TTS_BACKEND.voiceId,'ara');
  assert.equal(NATURAL_TTS_BACKEND.language,'ar-SA');
  assert.equal(NATURAL_TTS_BACKEND.maxTextLength,280);
});

test('voice request normalization is bounded and deterministic',()=>{
  const parsed=normalizeVoiceRequest({text:'  كم   ناتج ٣ ضرب ٤؟  '});
  assert.deepEqual(parsed,{text:'كم ناتج ٣ ضرب ٤؟',voiceId:'ara',language:'ar-SA'});
  assert.equal(normalizeVoiceRequest({text:''}),null);
  assert.equal(normalizeVoiceRequest({text:'x'.repeat(281)}),null);
});
