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
  ensureStyle('src/modules/games/ui/games-open-family.css','games-open-family');

  const hubActions=document.querySelector('#hubView .hub-heading-actions');
  if(hubActions&&!document.getElementById('gamesOpenBtn')){
    const button=document.createElement('button');
    button.className='icon-btn games-open-btn hub-action hub-action-games';
    button.id='gamesOpenBtn';
    button.innerHTML='<span class="hub-action-copy"><strong>الألعاب</strong><small>نلعب سوا</small></span>';
    button.setAttribute('aria-label','فتح منطقة الألعاب العائلية');
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
        <div class="games-filter-note">اختر اللعبة اللي تبغاها وابدأ التحدي ⭐</div>
        <div class="games-grid" id="gamesCatalog"></div>
      </div>
    </section>

    <section id="xoLobbyView" class="view">
      <div class="games-shell xo-lobby-shell">
        <header class="games-header xo-lobby-header">
          <button class="icon-btn" id="xoLobbyBack" data-nav="back">الألعاب</button>
          <div><div class="kicker">إكس أو</div><h1>اختاروا طريقة اللعب</h1><p>على نفس الجهاز أو بين جهازين أونلاين.</p></div>
        </header>

        <div class="xo-lobby-card">
          <section class="xo-local-choice" aria-label="اللعب على نفس الجهاز">
            <div class="xo-local-copy"><strong>على نفس الجهاز</strong><span>اختر لاعبين ثم ابدأ الجولة.</span></div>
            <div class="xo-lobby-players xo-local-players" id="xoLocalPlayers" role="group" aria-label="اختيار لاعبين على هذا الجهاز"></div>
            <button class="btn primary" id="xoLocalStart">ابدأ اللعب</button>
          </section>

          <div class="xo-lobby-divider"><span>أو</span></div>

          <section class="xo-online-choice" aria-label="اللعب أونلاين">
            <div class="xo-lobby-copy"><h2>بين جهازين أونلاين</h2><p>اختر صاحب هذا الجهاز أولًا.</p></div>
            <div class="xo-lobby-players" id="xoOnlinePlayers" role="group" aria-label="اختيار اللاعب لهذا الجهاز"></div>
            <button class="btn secondary xo-create-room" id="xoOnlineCreate">إنشاء غرفة أونلاين</button>

            <div class="xo-room-join">
              <label for="xoRoomCodeInput">أو اكتب رمز الغرفة</label>
              <div><input id="xoRoomCodeInput" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000"><button class="btn secondary" id="xoOnlineJoin">دخول</button></div>
            </div>
          </section>

          <div class="xo-room-code-box" id="xoRoomCodeBox" hidden><span>رمز الغرفة</span><strong id="xoRoomCode">------</strong><small>افتح التطبيق في الجهاز الثاني واكتب هذا الرمز.</small></div>
          <div class="xo-lobby-status" id="xoLobbyStatus" role="status" aria-live="polite"></div>
        </div>
      </div>
    </section>

    <section id="xoGameView" class="view">
      <div class="games-shell xo-shell">
        <header class="games-header xo-header">
          <button class="icon-btn" id="xoBackToGames" data-nav="back">الألعاب</button>
          <div><div class="kicker">إكس أو التعليمية</div><h1 id="xoMatchTitle">إكس أو</h1><p id="xoModeLabel">نسخة محلية — جهاز واحد</p></div>
          <button class="btn secondary xo-reset" id="xoReset">جولة جديدة</button>
        </header>

        <div class="xo-layout">
          <section class="xo-board-panel" aria-label="لوحة اللعب">
            <div class="xo-board locked" id="xoBoard" role="grid" aria-label="لوحة إكس أو"></div>
          </section>

          <section class="xo-play-panel" aria-label="الدور والسؤال">
            <div class="xo-player-strip" aria-label="اللاعبون">
              <article class="xo-player-card" id="xoPlayerA" data-xo-player-slot="0">
                <div class="xo-player-avatar" id="xoPlayerAAvatar"></div>
                <div><strong id="xoPlayerAName">اللاعب الأول</strong><span>اللاعب الأول</span></div>
              </article>
              <div class="xo-turn-panel" role="status" aria-live="polite">
                <small>الدور الآن</small>
                <strong id="xoTurnName">—</strong>
                <span id="xoStatusText">جاوب ثم اختر مربعًا</span>
              </div>
              <article class="xo-player-card" id="xoPlayerB" data-xo-player-slot="1">
                <div class="xo-player-avatar" id="xoPlayerBAvatar"></div>
                <div><strong id="xoPlayerBName">اللاعب الثاني</strong><span>اللاعب الثاني</span></div>
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
