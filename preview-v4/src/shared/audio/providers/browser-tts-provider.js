function scoreVoice(voice,lang){
  const candidate=String(voice?.lang||'').toLowerCase(),wanted=String(lang||'ar-SA').toLowerCase(),name=String(voice?.name||'').toLowerCase();
  let score=0;
  if(candidate===wanted)score+=100;
  else if(candidate.startsWith('ar-'))score+=70;
  else if(candidate==='ar')score+=60;
  if(voice?.localService)score+=10;
  if(/natural|neural|enhanced|premium/.test(name))score+=18;
  if(voice?.default)score+=3;
  return score;
}

export function pickBrowserVoice(voices=[],lang='ar-SA'){
  if(!Array.isArray(voices)||!voices.length)return null;
  return voices.reduce((best,voice)=>scoreVoice(voice,lang)>scoreVoice(best,lang)?voice:best,null);
}

export function createBrowserTtsProvider({synth=globalThis.speechSynthesis,Utterance=globalThis.SpeechSynthesisUtterance}={}){
  function stop(){try{synth?.cancel?.();}catch{}}

  async function speak(request={}){
    if(!request.text||!synth||!Utterance)return false;
    try{
      stop();
      const utterance=new Utterance(String(request.text));
      utterance.lang=request.lang||'ar-SA';
      utterance.rate=Number(request.rate??.88);
      utterance.pitch=Number(request.pitch??1);
      utterance.volume=Number(request.volume??1);
      const voice=pickBrowserVoice(synth.getVoices?.()||[],utterance.lang);
      if(voice)utterance.voice=voice;
      synth.speak(utterance);
      return true;
    }catch{return false;}
  }

  return Object.freeze({kind:'browser-tts',speak,stop});
}
