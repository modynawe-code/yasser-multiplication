importScripts('./src/modules/mashaal/curriculum/recitation-media-data.js');

const CACHE_PREFIX='yasser-multiplication-v4-';
const CACHE_VERSION=`${CACHE_PREFIX}shell-219`;
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
const KHALED_LETTER_VIDEO_AUDIO_ASSETS=MASHAAL_ARABIC_LETTER_AUDIO_IDS
  .map(id=>`./assets/audio/khaled/letter-forms/video/${id}.mp3`);
const KHALED_LETTER_VIDEO_STILL_ASSETS=MASHAAL_ARABIC_LETTER_AUDIO_IDS
  .map(id=>`./assets/images/khaled/letter-forms/video/${id}.jpg`);
const KHALED_LETTER_MASCOT_ASSET='./assets/images/khaled/letter-forms/avatar-block.webp';
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
  './src/modules/khaled/letter-forms/letter-forms.js','./src/modules/khaled/letter-forms/lesson-audio.js','./src/modules/khaled/letter-forms/letter-data.js','./src/modules/khaled/letter-forms/letter-video-audio-manifest.js','./src/modules/khaled/letter-forms/writing-paths.js','./src/modules/khaled/letter-forms/tracing.js','./src/modules/khaled/letter-forms/letter-forms.css','./assets/khaled/letter-forms/connection-hands.png',...KHALED_LETTER_VIDEO_AUDIO_ASSETS,...KHALED_LETTER_VIDEO_STILL_ASSETS,KHALED_LETTER_MASCOT_ASSET,
  './src/modules/yasser/reviews/math-grade6.js','./src/modules/yasser/reviews/math-grade6-data.js','./src/modules/yasser/reviews/math-grade6.css',
  './src/modules/yasser/reviews/english-audio-manifest.js','./src/modules/yasser/reviews/english-review-audio.js','./src/modules/khaled/reviews/grade1-data.js','./src/modules/khaled/reviews/grade1-reviews.js','./src/modules/khaled/reviews/handwriting.js','./assets/reviews/grade1/arabic-sounds.webp','./assets/reviews/grade1/math-count-1.webp','./assets/reviews/grade1/math-count-2.webp','./assets/reviews/grade1/math-count-3.webp','./assets/reviews/grade1/math-count-4.webp','./assets/reviews/grade1/math-count-5.webp','./assets/reviews/grade1/math-count-6.webp','./src/modules/yasser/reviews/review-engine.js','./src/modules/yasser/reviews/review-runtime.js','./src/modules/yasser/reviews/grade6-reviews.js','./src/modules/yasser/reviews/digital-grade6-data.js','./src/modules/yasser/reviews/arabic-grade6-data.js','./src/modules/yasser/reviews/english-grade6-data.js','./src/modules/yasser/reviews/science-grade6-data.js','./src/modules/yasser/reviews/social-grade6-data.js','./src/modules/yasser/reviews/islamic-grade6-data.js','./assets/reviews/grade6/arabic-poem.webp','./assets/reviews/grade6/arabic-reading.webp','./assets/reviews/grade6/digital-arrow.webp','./assets/reviews/grade6/digital-bar.webp','./assets/reviews/grade6/digital-chest.webp','./assets/reviews/grade6/digital-controller.webp','./assets/reviews/grade6/digital-cube.webp','./assets/reviews/grade6/digital-cylinder.webp','./assets/reviews/grade6/digital-house.webp','./assets/reviews/grade6/digital-line.webp','./assets/reviews/grade6/digital-pie.webp','./assets/reviews/grade6/digital-viewcube.webp','./assets/reviews/grade6/digital-workplane.webp','./assets/reviews/grade6/english-animal-1.webp','./assets/reviews/grade6/english-animal-2.webp','./assets/reviews/grade6/english-animal-3.webp','./assets/reviews/grade6/english-animal-4.webp','./assets/reviews/grade6/english-animal-5.webp','./assets/reviews/grade6/english-balance.webp','./assets/reviews/grade6/english-welcome-1.webp','./assets/reviews/grade6/english-welcome-2.webp','./assets/reviews/grade6/english-welcome-3.webp','./assets/reviews/grade6/english-welcome-4.webp','./assets/reviews/grade6/english-welcome-5.webp','./assets/reviews/grade6/science-animal-cell.webp','./assets/reviews/grade6/science-ph