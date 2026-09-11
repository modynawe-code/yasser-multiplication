import { createKhaledQuranController } from '../quran/khaled-quran.js';
import { createKhaledScienceController } from '../science/khaled-science.js';

let quranController=null,scienceController=null;
let quranBackViewId='khaledHomeView',scienceBackViewId='khaledHomeView';

function showKhaledView(id){
  document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id===id));
  document.body.classList.remove('hub-mode','intro-mode','family-parent-mode');
  document.body.classList.add('khaled-mode');
  window.scrollTo(0,0);
}

function ensureKhaledSubjectGateway(){
  const intro=document.getElementById('khaledIntroView');
  if(!intro||intro.dataset.subjectGateway==='true')return;
  intro.dataset.subjectGateway='true';
  const card=intro.querySelector('.khaled-intro-card');
  card?.classList.add('has-subject-gateway');
  const badge=intro.querySelector('.khaled-intro-badge');
  if(badge)badge.textContent='تعلم خالد';
  const title=intro.querySelector('.khaled-intro-copy h1');
  if(title)title.textContent='وش نبدأ اليوم يا خالد؟';
  const copy=intro.querySelector('.khaled-intro-copy p');
  if(copy)copy.textContent='اختر المادة ونكمل من مستواك الحالي.';
  const oldStart=document.getElementById('khaledIntroStart');
  if(oldStart){
    const gateway=document.createElement('div');
    gateway.className='subject-choice-grid khaled-subjects';
    gateway.setAttribute('aria-label','اختر مادة خالد');
    gateway.innerHTML=`
      <button class="subject-choice subject-choice-math" id="khaledIntroStart" type="button">
        <span class="subject-choice-mark" aria-hidden="true">+</span>
        <span class="subject-choice-copy"><strong>الرياضيات</strong><small>مهارات أول ابتدائي • أعداد وعمليات</small></span>
        <span class="subject-choice-action">ابدأ</span>
      </button>
      <button class="subject-choice subject-choice-science" id="khaledIntroScience" type="button">
        <span class="subject-choice-mark" aria-hidden="true">ع</span>
        <span class="subject-choice-copy"><strong>العلوم</strong><small>أوراق عمل الفصل الأول • أنشطة تفاعلية</small></span>
        <span class="subject-choice-action">ابدأ</span>
      </button>
      <button class="subject-choice subject-choice-quran" id="khaledIntroQuran" type="button">
        <span class="subject-choice-mark" aria-hidden="true">ق</span>
        <span class="subject-choice-copy"><strong>القرآن الكريم</strong><small>سور أول ابتدائي • الفصل الأول والثاني</small></span>
        <span class="subject-choice-action">ابدأ</span>
      </button>`;
    oldStart.replaceWith(gateway);
  }
}

export function ensureKhaledHomeShell(){
  const home=document.getElementById('khaledHomeView');
  if(!home||home.dataset.presentation==='khaled-home-v3')return false;

  ensureKhaledSubjectGateway();
  home.dataset.presentation='khaled-home-v3';
  home.innerHTML=`
    <div class="khaled-wrap">
      <div class="khaled-head khaled-home-hero">
        <div class="khaled-home-copy">
          <div class="kicker">تعلم خالد</div>
          <h2>رياضيات وعلوم وقرآن بخطوات واضحة</h2>
          <p>كل مادة لها مسار مستقل وتقدم محفوظ، ومناسبة للصف الأول الابتدائي.</p>
        </div>
        <div class="khaled-home-subject-entries" aria-label="مواد خالد">
          <button class="khaled-subject-entry khaled-science-entry-home" id="khaledScienceOpen" type="button" aria-label="فتح علوم خالد">
            <span class="khaled-subject-entry-mark science" aria-hidden="true">ع</span>
            <span><strong>العلوم</strong><small>نفس صور أوراق العمل • تفاعل وصوت</small></span>
            <em>ابدأ</em>
          </button>
          <button class="khaled-subject-entry khaled-quran-entry-home" id="khaledQuranOpen" type="button" aria-label="فتح قرآن خالد">
            <span class="khaled-subject-entry-mark quran" aria-hidden="true">ق</span>
            <span><strong>القرآن الكريم</strong><small>منهج أول ابتدائي • الفصل الأول والثاني</small></span>
            <em>ابدأ</em>
          </button>
        </div>
        <div class="khaled-home-character" aria-hidden="true">
          <img id="khaledHomeCharacter" class="khaled-character-image" alt="" width="1086" height="1448" decoding="async" hidden />
          <div class="khaled-character-fallback" id="khaledHomeCharacterFallback">+ −</div>
        </div>
        <button class="icon-btn" id="khaledHomeToHub">اختيار الطفل</button>
      </div>
      <div class="khaled-stats">
        <div><span>أسئلة اليوم</span><strong id="khaledAttempts">0</strong></div>
        <div><span>الإتقان العام</span><strong id="khaledErrors">0%</strong></div>
      </div>
      <div class="khaled-skill-list" id="khaledSkillList"></div>
    </div>`;

  quranController=createKhaledQuranController({showView:showKhaledView,onBack:()=>showKhaledView(quranBackViewId)});
  scienceController=createKhaledScienceController({showView:showKhaledView,onBack:()=>showKhaledView(scienceBackViewId)});

  document.getElementById('khaledQuranOpen')?.addEventListener('click',()=>{scienceController?.leave();quranBackViewId='khaledHomeView';quranController?.open();});
  document.getElementById('khaledIntroQuran')?.addEventListener('click',()=>{scienceController?.leave();quranBackViewId='khaledIntroView';quranController?.open();});
  document.getElementById('khaledScienceOpen')?.addEventListener('click',()=>{quranController?.leave?.();scienceBackViewId='khaledHomeView';scienceController?.open();});
  document.getElementById('khaledIntroScience')?.addEventListener('click',()=>{quranController?.leave?.();scienceBackViewId='khaledIntroView';scienceController?.open();});
  return true;
}
