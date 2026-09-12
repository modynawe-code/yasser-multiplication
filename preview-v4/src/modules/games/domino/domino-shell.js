import { applySystemInsets } from '../../../shared/ui/system-insets.js';

function ensureStyle(href,key){
  if(document.querySelector(`link[data-module-style="${key}"]`))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.moduleStyle=key;document.head.appendChild(link);
}

export function ensureDominoShell(){
  if(document.getElementById('dominoGameView'))return;
  const main=document.querySelector('main');if(!main)return;
  ensureStyle('src/modules/games/domino/domino.css','domino-game');
  const host=document.createElement('div');
  host.innerHTML=`
    <section id="dominoGameView" class="view">
      <div class="domino-shell">
        <header class="domino-header">
          <button class="domino-back" id="dominoBackToGames" type="button">رجوع للألعاب</button>
          <div>
            <span class="domino-kicker">لعبة عائلية أونلاين</span>
            <h1>الدومينو</h1>
            <p>لاعبان • جهازان • غرفة خاصة برمز من 6 أرقام</p>
          </div>
          <div class="domino-round" id="dominoRoundBadge" hidden><small>الجولة</small><strong id="dominoRound">1</strong></div>
        </header>

        <section class="domino-setup" id="dominoSetup">
          <div class="domino-setup-copy">
            <h2>مين يلعب من هذا الجهاز؟</h2>
            <p>اختر الطفل، ثم أنشئ غرفة أو ادخل رمز الغرفة من الجهاز الثاني.</p>
          </div>
          <div class="domino-player-picker" id="dominoPlayerPicker" role="group" aria-label="اختيار لاعب هذا الجهاز"></div>
          <div class="domino-room-actions">
            <button class="domino-primary" id="dominoCreateRoom" type="button">إنشاء غرفة</button>
            <div class="domino-join">
              <label for="dominoRoomCodeInput">رمز الغرفة</label>
              <div><input id="dominoRoomCodeInput" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000"><button class="domino-secondary" id="dominoJoinRoom" type="button">دخول</button></div>
            </div>
            <button class="domino-link" id="dominoResumeRoom" type="button" hidden>استعادة الغرفة السابقة</button>
          </div>
          <div class="domino-code-box" id="dominoRoomCodeBox" hidden>
            <span>رمز الغرفة</span><strong id="dominoRoomCode">------</strong><small>أرسله للاعب الثاني.</small>
          </div>
          <p class="domino-online-status" id="dominoOnlineStatus" role="status" aria-live="polite"></p>
        </section>

        <section class="domino-table-wrap" id="dominoTableWrap" hidden>
          <div class="domino-score-row" id="dominoPlayers" aria-label="اللاعبون"></div>
          <div class="domino-turn-banner" id="dominoTurnBanner" role="status" aria-live="polite">نجهز الطاولة…</div>

          <div class="domino-table">
            <div class="domino-board" id="dominoBoard" aria-label="قطع الدومينو على الطاولة"></div>
            <div class="domino-stock"><span>المخزون</span><strong id="dominoStockCount">0</strong></div>
          </div>

          <section class="domino-hand-panel">
            <div class="domino-hand-head">
              <div><small>قطعك</small><strong id="dominoHandTitle">اختر قطعة مناسبة</strong></div>
              <div class="domino-hand-actions">
                <button class="domino-secondary" id="dominoDraw" type="button" disabled>اسحب قطعة</button>
                <button class="domino-secondary" id="dominoPass" type="button" disabled>تمرير الدور</button>
              </div>
            </div>
            <div class="domino-hand" id="dominoHand" aria-label="قطع اللاعب"></div>
            <p class="domino-action-status" id="dominoActionStatus" role="status" aria-live="polite"></p>
          </section>

          <section class="domino-finish" id="dominoFinish" hidden>
            <span>انتهت الجولة</span>
            <h2 id="dominoFinishTitle"></h2>
            <p id="dominoFinishCopy"></p>
            <div class="domino-finish-actions">
              <button class="domino-primary" id="dominoRematch" type="button">جولة ثانية</button>
              <button class="domino-secondary" id="dominoFinishBack" type="button">رجوع للألعاب</button>
            </div>
          </section>
        </section>
      </div>
    </section>`;
  const view=host.firstElementChild;main.appendChild(view);applySystemInsets(view.querySelector('.domino-shell'));
}
