import { createSpeechService } from '../../../shared/audio/speech-service.js';
import { createFeedbackAudio } from '../../../ui/audio/feedback-audio.js';
import { KHALED_SCIENCE_ATLAS,KHALED_SCIENCE_ATLAS_WIDTH,KHALED_SCIENCE_ATLAS_HEIGHT,KHALED_SCIENCE_ATLAS_PARTS } from './khaled-science-atlas-manifest.js';
import { KHALED_SCIENCE_LESSONS,KHALED_SCIENCE_ACTIVITY_COUNT,getKhaledScienceLesson } from './khaled-science-curriculum.js';

const STORAGE_KEY='family-learning:khaled:science:v1';
let atlasDataUrl='';
let atlasPromise=null;

function ensureStyle(){
  if(document.querySelector('link[data-module-style="khaled-science"]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='src/modules/khaled/science/khaled-science.css';
  link.dataset.moduleStyle='khaled-science';
  document.head.appendChild(link);
}

function decodeAtlasPart(source){
  const normalized=source.trim().replace(/\s+/g,'');
  const remainder=normalized.length%4;
  if(remainder===1)throw new Error('Invalid science atlas base64 chunk');
  const padded=remainder?normalized.padEnd(normalized.length+(4-remainder),'='):normalized;
  const binary=atob(padded);
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i+=1)bytes[i]=binary.charCodeAt(i);
  return bytes;
}

async function loadAtlas(){
  if(atlasDataUrl)return atlasDataUrl;
  if(!atlasPromise){
    atlasPromise=Promise.all(KHALED_SCIENCE_ATLAS_PARTS.map(async path=>{
      const response=await fetch(path,{cache:'force-cache'});
      if(!response.ok)throw new Error(`Science atlas part failed: ${path} ${response.status}`);
      return decodeAtlasPart(await response.text());
    })).then(parts=>{
      const blob=new Blob(parts,{type:'image/webp'});
      atlasDataUrl=URL.createObjectURL(blob);
      return atlasDataUrl;
    });
  }
  return atlasPromise;
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
function recordAttempt(state,id,{error=false,complete=false}={}){
  const current=state.records[id]||{attempts:0,errors:0,completed:false};
  state.records[id]={attempts:current.attempts+1,errors:current.errors+(error?1:0),completed:current.completed||complete};
  safeSave(state);
}
function completedCount(state){return Object.values(state.records).filter(item=>item?.completed).length;}
function lessonCompleted(state,lesson){return lesson.activities.filter(item=>state.records[item.id]?.completed).length;}

function artMarkup(key,{label=false}={}){
  const art=KHALED_SCIENCE_ATLAS[key];
  if(!art||!atlasDataUrl)return'';
  return `<span class="khaled-science-art-wrap" aria-hidden="true"><span class="khaled-science-art" style="width:${art.width}px;height:${art.height}px;background-image:url('${atlasDataUrl}');background-size:${KHALED_SCIENCE_ATLAS_WIDTH}px ${KHALED_SCIENCE_ATLAS_HEIGHT}px;background-position:-${art.x}px -${art.y}px"></span></span>${label?`<small>${art.labelAr}</small>`:''}`;
}

function ensureShell(){
  if(document.getElementById('khaledScienceView'))return;
  const main=document.querySelector('main');
  if(!main)return;
  const view=document.createElement('section');
  view.id='khaledScienceView';
  view.className='view';
  view.innerHTML=`<div class="khaled-science-shell">
    <header class="khaled-science-header">
      <button class="icon-btn" id="khaledScienceBack" type="button" aria-label="العودة إلى مواد خالد">رجوع</button>
      <div><div class="kicker">علوم خالد</div><h1>علوم أول ابتدائي</h1><p>أنشطة تفاعلية من نفس أوراق العمل وصورها.</p></div>
      <div class="khaled-science-total"><span>التقدم</span><strong id="khaledScienceTotal">0/${KHALED_SCIENCE_ACTIVITY_COUNT}</strong></div>
    </header>
    <div class="khaled-science-loading" id="khaledScienceLoading">جاري تجهيز صور المنهج…</div>
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

function shuffled(items){
  const copy=[...items];
  for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
  if(copy.length>1&&copy.every((item,i)=>item.id===items[i].id)) [copy[0],copy[1]]=[copy[1],copy[0]];
  return copy;
}

export function createKhaledScienceController({showView,onBack}={}){
  let state=safeLoad();
  let lessonId=null,index=0,bound=false,activityDone=false,selected=new Set(),selectedLeft=null,connections=[],activityErrors=0;
  const speech=createSpeechService();
  const audio=createFeedbackAudio();
  const byId=id=>document.getElementById(id);
  const currentLesson=()=>getKhaledScienceLesson(lessonId);
  const currentActivity=()=>currentLesson()?.activities[index]||null;

  function refreshSummary(){
    const total=byId('khaledScienceTotal');
    if(total)total.textContent=`${completedCount(state)}/${KHALED_SCIENCE_ACTIVITY_COUNT}`;
    document.querySelectorAll('[data-science-lesson]').forEach(button=>{
      const lesson=getKhaledScienceLesson(button.dataset.scienceLesson);
      const done=lesson?lessonCompleted(state,lesson):0;
      const progress=button.querySelector('[data-lesson-progress]');
      if(progress&&lesson)progress.textContent=`${done}/${lesson.activities.length}`;
    });
  }
  function renderLessons(){
    const host=byId('khaledScienceLessons');
    if(!host)return;
    host.innerHTML=KHALED_SCIENCE_LESSONS.map((lesson,i)=>`<button class="khaled-science-lesson ${lesson.kind==='review'?'review':''}" type="button" data-science-lesson="${lesson.id}">
      <span class="khaled-science-lesson-number">${i+1}</span><span><small>${lesson.chapter} • ${lesson.chapterTitle}</small><strong>${lesson.title}</strong><em>${lesson.kind==='review'?'مراجعة الفصل':'درس'} • صفحة ${lesson.sourcePages.join('، ')}</em></span><b data-lesson-progress>0/${lesson.activities.length}</b>
    </button>`).join('');
    host.querySelectorAll('[data-science-lesson]').forEach(button=>button.addEventListener('click',()=>openLesson(button.dataset.scienceLesson)));
    refreshSummary();
  }
  function resetActivityState(){
    activityDone=false;selected=new Set();selectedLeft=null;connections=[];activityErrors=0;
    const feedback=byId('khaledScienceFeedback');
    if(feedback){feedback.textContent='';feedback.className='khaled-science-feedback';}
    byId('khaledScienceCheck').hidden=true;
    byId('khaledScienceNext').hidden=true;
  }
  function setProgress(){
    const lesson=currentLesson();
    const pct=lesson?Math.round(index/Math.max(lesson.activities.length,1)*100):0;
    const bar=byId('khaledScienceProgressBar');
    if(bar)bar.style.width=`${pct}%`;
    bar?.parentElement?.setAttribute('aria-valuenow',String(pct));
  }
  function feedback(message,good=false){
    const node=byId('khaledScienceFeedback');
    if(!node)return;
    node.textContent=message;
    node.className=`khaled-science-feedback ${good?'good':'bad'}`;
  }
  function markComplete(activity,message='ممتاز يا خالد!'){
    if(activityDone)return;
    activityDone=true;
    recordAttempt(state,activity.id,{error:activityErrors>0,complete:true});
    refreshSummary();
    feedback(message,true);
    audio.correct();
    byId('khaledScienceNext').hidden=false;
    byId('khaledScienceCheck').hidden=true;
  }
  function markWrong(activity,message='جرّب مرة ثانية'){
    activityErrors+=1;
    recordAttempt(state,activity.id,{error:true,complete:false});
    feedback(message,false);
    audio.wrong();
  }

  function renderChoice(activity,multiple){
    const host=byId('khaledScienceActivity');
    host.innerHTML=`<div class="khaled-science-options ${multiple?'multiple':''}">${activity.options.map(option=>`<button class="khaled-science-option" type="button" data-science-option="${option.id}" aria-pressed="false">${artMarkup(option.art)}<strong>${option.labelAr}</strong></button>`).join('')}</div>`;
    host.querySelectorAll('[data-science-option]').forEach(button=>button.addEventListener('click',()=>{
      if(activityDone)return;
      const value=button.dataset.scienceOption;
      if(multiple){
        if(selected.has(value))selected.delete(value);else selected.add(value);
        button.classList.toggle('selected',selected.has(value));
        button.setAttribute('aria-pressed',String(selected.has(value)));
        byId('khaledScienceCheck').hidden=selected.size===0;
        return;
      }
      const ok=value===activity.correct;
      if(ok){button.classList.add('good');host.querySelectorAll('[data-science-option]').forEach(node=>node.disabled=true);markComplete(activity);return;}
      button.classList.add('bad');setTimeout(()=>button.classList.remove('bad'),500);markWrong(activity,'مو هذا الخيار، جرّب مرة ثانية.');
    }));
    if(multiple){
      const check=byId('khaledScienceCheck');
      check.hidden=true;
      check.onclick=()=>{
        if(activityDone)return;
        const wanted=new Set(activity.correct);
        const ok=selected.size===wanted.size&&[...selected].every(value=>wanted.has(value));
        if(ok){host.querySelectorAll('[data-science-option]').forEach(button=>{if(wanted.has(button.dataset.scienceOption))button.classList.add('good');button.disabled=true;});markComplete(activity);return;}
        host.querySelectorAll('[data-science-option]').forEach(button=>button.classList.toggle('bad',selected.has(button.dataset.scienceOption)&&!wanted.has(button.dataset.scienceOption)));
        markWrong(activity,'راجع اختياراتك وحاول مرة ثانية.');
      };
    }
  }

  function renderTrueFalse(activity){
    const host=byId('khaledScienceActivity');
    host.innerHTML=`<div class="khaled-science-truefalse"><button type="button" data-science-tf="true"><span>✓</span><strong>صح</strong></button><button type="button" data-science-tf="false"><span>✗</span><strong>خطأ</strong></button></div>`;
    host.querySelectorAll('[data-science-tf]').forEach(button=>button.addEventListener('click',()=>{
      if(activityDone)return;
      const value=button.dataset.scienceTf==='true';
      if(value===activity.correct){button.classList.add('good');host.querySelectorAll('[data-science-tf]').forEach(node=>node.disabled=true);markComplete(activity);return;}
      button.classList.add('bad');setTimeout(()=>button.classList.remove('bad'),500);markWrong(activity,'فكر في العبارة مرة ثانية.');
    }));
  }

  function findMatchButton(board,side,value){
    const key=side==='left'?'matchLeft':'matchRight';
    return [...board.querySelectorAll(`[data-match-${side}]`)].find(button=>button.dataset[key]===value)||null;
  }
  function drawConnections(){
    const board=byId('khaledScienceMatchBoard'),svg=byId('khaledScienceMatchLines');
    if(!board||!svg)return;
    const box=board.getBoundingClientRect();
    if(!box.width||!box.height)return;
    svg.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);svg.innerHTML='';
    for(const item of connections){
      const left=findMatchButton(board,'left',item.left),right=findMatchButton(board,'right',item.right);
      if(!left||!right)continue;
      const a=left.getBoundingClientRect(),b=right.getBoundingClientRect();
      const x1=a.right-box.left,y1=a.top+a.height/2-box.top,x2=b.left-box.left,y2=b.top+b.height/2-box.top;
      const line=document.createElementNS('http://www.w3.org/2000/svg','path');
      line.setAttribute('d',`M ${x1} ${y1} C ${x1+40} ${y1}, ${x2-40} ${y2}, ${x2} ${y2}`);
      svg.appendChild(line);
    }
  }
  function renderMatching(activity){
    const host=byId('khaledScienceActivity'),pairs=activity.pairs;
    host.innerHTML=`<div class="khaled-science-match-board" id="khaledScienceMatchBoard"><svg id="khaledScienceMatchLines" aria-hidden="true"></svg><div class="khaled-science-match-column left">${pairs.map(pair=>`<button type="button" data-match-left="${pair.left}">${pair.leftArt?artMarkup(pair.leftArt):''}<strong>${pair.left}</strong></button>`).join('')}</div><div class="khaled-science-match-column right">${pairs.slice().reverse().map(pair=>`<button type="button" data-match-right="${pair.right}">${pair.art?artMarkup(pair.art):''}<strong>${pair.rightLabel||KHALED_SCIENCE_ATLAS[pair.art]?.labelAr||''}</strong></button>`).join('')}</div></div>`;
    const board=byId('khaledScienceMatchBoard');
    board.querySelectorAll('[data-match-left]').forEach(button=>button.addEventListener('click',()=>{
      if(button.classList.contains('matched')||activityDone)return;
      board.querySelectorAll('[data-match-left]').forEach(node=>node.classList.remove('selected'));
      button.classList.add('selected');
      selectedLeft=button.dataset.matchLeft;
    }));
    board.querySelectorAll('[data-match-right]').forEach(button=>button.addEventListener('click',()=>{
      if(!selectedLeft||button.classList.contains('matched')||activityDone)return;
      const pair=pairs.find(item=>item.left===selectedLeft);
      const leftButton=findMatchButton(board,'left',selectedLeft);
      if(pair?.right===button.dataset.matchRight){
        leftButton?.classList.remove('selected');leftButton?.classList.add('matched');button.classList.add('matched');
        connections.push({left:selectedLeft,right:button.dataset.matchRight});selectedLeft=null;drawConnections();audio.correct();
        if(connections.length===pairs.length)markComplete(activity,'أحسنت، اكتمل التوصيل.');
        return;
      }
      button.classList.add('bad');leftButton?.classList.add('bad');setTimeout(()=>{button.classList.remove('bad');leftButton?.classList.remove('bad');},500);markWrong(activity,'مو هذا الربط، جرّب مرة ثانية.');
    }));
    requestAnimationFrame(drawConnections);
  }

  function renderSequence(activity){
    const host=byId('khaledScienceActivity');
    const correct=activity.items.map(item=>item.id);
    const items=shuffled(activity.items);
    host.innerHTML=`<div class="khaled-science-sequence" id="khaledScienceSequence">${items.map((item,i)=>`<button class="khaled-science-sequence-item" type="button" data-seq-id="${item.id}" aria-label="${item.labelAr}، الموقع ${i+1}"><span class="khaled-science-sequence-rank">${i+1}</span>${artMarkup(item.art)}<strong>${item.labelAr}</strong><span class="khaled-science-drag-hint">اسحب للترتيب</span></button>`).join('')}</div>`;
    const board=byId('khaledScienceSequence');
    let dragging=null,moved=false,startX=0,startY=0;
    const renumber=()=>[...board.children].forEach((node,i)=>{node.querySelector('.khaled-science-sequence-rank').textContent=i+1;node.setAttribute('aria-label',`${node.querySelector('strong').textContent}، الموقع ${i+1}`);});
    board.addEventListener('pointerdown',event=>{
      const item=event.target.closest('[data-seq-id]');if(!item||activityDone)return;
      dragging=item;moved=false;startX=event.clientX;startY=event.clientY;item.classList.add('dragging');item.setPointerCapture?.(event.pointerId);
    });
    board.addEventListener('pointermove',event=>{
      if(!dragging)return;
      if(Math.hypot(event.clientX-startX,event.clientY-startY)>8)moved=true;
      const target=document.elementFromPoint(event.clientX,event.clientY)?.closest?.('[data-seq-id]');
      if(!target||target===dragging||target.parentElement!==board)return;
      const rect=target.getBoundingClientRect();
      const horizontal=board.scrollWidth>board.clientWidth||window.matchMedia('(min-width:760px)').matches;
      const before=horizontal?event.clientX<rect.left+rect.width/2:event.clientY<rect.top+rect.height/2;
      board.insertBefore(dragging,before?target:target.nextSibling);renumber();
    });
    const finish=event=>{if(!dragging)return;dragging.releasePointerCapture?.(event.pointerId);dragging.classList.remove('dragging');dragging=null;renumber();};
    board.addEventListener('pointerup',finish);board.addEventListener('pointercancel',finish);
    const check=byId('khaledScienceCheck');check.hidden=false;check.onclick=()=>{
      if(activityDone)return;
      const order=[...board.querySelectorAll('[data-seq-id]')].map(node=>node.dataset.seqId);
      const ok=order.every((id,i)=>id===correct[i]);
      if(ok){board.querySelectorAll('[data-seq-id]').forEach(node=>{node.classList.add('good');node.disabled=true;});markComplete(activity,'ممتاز، هذا هو ترتيب نمو النبات.');return;}
      board.querySelectorAll('[data-seq-id]').forEach(node=>node.classList.remove('good'));
      markWrong(activity,'الترتيب يحتاج تعديل. اسحب المراحل وحاول مرة ثانية.');
    };
  }

  function renderActivity(){
    resetActivityState();
    const lesson=currentLesson(),activity=currentActivity();
    if(!lesson||!activity)return;
    byId('khaledScienceChapter').textContent=`${lesson.chapter} • ${lesson.chapterTitle}`;
    byId('khaledScienceLessonTitle').textContent=lesson.title;
    byId('khaledScienceStep').textContent=`نشاط ${index+1} من ${lesson.activities.length} • صفحة ${activity.sourcePage}`;
    byId('khaledSciencePrompt').textContent=activity.prompt;
    setProgress();
    if(activity.type==='single')renderChoice(activity,false);
    else if(activity.type==='multi')renderChoice(activity,true);
    else if(activity.type==='truefalse')renderTrueFalse(activity);
    else if(activity.type==='matching')renderMatching(activity);
    else if(activity.type==='sequence')renderSequence(activity);
    else byId('khaledScienceActivity').innerHTML='<p class="khaled-science-unsupported">هذا النشاط غير متاح حاليًا.</p>';
    setTimeout(()=>{if(currentActivity()?.id===activity.id)speech.speak(activity.spokenPrompt||activity.prompt);},180);
  }
  function openLesson(id){
    const lesson=getKhaledScienceLesson(id);if(!lesson)return;
    lessonId=id;
    const firstIncomplete=lesson.activities.findIndex(activity=>!state.records[activity.id]?.completed);
    index=firstIncomplete>=0?firstIncomplete:0;
    byId('khaledScienceStage').hidden=false;
    renderActivity();
    byId('khaledScienceStage').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }
  function next(){
    const lesson=currentLesson();if(!lesson)return;
    if(index<lesson.activities.length-1){index+=1;renderActivity();return;}
    audio.achievement();
    byId('khaledScienceActivity').innerHTML='<div class="khaled-science-complete"><span aria-hidden="true">★</span><strong>أكملت الدرس يا خالد</strong><small>اختر درسًا آخر أو أعد هذا الدرس للتثبيت.</small></div>';
    byId('khaledSciencePrompt').textContent='أحسنت!';byId('khaledScienceFeedback').textContent='';byId('khaledScienceNext').hidden=true;byId('khaledScienceCheck').hidden=true;
    const bar=byId('khaledScienceProgressBar');bar.style.width='100%';bar.parentElement?.setAttribute('aria-valuenow','100');refreshSummary();
  }
  function bind(){
    if(bound)return;bound=true;
    byId('khaledScienceBack')?.addEventListener('click',()=>{speech.stop();onBack?.();});
    byId('khaledScienceHear')?.addEventListener('click',()=>{const activity=currentActivity();if(activity)speech.speak(activity.spokenPrompt||activity.prompt);});
    byId('khaledScienceNext')?.addEventListener('click',next);
    addEventListener('resize',()=>{if(document.getElementById('khaledScienceView')?.classList.contains('active'))drawConnections();},{passive:true});
  }
  return Object.freeze({
    async open(){
      ensureStyle();ensureShell();bind();showView?.('khaledScienceView');
      const loading=byId('khaledScienceLoading');
      if(loading){loading.hidden=false;loading.textContent='جاري تجهيز صور المنهج…';}
      try{await loadAtlas();if(loading)loading.hidden=true;renderLessons();refreshSummary();}
      catch(error){console.error(error);if(loading){loading.hidden=false;loading.textContent='تعذر تجهيز صور العلوم. تحقق من الاتصال ثم أعد المحاولة.';}}
    },
    leave(){speech.stop();},
    getProgress(){return JSON.parse(JSON.stringify(state));}
  });
}