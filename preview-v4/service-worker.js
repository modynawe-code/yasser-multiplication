importScripts('./src/modules/mashaal/curriculum/recitation-media-data.js');

const CACHE_PREFIX='yasser-multiplication-v4-';
const CACHE_VERSION=`${CACHE_PREFIX}shell-81`;
const RECITATION_MEDIA=globalThis.__FAMILY_LEARNING_RECITATION_MEDIA__||[];
const RECITATION_ASSETS=RECITATION_MEDIA.map(item=>item?.localPath).filter(path=>typeof path==='string'&&path.startsWith('./assets/recitation/'));
const RECITATION_COMPANION_ASSETS=RECITATION_MEDIA.map(item=>item?.mushafPage?.imagePath).filter(path=>typeof path==='string'&&path.startsWith('./assets/recitation/'));
const MASHAAL_DOMAIN_ASSETS=[
  './assets/mashaal/domains/language.webp','./assets/mashaal/domains/thinking.webp','./assets/mashaal/domains/feelings.webp',
  './assets/mashaal/domains/health.webp','./assets/mashaal/domains/quran.webp','./assets/mashaal/domains/community.webp'
];
const MASHAAL_CHOICE_ASSETS=['./assets/mashaal/choices/angry.webp','./assets/mashaal/choices/apple.webp','./assets/mashaal/choices/ask-help.webp','./assets/mashaal/choices/baker.webp','./assets/mashaal/choices/balance.webp','./assets/mashaal/choices/ball-above-box.webp','./assets/mashaal/choices/ball-below-box.webp','./assets/mashaal/choices/ball-inside-box.webp','./assets/mashaal/choices/ball.webp','./assets/mashaal/choices/brazil-flag.webp','./assets/mashaal/choices/breakfast.webp','./assets/mashaal/choices/brush-teeth.webp','./assets/mashaal/choices/candy.webp','./assets/mashaal/choices/compare-five-apples.webp','./assets/mashaal/choices/compare-four-apples.webp','./assets/mashaal/choices/compare-three-apples.webp','./assets/mashaal/choices/damage-book.webp','./assets/mashaal/choices/doctor.webp','./assets/mashaal/choices/duck-reference-unused.webp','./assets/mashaal/choices/fallen-block-tower.webp','./assets/mashaal/choices/fine-motor.webp','./assets/mashaal/choices/fries.webp','./assets/mashaal/choices/girl-drinking-water.webp','./assets/mashaal/choices/girl-lost-toy.webp','./assets/mashaal/choices/grab-ball.webp','./assets/mashaal/choices/happy.webp','./assets/mashaal/choices/healthy-apple.webp','./assets/mashaal/choices/help-tidy.webp','./assets/mashaal/choices/hot-surface.webp','./assets/mashaal/choices/japan-flag.webp','./assets/mashaal/choices/kick-blocks.webp','./assets/mashaal/choices/leave-book-floor.webp','./assets/mashaal/choices/leave-mess.webp','./assets/mashaal/choices/moon.webp','./assets/mashaal/choices/play-near-hot.webp','./assets/mashaal/choices/playtime-cleanup.webp','./assets/mashaal/choices/rainy-day.webp','./assets/mashaal/choices/return-book.webp','./assets/mashaal/choices/rinse-hands.webp','./assets/mashaal/choices/rub-hands.webp','./assets/mashaal/choices/sad.webp','./assets/mashaal/choices/saudi-flag.webp','./assets/mashaal/choices/scatter-toys.webp','./assets/mashaal/choices/soap.webp','./assets/mashaal/choices/stay-away.webp','./assets/mashaal/choices/sunglasses.webp','./assets/mashaal/choices/teacher.webp','./assets/mashaal/choices/throw-blocks.webp','./assets/mashaal/choices/touch-hot.webp','./assets/mashaal/choices/umbrella.webp','./assets/mashaal/choices/wait-turn.webp','./assets/mashaal/choices/wake.webp','./assets/mashaal/choices/walk-away-angry.webp','./assets/mashaal/choices/wet-hands.webp'];
const APP_SHELL=[
  './','./index.html','./style.css','./manifest.webmanifest',
  './src/ui/styles/parent-report.css','./src/ui/styles/character-scale.css','./src/ui/styles/character-system.css','./src/ui/styles/learning-navigation.css',
  './src/main.js','./src/domain/constants.js','./src/domain/state-model.js','./src/domain/mastery.js','./src/domain/question-bank.js',
  './src/application/attempt-service.js','./src/application/training-engine.js','./src/application/progress-service.js',
  './src/infrastructure/storage/local-storage-repository.js','./src/platform/pwa/register-service-worker.js',
  './src/ui/dom.js','./src/ui/renderers.js','./src/ui/app-controller.js','./src/ui/audio/feedback-audio.js',
  './src/ui/visual/character-assets.js','./src/ui/visual/scene-manifest.js','./src/ui/visual/scene-controller.js',

  './src/shared/audio/human-voice-assets.js','./src/shared/audio/human-voice-policy.js','./src/shared/audio/natural-voice-profile.js','./src/shared/audio/voice-manifest.js','./src/shared/audio/voice-service.js','./src/shared/audio/providers/local-audio-provider.js','./src/shared/audio/providers/cloud-tts-provider.js','./src/shared/audio/providers/native-tts-provider.js','./src/shared/audio/providers/browser-tts-provider.js','./src/shared/audio/speech-service.js',
  './src/shared/backup/local-backup-service.js','./src/shared/security/parent-access.js','./src/shared/data/attempt-ledger.js',
  './src/shared/progress/learning-metrics.js','./src/shared/progress/learning-trends.js','./src/shared/progress/developmental-status.js','./src/shared/progress/evidence-types.js','./src/shared/progress/evidence.js',
  './src/shared/activities/activity-types.js','./src/shared/activities/activity-contract.js','./src/shared/activities/activity-result.js',
  './src/shared/learners/learner-id.js','./src/shared/learners/learner-profile.js','./src/shared/learners/learner-registry.js','./src/shared/learners/runtime-registry.js',
  './src/shared/curricula/curriculum-id.js','./src/shared/curricula/curriculum-profile.js','./src/shared/curricula/curriculum-registry.js','./src/shared/curricula/runtime-registry.js',
  './src/shared/family/family-config.js','./src/shared/family/expansion-invariant.js','./src/shared/family/version.js',
  './src/shared/challenges/challenge-engine.js','./src/shared/rewards/reward-catalog.js','./src/shared/rewards/reward-engine.js','./src/shared/rewards/reward-repository.js','./src/shared/rewards/learning-reward-service.js','./src/shared/rewards/reward-capability-registry.js',
  './src/shared/ui/learning-motivation.js','./src/shared/ui/learning-motivation.css','./src/shared/ui/reward-assets.js','./src/shared/ui/reward-cabinet.js','./src/shared/ui/reward-cabinet.css','./src/shared/ui/system-insets.js',
  './src/shared/config/family-api-config.js','./src/shared/sync/family-auth-client.js','./src/shared/sync/family-sync-capability-registry.js','./src/shared/sync/family-sync-service.js','./src/shared/sync/session-sync.js',

  './src/modules/hub/hub-controller.js','./src/modules/hub/learner-runtime-registry.js','./src/modules/hub/learner-hub-registry.js','./src/modules/hub/learning-shell.js','./src/modules/hub/learning-hub.css','./src/modules/hub/open-family-learner-grid.css',
  './src/modules/yasser/ui/yasser-home-shell.js','./src/modules/yasser/ui/yasser-home.css',

  './src/modules/games/core/game-contract.js','./src/modules/games/core/game-registry.js','./src/modules/games/core/player-context.js','./src/modules/games/core/game-participant-registry.js','./src/modules/games/core/learning-adapter.js','./src/modules/games/game-catalog.js','./src/modules/games/games-controller.js','./src/modules/games/learning/game-learning-providers.js','./src/modules/games/online/game-room-client.js','./src/modules/games/online/game-room-resume-store.js','./src/modules/games/xo/xo-engine.js','./src/modules/games/xo/xo-online-session.js','./src/modules/games/rps/rps-engine.js','./src/modules/games/rps/rps-graphics.js','./src/modules/games/rps/rps-audio.js','./src/modules/games/rps/rps-controller.js','./src/modules/games/rps/rps-shell.js','./src/modules/games/rps/rps.css','./src/modules/games/rps/rps-open-family.css','./src/modules/games/ui/games-shell.js','./src/modules/games/ui/games.css','./src/modules/games/ui/games-open-family.css',

  './src/modules/khaled/domain/curriculum.js','./src/modules/khaled/domain/question-bank.js','./src/modules/khaled/domain/advanced-question-bank.js','./src/modules/khaled/domain/addition-question-bank.js','./src/modules/khaled/domain/subtraction-question-bank.js','./src/modules/khaled/domain/add-sub-strategies-question-bank.js','./src/modules/khaled/domain/place-value-question-bank.js','./src/modules/khaled/domain/measurement-question-bank.js','./src/modules/khaled/domain/number-patterns-question-bank.js','./src/modules/khaled/domain/geometry-fractions-question-bank.js','./src/modules/khaled/domain/money-question-bank.js','./src/modules/khaled/domain/state-model.js',
  './src/modules/khaled/infrastructure/storage/local-storage-repository.js','./src/modules/khaled/ui/khaled-home-shell.js','./src/modules/khaled/ui/khaled-controller.js','./src/modules/khaled/ui/khaled-scene-controller.js','./src/modules/khaled/ui/khaled-character-system.css','./src/modules/khaled/ui/khaled-home.css','./src/modules/khaled/ui/khaled-device-hardening.css','./src/modules/khaled/ui/khaled-activity-types.css','./src/modules/khaled/ui/khaled-number-relations.css','./src/modules/khaled/ui/khaled-addition-renderer.js','./src/modules/khaled/ui/khaled-addition.css','./src/modules/khaled/ui/khaled-subtraction-renderer.js','./src/modules/khaled/ui/khaled-subtraction.css','./src/modules/khaled/ui/khaled-strategies-renderer.js','./src/modules/khaled/ui/khaled-strategies.css','./src/modules/khaled/ui/khaled-place-value-renderer.js','./src/modules/khaled/ui/khaled-place-value.css','./src/modules/khaled/ui/khaled-advanced-renderer.js','./src/modules/khaled/ui/khaled-measurement-renderer.js','./src/modules/khaled/ui/khaled-measurement.css','./src/modules/khaled/ui/khaled-number-patterns-renderer.js','./src/modules/khaled/ui/khaled-number-patterns.css','./src/modules/khaled/ui/khaled-geometry-fractions-renderer.js','./src/modules/khaled/ui/khaled-geometry-fractions.css','./src/modules/khaled/ui/khaled-money-renderer.js','./src/modules/khaled/ui/saudi-money-assets.js','./src/modules/khaled/ui/khaled-money.css',

  './src/modules/mashaal/curriculum/kg3-curriculum.js','./src/modules/mashaal/curriculum/kg3-skill-map.js','./src/modules/mashaal/curriculum/kg3-skill-provenance.js','./src/modules/mashaal/curriculum/source-registry.js','./src/modules/mashaal/curriculum/kg3-activity-catalog.js','./src/modules/mashaal/curriculum/recitation-media-data.js','./src/modules/mashaal/curriculum/recitation-media-manifest.js','./src/modules/mashaal/curriculum/recitation-source-registry.js',
  './src/modules/mashaal/data/domain-labels.js','./src/modules/mashaal/data/kg3-domain-order.js','./src/modules/mashaal/domain/constants.js','./src/modules/mashaal/domain/progress-model.js','./src/modules/mashaal/domain/state-model.js',
  './src/modules/mashaal/application/skill-index.js','./src/modules/mashaal/application/activity-plan.js','./src/modules/mashaal/application/activity-release-validator.js','./src/modules/mashaal/application/recitation-activity-factory.js','./src/modules/mashaal/application/recitation-release-validator.js','./src/modules/mashaal/application/digital-attempt.js','./src/modules/mashaal/application/activity-completion.js','./src/modules/mashaal/application/transfer-prompts.js','./src/modules/mashaal/application/progress-service.js','./src/modules/mashaal/application/parent-labels.js','./src/modules/mashaal/application/parent-summary.js',
  './src/modules/mashaal/infrastructure/local-storage-repository.js','./src/modules/mashaal/ui/home-copy.js','./src/modules/mashaal/ui/home-view-model.js','./src/modules/mashaal/ui/domain-view-model.js','./src/modules/mashaal/ui/activity-view-model.js','./src/modules/mashaal/ui/activity-layout.js','./src/modules/mashaal/ui/mashaal-shell.js','./src/modules/mashaal/ui/mashaal-controller.js','./src/modules/mashaal/ui/mashaal-visuals.js','./src/modules/mashaal/ui/mashaal-web-media.js','./src/modules/mashaal/ui/mashaal.css','./src/modules/mashaal/ui/mashaal-home.css','./src/modules/mashaal/ui/mashaal-visuals.css','./src/modules/mashaal/ui/mashaal-web-media.css','./src/modules/mashaal/ui/mashaal-activity-layout.css','./src/modules/mashaal/quran/quran-surah-player.js','./src/modules/mashaal/quran/quran-surah-player.css',

  './src/modules/parent/family-parent-controller.js','./src/modules/parent/family-parent-report-capabilities.js','./src/modules/parent/family-parent-renderers.js','./src/modules/parent/family-parent-shell-registry.js','./src/modules/parent/family-parent.css','./src/modules/parent/family-parent-open-learners.css',

  './assets/characters/yasser-welcome.webp','./assets/assistant/assistant-welcome.webp',
  './assets/visual/yasser/welcome.b64.txt','./assets/visual/yasser/thinking.b64.txt','./assets/visual/yasser/encourage.b64.txt','./assets/visual/yasser/celebrate.b64.txt','./assets/visual/yasser/mastered.b64.txt',
  './assets/visual/assistant/idle.b64.txt','./assets/visual/assistant/thinking.b64.txt','./assets/visual/assistant/celebrate.b64.txt',
  './assets/rewards/mastery-cup.b64.txt','./assets/rewards/weekly-cup.b64.txt','./assets/rewards/accuracy-medal.b64.txt','./assets/rewards/mastery-shield.b64.txt','./assets/rewards/distinction-crown.b64.txt','./assets/rewards/streak-flame.b64.txt','./assets/rewards/surprise-box.b64.txt','./assets/rewards/progress-badge.b64.txt',
  ...MASHAAL_DOMAIN_ASSETS,
  ...MASHAAL_CHOICE_ASSETS,
  ...RECITATION_ASSETS,
  ...RECITATION_COMPANION_ASSETS
];

function absolute(path){return new URL(path,self.location.href).href;}
function isSaudiCurrencyImage(request){
  if(request.destination!=='image')return false;
  try{
    const url=new URL(request.url);
    return url.hostname==='www.sama.gov.sa'&&url.pathname.includes('/Currency/PublishingImages/');
  }catch{return false;}
}
function isVerifiedQuranPageImage(request){
  if(request.destination!=='image')return false;
  try{
    const url=new URL(request.url);
    const rawPinned=url.hostname==='raw.githubusercontent.com'&&/^\/quranpedia\/quran-svg\/[a-f0-9]{40}\/mushafs\/hafs\/kfqc\/svg\/\d+\.svg$/i.test(url.pathname);
    const jsdelivrPinned=url.hostname==='cdn.jsdelivr.net'&&/^\/gh\/quranpedia\/quran-svg@[a-f0-9]{40}\/mushafs\/hafs\/kfqc\/svg\/\d+\.svg$/i.test(url.pathname);
    return rawPinned||jsdelivrPinned;
  }catch{return false;}
}
async function runtimeCacheImage(request,cache){
  const cached=await cache.match(request)||await caches.match(request);
  if(cached)return cached;
  try{
    const response=await fetch(request);
    if(response&&(response.ok||response.type==='opaque'))await cache.put(request,response.clone());
    return response;
  }catch{return Response.error();}
}

self.addEventListener('install',event=>{event.waitUntil((async()=>{
  const cache=await caches.open(CACHE_VERSION);
  for(const path of APP_SHELL){
    const request=new Request(absolute(path),{cache:'reload'}),response=await fetch(request);
    if(!response.ok)throw new Error(`Precache failed: ${path} ${response.status}`);
    await cache.put(request,response);
  }
  await self.skipWaiting();
})());});

self.addEventListener('activate',event=>{event.waitUntil((async()=>{
  const keys=await caches.keys(),oldKeys=keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_VERSION);
  await Promise.all(oldKeys.map(key=>caches.delete(key)));
  await self.clients.claim();
  if(oldKeys.length){
    const windows=await self.clients.matchAll({type:'window'});
    await Promise.all(windows.map(client=>client.navigate(client.url).catch(()=>null));
  }
})());});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_VERSION);
    if(isSaudiCurrencyImage(event.request)||isVerifiedQuranPageImage(event.request))return runtimeCacheImage(event.request,cache);
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