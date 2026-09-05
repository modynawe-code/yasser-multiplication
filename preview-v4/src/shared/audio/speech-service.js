export function createSpeechService({synth=globalThis.speechSynthesis,Utterance=globalThis.SpeechSynthesisUtterance}={}){
  function speak(text){
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
  function stop(){try{synth?.cancel();}catch{}}
  return{speak,stop};
}
