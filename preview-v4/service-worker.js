Warning: truncated output (original token count: 7441)
Total output lines: 189

importScripts('./src/modules/mashaal/curriculum/recitation-media-data.js');

const CACHE_PREFIX='yasser-multiplication-v4-';
const CACHE_VERSION=`${CACHE_PREFIX}shell-215`;
const RECITATION_MEDIA=globalThis.__FAMILY_LEARNING_RECITATION_MEDIA__||[];
const RECITATION_ASSETS=RECITATION_MEDIA.map(item=>item?.localPath).filter(path=>typeof path==='string'&&path.startsWith('./assets/recitation/'));
const RECITATION_COMPANION_ASSETS=RECITATION_MEDIA.map(item=>item?.mushafPage?.imagePath).filter(path=>typeof path==='string'&&path.startsWith('./assets/recitation/'));
const MASHAAL_DOMAIN_ASSETS=[
  './assets/mashaal/domains/language.webp','./assets/mashaal/domains/thinking.webp','./assets/mashaal/domains/feelings.webp',
  './assets/mashaal/domains/health.webp','./assets/mashaal/domains/quran.webp','./assets/mashaal/domains/community.webp'
];
const MASHAAL_OPEN_ANIMAL_ASSETS=['./assets/oer/kenney/animals/duck.png','./assets/oer/kenney/animals/dog.png','./assets/oer/kenney/animals/parrot.png','./assets/oer/kenney/animals/cow.png','./assets/oer/kenney/animals/frog.png','./assets/oer/kenney/animals/owl.png','./assets/oer/kenney/animals/pig.png','./assets/oer/kenney/animals/chicken.png','./assets/oer/kenney/animals/giraffe.png','./assets/oer/kenney/animals/monkey.png','./assets/oer/kenney/animals/penguin.png','./assets/oer/kenney/animals/rabbit.png'];
const prathamPackAssets=(pack,count)=>Array.from({length:count},(_,index)=>`./assets/oer/pratham/${pack}/${String(index+1).padStart(2,'0')}.jpg`);
const MASHAAL_PRATHAM_ASSETS=[
  ...prathamPackAssets('0433',13),...prathamPackAssets('0352',19),...prathamPackAssets('0071',17),...prathamPackAssets('0056',12),...prathamPackAssets('0006',24),
  './assets/oer/pratham/0120/03.jpg','./assets/oer/pratham/0120/05.jpg','./assets/oer/pratham/0120/09.jpg'
];
const MASHAAL_ARABIC_TWEMOJI_GROUPS={
  alif:['asad','arnab','ibra'],ba:['batta','bab','batikh'],ta:['tuffaha','taj','timsah'],tha:['thalab','thawr','thalj'],
  jim:['jamal','jaras','jazara'],ha:['hisan','halib','hut'],kha:['kharuf','khubz','khawkh'],dal:['dajaja','dubb','darraja'],
  thal:['dhura','dhib','dhahab'],ra:['robot','risha','rajul'],zay:['zahra','zarafa','zalaja'],sin:['samaka','sayyara','saa'],
  shin:['shams','shajara','shamaa'],sad:['sunduq','sabun','sarukh'],dad:['difdaa','dirs','daw'],taa:['taira','tamatim','tabl'],
  zaa:['zarf','zabi','zill'],ain:['inab','ain','usfur'],ghain:['ghazal','ghayma','ghurila'],fa:['farasha','fil','filfil'],
  qaf:['qamar','qalam','qitta'],kaf:['kitab','kura','kursi'],lam:['laymun','luba','lisan'],mim:['mawz','miftah','madrasa'],
  nun:['nahla','najma','nimr'],haa:['hilal','hadiya','hatif'],waw:['warda','wajh','walad'],ya:['yad','yamama','yakht']
};
const MASHAAL_ARABIC_TWEMOJI_ASSETS=Object.entries(MASHAAL_ARABIC_TWEMOJI_GROUPS)
  .flatMap(([letter,slugs])=>slugs.map(slug=>`./assets/oer/twemoji/arabic/${letter}/${slug}.svg`));
const MASHAAL_ARABIC_LETTER_AUDIO_IDS=['alif','ba','ta','tha','jim','ha','kha','dal','thal','ra','zay','sin','shin','sad','dad','taa','zaa','ain','ghain','fa','qaf','kaf','lam','mim','nun','haa','waw','ya'];
const MASHAAL_ARABIC_LETTER_AUDIO_ASSETS=MASHAAL_ARABIC_LETTER_AUDIO_IDS
  .map(id=>`./assets/audio/mashaal/arabic-letters/${id}.mp3`);
const MASHAAL_CHOICE_ASSETS=['./assets/mashaal/choices/angry.webp','./assets/mashaal/choices/apple.webp','./assets/mashaal/choices/ask-help.webp','./assets/mashaal/choices/baker.webp','./assets/mashaal/choices/balance.webp','./assets/mashaal/choices/ball-above-box.webp','./assets/mashaal/choices/ball-below-box.webp','./assets/mashaal/choices/ball-inside-box.webp','./assets/mashaal/choices/ball.webp','./assets/mashaal/choices/brazil-flag.webp','./assets/mashaal/choices/breakfast.webp','./assets/mashaal/choices/brush-teeth.webp','./assets/mashaal/choices/candy.webp','./assets/mashaal/choices/compare-five-apples.webp','./assets/mashaal/choices/compare-four-apples.webp','./assets/mashaal/choices/compare-three-apples.webp','./assets/mashaal/choices/damage-book.webp','./assets/mashaal/choices/doctor.webp','./assets/mashaal/choices/duck-reference-unused.webp','./assets/mashaal/choices/fallen-block-tower.webp','./assets/mashaal/choices/fine-motor.webp','./assets/mashaal/choices/fries.webp','./assets/mashaal/choices/girl-drinking-water.webp','./assets/mashaal/choices/girl-lost-toy.webp','./assets/mashaal/choices/grab-ball.webp','./assets/mashaal/choices/happy.webp','./assets/mashaal/choices/healthy-apple.webp','./assets/mashaal/choices/help-tidy.webp','./assets/mashaal/choices/hot-surface.webp','./assets/mashaal/choices/japan-flag.webp','./assets/mashaal/choices/kick-blocks.webp','./assets/mashaal/choices/leave-book-floor.webp','./assets/mashaal/choices/leave-mess.webp','./assets/mashaal/choices/moon.webp','./assets/mashaal/choices/play-near-hot.webp','./assets/mashaal/choices/playtime-cleanup.webp','./assets/mashaal/choices/rainy-day.webp','./assets/mashaal/choices/return-book.webp','./assets/mashaal/choices/rinse-hands.webp','./assets/mashaal/choices/rub-hands.webp','./assets/mashaal/choices/sad.webp','./assets/mashaal/choices/saudi-flag.webp','./assets/mashaal/choices/scatter-toys.webp','./assets/mashaal/choices/soap.webp','./assets/mashaal/choices/stay-away.webp','./assets/mashaal/choices/sunglasses.webp','./assets/mashaal/choices/teacher.webp','./assets/mashaal/choices/throw-blocks.webp','./assets/mashaal/choices/touch-hot.webp','./assets/mashaal/choices/umbrella.webp','./assets/mashaal/choices/wait-turn.webp','./assets/mashaal/choices/wake.webp','./assets/mashaal/choices/walk-away-angry.webp','./assets/mashaal/choices/wet-hands.webp'];
const ORIGINAL_REWARD_ASSETS=[
  './assets/rewards/shared-emerald-cube.png','./assets/rewards/shared-neon-lockbox.png','./assets/rewards/shared-magic-book.png',
  './assets/rewards/shared-energy-cube.png','./assets/rewards/shared-angel-wings.png','./assets/rewards/shared-golden-apple.png',
  './assets/rewards/shared-crystal-bow.png','./assets/rewards/shared-ice-trident.png','./assets/rewards/shared-ice-pickaxe.png',
  './assets/rewards/shared-ice-axe.png','./assets/rewards/shared-royal-chest.png','./assets/rewards/shared-lightning-racer.png',
  './assets/rewards/shared-diamond-shield.png','./assets/rewards/shared-crystal-sword.png','./assets/rewards/shared-prism-cube.png',
  './assets/rewards/shared-rocket-racer.png','./assets/rewards/shared-gold-blue-chest.png','./assets/rewards/shared-neon-wheels.png'
];
const MASHAAL_ARABIC_COLORING_ASSETS=[
  './assets/oer/openmoji/coloring/rabbit.svg','./assets/oer/openmoji/coloring/duck.svg','./assets/oer/openmoji/coloring/crocodile.svg','./assets/oer/openmoji/coloring/fox.svg','./assets/oer/openmoji/coloring/camel.svg'
];
const APP_SHELL=[
  './src/modules/khaled/letter-forms/letter-forms.js','./src/modules/khaled/letter-forms/lesson-audio.js','./src/modules/khaled/letter-forms/letter-data.js','./src/modules/khaled/letter-forms/writing-paths.js','./src/modules/khaled/letter-forms/tracing.js','./src/modules/khaled/letter-forms/letter-forms.css','./assets/khaled/letter-forms/connection-hands.png',
  './src/modules/yasser/reviews/math-grade6.js','./src/modules/yasser/reviews/math-grade6-data.js','./src/modules/yasser/reviews/math-grade6.css',
  './src/modules/yasser/reviews/english-audio-manifest.js','./src/modules/yasser/reviews/english-review-audio.js','./src/modules/khaled/reviews/grade1-data.js','./src/modules/khaled/reviews/grade1-reviews.js','./src/modules/khaled/reviews/handwriting.js','./assets/reviews/grade1/arabic-sounds.webp','./assets/reviews/grade1/math-count-1.webp','./assets/reviews/grade1/math-count-2.webp','./assets/reviews/grade1/math-count-3.webp','./assets/reviews/grade1/math-count-4.webp','./assets/reviews/grade1/math-count-5.webp','./assets/reviews/grade1/math-count-6.webp','./src/modules/yasser/reviews/review-engine.js','./src/modules/yasser/reviews/review-runtime.js','./src/modules/yasser/reviews/grade6-reviews.js','./src/modules/yasser/reviews/digital-grade6-data.js','./src/modules/yasser/reviews/arabic-grade6-data.js','./src/modules/yasser/reviews/english-grade6-data.js','./src/modules/yasser/reviews/science-grade6-data.js','./src/modules/yasser/reviews/social-grade6-data.js','./src/modules/yasser/reviews/islamic-grade6-data.js','./assets/reviews/grade6/arabic-poem.webp','./assets/reviews/grade6/arabic-reading.webp','./assets/reviews/grade6/digital-arrow.webp','./assets/reviews/grade6/digital-bar.webp','./assets/reviews/grade6/digital-chest.webp','./assets/reviews/grade6/digital-controller.webp','./assets/reviews/grade6/digital-cube.webp','./assets/reviews/grade6/digital-cylinder.webp','./assets/reviews/grade6/digital-house.webp','./assets/reviews/grade6/digital-line.webp','./assets/reviews/grade6/digital-pie.webp','./assets/reviews/grade6/digital-viewcube.webp','./assets/reviews/grade6/digital-workplane.webp','./assets/reviews/grade6/english-animal-1.webp','./assets/reviews/grade6/english-animal-2.webp','./assets/reviews/grade6/english-animal-3.webp','./as…2941 tokens truncated…stry.js','./src/modules/mashaal/curriculum/open-learning-source-registry.js','./src/modules/mashaal/curriculum/open-learning-activity-bank.js','./src/modules/mashaal/curriculum/pratham-open-packs.js','./src/modules/mashaal/curriculum/arabic-letter-image-bank.js','./src/modules/mashaal/curriculum/arabic-letter-curriculum.js','./src/modules/mashaal/curriculum/arabic-letter-audio.js','./src/modules/mashaal/curriculum/arabic-coloring-pages.js','./src/modules/mashaal/curriculum/arabic-mini-stories.js','./src/modules/mashaal/curriculum/kg3-activity-catalog.js','./src/modules/mashaal/curriculum/recitation-media-data.js','./src/modules/mashaal/curriculum/recitation-media-manifest.js','./src/modules/mashaal/curriculum/recitation-source-registry.js',
  './src/modules/mashaal/data/domain-labels.js','./src/modules/mashaal/data/kg3-domain-order.js','./src/modules/mashaal/domain/constants.js','./src/modules/mashaal/domain/progress-model.js','./src/modules/mashaal/domain/state-model.js',
  './src/modules/mashaal/application/skill-index.js','./src/modules/mashaal/application/activity-plan.js','./src/modules/mashaal/application/daily-mission.js','./src/modules/mashaal/application/play-experiences.js','./src/modules/mashaal/application/arabic-progress.js','./src/modules/mashaal/application/activity-release-validator.js','./src/modules/mashaal/application/recitation-activity-factory.js','./src/modules/mashaal/application/recitation-release-validator.js','./src/modules/mashaal/application/digital-attempt.js','./src/modules/mashaal/application/activity-completion.js','./src/modules/mashaal/application/transfer-prompts.js','./src/modules/mashaal/application/progress-service.js','./src/modules/mashaal/application/parent-labels.js','./src/modules/mashaal/application/parent-summary.js',
  './src/modules/mashaal/infrastructure/local-storage-repository.js','./src/modules/mashaal/ui/home-copy.js','./src/modules/mashaal/ui/home-view-model.js','./src/modules/mashaal/ui/domain-view-model.js','./src/modules/mashaal/ui/activity-view-model.js','./src/modules/mashaal/ui/activity-layout.js','./src/modules/mashaal/ui/mashaal-interaction-engines.js','./src/modules/mashaal/ui/mashaal-shell.js','./src/modules/mashaal/ui/mashaal-controller.js','./src/modules/mashaal/ui/mashaal-visuals.js','./src/modules/mashaal/ui/mashaal-web-media.js','./src/modules/mashaal/ui/mashaal-asset-contracts.js','./src/modules/mashaal/ui/mashaal-guided-action-visuals.js','./src/modules/mashaal/ui/mashaal-semantic-choice-visuals.js','./src/modules/mashaal/ui/mashaal.css','./src/modules/mashaal/ui/mashaal-home.css','./src/modules/mashaal/ui/mashaal-visuals.css','./src/modules/mashaal/ui/mashaal-web-media.css','./src/modules/mashaal/ui/mashaal-activity-layout.css','./src/modules/mashaal/ui/mashaal-interaction-engines.css','./src/modules/mashaal/ui/mashaal-daily-mission.css','./src/modules/mashaal/ui/mashaal-play-library.css','./src/modules/mashaal/ui/mashaal-arabic-learning.js','./src/modules/mashaal/ui/mashaal-arabic-coloring.js','./src/modules/mashaal/ui/mashaal-arabic-learning.css','./src/modules/mashaal/quran/quran-surah-player.js','./src/modules/mashaal/quran/quran-surah-player.css',

  './src/modules/parent/family-parent-controller.js','./src/modules/parent/family-parent-report-capabilities.js','./src/modules/parent/family-parent-renderers.js','./src/modules/parent/family-parent-shell-registry.js','./src/modules/parent/family-parent.css','./src/modules/parent/family-parent-open-learners.css',

  './assets/characters/yasser-welcome.webp','./assets/assistant/assistant-welcome.webp',
  './assets/visual/yasser/welcome.b64.txt','./assets/visual/yasser/thinking.b64.txt','./assets/visual/yasser/encourage.b64.txt','./assets/visual/yasser/celebrate.b64.txt','./assets/visual/yasser/mastered.b64.txt',
  './assets/visual/assistant/idle.b64.txt','./assets/visual/assistant/thinking.b64.txt','./assets/visual/assistant/celebrate.b64.txt',
  './assets/visual/yasser-mascot-v1/yasser-welcome.webp','./assets/visual/yasser-mascot-v1/yasser-thinking.webp','./assets/visual/yasser-mascot-v1/yasser-encourage.webp','./assets/visual/yasser-mascot-v1/yasser-celebrate.webp','./assets/visual/yasser-mascot-v1/yasser-mastered.webp',
  './assets/visual/yasser-mascot-v1/assistant-idle.webp','./assets/visual/yasser-mascot-v1/assistant-thinking.webp','./assets/visual/yasser-mascot-v1/composite-thinking.webp','./assets/visual/yasser-mascot-v1/composite-correct.webp','./assets/visual/yasser-mascot-v1/composite-celebration.webp',
  './assets/rewards/mastery-cup.b64.txt','./assets/rewards/weekly-cup.b64.txt','./assets/rewards/accuracy-medal.b64.txt','./assets/rewards/mastery-shield.b64.txt','./assets/rewards/distinction-crown.b64.txt','./assets/rewards/streak-flame.b64.txt','./assets/rewards/surprise-box.b64.txt','./assets/rewards/progress-badge.b64.txt',
  ...ORIGINAL_REWARD_ASSETS,
  ...MASHAAL_DOMAIN_ASSETS,
  ...MASHAAL_CHOICE_ASSETS,
  ...MASHAAL_OPEN_ANIMAL_ASSETS,
  ...MASHAAL_PRATHAM_ASSETS,
  ...MASHAAL_ARABIC_TWEMOJI_ASSETS,
  ...MASHAAL_ARABIC_LETTER_AUDIO_ASSETS,
  ...MASHAAL_ARABIC_COLORING_ASSETS,
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
function isTajawalFontAsset(request){
  try{
    const url=new URL(request.url);
    return (url.hostname==='fonts.googleapis.com'&&request.destination==='style')||
      (url.hostname==='fonts.gstatic.com'&&request.destination==='font');
  }catch{return false;}
}
async function runtimeCacheAsset(request,cache){
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
  // Parallelize existing offline assets; obsolete optional paths must not block updates.
  const pending=[...APP_SHELL];
  const required=new Set(['./','./index.html','./src/main.js','./style.css']);
  await Promise.all(Array.from({length:8},async()=>{
    while(pending.length){
      const path=pending.shift();
      const request=new Request(absolute(path),{cache:'reload'}),response=await fetch(request);
      if(!response.ok){if(required.has(path)||response.status!==404)throw new Error(`Precache failed: ${path} ${response.status}`);continue;}
      await cache.put(request,response);
    }
  }));
  await self.skipWaiting();
})());});

self.addEventListener('activate',event=>{event.waitUntil((async()=>{
  const keys=await caches.keys(),oldKeys=keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_VERSION);
  await Promise.all(oldKeys.map(key=>caches.delete(key)));
  await self.clients.claim();
  if(oldKeys.length){
    const windows=await self.clients.matchAll({type:'window'});
    await Promise.all(windows.map(client=>client.navigate(client.url).catch(()=>null)));
  }
})());});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_VERSION);
    // Versioned same-origin static resources do not need a network round trip on every opening.
    if(new URL(event.request.url).origin===self.location.origin&&['script','style','image','font'].includes(event.request.destination)){
      const cached=await cache.match(event.request);
      if(cached)return cached;
    }
    if(isSaudiCurrencyImage(event.request)||isVerifiedQuranPageImage(event.request)||isTajawalFontAsset(event.request))return runtimeCacheAsset(event.request,cache);
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


