import {ENGLISH_AUDIO_CLIPS,englishAudioPath} from './english-audio-manifest.js';
export const ENGLISH_AUDIO_CACHE='english-review-ryan-v1';
// One reusable media element preserves the user gesture grant on mobile browsers.
export function createEnglishReviewAudio({createAudio=()=>new Audio(),fetchFile=(...args)=>fetch(...args),cacheStorage=globalThis.caches}={}){
 const audio=createAudio();audio.preload='auto';
 let generation=0,cancelPending=null,objectURL=null;
 function stop(){generation++;cancelPending?.();cancelPending=null;audio.pause();audio.removeAttribute('src');audio.load();if(objectURL){URL.revokeObjectURL(objectURL);objectURL=null;}}
 function unlock(){
  stop();audio.src='data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
  return Promise.resolve(audio.play());
 }
 async function getFile(path){
  const url=new URL(path,document.baseURI).href;
  const cache=cacheStorage?await cacheStorage.open(ENGLISH_AUDIO_CACHE):null;
  const saved=await cache?.match(url);if(saved)return saved;
  const response=await fetchFile(url);if(!response.ok)throw new Error('Audio unavailable');
  if(cache)await cache.put(url,response.clone());return response;
 }
 async function download(onProgress=()=>{}){if(!cacheStorage)throw new Error('Offline storage unavailable');let done=0;for(const clip of ENGLISH_AUDIO_CLIPS){await getFile(clip.path);onProgress(++done,ENGLISH_AUDIO_CLIPS.length);}}
 async function play(parts,{onPart=()=>{},onComplete=()=>{},onError=()=>{}}={}){
  stop();const token=generation;
  try{
   for(const part of parts){
    const path=englishAudioPath(part.text);if(!path)throw new Error('Missing audio manifest entry');
    const response=await getFile(path),blob=await response.blob();if(token!==generation)return false;
    if(objectURL)URL.revokeObjectURL(objectURL);objectURL=URL.createObjectURL(blob);audio.src=objectURL;
    onPart(part);
    await new Promise((resolve,reject)=>{
     let timer;const cleanup=()=>{clearTimeout(timer);audio.onended=null;audio.onerror=null;cancelPending=null;};
     cancelPending=()=>{cleanup();resolve();};
     audio.onended=()=>{cleanup();resolve();};audio.onerror=()=>{cleanup();reject(new Error('Audio playback failed'));};
     timer=setTimeout(()=>{cleanup();reject(new Error('Audio playback timed out'));},120000);
     try{Promise.resolve(audio.play()).catch(error=>{cleanup();reject(error);});}catch(error){cleanup();reject(error);}
    });
    if(token!==generation)return false;
   }
   onComplete();return true;
  }catch(error){if(token===generation){stop();onError(error);}return false;}
 }
 return {unlock,stop,play,download};
}
export function englishQuestionParts(q){return [{text:q.prompt,index:-1},...(q.choices||[]).map((text,index)=>({text,index}))];}
