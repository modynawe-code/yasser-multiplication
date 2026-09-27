import { createSpeechService } from '../../../shared/audio/speech-service.js';
import { getMashaalHomeDomains } from './home-view-model.js';
import { getMashaalDomainSkills } from './domain-view-model.js';
import { createMashaalActivityPlan } from '../application/activity-plan.js';
import { createMashaalDailyMission } from '../application/daily-mission.js';
import { listMashaalPlayExperiences,getMashaalPlayExperience } from '../application/play-experiences.js';
import { createMashaalActivityViewModel,isMashaalActivityAnswerCorrect } from './activity-view-model.js';
import { createMashaalDigitalAttempt } from '../application/digital-attempt.js';
import { createMashaalActivityCompletion } from '../application/activity-completion.js';
import { getMashaalTransferPrompt } from '../application/transfer-prompts.js';
import { recordMashaalEvidence } from '../application/progress-service.js';
import { mountQuranSurahPlayer } from '../quran/quran-surah-player.js';
import { createMashaalChoiceVisual,createMashaalDomainArt,createMashaalStimulusVisual } from './mashaal-visuals.js';
import { getMashaalWebMedia } from './mashaal-web-media.js';
import { getMashaalActivityLayout } from './activity-layout.js';
import { mountMashaalDragSequence,mountMashaalMemoryMatch,mountMashaalTracing,mountMashaalLetterHunt,mountMashaalKitchenCount,mountMashaalAnimalHabitat,mountMashaalColorMixLab,mountMashaalInteractiveStory,mountMashaalAnimalMaze,mountMashaalPicturePuzzle,mountMashaalAnimalSort } from './mashaal-interaction-engines.js';

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

export function createMashaalController({repository,onExitToHub,onActivityCompleted}={}){
  if(!repository)throw new Error('Mashaal repository is required');
  const speech=createSpeechService();
  let bound=false,currentDomain=null,currentSkill=null,currentPlan=null,currentActivityIndex=0,currentActivity=null,currentViewModel=null,currentInteraction=null,state=repository.load(),startedAt=0,activityComplete=false,recitationPlayer=null,recitationPlayed=false,dailyMissionActive=false,playLibraryActive=false;
  const selectedChoices=new Set();

  function destroyRecitation(){if(!recitationPlayer)return;try{recitationPlayer.destroy();}catch{}recitationPlayer=null;}
  function destroyInteraction(){if(!currentInteraction)return;try{currentInteraction.destroy?.();}catch{}currentInteraction=null;}
  function clearSelections(){
    selectedChoices.clear();
    byId('mashaalActivityChoices')?.querySelectorAll('.mashaal-choice').forEach(button=>{
      button.classList.remove('selected');
      delete button.dataset.order;
      delete button.dataset.outcome;
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
  function renderDailyMission(){
    const mission=createMashaalDailyMission(state),progress=byId('mashaalDailyProgress'),tasks=byId('mashaalDailyTasks'),start=byId('mashaalDailyStart');
    if(progress)progress.textContent=`${mission.completeCount} / ${mission.total}`;
    if(tasks){tasks.innerHTML='';for(const task of mission.tasks){const item=document.createElement('span');item.className='mashaal-daily-task';item.dataset.complete=String(task.complete);item.textContent=task.title;tasks.appendChild(item);}}
    if(start){start.disabled=mission.done;start.textContent=mission.done?'خلصتِ مهمة اليوم':(mission.completeCount?'كمّلي المهمة':'ابدئي المهمة');}
    return mission;
  }
  function renderPlayLibrary(){
    const grid=byId('mashaalPlayGrid');if(!grid)return;grid.innerHTML='';
    for(const experience of listMashaalPlayExperiences()){
      if(!experience.available)continue;
      const plan=createMashaalActivityPlan(experience.skillId),activity=plan?.activities?.find(item=>item.id===experience.activityId),model=activity?createMashaalActivityViewModel(activity):null;
      const button=document.createElement('button');button.type='button';button.className='mashaal-play-card';button.dataset.activityId=experience.activityId;button.setAttribute('aria-label',experience.title);
      const visual=document.createElement('span');visual.className='mashaal-play-card-visual';visual.setAttribute('aria-hidden','true');
      if(experience.imagePath){
        const image=document.createElement('img');image.src=experience.imagePath;image.alt='';image.decoding='async';visual.appendChild(image);
      }else if(model&&experience.previewKey){
        visual.appendChild(createMashaalChoiceVisual(experience.previewKey,model,{compact:true}));
      }
      const title=document.createElement('strong');title.textContent=experience.title;
      const subtitle=document.createElement('small');subtitle.textContent=experience.subtitle;
      button.append(visual,title,subtitle);grid.appendChild(button);
    }
  }
  function renderSkills(domainId){
    const grid=byId('mashaalSkillGrid');if(!grid)return;grid.innerHTML='';
    for(const skill of getMashaalDomainSkills(domainId)){
      const button=document.createElement('button');button.type='button';button.className='mashaal-skill-card';button.dataset.skillId=skill.id;
      button.appendChild(renderSkillPreview(skill,domainId));
      const copy=document.createElement('span');copy.className='mashaal-skill-copy';const title=document.createElement('strong');title.textContent=skill.title;const helper=document.createElement('span');helper.textContent=skill.contentReady?(skill.activityCount>1?`${skill.activityCount} ألعاب`:'المسي الصورة وابدئي'):'قريبًا';copy.append(title,helper);
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

  function enter(){state=repository.load();dailyMissionActive=false;playLibraryActive=false;document.body.classList.remove('hub-mode','intro-mode','khaled-mode','family-parent-mode');document.body.classList.add('mashaal-mode');renderDomains();renderDailyMission();renderPlayLibrary();show('mashaalHomeView');}
  function leave(){speech.stop();destroyRecitation();destroyInteraction();dailyMissionActive=false;playLibraryActive=false;document.body.classList.remove('mashaal-mode');currentPlan=null;currentActivityIndex=0;currentActivity=null;currentViewModel=null;activityComplete=false;recitationPlayed=false;clearSelections();}
  function openDomain(domainId){
    destroyRecitation();currentDomain=getMashaalHomeDomains().find(item=>item.id===domainId)||null;if(!currentDomain)return;
    const view=byId('mashaalDomainView');if(view)view.dataset.domainId=currentDomain.id;
    const symbol=byId('mashaalDomainSymbol');if(symbol){symbol.innerHTML='';symbol.appendChild(createMashaalDomainArt(currentDomain.id));}
    byId('mashaalDomainTitle').textContent=currentDomain.title;byId('mashaalDomainMessage').textContent='اختاري الصورة اللي تبين نبدأ فيها.';
    renderSkills(currentDomain.id);show('mashaalDomainView');speech.speak(currentDomain.title);
  }
  function backHome(){speech.stop();destroyRecitation();destroyInteraction();dailyMissionActive=false;playLibraryActive=false;currentPlan=null;currentActivityIndex=0;renderDomains();renderDailyMission();renderPlayLibrary();show('mashaalHomeView');}
  function backDomain(){speech.stop();destroyRecitation();destroyInteraction();dailyMissionActive=false;playLibraryActive=false;currentPlan=null;currentActivityIndex=0;currentActivity=null;currentViewModel=null;activityComplete=false;recitationPlayed=false;clearSelections();if(currentDomain){renderSkills(currentDomain.id);show('mashaalDomainView');}else backHome();}
  function exit(){leave();onExitToHub?.();}

  function renderActivityChoices(){
    const host=byId('mashaalActivityChoices');if(!host||!currentViewModel)return;destroyInteraction();host.innerHTML='';host.className='mashaal-activity-choices';host.style.gridTemplateColumns='';clearSelections();
    const check=byId('mashaalActivityCheck');if(check){check.hidden=!currentViewModel.multiSelect;check.disabled=false;check.textContent='تحقق';}
    if(currentViewModel.activityType==='ordered-sequence'){
      if(check)check.hidden=true;
      currentInteraction=mountMashaalDragSequence(host,currentViewModel,{onSubmit:answer=>submitAnswer(answer)});
      return;
    }
    if(currentViewModel.activityType==='memory-match'){
      if(check)check.hidden=true;
      currentInteraction=mountMashaalMemoryMatch(host,currentViewModel,{onComplete:completeCurrentActivity});
      return;
    }
    if(currentViewModel.activityType==='guided-tracing'){
      if(check)check.hidden=true;
      currentInteraction=mountMashaalTracing(host,currentViewModel,{onComplete:completeCurrentActivity});
      return;
    }
    if(currentViewModel.activityType==='letter-hunt'){
      if(check)check.hidden=true;
      currentInteraction=mountMashaalLetterHunt(host,currentViewModel,{onComplete:completeCurrentActivity});
      return;
    }
    if(currentViewModel.activityType==='kitchen-count'){
      if(check)check.hidden=true;
      currentInteraction=mountMashaalKitchenCount(host,currentViewModel,{onComplete:completeCurrentActivity});
      return;
    }
    if(currentViewModel.activityType==='animal-habitat'){
      if(check)check.hidden=true;
      currentInteraction=mountMashaalAnimalHabitat(host,currentViewModel,{onComplete:completeCurrentActivity});
      return;
    }
    if(currentViewModel.activityType==='animal-sort'){
      if(check)check.hidden=true;
      currentInteraction=mountMashaalAnimalSort(host,currentViewModel,{onComplete:completeCurrentActivity});
      return;
    }
    if(currentViewModel.activityType==='color-mix-lab'){
      if(check)check.hidden=true;
      currentInteraction=mountMashaalColorMixLab(host,currentViewModel,{onComplete:completeCurrentActivity});
      return;
    }
    if(currentViewModel.activityType==='interactive-story'){
      if(check)check.hidden=true;
      currentInteraction=mountMashaalInteractiveStory(host,currentViewModel,{onComplete:completeCurrentActivity,onSpeak:text=>speech.speak(text,{interrupt:true})});
      return;
    }
    if(currentViewModel.activityType==='animal-maze'){
      if(check)check.hidden=true;
      currentInteraction=mountMashaalAnimalMaze(host,currentViewModel,{onComplete:completeCurrentActivity});
      return;
    }
    if(currentViewModel.activityType==='picture-puzzle'){
      if(check)check.hidden=true;
      currentInteraction=mountMashaalPicturePuzzle(host,currentViewModel,{onComplete:completeCurrentActivity});
      return;
    }
    for(const choice of currentViewModel.choices){
      const button=document.createElement('button');button.type='button';button.className='mashaal-choice';button.dataset.choice=choice.value;button.setAttribute('aria-label',choice.label);
      const visual=document.createElement('span');visual.className='mashaal-choice-visual';visual.appendChild(createMashaalChoiceVisual(choice.visualKey,currentViewModel));
      const label=document.createElement('span');label.className='mashaal-choice-label';label.textContent=choice.label;button.append(visual,label);
      if((choice.value==='left'||choice.value==='right')&&currentViewModel.stimulus.kind==='groups')button.dataset.visualOnly='true';
      if(currentViewModel.multiSelect)button.setAttribute('aria-pressed','false');
      button.addEventListener('click',()=>{
        if(activityComplete)return;
        if(currentViewModel.completionOnly){completeCurrentActivity();return;}
        if(currentViewModel.multiSelect){
          const selected=selectedChoices.has(choice.value);
          if(selected){selectedChoices.delete(choice.value);button.classList.remove('selected');button.setAttribute('aria-pressed','false');}
          else{selectedChoices.add(choice.value);button.classList.add('selected');button.setAttribute('aria-pressed','true');}return;
        }
        submitAnswer(choice.value,button);
      });host.appendChild(button);
    }
  }
  function lockActivityControls(){byId('mashaalActivityChoices')?.querySelectorAll('button').forEach(button=>{button.disabled=true;});}
  function openPlannedActivity(){
    if(!currentPlan?.activities?.length)return;
    destroyRecitation();destroyInteraction();currentActivity=currentPlan.activities[currentActivityIndex]||currentPlan.activities[0]||null;currentViewModel=createMashaalActivityViewModel(currentActivity);if(!currentViewModel)return;activityComplete=false;recitationPlayed=false;clearSelections();
    const layout=getMashaalActivityLayout(currentViewModel);
    const activityView=byId('mashaalActivityView');if(activityView){activityView.dataset.domainId=currentPlan.domainId;activityView.dataset.activityKind=currentViewModel.requiresHumanRecitation?'quran-recitation':'standard';activityView.dataset.layout=layout.mode;activityView.dataset.choiceCount=String(layout.choiceCount);}
    const backButton=byId('mashaalActivityBack');if(backButton)backButton.textContent=playLibraryActive?'رجوع للألعاب':(dailyMissionActive?'رجوع لمهمة اليوم':'رجوع للمهارات');
    byId('mashaalActivitySkill').textContent=currentViewModel.experienceTitleAr||currentSkill?.title||'لعبة مشاعل';byId('mashaalActivityPrompt').textContent=currentViewModel.promptAr;
    const guide=byId('mashaalActivityGuide');if(guide)guide.replaceChildren(createMashaalDomainArt(currentPlan.domainId,{className:'mashaal-activity-guide-image'}));
    const feedback=byId('mashaalActivityFeedback');if(feedback){feedback.textContent='';feedback.className='mashaal-activity-feedback';}
    const completion=byId('mashaalActivityCompletion');if(completion)completion.hidden=true;
    if(activityView)delete activityView.dataset.state;
    recitationPlayer=renderStimulus(currentViewModel,layout);renderActivityChoices();startedAt=Date.now();show('mashaalActivityView');speech.speak(currentViewModel.audioPromptAr);
  }
  function openSkill(skillId){
    const plan=createMashaalActivityPlan(skillId);if(!plan?.contentReady)return;dailyMissionActive=false;playLibraryActive=false;currentPlan=plan;currentActivityIndex=0;currentSkill=getMashaalDomainSkills(plan.domainId).find(skill=>skill.id===skillId)||null;openPlannedActivity();
  }
  function openMissionTask(task){
    if(!task?.skillId||!task?.activityId)return false;
    const plan=createMashaalActivityPlan(task.skillId);if(!plan?.contentReady)return false;
    const index=plan.activities.findIndex(activity=>activity.id===task.activityId);if(index<0)return false;
    currentPlan=plan;currentActivityIndex=index;currentSkill=getMashaalDomainSkills(plan.domainId).find(skill=>skill.id===task.skillId)||null;currentDomain=getMashaalHomeDomains().find(domain=>domain.id===plan.domainId)||currentDomain;dailyMissionActive=true;playLibraryActive=false;openPlannedActivity();return true;
  }
  function startDailyMission(){
    state=repository.load();const mission=renderDailyMission();if(mission.done){speech.speak('أكملتي مهمة اليوم، أحسنتي يا مشاعل');return;}
    const next=mission.tasks.find(task=>!task.complete);if(next)openMissionTask(next);
  }
  function openPlayExperience(activityId){
    const experience=getMashaalPlayExperience(activityId);if(!experience?.available)return false;
    const plan=createMashaalActivityPlan(experience.skillId);if(!plan?.contentReady)return false;
    const index=plan.activities.findIndex(activity=>activity.id===experience.activityId);if(index<0)return false;
    currentPlan=plan;currentActivityIndex=index;currentSkill=getMashaalDomainSkills(plan.domainId).find(skill=>skill.id===experience.skillId)||null;currentDomain=getMashaalHomeDomains().find(domain=>domain.id===plan.domainId)||null;dailyMissionActive=false;playLibraryActive=true;openPlannedActivity();return true;
  }
  function hearCurrentActivity(){if(!currentViewModel)return;speech.speak(currentViewModel.audioPromptAr,{interrupt:true});}
  function saveEvidence(evidence,skillId){if(recordMashaalEvidence(state,{skillId,evidence}))repository.save(state);}
  function notifyActivityCompleted(evidence){if(typeof onActivityCompleted!=='function'||!currentActivity||!evidence)return;try{onActivityCompleted(Object.freeze({activityId:currentActivity.id,skillId:currentViewModel?.skillId||currentActivity.skillId,evidenceId:evidence.evidenceId,at:evidence.createdAt||new Date().toISOString()}));}catch{}}
  function finishActivity(praise){
    activityComplete=true;recitationPlayer?.pause?.();lockActivityControls();const transfer=getMashaalTransferPrompt(currentViewModel?.skillId);const feedback=byId('mashaalActivityFeedback');
    if(feedback)feedback.textContent=transfer?`${praise}\nالحين جربي بعيد عن الشاشة: ${transfer}`:praise;
    if(feedback)feedback.className='mashaal-activity-feedback good';
    const activityView=byId('mashaalActivityView');if(activityView)activityView.dataset.state='complete';
    const completion=byId('mashaalActivityCompletion');if(completion){completion.hidden=false;completion.querySelector('span').textContent=praise;}
    const check=byId('mashaalActivityCheck');if(check){const missionNext=dailyMissionActive?createMashaalDailyMission(state).tasks.find(task=>!task.complete):null;const hasNext=!dailyMissionActive&&!playLibraryActive&&Boolean(currentPlan?.activities?.[currentActivityIndex+1]);check.hidden=false;check.disabled=false;check.textContent='اختاري نشاطًا آخر';if(playLibraryActive)check.textContent='اختاري لعبة ثانية';else if(dailyMissionActive)check.textContent=missionNext?'المهمة التالية':'أنهيتِ مهمة اليوم';else if(hasNext)check.textContent='النشاط التالي';}
    speech.speak(transfer?`${praise} الحين جربي بعيد عن الشاشة. ${transfer}`:praise);
  }
  function completeCurrentActivity(){
    if(activityComplete||!currentViewModel||!currentActivity)return;
    if(currentViewModel.requiresHumanRecitation&&!recitationPlayed){const feedback=byId('mashaalActivityFeedback');if(feedback)feedback.textContent='اسمعي التلاوة كاملة أولًا.';speech.speak('اسمعي التلاوة كاملة أولًا');return;}
    const evidence=createMashaalActivityCompletion({evidenceId:evidenceId(currentActivity.id),skillId:currentViewModel.skillId,activityId:currentActivity.id,activityType:currentViewModel.interaction,createdAt:new Date().toISOString()});
    saveEvidence(evidence,currentViewModel.skillId);notifyActivityCompleted(evidence);finishActivity('رائع يا مشاعل');
  }
  function submitAnswer(answer,sourceButton=null){
    if(activityComplete||!currentViewModel||!currentActivity)return;const isCorrect=isMashaalActivityAnswerCorrect(currentViewModel,answer);
    const evidence=createMashaalDigitalAttempt({evidenceId:evidenceId(currentActivity.id),skillId:currentViewModel.skillId,activityId:currentActivity.id,isCorrect,responseMs:Date.now()-startedAt});
    saveEvidence(evidence,currentViewModel.skillId);
    if(isCorrect){
      notifyActivityCompleted(evidence);
      const selected=sourceButton?[sourceButton]:[...byId('mashaalActivityChoices').querySelectorAll('.selected')];selected.forEach(button=>button.dataset.outcome='correct');finishActivity('أحسنتِ يا مشاعل');
    }else{
      const attempted=sourceButton?[sourceButton]:[...byId('mashaalActivityChoices').querySelectorAll('.selected')];attempted.forEach(button=>button.dataset.outcome='wrong');if(currentViewModel.orderedSequence){clearSelections();currentInteraction?.reset?.();}
      const activityView=byId('mashaalActivityView');if(activityView)activityView.dataset.state='retry';
      const feedback=byId('mashaalActivityFeedback');if(feedback){feedback.textContent='محاولة جميلة، جرّبي مرة ثانية.';feedback.className='mashaal-activity-feedback bad';}speech.speak('محاولة جميلة، جربي مرة ثانية');startedAt=Date.now();
    }
  }
  function bind(){
    if(bound)return;bound=true;
    byId('mashaalDomainGrid')?.addEventListener('click',event=>{const card=event.target.closest('[data-domain-id]');if(card)openDomain(card.dataset.domainId);});
    byId('mashaalSkillGrid')?.addEventListener('click',event=>{const card=event.target.closest('[data-skill-id]');if(card&&!card.disabled)openSkill(card.dataset.skillId);});
    byId('mashaalPlayGrid')?.addEventListener('click',event=>{const card=event.target.closest('[data-activity-id]');if(card)openPlayExperience(card.dataset.activityId);});
    byId('mashaalHearHome')?.addEventListener('click',()=>speech.speak('يا مشاعل، اختاري لعبة من ألعابي أو اختاري عالمك.'));
    byId('mashaalHearDomain')?.addEventListener('click',()=>currentDomain&&speech.speak(currentDomain.title));byId('mashaalHearActivity')?.addEventListener('click',hearCurrentActivity);
    byId('mashaalActivityCheck')?.addEventListener('click',()=>{if(activityComplete){if(playLibraryActive){backHome();return;}if(dailyMissionActive){const mission=createMashaalDailyMission(state),next=mission.tasks.find(task=>!task.complete);if(next){openMissionTask(next);return;}backHome();speech.speak('أكملتي مهمة اليوم، أحسنتي يا مشاعل');return;}if(currentPlan?.activities?.[currentActivityIndex+1]){currentActivityIndex+=1;openPlannedActivity();}else backDomain();return;}if(selectedChoices.size)submitAnswer([...selectedChoices]);});byId('mashaalDomainBack')?.addEventListener('click',backHome);byId('mashaalActivityBack')?.addEventListener('click',()=>dailyMissionActive||playLibraryActive?backHome():backDomain());
    byId('mashaalDailyStart')?.addEventListener('click',startDailyMission);byId('mashaalToHub')?.addEventListener('click',exit);
  }
  return Object.freeze({start(){bind();},enter,leave,getState(){return state;}});
}
