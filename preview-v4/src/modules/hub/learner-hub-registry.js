import { listLearnerProfiles } from '../../shared/learners/learner-registry.js';

function ensureOpenFamilyGridStyle(){
  if(document.querySelector('link[data-module-style="open-family-learner-grid"]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='src/modules/hub/open-family-learner-grid.css';
  link.dataset.moduleStyle='open-family-learner-grid';
  document.head.appendChild(link);
}

function legacyCardId(learnerId){
  return learnerId==='yasser'?'hubYasser':learnerId==='khaled'?'hubKhaled':null;
}

function createFallbackVisual(profile){
  const visual=document.createElement('div');
  visual.className=`learner-placeholder ${profile.theme||''}`.trim();
  const visualKey=String(profile.presentation?.fallbackVisual||'symbols').trim();
  visual.dataset.visualKey=visualKey;

  if(visualKey==='preschool-learning'){
    for(const [className,text] of [['learner-preschool-flower','✿'],['learner-preschool-letter','أ'],['learner-preschool-number','١']]){
      const span=document.createElement('span');span.className=className;span.textContent=text;visual.appendChild(span);
    }
    return visual;
  }

  const symbols=String(profile.presentation?.symbol||'★').split(/\s+/).filter(Boolean).slice(0,2);
  for(const symbol of symbols.length?symbols:['★']){
    const span=document.createElement('span');span.textContent=symbol;visual.appendChild(span);
  }
  return visual;
}

function createGenericVisual(profile){
  const visualShell=document.createElement('div');
  visualShell.className='learner-character-shell learner-generic-character';
  visualShell.setAttribute('aria-hidden','true');

  const avatar=String(profile.presentation?.avatar||'').trim();
  if(avatar){
    const image=document.createElement('img');
    image.className='learner-profile-image';
    image.src=avatar;
    image.alt='';
    image.decoding='async';
    visualShell.appendChild(image);
  }else{
    visualShell.appendChild(createFallbackVisual(profile));
  }

  return visualShell;
}

function createCardCopy(profile){
  const copy=document.createElement('div');
  copy.className='learner-card-copy';
  const strong=document.createElement('strong');
  const stage=document.createElement('span');
  const summary=document.createElement('small');
  copy.append(strong,stage,summary);
  applyProfileCopy(copy,profile);
  return copy;
}

function applyProfileCopy(copy,profile){
  if(!copy)return;
  const strong=copy.querySelector('strong');
  const stage=copy.querySelector('span');
  const summary=copy.querySelector('small');
  if(strong)strong.textContent=profile.displayName;
  if(stage)stage.textContent=profile.presentation?.stageLabel||profile.presentation?.subtitle||profile.stage||'مسار تعلم';
  if(summary)summary.textContent=profile.presentation?.summary||'';
}

function applyProfilePresentation(card,profile){
  card.dataset.learnerId=profile.id;
  card.dataset.learnerModule=profile.module||'';
  card.dataset.learnerVariant=profile.presentation?.homeVariant||'';
  applyProfileCopy(card.querySelector('.learner-card-copy'),profile);
  const stageLabel=profile.presentation?.stageLabel||profile.presentation?.subtitle||profile.stage||'مسار تعلم';
  card.setAttribute('aria-label',`${profile.displayName}، ${stageLabel}`);
}

function createGenericCard(profile){
  const button=document.createElement('button');
  button.className=`learner-card ${profile.theme||'learner'}-card`;
  button.type='button';
  button.id=`hubLearner-${profile.id}`;
  button.append(createGenericVisual(profile),createCardCopy(profile));
  applyProfilePresentation(button,profile);
  return button;
}

function compactParentAccessLabel(){
  const button=document.querySelector('.family-parent-open');
  if(!button)return;
  button.textContent='ولي الأمر';
  button.setAttribute('aria-label','فتح تقرير ولي الأمر');
}

export function hydrateLearnerHub(){
  ensureOpenFamilyGridStyle();
  compactParentAccessLabel();
  const grid=document.querySelector('.learner-grid');
  if(!grid)return [];
  const hydrated=[];
  for(const profile of listLearnerProfiles()){
    let card=document.querySelector(`[data-learner-id="${profile.id}"]`);
    if(!card){
      const legacyId=legacyCardId(profile.id);
      card=legacyId?document.getElementById(legacyId):null;
    }
    if(!card){
      card=createGenericCard(profile);
      grid.appendChild(card);
    }else{
      applyProfilePresentation(card,profile);
    }
    hydrated.push(card);
  }
  return hydrated;
}
