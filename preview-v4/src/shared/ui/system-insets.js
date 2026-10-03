const ANDROID_LARGE_SCREEN_BOTTOM_FLOOR_PX=56;

export function detectRuntimePlatform(capacitor=globalThis.Capacitor){
  try{
    if(typeof capacitor?.getPlatform==='function'){
      const platform=String(capacitor.getPlatform()||'web').toLowerCase();
      const native=typeof capacitor?.isNativePlatform==='function'?Boolean(capacitor.isNativePlatform()):platform!=='web';
      return Object.freeze({native,platform});
    }
    if(typeof capacitor?.isNativePlatform==='function'&&capacitor.isNativePlatform())return Object.freeze({native:true,platform:'native'});
  }catch{}
  return Object.freeze({native:false,platform:'web'});
}

function visibleBottomOcclusion(view=globalThis){
  const viewport=view.visualViewport;
  if(!viewport||!Number.isFinite(view.innerHeight))return 0;
  const viewportBottom=Number(viewport.offsetTop||0)+Number(viewport.height||0);
  return Math.max(0,Math.ceil(view.innerHeight-viewportBottom));
}

export function systemBottomInsetPx(view=globalThis,capacitor=globalThis.Capacitor){
  const runtime=detectRuntimePlatform(capacitor);
  const visualOcclusion=visibleBottomOcclusion(view);
  const nativeFloor=runtime.native&&runtime.platform==='android'?ANDROID_LARGE_SCREEN_BOTTOM_FLOOR_PX:0;
  return Math.max(nativeFloor,visualOcclusion);
}

export function applySystemInsets(element,{view=globalThis,capacitor=globalThis.Capacitor}={}){
  if(!element?.style)return ()=>{};
  const runtime=detectRuntimePlatform(capacitor);
  element.dataset.runtimePlatform=runtime.platform;
  element.dataset.nativeRuntime=runtime.native?'true':'false';

  const update=()=>element.style.setProperty('--app-system-safe-bottom',`${systemBottomInsetPx(view,capacitor)}px`);
  update();

  const viewport=view.visualViewport;
  view.addEventListener?.('resize',update,{passive:true});
  viewport?.addEventListener?.('resize',update,{passive:true});
  viewport?.addEventListener?.('scroll',update,{passive:true});

  return ()=>{
    view.removeEventListener?.('resize',update);
    viewport?.removeEventListener?.('resize',update);
    viewport?.removeEventListener?.('scroll',update);
  };
}
