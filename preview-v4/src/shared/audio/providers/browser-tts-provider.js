import { NATURAL_VOICE_PROFILE,scoreArabicVoice } from '../natural-voice-profile.js';

export function pickBrowserVoice(voices=[],lang=NATURAL_VOICE_PROFILE.locale){
  if(!Array.isArray(voices)||!voices.length)return null;
  return voices.reduce((best,voice)=>scoreArabicVoice(voice,lang)>scoreArabicVoice(best,lang)?voice:best,null);
}

function waitForVoices(synth,waitMs){
  const initial=synth?.getVoices?.()||[];
  if(initial.length)return Promise.resolve(initial);
  if(!synth?.addEventListener||!waitMs)return Promise.resolve(initial);
  return new Promise(resolve=>{
    let done=false;
    const finish=()=>{if(done)return;done=true;try{synth.removeEventListener?.('voiceschanged',finish);}catch{}resolve(synth.getVoices?.()||[]);};
    synth.addEventListener('voiceschanged',finish,{once:true});
    setTimeout(finish,waitMs);
  });
}

export function createBrowserTtsProvider({synth=globalThis.speechSynthesis,Utterance=globalThis.SpeechSynthesisUtterance}={}){
  function stop(){try{synth?.cancel?.();}catch{}}

  async function speak(request={}){
    if(!request.text||!synth||!Utterance||request.isCurrent?.()===false)return false;
    try{
      const utterance=new Utterance(String(request.text));
      utterance.lang=request.lang||NATURAL_VOICE_PROFILE.locale;
      utterance.rate=Number(request.rate??NATURAL_VOICE_PROFILE.rate);
      utterance.pitch=Number(request.pitch??NATURAL_VOICE_PROFILE.pitch);
      utterance.volume=Number(request.volume??NATURAL_VOICE_PROFILE.volume);
      const voices=await waitForVoices(synth,NATURAL_VOICE_PROFILE.browserVoiceWaitMs);
      const voice=pickBrowserVoice(voices,utterance.lang);
      if(voice)utterance.voice=voice;
      if(request.isCurrent?.()===false)return false;
      synth.speak(utterance);
      return true;
    }catch{return false;}
  }

  return Object.freeze({kind:'browser-tts',speak,stop});
}
