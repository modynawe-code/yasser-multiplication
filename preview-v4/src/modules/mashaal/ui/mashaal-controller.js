import { createSpeechService } from '../../../shared/audio/speech-service.js';
import { getMashaalHomeDomains } from './home-view-model.js';
import { getMashaalDomainSkills } from './domain-view-model.js';
import { createMashaalActivityPlan } from '../application/activity-plan.js';
import { createMashaalActivityViewModel,isMashaalActivityAnswerCorrect } from './activity-view-model.js';
import { createMashaalDigitalAttempt } from '../application/digital-attempt.js';
import { createMashaalActivityCompletion } from '../application/activity-completion.js';
import { getMashaalTransferPrompt } from '../application/transfer-prompts.js';
import { recordMashaalEvidence } from '../application/progress-service.js';
import { mountQuranSurahPlayer } from '../quran/quran-surah-player.js';
import { createMashaalChoiceVisual,createMashaalDomainArt,createMashaalStimulusVisual } from './mashaal-visuals.js';
import { getMashaalWebMedia } from './mashaal-web-media.js';
import { getMashaalActivityLayout } from './activity-layout.js';

function byId(id){return document.getElementById(id);}
function show(id){document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id===id));window.scrollTo(0,0);}
function evidenceId(activityId){const random=globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2);return `mashaal-${activityId}-${Date.now()}-${random}`;}

function renderWorldVisual(button,domainId){
  const stage=document.createElement('span');stage.className='mashaal-domain-card-visual';stage.setAttribute('aria-hidden','true');stage.appendChild(createMashaalDomainArt(domainId));button.appendChild(stage);
}

function renderSkillPreview(skill,domainId){
  const preview=document.createElement('span');preview.className='mashaal-skill-preview';preview.setAttribute('aria-hidden','true');
  const plan=createMashaalActivityPlan(skill.id);const activity=plan?.activities?.[0];const model=activity?createMashaalActivityViewModel(activity):null;
  const firstChoice=model?.choices?.[0]||null;
  const illustratedChoice=firstChoice&&getMashaalWebMedia(firstChoice.visualKey)?firstChoice:null;
  if(model&&!model.requiresHumanRecitation&&illustratedChoice)preview.appendChild(createMashaalChoiceVisual(illustratedChoice.visualKey,model,{compact:true}));
  else if(model&&!model.requiresHumanRecitation)preview.appendChild(createMashaalStimulusVisual(model.stimulus,{domainId,compact:true}));
  else preview.appendChild(createMashaalDomainArt(domainId));
  return preview;
}

export function createMashaalController({repository,onExitToHub}={}){
  if(!repository)throw new Error('Mashaal repository is required');
  const speech=createSpeechService();
  let bound=false,currentDomain=null,currentSkill=null,currentActivity=null,currentViewModel=null,state=repository.load(),startedAt=0,activityComplete=false,recitationPlayer=null,recitationPlayed=false;
  const selectedChoices=new Set();

  function destroyRecitation(){if(!recitationPlayer)return;try{recitationPlayer.destroy();}catch{}recitationPlayer=null;}
  function clearSelections(){
    selectedChoices.clear();
    byId('mashaalActivityChoices')?.querySelectorAll('.mashaal-choice').forEach(button=>{
      button.classList.remove('selected');
      delete button.dataset.order;
      if(button.hasAttribute('aria-pressed'))button.setAttribute('aria-pressed','false');
    });
  }
  function renderDomains(){
    const grid=byId('mashaalDomainGrid');if(!grid)return;grid.innerHTML='';
    for(const domain of getMashaalHomeDomains()){
      const button=document.createElement('button');button.type='button';button.className='mashaal-domain-card';button.dataset.domainId=domain.id;button.setAttribute('aria-label',domain.title);
      renderWorldVisual(button,domain.id);
      const title=document.createElement('strong');title.textContent=domain.title;button.appendChild(title);grid.appendChild(button);
    }
  }
  function renderSkills(domainId){
    const grid=byId('mashaalSkillGrid');if(!grid)return;grid.innerHTML='';
    for(const skill of getMashaalDomainSkills(domainId)){
      const button=document.createElement('button');button.type='button';button.className='mashaal-skill-card';button.dataset.skillId=skill.id;
      button.appendChild(renderSkillPreview(skill,domainId));
      const copy=document.createElement('span');copy.className='mashaal-skill-copy';const title=document.createElement('strong');title.textContent=skill.title;const helper=document.createElement('span');helper.textContent=skill.contentReady?'المسي الصورة وابدئي':'قريبًا';copy.append(title,helper);
      const start=document.createElement('span');start.className='mashaal-skill-start';start.textContent=skill.contentReady?'ابدئي':'قريبًا';button.append(copy,start);
      button.setAttribute('aria-label',`${skill.title}، ${skill.contentReady?'ابدئي':'قريبًا'}`);
      if(!skill.contentReady){button.disabled=true;button.setAttribute('aria-disabled','true');}grid.appendChild(button);
    }
  }
  function renderStimulus(model,layout){
    const host=byId('mashaalActivityStimulus');if(!host)return null;host.innerHTML='';host.hidden=false;host.setAttribute('aria-hidden','true');const stimulus=model?.stimulus||{};
    if(layout?.hideStimulus){host.hidden=true;return null;}
    if(stimulus.kind==='recitation'){
      return mountQuranSurahPlayer(host,{
        surahNameAr:stimulus.surahNameAr,
        surahNumber:stimulus.surahNumber,
        audioPath:model.recitationAudioPath,
        mushafPage:model.recitationMushafPage,
        onCompleted:()=>{
          recitationPlayed=true;
          const feedback=byId('mashaalActivityFeedback');if(feedback)feedback.textContent='أحسنتِ، سمعنا السورة كاملة. الآن ردديها ثم اضغطي تم.';
        }
      });
    }
    if(stimulus.kind==='groups'){
      host.hidden=true;
      return null;
    }
    host.appendChild(createMashaalStimulusVisual(stimulus,{domainId:currentDomain?.id||null}));return null;
  }

  function enter(){state=repository.load();document.body.classList.remove('hub-mode','intro-mode','khaled-mode','family-parent-mode');document.body.classList.add('mashaal-mode');renderDomains();show('mashaalHomeView');}
  function leave(){speech.stop();destroyRecitation();document.body.classList.remove('mashaal-mode');currentActivity=null;currentViewModel=null;activityComplete=false;recitationPlayed=false;clearSelections();}
  function openDomain(domainId){
    destroyRecitation();currentDomain=getMashaalHomeDomains().find(item=>item.id===domainId)||null;if(!currentDomain)return;
    const view=byId('mashaalDomainView');if(view)view.dataset.domainId=currentDomain.id;
    const symbol=byId('mashaalDomainSymbol');if(symbol){symbol.innerHTML='';symbol.appendChild(createMashaalDomainArt(currentDomain.id));}
    byId('mashaalDomainTitle').textContent=currentDomain.title;byId('mashaalDomainMessage').textContent='اختاري الصورة اللي تبين نبدأ فيها.';
    renderSkills(currentDomain.id);show('mashaalDomainView');speech.speak(currentDomain.title);
  }
  function backHome(){speech.stop();destroyRecitation();renderDomains();show('mashaalHomeView');}
  function backDomain(){speech.stop();destroyRecitation();currentActivity=null;currentViewModel=null;activityComplete=false;recitationPlayed=false;clearSelections();if(currentDomain){renderSkills(currentDomain.id);show('mashaalDomainView');}else backHome();}
  function exit(){leave();onExitToHub?.();}

  function renderActivityChoices(){
    const host=byId('mashaalActivityChoices');if(!host||!currentViewModel)return;host.innerHTML='';host.style.gridTemplateColumns='';clearSelections();
    const check=byId('mashaalActivityCheck');if(check){check.hidden=!currentViewModel.multiSelect;check.disabled=false;}
    for(const choice of currentViewModel.choices){
      const button=document.createElement('button');button.type='button';button.className='mashaal-choice';button.dataset.choice=choice.value;button.setAttribute('aria-label',choice.label);
      const visual=document.createElement('span');visual.className='mashaal-choice-visual';visual.appendChild(createMashaalChoiceVisual(choice.visualKey,currentViewModel));
      const label=document.createElement('span');label.className='mashaal-choice-label';label.textContent=choice.label;button.append(visual,label);
      if((choice.value==='left'||choice.value==='right')&&currentViewModel.stimulus.kind==='groups')button.dataset.visualOnly='true';
      if(currentViewModel.multiSelect||currentViewModel.orderedSequence)button.setAttribute('aria-pressed','false');
      button.addEventListener('click',()=>{
        if(activityComplete)return;
        if(currentViewModel.completionOnly){completeCurrentActivity();return;}
        if(currentViewModel.orderedSequence){
          if(selectedChoices.has(choice.value))return;selectedChoices.add(choice.value);button.classList.add('selected');button.dataset.order=String(selectedChoices.size);button.setAttribute('aria-pressed','true');
          if(selectedChoices.size===currentViewModel.correctValues.length)submitAnswer([...selectedChoices]);return;
        }
        if(currentViewModel.multiSelect){
          const selected=selectedChoices.has(choice.value);
          if(selected){selectedChoices.delete(choice.value);button.classList.remove('selected');button.setAttribute('aria-pressed','false');}
          else{selectedChoices.add(choice.value);button.classList.add('selected');button.setAttribute('aria-pressed','true');}return;
        }
        submitAnswer(choice.value);
      });host.appendChild(button);
    }
  }
  function lockActivityControls(){byId('mashaalActivityChoices')?.querySelectorAll('button').forEach(button=>{button.disabled=true;});const check=byId('mashaalActivityCheck');if(check){check.disabled=true;check.hidden=true;}}
  function openSkill(skillId){
    const plan=createMashaalActivityPlan(skillId);if(!plan?.contentReady)return;currentSkill=getMashaalDomainSkills(plan.domainId).find(skill=>skill.id===skillId)||null;
    destroyRecitation();currentActivity=plan.activities[0]||null;currentViewModel=createMashaalActivityViewModel(currentActivity);if(!currentViewModel)return;activityComplete=false;recitationPlayed=false;
    const layout=getMashaalActivityLayout(currentViewModel);
    const activityView=byId('mashaalActivityView');if(activityView){activityView.dataset.domainId=plan.domainId;activityView.dataset.activityKind=currentViewModel.requiresHumanRecitation?'quran-recitation':'standard';activityView.dataset.layout=layout.mode;activityView.dataset.choiceCount=String(layout.choiceCount);}
    byId('mashaalActivitySkill').textContent=currentSkill?.title||'لعبة مشاعل';byId('mashaalActivityPrompt').textContent=currentViewModel.promptAr;byId('mashaalActivityFeedback').textContent='';
    recitationPlayer=renderStimulus(currentViewModel,layout);renderActivityChoices();startedAt=Date.now();show('mashaalActivityView');speech.speak(currentViewModel.audioPromptAr);
  }
  function hearCurrentActivity(){if(!currentViewModel)return;speech.speak(currentViewModel.audioPromptAr,{interrupt:true});}
  function saveEvidence(evidence,skillId){if(recordMashaalEvidence(state,{skillId,evidence}))repository.save(state);}
  function finishActivity(praise){
    activityComplete=true;recitationPlayer?.pause?.();lockActivityControls();const transfer=getMashaalTransferPrompt(currentViewModel?.skillId);const feedback=byId('mashaalActivityFeedback');
    if(feedback)feedback.textContent=transfer?`${praise}\nالحين جربي بعيد عن الشاشة: ${transfer}`:praise;
    speech.speak(transfer?`${praise} الحين جربي بعيد عن الشاشة. ${transfer}`:praise);
  }
  function completeCurrentActivity(){
    if(activityComplete||!currentViewModel||!currentActivity)return;
    if(currentViewModel.requiresHumanRecitation&&!recitationPlayed){const feedback=byId('mashaalActivityFeedback');if(feedback)feedback.textContent='اسمعي التلاوة كاملة أولًا.';speech.speak('اسمعي التلاوة كاملة أولًا');return;}
    const evidence=createMashaalActivityCompletion({evidenceId:evidenceId(currentActivity.id),skillId:currentViewModel.skillId,activityType:currentViewModel.interaction,createdAt:new Date().toISOString()});
    saveEvidence(evidence,currentViewModel.skillId);finishActivity('رائع يا مشاعل');
  }
  function submitAnswer(answer){
    if(activityComplete||!currentViewModel||!currentActivity)return;const isCorrect=isMashaalActivityAnswerCorrect(currentViewModel,answer);
    const evidence=createMashaalDigitalAttempt({evidenceId:evidenceId(currentActivity.id),skillId:currentViewModel.skillId,isCorrect,responseMs:Date.now()-startedAt});
    saveEvidence(evidence,currentViewModel.skillId);
    if(isCorrect)finishActivity('أحسنت يا مشاعل');
    else{if(currentViewModel.orderedSequence)clearSelections();const feedback=byId('mashaalActivityFeedback');if(feedback)feedback.textContent='جربي مرة ثانية.';speech.speak('جربي مرة ثانية');startedAt=Date.now();}
  }
  function bind(){
    if(bound)return;bound=true;
    byId('mashaalDomainGrid')?.addEventListener('click',event=>{const card=event.target.closest('[data-domain-id]');if(card)openDomain(card.dataset.domainId);});
    byId('mashaalSkillGrid')?.addEventListener('click',event=>{const card=event.target.closest('[data-skill-id]');if(card&&!card.disabled)openSkill(card.dataset.skillId);});
    byId('mashaalHearHome')?.addEventListener('click',()=>speech.speak('يا مشاعل، اختاري العالم اللي تبين نلعب فيه.'));
    byId('mashaalHearDomain')?.addEventListener('click',()=>currentDomain&&speech.speak(currentDomain.title));byId('mashaalHearActivity')?.addEventListener('click',hearCurrentActivity);
    byId('mashaalActivityCheck')?.addEventListener('click',()=>selectedChoices.size&&submitAnswer([...selectedChoices]));byId('mashaalDomainBack')?.addEventListener('click',backHome);byId('mashaalActivityBack')?.addEventListener('click',backDomain);
    byId('mashaalToHub')?.addEventListener('click',exit);
  }
  return Object.freeze({start(){bind();},enter,leave,getState(){return state;}});
}
