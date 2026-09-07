import test from 'node:test';
import assert from 'node:assert/strict';
import { createVoiceService } from '../src/shared/audio/voice-service.js';
import { pickNativeVoiceIndex } from '../src/shared/audio/providers/native-tts-provider.js';
import { pickBrowserVoice } from '../src/shared/audio/providers/browser-tts-provider.js';

test('voice service prefers the first provider that can speak',async()=>{
  const calls=[];
  const local={kind:'local',stop(){},async speak(){calls.push('local');return true;}};
  const fallback={kind:'fallback',stop(){},async speak(){calls.push('fallback');return true;}};
  const voice=createVoiceService({providers:[local,fallback]});
  assert.equal(voice.say({id:'fixed.greeting',text:'مرحبا'}),true);
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.deepEqual(calls,['local']);
});

test('voice service falls through when a recorded clip is unavailable',async()=>{
  const calls=[];
  const local={kind:'local',stop(){},async speak(){calls.push('local');return false;}};
  const fallback={kind:'fallback',stop(){},async speak(request){calls.push(request.text);return true;}};
  const voice=createVoiceService({providers:[local,fallback]});
  voice.say({id:'missing.clip',text:'السؤال بصوت احتياطي'});
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.deepEqual(calls,['local','السؤال بصوت احتياطي']);
});

test('native Arabic voice selection prefers exact language and higher-quality names',()=>{
  const voices=[
    {lang:'ar-EG',name:'Arabic local',localService:true},
    {lang:'ar-SA',name:'Arabic standard',localService:true},
    {lang:'ar-SA',name:'Arabic Neural',localService:true}
  ];
  assert.equal(pickNativeVoiceIndex(voices,'ar-SA'),2);
});

test('browser Arabic voice selection prefers exact Saudi Arabic natural voice',()=>{
  const voices=[
    {lang:'en-US',name:'English Natural',localService:true},
    {lang:'ar-SA',name:'Arabic Standard',localService:true},
    {lang:'ar-SA',name:'Arabic Natural',localService:true}
  ];
  assert.equal(pickBrowserVoice(voices,'ar-SA'),voices[2]);
});
