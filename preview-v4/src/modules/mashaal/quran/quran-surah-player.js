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

export function mountQuranSurahPlayer(host,{
  surahNameAr='السورة',
  surahNumber=null,
  audioPath='',
  mushafPage=null,
  onCompleted=()=>{}
}={}){
  if(!host)throw new Error('Quran player host is required');
  if(!audioPath)throw new Error('Verified human recitation audio is required');
  ensureStyle();

  const pageImage=String(mushafPage?.imagePath||mushafPage?.imageUrl||'').trim();
  if(!pageImage)throw new Error('Verified mushaf page image is required');

  host.innerHTML='';
  host.removeAttribute('aria-hidden');
  host.classList.add('quran-player-host');

  const root=document.createElement('section');
  root.className='quran-surah-player';
  root.setAttribute('aria-label',`مشغل سورة ${surahNameAr}`);

  const figure=document.createElement('figure');
  figure.className='quran-page-frame';
  const image=document.createElement('img');
  image.className='quran-page-image';
  image.src=pageImage;
  image.alt=`صفحة المصحف التي تحتوي على سورة ${surahNameAr}`;
  image.decoding='async';
  image.loading='eager';
  const caption=document.createElement('figcaption');
  caption.className='quran-page-caption';
  const pageLabel=mushafPage?.pageNumber?` • صفحة ${mushafPage.pageNumber}`:'';
  caption.textContent=`مصحف المدينة • حفص عن عاصم${pageLabel}`;
  figure.append(image,caption);

  const audio=new Audio(audioPath);
  audio.preload='metadata';

  const transport=document.createElement('div');
  transport.className='quran-transport';
  transport.setAttribute('role','group');
  transport.setAttribute('aria-label','التحكم في التلاوة');

  const play=document.createElement('button');
  play.type='button';play.className='quran-control quran-control-primary';play.innerHTML='<span aria-hidden="true">▶</span><strong>تشغيل</strong>';
  const pause=document.createElement('button');
  pause.type='button';pause.className='quran-control';pause.innerHTML='<span aria-hidden="true">⏸</span><strong>إيقاف مؤقت</strong>';
  const restart=document.createElement('button');
  restart.type='button';restart.className='quran-control';restart.innerHTML='<span aria-hidden="true">↺</span><strong>من البداية</strong>';
  transport.append(play,pause,restart);

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

  let completed=false,destroyed=false;
  const updateProgress=()=>{
    if(destroyed)return;
    const duration=audio.duration;
    progress.value=Number.isFinite(duration)&&duration>0?Math.min(1,audio.currentTime/duration):0;
    time.textContent=`${formatTime(audio.currentTime)} / ${formatTime(duration)}`;
  };
  const markCompleted=()=>{
    completed=true;status.textContent='انتهت التلاوة ✨';updateProgress();onCompleted();
  };
  const playAudio=async()=>{
    try{await audio.play();status.textContent=audio.currentTime>0?'نكمل التلاوة 🎧':'تعمل التلاوة الآن 🎧';return true;}
    catch{status.textContent='اضغطي تشغيل مرة ثانية';return false;}
  };
  const pauseAudio=()=>{audio.pause();status.textContent='متوقفة مؤقتًا';};
  const restartAudio=async()=>{audio.pause();audio.currentTime=0;completed=false;updateProgress();return playAudio();};
  const stopAudio=()=>{audio.pause();try{audio.currentTime=0;}catch{}updateProgress();};

  play.addEventListener('click',()=>{void playAudio();});
  pause.addEventListener('click',pauseAudio);
  restart.addEventListener('click',()=>{void restartAudio();});
  audio.addEventListener('timeupdate',updateProgress);
  audio.addEventListener('loadedmetadata',updateProgress);
  audio.addEventListener('ended',markCompleted);
  audio.addEventListener('error',()=>{status.textContent='تعذر تحميل التلاوة';});
  image.addEventListener('error',()=>{figure.dataset.imageError='true';caption.textContent='تعذر تحميل صفحة المصحف — لا يتم استبدالها بنص مولّد';});

  return Object.freeze({
    play:playAudio,
    pause:pauseAudio,
    restart:restartAudio,
    stop:stopAudio,
    hasCompleted(){return completed;},
    destroy(){destroyed=true;stopAudio();audio.src='';host.classList.remove('quran-player-host');host.innerHTML='';}
  });
}
