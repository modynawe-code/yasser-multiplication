import { mountQuranSurahPlayer } from '../../mashaal/quran/quran-surah-player.js';

const QURAN_SVG_COMMIT='b91d39e1065b57bdda3e94aca8ecf3575e50e1e6';
const AUDIO_BASE='https://cdn.quran.ws/KFGQPC/resources/quran-audios/akhdar-sura/sura';
const SVG_BASE=`https://cdn.jsdelivr.net/gh/quranpedia/quran-svg@${QURAN_SVG_COMMIT}/mushafs/hafs/kfqc/svg`;
const RAW_SVG_BASE=`https://raw.githubusercontent.com/quranpedia/quran-svg/${QURAN_SVG_COMMIT}/mushafs/hafs/kfqc/svg`;
const STORAGE_KEY='family-learning:yasser:quran:v1';
const LEVELS=['جديد','أتدرب','شبه محفوظ','محفوظ'];

const TERM_1=Object.freeze({
  recitation:Object.freeze([
    [38,'ص',453],[37,'الصافات',446],[36,'يس',440],[35,'فاطر',434]
  ]),
  memorization:Object.freeze([[68,'القلم',564,[564,565,566]]])
});
const TERM_2=Object.freeze({
  recitation:Object.freeze([
    [34,'سبأ',428],[33,'الأحزاب',418],[32,'السجدة',415]
  ]),
  memorization:Object.freeze([[67,'الملك',562,[562,563,564]]])
});

function focusRegionFor(surahNumber,pageNumber){
  if(surahNumber===68&&pageNumber===564)return Object.freeze({surahNumber,top:.30,height:.70,labelAr:'سورة القلم'});
  if(surahNumber===68&&pageNumber===566)return Object.freeze({surahNumber,top:0,height:.58,labelAr:'سورة القلم'});
  if(surahNumber===67&&pageNumber===564)return Object.freeze({surahNumber,top:0,height:.30,labelAr:'سورة الملك'});
  return null;
}

function mushafPageFor(surahNumber,pageNumber){
  const focusRegion=focusRegionFor(surahNumber,pageNumber);
  return Object.freeze({
    sourceId:'kfgqpc-hafs-madinah-svg',publisherAr:'مجمع الملك فهد لطباعة المصحف الشريف',
    riwayahAr:'حفص عن عاصم',pageNumber,imagePath:'',
    imageUrl:`${SVG_BASE}/${pageNumber}.svg`,fallbackImageUrls:Object.freeze([`${RAW_SVG_BASE}/${pageNumber}.svg`]),
    distributionCommit:QURAN_SVG_COMMIT,imageAspectRatio:.6272727273,offlineBundled:false,
    ...(focusRegion?{focusRegion}: {})
  });
}

function mediaFor([surahNumber,surahNameAr,pageNumber,pageNumbers=null]){
  const code=String(surahNumber).padStart(3,'0');
  const numbers=Array.isArray(pageNumbers)&&pageNumbers.length?pageNumbers:[pageNumber];
  const mushafPages=Object.freeze(numbers.map(number=>mushafPageFor(surahNumber,number)));
  return Object.freeze({
    surahNumber,surahNameAr,pageNumber,
    audioPath:`${AUDIO_BASE}/10-${code}D00-A02.mp3`,
    mushafPage:mushafPages[0],mushafPages
  });
}

export const YASSER_QURAN_TERMS=Object.freeze({
  1:Object.freeze({recitation:Object.freeze(TERM_1.recitation.map(mediaFor)),memorization:Object.freeze(TERM_1.memorization.map(mediaFor))}),
  2:Object.freeze({recitation:Object.freeze(TERM_2.recitation.map(mediaFor)),memorization:Object.freeze(TERM_2.memorization.map(mediaFor))})
});

let mounted=false,player=null,term=1,mode='recitation',selected=null,selectedPageNumber=null,repeatTarget=3,repeatCount=0;

function storage(){try{return globalThis.localStorage;}catch{return null;}}
function loadProgress(){try{return JSON.parse(storage()?.getItem(STORAGE_KEY)||'{}')||{};}catch{return {};}}
function saveProgress(next){try{storage()?.setItem(STORAGE_KEY,JSON.stringify(next));}catch{}}
function pageKey(item,pageNumber){return `${item.surahNumber}:${pageNumber}`;}
function firstPage(item){return item?.mushafPages?.[0]?.pageNumber||item?.pageNumber||null;}
function levelFor(item,pageNumber=selectedPageNumber||firstPage(item)){
  const progress=loadProgress();
  return progress?.pageLevels?.[pageKey(item,pageNumber)]||progress?.levels?.[String(item.surahNumber)]||LEVELS[0];
}
function saveLast(item,pageNumber,level=levelFor(item,pageNumber)){
  const current=loadProgress();
  saveProgress({...current,last:{surahNumber:item.surahNumber,surahNameAr:item.surahNameAr,pageNumber,level,term,updatedAt:new Date().toISOString()}});
  renderLast();
}
function setLevel(item,pageNumber,level){
  const current=loadProgress();
  const pageLevels={...(current.pageLevels||{}),[pageKey(item,pageNumber)]:level};
  saveProgress({...current,pageLevels,last:{surahNumber:item.surahNumber,surahNameAr:item.surahNameAr,pageNumber,level,term,updatedAt:new Date().toISOString()}});
  renderLast();
}
function completedPages(item){return item.mushafPages.filter(page=>levelFor(item,page.pageNumber)==='محفوظ').length;}
function pageCountLabel(item){const count=item.mushafPages.length;return count===1?`صفحة ${item.pageNumber}`:count===2?'صفحتان':`${count} صفحات`;}

function ensureStyle(){
  if(document.querySelector('link[data-module-style="yasser-quran"]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='src/modules/yasser/quran/yasser-quran.css';link.dataset.moduleStyle='yasser-quran';document.head.appendChild(link);
}
function show(id){document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id===id));window.scrollTo(0,0);}
function destroyPlayer(){if(!player)return;try{player.destroy();}catch{}player=null;}

function ensureShell(){
  if(document.getElementById('yasserQuranView'))return;
  const main=document.querySelector('main');if(!main)return;
  const view=document.createElement('section');view.id='yasserQuranView';view.className='view';
  view.innerHTML=`<div class="yasser-quran-shell">
    <header class="yasser-quran-head">
      <div><div class="kicker">قرآن ياسر</div><h1>التلاوة والحفظ الغيب</h1><p>سادس ابتدائي • التعليم العام</p></div>
      <button class="icon-btn" id="yasserQuranBack" type="button">رجوع</button>
    </header>
    <div class="yasser-quran-tabs" role="group" aria-label="الفصل الدراسي">
      <button type="button" data-yq-term="1" aria-pressed="true">الفصل الأول</button>
      <button type="button" data-yq-term="2" aria-pressed="false">الفصل الثاني</button>
    </div>
    <div class="yasser-quran-modes" role="group" aria-label="نوع الدراسة">
      <button type="button" data-yq-mode="recitation" aria-pressed="true"><strong>التلاوة</strong><span>أقرأ من المصحف وأستمع</span></button>
      <button type="button" data-yq-mode="memorization" aria-pressed="false"><strong>الحفظ غيب</strong><span>أتدرّب صفحة صفحة ثم أخفي المصحف</span></button>
    </div>
    <p class="yasser-quran-last" id="yasserQuranLast">ابدأ أول سورة وسنحفظ آخر موضع لك.</p>
    <div class="yasser-quran-list" id="yasserQuranList"></div>
    <section class="yasser-quran-stage" id="yasserQuranStage" hidden>
      <div class="yasser-quran-stage-head">
        <div><span id="yasserQuranStageMode"></span><h2 id="yasserQuranTitle"></h2></div>
        <div class="yasser-quran-memory-tools" id="yasserQuranMemoryTools" hidden>
          <button type="button" id="yasserQuranBlind">اختبرني غيب</button>
          <label>التكرار <select id="yasserQuranRepeat"><option value="1">مرة</option><option value="3" selected>3 مرات</option><option value="5">5 مرات</option></select></label>
          <button type="button" id="yasserQuranLevel">الحالة: جديد</button>
        </div>
      </div>
      <div id="yasserQuranPlayerHost"></div>
      <p class="yasser-quran-memory-hint" id="yasserQuranMemoryHint" hidden>في وضع الغيب تختفي صفحة المصحف الحالية. اقرأ الصفحة من حفظك، ثم اضغط «أظهر المصحف» للمراجعة.</p>
    </section>
    <p class="yasser-quran-source">التلاوة: إبراهيم الأخضر • حفص عن عاصم • مصحف المدينة</p>
  </div>`;
  main.appendChild(view);
}

function renderLast(){
  const host=document.getElementById('yasserQuranLast');if(!host)return;
  const last=loadProgress().last;
  host.textContent=last?.surahNameAr?`آخر موضع: سورة ${last.surahNameAr}${last.pageNumber?` • صفحة ${last.pageNumber}`:''} • ${last.level}`:'ابدأ أول سورة وسنحفظ آخر موضع لك.';
}
function renderTabs(){
  document.querySelectorAll('[data-yq-term]').forEach(button=>{const active=Number(button.dataset.yqTerm)===term;button.setAttribute('aria-pressed',String(active));button.classList.toggle('active',active);});
  document.querySelectorAll('[data-yq-mode]').forEach(button=>{const active=button.dataset.yqMode===mode;button.setAttribute('aria-pressed',String(active));button.classList.toggle('active',active);});
}
function renderList(){
  const host=document.getElementById('yasserQuranList');if(!host)return;host.innerHTML='';
  const items=YASSER_QURAN_TERMS[term][mode];
  items.forEach(item=>{
    const button=document.createElement('button');button.type='button';button.className='yasser-quran-surah';button.dataset.surah=String(item.surahNumber);
    let badge;
    if(mode==='memorization'){
      const done=completedPages(item),count=item.mushafPages.length;
      badge=`<span class="yasser-quran-level">${done?`${done}/${count} محفوظ`:pageCountLabel(item)}</span>`;
    }else badge=`<span class="yasser-quran-page">${pageCountLabel(item)}</span>`;
    button.innerHTML=`<span class="yasser-quran-number">${item.surahNumber}</span><span class="yasser-quran-name"><strong>سورة ${item.surahNameAr}</strong><small>${mode==='memorization'?'حفظ غيب • صفحة صفحة':'تلاوة'}</small></span>${badge}`;
    button.addEventListener('click',()=>openSurah(item,button));host.appendChild(button);
  });
}
function resetStage(){
  selected=null;selectedPageNumber=null;repeatCount=0;destroyPlayer();
  const stage=document.getElementById('yasserQuranStage');if(stage){stage.hidden=true;stage.classList.remove('blind');}
}
function setTerm(next){const value=Number(next);if(!YASSER_QURAN_TERMS[value]||value===term)return;term=value;resetStage();renderTabs();renderList();}
function setMode(next){if(!['recitation','memorization'].includes(next)||next===mode)return;mode=next;resetStage();renderTabs();renderList();}

function updateLevelButton(){
  const button=document.getElementById('yasserQuranLevel');if(!button||!selected||!selectedPageNumber)return;
  button.textContent=`الحالة: ${levelFor(selected,selectedPageNumber)} • صفحة ${selectedPageNumber}`;
}
function cycleLevel(){
  if(!selected||!selectedPageNumber)return;
  const current=levelFor(selected,selectedPageNumber);const next=LEVELS[(LEVELS.indexOf(current)+1)%LEVELS.length];
  setLevel(selected,selectedPageNumber,next);updateLevelButton();renderList();
}
function toggleBlind(){
  const stage=document.getElementById('yasserQuranStage');const button=document.getElementById('yasserQuranBlind');const hint=document.getElementById('yasserQuranMemoryHint');if(!stage||!button)return;
  const blind=!stage.classList.contains('blind');stage.classList.toggle('blind',blind);button.textContent=blind?'أظهر المصحف':'اختبرني غيب';if(hint)hint.hidden=!blind;
}
function openSurah(item,button){
  destroyPlayer();selected=item;selectedPageNumber=firstPage(item);repeatCount=0;
  document.querySelectorAll('.yasser-quran-surah').forEach(node=>node.classList.toggle('selected',node===button));
  const stage=document.getElementById('yasserQuranStage');const tools=document.getElementById('yasserQuranMemoryTools');const hint=document.getElementById('yasserQuranMemoryHint');if(!stage)return;
  stage.hidden=false;stage.classList.remove('blind');if(hint)hint.hidden=true;
  document.getElementById('yasserQuranStageMode').textContent=mode==='memorization'?'الحفظ غيب • صفحة صفحة':'التلاوة';
  document.getElementById('yasserQuranTitle').textContent=`سورة ${item.surahNameAr}`;
  if(tools)tools.hidden=mode!=='memorization';
  const blind=document.getElementById('yasserQuranBlind');if(blind)blind.textContent='اختبرني غيب';
  updateLevelButton();saveLast(item,selectedPageNumber);
  player=mountQuranSurahPlayer(document.getElementById('yasserQuranPlayerHost'),{
    surahNameAr:item.surahNameAr,surahNumber:item.surahNumber,audioPath:item.audioPath,mushafPage:item.mushafPage,mushafPages:item.mushafPages,retryPlayText:'اضغط تشغيل مرة ثانية',
    onPageChange:({pageNumber})=>{if(!pageNumber)return;selectedPageNumber=pageNumber;updateLevelButton();saveLast(item,pageNumber);},
    onCompleted:()=>{
      if(mode!=='memorization'||repeatTarget<=1)return;
      repeatCount+=1;if(repeatCount<repeatTarget)setTimeout(()=>{void player?.restart?.();},350);
    }
  });
  stage.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
}

function bind(){
  if(mounted)return;mounted=true;
  document.querySelectorAll('[data-yq-term]').forEach(button=>button.addEventListener('click',()=>setTerm(button.dataset.yqTerm)));
  document.querySelectorAll('[data-yq-mode]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.yqMode)));
  document.getElementById('yasserQuranBack')?.addEventListener('click',()=>{destroyPlayer();document.body.classList.remove('yasser-quran-mode');show('homeView');});
  document.getElementById('yasserQuranBlind')?.addEventListener('click',toggleBlind);
  document.getElementById('yasserQuranLevel')?.addEventListener('click',cycleLevel);
  document.getElementById('yasserQuranRepeat')?.addEventListener('change',event=>{repeatTarget=Number(event.target.value)||1;repeatCount=0;});
}

export function openYasserQuran(){
  ensureStyle();ensureShell();bind();renderTabs();renderLast();renderList();
  document.body.classList.remove('intro-mode','hub-mode','khaled-mode','mashaal-mode');document.body.classList.add('yasser-quran-mode');show('yasserQuranView');
}

export function closeYasserQuran(){destroyPlayer();document.body.classList.remove('yasser-quran-mode');}
