import { REWARD_CATALOG } from '../rewards/reward-catalog.js';
import { rewardPresentationCatalog,rewardPresentationCount,rewardPresentationUnlocked,rewardPresentationUnlock,latestRewardPresentation } from './game-inspired-rewards.js';
import { hydrateRewardImages,getRewardImageUrl } from './reward-assets.js';

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
function rewardCapabilities(registry){return registry?.list?.()||[];}
function hydrateLearnerSwitch(view,registry){
  const nav=view?.querySelector?.('.reward-learner-switch');if(!nav)return;
  nav.innerHTML=rewardCapabilities(registry).map(item=>`<button type="button" data-reward-learner="${item.learnerId}">${item.displayName}</button>`).join('');
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
      <section class="reward-collection"><h2>مجموعة الجوائز</h2><p class="reward-collection-help">اضغط الجائزة المفتوحة لفتح صندوقها</p><div class="reward-cabinet-grid" id="rewardCabinetGrid"></div></section>
      <aside class="reward-challenge" id="rewardCabinetChallenge" aria-label="تحديات التعلم"></aside>
    </section>
    <div class="reward-reveal" id="rewardReveal" hidden role="dialog" aria-modal="true" aria-labelledby="rewardRevealTitle">
      <div class="reward-reveal-panel">
        <button type="button" class="reward-reveal-close" data-reward-reveal-close aria-label="إغلاق">×</button>
        <div class="reward-reveal-stage" data-reward-reveal-stage="chest">
          <button type="button" class="reward-chest" data-reward-chest aria-label="فتح صندوق الجائزة"><span class="reward-chest-lid"></span><span class="reward-chest-body"></span><span class="reward-chest-lock"></span></button>
          <p>اضغط الصندوق وافتح جائزتك</p>
        </div>
        <div class="reward-reveal-prize" data-reward-reveal-prize hidden>
          <div class="reward-reveal-image-wrap"><img data-reward-reveal-image alt="" decoding="async"></div>
          <h2 id="rewardRevealTitle" data-reward-reveal-title></h2><p>محفوظة في خزانتك</p>
        </div>
      </div>
    </div>
  </div>`;
  main.appendChild(view);hydrateLearnerSwitch(view,registry);return view;
}
const CLAIM_PREFIX='family-learning-reward-claims-v1';
function claimKey(learnerId){return `${CLAIM_PREFIX}:${String(learnerId||'')}`;}
function loadClaims(learnerId){
  try{const value=JSON.parse(globalThis.localStorage?.getItem?.(claimKey(learnerId))||'[]');return new Set(Array.isArray(value)?value:[]);}catch{return new Set();}
}
function saveClaim(learnerId,rewardId){
  const claims=loadClaims(learnerId);claims.add(String(rewardId||''));try{globalThis.localStorage?.setItem?.(claimKey(learnerId),JSON.stringify([...claims]));}catch{}return claims;
}
function mysteryChestMarkup(){return '<div class="reward-mystery-chest" aria-hidden="true"><span></span></div>';}
function motivationSlotId(learnerId){return `learningMotivation-${String(learnerId||'')}`;}
function ensureOpenButton(capability,onOpen){
  const learnerId=capability?.learnerId;if(!learnerId)return null;
  const buttonId=`rewardCabinetOpen-${learnerId}`;
  let button=document.getElementById(buttonId);
  if(!button){
    const slot=document.getElementById(motivationSlotId(learnerId));if(!slot)return null;
    button=document.createElement('button');button.id=buttonId;button.className='reward-cabinet-open';button.type='button';button.textContent='خزانة الجوائز';slot.insertAdjacentElement('afterend',button);
  }
  button.onclick=()=>onOpen(learnerId);return button;
}

export function buildRewardCabinetMarkup({status={},learnerId=null,excludeRewardId=null,claimedRewardIds=null}={}){
  const claims=claimedRewardIds instanceof Set?claimedRewardIds:new Set(Array.isArray(claimedRewardIds)?claimedRewardIds:[]);
  const summary=status?.summary||{},catalog=rewardPresentationCatalog(learnerId);
  return catalog.filter(item=>item.id!==excludeRewardId).map(item=>{
    const count=rewardPresentationCount(item,summary),unlocked=rewardPresentationUnlocked(item,summary),claimed=unlocked&&claims.has(item.id),latest=rewardPresentationUnlock(item,summary),date=formatUnlockDate(latest?.at);
    const state=claimed?'collected':unlocked?'ready':'locked',art=claimed?imageMarkup(item.graphicKey):unlocked?mysteryChestMarkup():'<div class="reward-locked-placeholder" aria-hidden="true">?</div>';
    return `<article class="reward-cabinet-card ${state}" data-reward-id="${item.id}" data-unlocked="${unlocked}" data-claimed="${claimed}" data-reward-label="${item.label}" data-reward-graphic-key="${item.graphicKey}" data-reward-kind="${item.category||'personal'}" data-reward-tier="${item.tier||'rare'}" ${unlocked&&!claimed?'role="button" tabindex="0" aria-label="فتح صندوق الجائزة"':''}>
      <div class="reward-cabinet-art">${art}</div>
      <div class="reward-cabinet-copy"><strong>${claimed?item.label:unlocked?'جائزة جديدة':'جائزة مقفلة'}</strong><span class="reward-state">${claimed?'تم جمعها':unlocked?'اضغط للفتح':'مقفلة'}</span>${claimed&&count>1?`<small>مرات الاستحقاق: ${count}</small>`:''}${claimed&&date?`<small>استحقت: ${date}</small>`:!unlocked&&item.hint?`<small class="reward-hint">${item.hint}</small>`:''}</div>
    </article>`;
  }).join('');
}

function featureMarkup(status,learnerId,claims){
  const summary=status?.summary||{},item=latestRewardPresentation(learnerId,summary),unlocked=rewardPresentationUnlocked(item,summary),claimed=unlocked&&claims.has(item.id),latest=rewardPresentationUnlock(item,summary),date=formatUnlockDate(latest?.at);
  const art=claimed?imageMarkup(item.graphicKey,'reward-feature-image'):unlocked?mysteryChestMarkup():'<div class="reward-locked-placeholder" aria-hidden="true">?</div>';
  return `<div class="reward-feature-label">${unlocked&&!claimed?'لديك صندوق جديد!':'الجائزة المميزة'}</div><div class="reward-feature-art">${art}</div><h2>${claimed?item.label:unlocked?'مفاجأة بانتظارك':'الجائزة القادمة'}</h2><p>${claimed?'إنجاز محفوظ في خزانتك':unlocked?'لن تظهر الجائزة حتى تفتح الصندوق':item.hint||'واصل التدريب لفتح هذه الجائزة'}</p>${claimed&&date?`<small>استحقت: ${date}</small>`:''}<div class="reward-feature-state" data-unlocked="${unlocked}" data-claimed="${claimed}">${claimed?'تم جمعها':unlocked?'جاهزة للفتح':'قريبًا'}</div>${unlocked&&!claimed?`<button type="button" class="reward-feature-open" data-feature-reward data-reward-id="${item.id}" data-unlocked="true" data-claimed="false" data-reward-label="${item.label}" data-reward-graphic-key="${item.graphicKey}">افتح الصندوق</button>`:''}`;
}
function challengeMarkup(status){
  const daily=Array.isArray(status?.challenges?.daily)?status.challenges.daily:[],weekly=Array.isArray(status?.challenges?.weekly)?status.challenges.weekly:[],items=[...daily,...weekly];
  const rows=items.map(item=>`<div class="reward-challenge-item" data-complete="${Boolean(item?.complete)}"><div><strong>${item?.label||'تحدي تعلم'}</strong><span>${ratioMarkup(safeNumber(item?.current),Math.max(1,safeNumber(item?.target)||1))}</span></div><div class="reward-challenge-bar" role="progressbar" aria-label="${item?.label||'تقدم التحدي'}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100,safeNumber(item?.pct))}"><i style="width:${Math.min(100,safeNumber(item?.pct))}%"></i></div></div>`).join('');
  const done=items.filter(item=>item?.complete).length;
  return `<div class="reward-challenge-heading"><span>تحدي هذا الأسبوع</span><strong>${ratioMarkup(done,items.length)}</strong></div><p>أكمل مهامك، والجوائز تُفتح تلقائيًا من نتائجك الحقيقية.</p><div class="reward-challenge-list">${rows||'<div class="reward-challenge-empty">ابدأ التدريب ليظهر تقدمك هنا.</div>'}</div><button type="button" id="rewardChallengeStart" class="reward-challenge-start">ابدأ التحدي</button>`;
}

export function createRewardCabinetController({capabilityRegistry,getStatus,onExit}={}){
  let activeLearner=null,bound=false;
  function capability(learnerId){return capabilityRegistry?.get?.(learnerId)||null;}
  function showOnly(id){document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id===id));window.scrollTo(0,0);}
  function closeReveal(view){const modal=view?.querySelector?.('#rewardReveal');if(modal){modal.hidden=true;modal.dataset.graphicKey='';}}
  async function revealReward(view,card){
    if(card?.dataset?.unlocked!=='true'||card?.dataset?.claimed==='true')return;
    const modal=view.querySelector('#rewardReveal'),prize=modal?.querySelector('[data-reward-reveal-prize]'),stage=modal?.querySelector('[data-reward-reveal-stage]'),image=modal?.querySelector('[data-reward-reveal-image]'),title=modal?.querySelector('[data-reward-reveal-title]');if(!modal||!prize||!stage||!image||!title)return;
    modal.hidden=false;modal.dataset.graphicKey=card.dataset.rewardGraphicKey||'';modal.dataset.rewardId=card.dataset.rewardId||'';stage.hidden=false;prize.hidden=true;title.textContent=card.dataset.rewardLabel||'';image.removeAttribute('src');modal.querySelector('[data-reward-chest]')?.focus();
  }
  async function openChest(view){
    const modal=view?.querySelector?.('#rewardReveal'),key=modal?.dataset?.graphicKey,rewardId=modal?.dataset?.rewardId;if(!modal||!key||!rewardId)return;
    saveClaim(activeLearner,rewardId);
    const chest=modal.querySelector('[data-reward-chest]');chest?.classList.add('opening');
    const url=await getRewardImageUrl(key);const image=modal.querySelector('[data-reward-reveal-image]');if(url&&image)image.src=url;
    setTimeout(()=>{modal.querySelector('[data-reward-reveal-stage]').hidden=true;modal.querySelector('[data-reward-reveal-prize]').hidden=false;chest?.classList.remove('opening');},260);
  }
  function bindDynamic(view){
    view.querySelectorAll('[data-reward-learner]').forEach(button=>{button.onclick=()=>open(button.dataset.rewardLearner);});
    view.querySelectorAll('.reward-cabinet-card.ready').forEach(card=>{card.onclick=()=>revealReward(view,card);card.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();revealReward(view,card);}};});
    const featureOpen=view.querySelector('[data-feature-reward]');if(featureOpen)featureOpen.onclick=()=>revealReward(view,featureOpen);
    const challenge=view.querySelector('#rewardChallengeStart');if(challenge)challenge.onclick=close;
    const chest=view.querySelector('[data-reward-chest]');if(chest)chest.onclick=()=>openChest(view);
    view.querySelectorAll('[data-reward-reveal-close]').forEach(button=>button.onclick=()=>closeReveal(view));
    const modal=view.querySelector('#rewardReveal');if(modal)modal.onclick=event=>{if(event.target===modal)closeReveal(view);};
  }
  function render(learnerId,status){
    const learner=capability(learnerId),view=document.getElementById('rewardCabinetView');if(!learner||!view)return false;view.dataset.learner=learnerId;
    const summary=status?.summary||{},catalog=rewardPresentationCatalog(learnerId),claims=loadClaims(learnerId),earnedKinds=catalog.filter(item=>rewardPresentationUnlocked(item,summary)).length,openedKinds=catalog.filter(item=>rewardPresentationUnlocked(item,summary)&&claims.has(item.id)).length,total=safeNumber(summary.total),streak=safeNumber(status?.trends?.streakDays),cups=rewardCount(summary,'mastery-cup')+rewardCount(summary,'weekly-cup'),feature=latestRewardPresentation(learnerId,summary);
    view.querySelectorAll('[data-reward-learner]').forEach(button=>{const active=button.dataset.rewardLearner===learnerId;button.classList.toggle('active',active);button.setAttribute('aria-current',active?'true':'false');});
    const openedRatio=learnerId?ratioMarkup(openedKinds,catalog.length):ratioMarkup(openedKinds,REWARD_CATALOG.length);
    document.getElementById('rewardCabinetSummary').innerHTML=`<div><span>جوائز جُمعت</span><strong>${openedRatio}</strong></div><div><span>إجمالي الجوائز</span><strong>${total}</strong></div><div><span>أفضل سلسلة</span><strong>${streak} يوم</strong></div><div><span>الكؤوس</span><strong>${cups}</strong></div>`;
    document.getElementById('rewardCabinetFeature').innerHTML=featureMarkup(status,learnerId,claims);
    document.getElementById('rewardCabinetGrid').innerHTML=buildRewardCabinetMarkup({status,learnerId,excludeRewardId:feature.id,claimedRewardIds:claims});
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
    for(const item of rewardCapabilities(capabilityRegistry))ensureOpenButton(item,open);
    bindDynamic(view);
    if(!bound){document.getElementById('rewardCabinetBack')?.addEventListener('click',close);bound=true;}
    return true;
  }
  return Object.freeze({start,open,close,leave,refresh,getActiveLearner:()=>activeLearner});
}
