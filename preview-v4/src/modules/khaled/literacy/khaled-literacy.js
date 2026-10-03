const VIDEO_PATH='assets/khaled/literacy/unit-1-family-letters-review.mp4';

function ensureStyle(){
  if(document.querySelector('link[data-module-style="khaled-literacy"]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='src/modules/khaled/literacy/khaled-literacy.css';
  link.dataset.moduleStyle='khaled-literacy';
  document.head.appendChild(link);
}

function ensureView(){
  let view=document.getElementById('khaledLiteracyView');
  if(view)return view;
  view=document.createElement('section');
  view.id='khaledLiteracyView';
  view.className='view khaled-literacy-view';
  view.setAttribute('aria-labelledby','khaledLiteracyTitle');
  view.innerHTML=`
    <div class="khaled-literacy-shell">
      <header class="khaled-literacy-header">
        <div><div class="kicker">لغتي • أول ابتدائي</div><h1 id="khaledLiteracyTitle">مراجعة حروف الوحدة الأولى: أسرتي</h1><p>مراجعة الحروف بالأصوات القصيرة والطويلة، ثم تدريب على قراءة الكلمات.</p></div>
        <button class="icon-btn" id="khaledLiteracyBack" type="button">العودة لمواد خالد</button>
      </header>
      <div class="khaled-literacy-player">
        <video controls playsinline preload="metadata" aria-label="فيديو مراجعة حروف الوحدة الأولى: أسرتي">
          <source src="${VIDEO_PATH}" type="video/mp4">
          المتصفح لا يدعم تشغيل الفيديو.
        </video>
      </div>
      <p class="khaled-literacy-note">الفيديو محفوظ كما وصل، دون قص أو تعديل.</p>
    </div>`;
  document.querySelector('main')?.appendChild(view);
  return view;
}

export function createKhaledLiteracyController({showView,onBack}={}){
  let bound=false;
  function open(){
    ensureStyle();
    const view=ensureView();
    if(!bound){document.getElementById('khaledLiteracyBack')?.addEventListener('click',()=>{view.querySelector('video')?.pause();onBack?.();});bound=true;}
    showView?.('khaledLiteracyView');
  }
  return{open};
}

export const KHALED_LITERACY_VIDEO_PATH=VIDEO_PATH;
