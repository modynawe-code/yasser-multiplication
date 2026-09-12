import { listLearnerProfiles } from '../../shared/learners/learner-registry.js';

function legacyCardId(learnerId){
  return learnerId==='yasser'?'hubYasser':learnerId==='khaled'?'hubKhaled':null;
}

function createGenericCard(profile){
  const button=document.createElement('button');
  button.className=`learner-card ${profile.theme||'learner'}-card`;
  button.type='button';
  button.dataset.learnerId=profile.id;
  button.id=`hubLearner-${profile.id}`;

  const visual=document.createElement('div');
  visual.className=`learner-placeholder ${profile.theme||''}`.trim();
  visual.setAttribute('aria-hidden','true');
  const symbols=String(profile.presentation?.symbol||'★').split(/\s+/).filter(Boolean).slice(0,2);
  for(const symbol of symbols.length?symbols:['★']){
    const span=document.createElement('span');span.textContent=symbol;visual.appendChild(span);
  }

  const copy=document.createElement('div');
  const strong=document.createElement('strong');strong.textContent=profile.displayName;
  const subtitle=document.createElement('span');subtitle.textContent=profile.presentation?.subtitle||profile.stage||'مسار تعلم';
  const summary=document.createElement('small');summary.textContent=profile.presentation?.summary||'مسار مستقل وتقدم محفوظ';
  copy.append(strong,subtitle,summary);
  button.append(visual,copy);
  return button;
}

export function hydrateLearnerHub(){
  const grid=document.querySelector('.learner-grid');
  if(!grid)return [];
  const hydrated=[];
  for(const profile of listLearnerProfiles()){
    let card=document.querySelector(`[data-learner-id="${profile.id}"]`);
    if(!card){
      const legacyId=legacyCardId(profile.id);
      card=legacyId?document.getElementById(legacyId):null;
    }
    if(card){
      card.dataset.learnerId=profile.id;
      card.dataset.learnerModule=profile.module||'';
    }else{
      card=createGenericCard(profile);
      grid.appendChild(card);
    }
    hydrated.push(card);
  }
  return hydrated;
}
