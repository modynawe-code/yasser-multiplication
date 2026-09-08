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

const DOMAIN_PRESENTATION=Object.freeze({
  'language-communication':Object.freeze({symbol:'أ',scene:Object.freeze(['أ','ب','💬'])}),
  'cognitive-operations-general-knowledge':Object.freeze({symbol:'١٢٣',scene:Object.freeze(['١','٢','△'])}),
  'social-emotional-development':Object.freeze({symbol:'☺',scene:Object.freeze(['😊','♥','🤝'])}),
  'health-physical-development':Object.freeze({symbol:'✦',scene:Object.freeze(['🍎','💧','⚽'])}),
  'quran-islamic-education':Object.freeze({symbol:'☾',scene:Object.freeze(['☾','📖','✦'])}),
  'national-social-studies':Object.freeze({symbol:'🇸🇦',scene:Object.freeze(['🇸🇦','⌂','🤝'])})
});

function byId(id){return document.getElementById(id);}
function show(id){document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id===id));window.scrollTo(0,0);}
function evidenceId(activityId){const random=globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2);return `mashaal-${activityId}-${Date.now()}-${random}`;}

function renderWorldVisual(button,domainId){
  const presentation=DOMAIN_PRESENTATION[domainId]||Object.freeze({symbol:'★',scene:Object.freeze(['★'])});
  const stage=document.createElement('span');stage.className='mashaal-domain-card-visual';stage.setAttribute('aria-hidden','true');
  for(const [index,item] of presentation.scene.entries()){
    const piece=document.createElement('span');piece.className=`mashaal-world-piece piece-${index+1}`;piece.textContent=item;stage.appendChild(piece);
  }
  button.appendChild(stage);
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
      const title=document.createElement('strong');title.textContent=skill.title;const stateLabel=document.createElement('span');stateLabel.textContent=skill.contentReady?'ابدئي':'قريبًا';button.append(title,stateLabel);
      button.setAttribute('aria-label',`${skill.title}، ${skill.contentReady?'ابدئي':'قريبًا'}`);
      if(!skill.contentReady){button.disabled=true;button.setAttribute('aria-disabled','true');}grid.appendChild(button);
    }
  }
  function renderStimulus(model){
    const host=byId('mashaalActivityStimulus');if(!host)return null;host.innerHTML='';host.setAttribute('aria-hidden','true');const stimulus=model?.stimulus||{};
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
    if(stimulus.kind==='items'||stimulus.kind==='sequence'){
      const row=document.createElement('div');row.className='mashaal-stimulus-row';
      for(const item of stimulus.items||[]){const span=document.createElement('span');span.textContent=item;row.appendChild(span);}host.appendChild(row);return null;
    }
    if(stimulus.kind==='groups'){
      const groups=document.createElement('div');groups.className='mashaal-stimulus-groups';
      for(const group of stimulus.groups||[]){const box=document.createElement('div');box.className='mashaal-stimulus-group';box.textContent=group.join(' ');groups.appendChild(box);}host.appendChild(groups);return null;
    }
    const text=document.createElement('div');text.className=`mashaal-stimulus-text mashaal-stimulus-${stimulus.kind||'text'}`;text.textContent=stimulus.text||'';host.appendChild(text);return null;
  }

  function enter(){state=repository.load();document.body.classList.remove('hub-mode','intro-mode','khaled-mode','family-parent-mode');document.body.classList.add('mashaal-mode');renderDomains();show('mashaalHomeView');}
  function leave(){speech.stop();destroyRecitation();document.body.classList.remove('mashaal-mode');currentActivity=null;currentViewModel=null;activityComplete=false;recitationPlayed=false;clearSelections();}
  function openDomain(domainId){
    destroyRecitation();currentDomain=getMashaalHomeDomains().find(item=>item.id===domainId)||null;if(!currentDomain)return;
    const view=byId('mashaalDomainView');if(view)view.dataset.domainId=currentDomain.id;
    byId('mashaalDomainSymbol').textContent=DOMAIN_PRESENTATION[currentDomain.id]?.symbol||'★';byId('mashaalDomainTitle').textContent=currentDomain.title;byId('mashaalDomainMessage').textContent='اختاري لعبة نبدأ فيها.';
    renderSkills(currentDomain.id);show('mashaalDomainView');speech.speak(currentDomain.title);
  }
  function backHome(){speech.stop();destroyRecitation();renderDomains();show('mashaalHomeView');}
  function backDomain(){speech.stop();destroyRecitation();currentActivity=null;currentViewModel=null;activityComplete=false;recitationPlayed=false;clearSelections();if(currentDomain){renderSkills(currentDomain.id);show('mashaalDomainView');}else backHome();}
  function exit(){leave();onExitToHub?.();}

  function renderActivityChoices(){
    const host=byId('mashaalActivityChoices');if(!host||!currentViewModel)return;host.innerHTML='';clearSelections();
    const check=byId('mashaalActivityCheck');if(check){check.hidden=!currentViewModel.multiSelect;check.disabled=false;}
    for(const choice of currentViewModel.choices){
      const button=document.createElement('button');button.type='button';button.className='mashaal-choice';button.dataset.choice=choice.value;button.textContent=choice.label;button.setAttribute('aria-label',choice.label);
      if(currentViewModel.multiSelect||currentViewModel.orderedSequence)button.setAttribute('aria-pressed','false');
      button.addEventListener('click',()=>{
        if(activityComplete)return;
        if(currentViewModel.completionOnly){completeCurrentActivity();return;}
        if(currentViewModel.orderedSequence){
          if(selectedChoices.has(choice.value))return;selectedChoices.add(choice.value);button.classList.add('selected');button.setAttribute('aria-pressed','true');
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
    const activityView=byId('mashaalActivityView');if(activityView){activityView.dataset.domainId=plan.domainId;activityView.dataset.activityKind=currentViewModel.requiresHumanRecitation?'quran-recitation':'standard';}
    byId('mashaalActivitySkill').textContent=currentSkill?.title||'لعبة مشاعل';byId('mashaalActivityPrompt').textContent=currentViewModel.promptAr;byId('mashaalActivityFeedback').textContent='';
    recitationPlayer=renderStimulus(currentViewModel);renderActivityChoices();startedAt=Date.now();show('mashaalActivityView');speech.speak(currentViewModel.audioPromptAr);
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
    if(currentViewModel.requiresHumanRecitation&&!recitationPlayed){const feedback=byId('mashaalActivityFeedback');if(feedback)feedback.textContent='اسمعي التلاوة كاملة أولًا 🎧';speech.speak('اسمعي التلاوة كاملة أولًا');return;}
    const evidence=createMashaalActivityCompletion({evidenceId:evidenceId(currentActivity.id),skillId:currentViewModel.skillId,activityType:currentViewModel.interaction,createdAt:new Date().toISOString()});
    saveEvidence(evidence,currentViewModel.skillId);finishActivity('رائع يا مشاعل');
  }
  function submitAnswer(answer){
    if(activityComplete||!currentViewModel||!currentActivity)return;const isCorrect=isMashaalActivityAnswerCorrect(currentViewModel,answer);
    const evidence=createMashaalDigitalAttempt({evidenceId:evidenceId(currentActivity.id),skillId:currentViewModel.skillId,isCorrect,responseMs:Date.now()-startedAt});
    saveEvidence(evidence,currentViewModel.skillId);
    if(isCorrect)finishActivity('أحسنت يا مشاعل');
    else{if(currentViewModel.orderedSequence)clearSelections();const feedback=byId('mashaalActivityFeedback');if(feedback)feedback.textContent='جربي مرة ثانية 👀';speech.speak('جربي مرة ثانية');startedAt=Date.now();}
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
