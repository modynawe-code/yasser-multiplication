import { REWARD_CATALOG } from '../rewards/reward-catalog.js';

const LEARNERS=Object.freeze({
  yasser:Object.freeze({name:'ياسر',slotId:'yasserMotivation',buttonId:'yasserRewardsBtn'}),
  khaled:Object.freeze({name:'خالد',slotId:'khaledMotivation',buttonId:'khaledRewardsBtn'})
});

function safeNumber(value){const number=Number(value);return Number.isFinite(number)?Math.max(0,number):0;}
function rewardAssetPath(learnerId,graphicKey){return `assets/rewards/${learnerId}/${graphicKey}.png`;}
function rewardCount(summary,rewardId){return safeNumber(summary?.counts?.[rewardId]);}
function latestUnlock(summary,rewardId){
  const unlocks=Array.isArray(summary?.unlocks)?summary.unlocks:[];
  return [...unlocks].reverse().find(item=>item?.rewardId===rewardId)||null;
}
function formatUnlockDate(value){
  if(!value)return'';
  try{return new Date(value).toLocaleDateString('ar-SA',{month:'short',day:'numeric'});}catch{return'';}
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
    <header class="reward-cabinet-head"><button class="icon-btn" id="rewardCabinetBack" data-nav="back">رجوع</button><div><div class="kicker">جوائزي</div><h1 id="rewardCabinetTitle">خزانة الجوائز</h1><p id="rewardCabinetSubtitle"></p></div><span class="reward-cabinet-head-spacer" aria-hidden="true"></span></header>
    <section class="reward-cabinet-summary" id="rewardCabinetSummary"></section>
    <section class="reward-cabinet-grid" id="rewardCabinetGrid" aria-label="الجوائز"></section>
  </div>`;
  main.appendChild(view);return view;
}
function ensureOpenButton(learnerId,onOpen){
  const learner=LEARNERS[learnerId],slot=document.getElementById(learner?.slotId);if(!learner||!slot)return null;
  let button=document.getElementById(learner.buttonId);
  if(!button){
    button=document.createElement('button');button.id=learner.buttonId;button.className='reward-cabinet-open';button.type='button';button.textContent='خزانة الجوائز';slot.insertAdjacentElement('afterend',button);
  }
  button.onclick=()=>onOpen(learnerId);return button;
}

export function buildRewardCabinetMarkup({learnerId='yasser',status={}}={}){
  const id=LEARNERS[learnerId]?learnerId:'yasser',summary=status?.summary||{},counts=summary?.counts||{};
  return REWARD_CATALOG.map(item=>{
    const count=rewardCount({counts},item.id),unlocked=count>0,latest=latestUnlock(summary,item.id),date=formatUnlockDate(latest?.at),asset=rewardAssetPath(id,item.graphicKey);
    return `<article class="reward-cabinet-card ${unlocked?'unlocked':'locked'}" data-reward-id="${item.id}" data-unlocked="${unlocked}">
      <div class="reward-cabinet-art"><img src="${asset}" alt="" loading="lazy" decoding="async" /><span class="reward-cabinet-art-fallback" aria-hidden="true"></span>${unlocked?'':'<span class="reward-cabinet-lock">مقفلة</span>'}</div>
      <div class="reward-cabinet-copy"><strong>${item.label}</strong><span>${unlocked?`مفتوحة${count>1?` × ${count}`:''}`:'حقق الإنجاز لفتحها'}</span>${date?`<small>آخر فتح: ${date}</small>`:''}</div>
    </article>`;
  }).join('');
}

export function createRewardCabinetController({getStatus,onExit}={}){
  let activeLearner=null,bound=false;
  function showOnly(id){document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id===id));window.scrollTo(0,0);}
  function render(learnerId,status){
    const learner=LEARNERS[learnerId],view=document.getElementById('rewardCabinetView');if(!learner||!view)return false;view.dataset.learner=learnerId;
    const summary=status?.summary||{},openedKinds=REWARD_CATALOG.filter(item=>rewardCount(summary,item.id)>0).length,total=safeNumber(summary.total),streak=safeNumber(status?.trends?.streakDays),weekly=status?.challenges?.weekly||[],weeklyDone=weekly.filter(item=>item?.complete).length;
    document.getElementById('rewardCabinetTitle').textContent=`خزانة ${learner.name}`;
    document.getElementById('rewardCabinetSubtitle').textContent='جوائز دائمة منفصلة عن درجة الإتقان الأكاديمي.';
    document.getElementById('rewardCabinetSummary').innerHTML=`<div><span>الجوائز المفتوحة</span><strong>${openedKinds} / ${REWARD_CATALOG.length}</strong></div><div><span>إجمالي الجوائز</span><strong>${total}</strong></div><div><span>أفضل استمرار حالي</span><strong>${streak} يوم</strong></div><div><span>أهداف الأسبوع</span><strong>${weeklyDone} / ${Math.max(weekly.length,3)}</strong></div>`;
    const grid=document.getElementById('rewardCabinetGrid');grid.innerHTML=buildRewardCabinetMarkup({learnerId,status});
    grid.querySelectorAll('img').forEach(image=>image.addEventListener('error',()=>{image.hidden=true;image.closest('.reward-cabinet-art')?.classList.add('asset-missing');},{once:true}));
    return true;
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
    ensureStyle();if(!ensureView())return false;
    ensureOpenButton('yasser',open);ensureOpenButton('khaled',open);
    if(!bound){document.getElementById('rewardCabinetBack')?.addEventListener('click',close);bound=true;}
    return true;
  }
  return Object.freeze({start,open,close,leave,refresh,getActiveLearner:()=>activeLearner});
}
