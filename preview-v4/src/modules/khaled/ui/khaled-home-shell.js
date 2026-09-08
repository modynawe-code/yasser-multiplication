export function ensureKhaledHomeShell(){
  const home=document.getElementById('khaledHomeView');
  if(!home||home.dataset.presentation==='khaled-home-v2')return false;

  home.dataset.presentation='khaled-home-v2';
  home.innerHTML=`
    <div class="khaled-wrap">
      <div class="khaled-head khaled-home-hero">
        <div class="khaled-home-copy">
          <div class="kicker">رياضيات خالد</div>
          <h2>نتعلم بالأرقام والصور</h2>
          <p>أنشطة قصيرة مناسبة للصف الأول الابتدائي.</p>
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
  return true;
}
