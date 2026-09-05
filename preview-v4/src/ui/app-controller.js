import {
  createSession,
  submitSessionAnswer,
  unlockNextQuestion,
  buildSessionRecord,
  getWeakQuestions,
  createWeakPracticeQuestions
} from '../application/training-engine.js';
import { byId as $, all } from './dom.js';
import {
  renderHome,
  renderLearn,
  renderParentOverview,
  renderParentDetails,
  renderSessions,
  selectedText
} from './renderers.js';
import { createSceneController } from './visual/scene-controller.js';
import { createFeedbackAudio } from './audio/feedback-audio.js';

const PARENT_PIN='2580';

function show(id){
  all('.view').forEach(view=>view.classList.toggle('active',view.id===id));
  window.scrollTo(0,0);
}

function makeOptions(correct,table,multiplier){
  const values=new Set([correct]);
  const candidates=[
    correct+table,correct-table,
    correct+multiplier,correct-multiplier,
    correct+2,correct-2,correct+3,correct-3
  ].filter(value=>value>=0);

  candidates
    .sort(()=>Math.random()-.5)
    .forEach(value=>{if(values.size<4)values.add(value);});

  while(values.size<4)values.add(correct+values.size+1);
  return [...values].sort(()=>Math.random()-.5);
}

export function createAppController({repository}){
  let state=repository.load();
  let session=null;
  const visuals=createSceneController();
  const audio=createFeedbackAudio();

  const persist=()=>repository.save(state);
  const refreshHome=()=>renderHome({state,$,all});

  function goHome(){
    document.body.classList.remove('intro-mode','hub-mode','khaled-mode');
    session=null;
    refreshHome();
    show('homeView');
    visuals.render('home');
  }

  function selectTable(table){
    if(state.selected.includes(table)){
      if(state.selected.length===1)return;
      state.selected=state.selected.filter(value=>value!==table);
    }else{
      state.selected=[...state.selected,table].sort((a,b)=>a-b);
    }
    persist();
    refreshHome();
  }

  function start(mode,customQuestions=null){
    document.body.classList.remove('intro-mode','hub-mode','khaled-mode');
    session=createSession({mode,state,selectedTables:state.selected,customQuestions});
    $('sessionTitle').textContent=mode==='exam'?'الاختبار المكثف':'تدريب اليوم';
    $('questionCard').classList.toggle('exam-mode',mode==='exam');
    show('sessionView');
    visuals.render(mode==='exam'?'exam':'question');
    renderQuestion();
  }

  function renderQuestion(){
    if(!session||session.index>=session.questions.length){
      finish();
      return;
    }

    unlockNextQuestion(session);
    visuals.render(session.mode==='exam'?'exam':'question');

    const question=session.questions[session.index];
    const correct=question.table*question.multiplier;

    $('sessionMeta').textContent=`${selectedText(state.selected)} • ${session.index+1} من ${session.questions.length}`;
    $('sessionProgress').style.width=`${(session.index/session.questions.length)*100}%`;
    $('streakBadge').textContent=`🔥 ${session.streak} متتالية`;
    $('questionText').textContent=`${question.table} × ${question.multiplier} = ؟`;
    $('feedback').textContent='';
    $('feedback').className='feedback';
    $('answers').innerHTML='';
    $('freeAnswer').style.display='none';

    const useFree=session.mode==='exam'||session.index%4!==0;
    if(useFree){
      $('freeAnswer').style.display='flex';
      $('answerInput').value='';
      setTimeout(()=>$('answerInput').focus(),30);
      return;
    }

    makeOptions(correct,question.table,question.multiplier).forEach(value=>{
      const button=document.createElement('button');
      button.className='answer';
      button.textContent=value;
      button.onclick=()=>submit(value,button);
      $('answers').appendChild(button);
    });
  }

  function submit(value,button=null){
    const result=submitSessionAnswer({session,state,answer:value});
    if(!result.accepted)return;

    persist();

    if(session.mode==='exam'){
      setTimeout(renderQuestion,150);
      return;
    }

    const {attempt}=result;
    let visualHold=0;

    if(attempt.isCorrect){
      $('feedback').textContent='ممتاز ✓';
      $('feedback').className='feedback good';
      button?.classList.add('good');
      audio.correct();
      visualHold=visuals.render('correct');
    }else{
      $('feedback').textContent=`الصحيح ${attempt.table} × ${attempt.multiplier} = ${attempt.correctAnswer} — برجع لك عليها`;
      $('feedback').className='feedback bad';
      button?.classList.add('bad');
      audio.wrong();
      visualHold=visuals.render('wrong');
    }

    $('streakBadge').textContent=`🔥 ${session.streak} متتالية`;

    const fallbackHold=attempt.isCorrect?1700:2400;
    setTimeout(renderQuestion,(visualHold||fallbackHold)+100);
  }

  function finish(){
    if(!session)return;

    state.sessions.unshift(buildSessionRecord(session));
    state.sessions=state.sessions.slice(0,100);
    persist();

    const completed=session.answers.length;
    const pct=completed?Math.round((session.correct/completed)*100):0;

    $('resultPct').textContent=`${pct}%`;
    $('resultCorrect').textContent=session.correct;
    $('resultWrong').textContent=session.wrong;
    $('resultStreak').textContent=session.bestStreak;
    $('resultTitle').textContent=pct>=90?'ممتاز يا ياسر 🏆':pct>=75?'تقدم ممتاز يا ياسر':'نكمل تدريب ونرفع المستوى';

    const weak=getWeakQuestions(session);
    session.lastWeak=weak;
    session.completed=true;
    $('weakTags').innerHTML=weak.length
      ?weak.map(item=>`<span class="tag">${item.table}×${item.multiplier} • ${item.count} خطأ</span>`).join('')
      :'<span class="tag">بدون أخطاء ✓</span>';

    refreshHome();
    show('resultView');
    visuals.result(pct);
    audio.achievement();
  }

  function leave(){
    if(session&&!session.completed&&session.answers.length){
      state.sessions.unshift(buildSessionRecord(session,{incomplete:true}));
      state.sessions=state.sessions.slice(0,100);
      persist();
    }
    session=null;
  }

  function exitSession(){
    leave();
    goHome();
  }

  function renderParent(tab='overview'){
    all('[data-parent-tab]').forEach(button=>
      button.classList.toggle('active',button.dataset.parentTab===tab)
    );

    $('parentContent').innerHTML=
      tab==='overview'
        ?renderParentOverview(state)
        :tab==='tables'
          ?renderParentDetails(state)
          :renderSessions(state);

    const exportButton=$('exportBtn');
    if(exportButton){
      exportButton.onclick=()=>{
        const blob=new Blob([repository.export(state)],{type:'application/json'});
        const url=URL.createObjectURL(blob);
        const anchor=document.createElement('a');
        anchor.href=url;
        anchor.download=`yasser-results-${new Date().toISOString().slice(0,10)}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
      };
    }
  }

  function bind(){
    $('introStart').onclick=goHome;

    all('.table-chip').forEach(button=>
      button.addEventListener('click',()=>selectTable(Number(button.dataset.table)))
    );

    $('startPractice').onclick=()=>start('practice');
    $('startExam').onclick=()=>start('exam');
    $('startLearn').onclick=()=>{
      renderLearn({state,$});
      show('learnView');
      visuals.render('learn');
    };

    $('learnHome').onclick=goHome;
    $('toggleAnswers').onclick=()=>{
      const hidden=all('.facts').some(node=>!node.classList.contains('hidden'));
      all('.facts').forEach(node=>node.classList.toggle('hidden',hidden));
      $('toggleAnswers').textContent=hidden?'أظهر النتائج':'اخفِ النتائج';
    };
    $('learnToPractice').onclick=()=>start('practice');

    $('submitAnswer').onclick=()=>submit($('answerInput').value);
    $('answerInput').addEventListener('keydown',event=>{
      if(event.key==='Enter')submit(event.target.value);
    });

    $('exitSession').onclick=exitSession;
    $('backHome').onclick=goHome;
    $('retryWeak').onclick=()=>{
      const weak=session?.lastWeak||[];
      if(!weak.length)return goHome();
      start('practice',createWeakPracticeQuestions(weak));
    };

    all('[data-parent-tab]').forEach(button=>
      button.onclick=()=>renderParent(button.dataset.parentTab)
    );
    $('parentHome').onclick=goHome;

    const modal=$('pinModal');
    $('parentBtn').onclick=()=>{
      modal.classList.add('show');
      $('pinInput').value='';
      setTimeout(()=>$('pinInput').focus(),30);
    };
    $('pinCancel').onclick=()=>modal.classList.remove('show');
    $('pinSubmit').onclick=()=>{
      if($('pinInput').value===PARENT_PIN){
        modal.classList.remove('show');
        renderParent();
        show('parentView');
        visuals.render('parent');
      }else{
        $('pinInput').value='';
        $('pinInput').placeholder='الرقم غير صحيح';
      }
    };
  }

  return{
    start(){
      bind();
      refreshHome();
      visuals.warm();
      document.body.classList.remove('hub-mode','khaled-mode');
      document.body.classList.add('intro-mode');
      show('introView');
      visuals.render('intro');
    },
    enterHome:goHome,
    leave,
    getState(){return state;}
  };
}
