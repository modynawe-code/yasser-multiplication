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

export async function hydrateRewardImages(root=globalThis.document){
  const images=[...(root?.querySelectorAll?.('img[data-reward-graphic]')||[])];
  await Promise.all(images.map(async image=>{
    const url=await getRewardImageUrl(image.dataset.rewardGraphic);
    const art=image.closest?.('.reward-cabinet-art,.reward-feature-art');
    if(url){image.src=url;image.hidden=false;art?.classList?.remove('asset-missing');return;}
    image.hidden=true;art?.classList?.add('asset-missing');
  }));
  return images.length;
}
