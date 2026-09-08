// Web-sourced child-facing visuals. Full Mashaal domain illustrations remain local assets.
// These sources are pinned where practical and have permissive reuse terms.
const FLAG_BASE='https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.3.2/flags/4x3';
const TABLER_BASE='https://cdn.jsdelivr.net/npm/@tabler/icons@3.34.1/icons/outline';

export const MASHAAL_WEB_MEDIA=Object.freeze({
  'saudi-flag':Object.freeze({url:`${FLAG_BASE}/sa.svg`,altAr:'علم المملكة العربية السعودية',source:'lipis/flag-icons 7.3.2',license:'MIT'}),
  'japan-flag':Object.freeze({url:`${FLAG_BASE}/jp.svg`,altAr:'علم اليابان',source:'lipis/flag-icons 7.3.2',license:'MIT'}),
  'brazil-flag':Object.freeze({url:`${FLAG_BASE}/br.svg`,altAr:'علم البرازيل',source:'lipis/flag-icons 7.3.2',license:'MIT'}),
  doctor:Object.freeze({url:'https://upload.wikimedia.org/wikipedia/commons/3/3c/Doctor.svg',altAr:'طبيبة',source:'Wikimedia Commons / Openclipart',license:'CC0 1.0'}),
  teacher:Object.freeze({url:'https://upload.wikimedia.org/wikipedia/commons/b/be/Teacher_icon.svg',altAr:'معلمة',source:'Wikimedia Commons / Openclipart',license:'CC0 1.0'}),
  baker:Object.freeze({url:'https://upload.wikimedia.org/wikipedia/commons/4/4c/Baker.svg',altAr:'خباز',source:'Wikimedia Commons / Openclipart',license:'CC0 1.0'}),
  hospital:Object.freeze({url:`${TABLER_BASE}/building-hospital.svg`,altAr:'مستشفى',source:'Tabler Icons 3.34.1',license:'MIT'}),
  school:Object.freeze({url:`${TABLER_BASE}/school.svg`,altAr:'مدرسة',source:'Tabler Icons 3.34.1',license:'MIT'}),
  bakery:Object.freeze({url:`${TABLER_BASE}/bread.svg`,altAr:'مخبز',source:'Tabler Icons 3.34.1',license:'MIT'}),
  'wait-turn':Object.freeze({url:`${TABLER_BASE}/clock-hour-4.svg`,altAr:'أنتظر دوري',source:'Tabler Icons 3.34.1',license:'MIT'}),
  'grab-ball':Object.freeze({url:`${TABLER_BASE}/ball-football.svg`,altAr:'آخذ الكرة',source:'Tabler Icons 3.34.1',license:'MIT'}),
  'walk-away-angry':Object.freeze({url:`${TABLER_BASE}/walk.svg`,altAr:'أبتعد',source:'Tabler Icons 3.34.1',license:'MIT'}),
  'help-tidy':Object.freeze({url:`${TABLER_BASE}/box.svg`,altAr:'أساعد في الترتيب',source:'Tabler Icons 3.34.1',license:'MIT'}),
  'leave-mess':Object.freeze({url:`${TABLER_BASE}/door-exit.svg`,altAr:'أترك المكان',source:'Tabler Icons 3.34.1',license:'MIT'}),
  'scatter-toys':Object.freeze({url:`${TABLER_BASE}/blocks.svg`,altAr:'أنثر الألعاب',source:'Tabler Icons 3.34.1',license:'MIT'}),
  'return-book':Object.freeze({url:`${TABLER_BASE}/book.svg`,altAr:'أرجع الكتاب',source:'Tabler Icons 3.34.1',license:'MIT'}),
  'leave-book-floor':Object.freeze({url:`${TABLER_BASE}/book-off.svg`,altAr:'أترك الكتاب',source:'Tabler Icons 3.34.1',license:'MIT'}),
  'damage-book':Object.freeze({url:`${TABLER_BASE}/book-off.svg`,altAr:'أتلف الكتاب',source:'Tabler Icons 3.34.1',license:'MIT'}),
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
