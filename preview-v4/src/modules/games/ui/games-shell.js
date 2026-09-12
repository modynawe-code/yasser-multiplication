function ensureStyle(href,key){
  if(document.querySelector(`link[data-module-style="${key}"]`))return;
  const link=document.createElement('link');
  link.rel='stylesheet';link.href=href;link.dataset.moduleStyle=key;document.head.appendChild(link);
}

function bindXoLobbyModeSwitch(){
  const card=document.querySelector('#xoLobbyView .xo-lobby-card');
  if(!card||card.dataset.modeSwitchBound==='true')return;
  card.dataset.modeSwitchBound='true';
  const buttons=[...card.querySelectorAll('[data-xo-lobby-mode-button]')];
  const panels=[...card.querySelectorAll('[data-xo-lobby-panel]')];
  const status=card.querySelector('#xoLobbyStatus');
  const codeBox=card.querySelector('#xoRoomCodeBox');
  const setMode=(mode,{clearStatus=false}={})=>{
    const next=mode==='online'?'online':'local';
    card.dataset.xoLobbyMode=next;
    buttons.forEach(button=>{
      const active=button.dataset.xoLobbyModeButton===next;
      button.classList.toggle('active',active);
      button.setAttribute('aria-selected',active?'true':'false');
      button.tabIndex=active?0:-1;
    });
    panels.forEach(panel=>{panel.hidden=panel.dataset.xoLobbyPanel!==next;});
    if(clearStatus&&status)status.textContent='';
  };
  buttons.forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.xoLobbyModeButton,{clearStatus:true})));
  if(codeBox){
    const observer=new MutationObserver(()=>{if(!codeBox.hidden)setMode('online');});
    observer.observe(codeBox,{attributes:true,attributeFilter:['hidden']});
  }
  setMode(card.dataset.xoLobbyMode||'local');
}

export function ensureGamesShell(){
  if(document.getElementById('gamesHomeView'))return;
  const main=document.querySelector('main');
  if(!main)return;

  ensureStyle('src/modules/games/ui/games.css','games-platform');
  ensureStyle('src/modules/games/ui/games-open-family.css','games-open-family');
  ensureStyle('src/modules/games/ui/xo-final-polish.css','xo-final-polish');

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
          <div><div class="kicker">إكس أو</div><h1>اختاروا طريقة اللعب</h1><p>مسار واحد واضح في كل مرة.</p></div>
        </header>

        <div class="xo-lobby-card" data-xo-lobby-mode="local">
          <div class="xo-mode-switch" role="tablist" aria-label="طريقة لعب إكس أو">
            <button type="button" class="xo-mode-tab active" data-xo-lobby-mode-button="local" role="tab" aria-selected="true"><strong>على نفس الجهاز</strong><small>لاعبان جنب بعض</small></button>
            <button type="button" class="xo-mode-tab" data-xo-lobby-mode-button="online" role="tab" aria-selected="false" tabindex="-1"><strong>أونلاين</strong><small>بين جهازين</small></button>
          </div>

          <section class="xo-mode-panel xo-local-choice" data-xo-lobby-panel="local" aria-label="اللعب على نفس الجهاز">
            <div class="xo-local-copy"><strong>اختاروا لاعبين</strong><span>كل لاعب يجاوب سؤال دوره ثم يختار مكانه.</span></div>
            <div class="xo-lobby-players xo-local-players" id="xoLocalPlayers" role="group" aria-label="اختيار لاعبين على هذا الجهاز"></div>
            <button class="btn primary xo-local-start" id="xoLocalStart">ابدأ الجولة</button>
          </section>

          <section class="xo-mode-panel xo-online-choice" data-xo-lobby-panel="online" aria-label="اللعب أونلاين" hidden>
            <div class="xo-lobby-copy"><h2>مين يلعب من هذا الجهاز؟</h2><p>اختر الطفل أولًا، وبعدها أنشئ غرفة أو ادخل برمز.</p></div>
            <div class="xo-lobby-players" id="xoOnlinePlayers" role="group" aria-label="اختيار اللاعب لهذا الجهاز"></div>
            <div class="xo-online-actions">
              <button class="btn primary xo-create-room" id="xoOnlineCreate">إنشاء غرفة جديدة</button>
              <div class="xo-room-join">
                <label for="xoRoomCodeInput">عندك رمز غرفة؟</label>
                <div><input id="xoRoomCodeInput" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000" aria-label="رمز الغرفة المكوّن من ستة أرقام"><button class="btn secondary" id="xoOnlineJoin">انضمام</button></div>
              </div>
            </div>
            <div class="xo-room-code-box" id="xoRoomCodeBox" hidden><span>رمز الغرفة</span><strong id="xoRoomCode">------</strong><small>اكتب هذا الرمز في الجهاز الثاني.</small></div>
          </section>

          <div class="xo-lobby-status" id="xoLobbyStatus" role="status" aria-live="polite"></div>
        </div>
      </div>
    </section>

    <section id="xoGameView" class="view">
      <div class="games-shell xo-shell">
        <header class="games-header xo-header">
          <button class="icon-btn" id="xoBackToGames" data-nav="back">الألعاب</button>
          <div class="xo-match-heading"><div class="kicker">إكس أو التعليمية</div><h1 id="xoMatchTitle">إكس أو</h1><div class="xo-match-meta-row"><p id="xoModeLabel">نسخة محلية — جهاز واحد</p><button class="btn secondary xo-reset" id="xoReset">جولة جديدة</button></div></div>
        </header>

        <div class="xo-layout">
          <section class="xo-board-panel" aria-label="لوحة اللعب">
            <div class="xo-board locked" id="xoBoard" role="grid" aria-label="لوحة إكس أو"></div>
          </section>

          <section class="xo-play-panel" aria-label="الدور والسؤال">
            <div class="xo-player-strip" aria-label="اللاعبون">
              <div class="xo-turn-panel" role="status" aria-live="polite">
                <small>الدور الآن</small>
                <strong id="xoTurnName">—</strong>
                <span id="xoStatusText">جاوب السؤال أولًا</span>
              </div>
              <article class="xo-player-card" id="xoPlayerA" data-xo-player-slot="0">
                <div class="xo-player-avatar" id="xoPlayerAAvatar"></div>
                <div><strong id="xoPlayerAName">اللاعب الأول</strong><span>اللاعب الأول</span></div>
              </article>
              <article class="xo-player-card" id="xoPlayerB" data-xo-player-slot="1">
                <div class="xo-player-avatar" id="xoPlayerBAvatar"></div>
                <div><strong id="xoPlayerBName">اللاعب الثاني</strong><span>اللاعب الثاني</span></div>
              </article>
            </div>

            <section class="xo-challenge" id="xoChallenge" aria-live="polite">
              <div class="xo-challenge-head"><span class="xo-challenge-label">سؤال الدور</span><button class="hear-question" id="xoHearChallenge"><span class="learning-speaker-mark" aria-hidden="true"><i></i></span><span>اسمع</span></button></div>
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
  bindXoLobbyModeSwitch();
}
