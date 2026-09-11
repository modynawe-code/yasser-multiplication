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

export function mountQuranSurahPlayer(host,{
  surahNameAr='السورة',
  surahNumber=null,
  audioPath='',
  mushafPage=null,
  retryPlayText='اضغطي تشغيل مرة ثانية',
  onCompleted=()=>{}
}={}){
  if(!host)throw new Error('Quran player host is required');
  if(!audioPath)throw new Error('Verified human recitation audio is required');
  ensureStyle();

  const sources=pageSources(mushafPage);
  if(!sources.length)throw new Error('Verified mushaf page image is required');
  const focusRegion=normalizedFocusRegion(mushafPage,surahNumber);

  host.innerHTML='';
  host.removeAttribute('aria-hidden');
  host.classList.add('quran-player-host');

  const root=document.createElement('section');
  root.className='quran-surah-player';
  root.setAttribute('aria-label',`مشغل سورة ${surahNameAr}`);

  const figure=document.createElement('figure');
  figure.className='quran-page-frame';
  if(focusRegion)figure.dataset.focused='true';

  const viewport=document.createElement('div');
  viewport.className='quran-page-viewport';
  if(focusRegion){
    viewport.dataset.focused='true';
    viewport.style.aspectRatio=String(focusRegion.aspect/focusRegion.height);
  }

  const image=document.createElement('img');
  image.className='quran-page-image';
  image.src=sources[0];
  image.alt=focusRegion
    ?`سورة ${surahNameAr} كما تظهر في صفحة ${mushafPage?.pageNumber||''} من مصحف المدينة`
    :`صفحة المصحف التي تحتوي على سورة ${surahNameAr}`;
  image.decoding='async';
  image.loading='eager';
  if(focusRegion)image.style.transform=`translateY(-${focusRegion.top*100}%)`;

  viewport.appendChild(image);
  const caption=document.createElement('figcaption');
  caption.className='quran-page-caption';
  const pageLabel=mushafPage?.pageNumber?` • صفحة ${mushafPage.pageNumber}`:'';
  const normalCaption=focusRegion
    ?`${focusRegion.labelAr||`سورة ${surahNameAr}`} • من مصحف المدينة${pageLabel} • حفص عن عاصم`
    :`مصحف المدينة • حفص عن عاصم${pageLabel}`;
  caption.textContent=normalCaption;
  figure.append(viewport,caption);

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
  const progress=document.createElement('progress');
  progress.className='quran-progress';progress.max=1;progress.value=0;
  const time=document.createElement('span');
  time.className='quran-time';time.textContent='0:00 / 0:00';
  progressWrap.append(progress,time);

  const status=document.createElement('p');
  status.className='quran-player-status';
  status.setAttribute('aria-live','polite');
  status.textContent='جاهزة للاستماع';

  root.append(figure,transport,progressWrap,status);
  host.appendChild(root);

  let completed=false,destroyed=false,sourceIndex=0;
  const updateProgress=()=>{
    if(destroyed)return;
    const duration=audio.duration;
    progress.value=Number.isFinite(duration)&&duration>0?Math.min(1,audio.currentTime/duration):0;
    time.textContent=`${formatTime(audio.currentTime)} / ${formatTime(duration)}`;
  };
  const markCompleted=()=>{
    completed=true;status.textContent='انتهت التلاوة';updateProgress();onCompleted();
  };
  const playAudio=async()=>{
    try{await audio.play();status.textContent=audio.currentTime>0?'نكمل التلاوة':'تعمل التلاوة الآن';return true;}
    catch{status.textContent=retryPlayText;return false;}
  };
  const pauseAudio=()=>{audio.pause();status.textContent='متوقفة مؤقتًا';};
  const restartAudio=async()=>{audio.pause();audio.currentTime=0;completed=false;updateProgress();return playAudio();};
  const stopAudio=()=>{audio.pause();try{audio.currentTime=0;}catch{}completed=false;updateProgress();status.textContent='متوقفة';};

  play.addEventListener('click',()=>{void playAudio();});
  pause.addEventListener('click',pauseAudio);
  stop.addEventListener('click',stopAudio);
  restart.addEventListener('click',()=>{void restartAudio();});
  audio.addEventListener('timeupdate',updateProgress);
  audio.addEventListener('loadedmetadata',updateProgress);
  audio.addEventListener('ended',markCompleted);
  audio.addEventListener('error',()=>{status.textContent='تعذر تحميل التلاوة';});
  image.addEventListener('load',()=>{figure.removeAttribute('data-image-error');caption.textContent=normalCaption;});
  image.addEventListener('error',()=>{
    sourceIndex+=1;
    if(sourceIndex<sources.length){image.src=sources[sourceIndex];return;}
    figure.dataset.imageError='true';
    caption.textContent='تعذر تحميل صفحة المصحف — لا يتم استبدالها بنص مولّد';
  });

  return Object.freeze({
    play:playAudio,
    pause:pauseAudio,
    restart:restartAudio,
    stop:stopAudio,
    hasCompleted(){return completed;},
    destroy(){destroyed=true;stopAudio();audio.src='';host.classList.remove('quran-player-host');host.innerHTML='';}
  });
}
