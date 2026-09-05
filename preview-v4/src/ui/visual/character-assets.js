const ROOT=new URL('../../../',import.meta.url);

const asset=(source,fallback=null)=>({source,fallback});

export const VISUAL_ASSETS={
  yasser:{
    welcome:asset('assets/visual/original/yasser/welcome.png','assets/visual/yasser/welcome.b64.txt'),
    thinking:asset('assets/visual/original/yasser/thinking.png','assets/visual/yasser/thinking.b64.txt'),
    encourage:asset('assets/visual/original/yasser/encourage.png','assets/visual/yasser/encourage.b64.txt'),
    celebrate:asset('assets/visual/original/yasser/celebrate.png','assets/visual/yasser/celebrate.b64.txt'),
    mastered:asset('assets/visual/original/yasser/mastered.png','assets/visual/yasser/mastered.b64.txt')
  },
  assistant:{
    idle:asset('assets/visual/original/assistant/idle.png','assets/visual/assistant/idle.b64.txt'),
    thinking:asset('assets/visual/original/assistant/thinking.png','assets/visual/assistant/thinking.b64.txt'),
    celebrate:asset('assets/visual/original/assistant/celebrate.png','assets/visual/assistant/celebrate.b64.txt')
  },
  composite:{
    celebration:asset('assets/visual/original/group/yasser-assistant-celebration.png')
  }
};

const FALLBACK_ASSETS={
  yasser:'assets/characters/yasser-welcome.webp',
  assistant:'assets/assistant/assistant-welcome.webp'
};

const resolvedUrls=new Map();
const fallbackUrls=new Map();
const inflight=new Map();

function fallbackState(character){
  return character==='assistant'?'idle':'welcome';
}

function getDescriptor(group,state){
  const states=VISUAL_ASSETS[group];
  if(!states)throw new Error(`Unknown visual group: ${group}`);
  const selected=states[state]?state:(group==='composite'?null:fallbackState(group));
  const descriptor=selected?states[selected]:null;
  if(!descriptor)throw new Error(`Unknown visual state: ${group}.${state}`);
  return{descriptor,state:selected};
}

function isEncodedPayload(path){return path.endsWith('.b64.txt');}

async function loadDirectUrl(path){
  const url=new URL(path,ROOT).href;
  await new Promise((resolve,reject)=>{
    const probe=new Image();
    probe.onload=()=>resolve();
    probe.onerror=()=>reject(new Error(`Visual asset failed: ${path}`));
    probe.src=url;
  });
  return url;
}

async function loadEncodedUrl(path){
  const url=new URL(path,ROOT);
  const response=await fetch(url,{cache:'no-store'});
  if(!response.ok)throw new Error(`Visual asset failed: ${response.status}`);

  const encoded=(await response.text()).replace(/\s+/g,'');
  if(!encoded.startsWith('UklG'))throw new Error('Visual asset payload is not WebP base64');
  return`data:image/webp;base64,${encoded}`;
}

async function loadPath(path){
  const key=new URL(path,ROOT).href;
  if(resolvedUrls.has(key))return resolvedUrls.get(key);
  if(inflight.has(key))return inflight.get(key);

  const task=(isEncodedPayload(path)?loadEncodedUrl(path):loadDirectUrl(path))
    .then(url=>{resolvedUrls.set(key,url);return url;});

  inflight.set(key,task);
  try{return await task;}
  finally{inflight.delete(key);}
}

async function loadDescriptor(group,state){
  const selected=getDescriptor(group,state);
  try{
    return{url:await loadPath(selected.descriptor.source),state:selected.state,quality:'original'};
  }catch(originalError){
    if(!selected.descriptor.fallback)throw originalError;
    return{url:await loadPath(selected.descriptor.fallback),state:selected.state,quality:'legacy-fallback'};
  }
}

async function loadFallbackUrl(character){
  if(fallbackUrls.has(character))return fallbackUrls.get(character);

  const path=FALLBACK_ASSETS[character];
  if(!path)throw new Error(`No fallback asset for ${character}`);

  const url=await loadDirectUrl(path);
  fallbackUrls.set(character,url);
  return url;
}

async function setImage(image,{group,state,token,allowCharacterFallback=false}={}){
  if(!image)return false;
  const previousSource=image.getAttribute('src');

  try{
    const loaded=await loadDescriptor(group,state);
    if(token!==undefined&&image.dataset.visualToken!==String(token))return false;

    image.src=loaded.url;
    image.dataset.visualState=loaded.state;
    image.dataset.visualQuality=loaded.quality;
    delete image.dataset.visualError;
    return true;
  }catch(error){
    console.warn(error);

    if(previousSource){
      image.dataset.visualError='preserved';
      return false;
    }

    if(!allowCharacterFallback){
      image.removeAttribute('src');
      image.hidden=true;
      image.dataset.visualError='unavailable';
      return false;
    }

    try{
      const fallbackUrl=await loadFallbackUrl(group);
      if(token!==undefined&&image.dataset.visualToken!==String(token))return false;

      image.src=fallbackUrl;
      image.dataset.visualState=`${fallbackState(group)}-fallback`;
      image.dataset.visualQuality='fallback';
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

export function setVisualImage(image,{character,state,token}={}){
  return setImage(image,{group:character,state,token,allowCharacterFallback:true});
}

export function setCompositeImage(image,{state,token}={}){
  return setImage(image,{group:'composite',state,token,allowCharacterFallback:false});
}

export function preloadVisualAssets(items){
  return Promise.allSettled(items.map(item=>loadDescriptor(item.group||item.character,item.state)));
}
