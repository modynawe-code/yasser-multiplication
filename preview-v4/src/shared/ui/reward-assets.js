import { rewardIllustrationSource } from './game-inspired-rewards.js';

const REWARD_ASSET_KEYS=Object.freeze([
  'mastery-cup','weekly-cup','accuracy-medal','mastery-shield',
  'distinction-crown','streak-flame','surprise-box','progress-badge'
]);

const DIRECT_REWARD_ASSET_KEYS=Object.freeze([
  'khaled-rocket-car','khaled-energy-ball','khaled-crystal-sword','khaled-neon-wheels','khaled-power-cube','khaled-hero-cup',
  'yasser-elite-racer','yasser-champion-ball','yasser-pro-shield','yasser-inferno-boost','yasser-challenger-badge','yasser-legend-cup',
  'shared-common-chest','shared-silver-chest','shared-gold-chest'
]);

const REWARD_ASSET_SET=new Set(REWARD_ASSET_KEYS);
const DIRECT_REWARD_ASSET_SET=new Set(DIRECT_REWARD_ASSET_KEYS);
const OVERRIDE_WEBP_BASE64=Object.freeze({'yasser-pro-shield':'assets/rewards/yasser-pro-shield-fixed.b64'});
const assetCache=new Map();

export { REWARD_ASSET_KEYS, DIRECT_REWARD_ASSET_KEYS };

export function rewardAssetSource(graphicKey){
  const key=String(graphicKey||'');
  return REWARD_ASSET_SET.has(key)?`assets/rewards/${key}.b64.txt`:null;
}

export function directRewardAssetSource(graphicKey){
  const key=String(graphicKey||'');
  return DIRECT_REWARD_ASSET_SET.has(key)?`assets/rewards/${key}.webp`:null;
}

function validPngBase64(text){
  const value=String(text||'').trim();
  return value.startsWith('iVBORw0KGgo')&&value.length>100&&/^[A-Za-z0-9+/=]+$/.test(value);
}
function validWebpBase64(text){
  const value=String(text||'').trim();
  return value.startsWith('UklGR')&&value.length>100&&/^[A-Za-z0-9+/=]+$/.test(value);
}
async function loadTextAsset(source,{fetchImpl,mime,validate}){
  if(!source||typeof fetchImpl!=='function')return null;
  if(assetCache.has(source))return assetCache.get(source);
  const request=(async()=>{
    try{
      const response=await fetchImpl(source,{cache:'force-cache'});if(!response?.ok)return null;
      const encoded=(await response.text()).trim();if(!validate(encoded))return null;
      return `data:${mime};base64,${encoded}`;
    }catch{return null;}
  })();
  assetCache.set(source,request);return request;
}

export async function getRewardImageUrl(graphicKey,{fetchImpl=globalThis.fetch}={}){
  const key=String(graphicKey||'');
  const override=OVERRIDE_WEBP_BASE64[key];
  if(override){
    const url=await loadTextAsset(override,{fetchImpl,mime:'image/webp',validate:validWebpBase64});
    if(url)return url;
  }
  const direct=directRewardAssetSource(key);if(direct)return direct;
  const illustration=rewardIllustrationSource(key);if(illustration)return illustration;
  const source=rewardAssetSource(key);
  return loadTextAsset(source,{fetchImpl,mime:'image/png',validate:validPngBase64});
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
