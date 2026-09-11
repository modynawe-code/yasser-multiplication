import { createSpeechService } from '../../../shared/audio/speech-service.js';
import { createFeedbackAudio } from '../../../ui/audio/feedback-audio.js';
import { KHALED_SCIENCE_ART,KHALED_SCIENCE_LESSONS,KHALED_SCIENCE_ACTIVITY_COUNT,getKhaledScienceLesson } from './khaled-science-data.js';

const STORAGE_KEY='family-learning:khaled:science:v1';
const SPRITE='assets/khaled/science/worksheet-term1-source.webp';

function ensureStyle(){
  if(document.querySelector('link[data-module-style="khaled-science"]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='src/modules/khaled/science/khaled-science.css';link.dataset.moduleStyle='khaled-science';document.head.appendChild(link);
}

function safeLoad(){
  try{
    const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(parsed&&parsed.version===1&&parsed.records&&typeof parsed.records==='object')return parsed;
  }catch{}
  return{version:1,records:{},updatedAt:null};
}
function safeSave(state){
  state.updatedAt=new Date().toISOString();
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{}
}
function record(state,id,{error=false,complete=false}={}){
  const current=state.records[id]||{attempts:0,errors:0,completed:false};
  state.records[id]={attempts:current.attempts+1,errors:current.errors+(error?1:0),completed:current.completed||complete};
  safeSave(state);
}
function completedCount(state){return Object.values(state.records).filter(item=>item?.completed).length;}
function lessonCompleted(state,lesson){return lesson.activities.filter(item=>state.records[item.id]?.completed).length;}

function artMarkup(key,{label=true}={}){
  const art=KHALED_SCIENCE_ART[key];if(!art)return'';
  return `<span class="khaled-science-art-wrap" aria-hidden="true"><span class="khaled-science-art" style="width:${art.width}px;height:${art.height}px;background-image:url('${SPRITE}');background-position:-${art.x}px -${art.y}px"></span></span>${label?`<small>${art.labelAr}</small>`:''}`;
}

function ensureShell(){
  if(document.getElementById('khaledScienceView'))return;
  const main=document.querySelector('main');if(!main)return;
  const view=document.createElement('section');view.id='khaledScienceView';view.className='view';
  view.innerHTML=`<div class="khaled-science-shell">
    <header class="khaled-science-header">
      <button class="icon-btn" id="khaledScienceBack" type="button" aria-label="العودة إلى مواد خالد">رجوع</button>
      <div><div class="kicker">علوم خالد</div><h1>علوم أول ابتدائي</h1><p>نفس صور ورقة العمل، لكن بتفاعل إلكتروني مناسب للتابلت.</p></div>
      <div class="khaled-science-total"><span>التقدم</span><strong id="khaledScienceTotal">0/${KHALED_SCIENCE_ACTIVITY_COUNT}</strong></div>
    </header>
    <section class="khaled-science-lessons" id="khaledScienceLessons" aria-label="دروس العلوم"></section>
    <section class="khaled-science-stage" id="khaledScienceStage" hidden>
      <div class="khaled-science-stage-head">
        <div><span id="khaledScienceChapter"></span><h2 id="khaledScienceLessonTitle"></h2></div>
        <button class="khaled-science-hear" id="khaledScienceHear" type="button"><span class="learning-speaker-mark" aria-hidden="true"><i></i></span><span>اسمع السؤال</span></button>
      </div>
      <div class="khaled-science-progress" role="progressbar" aria-label="تقدم الدرس" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="khaledScienceProgressBar"></i></div>
      <div class="khaled-science-question-card">
        <p class="khaled-science-step" id="khaledScienceStep"></p>
        <h3 id="khaledSciencePrompt"></h3>
        <div class="khaled-science-activity" id="khaledScienceActivity"></div>
        <div class="khaled-science-feedback" id="khaledScienceFeedback" role="status" aria-live="polite"></div>
        <div class="khaled-science-actions"><button class="btn primary" id="khaledScienceCheck" type="button" hidden>تحقق</button><button class="btn primary" id="khaledScienceNext" type="button" hidden>التالي</button></div>
      </div>
    </section>
  </div>`;
  main.appendChild(view);
}

export function createKhaledScienceController({showView,onBack}={}){
  let state=safeLoad(),lessonId=null,index=0,bound=false,activityDone=false,selected=new Set(),selectedLeft=null,connections=[];
  const speech=createSpeechService(),audio=createFeedbackAudio();
  const byId=id=>document.getElementById(id);
  const currentLesson=()=>getKhaledScienceLesson(lessonId);
  const currentActivity=()=>currentLesson()?.activities[index]||null;

  function refreshSummary(){
    const total=byId('khaledScienceTotal');if(total)total.textContent=`${completedCount(state)}/${KHALED_SCIENCE_ACTIVITY_COUNT}`;
    document.querySelectorAll('[data-science-lesson]').forEach(button=>{
      const lesson=getKhaledScienceLesson(button.dataset.scienceLesson),done=lesson?lessonCompleted(state,lesson):0;
      const progress=button.querySelector('[data-lesson-progress]');if(progress&&lesson)progress.textContent=`${done}/${lesson.activities.length}`;
    });
  }
  function renderLessons(){
    const host=byId('khaledScienceLessons');if(!host)return;
    host.innerHTML=KHALED_SCIENCE_LESSONS.map((lesson,i)=>`<button class="khaled-science-lesson" type="button" data-science-lesson="${lesson.id}">
      <span class="khaled-science-lesson-number">${i+1}</span><span><small>${lesson.chapter}</small><strong>${lesson.title}</strong><em>ورقة العمل • صفحة ${lesson.sourcePages.join('، ')}</em></span><b data-lesson-progress>0/${lesson.activities.length}</b>
    </button>`).join('');
    host.querySelectorAll('[data-science-lesson]').forEach(button=>button.addEventListener('click',()=>openLesson(button.dataset.scienceLesson)));
    refreshSummary();
  }
  function resetFeedback(){
    activityDone=false;selected=new Set();selectedLeft=null;connections=[];
    const feedback=byId('khaledScienceFeedback');if(feedback){feedback.textContent='';feedback.className='khaled-science-feedback';}
    byId('khaledScienceCheck').hidden=true;byId('khaledScienceNext').hidden=true;
  }
  function setProgress(){
    const lesson=currentLesson(),pct=lesson?Math.round(index/Math.max(lesson.activities.length,1)*100):0;
    const bar=byId('khaledScienceProgressBar');if(bar)bar.style.width=`${pct}%`;
    bar?.parentElement?.setAttribute('aria-valuenow',String(pct));
  }
  function markComplete(activity,{errors=0}={}){
    if(activityDone)return;activityDone=true;
    record(state,activity.id,{error:errors>0,complete:true});refreshSummary();
    const feedback=byId('khaledScienceFeedback');feedback.textContent=errors?'أحسنت، تعلمنا من المحاولة.':'ممتاز يا خالد!';feedback.className='khaled-science-feedback good';
    audio.correct();byId('khaledScienceNext').hidden=false;byId('khaledScienceCheck').hidden=true;
  }
  function markWrong(activity,message='جرّب مرة ثانية'){
    record(state,activity.id,{error:true,complete:false});
    const feedback=byId('khaledScienceFeedback');feedback.textContent=message;feedback.className='khaled-science-feedback bad';audio.wrong();
  }
  function renderChoice(activity,multiple){
    const host=byId('khaledScienceActivity');
    host.innerHTML=`<div class="khaled-science-options ${multiple?'multiple':''}">${activity.options.map(option=>`<button class="khaled-science-option" type="button" data-science-option="${option.id}" aria-pressed="false">${artMarkup(option.art)}<strong>${option.labelAr}</strong></button>`).join('')}</div>`;
    host.querySelectorAll('[data-science-option]').forEach(button=>button.addEventListener('click',()=>{
      if(activityDone)return;const value=button.dataset.scienceOption;
      if(multiple){
        if(selected.has(value))selected.delete(value);else selected.add(value);
        button.classList.toggle('selected',selected.has(value));button.setAttribute('aria-pressed',String(selected.has(value)));byId('khaledScienceCheck').hidden=selected.size===0;
      }else{
        const ok=value===activity.correct;
        button.classList.add(ok?'good':'bad');button.dataset.outcome=ok?'correct':'wrong';
        host.querySelectorAll('[data-science-option]').forEach(node=>node.disabled=true);
        if(ok)markComplete(activity);else{const correct=host.querySelector(`[data-science-option="${activity.correct}"]`);correct?.classList.add('good');markWrong(activity,'هذه الإجابة تحتاج مراجعة — شاهد الصحيح.');activityDone=true;byId('khaledScienceNext').hidden=false;}
      }
    }));
    if(multiple){
      const check=byId('khaledScienceCheck');check.hidden=true;check.onclick=()=>{
        if(activityDone)return;
        const wanted=new Set(activity.correct),ok=selected.size===wanted.size&&[...selected].every(value=>wanted.has(value));
        host.querySelectorAll('[data-science-option]').forEach(button=>{
          const value=button.dataset.scienceOption,isWanted=wanted.has(value),isSelected=selected.has(value);
          if(isWanted)button.classList.add('good');else if(isSelected)button.classList.add('bad');button.disabled=true;
        });
        if(ok)markComplete(activity);else{markWrong(activity,'شاهد الاختيارات الصحيحة ثم نكمل.');activityDone=true;byId('khaledScienceNext').hidden=false;check.hidden=true;}
      };
    }
  }
  function renderTrueFalse(activity){
    const host=byId('khaledScienceActivity');
    host.innerHTML=`<div class="khaled-science-truefalse"><button type="button" data-science-tf="true"><span>✓</span><strong>صح</strong></button><button type="button" data-science-tf="false"><span>✗</span><strong>خطأ</strong></button></div>`;
    host.querySelectorAll('[data-science-tf]').forEach(button=>button.addEventListener('click',()=>{
      if(activityDone)return;const value=button.dataset.scienceTf==='true',ok=value===activity.correct;
      host.querySelectorAll('[data-science-tf]').forEach(node=>node.disabled=true);
      button.classList.add(ok?'good':'bad');host.querySelector(`[data-science-tf="${String(activity.correct)}"]`)?.classList.add('good');
      if(ok)markComplete(activity);else{markWrong(activity,'شاهد الإجابة الصحيحة ثم نكمل.');activityDone=true;byId('khaledScienceNext').hidden=false;}
    }));
  }
  function findMatchButton(board,side,value){
    return [...board.querySelectorAll(`[data-match-${side}]`)].find(button=>button.dataset[side==='left'?'matchLeft':'matchRight']===value)||null;
  }
  function drawConnections(){
    const board=byId('khaledScienceMatchBoard'),svg=byId('khaledScienceMatchLines');if(!board||!svg)return;
    const box=board.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);svg.innerHTML='';
    for(const item of connections){
      const left=findMatchButton(board,'left',item.left),right=findMatchButton(board,'right',item.right);if(!left||!right)continue;
      const a=left.getBoundingClientRect(),b=right.getBoundingClientRect(),x1=a.right-box.left,y1=a.top+a.height/2-box.top,x2=b.left-box.left,y2=b.top+b.height/2-box.top;
      const line=document.createElementNS('http://www.w3.org/2000/svg','path');line.setAttribute('d',`M ${x1} ${y1} C ${x1+40} ${y1}, ${x2-40} ${y2}, ${x2} ${y2}`);svg.appendChild(line);
    }
  }
  function renderMatching(activity){
    const host=byId('khaledScienceActivity'),pairs=activity.pairs;
    host.innerHTML=`<div class="khaled-science-match-board" id="khaledScienceMatchBoard"><svg id="khaledScienceMatchLines" aria-hidden="true"></svg><div class="khaled-science-match-column left">${pairs.map(pair=>`<button type="button" data-match-left="${pair.left}">${pair.leftArt?artMarkup(pair.leftArt,{label:false}):''}<strong>${pair.left}</strong></button>`).join('')}</div><div class="khaled-science-match-column right">${pairs.slice().reverse().map(pair=>`<button type="button" data-match-right="${pair.right}">${pair.art?artMarkup(pair.art,{label:false}):''}<strong>${pair.rightLabel||KHALED_SCIENCE_ART[pair.art]?.labelAr||''}</strong></button>`).join('')}</div></div>`;
    const board=byId('khaledScienceMatchBoard');
    board.querySelectorAll('[data-match-left]').forEach(button=>button.addEventListener('click',()=>{
      if(button.classList.contains('matched')||activityDone)return;
      board.querySelectorAll('[data-match-left]').forEach(node=>node.classList.remove('selected'));button.classList.add('selected');selectedLeft=button.dataset.matchLeft;
    }));
    board.querySelectorAll('[data-match-right]').forEach(button=>button.addEventListener('click',()=>{
      if(!selectedLeft||button.classList.contains('matched')||activityDone)return;
      const pair=pairs.find(item=>item.left===selectedLeft),leftButton=findMatchButton(board,'left',selectedLeft),ok=pair?.right===button.dataset.matchRight;
      if(ok){
        leftButton?.classList.remove('selected');leftButton?.classList.add('matched');button.classList.add('matched');connections.push({left:selectedLeft,right:button.dataset.matchRight});selectedLeft=null;drawConnections();audio.correct();
        if(connections.length===pairs.length)markComplete(activity);
      }else{
        button.classList.add('bad');leftButton?.classList.add('bad');setTimeout(()=>{button.classList.remove('bad');leftButton?.classList.remove('bad');},500);markWrong(activity,'مو هذا الربط، جرّب مرة ثانية.');
      }
    }));
    requestAnimationFrame(drawConnections);
  }
  function renderActivity(){
    resetFeedback();const lesson=currentLesson(),activity=currentActivity();if(!lesson||!activity)return;
    byId('khaledScienceChapter').textContent=lesson.chapter;byId('khaledScienceLessonTitle').textContent=lesson.title;byId('khaledScienceStep').textContent=`نشاط ${index+1} من ${lesson.activities.length} • من ورقة العمل صفحة ${activity.sourcePage}`;byId('khaledSciencePrompt').textContent=activity.prompt;setProgress();
    if(activity.type==='single')renderChoice(activity,false);else if(activity.type==='multi')renderChoice(activity,true);else if(activity.type==='truefalse')renderTrueFalse(activity);else if(activity.type==='matching')renderMatching(activity);
    setTimeout(()=>{if(currentActivity()?.id===activity.id)speech.speak(activity.spokenPrompt||activity.prompt);},180);
  }
  function openLesson(id){
    const lesson=getKhaledScienceLesson(id);if(!lesson)return;lessonId=id;
    const firstIncomplete=lesson.activities.findIndex(activity=>!state.records[activity.id]?.completed);index=firstIncomplete>=0?firstIncomplete:0;
    byId('khaledScienceStage').hidden=false;renderActivity();byId('khaledScienceStage').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }
  function next(){
    const lesson=currentLesson();if(!lesson)return;
    if(index<lesson.activities.length-1){index+=1;renderActivity();return;}
    audio.achievement();byId('khaledScienceActivity').innerHTML='<div class="khaled-science-complete"><span aria-hidden="true">★</span><strong>أكملت الدرس يا خالد</strong><small>تقدر تعيده أو تختار درسًا ثانيًا.</small></div>';byId('khaledSciencePrompt').textContent='أحسنت!';byId('khaledScienceFeedback').textContent='';byId('khaledScienceNext').hidden=true;byId('khaledScienceCheck').hidden=true;const bar=byId('khaledScienceProgressBar');bar.style.width='100%';bar.parentElement?.setAttribute('aria-valuenow','100');
  }
  function bind(){
    if(bound)return;bound=true;
    byId('khaledScienceBack')?.addEventListener('click',()=>{speech.stop();onBack?.();});
    byId('khaledScienceHear')?.addEventListener('click',()=>{const activity=currentActivity();if(activity)speech.speak(activity.spokenPrompt||activity.prompt);});
    byId('khaledScienceNext')?.addEventListener('click',next);
    addEventListener('resize',()=>{if(document.getElementById('khaledScienceView')?.classList.contains('active'))drawConnections();},{passive:true});
  }
  return Object.freeze({
    open(){ensureStyle();ensureShell();bind();renderLessons();refreshSummary();showView?.('khaledScienceView');},
    leave(){speech.stop();},
    getProgress(){return JSON.parse(JSON.stringify(state));}
  });
}
