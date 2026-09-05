const CACHE_PREFIX='yasser-multiplication-v4-';
const CACHE_VERSION=`${CACHE_PREFIX}shell-16`;
const APP_SHELL=[
  './','./index.html','./style.css','./manifest.webmanifest',
  './src/ui/styles/parent-report.css','./src/ui/styles/character-system.css',
  './src/main.js','./src/domain/constants.js','./src/domain/state-model.js','./src/domain/mastery.js','./src/domain/question-bank.js',
  './src/application/attempt-service.js','./src/application/training-engine.js','./src/application/progress-service.js',
  './src/infrastructure/storage/local-storage-repository.js','./src/platform/pwa/register-service-worker.js',
  './src/ui/dom.js','./src/ui/renderers.js','./src/ui/app-controller.js','./src/ui/audio/feedback-audio.js',
  './src/ui/visual/character-assets.js','./src/ui/visual/scene-manifest.js','./src/ui/visual/scene-controller.js',
  './src/shared/audio/speech-service.js','./src/shared/security/parent-access.js',
  './src/modules/hub/hub-controller.js','./src/modules/hub/learning-shell.js','./src/modules/hub/learning-hub.css',
  './src/modules/khaled/domain/curriculum.js','./src/modules/khaled/domain/question-bank.js','./src/modules/khaled/domain/state-model.js',
  './src/modules/khaled/infrastructure/storage/local-storage-repository.js','./src/modules/khaled/ui/khaled-controller.js','./src/modules/khaled/ui/khaled-scene-controller.js','./src/modules/khaled/ui/khaled-character-system.css',
  './src/modules/parent/family-parent-controller.js','./src/modules/parent/family-parent-renderers.js','./src/modules/parent/family-parent.css',
  './assets/characters/yasser-welcome.webp','./assets/assistant/assistant-welcome.webp',
  './assets/visual/yasser/welcome.b64.txt','./assets/visual/yasser/thinking.b64.txt','./assets/visual/yasser/encourage.b64.txt','./assets/visual/yasser/celebrate.b64.txt','./assets/visual/yasser/mastered.b64.txt',
  './assets/visual/assistant/idle.b64.txt','./assets/visual/assistant/thinking.b64.txt','./assets/visual/assistant/celebrate.b64.txt'
];

function absolute(path){return new URL(path,self.location.href).href;}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_VERSION);
    for(const path of APP_SHELL){
      const request=new Request(absolute(path),{cache:'reload'});
      const response=await fetch(request);
      if(!response.ok)throw new Error(`Precache failed: ${path} ${response.status}`);
      await cache.put(request,response);
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    const oldKeys=keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_VERSION);
    await Promise.all(oldKeys.map(key=>caches.delete(key)));
    await self.clients.claim();
    if(oldKeys.length){
      const windows=await self.clients.matchAll({type:'window'});
      await Promise.all(windows.map(client=>client.navigate(client.url).catch(()=>null)));
    }
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_VERSION);
    try{
      const response=await fetch(event.request,{cache:'no-store'});
      if(response&&response.status===200&&response.type!=='opaque')await cache.put(event.request,response.clone());
      return response;
    }catch{
      const cached=await cache.match(event.request)||await caches.match(event.request);
      if(cached)return cached;
      if(event.request.mode==='navigate')return cache.match(absolute('./index.html'));
      return Response.error();
    }
  })());
});
