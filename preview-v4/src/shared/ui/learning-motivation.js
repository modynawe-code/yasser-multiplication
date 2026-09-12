import { REWARD_BY_ID } from '../rewards/reward-catalog.js';
import { GAME_REWARD_PRESENTATIONS,latestRewardPresentation,rewardPresentationUnlocked } from './game-inspired-rewards.js';
import { getRewardImageUrl } from './reward-assets.js';

function safeNumber(value){const number=Number(value);return Number.isFinite(number)?Math.max(0,number):0;}
function safePct(value){return Math.max(0,Math.min(100,Math.round(safeNumber(value))));}
function rewardLabel(summary,learnerId){
  const id=String(learnerId||'').trim().toLowerCase();
  if(GAME_REWARD_PRESENTATIONS[id]){
    const presentation=latestRewardPresentation(id,summary);
    if(presentation&&rewardPresentationUnlocked(presentation,summary))return presentation.label;
  }
  const unlocks=Array.isArray(summary?.unlocks)?summary.unlocks:[];
  const latest=unlocks[unlocks.length-1];
  return latest?REWARD_BY_ID[latest.rewardId]?.label||'جائزة جديدة':'ابدأ أول إنجاز';
}
function ensureStyle(){
  if(!document.querySelector('link[data-module-style="learning-motivation"]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href='src/shared/ui/learning-motivation.css';link.dataset.moduleStyle='learning-motivation';document.head.appendChild(link);
  }
  if(!document.querySelector('link[data-module-style="game-inspired-rewards"]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href='src/shared/ui/game-inspired-rewards.css';link.dataset.moduleStyle='game-inspired-rewards';document.head.appendChild(link);
  }
}
function slotId(learnerId){return `learningMotivation-${String(learnerId||'')}`;}
function ensureSlot(learnerId,anchorSelector){
  const id=String(learnerId||''),selector=String(anchorSelector||'').trim();
  if(!id||!selector)return null;
  const existing=document.getElementById(slotId(id));if(existing)return existing;
  const anchor=document.querySelector(selector);if(!anchor)return null;
  const slot=document.createElement('div');slot.id=slotId(id);slot.className='learning-motivation-slot';slot.dataset.learner=id;anchor.insertAdjacentElement('afterend',slot);return slot;
}
let rewardToastTimer=null,gameRewardListenerBound=false;
async function announceReward(learnerId,status={}){
  const id=String(learnerId||'').trim().toLowerCase();if(!GAME_REWARD_PRESENTATIONS[id]||safeNumber(status?.added)<1)return false;
  const item=latestRewardPresentation(id,status?.summary||{});if(!item||!rewardPresentationUnlocked(item,status?.summary||{}))return false;
  let toast=document.getElementById('learningRewardToast');
  if(!toast){toast=document.createElement('aside');toast.id='learningRewardToast';toast.className='learning-reward-toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');document.body.appendChild(toast);}
  toast.dataset.learner=id;toast.classList.remove('show');
  toast.innerHTML=`<div class="learning-reward-toast-art"><img alt="" decoding="async"></div><div class="learning-reward-toast-copy"><span>جائزة جديدة</span><strong>${item.label}</strong><small>أضيفت إلى خزانة الجوائز</small></div>`;
  const image=toast.querySelector('img'),url=await getRewardImageUrl(item.graphicKey);if(image&&url)image.src=url;
  globalThis.requestAnimationFrame?.(()=>toast.classList.add('show'));
  if(rewardToastTimer)clearTimeout(rewardToastTimer);rewardToastTimer=setTimeout(()=>toast.classList.remove('show'),3600);return true;
}
function ensureGameRewardListener(){
  if(gameRewardListenerBound||typeof globalThis.addEventListener!=='function')return;
  globalThis.addEventListener('family:reward-unlocked',event=>{
    const detail=event?.detail||{},learnerId=detail?.learnerId||detail?.event?.learnerId;
    announceReward(learnerId,{added:detail?.result?.added||0,summary:detail?.result?.summary||{}});
  });
  gameRewardListenerBound=true;
}

export function buildLearningMotivationMarkup(status={},learnerId=null){
  const daily=status?.challenges?.daily?.[0]||{},weekly=Array.isArray(status?.challenges?.weekly)?status.challenges.weekly:[];
  const dailyCurrent=safeNumber(daily.current),dailyTarget=Math.max(1,safeNumber(daily.target)||1),dailyPct=safePct(daily.pct??dailyCurrent/dailyTarget*100);
  const weeklyDone=weekly.filter(item=>item?.complete).length,weeklyTarget=Math.max(1,weekly.length||3),weeklyPct=safePct(weeklyDone/weeklyTarget*100);
  const rewards=safeNumber(status?.summary?.total),streak=safeNumber(status?.trends?.streakDays),latest=rewardLabel(status?.summary,learnerId);
  return `<section class="learning-motivation" aria-label="التحديات والجوائز">
    <article class="learning-motivation-item" data-complete="${dailyCurrent>=dailyTarget}">
      <span>تحدي اليوم</span><strong>${dailyCurrent} / ${dailyTarget}</strong>
      <div class="learning-motivation-bar" role="progressbar" aria-label="تقدم تحدي اليوم" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${dailyPct}"><i style="width:${dailyPct}%"></i></div>
    </article>
    <article class="learning-motivation-item" data-complete="${weeklyDone>=weeklyTarget}">
      <span>تحدي الأسبوع</span><strong>${weeklyDone} / ${weeklyTarget}</strong>
      <div class="learning-motivation-bar" role="progressbar" aria-label="تقدم تحدي الأسبوع" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${weeklyPct}"><i style="width:${weeklyPct}%"></i></div>
    </article>
    <article class="learning-motivation-item reward-summary">
      <span>جوائزي</span><strong>${rewards}</strong><small>${latest} • استمرار ${streak} يوم</small>
    </article>
  </section>`;
}

export function renderLearningMotivation({learnerId,status,anchorSelector}={}){
  ensureStyle();ensureGameRewardListener();const slot=ensureSlot(String(learnerId||''),anchorSelector);if(!slot)return false;slot.innerHTML=buildLearningMotivationMarkup(status,learnerId);announceReward(learnerId,status);return true;
}
