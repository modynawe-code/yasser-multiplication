import { rewardIllustrationSource } from './game-inspired-rewards.js';

const REWARD_ASSET_KEYS=Object.freeze([
  'mastery-cup','weekly-cup','accuracy-medal','mastery-shield',
  'distinction-crown','streak-flame','surprise-box','progress-badge'
]);

const REWARD_ASSET_SET=new Set(REWARD_ASSET_KEYS);
const assetCache=new Map();

export { REWARD_ASSET_KEYS };

export function rewardAssetSource(graphicKey){
  const key=String(graphicKey||'');
  return REWARD_ASSET_SET.has(key)?`assets/rewards/${key}.b64.txt`:null;
}

function validPngBase64(text){
  const value=String(text||'').trim();
  return value.startsWith('iVBORw0KGgo')&&value.length>100&&/^[A-Za-z0-9+/=]+$/.test(value);
}

export async function getRewardImageUrl(graphicKey,{fetchImpl=globalThis.fetch}={}){
  const illustration=rewardIllustrationSource(graphicKey);if(illustration)return illustration;
  const source=rewardAssetSource(graphicKey);if(!source||typeof fetchImpl!=='function')return null;
  if(assetCache.has(source))return assetCache.get(source);
  const request=(async()=>{
    try{
      const response=await fetchImpl(source,{cache:'force-cache'});if(!response?.ok)return null;
      const encoded=(await response.text()).trim();if(!validPngBase64(encoded))return null;
      return `data:image/png;base64,${encoded}`;
    }catch{return null;}
  })();
  assetCache.set(source,request);return request;
}

function revealLoadedImage(image,art){
  image.hidden=false;
  art?.classList?.remove('asset-missing');
}
function revealFallback(image,art){
  image.hidden=true;
  image.removeAttribute?.('src');
  art?.classList?.add('asset-missing');
}
function applyImageUrl(image,url,art){
  if(!url){revealFallback(image,art);return Promise.resolve(false);}
  image.hidden=true;
  return new Promise(resolve=>{
    let settled=false;
    const finish=ok=>{
      if(settled)return;settled=true;
      image.onload=null;image.onerror=null;
      if(ok)revealLoadedImage(image,art);else revealFallback(image,art);
      resolve(ok);
    };
    image.onload=()=>finish(true);
    image.onerror=()=>finish(false);
    image.src=url;
    if(image.complete)queueMicrotask(()=>finish(Number(image.naturalWidth)>0));
  });
}

export async function hydrateRewardImages(root=globalThis.document){
  const images=[...(root?.querySelectorAll?.('img[data-reward-graphic]')||[])];
  await Promise.all(images.map(async image=>{
    const art=image.closest?.('.reward-cabinet-art,.reward-feature-art,.learning-reward-toast-art');
    const url=await getRewardImageUrl(image.dataset.rewardGraphic);
    await applyImageUrl(image,url,art);
  }));
  return images.length;
}
