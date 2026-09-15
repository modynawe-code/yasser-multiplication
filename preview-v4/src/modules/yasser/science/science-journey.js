const JOURNEY_STYLE='src/modules/yasser/science/science-journey.css';
let mounted=false;

function ensureStyle(){
  if(document.querySelector('link[data-module-style="science-journey"]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href=JOURNEY_STYLE;
  link.dataset.moduleStyle='science-journey';
  document.head.appendChild(link);
}

function clickUnit(unitId){
  const target=document.querySelector(`[data-science-unit="${unitId}"]`);
  target?.click();
  requestAnimationFrame(()=>document.getElementById('scienceUnitCard')?.scrollIntoView({behavior:'smooth',block:'start'}));
}

function startMode(mode){
  document.querySelector(`[data-science-mode="${mode}"]`)?.click();
}

function station({kind,title,subtitle,state,unitId,marker,disabled=false,current=false}){
  const tag=disabled?'div':'button';
  const attrs=disabled?'aria-disabled="true"':`type="button"${unitId?` data-journey-unit="${unitId}"`:''}`;
  return `<${tag} class="science-journey-station is-${kind}${current?' is-current':''}${disabled?' is-locked':''}" ${attrs}>
    <span class="science-journey-node" aria-hidden="true">${marker}</span>
    <span class="science-journey-card">
      <small>${state}</small>
      <strong>${title}</strong>
      <span>${subtitle}</span>
      ${current?'<span class="science-journey-you">أنت هنا</span>':''}
    </span>
  </${tag}>`;
}

function journeyMarkup(){
  return `<section class="science-journey" id="scienceJourney" aria-labelledby="scienceJourneyTitle">
    <div class="science-journey-sky" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="science-journey-intro">
      <div>
        <span class="science-journey-kicker">رحلة ياسر</span>
        <h2 id="scienceJourneyTitle">مغامرتك في عالم العلوم</h2>
        <p>تحرك بين المحطات، راجع اللي خلصته، وافتح التحدي الجاي.</p>
      </div>
      <div class="science-daily-mission" aria-label="مهمة اليوم">
        <span>مهمة اليوم</span>
        <strong>10 أسئلة + تحدي صور</strong>
        <button type="button" data-journey-mode="quick">ابدأ المهمة</button>
      </div>
    </div>

    <div class="science-journey-path" aria-label="خريطة التقدم">
      ${station({kind:'review',title:'الوحدة الأولى',subtitle:'تنوع الحياة',state:'مراجعة جاهزة',unitId:'unit-1-diversity-of-life',marker:'✓'})}
      ${station({kind:'review',title:'الوحدة الثانية',subtitle:'عمليات الحياة',state:'مراجعة جاهزة',unitId:'unit-2-life-processes',marker:'✓'})}
      ${station({kind:'unit',title:'الوحدة الثالثة',subtitle:'الأنظمة البيئية ومواردها',state:'الوحدة الحالية',unitId:'unit-3-ecosystems-resources',marker:'3',current:true})}
      <div class="science-journey-avatar" aria-hidden="true"><img src="assets/visual/original/yasser/encourage.png" alt="" decoding="async" /></div>
      ${station({kind:'chapter',title:'الفصل الخامس',subtitle:'الأنظمة البيئية',state:'مفتوح الآن',unitId:'unit-3-ecosystems-resources',marker:'5',current:true})}
      ${station({kind:'boss',title:'تحدي خبير الأنظمة البيئية',subtitle:'تحدي ختامي للفصل',state:'يفتح بعد الإتقان',marker:'★',disabled:true})}
      ${station({kind:'locked',title:'الفصل السادس',subtitle:'موارد الأرض والحفاظ عليها',state:'المحطة القادمة',marker:'🔒',disabled:true})}
      ${station({kind:'reward',title:'صندوق الإنجاز',subtitle:'مكافأة نهاية الرحلة',state:'جائزة قادمة',marker:'🎁',disabled:true})}
    </div>

    <div class="science-journey-actions">
      <button type="button" class="science-journey-primary" data-journey-unit="unit-3-ecosystems-resources">أكمل من الفصل الخامس</button>
      <button type="button" class="science-journey-secondary" data-journey-mode="images">تحدي الصور</button>
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
  ensureStyle();
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
