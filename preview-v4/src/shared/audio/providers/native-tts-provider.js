import { NATURAL_VOICE_PROFILE,scoreArabicVoice } from '../natural-voice-profile.js';

export function resolveNativeTts(){
  try{
    const cap=globalThis.Capacitor;
    if(!cap?.isNativePlatform?.()||!cap?.isPluginAvailable?.('TextToSpeech'))return null;
    return cap.Plugins?.TextToSpeech||null;
  }catch{return null;}
}

export function pickNativeVoiceIndex(voices=[],lang=NATURAL_VOICE_PROFILE.locale){
  if(!Array.isArray(voices)||!voices.length)return undefined;
  let bestIndex,bestScore=Number.NEGATIVE_INFINITY;
  voices.forEach((voice,index)=>{
    const score=scoreArabicVoice(voice,lang);
    if(score>bestScore){bestScore=score;bestIndex=index;}
  });
  return Number.isFinite(bestScore)?bestIndex:undefined;
}

export function createNativeTtsProvider({nativeTts=resolveNativeTts()}={}){
  const voiceIndexByLang=new Map();

  function getVoiceIndex(lang){
    if(!nativeTts?.getSupportedVoices)return Promise.resolve(undefined);
    if(!voiceIndexByLang.has(lang)){
      voiceIndexByLang.set(lang,Promise.resolve(nativeTts.getSupportedVoices())
        .then(result=>pickNativeVoiceIndex(result?.voices||[],lang))
        .catch(()=>undefined));
    }
    return voiceIndexByLang.get(lang);
  }

  async function stop(){try{await nativeTts?.stop?.();}catch{}}

  async function speak(request={}){
    if(!request.text||!nativeTts?.speak)return false;
    const lang=request.lang||NATURAL_VOICE_PROFILE.locale;
    try{
      const voice=await getVoiceIndex(lang);
      if(request.isCurrent&&request.isCurrent()===false)return false;
      const options={
        text:String(request.text),
        lang,
        rate:Number(request.rate??NATURAL_VOICE_PROFILE.rate),
        pitch:Number(request.pitch??NATURAL_VOICE_PROFILE.pitch),
        volume:Number(request.volume??NATURAL_VOICE_PROFILE.volume),
        queueStrategy:0
      };
      if(Number.isInteger(voice))options.voice=voice;
      await nativeTts.speak(options);
      return true;
    }catch{return false;}
  }

  return Object.freeze({kind:'native-tts',speak,stop});
}
