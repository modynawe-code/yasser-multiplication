import {YASSER_SCIENCE_ASSETS,YASSER_SCIENCE_SCOPE} from './science-data.js';
import {YASSER_SCIENCE_PLAYABLE_QUESTIONS} from './science-question-bank.js';
import {YASSER_SCIENCE_VISUAL_ASSETS} from './science-visuals.js';
import {YASSER_SCIENCE_UNIT2_VISUAL_ASSETS} from './science-unit2-visuals.generated.js';
import {YASSER_SCIENCE_UNIT3_VISUAL_ASSETS} from './science-unit3-visuals.generated.js';
import {DEFAULT_YASSER_SCIENCE_UNIT_ID,YASSER_SCIENCE_UNITS,filterScienceProgressByUnit,filterScienceQuestionsByUnit,getScienceChapter,getScienceUnit} from './science-chapters.js';
import {applyScienceAttempt,applyScienceSessionSummary,createScienceSession,getScienceDashboard,getScienceReviewQuestionIds,sessionWrongQuestionIds,submitScienceAnswer} from './science-engine.js';

const STORAGE_KEY='family-learning:yasser:science:v1';
const SCIENCE_ASSETS=Object.freeze({...YASSER_SCIENCE_ASSETS,...YASSER_SCIENCE_VISUAL_ASSETS,...YASSER_SCIENCE_UNIT2_VISUAL_ASSETS,...YASSER_SCIENCE_UNIT3_VISUAL_ASSETS});
let mounted=false,session=null,progress=loadProgress(),feedbackTimer=null,activeUnitId=DEFAULT_YASSER_SCIENCE_UNIT_ID;

function storage(){try{return globalThis.localStorage;}catch{return null;}}
function loadProgress(){try{return JSON.parse(storage()?.getItem(STORAGE_KEY)||'{}')||{};}catch{return {};}}
function saveProgress(){try{storage()?.setItem(STORAGE_KEY,JSON.stringify(progress));}catch{}}
function ensureStyle(){if(document.querySelector('link[data-module-style="yasser-science"]'))return;const link=document.createElement('link');link.rel='stylesheet';link.href='src/modules/yasser/science/yasser-science.css';link.dataset.moduleStyle='yasser-science';document.head.appendChild(link);}
function show(id){document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id===id));window.scrollTo(0,0);}
function clearTimer(){if(feedbackTimer){clearTimeout(feedbackTimer);feedbackTimer=null;}}
function currentUnit(){return getScienceUnit(activeUnitId);}
function currentChapter(){return getScienceChapter(currentUnit().currentChapterId);}
function unitQuestions(){return filterScienceQuestionsByUnit(YASSER_SCIENCE_PLAYABLE_QUESTIONS,activeUnitId);}
function visualUnitQuestions(){return unitQuestions().filter(question=>question.assetId&&SCIENCE_ASSETS[question.assetId]);}
function unitProgress(){return filterScienceProgressByUnit(progress,activeUnitId);}
function scopeLabel(){return String(YASSER_SCIENCE_SCOPE.label||'سادس ابتدائي').split(' • ')[0];}
function chapterDisplayName(label=''){return label.replace('الفصل 1:','الفصل الأول —').replace('الفصل 2:','الفصل الثاني —').replace('الفصل 3:','الفصل الثالث —').replace('الفصل 4:','الفصل الرابع —').replace('الفصل 5:','الفصل الخامس —').replace('الفصل 6:','الفصل السادس —');}
function visualQuestionLabel(count){if(count===1)return 'سؤال مصوّر';if(count===2)return 'سؤالان مصوّران';return `${count} أسئلة مصوّرة`;}

function ensureShell(){
  if(document.getElementById('yasserScienceView'))return;
  const main=document.querySelector('main');if(!main)return;
  const view=document.createElement('section');view.id='yasserScienceView';view.className='view';
  view.innerHTML=`<div class="yasser-science-shell">
    <header class="yasser-science-head">
      <div><div class="kicker">علوم ياسر</div><h1>علوم الفصل الدراسي الأول</h1><p>${scopeLabel()}</p></div>
      <button class="icon-btn" id="yasserScienceBack" type="button">رجوع</button>
    </header>

    <section class="science-unit-switch" id="scienceUnitSwitch" aria-label="وحدات العلوم"></section>

    <section class="science-unit-card" id="scienceUnitCard" aria-label="الوحدة المختارة">
      <div class="science-unit-badge" id="scienceUnitBadge">الوحدة 3</div>
      <div class="science-unit-copy"><span id="scienceUnitState">الوحدة الحالية</span><strong id="scienceUnitName">الأنظمة البيئية ومواردها</strong><small id="scienceUnitNote">ابدأ بالفصل الحالي وتقدم خطوة بخطوة.</small></div>
      <div class="science-current-stage"><span id="scienceStageLabel">الآن</span><strong id="scienceChapterName"></strong><small id="scienceBankCount"></small></div>
    </section>

    <section class="yasser-science-modes" id="scienceModes" aria-label="أنشطة الوحدة المختارة">
      <button type="button" data-science-mode="quick"><span class="science-mode-code">10</span><span><strong>تدريب سريع</strong><small>10 أسئلة متنوعة مع تصحيح فوري</small></span></button>
      <button type="button" data-science-mode="images"><span class="science-mode-code" id="scienceImageModeCount">10</span><span><strong>تحدي الصور</strong><small id="scienceImageModeCopy">أسئلة بصرية بالصور والمخططات</small></span></button>
      <button type="button" data-science-mode="exam"><span class="science-mode-code">20</span><span><strong>اختبار المدرسة</strong><small>20 سؤالًا مما تم فتحه، بدون كشف الإجابة أثناء الحل</small></span></button>
    </section>

    <section class="yasser-science-dashboard" id="scienceDashboard" aria-label="تقدم العلوم"></section>

    <section class="yasser-science-session" id="scienceSession" hidden>
      <div class="science-session-bar">
        <button type="button" class="science-exit" id="scienceExit">إنهاء الجولة</button>
        <div class="science-progress-copy"><strong id="scienceStep">السؤال 1</strong><span id="scienceModeLabel"></span></div>
        <div class="science-score"><span>النقاط <b id="sciencePoints">0</b></span><span>السلسلة <b id="scienceStreak">0</b></span></div>
      </div>
      <div class="science-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="scienceProgress"></span></div>
      <article class="science-question-card" id="scienceQuestionCard">
        <figure class="science-question-image" id="scienceImageWrap" hidden>
          <button class="science-image-open" id="scienceImageOpen" type="button" aria-label="تكبير صورة السؤال"><img id="scienceImage" alt="" /><span>🔍 تكبير الصورة</span></button>
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
      <div class="science-result-actions"><button type="button" class="btn primary" id="scienceReviewMistakes">راجع أخطاء الجولة</button><button type="button" class="btn secondary" id="scienceResultHome">العودة للوحدة</button></div>
    </section>
  </div>
  <div class="science-image-modal" id="scienceImageModal" hidden role="dialog" aria-modal="true" aria-label="صورة السؤال مكبرة">
    <button type="button" class="science-image-modal-close" id="scienceImageModalClose" aria-label="إغلاق الصورة">إغلاق ×</button>
    <div class="science-image-modal-stage"><img id="scienceImageModalImg" alt="" /></div>
  </div>`;
  main.appendChild(view);
}

function renderUnitSwitch(){
  const host=document.getElementById('scienceUnitSwitch');if(!host)return;
  host.innerHTML='';
  YASSER_SCIENCE_UNITS.forEach(unit=>{
    const button=document.createElement('button');button.type='button';button.className='science-unit-pick';button.dataset.scienceUnit=unit.id;button.classList.toggle('active',unit.id===activeUnitId);
    const state=unit.status==='current'?'الحالية':'مراجعة';
    button.innerHTML=`<span>الوحدة ${unit.number}</span><strong>${unit.shortLabel}</strong><small>${state}</small>`;
    button.addEventListener('click',()=>selectUnit(unit.id));
    host.appendChild(button);
  });
}

function renderUnitCard(){
  const unit=currentUnit(),chapter=currentChapter(),questions=unitQuestions(),visualQuestions=visualUnitQuestions();
  const isCurrent=unit.status==='current';
  document.getElementById('scienceUnitBadge').textContent=`الوحدة ${unit.number}`;
  document.getElementById('scienceUnitState').textContent=isCurrent?'الوحدة الحالية':'وحدة للمراجعة';
  document.getElementById('scienceUnitName').textContent=unit.shortLabel;
  document.getElementById('scienceUnitNote').textContent=isCurrent?'ابدأ بالفصل الحالي وتقدم خطوة بخطوة.':'راجع المحتوى المفتوح في هذه الوحدة.';
  document.getElementById('scienceStageLabel').textContent=isCurrent?'الآن':'مراجعة الوحدة';
  document.getElementById('scienceChapterName').textContent=isCurrent?chapterDisplayName(chapter.label):unit.shortLabel;
  document.getElementById('scienceBankCount').textContent=`المحتوى المفتوح: ${questions.length} سؤالًا • ${visualQuestionLabel(visualQuestions.length)}`;

  const imageButton=document.querySelector('[data-science-mode="images"]'),imageCount=document.getElementById('scienceImageModeCount'),imageCopy=document.getElementById('scienceImageModeCopy');
  const hasImages=visualQuestions.length>0,imageRoundSize=Math.min(10,visualQuestions.length);
  if(imageButton){imageButton.disabled=!hasImages;imageButton.setAttribute('aria-disabled',String(!hasImages));}
  if(imageCount)imageCount.textContent=hasImages?(visualQuestions.length>10?`${imageRoundSize} من ${visualQuestions.length}`:String(imageRoundSize)):'—';
  if(imageCopy)imageCopy.textContent=hasImages?(visualQuestions.length>10?`كل جولة تعرض ${imageRoundSize} أسئلة بصرية من ${visualQuestions.length}`:'أسئلة بصرية بالصور والمخططات'):'لا توجد أسئلة بصرية في المحتوى المفتوح حاليًا';
}

function renderDashboard(){
  const dashboard=getScienceDashboard(unitProgress()),host=document.getElementById('scienceDashboard');if(!host)return;
  const hasAttempts=dashboard.total>0;
  const progressState=!hasAttempts?'لم تبدأ بعد':dashboard.total<10?'استمر بالتدريب':dashboard.readiness;
  const recentAccuracy=hasAttempts?`${dashboard.recentAccuracy}%`:'—';
  const reviewCount=hasAttempts?String(dashboard.reviewCount):'—';
  host.innerHTML=`<div><span>حالة التقدم</span><strong>${progressState}</strong></div><div><span>دقة آخر المحاولات</span><strong>${recentAccuracy}</strong></div><div><span>تحتاج مراجعة</span><strong>${reviewCount}</strong></div><div><span>نقاط الوحدة</span><strong>${dashboard.points}</strong></div>`;
  const modes=document.getElementById('scienceModes');let review=document.getElementById('scienceReviewEntry');
  if(dashboard.reviewCount){
    if(!review){review=document.createElement('button');review.id='scienceReviewEntry';review.type='button';review.className='science-review-entry';review.innerHTML='<span>مراجعة ذكية</span><strong>أسئلتي اللي أخطأت فيها من هذه الوحدة</strong>';review.addEventListener('click',()=>startScience('review'));modes?.after(review);}
    review.hidden=false;
  }else if(review)review.hidden=true;
}

function modeLabel(mode){return {quick:'تدريب سريع',images:'تحدي الصور',exam:'اختبار المدرسة',review:'مراجعة الأخطاء'}[mode]||'علوم';}
function showLanding(){clearTimer();closeImageZoom();session=null;document.getElementById('scienceSession').hidden=true;document.getElementById('scienceResult').hidden=true;document.getElementById('scienceUnitSwitch').hidden=false;document.getElementById('scienceModes').hidden=false;document.getElementById('scienceUnitCard').hidden=false;renderUnitSwitch();renderUnitCard();renderDashboard();}
function selectUnit(unitId){if(!YASSER_SCIENCE_UNITS.some(unit=>unit.id===unitId))return;activeUnitId=unitId;showLanding();}

function startScience(mode,reviewIds=[]){
  clearTimer();closeImageZoom();const scopedProgress=unitProgress(),allQuestions=unitQuestions(),imageQuestions=visualUnitQuestions(),questions=mode==='images'?imageQuestions:allQuestions;
  if(mode==='images'&&!questions.length){showLanding();return;}
  const ids=mode==='review'?(reviewIds.length?reviewIds:getScienceReviewQuestionIds(scopedProgress)):[];
  const count=mode==='images'?Math.min(10,questions.length):undefined;
  session=createScienceSession({mode,count,progress:scopedProgress,questions,reviewQuestionIds:ids});
  if(!session.questions.length){showLanding();return;}
  document.getElementById('scienceUnitSwitch').hidden=true;document.getElementById('scienceUnitCard').hidden=true;document.getElementById('scienceModes').hidden=true;const reviewEntry=document.getElementById('scienceReviewEntry');if(reviewEntry)reviewEntry.hidden=true;document.getElementById('scienceResult').hidden=true;document.getElementById('scienceSession').hidden=false;
  const unit=currentUnit(),stage=unit.status==='current'?currentChapter().shortLabel:'مراجعة الوحدة';
  document.getElementById('scienceModeLabel').textContent=`${modeLabel(session.mode)} • ${unit.shortLabel} • ${stage}`;renderQuestion();
}

function renderQuestion(){
  if(!session||session.completed){finishScience();return;}
  closeImageZoom();const question=session.questions[session.index],total=session.questions.length,completed=session.answers.length,pct=Math.round((completed/Math.max(total,1))*100);
  document.getElementById('scienceStep').textContent=`السؤال ${session.index+1} من ${total}`;document.getElementById('scienceProgress').style.width=`${pct}%`;document.querySelector('.science-progress-track')?.setAttribute('aria-valuenow',String(pct));document.getElementById('sciencePoints').textContent=String(session.points);document.getElementById('scienceStreak').textContent=String(session.streak);
  document.getElementById('sciencePrompt').textContent=question.prompt;document.getElementById('scienceFeedback').textContent='';document.getElementById('scienceFeedback').className='science-feedback';
  const source=document.getElementById('scienceSource');source.hidden=session.mode==='exam';source.textContent=question.assetId?'سؤال بصري':'سؤال من محتوى الوحدة';
  const wrap=document.getElementById('scienceImageWrap'),image=document.getElementById('scienceImage'),asset=question.assetId?SCIENCE_ASSETS[question.assetId]:null;
  wrap.hidden=!asset;if(asset){image.src=asset.src;image.alt=asset.alt;document.getElementById('scienceImageOpen').dataset.assetId=asset.id;}else{image.removeAttribute('src');image.alt='';document.getElementById('scienceImageOpen').removeAttribute('data-asset-id');}
  const answers=document.getElementById('scienceAnswers');answers.innerHTML='';
  question.choices.forEach(choice=>{const button=document.createElement('button');button.type='button';button.className='science-answer';button.textContent=choice;button.addEventListener('click',()=>answerQuestion(choice,button));answers.appendChild(button);});
}

function openImageZoom(){const image=document.getElementById('scienceImage');if(!image?.src)return;const modal=document.getElementById('scienceImageModal'),modalImage=document.getElementById('scienceImageModalImg');if(!modal||!modalImage)return;modalImage.src=image.src;modalImage.alt=image.alt;modal.hidden=false;document.body.classList.add('science-image-zoom-open');document.getElementById('scienceImageModalClose')?.focus();}
function closeImageZoom(){const modal=document.getElementById('scienceImageModal');if(!modal||modal.hidden)return;modal.hidden=true;document.body.classList.remove('science-image-zoom-open');const modalImage=document.getElementById('scienceImageModalImg');if(modalImage){modalImage.removeAttribute('src');modalImage.alt='';}}

function answerQuestion(choice,button){
  if(!session||button.disabled)return;document.querySelectorAll('#scienceAnswers .science-answer').forEach(node=>{node.disabled=true;});const result=submitScienceAnswer({session,answer:choice});if(!result.accepted)return;
  progress=applyScienceAttempt(progress,result.attempt);progress=applyScienceSessionSummary(progress,session);saveProgress();document.getElementById('sciencePoints').textContent=String(session.points);document.getElementById('scienceStreak').textContent=String(session.streak);
  if(session.mode==='exam'){feedbackTimer=setTimeout(renderQuestion,180);return;}
  const feedback=document.getElementById('scienceFeedback');if(result.attempt.isCorrect){button.classList.add('correct');feedback.textContent='صحيح — كمل.';feedback.classList.add('good');}else{button.classList.add('wrong');const correct=[...document.querySelectorAll('#scienceAnswers .science-answer')].find(node=>node.textContent===result.question.answer);correct?.classList.add('correct');feedback.textContent=result.question.feedback;feedback.classList.add('bad');}feedbackTimer=setTimeout(renderQuestion,result.attempt.isCorrect?900:1500);
}

function finishScience(){
  if(!session)return;clearTimer();closeImageZoom();progress=applyScienceSessionSummary(progress,session);saveProgress();document.getElementById('scienceSession').hidden=true;document.getElementById('scienceResult').hidden=false;
  const total=Math.max(session.answers.length,1),pct=Math.round((session.correct/total)*100);document.getElementById('scienceResultScore').textContent=`${pct}%`;document.getElementById('scienceResultCorrect').textContent=String(session.correct);document.getElementById('scienceResultWrong').textContent=String(session.wrong);document.getElementById('scienceResultStreak').textContent=String(session.bestStreak);document.getElementById('scienceResultTitle').textContent=pct>=90?'إتقان قوي':pct>=75?'نتيجة جيدة':'نحتاج جولة مراجعة';document.getElementById('scienceResultCopy').textContent=session.mode==='exam'?`انتهى اختبار ${currentUnit().shortLabel}. الأخطاء محفوظة للمراجعة.`:'الأخطاء انتقلت تلقائيًا للمراجعة الذكية.';
  const reviewIds=sessionWrongQuestionIds(session),review=document.getElementById('scienceReviewMistakes');review.hidden=!reviewIds.length;review.onclick=()=>startScience('review',reviewIds);
}

function bind(){
  if(mounted)return;mounted=true;
  document.querySelectorAll('[data-science-mode]').forEach(button=>button.addEventListener('click',()=>{if(!button.disabled)startScience(button.dataset.scienceMode);}));
  document.getElementById('scienceExit')?.addEventListener('click',showLanding);document.getElementById('scienceResultHome')?.addEventListener('click',showLanding);document.getElementById('yasserScienceBack')?.addEventListener('click',()=>closeYasserScience());document.getElementById('scienceImageOpen')?.addEventListener('click',openImageZoom);document.getElementById('scienceImageModalClose')?.addEventListener('click',closeImageZoom);document.getElementById('scienceImageModal')?.addEventListener('click',event=>{if(event.target.id==='scienceImageModal')closeImageZoom();});document.addEventListener('keydown',event=>{if(event.key==='Escape')closeImageZoom();});
}

export function openYasserScience(){ensureStyle();ensureShell();bind();progress=loadProgress();activeUnitId=DEFAULT_YASSER_SCIENCE_UNIT_ID;document.body.classList.remove('intro-mode','yasser-quran-mode','hub-mode','khaled-mode','mashaal-mode');document.body.classList.add('yasser-science-mode');show('yasserScienceView');showLanding();}
export function closeYasserScience(){clearTimer();closeImageZoom();session=null;document.body.classList.remove('yasser-science-mode');document.body.classList.add('intro-mode');show('introView');}