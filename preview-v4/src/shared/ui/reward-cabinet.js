import { REWARD_CATALOG } from '../rewards/reward-catalog.js';
import { rewardPresentationCatalog,rewardPresentationCount,rewardPresentationUnlocked,rewardPresentationUnlock,latestRewardPresentation } from './game-inspired-rewards.js';
import { hydrateRewardImages } from './reward-assets.js';

function safeNumber(value){const number=Number(value);return Number.isFinite(number)?Math.max(0,number):0;}
function rewardCount(summary,rewardId){return safeNumber(summary?.counts?.[rewardId]);}
function formatUnlockDate(value){
  if(!value)return'';
  try{return new Date(value).toLocaleDateString('ar-SA',{month:'short',day:'numeric'});}catch{return'';}
}
function ratioMarkup(current,total){return `<bdi class="reward-ratio" dir="ltr">${safeNumber(current)} / ${safeNumber(total)}</bdi>`;}
function imageMarkup(graphicKey,cssClass=''){
  return `<img class="${cssClass}" data-reward-graphic="${graphicKey}" alt="" hidden decoding="async"><span class="reward-cabinet-art-fallback" aria-hidden="true"></span>`;
}
function ensureStyle(){
  if(document.querySelector('link[data-module-style="reward-cabinet"]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='src/shared/ui/reward-cabinet.css';link.dataset.moduleStyle='reward-cabinet';document.head.appendChild(link);
}
function academicCapabilities(registry){return registry?.list?.({mode:'academic'})||[];}
function hydrateLearnerSwitch(view,registry){
  const nav=view?.querySelector?.('.reward-learner-switch');if(!nav)return;
  nav.innerHTML=academicCapabilities(registry).map(item=>`<button type="button" data-reward-learner="${item.learnerId}">${item.displayName}</button>`).join('');
}
function ensureView(registry){
  let view=document.getElementById('rewardCabinetView');
  if(view){hydrateLearnerSwitch(view,registry);return view;}
  const main=document.querySelector('main');if(!main)return null;
  view=document.createElement('section');view.id='rewardCabinetView';view.className='view reward-cabinet-view';
  view.innerHTML=`<div class="reward-cabinet-shell">
    <header class="reward-cabinet-head">
      <button class="reward-round-button reward-cabinet-back" id="rewardCabinetBack" type="button">العودة</button>
      <div class="reward-cabinet-title"><span>كل إنجاز يصنع قصة أجمل</span><h1>خزانة الجوائز</h1></div>
      <div class="reward-cabinet-head-spacer" aria-hidden="true"></div>
    </header>
    <nav class="reward-learner-switch" aria-label="اختيار الطفل"></nav>
    <section class="reward-cabinet-summary" id="rewardCabinetSummary" aria-label="ملخص الجوائز"></section>
    <section class="reward-cabinet-layout">
      <aside class="reward-feature" id="rewardCabinetFeature" aria-label="الجائزة المميزة"></aside>
      <section class="reward-collection"><h2>مجموعة الجوائز</h2><div class="reward-cabinet-grid" id="rewardCabinetGrid"></div></section>
      <aside class="reward-challenge" id="rewardCabinetChallenge" aria-label="تحديات التعلم"></aside>
    </section>
  </div>`;
  main.appendChild(view);hydrateLearnerSwitch(view,registry);return view;
}
function motivationSlotId(learnerId){return `learningMotivation-${String(learnerId||'')}`;}
function ensureOpenButton(capability,onOpen){
  const learnerId=capability?.learnerId,slot=document.getElementById(motivationSlotId(learnerId));if(!learnerId||!slot)return null;
  const buttonId=`rewardCabinetOpen-${learnerId}`;
  let button=document.getElementById(buttonId);
  if(!button){button=document.createElement('button');button.id=buttonId;button.className='reward-cabinet-open';button.type='button';button.textContent='خزانة الجوائز';slot.insertAdjacentElement('afterend',button);}
  button.onclick=()=>onOpen(learnerId);return button;
}

export function buildRewardCabinetMarkup({status={},learnerId=null,excludeRewardId=null}={}){
  const summary=status?.summary||{},catalog=rewardPresentationCatalog(learnerId);
  return catalog.filter(item=>item.id!==excludeRewardId).map(item=>{
    const count=rewardPresentationCount(item,summary),unlocked=rewardPresentationUnlocked(item,summary),latest=rewardPresentationUnlock(item,summary),date=formatUnlockDate(latest?.at);
    return `<article class="reward-cabinet-card ${unlocked?'unlocked':'locked'}" data-reward-id="${item.id}" data-unlocked="${unlocked}" data-reward-kind="${item.category||'personal'}" data-reward-tier="${item.tier||'rare'}">
      <div class="reward-cabinet-art">${imageMarkup(item.graphicKey)}</div>
      <div class="reward-cabinet-copy"><strong>${item.label}</strong><span class="reward-state">${unlocked?'مفتوح':'مقفل'}</span>${count>1?`<small>مرات الفتح: ${count}</small>`:''}${date?`<small>فتح: ${date}</small>`:!unlocked&&item.hint?`<small class="reward-hint">${item.hint}</small>`:''}</div>
    </article>`;
  }).join('');
}

function featureMarkup(status,learnerId){
  const summary=status?.summary||{},item=latestRewardPresentation(learnerId,summary),count=rewardPresentationCount(item,summary),unlocked=rewardPresentationUnlocked(item,summary),latest=rewardPresentationUnlock(item,summary),date=formatUnlockDate(latest?.at);
  return `<div class="reward-feature-label">الجائزة المميزة</div><div class="reward-feature-art">${imageMarkup(item.graphicKey,'reward-feature-image')}</div><h2>${item.label}</h2><p>${unlocked?'إنجاز محفوظ في خزانتك':item.hint||'واصل التدريب لفتح هذه الجائزة'}</p>${date?`<small>فتح: ${date}</small>`:''}<div class="reward-feature-state" data-unlocked="${unlocked}">${unlocked?'مفتوح':'قريبًا'}</div>`;
}
function challengeMarkup(status){
  const daily=Array.isArray(status?.challenges?.daily)?status.challenges.daily:[],weekly=Array.isArray(status?.challenges?.weekly)?status.challenges.weekly:[],items=[...daily,...weekly];
  const rows=items.map(item=>`<div class="reward-challenge-item" data-complete="${Boolean(item?.complete)}"><div><strong>${item?.label||'تحدي تعلم'}</strong><span>${ratioMarkup(safeNumber(item?.current),Math.max(1,safeNumber(item?.target)||1))}</span></div><div class="reward-challenge-bar" role="progressbar" aria-label="${item?.label||'تقدم التحدي'}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100,safeNumber(item?.pct))}"><i style="width:${Math.min(100,safeNumber(item?.pct))}%"></i></div></div>`).join('');
  const done=items.filter(item=>item?.complete).length;
  return `<div class="reward-challenge-heading"><span>تحدي هذا الأسبوع</span><strong>${ratioMarkup(done,items.length)}</strong></div><p>أكمل مهامك، والجوائز تُفتح تلقائيًا من نتائجك الحقيقية.</p><div class="reward-challenge-list">${rows||'<div class="reward-challenge-empty">ابدأ التدريب ليظهر تقدمك هنا.</div>'}</div><button type="button" id="rewardChallengeStart" class="reward-challenge-start">ابدأ التحدي</button>`;
}

export function createRewardCabinetController({capabilityRegistry,getStatus,onExit}={}){
  let activeLearner=null,bound=false;
  function capability(learnerId){const item=capabilityRegistry?.get?.(learnerId);return item?.mode==='academic'?item:null;}
  function showOnly(id){document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id===id));window.scrollTo(0,0);}
  function bindDynamic(view){
    view.querySelectorAll('[data-reward-learner]').forEach(button=>{button.onclick=()=>open(button.dataset.rewardLearner);});
    const challenge=view.querySelector('#rewardChallengeStart');if(challenge)challenge.onclick=close;
  }
  function render(learnerId,status){
    const learner=capability(learnerId),view=document.getElementById('rewardCabinetView');if(!learner||!view)return false;view.dataset.learner=learnerId;
    const summary=status?.summary||{},catalog=rewardPresentationCatalog(learnerId),openedKinds=catalog.filter(item=>rewardPresentationUnlocked(item,summary)).length,total=safeNumber(summary.total),streak=safeNumber(status?.trends?.streakDays),cups=rewardCount(summary,'mastery-cup')+rewardCount(summary,'weekly-cup'),feature=latestRewardPresentation(learnerId,summary);
    view.querySelectorAll('[data-reward-learner]').forEach(button=>{const active=button.dataset.rewardLearner===learnerId;button.classList.toggle('active',active);button.setAttribute('aria-current',active?'true':'false');});
    const openedRatio=learnerId?ratioMarkup(openedKinds,catalog.length):ratioMarkup(openedKinds,REWARD_CATALOG.length);
    document.getElementById('rewardCabinetSummary').innerHTML=`<div><span>أنواع مفتوحة</span><strong>${openedRatio}</strong></div><div><span>إجمالي الجوائز</span><strong>${total}</strong></div><div><span>أفضل سلسلة</span><strong>${streak} يوم</strong></div><div><span>الكؤوس</span><strong>${cups}</strong></div>`;
    document.getElementById('rewardCabinetFeature').innerHTML=featureMarkup(status,learnerId);
    document.getElementById('rewardCabinetGrid').innerHTML=buildRewardCabinetMarkup({status,learnerId,excludeRewardId:feature.id});
    document.getElementById('rewardCabinetChallenge').innerHTML=challengeMarkup(status);
    bindDynamic(view);hydrateRewardImages(view);return true;
  }
  function open(learnerId){
    const learner=capability(learnerId);if(!learner)return false;activeLearner=learner.learnerId;
    document.body.classList.remove('intro-mode','hub-mode','khaled-mode','mashaal-mode','family-parent-mode','games-mode');document.body.classList.add('reward-cabinet-mode');
    const status=typeof getStatus==='function'?getStatus(activeLearner):{};render(activeLearner,status);showOnly('rewardCabinetView');return true;
  }
  function leave(){activeLearner=null;document.body.classList.remove('reward-cabinet-mode');}
  function close(){const id=activeLearner;leave();if(id&&typeof onExit==='function')onExit(id);}
  function refresh(learnerId,status){if(activeLearner===learnerId)render(learnerId,status);}
  function start(){
    ensureStyle();const view=ensureView(capabilityRegistry);if(!view)return false;
    for(const item of academicCapabilities(capabilityRegistry))ensureOpenButton(item,open);
    bindDynamic(view);
    if(!bound){document.getElementById('rewardCabinetBack')?.addEventListener('click',close);bound=true;}
    return true;
  }
  return Object.freeze({start,open,close,leave,refresh,getActiveLearner:()=>activeLearner});
}
