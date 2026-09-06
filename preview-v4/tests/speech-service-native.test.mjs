import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpeechService } from '../src/shared/audio/speech-service.js';

test('uses native TTS in Android builds with Arabic speech settings',async()=>{
  const calls=[];
  const nativeTts={
    stop(){calls.push(['stop']);return Promise.resolve();},
    speak(options){calls.push(['speak',options]);return Promise.resolve();}
  };
  const speech=createSpeechService({synth:null,Utterance:null,nativeTts});
  assert.equal(speech.speak('هل المجموعتان متساويتان؟'),true);
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.deepEqual(calls[0],['stop']);
  assert.equal(calls[1][0],'speak');
  assert.equal(calls[1][1].lang,'ar-SA');
  assert.equal(calls[1][1].volume,1);
  assert.equal(calls[1][1].queueStrategy,0);
});
