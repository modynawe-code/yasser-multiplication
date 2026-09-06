function ensureStyle(href,key){
  if(document.querySelector(`link[data-module-style="${key}"]`))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.moduleStyle=key;document.head.appendChild(link);
}

export function ensureRpsShell(){
  if(document.getElementById('rpsGameView'))return;
  const main=document.querySelector('main');if(!main)return;
  ensureStyle('src/modules/games/rps/rps.css','rps-game');
  const host=document.createElement('div');
  host.innerHTML=`
    <section id="rpsGameView" class="view">
      <div class="games-shell rps-shell">
        <header class="games-header rps-header">
          <button class="icon-btn" id="rpsBackToGames" data-nav="back">الألعاب</button>
          <div><div class="kicker">حجر ورق مقص</div><h1>ياسر ضد خالد</h1><p>لعبة مرح — أول واحد يوصل 3 يفوز.</p></div>
          <button class="btn secondary" id="rpsResetMatch">مباراة جديدة</button>
        </header>

        <div class="rps-scoreboard" aria-label="النتيجة">
          <article class="rps-score-card yasser"><img src="assets/visual/original/yasser/welcome.png" alt=""><div><strong>ياسر</strong><span id="rpsScoreYasser">0</span></div></article>
          <div class="rps-round-chip"><small>الجولة</small><strong id="rpsRoundNumber">1</strong></div>
          <article class="rps-score-card khaled"><img src="assets/visual/original/khaled/khaled-point-thumbsup.png" alt=""><div><strong>خالد</strong><span id="rpsScoreKhaled">0</span></div></article>
        </div>

        <section class="rps-stage" id="rpsStage" aria-live="polite">
          <div class="rps-player-now" id="rpsPlayerNow"></div>
          <h2 id="rpsPrompt">اختار حركتك بسرية</h2>
          <div class="rps-choice-grid" id="rpsChoices">
            <button class="rps-choice" data-rps-choice="rock"><span aria-hidden="true">🪨</span><strong>حجر</strong></button>
            <button class="rps-choice" data-rps-choice="paper"><span aria-hidden="true">📄</span><strong>ورق</strong></button>
            <button class="rps-choice" data-rps-choice="scissors"><span aria-hidden="true">✂️</span><strong>مقص</strong></button>
          </div>
          <div class="rps-handoff" id="rpsHandoff" hidden>
            <div class="rps-handoff-icon">🙈</div>
            <h2 id="rpsHandoffTitle">مرّر الجهاز للاعب الثاني</h2>
            <p>اختيار اللاعب الأول مخفي.</p>
            <button class="btn primary" id="rpsHandoffContinue">جاهز</button>
          </div>
          <div class="rps-reveal" id="rpsReveal" hidden>
            <div class="rps-reveal-cards">
              <article class="rps-reveal-card yasser"><img src="assets/visual/original/yasser/welcome.png" alt=""><strong>ياسر</strong><span id="rpsRevealYasser">؟</span></article>
              <div class="rps-versus">ضد</div>
              <article class="rps-reveal-card khaled"><img src="assets/visual/original/khaled/khaled-point-thumbsup.png" alt=""><strong>خالد</strong><span id="rpsRevealKhaled">؟</span></article>
            </div>
            <h2 id="rpsResultText"></h2>
            <button class="btn primary" id="rpsNextRound">الجولة التالية</button>
          </div>
          <div class="rps-finish" id="rpsFinish" hidden>
            <h2 id="rpsFinishTitle"></h2>
            <div class="rps-finish-art" id="rpsFinishArt"></div>
            <button class="btn primary" id="rpsPlayAgain">العبوا مرة ثانية</button>
          </div>
        </section>
      </div>
    </section>`;
  main.appendChild(host.firstElementChild);
}
