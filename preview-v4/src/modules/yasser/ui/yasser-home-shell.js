function ensureStyle(href,key){
  if(document.querySelector(`link[data-module-style="${key}"]`))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href=href;
  link.dataset.moduleStyle=key;
  document.head.appendChild(link);
}

function tableButtons(){
  return Array.from({length:10},(_,index)=>{
    const table=index+1;
    const selected=table===2||table===3?' selected':'';
    return `<button class="table-chip${selected}" data-table="${table}" aria-label="جدول ${table}" aria-pressed="${Boolean(selected)}">${table}</button>`;
  }).join('');
}

function ensureYasserSubjectGateway(){
  const intro=document.getElementById('introView');
  if(!intro||intro.dataset.subjectGateway==='true')return;
  intro.dataset.subjectGateway='true';
  const card=intro.querySelector('.intro-card');
  card?.classList.add('has-subject-gateway');
  if(card&&!document.getElementById('yasserSubjectsToHub')){
    const back=document.createElement('button');
    back.type='button';
    back.id='yasserSubjectsToHub';
    back.className='icon-btn subject-gateway-back';
    back.setAttribute('aria-label','العودة لاختيار الطفل');
    back.textContent='اختيار الطفل';
    back.addEventListener('click',()=>document.getElementById('switchLearnerBtn')?.click());
    card.prepend(back);
  }
  const badge=intro.querySelector('.intro-badge');
  if(badge)badge.textContent='تعلم ياسر';
  const title=intro.querySelector('.intro-copy h1');
  if(title)title.textContent='وش نبدأ اليوم يا ياسر؟';
  const copy=intro.querySelector('.intro-copy p');
  if(copy)copy.textContent='اختر المادة، وكل مسار يحفظ تقدمك بشكل مستقل.';
  const oldStart=document.getElementById('introStart');
  if(oldStart){
    const gateway=document.createElement('div');
    gateway.className='subject-choice-grid yasser-subjects';
    gateway.setAttribute('aria-label','اختر مادة ياسر');
    gateway.innerHTML=`
      <button class="subject-choice subject-choice-math" id="introStart" type="button">
        <span class="subject-choice-mark" aria-hidden="true">×</span>
        <span class="subject-choice-copy"><strong>الرياضيات</strong><small>جداول الضرب 1–10 • تدريب واختبار</small></span>
        <span class="subject-choice-action">ابدأ</span>
      </button>
      <button class="subject-choice subject-choice-quran" id="introQuran" type="button">
        <span class="subject-choice-mark" aria-hidden="true">ق</span>
        <span class="subject-choice-copy"><strong>القرآن الكريم</strong><small>تلاوة وحفظ • سادس ابتدائي</small></span>
        <span class="subject-choice-action">ابدأ</span>
      </button>`;
    oldStart.replaceWith(gateway);
  }
  const brandTitle=document.querySelector('.brand h1');
  const brandSubtitle=document.querySelector('.brand p');
  if(brandTitle)brandTitle.textContent='تعلم ياسر';
  if(brandSubtitle)brandSubtitle.textContent='الرياضيات • القرآن';
}

function showYasserIntro(){
  document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id==='introView'));
  document.body.classList.remove('yasser-quran-mode','hub-mode','khaled-mode','mashaal-mode');
  document.body.classList.add('intro-mode');
  window.scrollTo(0,0);
}

export function ensureYasserHomeShell(){
  const home=document.getElementById('homeView');
  if(!home||home.dataset.presentation==='yasser-home-v2')return false;

  ensureStyle('src/modules/yasser/ui/yasser-home.css','yasser-home');
  ensureYasserSubjectGateway();
  home.dataset.presentation='yasser-home-v2';
  home.innerHTML=`
    <div class="yasser-home-shell">
      <article class="yasser-home-panel">
        <section class="yasser-home-hero" aria-labelledby="yasserHomeTitle">
          <button class="icon-btn yasser-home-back" id="yasserMathToSubjects" type="button" aria-label="العودة لاختيار المادة">رجوع للمواد</button>
          <div class="yasser-home-copy">
            <div class="kicker">مهمة اليوم</div>
            <h2 id="yasserHomeTitle">هلا يا ياسر</h2>
            <p>اختر الجداول اللي تبي تركز عليها، وبعدها ندخل تدريب قصير وواضح.</p>
            <div class="yasser-home-focus" aria-label="جداول اليوم">
              <span>جداول اليوم</span>
              <strong id="focusSummary">جدول 2 + جدول 3</strong>
            </div>
            <button class="reward-cabinet-open" id="rewardCabinetOpen-yasser" data-reward-entry="yasser" type="button" aria-label="فتح خزانة جوائز ياسر">جوائزي</button>
          </div>
          <div class="yasser-home-characters" id="homeCharacters" aria-hidden="true">
            <img id="homeYasser" class="yasser-mascot" alt="" width="220" height="275" decoding="async" fetchpriority="high" />
            <img id="homeAssistant" class="calc-mascot" alt="" width="150" height="150" decoding="async" />
          </div>
        </section>

        <section class="yasser-home-training" aria-label="اختيار جداول الضرب">
          <div class="yasser-home-section-head">
            <div><span>اختيار سريع</span><h3>وش الجداول اللي بنتمرن عليها؟</h3></div>
            <small>تقدر تختار أكثر من جدول</small>
          </div>
          <div class="table-picker" id="tableSelector">${tableButtons()}</div>
          <div class="yasser-home-actions main-actions">
            <button class="btn primary" id="startPractice">ابدأ التدريب</button>
            <button class="btn secondary" id="startLearn">مراجعة سريعة</button>
            <button class="btn exam" id="startExam">اختبار • 30 سؤالًا</button>
            <button class="btn secondary" id="openYasserQuran">القرآن الكريم • تلاوة وحفظ</button>
          </div>

          <section class="yasser-home-progress" aria-label="تقدم ياسر">
            <div class="yasser-home-progress-head"><strong>تقدمي</strong><span>ملخص سريع بدون فتح تقرير ولي الأمر</span></div>
            <div class="yasser-home-progress-metrics">
              <div><span>محاولاتي</span><strong id="miniAttempts">0</strong></div>
              <div><span>تحتاج مراجعة</span><strong id="miniErrors">0</strong></div>
            </div>
            <div class="progress-grid yasser-home-progress-grid" id="progressList"></div>
          </section>
          <noscript><p class="no-js">افتح الصفحة في Chrome أو Samsung Internet لبدء التدريب وحفظ النتائج.</p></noscript>
        </section>
      </article>
    </div>`;

  document.getElementById('yasserMathToSubjects')?.addEventListener('click',showYasserIntro);
  document.getElementById('openYasserQuran')?.addEventListener('click',async()=>{
    const {openYasserQuran}=await import('../quran/yasser-quran.js');
    openYasserQuran();
  });
  document.getElementById('introQuran')?.addEventListener('click',async()=>{
    const {openYasserQuran,closeYasserQuran}=await import('../quran/yasser-quran.js');
    openYasserQuran();
    document.getElementById('yasserQuranBack')?.addEventListener('click',event=>{
      event.preventDefault();event.stopImmediatePropagation();closeYasserQuran();showYasserIntro();
    },{capture:true,once:true});
  });
  return true;
}
