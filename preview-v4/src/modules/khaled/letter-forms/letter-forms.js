import {LETTERS,FORM_LABELS,availableForms,examplesFor,formText,loadProgress,STORAGE_KEY} from './letter-data.js';
import {writingPaths} from './writing-paths.js';
import {mountTracing} from './tracing.js';
import {createLetterLessonAudio} from './lesson-audio.js';

const rootPath='src/modules/khaled/letter-forms/';
const stages=['أشكال الحرف','الاتصال','اختر الشكل','اكتب الحرف'];
const icon='assets/images/khaled/letter-forms/avatar-block.webp';
const videoStillRoot='assets/images/khaled/letter-forms/video/';
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hand=(connected,side)=>`<span class="lf-hand ${connected?'open':'closed'} ${side}" aria-hidden="true"></span>`;
function glyph(letter,form){return `<svg viewBox="0 0 500 340" class="lf-glyph" aria-hidden="true">${writingPaths(letter.char,form).map(d=>`<path d="${d}"/>`).join('')}</svg>`;}
export function createLetterFormsController({showView,onBack}){
 const audio=createLetterLessonAudio();
 let view,progress,letter=LETTERS[0],stage=0,form='isolated',tracing=null,mode='guided',question=null,answered=false,attempts=0;
 let saveFailed=false;
 try{progress=loadProgress(localStorage);}catch{progress=loadProgress({getItem:()=>null});}
 function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(progress));saveFailed=false;}catch{saveFailed=true;}if(view?.querySelector('.lf-save-status'))view.querySelector('.lf-save-status').textContent=saveFailed?'تعذر الحفظ على هذا الجهاز. أبقِ النشاط مفتوحًا.':'تقدم خالد محفوظ على هذا الجهاز';}
 function dispose(){tracing?.destroy();tracing=null;}
 function record(kind,key){
  const p=progress.letters[letter.char]||={};p[kind]||={};p[kind][key]=true;save();
 }
 function shell(content){
  view.innerHTML=`<div class="lf-shell"><header class="lf-header"><button type="button" data-action="back">العودة إلى لغتي</button><div><small>مغامرة خالد · عالم الحروف</small><h1 tabindex="-1">تحدّي أشكال الحروف وكتابتها</h1></div><img src="${icon}" width="72" height="96" alt="خالد يشجعك" class="lf-avatar"></header>${content}<p class="lf-save-status" role="status">${saveFailed?'تعذر الحفظ على هذا الجهاز':'تقدم خالد محفوظ على هذا الجهاز'}</p></div>`;
 }
 function picker(){
  dispose();
  view.classList.remove('lf-writing-active');
  shell(`<div class="lf-intro"><div><h2>كل حرف… وله أشكاله</h2><p>شوف كيف يتصل، ثم جرّب تكتبه.</p><button class="lf-primary" data-action="resume" type="button">أكمل حرف ${safe(progress.last)}</button></div><span class="lf-intro-letter" aria-hidden="true">أبـ</span></div><div class="lf-letter-grid" aria-label="اختر الحرف">${LETTERS.map(l=>{const p=progress.letters[l.char],count=Object.keys(p?.writing||{}).length,total=availableForms(l).length;return `<button type="button" data-letter="${l.char}" aria-label="حرف ${l.name}، ${count===total?'أكمل التتبع':p?'يتدرب':'لم يبدأ'}"><strong>${l.char}</strong><span>${l.name}</span><small>${count===total?'أكمل التتبع':p?'يتدرّب':'ابدأ'}</small></button>`;}).join('')}</div>`);
 }
 function openLetter(char,resume=false){
  letter=LETTERS.find(l=>l.char===char)||LETTERS[0];progress.last=letter.char;
  progress.letters[letter.char]||={};stage=0;form='isolated';mode='guided';question=null;exampleIndex=null;
  const last=progress.lesson;
  if(resume&&last?.char===letter.char){stage=[0,1,2,3].includes(last.stage)?last.stage:0;form=availableForms(letter).includes(last.form)?last.form:'isolated';mode=last.mode==='free'?'free':'guided';}
  save();render();void audio.playLetter(letter.audio);
 }
 function formButtons(){return `<div class="lf-form-tabs" aria-label="أشكال الحرف">${availableForms(letter).map(f=>`<button type="button" data-form="${f}" aria-pressed="${form===f}"><span dir="rtl">${formText(letter.char,f)}</span><small>${FORM_LABELS[f]}</small></button>`).join('')}</div>`;}
 function example(){return examplesFor(letter).find(e=>e.form===form);}
 function wordMarkup(e){
  // One continuous text node preserves Arabic shaping; CSS highlight uses Range paint.
  return `<strong class="lf-example-word" data-index="${e.index}">${e.word}</strong><span>${e.position} · ${FORM_LABELS[e.form]}</span>`;
 }
 function videoExample(currentLetter){const word=currentLetter.videoWord||currentLetter.words[0],index=Array.from(word).indexOf(currentLetter.char);return `<aside class="lf-video-example"><p>مهمة العالم: شاهد واسمع المثال نفسه</p><strong class="lf-video-word lf-example-word" data-index="${index}" lang="ar">${safe(word)}</strong><img src="${videoStillRoot}${currentLetter.audio}.jpg" alt="مثال ${safe(word)} لحرف ${currentLetter.name} من الفيديو" loading="lazy"><button type="button" class="lf-video-play" data-action="play-letter-explanation" aria-label="اسمع شرح مثال ${safe(word)}">▶ اسمع شرح «${safe(word)}»</button><small>الصورة والتسجيل لهذا المثال من المقطع نفسه.</small><p class="lf-audio-status" role="status" aria-live="polite"></p></aside>`;}
 function formsPanel(){return `<section class="lf-model"><div class="lf-quest-label"><span>جزيرة ${letter.name}</span><span>المرحلة ${stage+1} / 4</span></div><h2>حرف ${letter.name}</h2>${formButtons()}<div class="lf-reference">${hand(form==='final'||form==='medial','right')}${glyph(letter,form)}${hand(form==='initial'||form==='medial','left')}</div><p class="lf-help">اليد المفتوحة تعني اتصالًا في هذا الشكل، والمغلقة تعني انفصالًا.</p><p>${letter.dual?'قد يتصل من الجهتين؛ حسب الحرفين المجاورين.':'يتصل بما قبله إذا سمح الحرف السابق، ولا يتصل بما بعده.'}</p><div class="lf-audio-actions"><button type="button" data-action="play-letter" aria-label="إعادة نطق حرف ${letter.name}">اسمع صوت الحرف</button></div><small class="lf-audio-credit">تسجيل نطق الحرف: وزارة الأوقاف والشؤون الإسلامية بدولة قطر</small>${videoExample(letter)}</section>`;}
 function connectionsPanel(){
  const examples=examplesFor(letter),e=examples.find(e=>e.form===form)||examples[0];
  return `<section class="lf-model"><div class="lf-quest-label"><span>تحدي الاتصال</span><span>المرحلة ${stage+1} / 4</span></div><h2>وين يتصل حرف ${letter.name}؟</h2><div class="lf-example-tabs">${examples.map((item,i)=>`<button type="button" data-example="${i}" aria-pressed="${item===e}">${item.word}</button>`).join('')}</div><div class="lf-reference">${hand(e.before,'right')}${glyph(letter,e.form)}${hand(e.after,'left')}</div><div class="lf-example">${wordMarkup(e)}</div><div class="lf-connection-labels"><span>${e.before?'يتصل بالحرف السابق':'منفصل عن السابق'}</span><span>${e.after?'يتصل بالحرف التالي':'منفصل عن التالي'}</span></div><p class="lf-help">نقرأ ونكتب من اليمين إلى اليسار. مكان الحرف وحده ما يحدد اتصاله.</p></section>`;
 }
 let exampleIndex=null;
 function questionPanel(){
  if(!question){const list=examplesFor(letter),previous=progress.letters[letter.char].lastQuestion??-1;question=list[(previous+1)%list.length];progress.letters[letter.char].lastQuestion=(previous+1)%list.length;save();answered=false;attempts=0;}
  const opts=availableForms(letter).map(f=>({f,order:Math.random()})).sort((a,b)=>a.order-b.order);
  return `<section class="lf-model"><div class="lf-quest-label"><span>بوابة الاختيار</span><span>المرحلة ${stage+1} / 4</span></div><h2>اختر شكل ${letter.char} في هذه الكلمة</h2><div class="lf-example">${wordMarkup(question)}</div><p>انتبه للحرف اللي قبله واللي بعده.</p><button type="button" data-action="play-narration" data-line="question">اسمع الشرح</button><p class="lf-audio-status" role="status" aria-live="polite"></p><div class="lf-choices">${opts.map(({f})=>`<button type="button" data-answer="${f}" aria-label="${FORM_LABELS[f]}">${glyph(letter,f)}</button>`).join('')}</div><p class="lf-feedback" role="status">اختر الشكل المناسب.</p><button data-action="next-question" type="button" hidden>كلمة ثانية</button></section>`;
 }
 function writingPanel(){return `<section class="lf-model lf-writing"><div class="lf-quest-label"><span>منصة الكتابة</span><span>المرحلة ${stage+1} / 4</span></div><h2>اكتب ${letter.char} · ${FORM_LABELS[form]}</h2>${formButtons()}<button type="button" data-action="play-narration" data-line="writing">اسمع الشرح</button><p class="lf-audio-status" role="status" aria-live="polite"></p><div class="lf-writing-controls"><button type="button" data-mode="guided" aria-pressed="${mode==='guided'}">أتتبع</button><button type="button" data-mode="free" aria-pressed="${mode==='free'}">أكتب بنفسي</button><button type="button" data-action="demo">شاهد الكتابة</button><button type="button" data-action="clear">امسح</button></div><p class="lf-feedback" role="status">${mode==='guided'?'ابدأ من الدائرة واتبع المسار. ارفع إصبعك بين أجزاء الحرف.':'اكتب وقارن بالنموذج؛ الكتابة الحرة لا تحصل على حكم آلي.'}</p><div class="lf-tracing-host"></div><div class="lf-writing-footer"><label><input type="checkbox" data-action="guide" checked> إظهار النموذج</label><span>الأرقام لترتيب أجزاء الكتابة · الخط الداكن هو السطر</span></div></section>`;}
 function render(){
  audio.stop();
  const active=document.activeElement;
  const focusAttribute=['data-form','data-stage','data-example','data-mode'].find(a=>active?.hasAttribute(a));
  const focusValue=focusAttribute?active.getAttribute(focusAttribute):null;
  dispose();
  view.classList.toggle('lf-writing-active',stage===3);
  progress.lesson={char:letter.char,stage,form,mode};save();
  shell(`<div class="lf-lesson-heading"><button type="button" data-action="letters">خريطة الحروف</button><h2>حرف ${letter.name}</h2><span class="lf-level-chip">المستوى ${LETTERS.indexOf(letter)+1} / 28</span></div><nav class="lf-stage-tabs" aria-label="خطوات التدريب">${stages.map((s,i)=>`<button type="button" data-stage="${i}" aria-current="${stage===i?'step':'false'}"><b>${i+1}</b>${s}</button>`).join('')}</nav>${[formsPanel,connectionsPanel,questionPanel,writingPanel][stage]()}<div class="lf-navigation"><button type="button" data-action="previous" ${stage===0?'disabled':''}>السابق</button><span>مهمة ${stage+1} من 4</span><button type="button" class="lf-primary" data-action="next">${stage===3?'الحرف التالي':'التالي'}</button></div>`);
  if(stage===1&&exampleIndex!==null){const e=examplesFor(letter)[exampleIndex];if(e){view.querySelector('.lf-reference').innerHTML=hand(e.before,'right')+glyph(letter,e.form)+hand(e.after,'left');view.querySelector('.lf-example').innerHTML=wordMarkup(e);const labels=view.querySelectorAll('.lf-connection-labels span');labels[0].textContent=e.before?'يتصل بالحرف السابق':'منفصل عن السابق';labels[1].textContent=e.after?'يتصل بالحرف التالي':'منفصل عن التالي';view.querySelectorAll('[data-example]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.example)===exampleIndex)));}}
  if(stage===3){
   const key=`${letter.char}:${form}:${mode}`;
   tracing=mountTracing(view.querySelector('.lf-tracing-host'),{paths:writingPaths(letter.char,form),mode,draft:progress.drafts[key],onSave:d=>{progress.drafts[key]=d;save();},onComplete:()=>{record('writing',form);const complete=Object.keys(progress.letters[letter.char]?.writing||{}).length===availableForms(letter).length;view.querySelector('.lf-model')?.classList.add('is-winning');view.querySelector('.lf-avatar')?.classList.add('lf-avatar-cheer');if(complete)void audio.respond('achievement','complete');else audio.playFeedback('correct');view.querySelector('.lf-feedback').textContent=complete?`رائع! أكملت أشكال حرف ${letter.name}.`:'أبدعت يا بطل! أكملت تتبع هذا الشكل؛ جرّب كتابته بنفسك.';}});
  }
  highlightWords();
  if(focusAttribute)view.querySelector(`[${focusAttribute}="${focusValue}"]`)?.focus({preventScroll:true});
 }
 function highlightWords(){
  if(!globalThis.CSS?.highlights||!globalThis.Highlight)return;
  const ranges=[];
  view.querySelectorAll('.lf-example-word').forEach(n=>{const range=new Range();const i=Number(n.dataset.index);range.setStart(n.firstChild,i);range.setEnd(n.firstChild,i+1);ranges.push(range);});
  CSS.highlights.set('khaled-letter-focus',new Highlight(...ranges));
 }
 function feedback(text){view.querySelector('.lf-feedback').textContent=text;}
 function click(event){
  const b=event.target.closest('button,input');if(!b||!view.contains(b))return;
  if(b.dataset.letter){openLetter(b.dataset.letter);return;}
  if(b.dataset.stage!==undefined){stage=Number(b.dataset.stage);question=null;exampleIndex=null;render();return;}
  if(b.dataset.form){form=b.dataset.form;exampleIndex=null;render();return;}
  if(b.dataset.example!==undefined){exampleIndex=Number(b.dataset.example);render();return;}
  if(b.dataset.mode){mode=b.dataset.mode;render();return;}
  if(b.dataset.answer){
   if(answered)return;attempts++;
   if(b.dataset.answer===question.form){answered=true;record(attempts===1?'independent':'assisted',`${question.word}:${question.index}`);b.classList.add('lf-correct');view.querySelector('.lf-model')?.classList.add('is-winning');view.querySelector('.lf-avatar')?.classList.add('lf-avatar-cheer');void audio.respond('correct','correct');feedback('رائع يا خالد! فتحت بوابة الحرف بإجابة صحيحة!');view.querySelector('[data-action="next-question"]').hidden=false;}
   else{b.classList.add('lf-retry');b.setAttribute('aria-pressed','false');view.querySelector('.lf-model')?.classList.add('is-bumping');void audio.respond('wrong','retry');feedback(`جرّب من جديد يا بطل: ${question.before?'يتصل بما قبله':'ينفصل عمّا قبله'}، و${question.after?'يتصل بما بعده':'ينفصل عمّا بعده'}.`);}
   return;
  }
  switch(b.dataset.action){
   case 'back':audio.stop();dispose();onBack();break;
   case 'letters':audio.stop();picker();break;
   case 'resume':openLetter(progress.last,true);break;
   case 'next':if(stage===3){openLetter(LETTERS[(LETTERS.indexOf(letter)+1)%LETTERS.length].char);}else{stage++;question=null;exampleIndex=null;render();}break;
   case 'previous':stage=Math.max(0,stage-1);question=null;exampleIndex=null;render();break;
   case 'next-question':question=null;render();break;
   case 'demo':tracing?.demo();break;
   case 'clear':tracing?.clear();feedback(mode==='guided'?'ابدأ من الدائرة واتبع المسار.':'اكتب وقارن بالنموذج.');break;
   case 'play-letter':void audio.playLetter(letter.audio);break;
   case 'play-letter-explanation':{const status=b.closest('.lf-model')?.querySelector('.lf-audio-status');if(status)status.textContent='جارٍ تشغيل شرح الحرف المسجل…';void audio.playLetterExplanation(letter.audio).then(played=>{if(status?.isConnected)status.textContent=played?'انتهى شرح الحرف.':'تعذر تشغيل تسجيل هذا الحرف.';});break;}
   case 'play-narration':{const status=b.closest('.lf-model')?.querySelector('.lf-audio-status');if(status)status.textContent='جارٍ تشغيل الشرح المسجل…';void audio.playNarration(b.dataset.line).then(played=>{if(status?.isConnected)status.textContent=played?'انتهى الشرح المسجل.':'تسجيل الشرح البشري غير متوفر بعد.';});break;}
   case 'guide':tracing?.showGuide(b.checked);break;
  }
 }
 return {open(){
  if(!document.querySelector('link[data-module-style="letter-forms"]')){const l=document.createElement('link');l.rel='stylesheet';l.href=rootPath+'letter-forms.css';l.dataset.moduleStyle='letter-forms';document.head.append(l);}
  if(!view){view=document.createElement('section');view.id='khaledLetterFormsView';view.className='view lf-view';view.dir='rtl';document.querySelector('main').append(view);view.addEventListener('click',click);window.addEventListener('pagehide',()=>{audio.stop();tracing?.save();save();});document.addEventListener('visibilitychange',()=>{if(document.hidden){audio.stop();tracing?.save();save();}});}
  picker();showView('khaledLetterFormsView');view.querySelector('h1')?.focus();window.scrollTo(0,0);
 }};
}
