import { createKhaledQuranController } from '../quran/khaled-quran.js';

let quranController=null;
function showKhaledView(id){
  document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id===id));
  document.body.classList.remove('hub-mode','intro-mode','family-parent-mode');document.body.classList.add('khaled-mode');
  window.scrollTo(0,0);
}

export function ensureKhaledHomeShell(){
  const home=document.getElementById('khaledHomeView');
  if(!home||home.dataset.presentation==='khaled-home-v2')return false;

  home.dataset.presentation='khaled-home-v2';
  home.innerHTML=`
    <div class="khaled-wrap">
      <div class="khaled-head khaled-home-hero">
        <div class="khaled-home-copy">
          <div class="kicker">تعلم خالد</div>
          <h2>رياضيات وقرآن بخطوات واضحة</h2>
          <p>أنشطة مناسبة للصف الأول الابتدائي، ومعها سور المنهج للاستماع والحفظ.</p>
        </div>
        <button class="khaled-quran-entry-home" id="khaledQuranOpen" type="button" aria-label="فتح قرآن خالد">
          <span class="khaled-quran-entry-mark" aria-hidden="true">ق</span>
          <span><strong>القرآن الكريم</strong><small>منهج أول ابتدائي • الفصل الأول والثاني</small></span>
          <em>ابدأ</em>
        </button>
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

  quranController=createKhaledQuranController({
    showView:showKhaledView,
    onBack:()=>showKhaledView('khaledHomeView')
  });
  document.getElementById('khaledQuranOpen')?.addEventListener('click',()=>quranController?.open());
  return true;
}
