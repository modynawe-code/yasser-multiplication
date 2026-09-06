function ensureStyle(href,key){
  if(document.querySelector(`link[data-module-style="${key}"]`))return;
  const link=document.createElement('link');
  link.rel='stylesheet';link.href=href;link.dataset.moduleStyle=key;document.head.appendChild(link);
}

export function ensureGamesShell(){
  if(document.getElementById('gamesHomeView'))return;
  const main=document.querySelector('main');
  if(!main)return;

  ensureStyle('src/modules/games/ui/games.css','games-platform');

  const hubActions=document.querySelector('#hubView .hub-heading-actions');
  if(hubActions&&!document.getElementById('gamesOpenBtn')){
    const button=document.createElement('button');
    button.className='icon-btn games-open-btn';
    button.id='gamesOpenBtn';
    button.textContent='🎮 الألعاب';
    button.setAttribute('aria-label','فتح منطقة الألعاب');
    hubActions.appendChild(button);
  }

  const shell=document.createElement('div');
  shell.innerHTML=`
    <section id="gamesHomeView" class="view">
      <div class="games-shell">
        <header class="games-header">
          <button class="icon-btn" id="gamesBackToHub" data-nav="back">اختيار الطفل</button>
          <div><div class="kicker">منطقة الألعاب</div><h1>نلعب ونتعلم معًا</h1><p>ألعاب فردية ومشتركة، تعليمية وللمرح.</p></div>
        </header>
        <div class="games-filter-note">البداية بثلاثة أنماط مختلفة حتى يبقى النظام قابلًا للتوسع.</div>
        <div class="games-grid" id="gamesCatalog"></div>
      </div>
    </section>

    <section id="xoLobbyView" class="view">
      <div class="games-shell xo-lobby-shell">
        <header class="games-header">
          <button class="icon-btn" id="xoLobbyBack" data-nav="back">الألعاب</button>
          <div><div class="kicker">إكس أو</div><h1>اختاروا طريقة اللعب</h1><p>على نفس الجهاز أو بين جهازين أونلاين.</p></div>
        </header>
        <div class="xo-lobby-card">
          <div class="xo-lobby-copy"><h2>مين يلعب من هذا الجهاز؟</h2><p>الاختيار مطلوب للأونلاين فقط.</p></div>
          <div class="xo-lobby-players" role="group" aria-label="اختيار اللاعب">
            <button class="xo-lobby-player yasser" data-xo-learner="yasser"><img src="assets/visual/original/yasser/welcome.png" alt=""><strong>ياسر</strong></button>
            <button class="xo-lobby-player khaled" data-xo-learner="khaled"><img src="assets/visual/original/khaled/khaled-point-thumbsup.png" alt=""><strong>خالد</strong></button>
          </div>
          <div class="xo-lobby-actions">
            <button class="btn primary" id="xoLocalStart">على نفس الجهاز</button>
            <button class="btn secondary" id="xoOnlineCreate">إنشاء غرفة أونلاين</button>
          </div>
          <div class="xo-room-join">
            <label for="xoRoomCodeInput">عندك رمز غرفة؟</label>
            <div><input id="xoRoomCodeInput" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000"><button class="btn secondary" id="xoOnlineJoin">دخول</button></div>
          </div>
          <div class="xo-room-code-box" id="xoRoomCodeBox" hidden><span>رمز الغرفة</span><strong id="xoRoomCode">------</strong><small>افتح التطبيق في الجهاز الثاني واكتب هذا الرمز.</small></div>
          <div class="xo-lobby-status" id="xoLobbyStatus" role="status" aria-live="polite"></div>
        </div>
      </div>
    </section>

    <section id="xoGameView" class="view">
      <div class="games-shell xo-shell">
        <header class="games-header xo-header">
          <button class="icon-btn" id="xoBackToGames" data-nav="back">الألعاب</button>
          <div><div class="kicker">إكس أو التعليمية</div><h1>ياسر ضد خالد</h1><p id="xoModeLabel">نسخة محلية — جهاز واحد</p></div>
          <button class="btn secondary xo-reset" id="xoReset">جولة جديدة</button>
        </header>

        <div class="xo-layout">
          <section class="xo-board-panel" aria-label="لوحة اللعب">
            <div class="xo-board locked" id="xoBoard" role="grid" aria-label="لوحة إكس أو"></div>
          </section>

          <section class="xo-play-panel" aria-label="الدور والسؤال">
            <div class="xo-player-strip" aria-label="اللاعبون">
              <article class="xo-player-card yasser" id="xoPlayerYasser">
                <div class="xo-player-avatar"><img src="assets/visual/original/yasser/welcome.png" alt="" decoding="async"></div>
                <div><strong>ياسر</strong><span>الأزرق</span></div>
              </article>
              <div class="xo-turn-panel" role="status" aria-live="polite">
                <small>الدور الآن</small>
                <strong id="xoTurnName">ياسر</strong>
                <span id="xoStatusText">جاوب ثم اختر مربعًا</span>
              </div>
              <article class="xo-player-card khaled" id="xoPlayerKhaled">
                <div class="xo-player-avatar"><img src="assets/visual/original/khaled/khaled-point-thumbsup.png" alt="" decoding="async"></div>
                <div><strong>خالد</strong><span>البرتقالي</span></div>
              </article>
            </div>

            <section class="xo-challenge" id="xoChallenge" aria-live="polite">
              <div class="xo-challenge-head"><span>🎯 سؤال الدور</span><button class="hear-question" id="xoHearChallenge">🔊 اسمع</button></div>
              <h2 id="xoChallengePrompt">لحظة… نجهز السؤال</h2>
              <div class="xo-challenge-visual" id="xoChallengeVisual"></div>
              <div class="xo-challenge-options" id="xoChallengeOptions"></div>
              <div class="xo-challenge-feedback" id="xoChallengeFeedback" role="status"></div>
            </section>
          </section>
        </div>
      </div>
    </section>`;

  const fragment=document.createDocumentFragment();
  while(shell.firstElementChild)fragment.appendChild(shell.firstElementChild);
  main.appendChild(fragment);
}
