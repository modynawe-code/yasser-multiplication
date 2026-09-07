import { resolveVoiceAsset } from '../voice-manifest.js';

export function createLocalAudioProvider({manifest,AudioClass=globalThis.Audio}={}){
  let current=null;

  function stop(){
    if(!current)return;
    try{current.pause();current.currentTime=0;}catch{}
    current=null;
  }

  async function speak(request={}){
    const src=resolveVoiceAsset(request.id,manifest);
    if(!src||typeof AudioClass!=='function')return false;
    stop();
    let audio;
    try{audio=new AudioClass(src);}catch{return false;}
    current=audio;
    audio.preload='auto';
    audio.volume=Math.max(0,Math.min(1,Number(request.volume??1)));
    const cleanup=()=>{if(current===audio)current=null;};
    audio.addEventListener?.('ended',cleanup,{once:true});
    audio.addEventListener?.('error',cleanup,{once:true});
    try{
      await audio.play?.();
      return true;
    }catch{
      cleanup();
      return false;
    }
  }

  return Object.freeze({kind:'local-audio',speak,stop});
}
