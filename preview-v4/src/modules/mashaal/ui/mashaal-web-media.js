// Child-facing visual media for Mashaal. Scenario artwork is local-first so the
// KG3 experience remains image-first and works offline. Pinned web media is
// retained only as a temporary fallback for concepts that do not yet have a
// local scenario illustration.
// Local WebP scene coverage is protected by mashaal-scenario-media.test.js.
const LOCAL_BASE='assets/mashaal/choices';
const OER_ANIMAL_BASE='assets/oer/kenney/animals';
const PRATHAM_BASE='assets/oer/pratham';
const FLAG_BASE='https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.3.2/flags/4x3';
const TABLER_BASE='https://cdn.jsdelivr.net/npm/@tabler/icons@3.34.1/icons/outline';

const local=(name,altAr)=>Object.freeze({url:`${LOCAL_BASE}/${name}.webp`,altAr,source:'Mashaal scenario artwork',license:'project asset'});

const sourceIcon=(name,altAr)=>Object.freeze({url:`${TABLER_BASE}/${name}.svg`,altAr,source:'Tabler Icons 3.34.1',license:'MIT'});
const kenneyAnimal=(name,altAr)=>Object.freeze({url:`${OER_ANIMAL_BASE}/${name}.png`,altAr,source:'Kenney Animal Pack Remastered',license:'CC0 1.0'});
const prathamImage=(pack,file,altAr,source)=>Object.freeze({url:`${PRATHAM_BASE}/${pack}/${file}.jpg`,altAr,source,license:'CC BY 4.0'});

export const MASHAAL_WEB_MEDIA=Object.freeze({
  'saudi-flag':Object.freeze({url:`${FLAG_BASE}/sa.svg`,altAr:'علم المملكة العربية السعودية',source:'lipis/flag-icons 7.3.2',license:'MIT'}),
  'japan-flag':Object.freeze({url:`${FLAG_BASE}/jp.svg`,altAr:'علم اليابان',source:'lipis/flag-icons 7.3.2',license:'MIT'}),
  'brazil-flag':Object.freeze({url:`${FLAG_BASE}/br.svg`,altAr:'علم البرازيل',source:'lipis/flag-icons 7.3.2',license:'MIT'}),
  doctor:local('doctor','طبيب'),teacher:local('teacher','معلمة'),baker:local('baker','خباز'),
  'return-book':local('return-book','أرجع الكتاب'),'leave-book-floor':local('leave-book-floor','أترك الكتاب على الأرض'),'damage-book':local('damage-book','أتلف الكتاب'),
  duck:kenneyAnimal('duck','بطة'),dog:kenneyAnimal('dog','كلب'),parrot:kenneyAnimal('parrot','ببغاء'),cow:kenneyAnimal('cow','بقرة'),frog:kenneyAnimal('frog','ضفدع'),owl:kenneyAnimal('owl','بومة'),pig:kenneyAnimal('pig','خنزير'),chicken:kenneyAnimal('chicken','دجاجة'),giraffe:kenneyAnimal('giraffe','زرافة'),monkey:kenneyAnimal('monkey','قرد'),penguin:kenneyAnimal('penguin','بطريق'),rabbit:kenneyAnimal('rabbit','أرنب'),apple:local('apple','تفاحة'),moon:local('moon','قمر'),
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
  'pratham-tree-leaves':prathamImage('0433','07','شجرة بأوراق','The Tree — Ketan Raut'),
  'pratham-tree-flowers':prathamImage('0433','08','شجرة مزهرة','The Tree — Ketan Raut'),
  'pratham-tree-fruits':prathamImage('0433','09','شجرة مثمرة','The Tree — Ketan Raut'),
  'pratham-tree-seeds':prathamImage('0433','10','بذور الشجرة','The Tree — Ketan Raut'),
  'pratham-color-blue':prathamImage('0071','02','فراشة زرقاء','Colours of Nature — Bulbul Sharma'),
  'pratham-color-yellow':prathamImage('0071','03','نحلة صفراء','Colours of Nature — Bulbul Sharma'),
  'pratham-color-orange':prathamImage('0071','06','بطة برتقالية في البركة','Colours of Nature — Bulbul Sharma'),
  'pratham-seed-walk':prathamImage('0352','03','طفلان وكلب في رحلة','Let’s Go Seed Collecting! — Archana Sreenivasan'),
  'pratham-seed-tree':prathamImage('0352','06','أطفال يستكشفون الشجرة','Let’s Go Seed Collecting! — Archana Sreenivasan'),
  'pratham-seed-fruit':prathamImage('0352','12','أطفال مع فاكهة','Let’s Go Seed Collecting! — Archana Sreenivasan'),
  'pratham-tinku-farm':prathamImage('0056','02','حيوانات المزرعة نائمة ليلًا','Goodnight, Tinku! — Sonal Goyal, Sumit Sakhuja'),
  'pratham-tinku-firefly':prathamImage('0056','05','تينكو مع اليراعة','Goodnight, Tinku! — Sonal Goyal, Sumit Sakhuja'),
  'pratham-tinku-bat':prathamImage('0056','06','تينكو مع الخفاش','Goodnight, Tinku! — Sonal Goyal, Sumit Sakhuja'),
  'pratham-tinku-fox':prathamImage('0056','07','تينكو مع الثعلب','Goodnight, Tinku! — Sonal Goyal, Sumit Sakhuja'),
  'pratham-tinku-owl':prathamImage('0056','08','تينكو مع البومة','Goodnight, Tinku! — Sonal Goyal, Sumit Sakhuja'),
  'pratham-tinku-sleep':prathamImage('0056','12','تينكو نائم ليلًا','Goodnight, Tinku! — Sonal Goyal, Sumit Sakhuja'),
  'pratham-moru-numbers':prathamImage('0006','24','أطفال يحملون بطاقات أرقام','Counting on Moru — Nina Sabnani'),
  'pratham-zoo-visit':prathamImage('0120','03','طفلة في حديقة الحيوان',"Anaya's Thumb — Ruchi Shah"),
  'pratham-zoo-monkeys':prathamImage('0120','05','قرود فوق الشجرة',"Anaya's Thumb — Ruchi Shah"),
  'pratham-zoo-family':prathamImage('0120','09','عائلة في نزهة',"Anaya's Thumb — Ruchi Shah"),
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
