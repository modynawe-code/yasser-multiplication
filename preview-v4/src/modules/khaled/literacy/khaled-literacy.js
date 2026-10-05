const VIDEOS=Object.freeze([
  {id:'unit1-letters',title:'مراجعة حروف الوحدة الأولى: أسرتي',description:'مراجعة الأصوات القصيرة والطويلة ثم تدريب على قراءة الكلمات.',path:'assets/khaled/literacy/unit-1-family-letters-review.mp4'},
  {id:'unit1-review',title:'مراجعة الوحدة الأولى: الحروف والمقاطع',description:'مراجعة الحروف بالأصوات القصيرة والطويلة، والمقطع الساكن وقراءة حرفين.',path:'assets/khaled/literacy/unit-1-family-review-2.mp4'},
  {id:'syllable-spelling',title:'قراءة المقاطع الصوتية بالتهجئة',description:'تدريب على قراءة المقاطع والوقوف وقفة خفيفة على الحرف الساكن.',path:'assets/khaled/literacy/syllable-spelling.mp4'}
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

export function createKhaledLiteracyController({showView,onBack}={}){
  let bound=false;
  function open(){
    ensureStyle();
    const view=ensureView();
    if(!bound){
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
