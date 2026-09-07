import { REWARD_CATALOG,REWARD_BY_ID } from '../rewards/reward-catalog.js';
import { hydrateRewardImages } from './reward-assets.js';

const LEARNERS=Object.freeze({
  yasser:Object.freeze({name:'ياسر',slotId:'yasserMotivation',buttonId:'yasserRewardsBtn'}),
  khaled:Object.freeze({name:'خالد',slotId:'khaledMotivation',buttonId:'khaledRewardsBtn'})
});

function safeNumber(value){const number=Number(value);return Number.isFinite(number)?Math.max(0,number):0;}
function rewardCount(summary,rewardId){return safeNumber(summary?.counts?.[rewardId]);}
function latestUnlock(summary,rewardId){
  const unlocks=Array.isArray(summary?.unlocks)?summary.unlocks:[];
  return [...unlocks].reverse().find(item=>item?.rewardId===rewardId)||null;
}
function formatUnlockDate(value){
  if(!value)return'';
  try{return new Date(value).toLocaleDateString('ar-SA',{month:'short',day:'numeric'});}catch{return'';}
}
function latestReward(summary){
  const unlocks=Array.isArray(summary?.unlocks)?summary.unlocks:[];
  const latest=[...unlocks].sort((a,b)=>new Date(b?.at||0)-new Date(a?.at||0))[0];
  return REWARD_BY_ID[latest?.rewardId]||REWARD_BY_ID['mastery-cup'];
}
function imageMarkup(graphicKey,cssClass=''){
  return `<img class="${cssClass}" data-reward-graphic="${graphicKey}" alt="" hidden loading="lazy" decoding="async"><span class="reward-cabinet-art-fallback" aria-hidden="true"></span>`;
}
function ensureStyle(){
  if(document.querySelector('link[data-module-style="reward-cabinet"]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='src/shared/ui/reward-cabinet.css';link.dataset.moduleStyle='reward-cabinet';document.head.appendChild(link);
}
function ensureView(){
  let view=document.getElementById('rewardCabinetView');if(view)return view;
  const main=document.querySelector('main');if(!main)return null;
  view=document.createElement('section');view.id='rewardCabinetView';view.className='view reward-cabinet-view';
  view.innerHTML=`<div class="reward-cabinet-shell">
    <header class="reward-cabinet-head">
      <button class="reward-round-button reward-cabinet-back" id="rewardCabinetBack" type="button">العودة</button>
      <div class="reward-cabinet-title"><span>كل إنجاز يصنع قصة أجمل</span><h1>خزانة الجوائز</h1></div>
      <div class="reward-cabinet-head-spacer" aria-hidden="true"></div>
    </header>
    <nav class="reward-learner-switch" aria-label="اختيار الطفل">
      <button type="button" data-reward-learner="khaled">خالد</button>
      <button type="button" data-reward-learner="yasser">ياسر</button>
    </nav>
    <section class="reward-cabinet-summary" id="rewardCabinetSummary" aria-label="ملخص الجوائز"></section>
    <section class="reward-cabinet-layout">
      <aside class="reward-feature" id="rewardCabinetFeature" aria-label="الجائزة المميزة"></aside>
      <section class="reward-collection"><h2>مجموعة الجوائز</h2><div class="reward-cabinet-grid" id="rewardCabinetGrid"></div></section>
      <aside class="reward-challenge" id="rewardCabinetChallenge" aria-label="تحديات التعلم"></aside>
    </section>
  </div>`;
  main.appendChild(view);return view;
}
function ensureOpenButton(learnerId,onOpen){
  const learner=LEARNERS[learnerId],slot=document.getElementById(learner?.slotId);if(!learner||!slot)return null;
  let button=document.getElementById(learner.buttonId);
  if(!button){button=document.createElement('button');button.id=learner.buttonId;button.className='reward-cabinet-open';button.type='button';button.textContent='خزانة الجوائز';slot.insertAdjacentElement('afterend',button);}
  button.onclick=()=>onOpen(learnerId);return button;
}

export function buildRewardCabinetMarkup({status={},excludeRewardId=null}={}){
  const summary=status?.summary||{};
  return REWARD_CATALOG.filter(item=>item.id!==excludeRewardId).map(item=>{
    const count=rewardCount(summary,item.id),unlocked=count>0,latest=latestUnlock(summary,item.id),date=formatUnlockDate(latest?.at);
    return `<article class="reward-cabinet-card ${unlocked?'unlocked':'locked'}" data-reward-id="${item.id}" data-unlocked="${unlocked}">
      <div class="reward-cabinet-art">${imageMarkup(item.graphicKey)}${unlocked?'':'<span class="reward-cabinet-lock">قريبًا</span>'}</div>
      <div class="reward-cabinet-copy"><strong>${item.label}</strong><span class="reward-state">${unlocked?'مفتوح':'مقفل'}</span>${count>1?`<small>مرات الفتح: ${count}</small>`:''}${date?`<small>آخر فتح: ${date}</small>`:''}</div>
    </article>`;
  }).join('');
}

function featureMarkup(status){
  const summary=status?.summary||{},item=latestReward(summary),count=rewardCount(summary,item.id),unlocked=count>0,latest=latestUnlock(summary,item.id),date=formatUnlockDate(latest?.at);
  return `<div class="reward-feature-label">الجائزة المميزة</div><div class="reward-feature-art">${imageMarkup(item.graphicKey,'reward-feature-image')}</div><h2>${item.label}</h2><p>${unlocked?'إنجاز محفوظ في خزانتك':'واصل التدريب لفتح هذه الجائزة'}</p>${date?`<small>آخر فتح: ${date}</small>`:''}<div class="reward-feature-state" data-unlocked="${unlocked}">${unlocked?'مفتوح':'قريبًا'}</div>`;
}
function challengeMarkup(status){
  const daily=Array.isArray(status?.challenges?.daily)?status.challenges.daily:[],weekly=Array.isArray(status?.challenges?.weekly)?status.challenges.weekly:[],items=[...daily,...weekly];
  const rows=items.map(item=>`<div class="reward-challenge-item" data-complete="${Boolean(item?.complete)}"><div><strong>${item?.label||'تحدي تعلم'}</strong><span>${safeNumber(item?.current)} / ${Math.max(1,safeNumber(item?.target)||1)}</span></div><div class="reward-challenge-bar" role="progressbar" aria-label="${item?.label||'تقدم التحدي'}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100,safeNumber(item?.pct))}"><i style="width:${Math.min(100,safeNumber(item?.pct))}%"></i></div></div>`).join('');
  const done=items.filter(item=>item?.complete).length;
  return `<div class="reward-challenge-heading"><span>تحدي هذا الأسبوع</span><strong>${done} / ${items.length||1}</strong></div><p>أكمل مهامك، والجوائز تُفتح تلقائيًا من نتائجك الحقيقية.</p><div class="reward-challenge-list">${rows||'<div class="reward-challenge-empty">ابدأ التدريب ليظهر تقدمك هنا.</div>'}</div><button type="button" id="rewardChallengeStart" class="reward-challenge-start">ابدأ التحدي</button>`;
}

export function createRewardCabinetController({getStatus,onExit}={}){
  let activeLearner=null,bound=false;
  function showOnly(id){document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id===id));window.scrollTo(0,0);}
  function bindDynamic(view){
    view.querySelectorAll('[data-reward-learner]').forEach(button=>{button.onclick=()=>open(button.dataset.rewardLearner);});
    const challenge=view.querySelector('#rewardChallengeStart');if(challenge)challenge.onclick=close;
  }
  function render(learnerId,status){
    const learner=LEARNERS[learnerId],view=document.getElementById('rewardCabinetView');if(!learner||!view)return false;view.dataset.learner=learnerId;
    const summary=status?.summary||{},openedKinds=REWARD_CATALOG.filter(item=>rewardCount(summary,item.id)>0).length,total=safeNumber(summary.total),streak=safeNumber(status?.trends?.streakDays),weekly=status?.challenges?.weekly||[],weeklyDone=weekly.filter(item=>item?.complete).length,cups=rewardCount(summary,'mastery-cup')+rewardCount(summary,'weekly-cup'),feature=latestReward(summary);
    view.querySelectorAll('[data-reward-learner]').forEach(button=>{const active=button.dataset.rewardLearner===learnerId;button.classList.toggle('active',active);button.setAttribute('aria-current',active?'true':'false');});
    document.getElementById('rewardCabinetSummary').innerHTML=`<div><span>أنواع مفتوحة</span><strong>${openedKinds} / ${REWARD_CATALOG.length}</strong></div><div><span>إجمالي الجوائز</span><strong>${total}</strong></div><div><span>أفضل سلسلة</span><strong>${streak} يوم</strong></div><div><span>الكؤوس</span><strong>${cups}</strong></div>`;
    document.getElementById('rewardCabinetFeature').innerHTML=featureMarkup(status);
    document.getElementById('rewardCabinetGrid').innerHTML=buildRewardCabinetMarkup({status,excludeRewardId:feature.id});
    document.getElementById('rewardCabinetChallenge').innerHTML=challengeMarkup(status);
    bindDynamic(view);hydrateRewardImages(view);return true;
  }
  function open(learnerId){
    const id=LEARNERS[learnerId]?learnerId:null;if(!id)return false;activeLearner=id;
    document.body.classList.remove('intro-mode','hub-mode','khaled-mode','family-parent-mode','games-mode');document.body.classList.add('reward-cabinet-mode');
    const status=typeof getStatus==='function'?getStatus(id):{};render(id,status);showOnly('rewardCabinetView');return true;
  }
  function leave(){activeLearner=null;document.body.classList.remove('reward-cabinet-mode');}
  function close(){const id=activeLearner;leave();if(id&&typeof onExit==='function')onExit(id);}
  function refresh(learnerId,status){if(activeLearner===learnerId)render(learnerId,status);}
  function start(){
    ensureStyle();const view=ensureView();if(!view)return false;
    ensureOpenButton('yasser',open);ensureOpenButton('khaled',open);
    if(!bound){document.getElementById('rewardCabinetBack')?.addEventListener('click',close);bound=true;}
    return true;
  }
  return Object.freeze({start,open,close,leave,refresh,getActiveLearner:()=>activeLearner});
}
