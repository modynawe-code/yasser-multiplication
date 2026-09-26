function ensureStyle(href,key){
  if(document.querySelector(`link[data-module-style="${key}"]`))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.moduleStyle=key;document.head.appendChild(link);
}

export function ensurePuzzleShell(){
  if(document.getElementById('puzzleGameView'))return;
  const main=document.querySelector('main');if(!main)return;
  ensureStyle('src/modules/games/puzzle/puzzle.css','family-picture-puzzle');
  const host=document.createElement('div');
  host.innerHTML=`
    <section id="puzzleGameView" class="view">
      <div class="fp-shell">
        <header class="fp-header">
          <button class="fp-nav" id="fpBack" type="button">↩ رجوع للألعاب</button>
          <div class="fp-title"><span>🧩</span><div><h2>تركيب الصور</h2><p>رتّب القطع عشان تكتمل الصورة</p></div></div>
          <button class="fp-nav" id="fpNew" type="button" hidden>خلط من جديد</button>
        </header>
        <div class="fp-layout">
          <aside class="fp-panel" id="fpSetupPanel">
            <section class="fp-control-group"><h3>اختر الطفل</h3><div id="fpPlayers" class="fp-player-list" role="group" aria-label="صور الأطفال"></div><h3 class="fp-picture-heading">اختر صورته</h3><div id="fpPictureChoices" class="fp-picture-list" role="group" aria-label="صور الطفل المختار"></div></section>
            <section class="fp-control-group"><h3>مستوى التحدي</h3><div class="fp-difficulty" role="group" aria-label="مستوى الصعوبة"><button type="button" data-fp-size="3" aria-pressed="true">سهل <small>٩ قطع</small></button><button type="button" data-fp-size="4" aria-pressed="false">متوسط <small>١٦ قطعة</small></button><button type="button" data-fp-size="6" aria-pressed="false">تحدي <small>٣٦ قطعة</small></button></div></section>
            <div class="fp-stats"><div><span>القطع المركّبة</span><strong id="fpProgress" dir="ltr">٠ / ٩</strong></div><div><span>الوقت</span><strong id="fpTime" dir="ltr">٠:٠٠</strong></div></div>
            <p id="fpMessage" class="fp-message" role="status" aria-live="polite">اسحب كل قطعة إلى مكانها، أو اضغط القطعة ثم اضغط مكانها.</p>
            <button class="fp-start" id="fpStart" type="button">ابدأ اللعب</button>
            <button class="fp-reference-toggle" id="fpReferenceToggle" type="button" aria-expanded="false">إظهار الصورة كاملة</button>
            <img id="fpReference" class="fp-reference" alt="الصورة المطلوب تركيبها" hidden>
          </aside>
          <div class="fp-play-area" id="fpPlayArea" hidden><div class="fp-board-wrap"><div class="fp-board" id="fpBoard" role="group" aria-label="أماكن قطع الصورة"></div><div id="fpWin" class="fp-win" hidden><span>🎉</span><strong id="fpWinTitle">أحسنت!</strong><p>اكتملت الصورة خلال <b id="fpWinTime">٠:٠٠</b>.</p><button id="fpPlayAgain" type="button">صورة ثانية</button></div></div><section class="fp-tray-wrap"><h3>قطع الصورة</h3><div class="fp-tray" id="fpTray" aria-label="القطع المتبقية"></div></section></div>
        </div>
      </div>
    </section>`;
  main.appendChild(host.firstElementChild);
}
