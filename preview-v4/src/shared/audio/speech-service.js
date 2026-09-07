import { createVoiceService } from './voice-service.js';

export function createSpeechService({
  synth=globalThis.speechSynthesis,
  Utterance=globalThis.SpeechSynthesisUtterance,
  nativeTts,
  AudioClass=globalThis.Audio,
  manifest,
  voiceService=null
}={}){
  const voice=voiceService||createVoiceService({synth,Utterance,nativeTts,AudioClass,manifest});

  function speak(input,options={}){
    if(typeof input==='string')return voice.say({text:input,...options});
    if(input&&typeof input==='object')return voice.say(input);
    return false;
  }

  function stop(){voice.stop();}

  return Object.freeze({speak,stop});
}
