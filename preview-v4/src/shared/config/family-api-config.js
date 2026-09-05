const OVERRIDE_KEY='family_api_base_v1';

export function getFamilyApiBase(storage=globalThis.localStorage){
  const injected=String(globalThis.__FAMILY_API_BASE_URL__||'').trim();
  if(injected)return injected.replace(/\/$/,'');
  try{return String(storage?.getItem(OVERRIDE_KEY)||'').trim().replace(/\/$/,'');}catch{return'';}
}

export function setFamilyApiBaseForDevelopment(value,storage=globalThis.localStorage){
  try{const normalized=String(value||'').trim().replace(/\/$/,'');if(normalized)storage?.setItem(OVERRIDE_KEY,normalized);else storage?.removeItem(OVERRIDE_KEY);return true;}catch{return false;}
}
