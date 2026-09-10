import { MASHAAL_REWARD_CATALOG } from '../rewards/mashaal-reward-catalog.js';
import { mashaalRewardGraphicMarkup } from './mashaal-reward-graphics.js';

const byId=id=>document.getElementById(id);
const REWARD_BY_ID=Object.freeze(Object.fromEntries(MASHAAL_REWARD_CATALOG.map(item=>[item.id,item])));

function ensureStyle(){
  if(document.querySelector('link[data-module-style="mashaal-treasures"]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='src/modules/mashaal/ui/mashaal-treasures.css';link.dataset.moduleStyle='mashaal-treasures';document.head.appendChild(link);
}
function safeSummary(summary){return summary&&typeof summary==='object'?summary:{total:0,counts:{},unlocks:[]};}
function latestUnlock(summary){return [...(summary?.unlocks||[])].sort((a,b)=>new Date(b?.at||0)-new Date(a?.at||0))[0]||null;}
function unlocked(summary,rewardId){return Number(summary?.counts?.[rewardId]||0)>0;}
function showOnly(id){document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id===id));window.scrollTo(0,0);}

function ensureOpenButton(){
  let button=byId('mashaalTreasuresOpen');if(button)return button;
  const anchor=document.querySelector('#mashaalHomeView .mashaal-world-prompt')||document.querySelector('#mashaalHomeView .mashaal-domain-grid');if(!anchor)return null;
  button=document.createElement('button');button.id='mashaalTreasuresOpen';button.type='button';button.className='mashaal-treasures-open';button.innerHTML='<span class="mark" aria-hidden="true"></span><strong>كنوز مشاعل</strong><span>شوفي جوائزك</span>';
  anchor.insertAdjacentElement('afterend',button);return button;
}

function ensureView(){
  let view=byId('mashaalTreasureView');if(view)return view;
  const main=document.querySelector('main');if(!main)return null;
  view=document.createElement('section');view.id='mashaalTreasureView';view.className='view mashaal-treasure-view';
  view.innerHTML=`<div class="mashaal-treasure-shell">
    <header class="mashaal-treasure-head">
      <button class="mashaal-treasure-back" id="mashaalTreasureBack" type="button">رجوع</button>
      <div class="mashaal-treasure-head-copy"><span>كل محاولة لها قيمة</span><h1>كنوز مشاعل</h1></div>
      <div class="mashaal-treasure-count" id="mashaalTreasureCount" aria-label="عدد الجوائز المفتوحة"></div>
    </header>
    <section class="mashaal-treasure-feature" id="mashaalTreasureFeature" aria-label="آخر جائزة"></section>
    <section class="mashaal-treasure-grid" id="mashaalTreasureGrid" aria-label="مجموعة كنوز مشاعل"></section>
  </div>`;
  main.appendChild(view);
  return view;
}

function ensurePopup(){
  let popup=byId('mashaalRewardPop');if(popup)return popup;
  popup=document.createElement('div');popup.id='mashaalRewardPop';popup.className='mashaal-reward-pop';popup.hidden=true;popup.setAttribute('role','dialog');popup.setAttribute('aria-modal','true');popup.setAttribute('aria-labelledby','mashaalRewardPopTitle');
  popup.innerHTML='<div class="mashaal-reward-pop-card"><div id="mashaalRewardPopArt"></div><h2 id="mashaalRewardPopTitle">كنز جديد</h2><p id="mashaalRewardPopText"></p><button class="mashaal-reward-pop-close" id="mashaalRewardPopClose" type="button">رائع</button></div>';
  document.body.appendChild(popup);return popup;
}

function featureMarkup(summary){
  const latest=latestUnlock(summary),reward=REWARD_BY_ID[latest?.rewardId]||MASHAAL_REWARD_CATALOG[0],isOpen=Boolean(latest&&reward);
  return `${mashaalRewardGraphicMarkup(reward.graphicKey,{locked:!isOpen})}<div class="mashaal-treasure-feature-copy"><small>${isOpen?'آخر كنز فتحتيه':'أول كنز ينتظرك'}</small><h2>${reward.label}</h2><p>${isOpen?'محفوظ في كنوزك، ويفتح مع إنجاز حقيقي.':'ابدئي اللعب، وكل محاولة وإنجاز ممكن يفتح لك كنزًا.'}</p></div>`;
}

function gridMarkup(summary){
  const latest=latestUnlock(summary)?.rewardId||null;
  return MASHAAL_REWARD_CATALOG.map(reward=>{
    const isOpen=unlocked(summary,reward.id),count=Number(summary?.counts?.[reward.id]||0);
    return `<article class="mashaal-treasure-card ${isOpen?'unlocked':'locked'} ${latest===reward.id?'latest':''}" data-reward-id="${reward.id}">
      <span class="state">${isOpen?'مفتوح':'مقفل'}</span>
      ${mashaalRewardGraphicMarkup(reward.graphicKey,{locked:!isOpen})}
      <strong>${reward.label}</strong>${count>1?`<small>حصلتي عليها ${count} مرات</small>`:''}
    </article>`;
  }).join('');
}

export function createMashaalTreasureController({getSummary,onExit}={}){
  let active=false,bound=false;
  function summary(){return safeSummary(typeof getSummary==='function'?getSummary():{});}
  function render(){
    const data=summary(),opened=MASHAAL_REWARD_CATALOG.filter(item=>unlocked(data,item.id)).length;
    if(byId('mashaalTreasureCount'))byId('mashaalTreasureCount').textContent=`${opened} / ${MASHAAL_REWARD_CATALOG.length}`;
    if(byId('mashaalTreasureFeature'))byId('mashaalTreasureFeature').innerHTML=featureMarkup(data);
    if(byId('mashaalTreasureGrid'))byId('mashaalTreasureGrid').innerHTML=gridMarkup(data);
    return data;
  }
  function open(){
    active=true;document.body.classList.remove('hub-mode','khaled-mode','family-parent-mode','games-mode','reward-cabinet-mode');document.body.classList.add('mashaal-mode','mashaal-rewards-mode');render();showOnly('mashaalTreasureView');return true;
  }
  function leave(){active=false;document.body.classList.remove('mashaal-rewards-mode');byId('mashaalRewardPop')?.setAttribute('hidden','');}
  function close(){leave();if(typeof onExit==='function')onExit();}
  function hidePopup(){const popup=byId('mashaalRewardPop');if(popup)popup.hidden=true;}
  function announce({result,cue}={}){
    const data=safeSummary(result?.summary||summary()),latest=latestUnlock(data),reward=REWARD_BY_ID[latest?.rewardId];if(!reward)return false;
    render();const popup=ensurePopup(),art=byId('mashaalRewardPopArt'),title=byId('mashaalRewardPopTitle'),text=byId('mashaalRewardPopText');
    if(art)art.innerHTML=mashaalRewardGraphicMarkup(reward.graphicKey);if(title)title.textContent=reward.label;if(text)text.textContent=cue?.text||'فتحتي كنزًا جديدًا';popup.hidden=false;return true;
  }
  function start(){
    ensureStyle();ensureView();ensurePopup();const openButton=ensureOpenButton();
    if(!bound){openButton?.addEventListener('click',open);byId('mashaalTreasureBack')?.addEventListener('click',close);byId('mashaalRewardPopClose')?.addEventListener('click',hidePopup);bound=true;}
    render();return true;
  }
  return Object.freeze({start,open,close,leave,render,announce,isActive:()=>active});
}
