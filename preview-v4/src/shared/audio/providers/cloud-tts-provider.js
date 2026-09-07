import { getFamilyApiBase } from '../../config/family-api-config.js';
import { FAMILY_AUTH_SESSION_KEY } from '../../sync/family-auth-client.js';

function readSession(storage){
  try{return JSON.parse(storage?.getItem(FAMILY_AUTH_SESSION_KEY)||'null');}catch{return null;}
}

export function createCloudTtsProvider({
  baseUrl=getFamilyApiBase(),
  fetchFn=globalThis.fetch,
  storage=globalThis.sessionStorage,
  AudioClass=globalThis.Audio,
  URLClass=globalThis.URL
}={}){
  const api=String(baseUrl||'').replace(/\/$/,'');
  const cache=new Map();
  let currentAudio=null,currentController=null,currentUrl=null;

  function releaseUrl(){
    if(currentUrl){try{URLClass?.revokeObjectURL?.(currentUrl);}catch{}currentUrl=null;}
  }

  async function stop(){
    try{currentController?.abort?.();}catch{}
    currentController=null;
    if(currentAudio){try{currentAudio.pause();currentAudio.currentTime=0;}catch{}currentAudio=null;}
    releaseUrl();
  }

  async function playBlob(blob,request){
    if(typeof AudioClass!=='function'||!URLClass?.createObjectURL||request.isCurrent?.()===false)return false;
    const url=URLClass.createObjectURL(blob);
    const audio=new AudioClass(url);
    currentUrl=url;currentAudio=audio;
    audio.preload='auto';
    audio.volume=Math.max(0,Math.min(1,Number(request.volume??1)));
    const cleanup=()=>{if(currentAudio===audio)currentAudio=null;if(currentUrl===url){try{URLClass.revokeObjectURL(url);}catch{}currentUrl=null;}};
    audio.addEventListener?.('ended',cleanup,{once:true});
    audio.addEventListener?.('error',cleanup,{once:true});
    try{await audio.play?.();return true;}catch{cleanup();return false;}
  }

  async function speak(request={}){
    const text=String(request.text||'').replace(/\s+/g,' ').trim();
    if(!text||!api||typeof fetchFn!=='function'||request.isCurrent?.()===false)return false;
    const session=readSession(storage);if(!session?.token)return false;
    await stop();

    const cached=cache.get(text);
    if(cached)return playBlob(cached,request);

    const controller=typeof AbortController==='function'?new AbortController():null;
    currentController=controller;
    try{
      const response=await fetchFn(`${api}/v1/voice/synthesize`,{
        method:'POST',
        headers:{'content-type':'application/json',authorization:`Bearer ${session.token}`},
        body:JSON.stringify({text}),
        signal:controller?.signal
      });
      currentController=null;
      if(!response.ok||request.isCurrent?.()===false)return false;
      const blob=await response.blob();
      if(!blob||request.isCurrent?.()===false)return false;
      cache.set(text,blob);
      return playBlob(blob,request);
    }catch{
      currentController=null;
      return false;
    }
  }

  return Object.freeze({kind:'cloud-tts',speak,stop});
}
