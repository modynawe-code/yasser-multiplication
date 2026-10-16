import { MASHAAL_REWARD_CATALOG } from '../rewards/mashaal-reward-catalog.js';
import { mashaalRewardGraphicMarkup } from './mashaal-reward-graphics.js';
import { MASHAAL_TREASURE_THEME,mashaalRewardScopeCopy,mashaalRewardStateLabel } from './mashaal-reward-theme.js';
import { createRewardCollectionViewState } from '../../../shared/ui/reward-collection-view-state.js';
import { rewardRequirementProgress } from '../../../shared/rewards/reward-requirement-progress.js';

const byId=id=>document.getElementById(id);
const REWARD_BY_ID=Object.freeze(Object.fromEntries(MASHAAL_REWARD_CATALOG.map(item=>[item.id,item])));
const TIER_COPY=Object.freeze({
  basic:Object.freeze({title:'الجوائز الأساسية',subtitle:'ابدئي بهذه الكنوز واجمعيها خطوة خطوة'}),
  premium:Object.freeze({title:'جوائز بيريموم',subtitle:'كنوز أميرة تحتاج إنجازات أكبر'})
});

function ensureStyle(){
  for(const [name,href] of [
    ['mashaal-treasures','src/modules/mashaal/ui/mashaal-treasures.css'],
    ['mashaal-reward-tiers','src/modules/mashaal/ui/mashaal-reward-tiers.css']
  ]){
    if(document.querySelector(`link[data-module-style="${name}"]`))continue;
    const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.moduleStyle=name;document.head.appendChild(link);
  }
}
function safeSummary(summary){return summary&&typeof summary==='object'?summary:{total:0,counts:{},unlocks:[],progress:{}};}
function latestUnlock(summary){return [...(summary?.unlocks||[])].sort((a,b)=>new Date(b?.at||0)-new Date(a?.at||0))[0]||null;}
function unlocked(summary,rewardId){return Number(summary?.counts?.[rewardId]||0)>0;}
function showOnly(id){document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id===id));window.scrollTo(0,0);}
function unseenRewardIds(summary,viewState){
  const ids=new Set();
  for(const unlock of summary?.unlocks||[])if(viewState?.isNew?.(unlock)&&unlock?.rewardId)ids.add(unlock.rewardId);
  return ids;
}
function tierLabel(reward){return reward?.tier==='premium'?'بيريموم':'أساسية';}

function ensureOpenButton(){
  let button=byId('mashaalTreasuresOpen');if(button)return button;
  const anchor=document.querySelector('#mashaalHomeView .mashaal-world-prompt')||document.querySelector('#mashaalHomeView .mashaal-domain-grid');if(!anchor)return null;
  button=document.createElement('button');button.id='mashaalTreasuresOpen';button.type='button';button.className='mashaal-treasures-open';button.innerHTML=`<span class="mark" aria-hidden="true"></span><strong>${MASHAAL_TREASURE_THEME.title}</strong><span>${MASHAAL_TREASURE_THEME.openCta}</span>`;
  anchor.insertAdjacentElement('afterend',button);return button;
}

function ensureView(){
  let view=byId('mashaalTreasureView');if(view)return view;
  const main=document.querySelector('main');if(!main)return null;
  view=document.createElement('section');view.id='mashaalTreasureView';view.className='view mashaal-treasure-view';view.dataset.theme=MASHAAL_TREASURE_THEME.id;
  view.innerHTML=`<div class="mashaal-treasure-shell">
    <header class="mashaal-treasure-head">
      <button class="mashaal-treasure-back" id="mashaalTreasureBack" type="button">رجوع</button>
      <div class="mashaal-treasure-head-copy"><span>${MASHAAL_TREASURE_THEME.eyebrow}</span><h1>${MASHAAL_TREASURE_THEME.title}</h1></div>
      <div class="mashaal-treasure-count" id="mashaalTreasureCount" aria-label="عدد الجوائز المفتوحة"></div>
    </header>
    <section class="mashaal-treasure-feature" id="mashaalTreasureFeature" aria-label="${MASHAAL_TREASURE_THEME.featureAria}"></section>
    <div class="mashaal-treasure-tiers" id="mashaalTreasureTiers" aria-label="${MASHAAL_TREASURE_THEME.collectionAria}"></div>
  </div>`;
  main.appendChild(view);
  return view;
}

function ensurePopup(){
  let popup=byId('mashaalRewardPop');if(popup)return popup;
  popup=document.createElement('div');popup.id='mashaalRewardPop';popup.className='mashaal-reward-pop';popup.hidden=true;popup.setAttribute('role','dialog');popup.setAttribute('aria-modal','true');popup.setAttribute('aria-labelledby','mashaalRewardPopTitle');
  popup.innerHTML='<div class="mashaal-reward-pop-card"><div class="mashaal-reward-pop-glow" aria-hidden="true"></div><div id="mashaalRewardPopArt"></div><span class="mashaal-reward-pop-kicker">كنز جديد</span><h2 id="mashaalRewardPopTitle">كنز جديد</h2><p id="mashaalRewardPopText"></p><button class="mashaal-reward-pop-close" id="mashaalRewardPopClose" type="button">رائع</button></div>';
  document.body.appendChild(popup);return popup;
}

function featureMarkup(summary,viewState){
  const latest=latestUnlock(summary),reward=REWARD_BY_ID[latest?.rewardId]||MASHAAL_REWARD_CATALOG[0],isOpen=Boolean(latest&&reward),isNew=Boolean(latest&&viewState?.isNew?.(latest));
  const label=isNew?MASHAAL_TREASURE_THEME.feature.latestNewLabel:(isOpen?MASHAAL_TREASURE_THEME.feature.latestLabel:MASHAAL_TREASURE_THEME.feature.firstLabel);
  const body=isOpen?MASHAAL_TREASURE_THEME.feature.latestBody:MASHAAL_TREASURE_THEME.feature.firstBody;
  return `<div class="mashaal-treasure-feature-art ${isNew?'is-new':''}">${mashaalRewardGraphicMarkup(reward.graphicKey,{locked:!isOpen,assetPath:reward.assetPath})}</div><div class="mashaal-treasure-feature-copy"><small>${label}</small><h2>${reward.label}</h2><p>${body}</p><span class="mashaal-tier-chip ${reward.tier||'basic'}">${tierLabel(reward)}</span>${isOpen?`<span class="mashaal-treasure-reason">${mashaalRewardScopeCopy(reward.scope)}</span>`:''}</div>`;
}

function requirementMarkup(reward,metrics,isOpen){
  const detail=rewardRequirementProgress(reward,metrics);
  const criteria=detail.criteria.map(item=>`<li class="${item.complete?'complete':'pending'}"><span>${item.label}</span><b>${item.current} / ${item.target}</b><small>${item.complete?'تم':`باقي ${item.remaining}`}</small></li>`).join('');
  return `<div class="mashaal-reward-requirements"><strong>كيف تحصلين عليها؟</strong><ul>${criteria}</ul><div class="mashaal-reward-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${detail.percent}"><span style="width:${detail.percent}%"></span></div><em>${isOpen?'اكتملت الشروط':`التقدم ${detail.percent}%`}</em></div>`;
}

function cardMarkup(reward,summary,viewState,newIds){
  const isOpen=unlocked(summary,reward.id),isNew=newIds.has(reward.id),count=Number(summary?.counts?.[reward.id]||0);
  return `<article class="mashaal-treasure-card ${isOpen?'unlocked':'locked'} ${isNew?'new':''} ${reward.tier==='premium'?'premium':''}" data-reward-id="${reward.id}" data-reward-tier="${reward.tier||'basic'}" data-reward-state="${isNew?'new':(isOpen?'unlocked':'locked')}">
    <span class="state">${mashaalRewardStateLabel({unlocked:isOpen,isNew})}</span>
    <span class="mashaal-tier-chip ${reward.tier||'basic'}">${tierLabel(reward)}</span>
    ${mashaalRewardGraphicMarkup(reward.graphicKey,{locked:!isOpen,assetPath:reward.assetPath})}
    <strong>${reward.label}</strong><span class="reason">${mashaalRewardScopeCopy(reward.scope)}</span>
    ${requirementMarkup(reward,summary?.progress||{},isOpen)}
    ${count>1?`<small class="mashaal-reward-count">حصلتي عليها ${count} مرات</small>`:''}
  </article>`;
}

function tiersMarkup(summary,viewState){
  const newIds=unseenRewardIds(summary,viewState);
  return ['basic','premium'].map(tier=>{
    const copy=TIER_COPY[tier],items=MASHAAL_REWARD_CATALOG.filter(reward=>(reward.tier||'basic')===tier);
    const opened=items.filter(item=>unlocked(summary,item.id)).length;
    return `<section class="mashaal-treasure-tier ${tier}" data-reward-tier-section="${tier}">
      <header><div><h2>${copy.title}</h2><p>${copy.subtitle}</p></div><span>${opened} / ${items.length}</span></header>
      <div class="mashaal-treasure-grid">${items.map(reward=>cardMarkup(reward,summary,viewState,newIds)).join('')}</div>
    </section>`;
  }).join('');
}

export function createMashaalTreasureController({getSummary,onExit,viewState=createRewardCollectionViewState({learnerId:'mashaal'})}={}){
  let active=false,bound=false,popupUnlock=null;
  function summary(){return safeSummary(typeof getSummary==='function'?getSummary():{});}
  function render(){
    const data=summary(),opened=MASHAAL_REWARD_CATALOG.filter(item=>unlocked(data,item.id)).length;
    if(byId('mashaalTreasureCount'))byId('mashaalTreasureCount').textContent=`${opened} / ${MASHAAL_REWARD_CATALOG.length}`;
    if(byId('mashaalTreasureFeature'))byId('mashaalTreasureFeature').innerHTML=featureMarkup(data,viewState);
    if(byId('mashaalTreasureTiers'))byId('mashaalTreasureTiers').innerHTML=tiersMarkup(data,viewState);
    return data;
  }
  function markCurrentSeen(){const latest=latestUnlock(summary());if(latest)viewState?.markSeen?.(latest);}
  function open(){
    active=true;document.body.classList.remove('hub-mode','khaled-mode','family-parent-mode','games-mode','reward-cabinet-mode');document.body.classList.add('mashaal-mode','mashaal-rewards-mode');render();showOnly('mashaalTreasureView');return true;
  }
  function leave(){active=false;document.body.classList.remove('mashaal-rewards-mode');byId('mashaalRewardPop')?.setAttribute('hidden','');popupUnlock=null;}
  function close(){markCurrentSeen();leave();if(typeof onExit==='function')onExit();}
  function hidePopup(){const popup=byId('mashaalRewardPop');if(popup)popup.hidden=true;if(popupUnlock)viewState?.markSeen?.(popupUnlock);popupUnlock=null;render();}
  function announce({result,cue}={}){
    const data=safeSummary(result?.summary||summary()),latest=latestUnlock(data),reward=REWARD_BY_ID[latest?.rewardId];if(!reward)return false;
    popupUnlock=latest;render();const popup=ensurePopup(),art=byId('mashaalRewardPopArt'),title=byId('mashaalRewardPopTitle'),text=byId('mashaalRewardPopText');
    if(art)art.innerHTML=mashaalRewardGraphicMarkup(reward.graphicKey,{assetPath:reward.assetPath});if(title)title.textContent=reward.label;if(text)text.textContent=cue?.text||'فتحتي كنزًا جديدًا';popup.hidden=false;return true;
  }
  function start(){
    ensureStyle();ensureView();ensurePopup();const openButton=ensureOpenButton();
    if(!bound){openButton?.addEventListener('click',open);byId('mashaalTreasureBack')?.addEventListener('click',close);byId('mashaalRewardPopClose')?.addEventListener('click',hidePopup);bound=true;}
    render();return true;
  }
  return Object.freeze({start,open,close,leave,render,announce,isActive:()=>active});
}
