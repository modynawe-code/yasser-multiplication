function resolveNativeTts(){
  try{
    const cap=globalThis.Capacitor;
    if(!cap?.isNativePlatform?.()||!cap?.isPluginAvailable?.('TextToSpeech'))return null;
    return cap.Plugins?.TextToSpeech||null;
  }catch{return null;}
}

export function createSpeechService({
  synth=globalThis.speechSynthesis,
  Utterance=globalThis.SpeechSynthesisUtterance,
  nativeTts=resolveNativeTts()
}={}){
  function browserSpeak(text){
    if(!text||!synth||!Utterance)return false;
    try{
      synth.cancel();
      const utterance=new Utterance(text);
      utterance.lang='ar-SA';
      utterance.rate=.88;
      utterance.pitch=1;
      synth.speak(utterance);
      return true;
    }catch{return false;}
  }

  function speak(text){
    if(!text)return false;
    if(nativeTts?.speak){
      Promise.resolve(nativeTts.stop?.()).catch(()=>{}).then(()=>nativeTts.speak({
        text,
        lang:'ar-SA',
        rate:.88,
        pitch:1,
        volume:1,
        queueStrategy:0
      })).catch(()=>browserSpeak(text));
      return true;
    }
    return browserSpeak(text);
  }

  function stop(){
    try{synth?.cancel();}catch{}
    try{Promise.resolve(nativeTts?.stop?.()).catch(()=>{});}catch{}
  }

  return{speak,stop};
}
