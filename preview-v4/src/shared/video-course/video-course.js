let youtubeApiPromise=null;

function loadYoutubeApi(){
  if(globalThis.YT?.Player)return Promise.resolve(globalThis.YT);
  if(youtubeApiPromise)return youtubeApiPromise;
  youtubeApiPromise=new Promise((resolve,reject)=>{
    const previous=globalThis.onYouTubeIframeAPIReady;
    globalThis.onYouTubeIframeAPIReady=()=>{try{previous?.();}catch{}resolve(globalThis.YT);};
    if(document.querySelector('script[data-family-video-youtube-api]'))return;
    const script=document.createElement('script');
    script.src='https://www.youtube.com/iframe_api';
    script.async=true;
    script.dataset.familyVideoYoutubeApi='true';
    script.onerror=()=>reject(new Error('youtube-api-load-failed'));
    document.head.appendChild(script);
  });
  return youtubeApiPromise;
}
function safeJson(value,fallback={}){try{return JSON.parse(value||'')||fallback;}catch{return fallback;}}
function clock(seconds){const v=Math.max(0,Math.floor(Number(seconds)||0));return `${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}`;}
function durationText(seconds){const m=Math.round((Number(seconds)||0)/60);return m>0?`${m} د`:'';}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function ensureStyle(){
  if(document.querySelector('link[data-module-style="family-video-course"]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='src/shared/video-course/video-course.css';
  link.dataset.moduleStyle='family-video-course';
  document.head.appendChild(link);
}
function playerVars(extra={}){
  const vars={controls:0,disablekb:1,playsinline:1,rel:0,fs:0,iv_load_policy:3,...extra};
  const origin=globalThis.location?.origin||'',href=globalThis.location?.href||'';
  if(/^https?:\/\//i.test(origin))vars.origin=origin;
  if(/^https?:\/\//i.test(href))vars.widget_referrer=href;
  return vars;
}

export function createVideoCourse(config){
  const lessons=Array.from({length:config.lessonCount},(_,index)=>({id:`${config.id}-${String(index+1).padStart(2,'0')}`,number:index+1,index}));
  const metaKey=`${config.storageKey}:meta`,progressKey=`${config.storageKey}:progress`,lastKey=`${config.storageKey}:last`;
  let player=null,resolver=null,resolverTask=Promise.resolve(),current=null,timer=null,prepareWatchdog=null,playWatchdog=null,nativeMode=false,onBack=null;

  const readMeta=()=>safeJson(localStorage.getItem(metaKey),{});
  const readProgress=()=>safeJson(localStorage.getItem(progressKey),{});
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};
  const cleanTitle=(raw,lesson)=>config.cleanTitle?.(raw,lesson)||raw||`الدرس ${lesson.number}`;

  function ensureView(){
    let view=document.getElementById('familyVideoCourseView');
    if(view&&view.dataset.courseId!==config.id){view.remove();view=null;}
    if(view)return view;
    view=document.createElement('section');
    view.id='familyVideoCourseView';
    view.dataset.courseId=config.id;
    view.className=`view family-video-course ${config.themeClass||''}`;
    view.innerHTML=`
      <div class="fvc-shell">
        <header class="fvc-hero">
          <button type="button" class="icon-btn fvc-back" id="fvcBack">رجوع</button>
          <div><span class="fvc-kicker">${escapeHtml(config.kicker||'دروس فيديو')}</span><h1>${escapeHtml(config.title)}</h1><p>${escapeHtml(config.subtitle||'')}</p></div>
          <div class="fvc-progress"><span>الدروس المكتملة</span><strong id="fvcProgressText">0 من ${lessons.length}</strong><div class="fvc-track"><i id="fvcProgressBar"></i></div><small id="fvcLast">ابدأ أول درس، ونحفظ تقدمك.</small><button class="btn primary" id="fvcResume" type="button">ابدأ</button></div>
        </header>
        <div class="fvc-list-head"><div><strong>الدروس</strong><small>${lessons.length} مقاطع مرتبة من القائمة الأصلية</small></div></div>
        <div class="fvc-list" id="fvcList"></div>
      </div>
      <div class="fvc-layer" id="fvcLayer" hidden>
        <div class="fvc-dialog" role="dialog" aria-modal="true" aria-labelledby="fvcPlayerTitle">
          <header class="fvc-player-head"><div><span id="fvcEyebrow"></span><h2 id="fvcPlayerTitle"></h2></div><button class="icon-btn" id="fvcClose" type="button">إغلاق</button></header>
          <div class="fvc-stage" id="fvcStage"><div id="fvcYoutubePlayer" class="fvc-youtube"></div><button class="fvc-tap" id="fvcTap" type="button"><span></span><strong>تشغيل الدرس</strong></button><div class="fvc-finish" id="fvcFinish" hidden><strong>تم الدرس</strong><span>تقدر تعيده أو تنتقل للدرس التالي.</span><div><button class="btn secondary" id="fvcReplay" type="button">إعادة</button><button class="btn primary" id="fvcFinishNext" type="button">التالي</button></div></div></div>
          <div class="fvc-controls">
            <button id="fvcPrev" type="button">السابق</button><button id="fvcBack10" type="button">−10</button><button id="fvcPlay" type="button">تشغيل</button><button id="fvcForward10" type="button">+10</button><button id="fvcNext" type="button">التالي</button>
            <input id="fvcSeek" type="range" min="0" max="1000" value="0" aria-label="موضع الفيديو"><span id="fvcTime">0:00 / 0:00</span><button id="fvcFullscreen" type="button">تكبير</button>
          </div>
          <footer class="fvc-foot"><span>يُسجل الدرس مكتملًا تلقائيًا عند مشاهدة 95%.</span><button id="fvcDone" type="button">تم الدرس</button></footer>
        </div>
      </div>
      <div id="fvcResolver" class="fvc-resolver" aria-hidden="true"></div>`;
    document.querySelector('main')?.appendChild(view);
    bind(view);
    return view;
  }
  function showView(){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='familyVideoCourseView'));document.body.classList.add('family-video-course-mode');window.scrollTo(0,0);}
  function titleFor(lesson,meta={}){return cleanTitle(meta.title||'',lesson);}
  function pctFor(lesson,meta,progress){
    if(progress.completed)return 100;
    return meta.duration&&progress.seconds?Math.min(99,Math.round(progress.seconds/meta.duration*100)):0;
  }
  function render(){
    const list=document.getElementById('fvcList');if(!list)return;
    const metas=readMeta(),progress=readProgress();
    list.innerHTML=lessons.map(lesson=>{
      const meta=metas[lesson.id]||{},state=progress[lesson.id]||{},pct=pctFor(lesson,meta,state),thumb=meta.videoId?`https://i.ytimg.com/vi/${meta.videoId}/hqdefault.jpg`:'';
      return `<button class="fvc-card${state.completed?' complete':''}" type="button" data-fvc-lesson="${lesson.id}"><span class="fvc-thumb">${thumb?`<img src="${thumb}" alt="" loading="lazy" referrerpolicy="no-referrer">`:''}<b>${String(lesson.number).padStart(2,'0')}</b></span><span class="fvc-copy"><small>${state.completed?'مكتمل':pct?`شاهدت ${pct}%`:'درس فيديو'}</small><strong>${escapeHtml(titleFor(lesson,meta))}</strong><span>${durationText(meta.duration)||'يتم جلب المدة تلقائيًا'}</span><i><em style="width:${pct}%"></em></i></span><span class="fvc-action">${state.completed?'إعادة':'شاهد'}</span></button>`;
    }).join('');
    list.querySelectorAll('[data-fvc-lesson]').forEach(b=>b.addEventListener('click',()=>openLesson(b.dataset.fvcLesson)));
    const done=lessons.filter(l=>progress[l.id]?.completed).length,lastId=localStorage.getItem(lastKey),last=lessons.find(l=>l.id===lastId);
    document.getElementById('fvcProgressText').textContent=`${done} من ${lessons.length}`;
    document.getElementById('fvcProgressBar').style.width=`${done/lessons.length*100}%`;
    const lastCopy=document.getElementById('fvcLast');
    if(last){
      const meta=metas[last.id]||{},state=progress[last.id]||{};
      lastCopy.textContent=`آخر درس: ${titleFor(last,meta)} • ${pctFor(last,meta,state)}%`;
    }else lastCopy.textContent='ابدأ أول درس، ونحفظ تقدمك.';
    const resume=document.getElementById('fvcResume'),target=last||lessons.find(l=>!progress[l.id]?.completed)||lessons[0];
    resume.dataset.lessonId=target.id;resume.textContent=last?'أكمل آخر درس':'ابدأ من الدرس الأول';
  }
  function saveMeta(lesson,data){
    if(!data?.videoId)return;
    const store=readMeta();store[lesson.id]={...(store[lesson.id]||{}),...data,updatedAt:Date.now()};write(metaKey,store);
  }
  async function resolveMetaInternal(lesson){
    const known=readMeta()[lesson.id];if(known?.videoId&&known?.title)return known;
    await loadYoutubeApi();
    return new Promise(resolve=>{
      let tries=0;
      const capture=()=>{
        const data=resolver?.getVideoData?.()||{},playlist=resolver?.getPlaylist?.()||[],index=resolver?.getPlaylistIndex?.();
        const expected=playlist[lesson.index]||'';
        if(index===lesson.index&&data.video_id&&(!expected||expected===data.video_id)){
          const meta={videoId:expected||data.video_id,title:data.title||'',duration:resolver.getDuration?.()||0};saveMeta(lesson,meta);resolve(meta);return;
        }
        if(++tries>14){resolve(readMeta()[lesson.id]||null);return;}
        setTimeout(capture,250);
      };
      if(!resolver){
        resolver=new YT.Player('fvcResolver',{width:'1',height:'1',host:'https://www.youtube-nocookie.com',playerVars:playerVars(),events:{onReady:()=>{resolver.cuePlaylist({listType:'playlist',list:config.playlistId,index:lesson.index});setTimeout(capture,350);}}});
      }else{resolver.cuePlaylist({listType:'playlist',list:config.playlistId,index:lesson.index});setTimeout(capture,350);}
    });
  }
  function resolveMeta(lesson){resolverTask=resolverTask.catch(()=>null).then(()=>resolveMetaInternal(lesson));return resolverTask;}
  async function warmMeta(){for(const lesson of lessons){if(!document.getElementById('familyVideoCourseView')?.classList.contains('active'))break;const m=readMeta()[lesson.id];if(m?.videoId&&m?.title)continue;await resolveMeta(lesson);render();await new Promise(r=>setTimeout(r,70));}}
  function iframe(){return player?.getIframe?.()||null;}
  function setInteractive(enabled){const f=iframe();if(!f)return;f.style.pointerEvents=enabled?'auto':'none';f.referrerPolicy='strict-origin-when-cross-origin';f.setAttribute('allow','autoplay; encrypted-media; picture-in-picture; fullscreen');}
  function progressState(){return current?readProgress()[current.id]||{}:{};}
  function saveProgress(completed=false){
    if(!current)return;const store=readProgress(),meta=readMeta()[current.id]||{},duration=player?.getDuration?.()||meta.duration||0,seconds=player?.getCurrentTime?.()||store[current.id]?.seconds||0,prior=store[current.id]||{};
    store[current.id]={seconds:completed&&duration?duration:Math.max(prior.seconds||0,seconds),completed:Boolean(completed||prior.completed),updatedAt:Date.now()};write(progressKey,store);localStorage.setItem(lastKey,current.id);
  }
  function tick(){
    if(!player)return;const cur=player.getCurrentTime?.()||0,dur=player.getDuration?.()||0,seek=document.getElementById('fvcSeek');if(seek)seek.value=dur?String(Math.round(cur/dur*1000)):'0';document.getElementById('fvcTime').textContent=`${clock(cur)} / ${clock(dur)}`;if(dur&&cur/dur>=.95&&!progressState().completed)saveProgress(true);
  }
  function startTimer(){clearInterval(timer);timer=setInterval(tick,500);}
  function stopTimer(){clearInterval(timer);timer=null;}
  function clearWatches(){clearTimeout(prepareWatchdog);clearTimeout(playWatchdog);}
  function nativeUrl(videoId){
    const url=new URL(`https://www.youtube.com/embed/${encodeURIComponent(videoId)}`);url.searchParams.set('playsinline','1');url.searchParams.set('controls','1');url.searchParams.set('rel','0');url.searchParams.set('fs','1');
    const sec=Math.floor(progressState().seconds||0);if(sec>0)url.searchParams.set('start',String(sec));
    const origin=location.origin;if(/^https?:\/\//i.test(origin))url.searchParams.set('origin',origin);url.searchParams.set('widget_referrer',location.href);return url.toString();
  }
  function nativeFallback(){
    if(nativeMode||!current)return;const meta=readMeta()[current.id]||{};if(!meta.videoId)return;clearWatches();nativeMode=true;try{player?.destroy?.();}catch{}player=null;
    document.getElementById('fvcYoutubePlayer')?.remove();const frame=document.createElement('iframe');frame.id='fvcNative';frame.className='fvc-youtube';frame.src=nativeUrl(meta.videoId);frame.title=titleFor(current,meta);frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';frame.setAttribute('allowfullscreen','');frame.referrerPolicy='strict-origin-when-cross-origin';document.getElementById('fvcStage')?.prepend(frame);
    document.getElementById('fvcTap').hidden=true;document.querySelector('.fvc-dialog')?.classList.add('native');
  }
  function ensurePlayerMount(){if(document.getElementById('fvcYoutubePlayer'))return;document.getElementById('fvcNative')?.remove();const d=document.createElement('div');d.id='fvcYoutubePlayer';d.className='fvc-youtube';document.getElementById('fvcStage')?.prepend(d);}
  async function ensurePlayer(){
    await loadYoutubeApi();if(player)return player;ensurePlayerMount();
    player=new YT.Player('fvcYoutubePlayer',{width:'100%',height:'100%',host:'https://www.youtube.com',playerVars:playerVars({enablejsapi:1}),events:{onReady:()=>setInteractive(false),onStateChange:event=>{
      const play=document.getElementById('fvcPlay'),tap=document.getElementById('fvcTap');
      if(event.data===YT.PlayerState.PLAYING){clearWatches();play.textContent='إيقاف';tap.hidden=true;setInteractive(true);startTimer();}
      else if(event.data===YT.PlayerState.PAUSED||event.data===YT.PlayerState.CUED){play.textContent='تشغيل';tap.hidden=false;tap.querySelector('strong').textContent=event.data===YT.PlayerState.PAUSED?'متابعة الدرس':'تشغيل الدرس';setInteractive(false);stopTimer();tick();}
      else if(event.data===YT.PlayerState.ENDED){saveProgress(true);stopTimer();document.getElementById('fvcFinish').hidden=false;render();}
    },onError:()=>nativeFallback()}});
    return player;
  }
  function startPlayback(){const tap=document.getElementById('fvcTap');tap.hidden=true;if(nativeMode)return;setInteractive(true);player?.playVideo?.();clearTimeout(playWatchdog);playWatchdog=setTimeout(()=>{if((player?.getPlayerState?.()!==YT.PlayerState.PLAYING)&&(player?.getDuration?.()||0)<=0)nativeFallback();},7000);}
  async function openLesson(id){
    current=lessons.find(l=>l.id===id);if(!current)return;localStorage.setItem(lastKey,current.id);nativeMode=false;document.querySelector('.fvc-dialog')?.classList.remove('native');ensurePlayerMount();
    document.getElementById('fvcLayer').hidden=false;document.body.classList.add('family-video-player-open');document.getElementById('fvcFinish').hidden=true;document.getElementById('fvcTap').hidden=false;document.getElementById('fvcEyebrow').textContent=`الدرس ${current.number} من ${lessons.length}`;
    const initial=readMeta()[current.id]||{};document.getElementById('fvcPlayerTitle').textContent=titleFor(current,initial);syncNav();
    let meta=initial;if(!meta.videoId)meta=await resolveMeta(current)||{};const p=await ensurePlayer();if(!meta.videoId){nativeFallback();return;}p.cueVideoById({videoId:meta.videoId,startSeconds:Math.max(0,progressState().seconds||0)});document.getElementById('fvcPlayerTitle').textContent=titleFor(current,meta);setInteractive(false);
    clearTimeout(prepareWatchdog);prepareWatchdog=setTimeout(()=>{if(!nativeMode&&(p.getDuration?.()||0)<=0)nativeFallback();},4000);tick();
  }
  function adjacent(offset){return current?lessons[current.index+offset]||null:null;}
  function syncNav(){document.getElementById('fvcPrev').disabled=!adjacent(-1);document.getElementById('fvcNext').disabled=!adjacent(1);document.getElementById('fvcFinishNext').textContent=adjacent(1)?'التالي':'العودة للدروس';}
  async function toggleFullscreen(){const dialog=document.querySelector('.fvc-dialog');if(!dialog)return;if(document.fullscreenElement){await document.exitFullscreen?.();return;}if(document.body.classList.contains('fvc-expanded')){document.body.classList.remove('fvc-expanded');return;}if(document.fullscreenEnabled&&dialog.requestFullscreen){try{await dialog.requestFullscreen();return;}catch{}}document.body.classList.add('fvc-expanded');}
  function closePlayer(){clearWatches();saveProgress(false);stopTimer();try{player?.destroy?.();}catch{}player=null;nativeMode=false;document.getElementById('fvcNative')?.remove();ensurePlayerMount();document.querySelector('.fvc-dialog')?.classList.remove('native');document.getElementById('fvcLayer').hidden=true;document.body.classList.remove('family-video-player-open','fvc-expanded');current=null;render();}
  function bind(view){
    view.querySelector('#fvcBack').addEventListener('click',()=>{closePlayer();view.classList.remove('active');document.body.classList.remove('family-video-course-mode');onBack?.();});
    view.querySelector('#fvcResume').addEventListener('click',e=>openLesson(e.currentTarget.dataset.lessonId));
    view.querySelector('#fvcClose').addEventListener('click',closePlayer);
    view.querySelector('#fvcTap').addEventListener('click',startPlayback);
    view.querySelector('#fvcPlay').addEventListener('click',()=>player?.getPlayerState?.()===YT.PlayerState.PLAYING?player.pauseVideo():startPlayback());
    view.querySelector('#fvcBack10').addEventListener('click',()=>player?.seekTo?.(Math.max(0,(player.getCurrentTime?.()||0)-10),true));
    view.querySelector('#fvcForward10').addEventListener('click',()=>player?.seekTo?.(Math.min(player.getDuration?.()||0,(player.getCurrentTime?.()||0)+10),true));
    view.querySelector('#fvcPrev').addEventListener('click',()=>{const l=adjacent(-1);if(l)openLesson(l.id);});
    view.querySelector('#fvcNext').addEventListener('click',()=>{const l=adjacent(1);if(l)openLesson(l.id);});
    view.querySelector('#fvcSeek').addEventListener('input',e=>{const d=player?.getDuration?.()||0;player?.seekTo?.(Number(e.target.value)/1000*d,true);});
    view.querySelector('#fvcFullscreen').addEventListener('click',toggleFullscreen);
    view.querySelector('#fvcDone').addEventListener('click',()=>{saveProgress(true);document.getElementById('fvcFinish').hidden=false;render();});
    view.querySelector('#fvcReplay').addEventListener('click',()=>{document.getElementById('fvcFinish').hidden=true;player?.seekTo?.(0,true);startPlayback();});
    view.querySelector('#fvcFinishNext').addEventListener('click',()=>{const l=adjacent(1);if(l)openLesson(l.id);else closePlayer();});
  }
  return {
    open(options={}){
      ensureStyle();onBack=typeof options.onBack==='function'?options.onBack:null;ensureView();showView();render();void warmMeta();
    },
    close:closePlayer
  };
}
