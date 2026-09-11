import { MASHAAL_HOME_COPY } from './home-copy.js';

function ensureStyle(href,key){
  if(document.querySelector(`link[data-module-style="${key}"]`))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.moduleStyle=key;document.head.appendChild(link);
}

const speakerMark='<span class="mashaal-speaker-mark" aria-hidden="true"><i></i></span>';

export function ensureMashaalShell(){
  const main=document.querySelector('main');
  if(!main||document.getElementById('mashaalHomeView'))return;
  ensureStyle('src/modules/mashaal/ui/mashaal.css','mashaal');
  ensureStyle('src/modules/mashaal/ui/mashaal-home.css','mashaal-home');
  ensureStyle('src/modules/mashaal/ui/mashaal-visuals.css','mashaal-visuals');
  ensureStyle('src/modules/mashaal/ui/mashaal-activity-layout.css','mashaal-activity-layout');

  const wrapper=document.createElement('div');
  wrapper.innerHTML=`
    <section id="mashaalHomeView" class="view">
      <div class="mashaal-wrap">
        <header class="mashaal-head mashaal-home-hero" aria-labelledby="mashaalHomeTitle">
          <button class="icon-btn mashaal-home-back" id="mashaalToHub" type="button" aria-label="العودة لاختيار الطفل">${MASHAAL_HOME_COPY.back}</button>
          <div class="mashaal-heading">
            <div class="kicker">${MASHAAL_HOME_COPY.kicker}</div>
            <h2 id="mashaalHomeTitle">${MASHAAL_HOME_COPY.title}</h2>
            <p>${MASHAAL_HOME_COPY.subtitle}</p>
          </div>
          <button class="mashaal-hear mashaal-home-hear" id="mashaalHearHome" type="button" aria-label="اسمعي التعليمات">${speakerMark}<strong>اسمعي</strong></button>
        </header>
        <div class="mashaal-world-prompt" aria-hidden="true"><strong>اختاري عالمك</strong><span>المسي الصورة الكبيرة</span></div>
        <div class="mashaal-domain-grid" id="mashaalDomainGrid" aria-label="عوالم تعلم مشاعل"></div>
        <p class="mashaal-safe-note" aria-live="polite" id="mashaalHomeStatus"></p>
      </div>
    </section>

    <section id="mashaalDomainView" class="view">
      <div class="mashaal-wrap mashaal-domain-view">
        <div class="mashaal-domain-actions">
          <button class="icon-btn" id="mashaalDomainBack" type="button" data-nav="back">رجوع للعوالم</button>
        </div>
        <div class="mashaal-domain-focus card">
          <div class="mashaal-domain-symbol" id="mashaalDomainSymbol" aria-hidden="true"></div>
          <h2 id="mashaalDomainTitle">عالم مشاعل</h2>
          <button class="mashaal-hear large" id="mashaalHearDomain" type="button" aria-label="اسمعي اسم العالم">${speakerMark}<strong>اسمعي</strong></button>
          <p id="mashaalDomainMessage">اختاري صورة نبدأ فيها.</p>
          <div class="mashaal-skill-grid" id="mashaalSkillGrid" aria-label="مهارات هذا العالم"></div>
        </div>
      </div>
    </section>

    <section id="mashaalActivityView" class="view">
      <div class="mashaal-wrap mashaal-activity-view">
        <div class="mashaal-domain-actions">
          <button class="icon-btn" id="mashaalActivityBack" type="button" data-nav="back">رجوع للمهارات</button>
        </div>
        <article class="card mashaal-activity-card">
          <div class="mashaal-activity-topline">
            <span id="mashaalActivitySkill">لعبة مشاعل</span>
            <button class="mashaal-hear" id="mashaalHearActivity" type="button" aria-label="اسمعي السؤال">${speakerMark}</button>
          </div>
          <div class="mashaal-activity-guide" id="mashaalActivityGuide" aria-hidden="true"></div>
          <h2 id="mashaalActivityPrompt">اسمعي ثم اختاري.</h2>
          <div class="mashaal-stimulus" id="mashaalActivityStimulus" aria-hidden="true"></div>
          <div class="mashaal-activity-choices" id="mashaalActivityChoices"></div>
          <button class="btn primary mashaal-check" id="mashaalActivityCheck" type="button" hidden>تحقق</button>
          <div class="mashaal-completion" id="mashaalActivityCompletion" hidden><strong>أنهيتِ النشاط</strong><span>أحسنتِ يا مشاعل</span></div>
          <p class="mashaal-activity-feedback" id="mashaalActivityFeedback" aria-live="polite"></p>
        </article>
      </div>
    </section>`;

  const fragment=document.createDocumentFragment();
  while(wrapper.firstElementChild)fragment.appendChild(wrapper.firstElementChild);
  main.prepend(fragment);
}
