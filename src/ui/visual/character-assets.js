const ROOT=new URL('../../../',import.meta.url);

export const VISUAL_ASSETS={
  yasser:{
    welcome:'assets/visual/yasser/welcome.b64.txt',
    thinking:'assets/visual/yasser/thinking.b64.txt',
    encourage:'assets/visual/yasser/encourage.b64.txt',
    celebrate:'assets/visual/yasser/celebrate.b64.txt',
    mastered:'assets/visual/yasser/mastered.b64.txt'
  },
  assistant:{
    idle:'assets/visual/assistant/idle.b64.txt',
    thinking:'assets/visual/assistant/thinking.b64.txt',
    celebrate:'assets/visual/assistant/celebrate.b64.txt'
  }
};

const objectUrls=new Map();
const inflight=new Map();

function fallbackState(character){
  return character==='assistant'?'idle':'welcome';
}

function resolve(character,state){
  const group=VISUAL_ASSETS[character];
  if(!group)throw new Error(`Unknown visual character: ${character}`);
  const selected=group[state]?state:fallbackState(character);
  const path=group[selected];
  if(!path)throw new Error(`Unknown visual state: ${character}.${state}`);
  return{url:new URL(path,ROOT),state:selected};
}

async function loadObjectUrl(character,state){
  const resolved=resolve(character,state);
  const key=resolved.url.href;
  if(objectUrls.has(key))return{url:objectUrls.get(key),state:resolved.state};
  if(inflight.has(key))return{url:await inflight.get(key),state:resolved.state};
  const task=(async()=>{
    const response=await fetch(resolved.url,{cache:'force-cache'});
    if(!response.ok)throw new Error(`Visual asset failed: ${response.status}`);
    const encoded=(await response.text()).trim();
    const binary=atob(encoded);
    const bytes=new Uint8Array(binary.length);
    for(let index=0;index<binary.length;index+=1)bytes[index]=binary.charCodeAt(index);
    const objectUrl=URL.createObjectURL(new Blob([bytes],{type:'image/webp'}));
    objectUrls.set(key,objectUrl);
    return objectUrl;
  })();
  inflight.set(key,task);
  try{return{url:await task,state:resolved.state};}
  finally{inflight.delete(key);}
}

export async function setVisualImage(image,{character,state,token}={}){
  if(!image)return false;
  try{
    const loaded=await loadObjectUrl(character,state);
    if(token!==undefined&&image.dataset.visualToken!==String(token))return false;
    image.src=loaded.url;
    image.dataset.visualState=loaded.state;
    delete image.dataset.visualError;
    return true;
  }catch(error){
    image.removeAttribute('src');
    image.dataset.visualError='true';
    console.warn(error);
    return false;
  }
}

export function preloadVisualAssets(items){
  return Promise.allSettled(items.map(item=>loadObjectUrl(item.character,item.state)));
}
