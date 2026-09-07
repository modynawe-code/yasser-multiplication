export function resolveNativeTts(){
  try{
    const cap=globalThis.Capacitor;
    if(!cap?.isNativePlatform?.()||!cap?.isPluginAvailable?.('TextToSpeech'))return null;
    return cap.Plugins?.TextToSpeech||null;
  }catch{return null;}
}

function scoreVoice(voice,lang){
  const candidate=String(voice?.lang||'').toLowerCase(),wanted=String(lang||'ar-SA').toLowerCase(),name=String(voice?.name||'').toLowerCase();
  let score=0;
  if(candidate===wanted)score+=100;
  else if(candidate.startsWith('ar-'))score+=70;
  else if(candidate==='ar')score+=60;
  if(voice?.localService)score+=12;
  if(/natural|neural|enhanced|premium/.test(name))score+=18;
  if(voice?.default)score+=3;
  return score;
}

export function pickNativeVoiceIndex(voices=[],lang='ar-SA'){
  if(!Array.isArray(voices)||!voices.length)return undefined;
  let bestIndex, bestScore=-1;
  voices.forEach((voice,index)=>{const score=scoreVoice(voice,lang);if(score>bestScore){bestScore=score;bestIndex=index;}});
  return bestScore>0?bestIndex:undefined;
}

export function createNativeTtsProvider({nativeTts=resolveNativeTts()}={}){
  let voiceIndexPromise=null;

  function getVoiceIndex(lang){
    if(!nativeTts?.getSupportedVoices)return Promise.resolve(undefined);
    if(!voiceIndexPromise){
      voiceIndexPromise=Promise.resolve(nativeTts.getSupportedVoices())
        .then(result=>pickNativeVoiceIndex(result?.voices||[],lang))
        .catch(()=>undefined);
    }
    return voiceIndexPromise;
  }

  async function stop(){try{await nativeTts?.stop?.();}catch{}}

  async function speak(request={}){
    if(!request.text||!nativeTts?.speak)return false;
    const lang=request.lang||'ar-SA';
    try{
      await stop();
      const voice=await getVoiceIndex(lang);
      const options={
        text:String(request.text),
        lang,
        rate:Number(request.rate??.88),
        pitch:Number(request.pitch??1),
        volume:Number(request.volume??1),
        queueStrategy:0
      };
      if(Number.isInteger(voice))options.voice=voice;
      await nativeTts.speak(options);
      return true;
    }catch{return false;}
  }

  return Object.freeze({kind:'native-tts',speak,stop});
}
