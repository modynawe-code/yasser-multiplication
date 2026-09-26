function ensureStyle(href,key){
  if(document.querySelector(`link[data-module-style="${key}"]`))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.moduleStyle=key;document.head.appendChild(link);
}

export function ensureMarioShell(){
  if(document.getElementById('marioGameView'))return;
  const main=document.querySelector('main');if(!main)return;
  ensureStyle('src/modules/games/mario/mario.css','mario-game');
  const host=document.createElement('div');
  host.innerHTML=`
    <section id="marioGameView" class="view">
      <div class="mario-shell">
        <header class="mario-header">
          <button class="mario-back" id="marioBackToGames">رجوع للألعاب</button>
          <div><span>نسخة نينتندو الكلاسيكية · لعبة فردية</span><h1>سوبر ماريو بروس</h1></div>
          <button class="mario-action" id="marioPause" disabled>إيقاف مؤقت</button>
        </header>
        <div class="mario-layout">
          <section class="mario-screen-panel" aria-label="شاشة اللعبة">
            <div class="mario-screen" id="marioScreen"><div class="mario-welcome"><strong>لحظة ونبدأ</strong><span>نجهّز اللعبة…</span></div></div>
            <div class="mario-toolbar">
              <button class="mario-action" id="marioReset" disabled>إعادة البداية</button>
              <span class="mario-status" id="marioStatus" role="status" aria-live="polite">نجهّز اللعبة…</span>
            </div>
          </section>
          <section class="mario-controls" aria-label="أزرار التحكم باللمس">
            <div class="mario-dpad" aria-label="الاتجاهات">
              <button data-mario-button="UP" aria-label="أعلى">↑</button>
              <button data-mario-button="LEFT" aria-label="يسار">←</button>
              <button data-mario-button="DOWN" aria-label="أسفل">↓</button>
              <button data-mario-button="RIGHT" aria-label="يمين">→</button>
            </div>
            <div class="mario-face-buttons">
              <button data-mario-button="B" aria-label="زر B">B</button>
              <button data-mario-button="A" aria-label="زر A">A</button>
            </div>
            <div class="mario-center-buttons">
              <button data-mario-button="SELECT" aria-label="اختيار">اختيار</button>
              <button data-mario-button="START" aria-label="ابدأ">ابدأ</button>
            </div>
            <p>تقدرون تلعبون باللمس أو بلوحة المفاتيح: الأسهم، وZ وX، وEnter.</p>
          </section>
        </div>
      </div>
    </section>`;
  main.appendChild(host.firstElementChild);
}
