import { createSpeechService } from '../../../shared/audio/speech-service.js';
import { getMashaalHomeDomains } from './home-view-model.js';
import { getMashaalDomainSkills } from './domain-view-model.js';
import { createMashaalActivityPlan } from '../application/activity-plan.js';
import { createMashaalActivityViewModel,isMashaalActivityAnswerCorrect } from './activity-view-model.js';
import { createMashaalDigitalAttempt } from '../application/digital-attempt.js';
import { recordMashaalEvidence } from '../application/progress-service.js';

const DOMAIN_SYMBOLS=Object.freeze({
  'language-communication':'أ','cognitive-operations-general-knowledge':'١٢٣','social-emotional-development':'☺',
  'health-physical-development':'✦','quran-islamic-education':'☾','national-social-studies':'🇸🇦'
});

function byId(id){return document.getElementById(id);}
function show(id){document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id===id));window.scrollTo(0,0);}
function evidenceId(activityId){const random=globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2);return `mashaal-${activityId}-${Date.now()}-${random}`;}

function renderStimulus(model){
  const host=byId('mashaalActivityStimulus');if(!host)return;host.innerHTML='';const stimulus=model?.stimulus||{};
  if(stimulus.kind==='items'||stimulus.kind==='sequence'){
    const row=document.createElement('div');row.className='mashaal-stimulus-row';
    for(const item of stimulus.items||[]){const span=document.createElement('span');span.textContent=item;row.appendChild(span);}host.appendChild(row);return;
  }
  if(stimulus.kind==='groups'){
    const groups=document.createElement('div');groups.className='mashaal-stimulus-groups';
    for(const group of stimulus.groups||[]){const box=document.createElement('div');box.className='mashaal-stimulus-group';box.textContent=group.join(' ');groups.appendChild(box);}host.appendChild(groups);return;
  }
  const text=document.createElement('div');text.className='mashaal-stimulus-text';text.textContent=stimulus.text||'';host.appendChild(text);
}

export function createMashaalController({repository,onExitToHub}={}){
  if(!repository)throw new Error('Mashaal repository is required');
  const speech=createSpeechService();
  let bound=false,currentDomain=null,currentSkill=null,currentActivity=null,currentViewModel=null,state=repository.load(),startedAt=0,activityComplete=false;
  const selectedChoices=new Set();

  function clearSelections(){selectedChoices.clear();byId('mashaalActivityChoices')?.querySelectorAll('.selected').forEach(button=>button.classList.remove('selected'));}
  function renderDomains(){
    const grid=byId('mashaalDomainGrid');if(!grid)return;grid.innerHTML='';
    for(const domain of getMashaalHomeDomains()){
      const button=document.createElement('button');button.type='button';button.className='mashaal-domain-card';button.dataset.domainId=domain.id;
      const symbol=document.createElement('span');symbol.className='mashaal-domain-card-symbol';symbol.textContent=DOMAIN_SYMBOLS[domain.id]||'★';symbol.setAttribute('aria-hidden','true');
      const title=document.createElement('strong');title.textContent=domain.title;button.append(symbol,title);grid.appendChild(button);
    }
  }
  function renderSkills(domainId){
    const grid=byId('mashaalSkillGrid');if(!grid)return;grid.innerHTML='';
    for(const skill of getMashaalDomainSkills(domainId)){
      const button=document.createElement('button');button.type='button';button.className='mashaal-skill-card';button.dataset.skillId=skill.id;
      const title=document.createElement('strong');title.textContent=skill.title;const stateLabel=document.createElement('span');stateLabel.textContent=skill.contentReady?'ابدئي ✨':'قريبًا';button.append(title,stateLabel);
      if(!skill.contentReady){button.disabled=true;button.setAttribute('aria-disabled','true');}grid.appendChild(button);
    }
  }

  function enter(){state=repository.load();document.body.classList.remove('hub-mode','intro-mode','khaled-mode','family-parent-mode');document.body.classList.add('mashaal-mode');renderDomains();show('mashaalHomeView');}
  function leave(){speech.stop();document.body.classList.remove('mashaal-mode');currentActivity=null;currentViewModel=null;activityComplete=false;clearSelections();}
  function openDomain(domainId){
    currentDomain=getMashaalHomeDomains().find(item=>item.id===domainId)||null;if(!currentDomain)return;
    byId('mashaalDomainSymbol').textContent=DOMAIN_SYMBOLS[currentDomain.id]||'★';byId('mashaalDomainTitle').textContent=currentDomain.title;byId('mashaalDomainMessage').textContent='اختاري لعبة نبدأ فيها.';
    renderSkills(currentDomain.id);show('mashaalDomainView');speech.speak(currentDomain.title);
  }
  function backHome(){speech.stop();renderDomains();show('mashaalHomeView');}
  function backDomain(){speech.stop();currentActivity=null;currentViewModel=null;activityComplete=false;clearSelections();if(currentDomain){renderSkills(currentDomain.id);show('mashaalDomainView');}else backHome();}
  function exit(){leave();onExitToHub?.();}

  function renderActivityChoices(){
    const host=byId('mashaalActivityChoices');if(!host||!currentViewModel)return;host.innerHTML='';clearSelections();
    const check=byId('mashaalActivityCheck');if(check){check.hidden=!currentViewModel.multiSelect;check.disabled=false;}
    for(const choice of currentViewModel.choices){
      const button=document.createElement('button');button.type='button';button.className='mashaal-choice';button.dataset.choice=choice.value;button.textContent=choice.label;
      button.addEventListener('click',()=>{
        if(activityComplete)return;
        if(currentViewModel.orderedSequence){
          if(selectedChoices.has(choice.value))return;selectedChoices.add(choice.value);button.classList.add('selected');
          if(selectedChoices.size===currentViewModel.correctValues.length)submitAnswer([...selectedChoices]);return;
        }
        if(currentViewModel.multiSelect){
          if(selectedChoices.has(choice.value)){selectedChoices.delete(choice.value);button.classList.remove('selected');}else{selectedChoices.add(choice.value);button.classList.add('selected');}return;
        }
        submitAnswer(choice.value);
      });host.appendChild(button);
    }
  }
  function lockActivityControls(){byId('mashaalActivityChoices')?.querySelectorAll('button').forEach(button=>{button.disabled=true;});const check=byId('mashaalActivityCheck');if(check){check.disabled=true;check.hidden=true;}}
  function openSkill(skillId){
    const plan=createMashaalActivityPlan(skillId);if(!plan?.contentReady)return;currentSkill=getMashaalDomainSkills(plan.domainId).find(skill=>skill.id===skillId)||null;
    currentActivity=plan.activities[0]||null;currentViewModel=createMashaalActivityViewModel(currentActivity);if(!currentViewModel)return;activityComplete=false;
    byId('mashaalActivitySkill').textContent=currentSkill?.title||'لعبة مشاعل';byId('mashaalActivityPrompt').textContent=currentViewModel.promptAr;byId('mashaalActivityFeedback').textContent='';
    renderStimulus(currentViewModel);renderActivityChoices();startedAt=Date.now();show('mashaalActivityView');speech.speak(currentViewModel.audioPromptAr);
  }
  function submitAnswer(answer){
    if(activityComplete||!currentViewModel||!currentActivity)return;const isCorrect=isMashaalActivityAnswerCorrect(currentViewModel,answer);
    const evidence=createMashaalDigitalAttempt({evidenceId:evidenceId(currentActivity.id),skillId:currentViewModel.skillId,isCorrect,responseMs:Date.now()-startedAt});
    if(recordMashaalEvidence(state,{skillId:currentViewModel.skillId,evidence}))repository.save(state);const feedback=byId('mashaalActivityFeedback');
    if(isCorrect){activityComplete=true;lockActivityControls();if(feedback)feedback.textContent='أحسنتِ ✨';speech.speak('أحسنت يا مشاعل');}
    else{if(currentViewModel.orderedSequence)clearSelections();if(feedback)feedback.textContent='جربي مرة ثانية 👀';speech.speak('جربي مرة ثانية');startedAt=Date.now();}
  }
  function bind(){
    if(bound)return;bound=true;
    byId('mashaalDomainGrid')?.addEventListener('click',event=>{const card=event.target.closest('[data-domain-id]');if(card)openDomain(card.dataset.domainId);});
    byId('mashaalSkillGrid')?.addEventListener('click',event=>{const card=event.target.closest('[data-skill-id]');if(card&&!card.disabled)openSkill(card.dataset.skillId);});
    byId('mashaalHearHome')?.addEventListener('click',()=>speech.speak('يا مشاعل، اختاري العالم اللي تبين نلعب فيه.'));
    byId('mashaalHearDomain')?.addEventListener('click',()=>currentDomain&&speech.speak(currentDomain.title));byId('mashaalHearActivity')?.addEventListener('click',()=>currentViewModel&&speech.speak(currentViewModel.audioPromptAr));
    byId('mashaalActivityCheck')?.addEventListener('click',()=>selectedChoices.size&&submitAnswer([...selectedChoices]));byId('mashaalDomainBack')?.addEventListener('click',backHome);byId('mashaalActivityBack')?.addEventListener('click',backDomain);
    byId('mashaalToHub')?.addEventListener('click',exit);byId('mashaalDomainToHub')?.addEventListener('click',exit);byId('mashaalActivityToHub')?.addEventListener('click',exit);
  }
  return Object.freeze({start(){bind();},enter,leave,getState(){return state;}});
}
