import {YASSER_MATH_CHAPTERS,YASSER_MATH_COURSE,YASSER_MATH_LESSONS,YASSER_MATH_PLAYLIST_ID,classifyYasserMathLessonTitle} from './video-lesson-data.js';

const META_KEY='family.yasser.math-video-meta.v1';
const PROGRESS_KEY='family.yasser.math-video-progress.v1';
const LAST_KEY='family.yasser.math-video-last.v1';
let backHandler=null;
let player=null;
let resolver=null;
let resolverTask=Promise.resolve();
let currentLesson=null;
let progressTimer=null;
let saveTick=0;
let apiPromise=null;
let renderQueued=false;
let metadataWarmInProgress=false;

function readJson(key,fallback={}){
  try{return JSON.parse(localStorage.getItem(key)||'')||fallback;}catch{return fallback;}
}
function writeJson(key,value){
  try{localStorage.setItem(key,JSON.stringify(value));}catch{}
}
function escapeHtml(value){
  return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function metaStore(){return readJson(META_KEY,{});}
function progressStore(){return readJson(PROGRESS_KEY,{});}
function ensureStyle(){
  if(document.querySelector('link[data-module-style="yasser-math-lessons"]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='src/modules/yasser/math/yasser-math-lessons.css';
  link.dataset.moduleStyle='yasser-math-lessons';
  document.head.appendChild(link);
}
function ensureView(){
  let view=document.getElementById('yasserMathLessonsView');
  if(view)return view;
  view=document.createElement('section');
  view.id='yasserMathLessonsView';
  view.className='view yasser-math-lessons-view';
  view.setAttribute('aria-labelledby','mathLessonsTitle');
  view.innerHTML=`
    <div class="math-lessons-shell">
      <header class="math-course-hero">
        <button class="icon-btn math-course-back" id="mathLessonsBack" type="button">رجوع للمواد</button>
        <div class="math-course-copy">
          <div class="kicker">شرح المنهج بالفيديو</div>
          <h2 id="mathLessonsTitle">${YASSER_MATH_COURSE.title}</h2>
          <p>${YASSER_MATH_COURSE.subtitle} • ${YASSER_MATH_COURSE.teacher}</p>
          <div class="math-course-meta" aria-label="معلومات الدورة">
            <span><strong>34</strong> درسًا</span>
            <span><strong>7</strong> ساعات تقريبًا</span>
            <span>التشغيل داخل التطبيق</span>
          </div>
        </div>
        <div class="math-course-progress-card">
          <span>الدروس المكتملة</span>
          <strong id="mathCourseProgressText">0 من 34</strong>
          <div class="math-course-progress-track" role="progressbar" aria-label="الدروس المكتملة" aria-valuemin="0" aria-valuemax="34" aria-valuenow="0"><i id="mathCourseProgressBar"></i></div>
          <small class="math-last-progress" id="mathLastProgress">ابدأ أول درس، ونحفظ تقدمك تلقائيًا.</small>
          <button class="btn primary math-resume-btn" id="mathResumeLesson" type="button">ابدأ من الدرس الأول</button>
        </div>
      </header>

      <div class="math-lessons-toolbar">
        <div>
          <strong>دروس المنهج</strong>
          <small>اختر أي درس، ونحفظ آخر نقطة وصلت لها.</small>
        </div>
        <label class="math-lessons-search">
          <span class="sr-only">ابحث عن درس</span>
          <input id="mathLessonSearch" type="search" placeholder="ابحث عن درس…" autocomplete="off" />
        </label>
      </div>

      <div class="math-lessons-grid" id="mathLessonsGrid" aria-live="polite"></div>
    </div>

    <div class="math-player-layer" id="mathPlayerLayer" hidden>
      <div class="math-player-dialog" role="dialog" aria-modal="true" aria-labelledby="mathPlayerTitle">
        <header class="math-player-head">
          <div>
            <span id="mathPlayerEyebrow">الدرس</span>
            <h3 id="mathPlayerTitle">درس الرياضيات</h3>
          </div>
          <button class="icon-btn" id="mathPlayerClose" type="button" aria-label="إغلاق الدرس">إغلاق</button>
        </header>
        <div class="math-player-stage" id="mathPlayerStage">
          <div id="mathYoutubePlayer" class="math-youtube-player" aria-label="مشغل فيديو الدرس"></div>
          <button class="math-player-tap" id="mathPlayerTap" type="button" aria-label="تشغيل الفيديو">
            <span class="math-play-mark" aria-hidden="true"></span>
            <strong>تشغيل الدرس</strong>
          </button>
          <div class="math-player-finish" id="mathPlayerFinish" hidden>
            <strong>خلصت الدرس</strong>
            <span>ممتاز. تقدر تعيده أو تنتقل للدرس التالي.</span>
            <div>
              <button class="btn secondary" id="mathReplayLesson" type="button">إعادة الدرس</button>
              <button class="btn primary" id="mathNextLesson" type="button">الدرس التالي</button>
            </div>
          </div>
        </div>
        <div class="math-player-controls" aria-label="أدوات الفيديو">
          <button type="button" id="mathPrevLesson" aria-label="الدرس السابق">السابق</button>
          <button type="button" id="mathBack10" aria-label="رجوع عشر ثوان">−10</button>
          <button type="button" id="mathPlayPause" class="math-play-control" aria-label="تشغيل أو إيقاف">تشغيل</button>
          <button type="button" id="mathForward10" aria-label="تقديم عشر ثوان">+10</button>
          <button type="button" id="mathNextControl" aria-label="الدرس التالي">التالي</button>
          <input id="mathSeek" type="range" min="0" max="1000" value="0" aria-label="موضع الفيديو" />
          <span id="mathTime">0:00 / 0:00</span>
          <button type="button" id="mathFullscreen" aria-label="ملء الشاشة" aria-pressed="false">تكبير</button>
        </div>
        <footer class="math-player-foot">
          <span>يُسجل الدرس مكتملًا تلقائيًا عند مشاهدة 95%.</span>
          <button class="math-complete-fallback" id="mathMarkComplete" type="button">تم الدرس</button>
        </footer>
      </div>
    </div>

    <div id="mathMetaResolver" class="math-meta-resolver" aria-hidden="true"></div>
  `;
  document.querySelector('main')?.appendChild(view);
  bindView(view);
  return view;
}

function showOnly(view){
  document.querySelectorAll('.view').forEach(item=>item.classList.toggle('active',item===view));
  document.body.classList.remove('intro-mode','hub-mode','khaled-mode','mashaal-mode','yasser-quran-mode','yasser-science-mode');
  document.body.classList.add('yasser-math-lessons-mode');
  window.scrollTo(0,0);
}
function durationText(seconds){
  if(!Number.isFinite(seconds)||seconds<=0)return '';
  const minutes=Math.round(seconds/60);
  if(minutes<60)return `${minutes} د`;
  const hours=Math.floor(minutes/60),rest=minutes%60;
  return rest?`${hours} س ${rest} د`:`${hours} س`;
}
function clock(seconds){
  const value=Math.max(0,Math.floor(Number(seconds)||0));
  return `${Math.floor(value/60)}:${String(value%60).padStart(2,'0')}`;
}
function rawLessonTitle(lesson,meta){
  return meta?.title||lesson.verifiedTitle||`الدرس ${lesson.number}`;
}
function cleanYoutubeLessonTitle(value){
  return String(value||'')
    .replace(/\s*[|｜]\s*(?:رياضيات|الرياضيات).*$/i,'')
    .replace(/\s*[-–—]\s*(?:رياضيات|الرياضيات)\s*(?:الصف\s*)?(?:السادس|6).*$/i,'')
    .replace(/\s*[-–—]\s*(?:الصف\s*)?السادس\s*(?:ابتدائي)?(?:\s*[-–—].*)?$/i,'')
    .replace(/\s*[-–—]\s*الفصل\s*الدراسي\s*الأول.*$/i,'')
    .replace(/\s+/g,' ')
    .trim();
}
function lessonTitle(lesson,meta){
  const raw=rawLessonTitle(lesson,meta);
  const curriculum=classifyYasserMathLessonTitle(raw);
  return curriculum?.title||cleanYoutubeLessonTitle(raw)||lesson.verifiedTitle||`الدرس ${lesson.number}`;
}
function queueLessonRender(){
  if(renderQueued||document.body.classList.contains('math-player-open'))return;
  const view=document.getElementById('yasserMathLessonsView');
  if(!view?.classList.contains('active'))return;
  renderQueued=true;
  requestAnimationFrame(()=>{renderQueued=false;renderLessons();});
}
function lessonCardHtml(lesson,meta,state){
  const title=lessonTitle(lesson,meta);
  const pct=state.completed?100:(meta.duration&&state.seconds?Math.min(99,Math.round((state.seconds/meta.duration)*100)):0);
  const duration=durationText(meta.duration);
  const thumb=meta.videoId?`https://i.ytimg.com/vi/${meta.videoId}/hqdefault.jpg`:'';
  return `
    <button class="math-lesson-card${state.completed?' is-complete':''}" type="button" data-lesson-id="${lesson.id}">
      <span class="math-lesson-thumb">${thumb?`<img src="${thumb}" alt="" loading="lazy" referrerpolicy="no-referrer" />`:''}<b>${String(lesson.number).padStart(2,'0')}</b></span>
      <span class="math-lesson-info">
        <span class="math-lesson-kicker">${state.completed?'مكتمل':pct>0?`شاهدت ${pct}%`:'درس فيديو'}</span>
        <strong>${escapeHtml(title)}</strong>
        <small>${duration||'يتم جلب مدة الدرس تلقائيًا'}</small>
        <span class="math-lesson-mini-track"><i style="width:${pct}%"></i></span>
      </span>
      <span class="math-lesson-action">${state.completed?'إعادة':'شاهد'}</span>
    </button>`;
}
function renderLessons(){
  const grid=document.getElementById('mathLessonsGrid');
  if(!grid)return;
  const metas=metaStore(),progress=progressStore();
  const query=(document.getElementById('mathLessonSearch')?.value||'').trim().toLowerCase();
  const items=YASSER_MATH_LESSONS.map(lesson=>{
    const meta=metas[lesson.id]||{};
    const rawTitle=rawLessonTitle(lesson,meta);
    const title=lessonTitle(lesson,meta);
    const curriculum=classifyYasserMathLessonTitle(rawTitle);
    return {lesson,meta,state:progress[lesson.id]||{},rawTitle,title,curriculum};
  }).filter(item=>{
    if(!query)return true;
    const haystack=`${item.title} ${item.rawTitle} ${item.curriculum?.chapterTitle||''} ${item.lesson.number}`.toLowerCase();
    return haystack.includes(query);
  });

  const lastId=localStorage.getItem(LAST_KEY);
  const preferred=items.find(item=>item.lesson.id===lastId)||items.find(item=>!item.state.completed)||items[0];
  const preferredChapterId=preferred?.curriculum?.chapterId||'';

  const sections=YASSER_MATH_CHAPTERS.map(chapter=>{
    const chapterItems=items.filter(item=>item.curriculum?.chapterId===chapter.id);
    if(!chapterItems.length)return '';
    const completed=chapterItems.filter(item=>item.state.completed).length;
    const open=Boolean(query)||chapter.id===preferredChapterId;
    return `
      <details class="math-chapter-section" data-chapter-id="${chapter.id}" ${open?'open':''}>
        <summary class="math-chapter-head">
          <div><span>الفصل ${chapter.number}</span><h3>${escapeHtml(chapter.title)}</h3></div>
          <small>${completed} من ${chapterItems.length} مكتمل</small>
        </summary>
        <div class="math-chapter-lessons">${chapterItems.map(item=>lessonCardHtml(item.lesson,item.meta,item.state)).join('')}</div>
      </details>`;
  }).join('');

  const unmatched=items.filter(item=>!item.curriculum);
  const pendingOpen=Boolean(query)||Boolean(unmatched.find(item=>item.lesson.id===lastId))||!preferredChapterId;
  const pending=unmatched.length?`
    <details class="math-chapter-section math-chapter-pending" ${pendingOpen?'open':''}>
      <summary class="math-chapter-head">
        <div><span>بقية القائمة</span><h3>جاري ترتيب عناوين الدروس</h3></div>
        <small>${unmatched.length} درسًا</small>
      </summary>
      <p class="math-chapter-note">يتم قراءة عنوان كل فيديو من القائمة نفسها ثم وضعه تحت فصل المنهج الصحيح تلقائيًا.</p>
      <div class="math-chapter-lessons">${unmatched.map(item=>lessonCardHtml(item.lesson,item.meta,item.state)).join('')}</div>
    </details>`:'';

  grid.innerHTML=(sections+pending)||'<p class="math-lessons-empty">ما لقيت درس بهذا الاسم.</p>';
  grid.querySelectorAll('[data-lesson-id]').forEach(button=>button.addEventListener('click',()=>openLesson(button.dataset.lessonId)));
  renderCourseProgress();
}
function renderCourseProgress(){
  const progress=progressStore(),metas=metaStore();
  const done=YASSER_MATH_LESSONS.filter(item=>progress[item.id]?.completed).length;
  const text=document.getElementById('mathCourseProgressText');
  const bar=document.getElementById('mathCourseProgressBar');
  const track=bar?.parentElement;
  const lastCopy=document.getElementById('mathLastProgress');
  if(text)text.textContent=`${done} من 34`;
  if(bar)bar.style.width=`${(done/34)*100}%`;
  track?.setAttribute('aria-valuenow',String(done));
  const lastId=localStorage.getItem(LAST_KEY);
  const lastLesson=YASSER_MATH_LESSONS.find(item=>item.id===lastId);
  if(lastCopy){
    if(lastLesson){
      const meta=metas[lastLesson.id]||{},state=progress[lastLesson.id]||{};
      const pct=state.completed?100:(meta.duration&&state.seconds?Math.min(99,Math.round((state.seconds/meta.duration)*100)):0);
      lastCopy.textContent=`آخر درس: ${lessonTitle(lastLesson,meta)} • ${pct}%`;
    }else lastCopy.textContent='ابدأ أول درس، ونحفظ تقدمك تلقائيًا.';
  }
  const resume=document.getElementById('mathResumeLesson');
  if(resume){
    const lesson=lastLesson||YASSER_MATH_LESSONS.find(item=>!progress[item.id]?.completed)||YASSER_MATH_LESSONS[0];
    resume.dataset.lessonId=lesson.id;
    resume.textContent=lastId?'أكمل آخر درس':'ابدأ من الدرس الأول';
  }
}
function youtubePlayerVars(extra={}){
  const vars={controls:0,disablekb:1,playsinline:1,rel:0,fs:0,iv_load_policy:3,...extra};
  const origin=globalThis.location?.origin||'';
  if(/^https?:\/\//i.test(origin))vars.origin=origin;
  return vars;
}
function ensureYoutubeApi(){
  if(globalThis.YT?.Player)return Promise.resolve(globalThis.YT);
  if(apiPromise)return apiPromise;
  apiPromise=new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-yasser-youtube-api]');
    const previous=globalThis.onYouTubeIframeAPIReady;
    globalThis.onYouTubeIframeAPIReady=()=>{
      try{previous?.();}catch{}
      resolve(globalThis.YT);
    };
    if(existing)return;
    const script=document.createElement('script');
    script.src='https://www.youtube.com/iframe_api';
    script.async=true;
    script.dataset.yasserYoutubeApi='true';
    script.onerror=()=>reject(new Error('youtube-api-load-failed'));
    document.head.appendChild(script);
  });
  return apiPromise;
}
function saveMeta(lesson,data){
  if(!lesson||!data?.videoId)return;
  const store=metaStore();
  store[lesson.id]={...(store[lesson.id]||{}),...data,updatedAt:Date.now()};
  writeJson(META_KEY,store);
  const card=document.querySelector(`[data-lesson-id="${lesson.id}"]`);
  if(card){
    const title=card.querySelector('.math-lesson-info strong');
    const duration=card.querySelector('.math-lesson-info small');
    const thumb=card.querySelector('.math-lesson-thumb');
    if(title)title.textContent=lessonTitle(lesson,{...(store[lesson.id]||{}),...data});
    if(duration&&data.duration)duration.textContent=durationText(data.duration);
    if(thumb&&data.videoId&&!thumb.querySelector('img')){
      const img=document.createElement('img');
      img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';img.src=`https://i.ytimg.com/vi/${data.videoId}/hqdefault.jpg`;
      thumb.prepend(img);
    }
  }
  if(!metadataWarmInProgress)queueLessonRender();
}
function seedPlaylistVideoIds(){
  const ids=resolver?.getPlaylist?.()||[];
  if(!ids.length)return false;
  const store=metaStore();
  let changed=false;
  YASSER_MATH_LESSONS.forEach(lesson=>{
    const videoId=ids[lesson.playlistIndex];
    if(!videoId)return;
    const current=store[lesson.id]||{};
    if(current.videoId===videoId)return;
    store[lesson.id]={...current,videoId,updatedAt:Date.now()};
    changed=true;
  });
  if(changed)writeJson(META_KEY,store);
  return ids.length>=YASSER_MATH_LESSONS.length;
}
function captureResolverLesson(lesson){
  if(!resolver||!lesson)return false;
  const data=resolver.getVideoData?.()||{};
  const playlist=resolver.getPlaylist?.()||[];
  const expectedVideoId=playlist[lesson.playlistIndex]||'';
  const activeIndex=resolver.getPlaylistIndex?.();
  if(activeIndex!==lesson.playlistIndex||!data.video_id)return false;
  if(expectedVideoId&&data.video_id!==expectedVideoId)return false;
  saveMeta(lesson,{videoId:expectedVideoId||data.video_id,title:data.title||lesson.verifiedTitle,duration:resolver.getDuration?.()||0});
  seedPlaylistVideoIds();
  return true;
}
async function resolveLessonMetaInternal(lesson){
  const known=metaStore()[lesson.id];
  if(known?.videoId&&known?.title)return known;
  await ensureYoutubeApi();
  return new Promise(resolve=>{
    const mount=document.getElementById('mathMetaResolver');
    if(!mount)return resolve(null);
    let attempts=0;
    const finish=()=>resolve(metaStore()[lesson.id]||null);
    const capture=()=>{
      if(captureResolverLesson(lesson)){finish();return;}
      if(++attempts>12){finish();return;}
      setTimeout(capture,250);
    };
    if(!resolver){
      resolver=new YT.Player(mount,{
        width:'1',height:'1',host:'https://www.youtube-nocookie.com',
        playerVars:youtubePlayerVars(),
        events:{onReady:()=>{resolver.cuePlaylist({listType:'playlist',list:YASSER_MATH_PLAYLIST_ID,index:lesson.playlistIndex});setTimeout(capture,350);}}
      });
    }else{
      resolver.cuePlaylist({listType:'playlist',list:YASSER_MATH_PLAYLIST_ID,index:lesson.playlistIndex});
      setTimeout(capture,350);
    }
  });
}
function resolveLessonMeta(lesson){
  const known=metaStore()[lesson.id];
  if(known?.videoId&&known?.title)return Promise.resolve(known);
  resolverTask=resolverTask.catch(()=>null).then(()=>resolveLessonMetaInternal(lesson));
  return resolverTask;
}
async function warmMetadata(){
  metadataWarmInProgress=true;
  try{
    await ensureYoutubeApi().catch(()=>null);
    for(const lesson of YASSER_MATH_LESSONS){
      if(!document.getElementById('yasserMathLessonsView')?.classList.contains('active'))break;
      const meta=metaStore()[lesson.id];
      if(meta?.videoId&&meta?.title)continue;
      await resolveLessonMeta(lesson);
      await new Promise(resolve=>setTimeout(resolve,80));
    }
  }finally{
    metadataWarmInProgress=false;
    renderLessons();
  }
}
function playerIframe(){
  return player?.getIframe?.()||null;
}
function setLessonIframeInteractive(enabled){
  const iframe=playerIframe();
  if(!iframe)return;
  iframe.style.pointerEvents=enabled?'auto':'none';
  iframe.setAttribute('tabindex','-1');
  if(enabled)iframe.removeAttribute('aria-hidden');
  else iframe.setAttribute('aria-hidden','true');
  iframe.referrerPolicy='strict-origin-when-cross-origin';
}
function enforceNonInteractiveIframe(){
  setLessonIframeInteractive(false);
}
function startLessonPlayback(){
  const tap=document.getElementById('mathPlayerTap');
  if(tap)tap.hidden=true;
  setLessonIframeInteractive(true);
  player?.playVideo?.();
}
function currentProgress(){
  return currentLesson?progressStore()[currentLesson.id]||{}:{};
}
function saveProgress({completed=false}={}){
  if(!currentLesson||!player)return;
  const store=progressStore();
  const duration=player.getDuration?.()||metaStore()[currentLesson.id]?.duration||0;
  const seconds=Math.max(0,player.getCurrentTime?.()||0);
  const prior=store[currentLesson.id]||{};
  store[currentLesson.id]={
    seconds:completed&&duration?duration:Math.max(prior.seconds||0,seconds),
    completed:Boolean(completed||prior.completed),
    updatedAt:Date.now()
  };
  writeJson(PROGRESS_KEY,store);
  localStorage.setItem(LAST_KEY,currentLesson.id);
}
function updatePlayerTime(){
  if(!player)return;
  const current=player.getCurrentTime?.()||0,duration=player.getDuration?.()||0;
  const seek=document.getElementById('mathSeek'),time=document.getElementById('mathTime');
  if(seek&&!seek.matches(':active'))seek.value=duration?String(Math.round((current/duration)*1000)):'0';
  if(time)time.textContent=`${clock(current)} / ${clock(duration)}`;
  if(duration>0&&current/duration>=.95&&!currentProgress().completed)saveProgress({completed:true});
  else if(++saveTick%10===0)saveProgress();
}
function startProgressTimer(){
  clearInterval(progressTimer);
  progressTimer=setInterval(updatePlayerTime,500);
}
function stopProgressTimer(){
  clearInterval(progressTimer);progressTimer=null;saveTick=0;
}
function markFinished(){
  saveProgress({completed:true});
  stopProgressTimer();
  const finish=document.getElementById('mathPlayerFinish');
  if(finish)finish.hidden=false;
  renderLessons();
}
function onPlayerState(event){
  enforceNonInteractiveIframe();
  const play=document.getElementById('mathPlayPause');
  const tap=document.getElementById('mathPlayerTap');
  if(event.data===YT.PlayerState.PLAYING){
    if(play)play.textContent='إيقاف';
    if(tap)tap.hidden=true;
    setLessonIframeInteractive(true);
    startProgressTimer();
  }else if(event.data===YT.PlayerState.PAUSED||event.data===YT.PlayerState.CUED){
    if(play)play.textContent='تشغيل';
    setLessonIframeInteractive(false);
    if(tap){
      tap.hidden=false;
      const copy=tap.querySelector('strong');
      if(copy)copy.textContent=event.data===YT.PlayerState.PAUSED?'متابعة الدرس':'تشغيل الدرس';
    }
    stopProgressTimer();
    updatePlayerTime();
  }else if(event.data===YT.PlayerState.ENDED){
    setLessonIframeInteractive(false);
    player.stopVideo?.();
    markFinished();
  }
}
async function ensurePlayer(){
  await ensureYoutubeApi();
  if(player)return player;
  player=new YT.Player('mathYoutubePlayer',{
    width:'100%',height:'100%',host:'https://www.youtube-nocookie.com',
    playerVars:youtubePlayerVars({enablejsapi:1}),
    events:{
      onReady:()=>enforceNonInteractiveIframe(),
      onStateChange:onPlayerState,
      onError:()=>{document.getElementById('mathPlayerTap').querySelector('strong').textContent='تعذر تشغيل هذا الدرس';}
    }
  });
  return player;
}
async function prepareCurrentVideo(lesson){
  const p=await ensurePlayer();
  let meta=metaStore()[lesson.id];
  if(!meta?.videoId)meta=await resolveLessonMeta(lesson);
  if(!meta?.videoId){
    const tap=document.getElementById('mathPlayerTap');
    if(tap)tap.querySelector('strong').textContent='تعذر تجهيز هذا الدرس الآن';
    return null;
  }
  p.cueVideoById({videoId:meta.videoId,startSeconds:Math.max(0,currentProgress().seconds||0)});
  saveMeta(lesson,{...meta,duration:meta.duration||p.getDuration?.()||0});
  enforceNonInteractiveIframe();
  return meta;
}
function adjacentLesson(offset){
  if(!currentLesson)return null;
  return YASSER_MATH_LESSONS[currentLesson.playlistIndex+offset]||null;
}
function syncLessonNavigation(){
  const prev=document.getElementById('mathPrevLesson');
  const next=document.getElementById('mathNextControl');
  const finishNext=document.getElementById('mathNextLesson');
  const hasPrev=Boolean(adjacentLesson(-1)),hasNext=Boolean(adjacentLesson(1));
  if(prev)prev.disabled=!hasPrev;
  if(next)next.disabled=!hasNext;
  if(finishNext){
    finishNext.disabled=!hasNext;
    finishNext.textContent=hasNext?'الدرس التالي':'العودة للدروس';
  }
}
async function openLesson(id){
  const lesson=YASSER_MATH_LESSONS.find(item=>item.id===id);
  if(!lesson)return;
  currentLesson=lesson;
  localStorage.setItem(LAST_KEY,lesson.id);
  const layer=document.getElementById('mathPlayerLayer');
  const finish=document.getElementById('mathPlayerFinish');
  const tap=document.getElementById('mathPlayerTap');
  layer.hidden=false;finish.hidden=true;tap.hidden=false;
  document.body.classList.add('math-player-open');
  const meta=metaStore()[lesson.id]||{};
  document.getElementById('mathPlayerEyebrow').textContent=`الدرس ${lesson.number} من 34`;
  document.getElementById('mathPlayerTitle').textContent=lessonTitle(lesson,meta);
  document.getElementById('mathPlayerTap').querySelector('strong').textContent='تشغيل الدرس';
  syncLessonNavigation();
  await prepareCurrentVideo(lesson);
  const updated=metaStore()[lesson.id]||{};
  document.getElementById('mathPlayerTitle').textContent=lessonTitle(lesson,updated);
  updatePlayerTime();
}
function syncMathFullscreenButton(){
  const button=document.getElementById('mathFullscreen');
  if(!button)return;
  const active=Boolean(document.fullscreenElement)||document.body.classList.contains('math-player-expanded');
  button.textContent=active?'تصغير':'تكبير';
  button.setAttribute('aria-pressed',String(active));
}
async function toggleMathPlayerFullscreen(){
  const dialog=document.querySelector('#mathPlayerLayer .math-player-dialog');
  if(!dialog)return;
  if(document.fullscreenElement){
    try{await document.exitFullscreen?.();}catch{}
    syncMathFullscreenButton();
    return;
  }
  if(document.body.classList.contains('math-player-expanded')){
    document.body.classList.remove('math-player-expanded');
    syncMathFullscreenButton();
    return;
  }
  if(document.fullscreenEnabled&&typeof dialog.requestFullscreen==='function'){
    try{
      await dialog.requestFullscreen();
      syncMathFullscreenButton();
      return;
    }catch{}
  }
  document.body.classList.add('math-player-expanded');
  syncMathFullscreenButton();
}
function closePlayer(){
  saveProgress();
  stopProgressTimer();
  player?.pauseVideo?.();
  setLessonIframeInteractive(false);
  if(document.fullscreenElement){
    try{document.exitFullscreen?.();}catch{}
  }
  document.body.classList.remove('math-player-open','math-player-expanded');
  document.getElementById('mathPlayerLayer').hidden=true;
  syncMathFullscreenButton();
  currentLesson=null;
  renderLessons();
}
function bindView(view){
  view.querySelector('#mathLessonsBack').addEventListener('click',()=>{closePlayer();view.classList.remove('active');document.body.classList.remove('yasser-math-lessons-mode');backHandler?.();});
  view.querySelector('#mathLessonSearch').addEventListener('input',renderLessons);
  view.querySelector('#mathResumeLesson').addEventListener('click',event=>openLesson(event.currentTarget.dataset.lessonId));
  view.querySelector('#mathPlayerClose').addEventListener('click',closePlayer);
  view.querySelector('#mathPlayerTap').addEventListener('click',startLessonPlayback);
  view.querySelector('#mathPlayPause').addEventListener('click',()=>{
    const state=player?.getPlayerState?.();
    if(state===YT.PlayerState.PLAYING)player.pauseVideo();
    else startLessonPlayback();
  });
  view.querySelector('#mathBack10').addEventListener('click',()=>player?.seekTo?.(Math.max(0,(player.getCurrentTime?.()||0)-10),true));
  view.querySelector('#mathForward10').addEventListener('click',()=>player?.seekTo?.(Math.min(player.getDuration?.()||0,(player.getCurrentTime?.()||0)+10),true));
  view.querySelector('#mathPrevLesson').addEventListener('click',()=>{const lesson=adjacentLesson(-1);if(lesson)openLesson(lesson.id);});
  view.querySelector('#mathNextControl').addEventListener('click',()=>{const lesson=adjacentLesson(1);if(lesson)openLesson(lesson.id);});
  view.querySelector('#mathSeek').addEventListener('input',event=>{const duration=player?.getDuration?.()||0;player?.seekTo?.((Number(event.target.value)/1000)*duration,true);updatePlayerTime();});
  view.querySelector('#mathFullscreen').addEventListener('click',toggleMathPlayerFullscreen);
  document.addEventListener('fullscreenchange',syncMathFullscreenButton);
  view.querySelector('#mathMarkComplete').addEventListener('click',markFinished);
  view.querySelector('#mathReplayLesson').addEventListener('click',()=>{document.getElementById('mathPlayerFinish').hidden=true;player?.seekTo?.(0,true);player?.playVideo?.();});
  view.querySelector('#mathNextLesson').addEventListener('click',()=>{const next=adjacentLesson(1);if(next)openLesson(next.id);else closePlayer();});
  view.querySelector('#mathPlayerLayer').addEventListener('click',event=>{if(event.target===event.currentTarget)closePlayer();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!view.querySelector('#mathPlayerLayer').hidden)closePlayer();});
}

export function openYasserMathLessons({onBack}={}){
  ensureStyle();
  const view=ensureView();
  backHandler=typeof onBack==='function'?onBack:null;
  showOnly(view);
  renderLessons();
  void warmMetadata();
}
