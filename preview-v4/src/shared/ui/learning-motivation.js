import { REWARD_BY_ID } from '../rewards/reward-catalog.js';

function safeNumber(value){const number=Number(value);return Number.isFinite(number)?Math.max(0,number):0;}
function safePct(value){return Math.max(0,Math.min(100,Math.round(safeNumber(value))));}
function rewardLabel(summary){
  const unlocks=Array.isArray(summary?.unlocks)?summary.unlocks:[];
  const latest=unlocks[unlocks.length-1];
  return latest?REWARD_BY_ID[latest.rewardId]?.label||'جائزة جديدة':'ابدأ أول إنجاز';
}
function ensureStyle(){
  if(document.querySelector('link[data-module-style="learning-motivation"]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='src/shared/ui/learning-motivation.css';link.dataset.moduleStyle='learning-motivation';document.head.appendChild(link);
}
function slotId(learnerId){return `learningMotivation-${String(learnerId||'')}`;}
function ensureSlot(learnerId,anchorSelector){
  const id=String(learnerId||''),selector=String(anchorSelector||'').trim();
  if(!id||!selector)return null;
  const existing=document.getElementById(slotId(id));if(existing)return existing;
  const anchor=document.querySelector(selector);if(!anchor)return null;
  const slot=document.createElement('div');slot.id=slotId(id);slot.className='learning-motivation-slot';slot.dataset.learner=id;anchor.insertAdjacentElement('afterend',slot);return slot;
}

export function buildLearningMotivationMarkup(status={}){
  const daily=status?.challenges?.daily?.[0]||{},weekly=Array.isArray(status?.challenges?.weekly)?status.challenges.weekly:[];
  const dailyCurrent=safeNumber(daily.current),dailyTarget=Math.max(1,safeNumber(daily.target)||1),dailyPct=safePct(daily.pct??dailyCurrent/dailyTarget*100);
  const weeklyDone=weekly.filter(item=>item?.complete).length,weeklyTarget=Math.max(1,weekly.length||3),weeklyPct=safePct(weeklyDone/weeklyTarget*100);
  const rewards=safeNumber(status?.summary?.total),streak=safeNumber(status?.trends?.streakDays),latest=rewardLabel(status?.summary);
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
  ensureStyle();const slot=ensureSlot(String(learnerId||''),anchorSelector);if(!slot)return false;slot.innerHTML=buildLearningMotivationMarkup(status);return true;
}
