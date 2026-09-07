import { VOICE_MANIFEST } from './voice-manifest.js';
import { HUMAN_VOICE_POLICY,isHumanOnlyVoiceMode } from './human-voice-policy.js';
import { createLocalAudioProvider } from './providers/local-audio-provider.js';
import { createNativeTtsProvider,resolveNativeTts } from './providers/native-tts-provider.js';
import { createBrowserTtsProvider } from './providers/browser-tts-provider.js';

function stopProvider(provider){try{return Promise.resolve(provider?.stop?.()).catch(()=>false);}catch{return Promise.resolve(false);}}

export function createVoiceService({
  manifest=VOICE_MANIFEST,
  AudioClass=globalThis.Audio,
  nativeTts=resolveNativeTts(),
  synth=globalThis.speechSynthesis,
  Utterance=globalThis.SpeechSynthesisUtterance,
  neuralProvider=null,
  mode=HUMAN_VOICE_POLICY.runtimeMode,
  providers=null
}={}){
  const local=createLocalAudioProvider({manifest,AudioClass});
  const defaultChain=isHumanOnlyVoiceMode(mode)
    ?[local]
    :[local,neuralProvider,createNativeTtsProvider({nativeTts}),createBrowserTtsProvider({synth,Utterance})];
  const chain=(providers||defaultChain).filter(provider=>provider&&typeof provider.speak==='function');
  let generation=0;

  async function run(request,token){
    for(const provider of chain){
      if(token!==generation)return false;
      try{
        const handled=await provider.speak(request);
        if(token!==generation){await stopProvider(provider);return false;}
        if(handled)return true;
      }catch{}
    }
    return false;
  }

  function say(input,options={}){
    const request=typeof input==='string'?{text:input,...options}:{...(input||{})};
    if(!request.text&&!request.id)return false;
    const token=++generation;
    if(request.interrupt!==false)chain.forEach(provider=>{void stopProvider(provider);});
    const normalized={
      ...request,
      lang:request.lang||HUMAN_VOICE_POLICY.locale,
      rate:Number(request.rate??.88),
      pitch:Number(request.pitch??1),
      volume:Number(request.volume??1),
      isCurrent:()=>token===generation
    };
    void run(normalized,token);
    return true;
  }

  function stop(){
    generation+=1;
    chain.forEach(provider=>{void stopProvider(provider);});
  }

  return Object.freeze({
    say,
    speak:say,
    stop,
    mode,
    providers:Object.freeze(chain.map(provider=>provider.kind||'custom'))
  });
}
