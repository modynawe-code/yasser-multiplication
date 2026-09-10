importScripts('./service-worker.js');

const EXTENSION_CACHE_PREFIX='family-learning-runtime-extensions-';
const EXTENSION_CACHE_VERSION=`${EXTENSION_CACHE_PREFIX}4`;
const EXTENSION_ASSETS=Object.freeze([
  './src/composition/game-reward-runtime.js',
  './src/modules/games/core/challenge-presentation-registry.js',
  './src/modules/games/core/game-eligibility-service.js',
  './src/modules/games/core/game-event-bus.js',
  './src/modules/games/core/game-event-contract.js',
  './src/modules/games/xo/xo-events.js',
  './src/modules/games/rps/rps-events.js',
  './src/modules/games/ui/xo-challenge-presentation.js',
  './src/modules/games/ui/xo-challenge-presentation.css',
  './src/modules/mashaal/application/game-learning-provider.js',
  './src/modules/mashaal/encouragement/mashaal-encouragement-pack.js',
  './src/modules/mashaal/rewards/mashaal-reward-catalog.js',
  './src/modules/mashaal/rewards/mashaal-reward-rules.js',
  './src/modules/mashaal/ui/mashaal-game-challenge-presenter.js',
  './src/modules/mashaal/ui/mashaal-reward-graphics.js',
  './src/modules/mashaal/ui/mashaal-reward-theme.js',
  './src/modules/mashaal/ui/mashaal-treasure-controller.js',
  './src/modules/mashaal/ui/mashaal-treasures.css',
  './src/shared/encouragement/encouragement-registry.js',
  './src/shared/rewards/event-reward-service.js',
  './src/shared/rewards/reward-catalog-registry.js',
  './src/shared/rewards/reward-rule-registry.js',
  './src/shared/ui/reward-collection-view-state.js'
]);

function extensionAbsolute(path){return new URL(path,self.location.href).href;}

self.addEventListener('install',event=>{event.waitUntil((async()=>{
  const cache=await caches.open(EXTENSION_CACHE_VERSION);
  for(const path of EXTENSION_ASSETS){
    const request=new Request(extensionAbsolute(path),{cache:'reload'});
    const response=await fetch(request);
    if(!response.ok)throw new Error(`Extension precache failed: ${path} ${response.status}`);
    await cache.put(request,response);
  }
})());});

self.addEventListener('activate',event=>{event.waitUntil((async()=>{
  const keys=await caches.keys();
  const stale=keys.filter(key=>key.startsWith(EXTENSION_CACHE_PREFIX)&&key!==EXTENSION_CACHE_VERSION);
  await Promise.all(stale.map(key=>caches.delete(key)));
})());});
