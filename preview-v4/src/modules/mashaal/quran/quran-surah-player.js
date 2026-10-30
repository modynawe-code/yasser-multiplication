import {matchFatihaPage1Polygons} from './fatiha-page1-polygons.js';

const STYLE_KEY='quran-surah-player';

function ensureStyle(){
  if(document.querySelector(`link[data-module-style="${STYLE_KEY}"]`))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='src/modules/mashaal/quran/quran-surah-player.css';
  link.dataset.moduleStyle=STYLE_KEY;
  document.head.appendChild(link);
}

function formatTime(seconds){
  if(!Number.isFinite(seconds)||seconds<0)return '0:00';
  const whole=Math.floor(seconds),minutes=Math.floor(whole/60),secs=String(whole%60).padStart(2,'0');
  return `${minutes}:${secs}`;
}

function normalizedFocusRegion(mushafPage,surahNumber){
  const region=mushafPage?.focusRegion;
  const aspect=Number(mushafPage?.imageAspectRatio);
  const top=Number(region?.top),height=Number(region?.height);
  if(!region||region.surahNumber!==surahNumber)return null;
  if(!Number.isFinite(aspect)||aspect<=0||!Number.isFinite(top)||!Number.isFinite(height))return null;
  if(top<0||height<=0||top+height>1)return null;
  return Object.freeze({top,height,aspect,labelAr:String(region.labelAr||'').trim()});
}

function pageSources(mushafPage){
  const values=[mushafPage?.imagePath,mushafPage?.imageUrl,...(Array.isArray(mushafPage?.fallbackImageUrls)?mushafPage.fallbackImageUrls:[])];
  return [...new Set(values.map(value=>String(value||'').trim()).filter(Boolean))];
}

function normalizedPages(mushafPage,mushafPages){
  const pages=(Array.isArray(mushafPages)?mushafPages:[]).filter(page=>page&&pageSources(page).length);
  if(pages.length)return pages;
  return mushafPage&&pageSources(mushafPage).length?[mushafPage]:[];
}

export function mountQuranSurahPlayer(host,{
  surahNameAr='السورة',
  surahNumber=null,
  audioPath='',
  mushafPage=null,
  mushafPages=null,
  ayahTimings=null,
  durationSeconds=0,
  retryPlayText='اضغطي تشغيل مرة ثانية',
  onCompleted=()=>{},
  onPageChange=()=>{}
}={}){
  if(!host)throw new Error('Quran player host is required');
  if(!audioPath)throw new Error('Verified human recitation audio is required');
  ensureStyle();

  const pages=normalizedPages(mushafPage,mushafPages);
  // Optional verse controls. Timing offsets MUST refer to the same audioPath.
  const ayahs=Array.isArray(ayahTimings)?ayahTimings.filter(item=>
    typeof item?.ayahKey==='string'&&Number.isFinite(item?.startMs)&&Number.isFinite(item?.endMs)
    &&item.startMs>=0&&item.endMs>item.startMs
  ):[];

  if(!pages.length)throw new Error('Verified mushaf page image is required');
  const verseGeometry=matchFatihaPage1Polygons(pages[0],surahNumber,ayahs);

  host.innerHTML='';
  host.removeAttribute('aria-hidden');
  host.classList.add('quran-player-host');

  const root=document.createElement('section');
  root.className='quran-surah-player';
  root.setAttribute('aria-label',`مشغل سورة ${surahNameAr}`);

  const figure=document.createElement('figure');
  figure.className='quran-page-frame';

  const viewport=document.createElement('div');
  viewport.className='quran-page-viewport';

  const image=document.createElement('img');
  image.className='quran-page-image';
  image.decoding='async';
  image.loading='eager';
  viewport.appendChild(image);
  const overlayPaths=[];
  let verseOverlay=null;
  if(verseGeometry){
    // This transparent SVG reuses the exact per-ayah polygons from the bundled
    // unchanged mushaf page; never estimate a bounding box over sacred text.
    const ns='http://www.w3.org/2000/svg';
    verseOverlay=document.createElementNS(ns,'svg');
    verseOverlay.classList.add('quran-mushaf-ayah-overlay');
    verseOverlay.setAttribute('viewBox',verseGeometry.viewBox);
    verseOverlay.setAttribute('preserveAspectRatio','xMidYMid meet');
    verseOverlay.setAttribute('aria-label','اضغط على الآية لتلاوتها');
    for(let index=0;index<verseGeometry.paths.length;index++){
      const path=document.createElementNS(ns,'path');
      path.setAttribute('d',verseGeometry.paths[index].d);
      path.classList.add('quran-mushaf-ayah-path');
      path.setAttribute('role','button');
      path.setAttribute('tabindex','0');
      path.setAttribute('aria-label','تشغيل الآية '+String(index+1));
      path.dataset.ayah=verseGeometry.paths[index].ayahKey;
      overlayPaths.push(path);
      verseOverlay.appendChild(path);
    }
    viewport.appendChild(verseOverlay);
  }

  const caption=document.createElement('figcaption');
  caption.className='quran-page-caption';

  const pageNav=document.createElement('div');
  pageNav.className='quran-page-nav';
  pageNav.setAttribute('role','group');
  pageNav.setAttribute('aria-label','التنقل بين صفحات السورة');
  const previousPage=document.createElement('button');
  previousPage.type='button';previousPage.className='quran-page-nav-button';previousPage.textContent='السابق';
  const pageIndicator=document.createElement('span');
  pageIndicator.className='quran-page-indicator';
  const nextPage=document.createElement('button');
  nextPage.type='button';nextPage.className='quran-page-nav-button';nextPage.textContent='التالي';
  pageNav.append(previousPage,pageIndicator,nextPage);
  if(pages.length<2)pageNav.hidden=true;

  figure.append(viewport,caption,pageNav);

  const audio=new Audio(audioPath);
  audio.preload='metadata';

  const transport=document.createElement('div');
  transport.className='quran-transport';
  transport.setAttribute('role','group');
  transport.setAttribute('aria-label','التحكم في التلاوة');

  const play=document.createElement('button');
  play.type='button';play.className='quran-control quran-control-primary';play.innerHTML='<span aria-hidden="true">▶</span><strong>تشغيل</strong>';
  const pause=document.createElement('button');
  pause.type='button';pause.className='quran-control';pause.innerHTML='<span aria-hidden="true">Ⅱ</span><strong>إيقاف مؤقت</strong>';
  const stop=document.createElement('button');
  stop.type='button';stop.className='quran-control';stop.innerHTML='<span aria-hidden="true">■</span><strong>إيقاف</strong>';
  const restart=document.createElement('button');
  restart.type='button';restart.className='quran-control';restart.innerHTML='<span aria-hidden="true">↺</span><strong>من البداية</strong>';
  transport.append(play,pause,stop,restart);

  const progressWrap=document.createElement('div');
  progressWrap.className='quran-progress-wrap';
  const progress=document.createElement('input');
  progress.type='range';progress.className='quran-progress';progress.min='0';progress.max='1';progress.step='0.1';progress.value='0';progress.disabled=true;
  progress.setAttribute('aria-label','موضع التلاوة');progress.setAttribute('aria-valuetext','0:00');progress.style.setProperty('--seek-percent','0%');
  const time=document.createElement('span');
  time.className='quran-time';time.textContent='0:00 / 0:00';
  progressWrap.append(progress,time);

  const status=document.createElement('p');
  status.className='quran-player-status';status.setAttribute('aria-live','polite');status.textContent='جاهزة للاستماع';

  root.append(figure,transport,progressWrap,status);
  const ayahButtons=[];
  let repeatSelect=null;
  if(ayahs.length){
    root.classList.add('has-ayah-controls');
    const panel=document.createElement('div');panel.className='quran-ayah-controls';
    panel.setAttribute('role','group');panel.setAttribute('aria-label','التدريب على الآيات');
    const heading=document.createElement('div');heading.className='quran-ayah-heading';
    const title=document.createElement('strong');title.textContent='اسمع الآية وكررها';
    const label=document.createElement('label');label.textContent='التكرار ';
    repeatSelect=document.createElement('select');
    repeatSelect.setAttribute('aria-label','عدد تكرارات الآية');
    for(const count of [1,3,5]){
      const option=document.createElement('option');option.value=String(count);option.textContent=count===1?'مرة':count+' مرات';
      if(count===3)option.selected=true;
      repeatSelect.appendChild(option);
    }
    label.appendChild(repeatSelect);heading.append(title,label);
    const buttons=document.createElement('div');buttons.className='quran-ayah-buttons';
    for(let index=0;index<ayahs.length;index++){
      const button=document.createElement('button');button.type='button';
      button.className='quran-ayah-button';button.textContent='الآية '+String(index+1);
      button.setAttribute('aria-pressed','false');button.dataset.ayah=ayahs[index].ayahKey;
      ayahButtons.push(button);buttons.appendChild(button);
    }
    panel.append(heading,buttons);
    root.insertBefore(panel,progressWrap);
  }
  host.appendChild(root);

  let selectedAyahIndex=-1,ayahRepeatCount=0;
  let completed=false,destroyed=false,seeking=false,resumeAfterSeek=false,pageIndex=0,sourceIndex=0,touchStartX=0,touchStartY=0,knownDuration=Number.isFinite(Number(durationSeconds))&&Number(durationSeconds)>0?Number(durationSeconds):0;
  const rangeEnd=range=>{
    try{
      const length=Number(range?.length)||0;
      if(!length)return 0;
      const end=Number(range.end(length-1));
      return Number.isFinite(end)&&end>0?end:0;
    }catch{return 0;}
  };
  const finiteDuration=()=>{
    const direct=Number(audio.duration);
    if(Number.isFinite(direct)&&direct>0)knownDuration=Math.max(knownDuration,direct);
    else{
      const seekableEnd=rangeEnd(audio.seekable);
      if(seekableEnd>0)knownDuration=Math.max(knownDuration,seekableEnd);
    }
    return knownDuration;
  };
  const seekValue=()=>{const duration=finiteDuration();if(!duration)return 0;return Math.max(0,Math.min(duration,Number(progress.value)||0));};
  const paintSeek=(value,duration)=>{
    const safeDuration=Number.isFinite(duration)&&duration>0?duration:0;
    const safeValue=safeDuration?Math.max(0,Math.min(safeDuration,Number(value)||0)):0;
    const percent=safeDuration?(safeValue/safeDuration)*100:0;
    progress.style.setProperty('--seek-percent',`${percent}%`);progress.setAttribute('aria-valuetext',formatTime(safeValue));
  };

  const renderPage=()=>{
    const page=pages[pageIndex];
    const focusRegion=normalizedFocusRegion(page,surahNumber);
    const sources=pageSources(page);
    sourceIndex=0;
    // Overlay belongs ONLY to the verified first page with the exact source SVG.
    if(verseOverlay)verseOverlay.style.display=pageIndex===0?'':'none';
    figure.removeAttribute('data-image-error');
    if(focusRegion){
      figure.dataset.focused='true';viewport.dataset.focused='true';viewport.style.aspectRatio=String(focusRegion.aspect/focusRegion.height);image.style.transform=`translateY(-${focusRegion.top*100}%)`;
    }else{
      figure.removeAttribute('data-focused');viewport.removeAttribute('data-focused');viewport.style.removeProperty('aspect-ratio');image.style.removeProperty('transform');
    }
    image.src=sources[0];
    image.alt=focusRegion?`سورة ${surahNameAr} كما تظهر في صفحة ${page?.pageNumber||''} من مصحف المدينة`:`صفحة ${page?.pageNumber||''} من المصحف التي تحتوي على سورة ${surahNameAr}`;
    const pageLabel=page?.pageNumber?` • صفحة ${page.pageNumber}`:'';
    caption.textContent=focusRegion?`${focusRegion.labelAr||`سورة ${surahNameAr}`} • من مصحف المدينة${pageLabel} • حفص عن عاصم`:`مصحف المدينة • حفص عن عاصم${pageLabel}`;
    pageIndicator.textContent=`صفحة ${pageIndex+1} من ${pages.length}`;
    previousPage.disabled=pageIndex===0;nextPage.disabled=pageIndex===pages.length-1;
    onPageChange({index:pageIndex,count:pages.length,pageNumber:page?.pageNumber||null});
  };
  const changePage=next=>{
    const target=Math.max(0,Math.min(pages.length-1,next));
    if(target===pageIndex)return;
    pageIndex=target;renderPage();
  };

  const updateProgress=()=>{
    if(destroyed||seeking)return;
    const duration=finiteDuration(),current=Number(audio.currentTime)||0;
    if(duration){progress.disabled=false;progress.max=String(duration);progress.value=String(Math.min(duration,current));}
    if(!duration)progress.disabled=true;
    paintSeek(current,duration);time.textContent=`${formatTime(current)} / ${duration?formatTime(duration):'--:--'}`;
  };
  const beginSeek=()=>{if(seeking||!finiteDuration())return;seeking=true;resumeAfterSeek=!audio.paused&&!audio.ended;if(resumeAfterSeek)audio.pause();status.textContent='اسحب لاختيار موضع التلاوة';};
  const previewSeek=()=>{const duration=finiteDuration();if(!duration)return;if(!seeking)beginSeek();const target=seekValue();try{audio.currentTime=target;}catch{}paintSeek(target,duration);time.textContent=`${formatTime(target)} / ${formatTime(duration)}`;};
  const paintListeningAyah=()=>{
    const ms=(Number(audio.currentTime)||0)*1000;
    const current=selectedAyahIndex>=0?selectedAyahIndex:
      (audio.paused?-1:ayahs.findIndex((ayah,index)=>ms>=ayah.startMs
        &&(ms<ayah.endMs||(index===ayahs.length-1&&ms<=ayah.endMs))));
    ayahButtons.forEach((button,index)=>{
      const isCurrent=index===current;
      button.classList.toggle('is-current',isCurrent);
      if(isCurrent)button.setAttribute('aria-current','true');
      else button.removeAttribute('aria-current');
    });
    overlayPaths.forEach((path,index)=>{
      const isCurrent=index===current;
      path.classList.toggle('is-current',isCurrent);
      if(isCurrent)path.setAttribute('aria-current','true');
      else path.removeAttribute('aria-current');
    });
  };
  const paintAyahSelection=()=>{
    ayahButtons.forEach((button,index)=>{
      const active=index===selectedAyahIndex;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
    paintListeningAyah();
  };
  const clearAyahSelection=()=>{selectedAyahIndex=-1;ayahRepeatCount=0;paintAyahSelection();};
  const commitSeek=()=>{const duration=finiteDuration();if(!duration)return;const shouldResume=resumeAfterSeek,target=seekValue();clearAyahSelection();try{audio.currentTime=target;}catch{}seeking=false;resumeAfterSeek=false;completed=false;paintSeek(target,duration);updateProgress();if(shouldResume){void playAudio();}else status.textContent='جاهزة من الموضع الجديد';};
  const markCompleted=()=>{completed=true;status.textContent='انتهت التلاوة';updateProgress();onCompleted();};
  const playAudio=async()=>{try{await audio.play();status.textContent=audio.currentTime>0?'نكمل التلاوة':'تعمل التلاوة الآن';paintListeningAyah();return true;}catch{status.textContent=retryPlayText;return false;}};
  const pauseAudio=()=>{audio.pause();paintListeningAyah();status.textContent='متوقفة مؤقتًا';};
  const restartAudio=async()=>{audio.pause();audio.currentTime=selectedAyahIndex>=0?ayahs[selectedAyahIndex].startMs/1000:0;ayahRepeatCount=0;completed=false;seeking=false;resumeAfterSeek=false;updateProgress();return playAudio();};
  const stopAudio=()=>{audio.pause();clearAyahSelection();try{audio.currentTime=0;}catch{}completed=false;seeking=false;resumeAfterSeek=false;updateProgress();paintListeningAyah();status.textContent='متوقفة';};
  const stopOnFamilyNavigation=()=>stopAudio();
  document.addEventListener('family:stop-quran-audio',stopOnFamilyNavigation);
  const selectAyah=async index=>{
    const item=ayahs[index];if(!item||destroyed)return;
    audio.pause();selectedAyahIndex=index;ayahRepeatCount=0;completed=false;seeking=false;
    try{audio.currentTime=item.startMs/1000;}catch{status.textContent='تعذر الانتقال للآية';clearAyahSelection();return;}
    paintAyahSelection();updateProgress();
    status.textContent='الآية '+String(index+1)+' — استمع وردد';
    await playAudio();
  };
  const handleAyahBoundary=()=>{
    if(selectedAyahIndex<0||destroyed||seeking)return false;
    const item=ayahs[selectedAyahIndex];
    if(audio.currentTime*1000<item.endMs-50)return false;
    ayahRepeatCount++;
    const target=Number(repeatSelect?.value)||1;
    if(ayahRepeatCount<target){
      try{audio.currentTime=item.startMs/1000;}catch{clearAyahSelection();audio.pause();return true;}
      status.textContent='إعادة الآية '+String(selectedAyahIndex+1)+' — '+String(ayahRepeatCount+1)+' من '+String(target);
      if(audio.paused)void playAudio();
    }else{
      const finished=selectedAyahIndex+1;
      clearAyahSelection();audio.pause();status.textContent='اكتمل تكرار الآية '+String(finished)+' — اختر الآية التالية';
    }
    updateProgress();return true;
  };

  ayahButtons.forEach((button,index)=>button.addEventListener('click',()=>{void selectAyah(index);}));
  overlayPaths.forEach((path,index)=>{
    path.addEventListener('click',()=>{void selectAyah(index);});
    path.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){
        event.preventDefault();void selectAyah(index);
      }
    });
  });
  play.addEventListener('click',()=>{void playAudio();});pause.addEventListener('click',pauseAudio);stop.addEventListener('click',stopAudio);restart.addEventListener('click',()=>{void restartAudio();});
  previousPage.addEventListener('click',()=>changePage(pageIndex-1));nextPage.addEventListener('click',()=>changePage(pageIndex+1));
  viewport.addEventListener('touchstart',event=>{const touch=event.changedTouches?.[0];if(!touch)return;touchStartX=touch.clientX;touchStartY=touch.clientY;},{passive:true});
  viewport.addEventListener('touchend',event=>{const touch=event.changedTouches?.[0];if(!touch)return;const dx=touch.clientX-touchStartX,dy=touch.clientY-touchStartY;if(Math.abs(dx)<45||Math.abs(dx)<=Math.abs(dy)*1.2)return;if(dx<0)changePage(pageIndex+1);else changePage(pageIndex-1);},{passive:true});
  progress.addEventListener('pointerdown',beginSeek);progress.addEventListener('input',previewSeek);progress.addEventListener('change',commitSeek);progress.addEventListener('pointerup',commitSeek);progress.addEventListener('pointercancel',commitSeek);
  audio.addEventListener('timeupdate',()=>{updateProgress();handleAyahBoundary();paintListeningAyah();});
  audio.addEventListener('loadedmetadata',updateProgress);
  audio.addEventListener('durationchange',updateProgress);
  audio.addEventListener('progress',updateProgress);
  audio.addEventListener('canplay',updateProgress);
  audio.addEventListener('ended',()=>{if(!handleAyahBoundary())markCompleted();});
  audio.addEventListener('error',()=>{status.textContent='تعذر تحميل التلاوة';});
  image.addEventListener('load',()=>{figure.removeAttribute('data-image-error');if(verseOverlay)verseOverlay.style.display=pageIndex===0&&sourceIndex===0?'':'none';});
  image.addEventListener('error',()=>{if(verseOverlay)verseOverlay.style.display='none';const page=pages[pageIndex],sources=pageSources(page);sourceIndex+=1;if(sourceIndex<sources.length){image.src=sources[sourceIndex];return;}figure.dataset.imageError='true';caption.textContent='تعذر تحميل صفحة المصحف — لا يتم استبدالها بنص مولّد';});

  renderPage();

  return Object.freeze({
    play:playAudio,pause:pauseAudio,restart:restartAudio,stop:stopAudio,
    nextPage(){changePage(pageIndex+1);},previousPage(){changePage(pageIndex-1);},getPageIndex(){return pageIndex;},
    hasCompleted(){return completed;},
    destroy(){destroyed=true;document.removeEventListener('family:stop-quran-audio',stopOnFamilyNavigation);stopAudio();audio.src='';host.classList.remove('quran-player-host');host.innerHTML='';}
  });
}
