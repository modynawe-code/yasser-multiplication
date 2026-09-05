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

const FALLBACK_ASSETS={
  yasser:'assets/characters/yasser-welcome.webp',
  assistant:'assets/assistant/assistant-welcome.webp'
};

const dataUrls=new Map();
const fallbackUrls=new Map();
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

async function loadDataUrl(character,state){
  const resolved=resolve(character,state);
  const key=resolved.url.href;

  if(dataUrls.has(key))return{url:dataUrls.get(key),state:resolved.state};
  if(inflight.has(key))return{url:await inflight.get(key),state:resolved.state};

  const task=(async()=>{
    const response=await fetch(resolved.url,{cache:'no-store'});
    if(!response.ok)throw new Error(`Visual asset failed: ${response.status}`);

    const encoded=(await response.text()).replace(/\s+/g,'');
    if(!encoded.startsWith('UklG'))throw new Error('Visual asset payload is not WebP base64');

    const dataUrl=`data:image/webp;base64,${encoded}`;
    dataUrls.set(key,dataUrl);
    return dataUrl;
  })();

  inflight.set(key,task);
  try{
    return{url:await task,state:resolved.state};
  }finally{
    inflight.delete(key);
  }
}

async function loadFallbackUrl(character){
  if(fallbackUrls.has(character))return fallbackUrls.get(character);

  const path=FALLBACK_ASSETS[character];
  if(!path)throw new Error(`No fallback asset for ${character}`);

  const url=new URL(path,ROOT).href;
  await new Promise((resolve,reject)=>{
    const probe=new Image();
    probe.onload=()=>resolve();
    probe.onerror=()=>reject(new Error(`Fallback asset failed: ${character}`));
    probe.src=url;
  });

  fallbackUrls.set(character,url);
  return url;
}

export async function setVisualImage(image,{character,state,token}={}){
  if(!image)return false;

  const previousSource=image.getAttribute('src');

  try{
    const loaded=await loadDataUrl(character,state);
    if(token!==undefined&&image.dataset.visualToken!==String(token))return false;

    image.src=loaded.url;
    image.dataset.visualState=loaded.state;
    delete image.dataset.visualError;
    return true;
  }catch(error){
    console.warn(error);

    if(previousSource){
      image.dataset.visualError='preserved';
      return false;
    }

    try{
      const fallbackUrl=await loadFallbackUrl(character);
      if(token!==undefined&&image.dataset.visualToken!==String(token))return false;

      image.src=fallbackUrl;
      image.dataset.visualState=`${fallbackState(character)}-fallback`;
      image.dataset.visualError='fallback';
      return true;
    }catch(fallbackError){
      console.warn(fallbackError);
      image.removeAttribute('src');
      image.hidden=true;
      image.dataset.visualError='unavailable';
      return false;
    }
  }
}

export function preloadVisualAssets(items){
  return Promise.allSettled(items.map(item=>loadDataUrl(item.character,item.state)));
}
