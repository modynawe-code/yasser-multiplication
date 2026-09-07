import { rpsChoiceGraphic } from './rps-graphics.js';

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
          <div class="rps-title-block"><div class="kicker">حجر ورق مقص</div><h1>ياسر ضد خالد</h1><p>أول لاعب يجمع 3 نقاط يفوز بالمباراة.</p></div>
          <button class="btn secondary" id="rpsResetMatch">مباراة جديدة</button>
        </header>

        <div class="rps-scoreboard" aria-label="النتيجة">
          <article class="rps-score-card yasser" id="rpsScoreCardYasser">
            <img src="assets/visual/original/yasser/welcome.png" alt="">
            <div class="rps-score-copy"><strong>ياسر</strong><span class="rps-score-number" id="rpsScoreYasser">0</span><div class="rps-score-pips" id="rpsPipsYasser" aria-hidden="true"><i></i><i></i><i></i></div></div>
          </article>
          <div class="rps-round-chip"><small>الجولة</small><strong id="rpsRoundNumber">1</strong></div>
          <article class="rps-score-card khaled" id="rpsScoreCardKhaled">
            <img src="assets/visual/original/khaled/khaled-point-thumbsup.png" alt="">
            <div class="rps-score-copy"><strong>خالد</strong><span class="rps-score-number" id="rpsScoreKhaled">0</span><div class="rps-score-pips" id="rpsPipsKhaled" aria-hidden="true"><i></i><i></i><i></i></div></div>
          </article>
        </div>

        <section class="rps-stage" id="rpsStage" data-state="intro" aria-live="polite">
          <div class="rps-arena-glow" aria-hidden="true"></div>

          <div class="rps-intro" id="rpsIntro">
            <div class="rps-intro-player yasser"><img src="assets/visual/original/yasser/welcome.png" alt=""><strong>ياسر</strong></div>
            <div class="rps-intro-vs"><span>VS</span><small>جاهزين؟</small></div>
            <div class="rps-intro-player khaled"><img src="assets/visual/original/khaled/khaled-point-thumbsup.png" alt=""><strong>خالد</strong></div>
          </div>

          <div class="rps-turn" id="rpsTurn" hidden>
            <div class="rps-turn-head">
              <img class="rps-current-avatar" id="rpsCurrentAvatar" src="" alt="">
              <div>
                <div class="rps-player-now" id="rpsPlayerNow"></div>
                <h2 id="rpsPrompt">اختار حركتك</h2>
              </div>
            </div>
            <div class="rps-chant" id="rpsChant" aria-hidden="true"><span>حجر</span><b>•</b><span>ورق</span><b>•</b><span>مقص!</span></div>
            <div class="rps-choice-grid" id="rpsChoices">
              <button class="rps-choice" data-rps-choice="rock" aria-label="اختيار حجر"><span class="rps-choice-art">${rpsChoiceGraphic('rock')}</span><strong>حجر</strong></button>
              <button class="rps-choice" data-rps-choice="paper" aria-label="اختيار ورق"><span class="rps-choice-art">${rpsChoiceGraphic('paper')}</span><strong>ورق</strong></button>
              <button class="rps-choice" data-rps-choice="scissors" aria-label="اختيار مقص"><span class="rps-choice-art">${rpsChoiceGraphic('scissors')}</span><strong>مقص</strong></button>
            </div>
          </div>

          <div class="rps-handoff" id="rpsHandoff" hidden>
            <div class="rps-handoff-orbit" aria-hidden="true"></div>
            <img class="rps-handoff-avatar" id="rpsHandoffAvatar" src="" alt="">
            <div class="rps-player-now" id="rpsHandoffPlayer"></div>
            <h2 id="rpsHandoffTitle">مرّر الجهاز للاعب الثاني</h2>
            <p>اختيار اللاعب الأول مخفي. لا تطالع 👀</p>
            <button class="btn primary rps-ready-btn" id="rpsHandoffContinue">أنا جاهز</button>
          </div>

          <div class="rps-reveal" id="rpsReveal" hidden>
            <div class="rps-battle">
              <article class="rps-battle-side yasser">
                <img src="assets/visual/original/yasser/welcome.png" alt=""><strong>ياسر</strong>
                <span class="rps-reveal-move" id="rpsRevealYasser">؟</span>
              </article>
              <div class="rps-impact" aria-hidden="true"><span>VS</span></div>
              <article class="rps-battle-side khaled">
                <img src="assets/visual/original/khaled/khaled-point-thumbsup.png" alt=""><strong>خالد</strong>
                <span class="rps-reveal-move" id="rpsRevealKhaled">؟</span>
              </article>
            </div>
            <div class="rps-round-result"><h2 id="rpsResultText"></h2><span class="rps-point-pop" id="rpsPointPop"></span></div>
            <button class="btn primary" id="rpsNextRound">الجولة التالية</button>
          </div>

          <div class="rps-finish" id="rpsFinish" hidden>
            <div class="rps-trophy" aria-hidden="true">🏆</div>
            <h2 id="rpsFinishTitle"></h2>
            <div class="rps-final-score" id="rpsFinalScore"></div>
            <div class="rps-finish-art" id="rpsFinishArt"></div>
            <button class="btn primary" id="rpsPlayAgain">العبوا مرة ثانية</button>
          </div>
        </section>
      </div>
    </section>`;
  main.appendChild(host.firstElementChild);
}
