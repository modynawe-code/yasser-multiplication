import { KHALED_SKILLS, getKhaledSkill } from '../domain/curriculum.js';
import { createKhaledRound } from '../domain/question-bank.js';
import { recordKhaledAttempt } from '../domain/state-model.js';
import { createSpeechService } from '../../../shared/audio/speech-service.js';

function allViews(){return[...document.querySelectorAll('.view')];}
function show(id){allViews().forEach(view=>view.classList.toggle('active',view.id===id));window.scrollTo(0,0);}
function byId(id){return document.getElementById(id);}
function dots(count){return Array.from({length:count},()=>'<span class="khaled-dot" aria-hidden="true"></span>').join('');}
function shapes(items,className=''){return items.map(item=>`<span class="khaled-shape ${className}" aria-hidden="true">${item}</span>`).join('');}

export function createKhaledController({repository,onExitToHub}={}){
  let state=repository.load();
  let session=null;
  let bound=false;
  const speech=createSpeechService();

  function persist(){repository.save(state);}

  function renderHome(){
    const list=byId('khaledSkillList');
    if(!list)return;
    list.innerHTML=KHALED_SKILLS.map(skill=>{
      const progress=state.skills[skill.id]||{attempts:0,correct:0};
      const pct=progress.attempts?Math.round(progress.correct/progress.attempts*100):0;
      const enabled=skill.status==='ready';
      const status=enabled?(progress.attempts?`${pct}%`:'ابدأ'):(skill.status==='later'?'لاحقًا':'قريبًا');
      return `<button class="khaled-skill ${enabled?'ready':'locked'}" data-khaled-skill="${skill.id}" ${enabled?'':'disabled'}><span class="khaled-skill-symbol">${skill.symbol}</span><span><strong>${skill.title}</strong><small>${skill.shortTitle}</small></span><em>${status}</em></button>`;
    }).join('');
    byId('khaledAttempts').textContent=state.totalAttempts;
    byId('khaledErrors').textContent=state.totalWrong;
    document.querySelectorAll('[data-khaled-skill]').forEach(button=>button.onclick=()=>startSkill(button.dataset.khaledSkill));
  }

  function enter(){
    document.body.classList.remove('hub-mode','intro-mode');
    renderHome();
    show('khaledHomeView');
  }

  function startSkill(skillId){
    const skill=getKhaledSkill(skillId);
    if(!skill||skill.status!=='ready')return;
    session={skillId,questions:createKhaledRound({skillId,count:8}),index:0,correct:0,wrong:0,answers:[]};
    byId('khaledSessionTitle').textContent=skill.title;
    show('khaledSessionView');
    renderQuestion();
  }

  function renderQuestion(){
    if(!session||session.index>=session.questions.length)return finish();
    const question=session.questions[session.index];
    byId('khaledSessionMeta').textContent=`${session.index+1} من ${session.questions.length}`;
    byId('khaledSessionProgress').style.width=`${session.index/session.questions.length*100}%`;
    byId('khaledPrompt').textContent=question.prompt;
    byId('khaledFeedback').textContent='';
    const visual=byId('khaledVisual');
    const answers=byId('khaledAnswers');
    answers.innerHTML='';

    if(question.type==='count-select'){
      visual.innerHTML=`<div class="khaled-dot-group single">${dots(question.count)}</div>`;
      question.options.forEach(value=>answers.appendChild(answerButton(value,String(value))));
    }else if(question.type==='compare-groups'){
      visual.innerHTML=`<div class="khaled-compare"><button class="khaled-group-choice" data-answer="left">${dots(question.left)}</button><button class="khaled-group-choice" data-answer="right">${dots(question.right)}</button></div>`;
      visual.querySelectorAll('[data-answer]').forEach(button=>button.onclick=()=>submit(button.dataset.answer,button));
    }else if(question.type==='position-select'){
      const layout=question.layout==='horizontal-sequence'?'horizontal':'vertical';
      visual.innerHTML=`<div class="khaled-position ${layout}">${shapes(question.items)}</div>`;
      question.options.forEach(value=>answers.appendChild(answerButton(value,value)));
    }else if(question.type==='pattern-next'){
      visual.innerHTML=`<div class="khaled-pattern" dir="ltr">${shapes(question.items)}<span class="khaled-pattern-missing" aria-hidden="true">؟</span></div>`;
      question.options.forEach(value=>answers.appendChild(answerButton(value,value)));
    }else{
      visual.innerHTML='';
    }
  }

  function answerButton(value,label){
    const button=document.createElement('button');
    button.className='khaled-answer';
    button.textContent=label;
    button.onclick=()=>submit(value,button);
    return button;
  }

  function submit(answer,button){
    if(!session)return;
    const question=session.questions[session.index];
    const isCorrect=String(answer)===String(question.correctAnswer);
    const attempt=recordKhaledAttempt(state,{skillId:session.skillId,isCorrect,question,answer});
    session.answers.push(attempt);
    if(isCorrect){session.correct+=1;button?.classList.add('good');byId('khaledFeedback').textContent='ممتاز يا خالد ✓';}
    else{session.wrong+=1;button?.classList.add('bad');byId('khaledFeedback').textContent='حاول مرة ثانية في السؤال الجاي';}
    persist();
    session.index+=1;
    setTimeout(renderQuestion,900);
  }

  function finish(){
    if(!session)return;
    const completed=session.correct+session.wrong;
    const pct=completed?Math.round(session.correct/completed*100):0;
    const skill=getKhaledSkill(session.skillId);
    state.sessions.unshift({at:new Date().toISOString(),skillId:session.skillId,correct:session.correct,wrong:session.wrong,total:completed,pct});
    state.sessions=state.sessions.slice(0,100);
    persist();
    byId('khaledResultTitle').textContent=pct>=90?'أبدعت يا خالد ⭐':pct>=70?'شغل ممتاز يا خالد':'نكمل تدريب ونصير أقوى';
    byId('khaledResultPct').textContent=`${pct}%`;
    byId('khaledResultSkill').textContent=skill?.title||'';
    byId('khaledResultCorrect').textContent=session.correct;
    byId('khaledResultWrong').textContent=session.wrong;
    show('khaledResultView');
  }

  function bind(){
    if(bound)return;
    bound=true;
    byId('khaledHomeToHub')?.addEventListener('click',()=>{speech.stop();session=null;onExitToHub?.();});
    byId('khaledExitSession')?.addEventListener('click',enter);
    byId('khaledResultHome')?.addEventListener('click',enter);
    byId('khaledRetry')?.addEventListener('click',()=>session&&startSkill(session.skillId));
    byId('hearKhaledQuestion')?.addEventListener('click',()=>{
      const question=session?.questions?.[session.index];
      speech.speak(question?.spokenPrompt||'');
    });
  }

  return{
    start(){bind();enter();},
    enter(){bind();enter();},
    leave(){speech.stop();session=null;},
    getState(){return state;}
  };
}
