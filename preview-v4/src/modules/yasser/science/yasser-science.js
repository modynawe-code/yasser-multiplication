import {YASSER_SCIENCE_ASSETS,YASSER_SCIENCE_SCOPE} from './science-data.js';
import {YASSER_SCIENCE_PLAYABLE_QUESTIONS} from './science-question-bank.js';
import {DEFAULT_YASSER_SCIENCE_CHAPTER_ID,YASSER_SCIENCE_CHAPTERS,filterScienceProgressByChapter,filterScienceQuestionsByChapter,getScienceChapter} from './science-chapters.js';
import {applyScienceAttempt,applyScienceSessionSummary,createScienceSession,getScienceDashboard,getScienceReviewQuestionIds,sessionWrongQuestionIds,submitScienceAnswer} from './science-engine.js';

const STORAGE_KEY='family-learning:yasser:science:v1';
let mounted=false,session=null,progress=loadProgress(),feedbackTimer=null,selectedChapterId=DEFAULT_YASSER_SCIENCE_CHAPTER_ID;

function storage(){try{return globalThis.localStorage;}catch{return null;}}
function loadProgress(){try{return JSON.parse(storage()?.getItem(STORAGE_KEY)||'{}')||{};}catch{return {};}}
function saveProgress(){try{storage()?.setItem(STORAGE_KEY,JSON.stringify(progress));}catch{}}
function ensureStyle(){if(document.querySelector('link[data-module-style="yasser-science"]'))return;const link=document.createElement('link');link.rel='stylesheet';link.href='src/modules/yasser/science/yasser-science.css';link.dataset.moduleStyle='yasser-science';document.head.appendChild(link);}
function show(id){document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id===id));window.scrollTo(0,0);}
function clearTimer(){if(feedbackTimer){clearTimeout(feedbackTimer);feedbackTimer=null;}}
function selectedChapter(){return getScienceChapter(selectedChapterId);}
function chapterQuestions(){return filterScienceQuestionsByChapter(YASSER_SCIENCE_PLAYABLE_QUESTIONS,selectedChapterId);}
function chapterProgress(){return filterScienceProgressByChapter(progress,selectedChapterId);}

function ensureShell(){
  if(document.getElementById('yasserScienceView'))return;
  const main=document.querySelector('main');if(!main)return;
  const view=document.createElement('section');view.id='yasserScienceView';view.className='view';
  view.innerHTML=`<div class="yasser-science-shell">
    <header class="yasser-science-head">
      <div><div class="kicker">علوم ياسر</div><h1>اختبارات ومسابقات الفصل الدراسي الأول</h1><p>${YASSER_SCIENCE_SCOPE.label}</p></div>
      <button class="icon-btn" id="yasserScienceBack" type="button">رجوع</button>
    </header>

    <section class="science-chapter-picker" aria-label="اختر الفصل">
      <div class="science-chapter-copy"><span>الفصل الذي يذاكره ياسر الآن</span><strong id="scienceCurrentChapter"></strong></div>
      <div class="science-chapter-tabs" id="scienceChapterTabs"></div>
    </section>

    <section class="yasser-science-dashboard" id="scienceDashboard" aria-label="تقدم العلوم"></section>

    <section class="yasser-science-modes" id="scienceModes" aria-label="اختر نوع التحدي">
      <button type="button" data-science-mode="quick"><span class="science-mode-code">10</span><span><strong>تحدي سريع</strong><small>10 أسئلة من الفصل المحدد مع تصحيح فوري</small></span></button>
      <button type="button" data-science-mode="images"><span class="science-mode-code">ص</span><span><strong>تحدي الصور</strong><small>رسومات وصور من الفصل المحدد</small></span></button>
      <button type="button" data-science-mode="exam"><span class="science-mode-code">20</span><span><strong>اختبار المدرسة</strong><small>20 سؤالًا من الفصل المحدد بدون كشف الإجابة أثناء الحل</small></span></button>
    </section>

    <section class="yasser-science-session" id="scienceSession" hidden>
      <div class="science-session-bar">
        <button type="button" class="science-exit" id="scienceExit">إنهاء الجولة</button>
        <div class="science-progress-copy"><strong id="scienceStep">السؤال 1</strong><span id="scienceModeLabel"></span></div>
        <div class="science-score"><span>النقاط <b id="sciencePoints">0</b></span><span>السلسلة <b id="scienceStreak">0</b></span></div>
      </div>
      <div class="science-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="scienceProgress"></span></div>
      <article class="science-question-card" id="scienceQuestionCard">
        <figure class="science-question-image" id="scienceImageWrap" hidden>
          <button class="science-image-open" id="scienceImageOpen" type="button" aria-label="تكبير صورة السؤال">
            <img id="scienceImage" alt="" />
            <span>🔍 تكبير الصورة</span>
          </button>
        </figure>
        <div class="science-question-source" id="scienceSource"></div>
        <h2 id="sciencePrompt"></h2>
        <div class="science-answers" id="scienceAnswers"></div>
        <p class="science-feedback" id="scienceFeedback" aria-live="polite"></p>
      </article>
    </section>

    <section class="yasser-science-result" id="scienceResult" hidden>
      <div class="science-result-score" id="scienceResultScore">0%</div>
      <h2 id="scienceResultTitle">انتهى التحدي</h2>
      <p id="scienceResultCopy"></p>
      <div class="science-result-stats"><span>صحيح <b id="scienceResultCorrect">0</b></span><span>خطأ <b id="scienceResultWrong">0</b></span><span>أفضل سلسلة <b id="scienceResultStreak">0</b></span></div>
      <div class="science-result-actions"><button type="button" class="btn primary" id="scienceReviewMistakes">راجع أخطاء الجولة</button><button type="button" class="btn secondary" id="scienceResultHome">العودة للعلوم</button></div>
    </section>
  </div>
  <div class="science-image-modal" id="scienceImageModal" hidden role="dialog" aria-modal="true" aria-label="صورة السؤال مكبرة">
    <button type="button" class="science-image-modal-close" id="scienceImageModalClose" aria-label="إغلاق الصورة">إغلاق ×</button>
    <div class="science-image-modal-stage"><img id="scienceImageModalImg" alt="" /></div>
  </div>`;
  main.appendChild(view);
}

function renderChapterPicker(){
  const host=document.getElementById('scienceChapterTabs');const current=document.getElementById('scienceCurrentChapter');if(!host||!current)return;
  const chapter=selectedChapter();current.textContent=chapter.label;
  host.innerHTML='';
  YASSER_SCIENCE_CHAPTERS.forEach(item=>{const button=document.createElement('button');button.type='button';button.className='science-chapter-tab';button.dataset.chapterId=item.id;button.setAttribute('aria-pressed',String(item.id===selectedChapterId));button.classList.toggle('active',item.id===selectedChapterId);button.innerHTML=`<span>${item.id===DEFAULT_YASSER_SCIENCE_CHAPTER_ID?'الآن':'التالي'}</span><strong>${item.label}</strong>`;button.addEventListener('click',()=>selectChapter(item.id));host.appendChild(button);});
}

function selectChapter(chapterId){
  const next=getScienceChapter(chapterId);if(next.id===selectedChapterId)return;
  clearTimer();closeImageZoom();session=null;selectedChapterId=next.id;renderChapterPicker();showLanding();
}

function renderDashboard(){
  const dashboard=getScienceDashboard(chapterProgress());const host=document.getElementById('scienceDashboard');if(!host)return;
  host.innerHTML=`<div><span>جاهزية ${selectedChapter().shortLabel}</span><strong>${dashboard.readiness}</strong></div><div><span>دقة آخر المحاولات</span><strong>${dashboard.recentAccuracy}%</strong></div><div><span>تحتاج مراجعة</span><strong>${dashboard.reviewCount}</strong></div><div><span>نقاط هذا الفصل</span><strong>${dashboard.points}</strong></div>`;
  const modes=document.getElementById('scienceModes');
  let review=document.getElementById('scienceReviewEntry');
  if(dashboard.reviewCount){
    if(!review){review=document.createElement('button');review.id='scienceReviewEntry';review.type='button';review.className='science-review-entry';review.innerHTML='<span>مراجعة ذكية</span><strong>أسئلتي اللي أخطأت فيها في هذا الفصل</strong>';review.addEventListener('click',()=>startScience('review'));modes?.after(review);}
    review.hidden=false;
  }else if(review)review.hidden=true;
}

function modeLabel(mode){return {quick:'تحدي سريع',images:'تحدي الصور',exam:'اختبار المدرسة',review:'مراجعة الأخطاء'}[mode]||'علوم';}
function showLanding(){clearTimer();closeImageZoom();session=null;document.getElementById('scienceSession').hidden=true;document.getElementById('scienceResult').hidden=true;document.getElementById('scienceModes').hidden=false;document.querySelector('.science-chapter-picker').hidden=false;renderChapterPicker();renderDashboard();}

function startScience(mode,reviewIds=[]){
  clearTimer();closeImageZoom();
  const scopedProgress=chapterProgress();const questions=chapterQuestions();
  const ids=mode==='review'?(reviewIds.length?reviewIds:getScienceReviewQuestionIds(scopedProgress)):[];
  session=createScienceSession({mode,progress:scopedProgress,questions,reviewQuestionIds:ids});
  if(!session.questions.length){showLanding();return;}
  document.querySelector('.science-chapter-picker').hidden=true;document.getElementById('scienceModes').hidden=true;const reviewEntry=document.getElementById('scienceReviewEntry');if(reviewEntry)reviewEntry.hidden=true;document.getElementById('scienceResult').hidden=true;document.getElementById('scienceSession').hidden=false;
  document.getElementById('scienceModeLabel').textContent=`${modeLabel(session.mode)} • ${selectedChapter().label}`;renderQuestion();
}

function renderQuestion(){
  if(!session||session.completed){finishScience();return;}
  closeImageZoom();
  const question=session.questions[session.index];const total=session.questions.length;const completed=session.answers.length;const pct=Math.round((completed/Math.max(total,1))*100);
  document.getElementById('scienceStep').textContent=`السؤال ${session.index+1} من ${total}`;document.getElementById('scienceProgress').style.width=`${pct}%`;
  document.querySelector('.science-progress-track')?.setAttribute('aria-valuenow',String(pct));document.getElementById('sciencePoints').textContent=String(session.points);document.getElementById('scienceStreak').textContent=String(session.streak);
  document.getElementById('sciencePrompt').textContent=question.prompt;document.getElementById('scienceFeedback').textContent='';document.getElementById('scienceFeedback').className='science-feedback';
  const source=document.getElementById('scienceSource');source.hidden=session.mode==='exam';source.textContent=question.assetId?'سؤال بصري من نمط الاختبارات السابقة':'سؤال من نمط الاختبارات السابقة';
  const wrap=document.getElementById('scienceImageWrap');const image=document.getElementById('scienceImage');const asset=question.assetId?YASSER_SCIENCE_ASSETS[question.assetId]:null;
  wrap.hidden=!asset;if(asset){image.src=asset.src;image.alt=asset.alt;document.getElementById('scienceImageOpen').dataset.assetId=asset.id;}else{image.removeAttribute('src');image.alt='';document.getElementById('scienceImageOpen').removeAttribute('data-asset-id');}
  const answers=document.getElementById('scienceAnswers');answers.innerHTML='';
  question.choices.forEach(choice=>{const button=document.createElement('button');button.type='button';button.className='science-answer';button.textContent=choice;button.addEventListener('click',()=>answerQuestion(choice,button));answers.appendChild(button);});
}

function openImageZoom(){
  const image=document.getElementById('scienceImage');if(!image?.src)return;
  const modal=document.getElementById('scienceImageModal');const modalImage=document.getElementById('scienceImageModalImg');if(!modal||!modalImage)return;
  modalImage.src=image.src;modalImage.alt=image.alt;modal.hidden=false;document.body.classList.add('science-image-zoom-open');document.getElementById('scienceImageModalClose')?.focus();
}
function closeImageZoom(){
  const modal=document.getElementById('scienceImageModal');if(!modal||modal.hidden)return;
  modal.hidden=true;document.body.classList.remove('science-image-zoom-open');const modalImage=document.getElementById('scienceImageModalImg');if(modalImage){modalImage.removeAttribute('src');modalImage.alt='';}
}

function answerQuestion(choice,button){
  if(!session||button.disabled)return;
  document.querySelectorAll('#scienceAnswers .science-answer').forEach(node=>{node.disabled=true;});
  const result=submitScienceAnswer({session,answer:choice});if(!result.accepted)return;
  progress=applyScienceAttempt(progress,result.attempt);progress=applyScienceSessionSummary(progress,session);saveProgress();
  document.getElementById('sciencePoints').textContent=String(session.points);document.getElementById('scienceStreak').textContent=String(session.streak);
  if(session.mode==='exam'){feedbackTimer=setTimeout(renderQuestion,180);return;}
  const feedback=document.getElementById('scienceFeedback');
  if(result.attempt.isCorrect){button.classList.add('correct');feedback.textContent='صحيح — كمل.';feedback.classList.add('good');}
  else{
    button.classList.add('wrong');const correct=[...document.querySelectorAll('#scienceAnswers .science-answer')].find(node=>node.textContent===result.question.answer);correct?.classList.add('correct');feedback.textContent=result.question.feedback;feedback.classList.add('bad');
  }
  feedbackTimer=setTimeout(renderQuestion,result.attempt.isCorrect?900:1500);
}

function finishScience(){
  if(!session)return;clearTimer();closeImageZoom();progress=applyScienceSessionSummary(progress,session);saveProgress();
  document.getElementById('scienceSession').hidden=true;document.getElementById('scienceResult').hidden=false;
  const total=Math.max(session.answers.length,1);const pct=Math.round((session.correct/total)*100);document.getElementById('scienceResultScore').textContent=`${pct}%`;
  document.getElementById('scienceResultCorrect').textContent=String(session.correct);document.getElementById('scienceResultWrong').textContent=String(session.wrong);document.getElementById('scienceResultStreak').textContent=String(session.bestStreak);
  document.getElementById('scienceResultTitle').textContent=pct>=90?'إتقان قوي':pct>=75?'نتيجة جيدة':'نحتاج جولة مراجعة';
  document.getElementById('scienceResultCopy').textContent=session.mode==='exam'?`انتهى اختبار ${selectedChapter().label}. الأخطاء محفوظة للمراجعة داخل الفصل نفسه.`:'الأخطاء انتقلت تلقائيًا لمراجعة هذا الفصل.';
  const reviewIds=sessionWrongQuestionIds(session);const review=document.getElementById('scienceReviewMistakes');review.hidden=!reviewIds.length;review.onclick=()=>startScience('review',reviewIds);
}

function bind(){
  if(mounted)return;mounted=true;
  document.querySelectorAll('[data-science-mode]').forEach(button=>button.addEventListener('click',()=>startScience(button.dataset.scienceMode)));
  document.getElementById('scienceExit')?.addEventListener('click',showLanding);document.getElementById('scienceResultHome')?.addEventListener('click',showLanding);
  document.getElementById('yasserScienceBack')?.addEventListener('click',()=>closeYasserScience());
  document.getElementById('scienceImageOpen')?.addEventListener('click',openImageZoom);document.getElementById('scienceImageModalClose')?.addEventListener('click',closeImageZoom);
  document.getElementById('scienceImageModal')?.addEventListener('click',event=>{if(event.target.id==='scienceImageModal')closeImageZoom();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeImageZoom();});
}

export function openYasserScience(){ensureStyle();ensureShell();bind();progress=loadProgress();selectedChapterId=DEFAULT_YASSER_SCIENCE_CHAPTER_ID;document.body.classList.remove('intro-mode','yasser-quran-mode','hub-mode','khaled-mode','mashaal-mode');document.body.classList.add('yasser-science-mode');show('yasserScienceView');showLanding();}
export function closeYasserScience(){clearTimer();closeImageZoom();session=null;document.body.classList.remove('yasser-science-mode');document.body.classList.add('intro-mode');show('introView');}
