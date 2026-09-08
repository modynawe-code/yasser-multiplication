const OVERRIDE_KEY='family_api_base_v1';
export const FAMILY_API_PRODUCTION_BASE='https://yasser-khaled-family-api.modynawe.workers.dev';

function isNativeCapacitor(capacitor=globalThis.Capacitor){
  try{
    if(typeof capacitor?.isNativePlatform==='function'&&capacitor.isNativePlatform())return true;
    if(typeof capacitor?.getPlatform==='function'){
      const platform=String(capacitor.getPlatform()||'').toLowerCase();
      if(platform&&platform!=='web')return true;
    }
  }catch{}
  return false;
}

function mayUseStoredDevelopmentOverride(location=globalThis.location){
  // Capacitor Android serves the local WebView from https://localhost. That is
  // an app origin, not a development browser origin, so a stale localhost API
  // override must never win inside the installed app.
  if(isNativeCapacitor())return false;
  if(globalThis.__FAMILY_API_ALLOW_DEV_OVERRIDE__===true)return true;
  const protocol=String(location?.protocol||'').toLowerCase();
  const hostname=String(location?.hostname||'').toLowerCase();
  const localHost=hostname==='localhost'||hostname==='127.0.0.1'||hostname==='::1'||hostname==='[::1]';
  return localHost&&(protocol==='http:'||protocol==='https:');
}

export function getFamilyApiBase(storage=globalThis.localStorage,location=globalThis.location){
  const injected=String(globalThis.__FAMILY_API_BASE_URL__||'').trim();
  if(injected)return injected.replace(/\/$/,'');
  if(mayUseStoredDevelopmentOverride(location)){
    try{
      const override=String(storage?.getItem(OVERRIDE_KEY)||'').trim().replace(/\/$/,'');
      if(override)return override;
    }catch{}
  }
  return FAMILY_API_PRODUCTION_BASE;
}

export function setFamilyApiBaseForDevelopment(value,storage=globalThis.localStorage){
  try{const normalized=String(value||'').trim().replace(/\/$/,'');if(normalized)storage?.setItem(OVERRIDE_KEY,normalized);else storage?.removeItem(OVERRIDE_KEY);return true;}catch{return false;}
}
