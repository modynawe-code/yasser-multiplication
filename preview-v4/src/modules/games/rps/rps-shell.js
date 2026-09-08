import { rpsChoiceGraphic } from './rps-graphics.js';

function ensureStyle(href,key){
  if(document.querySelector(`link[data-module-style="${key}"]`))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.moduleStyle=key;document.head.appendChild(link);
}

export function ensureRpsShell(){
  if(document.getElementById('rpsGameView'))return;
  const main=document.querySelector('main');if(!main)return;
  ensureStyle('src/modules/games/rps/rps.css','rps-game');
  ensureStyle('src/modules/games/rps/rps-open-family.css','rps-open-family');
  const host=document.createElement('div');
  host.innerHTML=`
    <section id="rpsGameView" class="view">
      <div class="rps-shell">
        <p class="rps-rules">حجر ورق مقص — أول لاعب يجمع 3 نقاط يفوز بالمباراة.</p>

        <header class="rps-hud">
          <button class="rps-hud-btn" id="rpsBackToGames" data-nav="back" aria-label="رجوع إلى قائمة الألعاب">↩ رجوع للألعاب</button>

          <div class="rps-scoreboard" aria-label="النتيجة">
            <article class="rps-score-card" id="rpsScoreCardA" data-rps-player-slot="0">
              <span class="rps-score-avatar" id="rpsScoreAvatarA" aria-hidden="true"></span>
              <div class="rps-score-copy"><strong id="rpsScoreNameA">اللاعب الأول</strong><span class="rps-score-number" id="rpsScoreA">0</span><div class="rps-score-pips" id="rpsPipsA" aria-hidden="true"><i></i><i></i><i></i></div></div>
            </article>
            <div class="rps-round-chip"><small>الجولة</small><strong id="rpsRoundNumber">1</strong></div>
            <article class="rps-score-card" id="rpsScoreCardB" data-rps-player-slot="1">
              <span class="rps-score-avatar" id="rpsScoreAvatarB" aria-hidden="true"></span>
              <div class="rps-score-copy"><strong id="rpsScoreNameB">اللاعب الثاني</strong><span class="rps-score-number" id="rpsScoreB">0</span><div class="rps-score-pips" id="rpsPipsB" aria-hidden="true"><i></i><i></i><i></i></div></div>
            </article>
          </div>

          <button class="rps-hud-btn" id="rpsResetMatch">مباراة جديدة</button>
        </header>

        <section class="rps-stage" id="rpsStage" data-state="setup" aria-live="polite">
          <div class="rps-arena-grid" aria-hidden="true"></div>
          <div class="rps-arena-glow" aria-hidden="true"></div>

          <div class="rps-setup" id="rpsSetup">
            <div class="rps-setup-copy"><span>حجر • ورق • مقص</span><h2>مين بيلعب؟</h2><p>اختر لاعبين من العائلة، ثم ابدأ المباراة.</p></div>
            <div class="rps-player-picker" id="rpsPlayerPicker" role="group" aria-label="اختيار لاعبين"></div>
            <button class="rps-action-btn" id="rpsStartMatch">ابدأ المباراة</button>
          </div>

          <div class="rps-intro" id="rpsIntro" hidden>
            <div class="rps-intro-player" id="rpsIntroPlayerA"><span class="rps-player-visual" id="rpsIntroAvatarA" aria-hidden="true"></span><strong id="rpsIntroNameA">اللاعب الأول</strong></div>
            <div class="rps-intro-vs"><span>VS</span><small>أول واحد يوصل 3</small></div>
            <div class="rps-intro-player" id="rpsIntroPlayerB"><span class="rps-player-visual" id="rpsIntroAvatarB" aria-hidden="true"></span><strong id="rpsIntroNameB">اللاعب الثاني</strong></div>
          </div>

          <div class="rps-turn" id="rpsTurn" hidden>
            <div class="rps-turn-player">
              <span class="rps-current-avatar" id="rpsCurrentAvatar" aria-hidden="true"></span>
              <div class="rps-player-now" id="rpsPlayerNow"></div>
            </div>
            <div class="rps-turn-action">
              <h2 id="rpsPrompt">اختر حركتك</h2>
              <div class="rps-chant" id="rpsChant" aria-hidden="true"><span>حجر</span><b>•</b><span>ورق</span><b>•</b><span>مقص!</span></div>
              <div class="rps-choice-grid" id="rpsChoices">
                <button class="rps-choice" data-rps-choice="rock" aria-label="اختيار حجر"><span class="rps-choice-art">${rpsChoiceGraphic('rock')}</span><strong>حجر</strong></button>
                <button class="rps-choice" data-rps-choice="paper" aria-label="اختيار ورق"><span class="rps-choice-art">${rpsChoiceGraphic('paper')}</span><strong>ورق</strong></button>
                <button class="rps-choice" data-rps-choice="scissors" aria-label="اختيار مقص"><span class="rps-choice-art">${rpsChoiceGraphic('scissors')}</span><strong>مقص</strong></button>
              </div>
            </div>
          </div>

          <div class="rps-handoff" id="rpsHandoff" hidden>
            <div class="rps-handoff-visual">
              <div class="rps-handoff-orbit" aria-hidden="true"></div>
              <span class="rps-handoff-avatar" id="rpsHandoffAvatar" aria-hidden="true"></span>
            </div>
            <div class="rps-handoff-copy">
              <div class="rps-player-now" id="rpsHandoffPlayer"></div>
              <h2 id="rpsHandoffTitle">مرّر الجهاز للاعب الثاني</h2>
              <p>الاختيار الأول مخفي — لا تطالع.</p>
              <button class="rps-ready-btn" id="rpsHandoffContinue">أنا جاهز</button>
            </div>
          </div>

          <div class="rps-reveal" id="rpsReveal" hidden>
            <div class="rps-battle">
              <article class="rps-battle-side" id="rpsRevealSideA" data-rps-player-slot="0">
                <span class="rps-battle-avatar" id="rpsRevealAvatarA" aria-hidden="true"></span><strong id="rpsRevealNameA">اللاعب الأول</strong>
                <span class="rps-reveal-move" id="rpsRevealA">؟</span>
              </article>
              <div class="rps-impact" aria-hidden="true"><span>VS</span></div>
              <article class="rps-battle-side" id="rpsRevealSideB" data-rps-player-slot="1">
                <span class="rps-battle-avatar" id="rpsRevealAvatarB" aria-hidden="true"></span><strong id="rpsRevealNameB">اللاعب الثاني</strong>
                <span class="rps-reveal-move" id="rpsRevealB">؟</span>
              </article>
            </div>
            <div class="rps-round-result"><h2 id="rpsResultText"></h2><span class="rps-point-pop" id="rpsPointPop"></span></div>
            <button class="rps-action-btn" id="rpsNextRound">الجولة التالية</button>
          </div>

          <div class="rps-finish" id="rpsFinish" hidden>
            <div class="rps-finish-copy">
              <span class="rps-finish-label">بطل المباراة</span>
              <h2 id="rpsFinishTitle"></h2>
              <div class="rps-final-score" id="rpsFinalScore"></div>
              <button class="rps-action-btn" id="rpsPlayAgain">العبوا مرة ثانية</button>
              <button class="rps-action-btn secondary" id="rpsChangePlayers">غيّر اللاعبين</button>
              <button class="rps-action-btn" id="rpsFinishBackToGames">↩ رجوع للألعاب</button>
            </div>
            <div class="rps-finish-art" id="rpsFinishArt"></div>
          </div>
        </section>
      </div>
    </section>`;
  main.appendChild(host.firstElementChild);
}