import { MASHAAL_HOME_COPY } from './home-copy.js';

function ensureStyle(href,key){
  if(document.querySelector(`link[data-module-style="${key}"]`))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.moduleStyle=key;document.head.appendChild(link);
}

export function ensureMashaalShell(){
  const main=document.querySelector('main');
  if(!main||document.getElementById('mashaalHomeView'))return;
  ensureStyle('src/modules/mashaal/ui/mashaal.css','mashaal');

  const wrapper=document.createElement('div');
  wrapper.innerHTML=`
    <section id="mashaalHomeView" class="view">
      <div class="mashaal-wrap">
        <header class="mashaal-head">
          <button class="icon-btn" id="mashaalToHub" type="button">${MASHAAL_HOME_COPY.back}</button>
          <div class="mashaal-heading">
            <div class="kicker">${MASHAAL_HOME_COPY.kicker}</div>
            <h2>${MASHAAL_HOME_COPY.title}</h2>
            <p>${MASHAAL_HOME_COPY.subtitle}</p>
          </div>
          <button class="mashaal-hear" id="mashaalHearHome" type="button" aria-label="اسمعي التعليمات">🔊</button>
        </header>
        <div class="mashaal-domain-grid" id="mashaalDomainGrid" aria-label="عوالم تعلم مشاعل"></div>
        <p class="mashaal-safe-note" aria-live="polite" id="mashaalHomeStatus"></p>
      </div>
    </section>

    <section id="mashaalDomainView" class="view">
      <div class="mashaal-wrap mashaal-domain-view">
        <div class="mashaal-domain-actions">
          <button class="icon-btn" id="mashaalDomainBack" type="button">رجوع للعوالم</button>
          <button class="icon-btn" id="mashaalDomainToHub" type="button">اختيار الطفل</button>
        </div>
        <div class="mashaal-domain-focus card">
          <div class="mashaal-domain-symbol" id="mashaalDomainSymbol" aria-hidden="true">✨</div>
          <h2 id="mashaalDomainTitle">عالم مشاعل</h2>
          <button class="mashaal-hear large" id="mashaalHearDomain" type="button" aria-label="اسمعي اسم العالم">🔊 اسمعي</button>
          <p id="mashaalDomainMessage">نجهز ألعاب هذا العالم بعناية.</p>
          <div class="mashaal-coming" aria-label="الأنشطة قيد التجهيز">قريبًا ✨</div>
        </div>
      </div>
    </section>`;

  const fragment=document.createDocumentFragment();
  while(wrapper.firstElementChild)fragment.appendChild(wrapper.firstElementChild);
  main.prepend(fragment);
}
