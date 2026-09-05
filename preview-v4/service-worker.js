const CACHE_PREFIX='yasser-multiplication-v4-';
const CACHE_VERSION=`${CACHE_PREFIX}shell-7`;
const APP_SHELL=[
  './','./index.html','./style.css','./manifest.webmanifest',
  './src/ui/styles/parent-report.css','./src/ui/styles/character-system.css',
  './src/main.js','./src/domain/constants.js','./src/domain/state-model.js','./src/domain/mastery.js','./src/domain/question-bank.js',
  './src/application/attempt-service.js','./src/application/training-engine.js','./src/application/progress-service.js',
  './src/infrastructure/storage/local-storage-repository.js','./src/platform/pwa/register-service-worker.js',
  './src/ui/dom.js','./src/ui/renderers.js','./src/ui/app-controller.js',
  './src/ui/visual/character-assets.js','./src/ui/visual/scene-manifest.js','./src/ui/visual/scene-controller.js',
  './assets/visual/yasser/welcome.b64.txt','./assets/visual/yasser/thinking.b64.txt','./assets/visual/yasser/encourage.b64.txt','./assets/visual/yasser/celebrate.b64.txt','./assets/visual/yasser/mastered.b64.txt',
  './assets/visual/assistant/idle.b64.txt','./assets/visual/assistant/thinking.b64.txt','./assets/visual/assistant/celebrate.b64.txt'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_VERSION).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(!response||response.status!==200||response.type==='opaque')return response;const copy=response.clone();caches.open(CACHE_VERSION).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>event.request.mode==='navigate'?caches.match('./index.html'):Promise.reject(new Error('offline')))));});
