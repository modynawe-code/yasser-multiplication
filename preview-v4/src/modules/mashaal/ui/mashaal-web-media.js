// Child-facing visual media for Mashaal. Scenario artwork is local-first so the
// KG3 experience remains image-first and works offline. Pinned web media is
// retained only as a temporary fallback for concepts that do not yet have a
// local scenario illustration.
// Local WebP scene coverage is protected by mashaal-scenario-media.test.js.
const LOCAL_BASE='assets/mashaal/choices';
const FLAG_BASE='https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.3.2/flags/4x3';
const TABLER_BASE='https://cdn.jsdelivr.net/npm/@tabler/icons@3.34.1/icons/outline';

const local=(name,altAr)=>Object.freeze({url:`${LOCAL_BASE}/${name}.webp`,altAr,source:'Mashaal scenario artwork',license:'project asset'});

const sourceIcon=(name,altAr)=>Object.freeze({url:`${TABLER_BASE}/${name}.svg`,altAr,source:'Tabler Icons 3.34.1',license:'MIT'});

export const MASHAAL_WEB_MEDIA=Object.freeze({
  'saudi-flag':Object.freeze({url:`${FLAG_BASE}/sa.svg`,altAr:'علم المملكة العربية السعودية',source:'lipis/flag-icons 7.3.2',license:'MIT'}),
  'japan-flag':Object.freeze({url:`${FLAG_BASE}/jp.svg`,altAr:'علم اليابان',source:'lipis/flag-icons 7.3.2',license:'MIT'}),
  'brazil-flag':Object.freeze({url:`${FLAG_BASE}/br.svg`,altAr:'علم البرازيل',source:'lipis/flag-icons 7.3.2',license:'MIT'}),
  doctor:local('doctor','طبيب'),teacher:local('teacher','معلمة'),baker:local('baker','خباز'),
  'return-book':local('return-book','أرجع الكتاب'),'leave-book-floor':local('leave-book-floor','أترك الكتاب على الأرض'),'damage-book':local('damage-book','أتلف الكتاب'),
  duck:local('duck-reference-unused','بطة'),apple:local('apple','تفاحة'),moon:local('moon','قمر'),
  'compare-three-apples':local('compare-three-apples','ثلاث تفاحات'),'compare-four-apples':local('compare-four-apples','أربع تفاحات'),'compare-five-apples':local('compare-five-apples','خمس تفاحات'),
  'healthy-apple':local('healthy-apple','تفاحة'),candy:local('candy','حلوى'),fries:local('fries','بطاطس مقلية'),
  'two-children-one-ball':local('wait-turn','طفلتان ولعبة واحدة'),'wait-turn':local('wait-turn','أنتظر دوري'),'grab-ball':local('grab-ball','آخذ الكرة'),'ask-help':local('ask-help','أطلب المساعدة'),
  'wet-hands':local('wet-hands','أبلل يدي'),
  'soap':local('soap','أستخدم الصابون'),
  'rub-hands':local('rub-hands','أفرك يدي'),
  'rinse-hands':local('rinse-hands','أشطف يدي'),
  'hot-surface':local('hot-surface','سطح حار'),
  'stay-away':local('stay-away','أبتعد'),
  'touch-hot':local('touch-hot','ألمس السطح الحار'),
  'play-near-hot':local('play-near-hot','ألعب قرب السطح الحار'),
  'playtime-cleanup':local('playtime-cleanup','انتهى وقت اللعب'),
  'help-tidy':local('help-tidy','أساعد في الترتيب'),
  'leave-mess':local('leave-mess','أترك المكان'),
  'scatter-toys':local('scatter-toys','أنثر الألعاب'),
  'girl-lost-toy':local('girl-lost-toy','طفلة فقدت لعبتها'),
  'happy':local('happy','فرحانة'),
  'sad':local('sad','حزينة'),
  'angry':local('angry','زعلانة'),
  'rainy-day':local('rainy-day','يوم ممطر'),
  'umbrella':local('umbrella','مظلة'),
  'sunglasses':local('sunglasses','نظارة شمسية'),
  'ball':local('ball','كرة'),
  'fallen-block-tower':local('fallen-block-tower','برج مكعبات وقع'),
  'throw-blocks':local('throw-blocks','أرمي المكعبات'),
  'kick-blocks':local('kick-blocks','أركل المكعبات'),
  'ball-above-box':local('ball-above-box','الكرة فوق الصندوق'),
  'ball-inside-box':local('ball-inside-box','الكرة داخل الصندوق'),
  'ball-below-box':local('ball-below-box','الكرة تحت الصندوق'),
  'wake':local('wake','استيقاظ'),
  'brush-teeth':local('brush-teeth','تنظيف الأسنان'),
  'breakfast':local('breakfast','فطور'),
  'walk-away-angry':local('walk-away-angry','أبتعد وأنا غاضبة'),
  'balance':local('balance','توازن'),
  'fine-motor':local('fine-motor','مهارة أصابع دقيقة'),
  'girl-drinking-water':local('girl-drinking-water','طفلة تشرب الماء'),
  hospital:sourceIcon('building-hospital','مستشفى'),school:sourceIcon('school','مدرسة'),bakery:sourceIcon('bread','مخبز'),car:sourceIcon('car','سيارة'),airplane:sourceIcon('plane','طائرة'),boat:sourceIcon('sailboat','قارب')
});

export function getMashaalWebMedia(key){return MASHAAL_WEB_MEDIA[String(key)]||null;}
