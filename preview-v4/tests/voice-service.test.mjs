import test from 'node:test';
import assert from 'node:assert/strict';
import { createVoiceService } from '../src/shared/audio/voice-service.js';
import { createCloudTtsProvider } from '../src/shared/audio/providers/cloud-tts-provider.js';
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

test('default natural TTS chain puts cloud before native and browser fallbacks',()=>{
  const cloud={kind:'cloud-tts',async speak(){return false;},stop(){}};
  const voice=createVoiceService({AudioClass:null,neuralProvider:cloud,nativeTts:null,synth:null,Utterance:null});
  assert.deepEqual(voice.providers,['local-audio','cloud-tts','native-tts','browser-tts']);
});

test('cloud TTS uses the authenticated family API and plays returned audio',async()=>{
  let request=null;
  const storage={getItem(){return JSON.stringify({token:'test-token'});}};
  const audioInstances=[];
  class AudioMock{
    constructor(src){this.src=src;this.volume=1;this.currentTime=0;audioInstances.push(this);}
    addEventListener(){}
    async play(){return true;}
    pause(){}
  }
  const URLClass={createObjectURL(){return'blob:test';},revokeObjectURL(){}};
  const provider=createCloudTtsProvider({
    baseUrl:'https://family.example',storage,AudioClass:AudioMock,URLClass,
    fetchFn:async(url,options)=>{request={url,options};return{ok:true,async blob(){return{type:'audio/mpeg'};}};}
  });
  const handled=await provider.speak({text:'كم ناتج ثلاثة ضرب أربعة؟',volume:.8,isCurrent:()=>true});
  assert.equal(handled,true);
  assert.equal(request.url,'https://family.example/v1/voice/synthesize');
  assert.equal(request.options.headers.authorization,'Bearer test-token');
  assert.deepEqual(JSON.parse(request.options.body),{text:'كم ناتج ثلاثة ضرب أربعة؟'});
  assert.equal(audioInstances[0].src,'blob:test');
  assert.equal(audioInstances[0].volume,.8);
});

test('cloud TTS quietly falls back when no parent cloud session exists',async()=>{
  let fetched=false;
  const provider=createCloudTtsProvider({
    baseUrl:'https://family.example',storage:{getItem(){return null;}},AudioClass:class{},URLClass:{createObjectURL(){return'blob:x';}},
    fetchFn:async()=>{fetched=true;return{ok:true};}
  });
  assert.equal(await provider.speak({text:'مرحبا',isCurrent:()=>true}),false);
  assert.equal(fetched,false);
});

test('native Arabic voice selection prefers exact language and higher-quality names',()=>{
  const voices=[
    {lang:'ar-EG',name:'Arabic local',localService:true},
    {lang:'ar-SA',name:'Arabic standard',localService:true},
    {lang:'ar-SA',name:'Arabic Neural',localService:false}
  ];
  assert.equal(pickNativeVoiceIndex(voices,'ar-SA'),2);
});

test('Saudi natural voice outranks Gulf fallback, while Gulf outranks unrelated Arabic',()=>{
  const voices=[
    {lang:'ar-EG',name:'Arabic Natural',localService:false},
    {lang:'ar-AE',name:'Arabic Natural',localService:false},
    {lang:'ar-SA',name:'Arabic Natural',localService:false}
  ];
  assert.equal(pickNativeVoiceIndex(voices,'ar-SA'),2);
  assert.equal(pickBrowserVoice(voices.slice(0,2),'ar-SA'),voices[1]);
});

test('browser Arabic voice selection prefers exact Saudi Arabic natural voice',()=>{
  const voices=[
    {lang:'en-US',name:'English Natural',localService:true},
    {lang:'ar-SA',name:'Arabic Standard',localService:true},
    {lang:'ar-SA',name:'Arabic Natural',localService:false}
  ];
  assert.equal(pickBrowserVoice(voices,'ar-SA'),voices[2]);
});
