/**
 * Optional OS speech for instructions ONLY, never Quran recitation.
 * The player still uses exclusively verified human audio recordings.
 */
export function createQuranInstructionVoice({environment=globalThis}={}){
  const available=()=>typeof environment.SpeechSynthesisUtterance==='function'
    &&typeof environment.speechSynthesis?.speak==='function';
  const stop=()=>{try{environment.speechSynthesis?.cancel();}catch{}};
  const speak=text=>{
    if(!available()||typeof text!=='string'||text.length>180)return false;
    stop();
    try{
      const msg=new environment.SpeechSynthesisUtterance(text);
      msg.lang='ar-SA';msg.rate=.85;
      environment.speechSynthesis.speak(msg);
      return true;
    }catch{return false;}
  };
  return Object.freeze({available,stop,speak});
}
