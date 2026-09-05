const ROOT=new URL('../../../',import.meta.url);

const ASSET_FILES={
  yasser:{
    welcome:'assets/yasser/welcome.b64.txt'
  },
  assistant:{
    neutral:'assets/assistant/neutral.b64.txt',
    thinking:'assets/assistant/thinking.b64.txt'
  }
};

const objectUrls=new Map();

function resolve(character,state){
  const group=ASSET_FILES[character];
  if(!group)throw new Error(`Unknown visual character: ${character}`);
  const path=group[state]||group.neutral||group.welcome;
  if(!path)throw new Error(`Unknown visual state: ${character}.${state}`);
  return new URL(path,ROOT);
}

async function loadObjectUrl(character,state){
  const url=resolve(character,state);
  const key=url.href;
  if(objectUrls.has(key))return objectUrls.get(key);
  const response=await fetch(url,{cache:'force-cache'});
  if(!response.ok)throw new Error(`Visual asset failed: ${response.status}`);
  const encoded=(await response.text()).trim();
  const binary=atob(encoded);
  const bytes=new Uint8Array(binary.length);
  for(let index=0;index<binary.length;index+=1)bytes[index]=binary.charCodeAt(index);
  const objectUrl=URL.createObjectURL(new Blob([bytes],{type:'image/webp'}));
  objectUrls.set(key,objectUrl);
  return objectUrl;
}

export async function setVisualImage(image,{character,state}){
  if(!image)return;
  try{
    image.src=await loadObjectUrl(character,state);
    image.dataset.visualState=state;
  }catch(error){
    image.removeAttribute('src');
    image.dataset.visualError='true';
    console.warn(error);
  }
}

export function preloadVisualAssets(items){
  return Promise.allSettled(items.map(item=>loadObjectUrl(item.character,item.state)));
}
