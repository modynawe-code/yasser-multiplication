import { createSpeechService } from '../../../shared/audio/speech-service.js';
import { getMashaalHomeDomains } from './home-view-model.js';

const DOMAIN_SYMBOLS=Object.freeze({
  'language-communication':'أ',
  'cognitive-operations-general-knowledge':'١٢٣',
  'social-emotional-development':'☺',
  'health-physical-development':'✦',
  'quran-islamic-education':'☾',
  'national-social-studies':'🇸🇦'
});

function byId(id){return document.getElementById(id);}
function show(id){document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id===id));window.scrollTo(0,0);}

export function createMashaalController({repository,onExitToHub}={}){
  if(!repository)throw new Error('Mashaal repository is required');
  const speech=createSpeechService();
  let bound=false,currentDomain=null,state=repository.load();

  function renderDomains(){
    const grid=byId('mashaalDomainGrid');if(!grid)return;
    grid.innerHTML='';
    for(const domain of getMashaalHomeDomains()){
      const button=document.createElement('button');
      button.type='button';button.className='mashaal-domain-card';button.dataset.domainId=domain.id;
      const symbol=document.createElement('span');symbol.className='mashaal-domain-card-symbol';symbol.textContent=DOMAIN_SYMBOLS[domain.id]||'★';symbol.setAttribute('aria-hidden','true');
      const title=document.createElement('strong');title.textContent=domain.title;
      button.append(symbol,title);grid.appendChild(button);
    }
  }

  function enter(){
    state=repository.load();
    document.body.classList.remove('hub-mode','intro-mode','khaled-mode','family-parent-mode');
    document.body.classList.add('mashaal-mode');
    renderDomains();show('mashaalHomeView');
  }
  function leave(){speech.stop();document.body.classList.remove('mashaal-mode');}
  function openDomain(domainId){
    currentDomain=getMashaalHomeDomains().find(item=>item.id===domainId)||null;if(!currentDomain)return;
    byId('mashaalDomainSymbol').textContent=DOMAIN_SYMBOLS[currentDomain.id]||'★';
    byId('mashaalDomainTitle').textContent=currentDomain.title;
    byId('mashaalDomainMessage').textContent='نجهز ألعاب هذا العالم بعناية.';
    show('mashaalDomainView');speech.speak(currentDomain.title);
  }
  function backHome(){speech.stop();renderDomains();show('mashaalHomeView');}
  function exit(){leave();onExitToHub?.();}
  function bind(){
    if(bound)return;bound=true;
    byId('mashaalDomainGrid')?.addEventListener('click',event=>{const card=event.target.closest('[data-domain-id]');if(card)openDomain(card.dataset.domainId);});
    byId('mashaalHearHome')?.addEventListener('click',()=>speech.speak('يا مشاعل، اختاري العالم اللي تبين نلعب فيه.'));
    byId('mashaalHearDomain')?.addEventListener('click',()=>currentDomain&&speech.speak(currentDomain.title));
    byId('mashaalDomainBack')?.addEventListener('click',backHome);
    byId('mashaalToHub')?.addEventListener('click',exit);
    byId('mashaalDomainToHub')?.addEventListener('click',exit);
  }
  return Object.freeze({start(){bind();},enter,leave,getState(){return state;}});
}
