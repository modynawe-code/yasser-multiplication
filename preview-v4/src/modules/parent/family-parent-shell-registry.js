import { listLearnerProfiles } from '../../shared/learners/learner-registry.js';

function ensureStyle(){
  if(document.querySelector('link[data-module-style="family-parent-open-learners"]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='src/modules/parent/family-parent-open-learners.css';link.dataset.moduleStyle='family-parent-open-learners';document.head.appendChild(link);
}

export function hydrateFamilyParentLearners(){
  ensureStyle();
  const nav=document.querySelector('.family-parent-nav');if(!nav)return [];
  const sessionsButton=nav.querySelector('[data-family-parent-tab="sessions"]');
  const buttons=[];
  for(const profile of listLearnerProfiles()){
    let button=nav.querySelector(`[data-family-parent-tab="${profile.id}"]`);
    if(!button){button=document.createElement('button');button.type='button';button.dataset.familyParentTab=profile.id;button.textContent=profile.displayName;if(sessionsButton)nav.insertBefore(button,sessionsButton);else nav.appendChild(button);}
    buttons.push(button);
  }
  const modalText=document.querySelector('#familyPinModal .muted');if(modalText)modalText.textContent='أدخل الرقم السري لعرض تقدم الأطفال.';
  return buttons;
}
