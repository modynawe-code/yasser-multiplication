import { VOICE_MANIFEST } from './voice-manifest.js';
import { HUMAN_VOICE_POLICY,isHumanOnlyVoiceMode } from './human-voice-policy.js';
import { NATURAL_VOICE_PROFILE } from './natural-voice-profile.js';
import { createLocalAudioProvider } from './providers/local-audio-provider.js';
import { createCloudTtsProvider } from './providers/cloud-tts-provider.js';
import { createNativeTtsProvider,resolveNativeTts } from './providers/native-tts-provider.js';
import { createBrowserTtsProvider } from './providers/browser-tts-provider.js';

function stopProvider(provider){try{return Promise.resolve(provider?.stop?.()).catch(()=>false);}catch{return Promise.resolve(false);}}

export function createVoiceService({
  manifest=VOICE_MANIFEST,
  AudioClass=globalThis.Audio,
  nativeTts=resolveNativeTts(),
  synth=globalThis.speechSynthesis,
  Utterance=globalThis.SpeechSynthesisUtterance,
  neuralProvider,
  mode=HUMAN_VOICE_POLICY.runtimeMode,
  providers=null
}={}){
  const local=createLocalAudioProvider({manifest,AudioClass});
  const cloud=neuralProvider===undefined?createCloudTtsProvider({AudioClass}):neuralProvider;
  const defaultChain=isHumanOnlyVoiceMode(mode)
    ?[local]
    :[local,cloud,createNativeTtsProvider({nativeTts}),createBrowserTtsProvider({synth,Utterance})];
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
      lang:request.lang||NATURAL_VOICE_PROFILE.locale,
      rate:Number(request.rate??NATURAL_VOICE_PROFILE.rate),
      pitch:Number(request.pitch??NATURAL_VOICE_PROFILE.pitch),
      volume:Number(request.volume??NATURAL_VOICE_PROFILE.volume),
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
