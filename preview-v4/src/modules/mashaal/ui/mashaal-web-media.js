// Child-facing visual media for Mashaal. Scenario artwork is local-first so the
// KG3 experience remains image-first and works offline. Pinned web media is
// retained only as a temporary fallback for concepts that do not yet have a
// local scenario illustration.
const LOCAL_BASE='assets/mashaal/choices';
const FLAG_BASE='https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.3.2/flags/4x3';
const TABLER_BASE='https://cdn.jsdelivr.net/npm/@tabler/icons@3.34.1/icons/outline';

const local=(name,altAr)=>Object.freeze({url:`${LOCAL_BASE}/${name}.webp`,altAr,source:'Mashaal scenario artwork',license:'project asset'});

const COLORS=Object.freeze({
  ink:'#26334a',skin:'#f3bd8f',hair:'#352823',shirt:'#7c5ce7',white:'#fff',blue:'#65b7ec',water:'#55b8ef',green:'#74c98c',yellow:'#ffd76a',red:'#ee6a66',orange:'#f2a85b',pink:'#f5b8ce',purple:'#ae8ce7',floor:'#f2e7da'
});

const svgData=(body,bg='#f7f1ff')=>`data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280"><rect width="400" height="280" rx="28" fill="${bg}"/><path d="M0 222h400v58H0z" fill="${COLORS.floor}"/>${body}</svg>`)}`;

const girl=(x=84,y=82,{mood='happy',pose='down'}={})=>{
  const mouth=mood==='happy'?'<path d="M47 46q10 12 20 0" fill="none" stroke="#8d4e47" stroke-width="4" stroke-linecap="round"/>':mood==='sad'?'<path d="M47 55q10-10 20 0" fill="none" stroke="#8d4e47" stroke-width="4" stroke-linecap="round"/>':'<path d="M47 53l20-5" fill="none" stroke="#8d4e47" stroke-width="4" stroke-linecap="round"/>';
  const brows=mood==='angry'?'<path d="M43 35l9 4M72 35l-9 4" stroke="#51322d" stroke-width="4" stroke-linecap="round"/>':'';
  const arms=pose==='reach'?'<path d="M35 91L8 108M79 91l26 12" stroke="#f3bd8f" stroke-width="11" stroke-linecap="round"/>':pose==='cross'?'<path d="M35 92l45 27M78 92l-42 27" stroke="#f3bd8f" stroke-width="11" stroke-linecap="round"/>':'<path d="M35 91L20 124M79 91l15 33" stroke="#f3bd8f" stroke-width="11" stroke-linecap="round"/>';
  return `<g transform="translate(${x} ${y})"><circle cx="57" cy="43" r="34" fill="${COLORS.skin}"/><path d="M28 43Q30 4 62 8q31 2 29 42-10-14-22-18-18 13-41 11z" fill="${COLORS.hair}"/><circle cx="46" cy="39" r="3.5" fill="${COLORS.ink}"/><circle cx="69" cy="39" r="3.5" fill="${COLORS.ink}"/>${brows}${mouth}<rect x="31" y="74" width="53" height="69" rx="20" fill="${COLORS.shirt}"/><path d="M43 143l-7 48M72 143l8 48" stroke="${COLORS.ink}" stroke-width="15" stroke-linecap="round"/><path d="M24 194h26M69 194h26" stroke="#fff" stroke-width="11" stroke-linecap="round"/>${arms}</g>`;
};
const hand=(x,y,scale=1,flip=false)=>`<g transform="translate(${x} ${y}) scale(${flip?-scale:scale} ${scale})"><rect x="0" y="18" width="62" height="29" rx="14" fill="${COLORS.skin}"/><rect x="47" y="5" width="19" height="22" rx="9" fill="${COLORS.skin}"/><path d="M9 16V4M22 16V1M35 16V3" stroke="${COLORS.skin}" stroke-width="10" stroke-linecap="round"/></g>`;
const faucet=(x=235,y=72)=>`<g transform="translate(${x} ${y})"><rect width="92" height="18" rx="9" fill="#8a99aa"/><rect x="69" y="12" width="23" height="57" rx="10" fill="#8a99aa"/><rect x="-18" y="-12" width="50" height="13" rx="7" fill="#8a99aa"/><circle cx="7" cy="-6" r="12" fill="#b8c3cf"/></g>`;
const sink=(x=210,y=155)=>`<g transform="translate(${x} ${y})"><path d="M0 0h135q-8 50-67 50T0 0z" fill="#dbe8f1" stroke="#92a5b3" stroke-width="5"/><path d="M60 48v60" stroke="#92a5b3" stroke-width="13"/></g>`;
const bubble=(x,y,r=10)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" fill-opacity=".75" stroke="#9bd9f4" stroke-width="3"/>`;
const block=(x,y,c=COLORS.yellow,s=34)=>`<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="7" fill="${c}" stroke="#fff" stroke-width="4"/>`;
const ballArt=(x,y,r=28)=>`<g><circle cx="${x}" cy="${y}" r="${r}" fill="${COLORS.orange}" stroke="#fff" stroke-width="5"/><path d="M${x-r+6} ${y}q${r} -18 ${2*r-12} 0M${x} ${y-r+5}q-14 ${r} 0 ${2*r-10}" fill="none" stroke="#fff" stroke-width="4"/></g>`;
const hotSurface=(x=235,y=118)=>`<g transform="translate(${x} ${y})"><rect y="20" width="118" height="82" rx="15" fill="#657184"/><circle cx="36" cy="53" r="23" fill="#c84d4d"/><circle cx="84" cy="53" r="23" fill="#ef8d62"/><path d="M28 2q8-18 16 0M67 2q8-18 16 0M95 2q8-18 16 0" fill="none" stroke="${COLORS.red}" stroke-width="5" stroke-linecap="round"/></g>`;
const toyBox=(x=230,y=153)=>`<g transform="translate(${x} ${y})"><path d="M0 20h120l-10 75H10z" fill="${COLORS.blue}" stroke="#fff" stroke-width="5"/><path d="M-8 18h136" stroke="${COLORS.ink}" stroke-width="10" stroke-linecap="round"/><circle cx="60" cy="55" r="16" fill="${COLORS.yellow}"/></g>`;
const bed=(x=185,y=142)=>`<g transform="translate(${x} ${y})"><rect y="23" width="160" height="72" rx="18" fill="#79a7dd"/><rect x="13" y="35" width="55" height="28" rx="14" fill="#fff"/><path d="M7 92v30M151 92v30" stroke="${COLORS.ink}" stroke-width="9"/><path d="M74 23v72" stroke="#5b86bc" stroke-width="4"/></g>`;

const sceneBodies=Object.freeze({
  'wet-hands':()=>`${faucet()}${sink()}${hand(205,115,.8)}${hand(304,118,.75,true)}<path d="M304 136v34M323 136v34M342 136v34" stroke="${COLORS.water}" stroke-width="7" stroke-linecap="round"/>`,
  soap:()=>`${sink(205,167)}${hand(215,122,.82)}${hand(310,126,.72,true)}<g transform="translate(300 55)"><rect width="58" height="74" rx="13" fill="${COLORS.green}"/><rect x="17" y="-20" width="24" height="24" rx="7" fill="#8a99aa"/><path d="M28-18h45" stroke="#8a99aa" stroke-width="8" stroke-linecap="round"/></g>${bubble(270,116,9)}${bubble(292,105,7)}${bubble(314,113,11)}`,
  'rub-hands':()=>`${hand(140,111,1.15)}${hand(302,105,1.05,true)}${bubble(175,101,13)}${bubble(207,91,9)}${bubble(235,106,15)}${bubble(265,93,8)}${bubble(290,112,11)}<path d="M188 157q37 23 78 0" fill="none" stroke="${COLORS.blue}" stroke-width="5" stroke-dasharray="8 8"/>`,
  'rinse-hands':()=>`${faucet(210,61)}${sink(190,166)}${hand(206,120,.85)}${hand(305,125,.72,true)}<path d="M280 124v44M297 124v44M314 124v44" stroke="${COLORS.water}" stroke-width="8" stroke-linecap="round"/>${bubble(253,147,7)}${bubble(329,151,8)}`,
  'hot-surface':()=>`${girl(34,71,{mood:'neutral'})}${hotSurface()}<path d="M183 103v108" stroke="${COLORS.red}" stroke-width="6" stroke-dasharray="10 9"/>`,
  'stay-away':()=>`${girl(34,71,{mood:'neutral'})}${hotSurface()}<path d="M176 72v142" stroke="${COLORS.green}" stroke-width="7" stroke-dasharray="12 8"/><path d="M163 90l-22 18 22 18" fill="none" stroke="${COLORS.green}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  'touch-hot':()=>`${hotSurface(222,118)}${hand(155,128,.9)}<path d="M191 137h37" stroke="${COLORS.red}" stroke-width="7" stroke-linecap="round"/><path d="M184 104l12 11M184 171l12-11" stroke="${COLORS.red}" stroke-width="6" stroke-linecap="round"/>`,
  'play-near-hot':()=>`${girl(32,72,{mood:'happy'})}${ballArt(194,196,26)}${hotSurface(238,118)}<path d="M212 70v145" stroke="${COLORS.red}" stroke-width="6" stroke-dasharray="10 8"/>`,
  'playtime-cleanup':()=>`${girl(35,72,{pose:'reach'})}${toyBox()}${block(174,189,COLORS.red)}${block(205,206,COLORS.yellow)}${block(149,215,COLORS.green)}`,
  'help-tidy':()=>`${girl(35,71,{pose:'reach'})}${toyBox(240,152)}${block(188,146,COLORS.red)}<path d="M196 174q30 2 57 20" fill="none" stroke="${COLORS.green}" stroke-width="7" stroke-linecap="round"/>`,
  'leave-mess':()=>`${girl(35,72,{mood:'neutral'})}${block(187,199,COLORS.red)}${block(239,213,COLORS.yellow)}${block(291,193,COLORS.green)}<path d="M160 91h42m-16-16 18 16-18 16" fill="none" stroke="${COLORS.orange}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
  'scatter-toys':()=>`${girl(31,72,{pose:'reach'})}<g transform="translate(240 120) rotate(18)">${toyBox(0,0)}</g>${block(190,199,COLORS.red)}${block(273,205,COLORS.yellow)}${block(328,181,COLORS.green)}<path d="M248 134q55 12 92 49" fill="none" stroke="${COLORS.red}" stroke-width="6" stroke-dasharray="9 8"/>`,
  'girl-lost-toy':()=>`${girl(46,66,{mood:'sad'})}${ballArt(278,202,27)}<path d="M248 158q30-36 60 0" fill="none" stroke="${COLORS.blue}" stroke-width="6" stroke-dasharray="8 8"/>`,
  happy:()=>`${girl(120,54,{mood:'happy'})}<circle cx="318" cy="64" r="30" fill="${COLORS.yellow}"/><path d="M318 18v-14M318 124v-14M272 64h-14M378 64h-14" stroke="${COLORS.orange}" stroke-width="7" stroke-linecap="round"/>`,
  sad:()=>`${girl(120,54,{mood:'sad'})}${ballArt(305,202,24)}<path d="M306 104q-12 18 0 29q12-11 0-29z" fill="${COLORS.water}"/>`,
  angry:()=>`${girl(120,54,{mood:'angry',pose:'cross'})}<path d="M288 64l18-20M305 82l27-5M278 94l18 19" stroke="${COLORS.red}" stroke-width="8" stroke-linecap="round"/>`,
  'rainy-day':()=>`${girl(53,72,{mood:'neutral'})}<path d="M129 77q66-79 134 0z" fill="${COLORS.purple}" stroke="#fff" stroke-width="5"/><path d="M196 76v113q0 20 21 20" fill="none" stroke="${COLORS.ink}" stroke-width="6" stroke-linecap="round"/><path d="M286 45l-10 25M324 56l-10 25M350 91l-10 25M282 110l-10 25M329 130l-10 25" stroke="${COLORS.water}" stroke-width="7" stroke-linecap="round"/>`,
  umbrella:()=>`<path d="M78 106q78-96 156 0z" fill="${COLORS.purple}" stroke="#fff" stroke-width="6"/><path d="M156 105v115q0 22 22 22" fill="none" stroke="${COLORS.ink}" stroke-width="8" stroke-linecap="round"/>${girl(246,68,{mood:'happy'})}`,
  sunglasses:()=>`${girl(116,52,{mood:'happy'})}<path d="M150 92h23M183 92h23" stroke="${COLORS.ink}" stroke-width="12" stroke-linecap="round"/><path d="M173 91h10" stroke="${COLORS.ink}" stroke-width="5"/><path d="M292 42l-10 25M330 55l-10 25M355 89l-10 25" stroke="${COLORS.water}" stroke-width="7" stroke-linecap="round"/>`,
  ball:()=>`${ballArt(200,142,72)}<path d="M73 216q127-38 254 0" fill="none" stroke="${COLORS.green}" stroke-width="10" stroke-linecap="round"/>`,
  'fallen-block-tower':()=>`${girl(44,72,{mood:'sad'})}${block(209,198,COLORS.red,40)}${block(257,181,COLORS.yellow,40)}${block(305,207,COLORS.green,40)}${block(273,130,COLORS.blue,40)}<path d="M201 91q66 28 131 2" fill="none" stroke="${COLORS.red}" stroke-width="6" stroke-dasharray="10 8"/>`,
  'throw-blocks':()=>`${girl(42,72,{mood:'angry',pose:'reach'})}${block(250,85,COLORS.red,42)}${block(315,139,COLORS.yellow,38)}<path d="M183 118q56-59 123-20" fill="none" stroke="${COLORS.red}" stroke-width="7" stroke-linecap="round"/><path d="M290 85l18 13-20 10" fill="none" stroke="${COLORS.red}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
  'kick-blocks':()=>`${girl(41,72,{mood:'angry'})}${block(273,195,COLORS.red,44)}<path d="M161 217q51 4 94-3" fill="none" stroke="${COLORS.red}" stroke-width="8" stroke-linecap="round"/><path d="M238 202l20 12-20 12" fill="none" stroke="${COLORS.red}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  'ball-above-box':()=>`${ballArt(200,74,40)}<rect x="125" y="152" width="150" height="86" rx="16" fill="${COLORS.blue}" stroke="#fff" stroke-width="7"/><path d="M200 126v-22" stroke="${COLORS.green}" stroke-width="7" stroke-linecap="round"/><path d="M188 116l12-13 12 13" fill="none" stroke="${COLORS.green}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
  'ball-inside-box':()=>`<rect x="118" y="116" width="164" height="122" rx="16" fill="${COLORS.blue}" stroke="#fff" stroke-width="7"/><path d="M122 116h156" stroke="${COLORS.ink}" stroke-width="8"/><g transform="translate(0 45)">${ballArt(200,128,37)}</g>`,
  'ball-below-box':()=>`<rect x="125" y="54" width="150" height="86" rx="16" fill="${COLORS.blue}" stroke="#fff" stroke-width="7"/>${ballArt(200,207,40)}<path d="M200 157v20" stroke="${COLORS.green}" stroke-width="7" stroke-linecap="round"/><path d="M188 166l12 13 12-13" fill="none" stroke="${COLORS.green}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
  wake:()=>`${girl(42,76,{mood:'happy'})}${bed(190,126)}<circle cx="340" cy="51" r="25" fill="${COLORS.yellow}"/><path d="M340 15V2M340 100V87M304 51h-13M389 51h-13" stroke="${COLORS.orange}" stroke-width="6" stroke-linecap="round"/>`,
  'brush-teeth':()=>`${girl(52,65,{mood:'happy'})}<rect x="241" y="56" width="112" height="142" rx="17" fill="#dcecf7" stroke="#8fb7ce" stroke-width="6"/><path d="M196 124l77-22" stroke="#fff" stroke-width="12" stroke-linecap="round"/><path d="M263 102l27-7" stroke="${COLORS.blue}" stroke-width="8" stroke-linecap="round"/>${bubble(224,91,10)}${bubble(246,78,8)}`,
  breakfast:()=>`${girl(41,69,{mood:'happy'})}<rect x="188" y="150" width="173" height="18" rx="9" fill="#a97855"/><path d="M211 168v66M338 168v66" stroke="#8c6649" stroke-width="11"/><ellipse cx="273" cy="142" rx="55" ry="17" fill="#fff" stroke="#d8d8d8" stroke-width="4"/><circle cx="270" cy="137" r="20" fill="${COLORS.yellow}"/><rect x="327" y="100" width="28" height="42" rx="8" fill="${COLORS.blue}"/>`
});

const localScene=(key,altAr)=>{
  const draw=sceneBodies[key];
  if(!draw)throw new Error(`Missing Mashaal scene: ${key}`);
  const bg=key.includes('hot')||key==='touch-hot'||key==='play-near-hot'?'#fff2ed':key.includes('rain')||key==='umbrella'||key==='sunglasses'?'#eef7ff':key==='angry'||key.includes('blocks')?'#fff1f0':key==='happy'?'#fff9df':key==='sad'||key==='girl-lost-toy'?'#f2f4ff':'#f7f1ff';
  return Object.freeze({url:svgData(draw(),bg),altAr,source:'Mashaal local SVG scene',license:'project asset'});
};

export const MASHAAL_WEB_MEDIA=Object.freeze({
  // Exact flags remain source-based rather than AI-drawn.
  'saudi-flag':Object.freeze({url:`${FLAG_BASE}/sa.svg`,altAr:'علم المملكة العربية السعودية',source:'lipis/flag-icons 7.3.2',license:'MIT'}),
  'japan-flag':Object.freeze({url:`${FLAG_BASE}/jp.svg`,altAr:'علم اليابان',source:'lipis/flag-icons 7.3.2',license:'MIT'}),
  'brazil-flag':Object.freeze({url:`${FLAG_BASE}/br.svg`,altAr:'علم البرازيل',source:'lipis/flag-icons 7.3.2',license:'MIT'}),

  // Existing full illustrated scenario cards.
  doctor:local('doctor','طبيب'),teacher:local('teacher','معلمة'),baker:local('baker','خباز'),
  'wait-turn':local('wait-turn','أنتظر دوري'),'grab-ball':local('grab-ball','آخذ الكرة'),'ask-help':local('ask-help','أطلب المساعدة'),
  'return-book':local('return-book','أرجع الكتاب'),'leave-book-floor':local('leave-book-floor','أترك الكتاب على الأرض'),'damage-book':local('damage-book','أتلف الكتاب'),
  duck:local('duck-reference-unused','بطة'),apple:local('apple','تفاحة'),moon:local('moon','قمر'),
  'compare-three-apples':local('compare-three-apples','ثلاث تفاحات'),'compare-four-apples':local('compare-four-apples','أربع تفاحات'),'compare-five-apples':local('compare-five-apples','خمس تفاحات'),
  'healthy-apple':local('healthy-apple','تفاحة'),candy:local('candy','حلوى'),fries:local('fries','بطاطس مقلية'),

  // Local vector scenes for the remaining KG3 scenario activities. These stay
  // offline and render as full illustrated cards rather than source-backed icons.
  'wet-hands':localScene('wet-hands','أبلل يدي'),soap:localScene('soap','أستخدم الصابون'),'rub-hands':localScene('rub-hands','أفرك يدي'),'rinse-hands':localScene('rinse-hands','أشطف يدي'),
  'hot-surface':localScene('hot-surface','سطح حار'),'stay-away':localScene('stay-away','أبتعد'),'touch-hot':localScene('touch-hot','ألمس السطح الحار'),'play-near-hot':localScene('play-near-hot','ألعب قرب السطح الحار'),
  'playtime-cleanup':localScene('playtime-cleanup','انتهى وقت اللعب'),'help-tidy':localScene('help-tidy','أساعد في الترتيب'),'leave-mess':localScene('leave-mess','أترك المكان'),'scatter-toys':localScene('scatter-toys','أنثر الألعاب'),
  'girl-lost-toy':localScene('girl-lost-toy','طفلة فقدت لعبتها'),happy:localScene('happy','فرحانة'),sad:localScene('sad','حزينة'),angry:localScene('angry','زعلانة'),
  'rainy-day':localScene('rainy-day','يوم ممطر'),umbrella:localScene('umbrella','مظلة'),sunglasses:localScene('sunglasses','نظارة شمسية'),ball:localScene('ball','كرة'),
  'fallen-block-tower':localScene('fallen-block-tower','برج مكعبات وقع'),'throw-blocks':localScene('throw-blocks','أرمي المكعبات'),'kick-blocks':localScene('kick-blocks','أركل المكعبات'),
  'ball-above-box':localScene('ball-above-box','الكرة فوق الصندوق'),'ball-inside-box':localScene('ball-inside-box','الكرة داخل الصندوق'),'ball-below-box':localScene('ball-below-box','الكرة تحت الصندوق'),
  wake:localScene('wake','استيقاظ'),'brush-teeth':localScene('brush-teeth','تنظيف الأسنان'),breakfast:localScene('breakfast','فطور'),

  // Temporary source-backed fallbacks until their matching scenario cards land.
  hospital:Object.freeze({url:`${TABLER_BASE}/building-hospital.svg`,altAr:'مستشفى',source:'Tabler Icons 3.34.1',license:'MIT'}),
  school:Object.freeze({url:`${TABLER_BASE}/school.svg`,altAr:'مدرسة',source:'Tabler Icons 3.34.1',license:'MIT'}),
  bakery:Object.freeze({url:`${TABLER_BASE}/bread.svg`,altAr:'مخبز',source:'Tabler Icons 3.34.1',license:'MIT'}),
  'walk-away-angry':Object.freeze({url:`${TABLER_BASE}/walk.svg`,altAr:'أبتعد وأنا غاضبة',source:'Tabler Icons 3.34.1',license:'MIT'}),
  car:Object.freeze({url:`${TABLER_BASE}/car.svg`,altAr:'سيارة',source:'Tabler Icons 3.34.1',license:'MIT'}),
  airplane:Object.freeze({url:`${TABLER_BASE}/plane.svg`,altAr:'طائرة',source:'Tabler Icons 3.34.1',license:'MIT'}),
  boat:Object.freeze({url:`${TABLER_BASE}/sailboat.svg`,altAr:'قارب',source:'Tabler Icons 3.34.1',license:'MIT'})
});

export function getMashaalWebMedia(key){return MASHAAL_WEB_MEDIA[String(key)]||null;}
