const OVERRIDE_KEY='family_api_base_v1';
export const FAMILY_API_PRODUCTION_BASE='https://yasser-khaled-family-api.modynawe.workers.dev';

export function getFamilyApiBase(storage=globalThis.localStorage){
  const injected=String(globalThis.__FAMILY_API_BASE_URL__||'').trim();
  if(injected)return injected.replace(/\/$/,'');
  try{
    const override=String(storage?.getItem(OVERRIDE_KEY)||'').trim().replace(/\/$/,'');
    if(override)return override;
  }catch{}
  return FAMILY_API_PRODUCTION_BASE;
}

export function setFamilyApiBaseForDevelopment(value,storage=globalThis.localStorage){
  try{const normalized=String(value||'').trim().replace(/\/$/,'');if(normalized)storage?.setItem(OVERRIDE_KEY,normalized);else storage?.removeItem(OVERRIDE_KEY);return true;}catch{return false;}
}
