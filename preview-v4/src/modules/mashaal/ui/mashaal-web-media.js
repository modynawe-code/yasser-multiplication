// Child-facing visual media for Mashaal. Scenario artwork is local-first so the
// KG3 experience remains image-first and works offline. Pinned web media is
// retained only as a temporary fallback for concepts that do not yet have a
// local scenario illustration.
const LOCAL_BASE='assets/mashaal/choices';
const FLAG_BASE='https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.3.2/flags/4x3';
const TABLER_BASE='https://cdn.jsdelivr.net/npm/@tabler/icons@3.34.1/icons/outline';

const local=(name,altAr)=>Object.freeze({url:`${LOCAL_BASE}/${name}.webp`,altAr,source:'Mashaal scenario artwork',license:'project asset'});

export const MASHAAL_WEB_MEDIA=Object.freeze({
  // Exact flags remain source-based rather than AI-drawn.
  'saudi-flag':Object.freeze({url:`${FLAG_BASE}/sa.svg`,altAr:'علم المملكة العربية السعودية',source:'lipis/flag-icons 7.3.2',license:'MIT'}),
  'japan-flag':Object.freeze({url:`${FLAG_BASE}/jp.svg`,altAr:'علم اليابان',source:'lipis/flag-icons 7.3.2',license:'MIT'}),
  'brazil-flag':Object.freeze({url:`${FLAG_BASE}/br.svg`,altAr:'علم البرازيل',source:'lipis/flag-icons 7.3.2',license:'MIT'}),

  // Full illustrated scenario cards.
  doctor:local('doctor','طبيب'),
  teacher:local('teacher','معلمة'),
  baker:local('baker','خباز'),
  'wait-turn':local('wait-turn','أنتظر دوري'),
  'grab-ball':local('grab-ball','آخذ الكرة'),
  'ask-help':local('ask-help','أطلب المساعدة'),
  'return-book':local('return-book','أرجع الكتاب'),
  'leave-book-floor':local('leave-book-floor','أترك الكتاب على الأرض'),
  'damage-book':local('damage-book','أتلف الكتاب'),
  apple:local('apple','تفاحة'),
  moon:local('moon','قمر'),

  // Temporary source-backed fallbacks until their matching scenario cards land.
  hospital:Object.freeze({url:`${TABLER_BASE}/building-hospital.svg`,altAr:'مستشفى',source:'Tabler Icons 3.34.1',license:'MIT'}),
  school:Object.freeze({url:`${TABLER_BASE}/school.svg`,altAr:'مدرسة',source:'Tabler Icons 3.34.1',license:'MIT'}),
  bakery:Object.freeze({url:`${TABLER_BASE}/bread.svg`,altAr:'مخبز',source:'Tabler Icons 3.34.1',license:'MIT'}),
  'walk-away-angry':Object.freeze({url:`${TABLER_BASE}/walk.svg`,altAr:'أبتعد وأنا غاضبة',source:'Tabler Icons 3.34.1',license:'MIT'}),
  'help-tidy':Object.freeze({url:`${TABLER_BASE}/box.svg`,altAr:'أساعد في الترتيب',source:'Tabler Icons 3.34.1',license:'MIT'}),
  'leave-mess':Object.freeze({url:`${TABLER_BASE}/door-exit.svg`,altAr:'أترك المكان',source:'Tabler Icons 3.34.1',license:'MIT'}),
  'scatter-toys':Object.freeze({url:`${TABLER_BASE}/blocks.svg`,altAr:'أنثر الألعاب',source:'Tabler Icons 3.34.1',license:'MIT'}),
  happy:Object.freeze({url:`${TABLER_BASE}/mood-smile.svg`,altAr:'فرحانة',source:'Tabler Icons 3.34.1',license:'MIT'}),
  sad:Object.freeze({url:`${TABLER_BASE}/mood-sad.svg`,altAr:'حزينة',source:'Tabler Icons 3.34.1',license:'MIT'}),
  angry:Object.freeze({url:`${TABLER_BASE}/mood-angry.svg`,altAr:'زعلانة',source:'Tabler Icons 3.34.1',license:'MIT'}),
  'wet-hands':Object.freeze({url:`${TABLER_BASE}/droplet.svg`,altAr:'أبلل يدي',source:'Tabler Icons 3.34.1',license:'MIT'}),
  soap:Object.freeze({url:`${TABLER_BASE}/wash.svg`,altAr:'أستخدم الصابون',source:'Tabler Icons 3.34.1',license:'MIT'}),
  'rinse-hands':Object.freeze({url:`${TABLER_BASE}/droplets.svg`,altAr:'أشطف يدي',source:'Tabler Icons 3.34.1',license:'MIT'}),
  car:Object.freeze({url:`${TABLER_BASE}/car.svg`,altAr:'سيارة',source:'Tabler Icons 3.34.1',license:'MIT'}),
  airplane:Object.freeze({url:`${TABLER_BASE}/plane.svg`,altAr:'طائرة',source:'Tabler Icons 3.34.1',license:'MIT'}),
  boat:Object.freeze({url:`${TABLER_BASE}/sailboat.svg`,altAr:'قارب',source:'Tabler Icons 3.34.1',license:'MIT'})
});

export function getMashaalWebMedia(key){return MASHAAL_WEB_MEDIA[String(key)]||null;}
