const JOURNEY_STYLE='src/modules/yasser/science/science-journey.css';
const JOURNEY_POLISH_STYLE='src/modules/yasser/science/science-journey-polish.css';
let mounted=false;

const JOURNEY_NODES=Object.freeze([
  {id:'unit-1',kind:'review',side:'right',title:'الوحدة الأولى',subtitle:'تنوع الحياة',state:'راجعتها وأتقنتها',unitId:'unit-1-diversity-of-life',marker:'✓'},
  {id:'unit-2',kind:'review',side:'left',title:'الوحدة الثانية',subtitle:'عمليات الحياة',state:'راجعتها وأتقنتها',unitId:'unit-2-life-processes',marker:'✓'},
  {id:'unit-3',kind:'unit',side:'right',title:'الوحدة الثالثة',subtitle:'الأنظمة البيئية ومواردها',state:'الوحدة الحالية',unitId:'unit-3-ecosystems-resources',marker:'3'},
  {id:'chapter-5',kind:'chapter',side:'left',title:'الفصل الخامس',subtitle:'الأنظمة البيئية',state:'أنت هنا',unitId:'unit-3-ecosystems-resources',marker:'5',current:true,avatar:true},
  {id:'boss',kind:'boss',side:'right',title:'تحدي خبير الأنظمة البيئية',subtitle:'التحدي الختامي للفصل',state:'يفتح بعد الإتقان',marker:'★',disabled:true},
  {id:'chapter-6',kind:'locked',side:'left',title:'الفصل السادس',subtitle:'موارد الأرض والحفاظ عليها',state:'المحطة القادمة',marker:'🔒',disabled:true},
  {id:'reward',kind:'reward',side:'right',title:'صندوق الإنجاز',subtitle:'مكافأتك بانتظارك',state:'جائزة نهاية الرحلة',marker:'🎁',disabled:true}
]);

function ensureStyle(href,key){
  if(document.querySelector(`link[data-module-style="${key}"]`))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href=href;
  link.dataset.moduleStyle=key;
  document.head.appendChild(link);
}

function ensureStyles(){
  ensureStyle(JOURNEY_STYLE,'science-journey');
  ensureStyle(JOURNEY_POLISH_STYLE,'science-journey-polish');
}

function clickUnit(unitId){
  const target=document.querySelector(`[data-science-unit="${unitId}"]`);
  target?.click();
  requestAnimationFrame(()=>document.getElementById('scienceUnitCard')?.scrollIntoView({behavior:'smooth',block:'start'}));
}

function startMode(mode){
  document.querySelector(`[data-science-mode="${mode}"]`)?.click();
}

function station(node){
  const {id,kind,side,title,subtitle,state,unitId,marker,disabled=false,current=false,avatar=false}=node;
  const tag=disabled?'div':'button';
  const attrs=disabled?'aria-disabled="true"':`type="button"${unitId?` data-journey-unit="${unitId}"`:''}`;
  const avatarMarkup=avatar?`<span class="science-journey-avatar" aria-hidden="true"><span class="science-journey-avatar-label">أنت هنا</span><img src="assets/visual/original/yasser/encourage.png" alt="" decoding="async" /></span>`:'';
  return `<div class="science-journey-row is-${side}" data-journey-node="${id}">
    <${tag} class="science-journey-station is-${kind}${current?' is-current':''}${disabled?' is-locked':''}" ${attrs}>
      <span class="science-journey-node" aria-hidden="true">${marker}</span>
      <span class="science-journey-card">
        <small>${state}</small>
        <strong>${title}</strong>
        <span>${subtitle}</span>
      </span>
      ${avatarMarkup}
    </${tag}>
  </div>`;
}

function trailMarkup(){
  return `<svg class="science-journey-trail" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path class="science-journey-trail-shadow" d="M790 70 C640 110 650 180 500 205 C350 230 210 240 230 335 C250 430 610 365 770 440 C900 500 690 570 515 590 C335 610 180 650 245 745 C305 835 685 760 785 860 C825 900 770 945 690 965"/>
    <path class="science-journey-trail-main" d="M790 70 C640 110 650 180 500 205 C350 230 210 240 230 335 C250 430 610 365 770 440 C900 500 690 570 515 590 C335 610 180 650 245 745 C305 835 685 760 785 860 C825 900 770 945 690 965"/>
    <path class="science-journey-trail-dash" d="M790 70 C640 110 650 180 500 205 C350 230 210 240 230 335 C250 430 610 365 770 440 C900 500 690 570 515 590 C335 610 180 650 245 745 C305 835 685 760 785 860 C825 900 770 945 690 965"/>
  </svg>`;
}

function progressKeyMarkup(){
  return `<div class="science-journey-progress-key" aria-label="اتجاه الرحلة">
    <span class="is-done">✓ مراجعة الوحدات</span><i aria-hidden="true">←</i>
    <span class="is-now">● أنت هنا: الفصل الخامس</span><i aria-hidden="true">←</i>
    <span class="is-next">🔒 القادم: الفصل السادس</span>
  </div>`;
}

function journeyMarkup(){
  return `<section class="science-journey" id="scienceJourney" aria-labelledby="scienceJourneyTitle">
    <div class="science-journey-world" aria-hidden="true">
      <span class="world-cloud cloud-one"></span><span class="world-cloud cloud-two"></span>
      <span class="world-orb orb-leaf">🌿</span><span class="world-orb orb-globe">🌎</span><span class="world-orb orb-drop">💧</span><span class="world-orb orb-lab">🔬</span>
      <span class="world-hill hill-one"></span><span class="world-hill hill-two"></span>
    </div>

    <div class="science-journey-intro">
      <div class="science-journey-title-block">
        <span class="science-journey-kicker">رحلة ياسر • علوم</span>
        <h2 id="scienceJourneyTitle">مغامرتك في عالم العلوم</h2>
        <p>كل محطة تقربك من التحدي والجائزة. أنت الآن في الفصل الخامس.</p>
      </div>
      <div class="science-daily-mission" aria-label="مهمة اليوم">
        <span class="science-mission-flag" aria-hidden="true">⚑</span>
        <div><small>مهمة اليوم</small><strong>10 أسئلة + تحدي صور</strong><em>مهمة قصيرة وتخلصها اليوم</em></div>
        <button type="button" data-journey-mode="quick">ابدأ المهمة</button>
      </div>
    </div>

    ${progressKeyMarkup()}

    <div class="science-journey-map" aria-label="خريطة التقدم">
      ${trailMarkup()}
      <div class="science-journey-decor science-decor-tree tree-a" aria-hidden="true"><i></i><b></b></div>
      <div class="science-journey-decor science-decor-tree tree-b" aria-hidden="true"><i></i><b></b></div>
      <div class="science-journey-decor science-decor-rock rock-a" aria-hidden="true"></div>
      <div class="science-journey-decor science-decor-rock rock-b" aria-hidden="true"></div>
      ${JOURNEY_NODES.map(station).join('')}
    </div>

    <div class="science-journey-actions">
      <button type="button" class="science-journey-primary" data-journey-unit="unit-3-ecosystems-resources"><span>▶</span> أكمل من الفصل الخامس</button>
      <button type="button" class="science-journey-secondary" data-journey-mode="images"><span>▣</span> تحدي الصور</button>
    </div>
  </section>`;
}

function syncSelection(){
  const active=document.querySelector('#scienceUnitSwitch .science-unit-pick.active')?.dataset.scienceUnit;
  document.querySelectorAll('[data-journey-unit]').forEach(node=>node.classList.toggle('is-selected',node.dataset.journeyUnit===active));
}

function bindJourney(host){
  host.addEventListener('click',event=>{
    const unit=event.target.closest('[data-journey-unit]');
    if(unit){clickUnit(unit.dataset.journeyUnit);return;}
    const mode=event.target.closest('[data-journey-mode]');
    if(mode)startMode(mode.dataset.journeyMode);
  });
}

export function mountScienceJourney(){
  const view=document.getElementById('yasserScienceView');
  if(!view||view.dataset.journeyMap==='true')return false;
  ensureStyles();
  const head=view.querySelector('.yasser-science-head');
  if(!head)return false;
  const wrapper=document.createElement('div');
  wrapper.innerHTML=journeyMarkup();
  const journey=wrapper.firstElementChild;
  head.after(journey);
  view.dataset.journeyMap='true';
  view.classList.add('science-journey-enhanced');
  bindJourney(journey);
  syncSelection();
  const switcher=document.getElementById('scienceUnitSwitch');
  if(switcher)new MutationObserver(syncSelection).observe(switcher,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  mounted=true;
  return true;
}

function tryMount(){
  if(mounted)return true;
  return mountScienceJourney();
}

if(!tryMount()){
  const observer=new MutationObserver(()=>{if(tryMount())observer.disconnect();});
  observer.observe(document.documentElement,{childList:true,subtree:true});
}
