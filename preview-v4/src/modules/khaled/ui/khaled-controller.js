import { KHALED_SKILLS, getKhaledSkill } from '../domain/curriculum.js';
import { createKhaledRound } from '../domain/question-bank.js';
import { createAdvancedKhaledRound } from '../domain/advanced-question-bank.js';
import { recordKhaledAttempt } from '../domain/state-model.js';
import { createSpeechService } from '../../../shared/audio/speech-service.js';
import { createFeedbackAudio } from '../../../ui/audio/feedback-audio.js';
import { createKhaledSceneController } from './khaled-scene-controller.js';
import { isAdditionQuestion, renderAdditionQuestion } from './khaled-addition-renderer.js';
import { isSubtractionQuestion, renderSubtractionQuestion } from './khaled-subtraction-renderer.js';
import { isStrategiesQuestion, renderStrategiesQuestion } from './khaled-strategies-renderer.js';
import { isPlaceValueQuestion, renderPlaceValueQuestion } from './khaled-place-value-renderer.js';
import { isAdvancedQuestion, renderAdvancedQuestion } from './khaled-advanced-renderer.js';

function allViews(){return[...document.querySelectorAll('.view')];}
function show(id){allViews().forEach(view=>view.classList.toggle('active',view.id===id));window.scrollTo(0,0);}
function byId(id){return document.getElementById(id);}
function dots(count){return Array.from({length:count},()=>'<span class="khaled-dot" aria-hidden="true"></span>').join('');}
function countVisual(count,large=false){return count===0?'<div class="khaled-zero-visual"><strong>0</strong><span aria-hidden="true">∅</span><small>لا توجد دوائر</small></div>':`<div class="khaled-dot-group single ${large?'large':''}">${dots(count)}</div>`;}
function shapes(items,className=''){return items.map(item=>`<span class="khaled-shape ${className}" aria-hidden="true">${item}</span>`).join('');}
function classifyToken(item){return `<span class="khaled-classify-token shape-${item.shape} color-${item.color}" aria-hidden="true"></span>`;}
function numberTiles(items){return items.map(value=>value===null?'<span class="khaled-number-missing" aria-hidden="true">؟</span>':`<span class="khaled-number-tile">${value}</span>`).join('<span class="khaled-number-arrow" aria-hidden="true">→</span>');}

export function createKhaledController({repository}={}){
  let state=repository.load(),session=null,bound=false,feedbackPending=false,feedbackTimer=null;
  const speech=createSpeechService(),audio=createFeedbackAudio(),visuals=createKhaledSceneController();
  function persist(){repository.save(state);}
  function clearFeedbackTimer(){if(feedbackTimer){clearTimeout(feedbackTimer);feedbackTimer=null;}feedbackPending=false;}

  function renderHome(){
    const list=byId('khaledSkillList');if(!list)return;
    list.innerHTML=KHALED_SKILLS.map(skill=>{const progress=state.skills[skill.id]||{attempts:0,correct:0},pct=progress.attempts?Math.round(progress.correct/progress.attempts*100):0,enabled=skill.status==='ready',status=enabled?(progress.attempts?`${pct}%`:'ابدأ'):(skill.status==='later'?'لاحقًا':'قريبًا');return `<button class="khaled-skill ${enabled?'ready':'locked'}" data-khaled-skill="${skill.id}" ${enabled?'':'disabled'}><span class="khaled-skill-symbol">${skill.symbol}</span><span><strong>${skill.title}</strong><small>${skill.shortTitle}</small></span><em>${status}</em></button>`;}).join('');
    byId('khaledAttempts').textContent=state.totalAttempts;byId('khaledErrors').textContent=state.totalWrong;
    document.querySelectorAll('[data-khaled-skill]').forEach(button=>button.onclick=()=>startSkill(button.dataset.khaledSkill));
  }

  function enter(){clearFeedbackTimer();document.body.classList.remove('hub-mode','intro-mode','family-parent-mode');document.body.classList.add('khaled-mode');renderHome();show('khaledHomeView');visuals.home();}
  function startSkill(skillId){const skill=getKhaledSkill(skillId);if(!skill||skill.status!=='ready')return;clearFeedbackTimer();speech.stop();const questions=createAdvancedKhaledRound({skillId,count:8})||createKhaledRound({skillId,count:8});session={skillId,questions,index:0,correct:0,wrong:0,answers:[],completed:false,retryCount:0};byId('khaledSessionTitle').textContent=skill.title;show('khaledSessionView');renderQuestion();}

  function speakQuestion(question){const id=question?.id;setTimeout(()=>{const active=session?.questions?.[session.index];if(!feedbackPending&&active?.id===id)speech.speak(question.spokenPrompt||'');},220);}

  function renderQuestion(){
    if(!session||session.index>=session.questions.length)return finish();
    const question=session.questions[session.index];
    byId('khaledSessionMeta').textContent=`${session.index+1} من ${session.questions.length}`;
    byId('khaledSessionProgress').style.width=`${session.index/session.questions.length*100}%`;
    byId('khaledPrompt').textContent=question.prompt;byId('khaledFeedback').textContent='';
    const visual=byId('khaledVisual'),answers=byId('khaledAnswers');answers.innerHTML='';answers.classList.remove('khaled-visual-answers','khaled-equation-answers','khaled-order-answers');visuals.question();

    if(question.type==='count-select'){
      visual.innerHTML=countVisual(question.count,question.count>10);question.options.forEach(value=>answers.appendChild(answerButton(value,String(value))));
    }else if(question.type==='spoken-number-select'){
      visual.innerHTML='<div class="khaled-spoken-number" aria-hidden="true"><span>🔊</span><small>اسمع ثم اختر</small></div>';question.options.forEach(value=>answers.appendChild(answerButton(value,String(value))));
    }else if(question.type==='number-compare'){
      visual.innerHTML=`<div class="khaled-number-compare" dir="ltr"><button data-answer="${question.left}">${question.left}</button><span aria-hidden="true">↔</span><button data-answer="${question.right}">${question.right}</button></div>`;visual.querySelectorAll('[data-answer]').forEach(button=>button.onclick=()=>submit(Number(button.dataset.answer),button));
    }else if(question.type==='ordinal-select'){
      visual.innerHTML=`<div class="khaled-ordinal-row" dir="rtl">${shapes(question.items,'ordinal-item')}</div>`;question.options.forEach(value=>answers.appendChild(answerButton(value,value)));
    }else if(question.type==='classify-one-property'||question.type==='classify-two-properties'){
      visual.innerHTML=`<div class="khaled-classify-stage"><div class="khaled-classify-group">${question.group.map(classifyToken).join('')}</div><span class="khaled-classify-arrow" aria-hidden="true">←</span><span class="khaled-classify-question" aria-hidden="true">؟</span></div>`;answers.classList.add('khaled-visual-answers');question.options.forEach(item=>answers.appendChild(visualAnswerButton(item.key,item)));
    }else if(question.type==='equality-groups'){
      visual.innerHTML=`<div class="khaled-equality"><div class="khaled-equality-group">${dots(question.left)}</div><span class="khaled-equality-sign" aria-hidden="true">؟</span><div class="khaled-equality-group">${dots(question.right)}</div></div>`;question.options.forEach(option=>answers.appendChild(answerButton(option.value,option.label)));
    }else if(question.type==='compare-groups'){
      visual.innerHTML=`<div class="khaled-compare"><button class="khaled-group-choice" data-answer="left">${dots(question.left)}</button><button class="khaled-group-choice" data-answer="right">${dots(question.right)}</button></div>`;visual.querySelectorAll('[data-answer]').forEach(button=>button.onclick=()=>submit(button.dataset.answer,button));
    }else if(question.type==='position-select'){
      const layout=question.layout==='horizontal-sequence'?'horizontal':'vertical';visual.innerHTML=`<div class="khaled-position ${layout}">${shapes(question.items)}</div>`;question.options.forEach(value=>answers.appendChild(answerButton(value,value)));
    }else if(question.type==='pattern-next'){
      visual.innerHTML=`<div class="khaled-pattern" dir="ltr">${shapes(question.items)}<span class="khaled-pattern-missing" aria-hidden="true">؟</span></div>`;question.options.forEach(value=>answers.appendChild(answerButton(value,value)));
    }else if(question.type==='number-order'){
      visual.innerHTML=`<div class="khaled-number-line" dir="ltr">${numberTiles(question.items)}</div>`;question.options.forEach(value=>answers.appendChild(answerButton(value,String(value))));
    }else if(isAdditionQuestion(question))renderAdditionQuestion({question,visual,answers,createAnswerButton:answerButton});
    else if(isSubtractionQuestion(question))renderSubtractionQuestion({question,visual,answers,createAnswerButton:answerButton});
    else if(isStrategiesQuestion(question))renderStrategiesQuestion({question,visual,answers,createAnswerButton:answerButton});
    else if(isPlaceValueQuestion(question))renderPlaceValueQuestion({question,visual,answers,createAnswerButton:answerButton,submitAnswer:submit});
    else if(isAdvancedQuestion(question))renderAdvancedQuestion({question,visual,answers,createAnswerButton:answerButton,submitAnswer:submit});
    else visual.innerHTML='';
    speakQuestion(question);
  }

  function answerButton(value,label){const button=document.createElement('button');button.className='khaled-answer';button.textContent=label;button.dataset.answerValue=String(value);button.onclick=()=>submit(value,button);return button;}
  function visualAnswerButton(value,item){const button=document.createElement('button');button.className='khaled-answer khaled-token-answer';button.dataset.answer=value;button.dataset.answerValue=String(value);button.innerHTML=classifyToken(item);button.setAttribute('aria-label','خيار تصنيف');button.onclick=()=>submit(value,button);return button;}
  function revealCorrect(question){
    const target=String(question.correctAnswer),candidates=[...document.querySelectorAll('#khaledSessionView [data-answer-value],#khaledSessionView [data-answer],#khaledSessionView [data-place-answer]')];
    const correct=candidates.find(button=>String(button.dataset.answerValue??button.dataset.answer??button.dataset.placeAnswer)===target);if(correct){correct.classList.add('good');correct.setAttribute('aria-label',`${correct.getAttribute('aria-label')||'الإجابة'} الصحيحة`);}
  }
  function advanceAfter(delay){
    feedbackPending=true;const activeSession=session,activeId=session?.questions?.[session.index]?.id;
    feedbackTimer=setTimeout(()=>{feedbackTimer=null;if(session!==activeSession||session?.questions?.[session.index]?.id!==activeId)return;session.index+=1;session.retryCount=0;feedbackPending=false;renderQuestion();},delay);
  }

  function submit(answer,button){
    if(!session||feedbackPending)return;
    const question=session.questions[session.index],isCorrect=String(answer)===String(question.correctAnswer),attempt=recordKhaledAttempt(state,{skillId:session.skillId,isCorrect,question,answer});
    session.answers.push(attempt);speech.stop();persist();
    if(isCorrect){session.correct+=1;button?.classList.add('good');byId('khaledFeedback').textContent=session.retryCount?'أحسنت، صححتها ✓':'ممتاز يا خالد ✓';audio.correct();visuals.feedback(true);advanceAfter(1050);return;}
    session.wrong+=1;session.retryCount+=1;button?.classList.add('bad');button&&(button.disabled=true);audio.wrong();visuals.feedback(false);
    if(session.retryCount<2){
      byId('khaledFeedback').textContent='جرّب مرة ثانية — الخطأ محفوظ ونتعلم منه';feedbackPending=true;const activeSession=session,activeId=question.id;
      feedbackTimer=setTimeout(()=>{feedbackTimer=null;if(session!==activeSession||session?.questions?.[session.index]?.id!==activeId)return;feedbackPending=false;byId('khaledFeedback').textContent='اختر مرة ثانية';visuals.question();},900);return;
    }
    revealCorrect(question);byId('khaledFeedback').textContent='هذه الإجابة الصحيحة — ونكمل';advanceAfter(1600);
  }

  function storeSession({incomplete=false}={}){if(!session||!session.answers.length)return;const completed=session.correct+session.wrong,pct=completed?Math.round(session.correct/completed*100):0;state.sessions.unshift({at:new Date().toISOString(),skillId:session.skillId,correct:session.correct,wrong:session.wrong,total:completed,pct,incomplete});state.sessions=state.sessions.slice(0,100);persist();}
  function finish(){if(!session)return;clearFeedbackTimer();const completed=session.correct+session.wrong,pct=completed?Math.round(session.correct/completed*100):0,skill=getKhaledSkill(session.skillId);storeSession();session.completed=true;byId('khaledResultTitle').textContent=pct>=80?'أبدعت يا خالد ⭐':pct>=60?'شغل ممتاز يا خالد':'نكمل تدريب ونصير أقوى';byId('khaledResultPct').textContent=`${pct}%`;byId('khaledResultSkill').textContent=skill?.title||'';byId('khaledResultCorrect').textContent=session.correct;byId('khaledResultWrong').textContent=session.wrong;show('khaledResultView');visuals.result(pct);audio.achievement();}
  function leave(){clearFeedbackTimer();if(session&&!session.completed&&session.answers.length)storeSession({incomplete:true});speech.stop();document.body.classList.remove('khaled-mode');session=null;}
  function exitSession(){leave();enter();}
  function bind(){if(bound)return;bound=true;byId('khaledExitSession')?.addEventListener('click',exitSession);byId('khaledResultHome')?.addEventListener('click',()=>{session=null;enter();});byId('khaledRetry')?.addEventListener('click',()=>session&&startSkill(session.skillId));byId('hearKhaledQuestion')?.addEventListener('click',()=>{if(feedbackPending)return;const question=session?.questions?.[session.index];speech.speak(question?.spokenPrompt||'');});}
  return{start(){bind();visuals.warm();enter();},enter(){bind();visuals.warm();enter();},leave,getState(){return state;}};
}
