const VIDEOS=Object.freeze([
  {id:'unit1-letters',title:'مراجعة حروف الوحدة الأولى: أسرتي',description:'مراجعة الأصوات القصيرة والطويلة ثم تدريب على قراءة الكلمات.',path:'assets/khaled/literacy/unit-1-family-letters-review.mp4'},
  {id:'unit1-review',title:'مراجعة الوحدة الأولى: الحروف والمقاطع',description:'مراجعة الحروف بالأصوات القصيرة والطويلة، والمقطع الساكن وقراءة حرفين.',path:'assets/khaled/literacy/unit-1-family-review-2.mp4'},
  {id:'syllable-spelling',title:'قراءة المقاطع الصوتية بالتهجئة',description:'تدريب على قراءة المقاطع والوقوف وقفة خفيفة على الحرف الساكن.',path:'assets/khaled/literacy/syllable-spelling.mp4'},
  {id:'silent-letter-reading',title:'طريقة قراءة الحرف الساكن',description:'تدريب على قراءة الحرف الساكن مع الحركات من خلال أمثلة مثل مب، بل، رم، دم.',path:'assets/khaled/literacy/silent-letter-reading.mp4'},
  {id:'noon-reading',title:'نشاط قرائي: حرف ن',description:'تدريب على قراءة حرف النون بالحركات والمقاطع والكلمات.',path:'assets/khaled/literacy/noon-reading.mp4'},
  {id:'noon-summary',title:'ملخص حرف ن',description:'مراجعة حرف النون وأشكاله وأصواته القصيرة والطويلة.',path:'assets/khaled/literacy/noon-summary.mp4'},
  {id:'word-reading-practice',title:'تدريب على قراءة الكلمات',description:'قراءة كلمات بالحركات والمدود، مثل نمر ورمل ونار وباب.',path:'assets/khaled/literacy/word-reading-practice.mp4'}
]);

function ensureStyle(){
  if(document.querySelector('link[data-module-style="khaled-literacy"]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='src/modules/khaled/literacy/khaled-literacy.css';
  link.dataset.moduleStyle='khaled-literacy';
  document.head.appendChild(link);
}

function lessonButtons(){
  return VIDEOS.map((video,index)=>`<button class="khaled-literacy-lesson${index===0?' active':''}" type="button" data-literacy-video="${video.id}" aria-pressed="${index===0?'true':'false'}"><small>فيديو ${index+1}</small><strong>${video.title}</strong><span>${video.description}</span></button>`).join('');
}

function ensureView(){
  let view=document.getElementById('khaledLiteracyView');
  if(view)return view;
  const first=VIDEOS[0];
  view=document.createElement('section');
  view.id='khaledLiteracyView';
  view.className='view khaled-literacy-view';
  view.setAttribute('aria-labelledby','khaledLiteracyTitle');
  view.innerHTML=`
    <div class="khaled-literacy-shell">
      <header class="khaled-literacy-header">
        <div><div class="kicker">لغتي • أول ابتدائي</div><h1 id="khaledLiteracyTitle">فيديوهات لغتي</h1><p>اختر الدرس وشغّله داخل التطبيق.</p></div>
        <button class="icon-btn" id="khaledLiteracyBack" type="button">العودة لمواد خالد</button>
      </header>
      <div class="khaled-literacy-lessons" aria-label="فيديوهات لغتي">${lessonButtons()}</div>
      <section class="khaled-literacy-now" aria-live="polite">
        <h2 id="khaledLiteracyNowTitle">${first.title}</h2>
        <p id="khaledLiteracyNowDescription">${first.description}</p>
      </section>
      <div class="khaled-literacy-player">
        <video id="khaledLiteracyVideo" controls playsinline preload="metadata" aria-label="فيديو ${first.title}">
          <source src="${first.path}" type="video/mp4">
          المتصفح لا يدعم تشغيل الفيديو.
        </video>
      </div>
      <div class="khaled-literacy-controls" role="group" aria-label="أدوات الفيديو">
        <div class="khaled-literacy-timeline">
          <output id="khaledLiteracyTime" dir="ltr" aria-label="وقت التشغيل والمدة">0:00 / 0:00</output>
          <input id="khaledLiteracySeek" type="range" min="0" max="0" step="0.1" value="0" dir="ltr" aria-label="تقديم وتأخير الفيديو" disabled>
        </div>
        <div class="khaled-literacy-actions">
          <button id="khaledLiteracyToggle" type="button" aria-label="تشغيل الفيديو">▶ تشغيل</button>
          <button id="khaledLiteracyRewind" type="button" disabled>رجوع 10 ثوانٍ</button>
          <button id="khaledLiteracyForward" type="button" disabled>تقديم 10 ثوانٍ</button>
          <label for="khaledLiteracySpeed">السرعة
            <select id="khaledLiteracySpeed"><option value="0.5">0.5×</option><option value="0.75">0.75×</option><option value="1" selected>1× عادية</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="1.75">1.75×</option><option value="2">2×</option></select>
          </label>
        </div>
        <p id="khaledLiteracyStatus" role="status" hidden></p>
      </div>
      <p class="khaled-literacy-note">الفيديوهات تعمل داخل التطبيق، بدون انتقال إلى موقع خارجي.</p>
    </div>`;
  document.querySelector('main')?.appendChild(view);
  return view;
}

function selectVideo(view,id){
  const entry=VIDEOS.find(item=>item.id===id);
  const player=view.querySelector('#khaledLiteracyVideo');
  if(!entry||!player)return;
  view.querySelectorAll('[data-literacy-video]').forEach(button=>{
    const active=button.dataset.literacyVideo===entry.id;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  const title=view.querySelector('#khaledLiteracyNowTitle');
  const description=view.querySelector('#khaledLiteracyNowDescription');
  if(title)title.textContent=entry.title;
  if(description)description.textContent=entry.description;
  player.pause();
  player.src=entry.path;
  player.setAttribute('aria-label',`فيديو ${entry.title}`);
  player.load();
}

function formatTime(seconds){
  const value=Math.max(0,Math.floor(Number.isFinite(seconds)?seconds:0));
  return `${Math.floor(value/60)}:${String(value%60).padStart(2,'0')}`;
}

export function bindKhaledLiteracyControls(view){
  const player=view.querySelector('#khaledLiteracyVideo');
  const toggle=view.querySelector('#khaledLiteracyToggle');
  const seek=view.querySelector('#khaledLiteracySeek');
  const time=view.querySelector('#khaledLiteracyTime');
  const speed=view.querySelector('#khaledLiteracySpeed');
  const rewind=view.querySelector('#khaledLiteracyRewind');
  const forward=view.querySelector('#khaledLiteracyForward');
  const status=view.querySelector('#khaledLiteracyStatus');
  let selectedRate=1,requestId=0;
  function sync(){
    const duration=Number.isFinite(player.duration)?player.duration:0;
    const position=Number.isFinite(player.currentTime)?player.currentTime:0;
    time.textContent=`${formatTime(position)} / ${formatTime(duration)}`;
    seek.max=String(duration);
    seek.value=String(Math.min(position,duration));
    seek.disabled=rewind.disabled=forward.disabled=duration<=0;
    seek.setAttribute('aria-valuetext',`${formatTime(position)} من ${formatTime(duration)}`);
    const playing=!player.paused&&!player.ended;
    toggle.textContent=playing?'⏸ إيقاف مؤقت':'▶ تشغيل';
    toggle.setAttribute('aria-label',playing?'إيقاف الفيديو مؤقتًا':'تشغيل الفيديو');
  }
  function jump(position){
    if(Number.isFinite(player.duration)&&player.duration>0){
      player.currentTime=Math.max(0,Math.min(player.duration,position));
      sync();
    }
  }
  toggle.addEventListener('click',async()=>{
    const attempt=++requestId;
    status.hidden=true;
    if(!player.paused){player.pause();return;}
    try{await player.play();}
    catch(error){
      if(attempt!==requestId||error?.name==='AbortError')return;
      status.textContent='تعذر التشغيل. جرّب زر التشغيل داخل الفيديو أو أعد المحاولة.';
      status.hidden=false;
    }
    sync();
  });
  seek.addEventListener('input',()=>jump(Number(seek.value)));
  rewind.addEventListener('click',()=>jump(player.currentTime-10));
  forward.addEventListener('click',()=>jump(player.currentTime+10));
  speed.addEventListener('change',()=>{
    const rate=Number(speed.value);
    if(![0.5,0.75,1,1.25,1.5,1.75,2].includes(rate))return;
    selectedRate=rate;
    player.playbackRate=rate;
    player.preservesPitch=true;
  });
  player.addEventListener('loadedmetadata',()=>{player.playbackRate=selectedRate;sync();});
  player.addEventListener('ratechange',()=>{selectedRate=player.playbackRate;speed.value=String(selectedRate);});
  player.addEventListener('emptied',()=>{requestId++;status.hidden=true;sync();});
  player.addEventListener('error',()=>{status.textContent='تعذر تحميل الفيديو. تحقق من الاتصال وأعد اختيار الدرس.';status.hidden=false;sync();});
  for(const event of ['timeupdate','durationchange','play','pause','ended','seeking','seeked'])player.addEventListener(event,sync);
  sync();
}

export function createKhaledLiteracyController({showView,onBack}={}){
  let bound=false;
  function open(){
    ensureStyle();
    const view=ensureView();
    if(!bound){
      bindKhaledLiteracyControls(view);
      view.querySelectorAll('[data-literacy-video]').forEach(button=>button.addEventListener('click',()=>selectVideo(view,button.dataset.literacyVideo)));
      document.getElementById('khaledLiteracyBack')?.addEventListener('click',()=>{view.querySelector('#khaledLiteracyVideo')?.pause();onBack?.();});
      bound=true;
    }
    showView?.('khaledLiteracyView');
  }
  return{open};
}

export const KHALED_LITERACY_VIDEOS=VIDEOS;
export const KHALED_LITERACY_VIDEO_PATH=VIDEOS[0].path;

