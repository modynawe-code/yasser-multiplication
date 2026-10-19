import {WORD_ORDER_AUDIO_BY_WORD,WORD_ORDER_AUDIO_ROOT} from './word-order-audio-manifest.js';

const STAGES=Object.freeze([
  Object.freeze({title:'المرحلة ١ · م، ب، ل، د، ن، ر',words:Object.freeze([
    {type:'حروف متحركة',word:'بَلَد',parts:['بَـ','ـلَـ','ـدَ']},
    {type:'حروف متحركة',word:'لَبَن',parts:['لَـ','ـبَـ','ـنَ']},
    {type:'حروف متحركة',word:'بَدَن',parts:['بَـ','ـدَ','نَ']},
    {type:'حروف متحركة',word:'بَرَد',parts:['بَـ','ـرَ','دَ']},
    {type:'مدّ بالألف',word:'نَار',parts:['نَـ','ـا','ر']},
    {type:'مدّ بالألف',word:'مَال',parts:['مَـ','ـا','ل']},
    {type:'مدّ بالألف',word:'دَار',parts:['دَ','ا','ر']},
    {type:'مدّ بالواو',word:'نُور',parts:['نُـ','ـو','ر']},
    {type:'مدّ بالواو',word:'دُود',parts:['دُ','و','د']},
    {type:'مدّ بالياء',word:'نِيل',parts:['نِـ','ـيـ','ـل']},
    {type:'مدّ بالياء',word:'دِين',parts:['دِ','يـ','ـن']},
    {type:'مقطع ساكن',word:'بَدْر',parts:['بَـ','ـدْ','ر']},
    {type:'مقطع ساكن',word:'رَمْل',parts:['رَ','مْـ','ـل']},
    {type:'مقطع ساكن',word:'بَنْد',parts:['بَـ','ـنْـ','ـد']}
  ])}),
  Object.freeze({title:'المرحلة ٢ · ص، ف، س، ق، ت، ح',words:Object.freeze([
    {type:'حروف متحركة',word:'قَفَص',parts:['قَـ','ـفَـ','ـصَ']},
    {type:'حروف متحركة',word:'فُسِرَ',parts:['فُـ','ـسِـ','ـرَ']},
    {type:'حروف متحركة',word:'فَحَص',parts:['فَـ','ـحَـ','ـصَ']},
    {type:'مدّ بالألف',word:'سَاق',parts:['سَـ','ـا','ق']},
    {type:'مدّ بالألف',word:'صَاح',parts:['صَـ','ـا','ح']},
    {type:'مدّ بالواو',word:'حُوت',parts:['حُـ','ـو','ت']},
    {type:'مدّ بالواو',word:'سُوق',parts:['سُـ','ـو','ق']},
    {type:'مدّ بالواو',word:'صُوف',parts:['صُـ','ـو','ف']},
    {type:'مدّ بالياء',word:'فَسِيح',parts:['فَـ','ـسِـ','ـيـ','ـح']},
    {type:'مدّ بالياء',word:'صَفِيح',parts:['صَـ','ـفِـ','ـيـ','ـح']},
    {type:'مقطع ساكن',word:'سَقْف',parts:['سَـ','ـقْـ','ـف']},
    {type:'مقطع ساكن',word:'فَتْح',parts:['فَـ','ـتْـ','ـح']},
    {type:'مقطع ساكن',word:'قَصْدُ',parts:['قَـ','ـصْـ','ـدُ']}
  ])})
]);

const ALL_WORDS=STAGES.flatMap((stage,stageIndex)=>stage.words.map((word,wordIndex)=>({...word,stageIndex,wordIndex})));
const STYLE_ID='khaled-word-order-style';

function ensureStyle(){
  if(document.getElementById(STYLE_ID))return;
  const link=document.createElement('link');link.id=STYLE_ID;link.rel='stylesheet';
  link.href='src/modules/khaled/literacy/word-order-game.css';document.head.appendChild(link);
}

function shuffle(items,random=Math.random){
  const result=[...items];
  for(let index=result.length-1;index>0;index--){const swap=Math.floor(random()*(index+1));[result[index],result[swap]]=[result[swap],result[index]];}
  return result;
}

export function createKhaledWordOrderGame({root,onBack,random=Math.random}={}){
  let index=0,solved=0,picked=null,startedAt=0,timer=null,closed=true,runToken=0;
  let activeAudio=null,activeAudioDone=null;
  if(!root)return Object.freeze({open(){},close(){}});

  root.classList.add('khaled-word-game');
  root.innerHTML=`
    <header class="kwg-header"><button class="kwg-back" type="button" data-action="back">← العودة إلى لغتي</button><div><h2>سباق ترتيب الكلمات</h2><p>رتّب المقاطع، واسمع نطق الكلمة بعد إكمالها.</p></div></header>
    <div class="kwg-board" dir="rtl">
      <div class="kwg-meta"><span class="kwg-stage" data-stage></span><span class="kwg-timer" aria-label="الوقت"><span aria-hidden="true">◷</span><span data-time dir="ltr">00:00</span></span></div>
      <div class="kwg-progress" aria-live="polite"><span data-progress></span><div class="kwg-track"><span class="kwg-finish" aria-hidden="true"></span><svg class="kwg-car" data-car viewBox="0 0 64 32" aria-hidden="true"><path d="M4 20Q4 14 12 13L20 12L26 5Q28 4 31 4L46 4Q50 4 52 8L56 13Q62 14 62 20L62 23Q62 25 60 25L6 25Q4 25 4 23Z" fill="currentColor"/><path d="M24 12L29 6L37 6L37 12Z M40 6L47 6Q49 6 50 9L52 12L40 12Z" fill="#d6ddf5"/><circle cx="17" cy="25" r="6" fill="#1d2240"/><circle cx="17" cy="25" r="2.5" fill="#c9cde0"/><circle cx="49" cy="25" r="6" fill="#1d2240"/><circle cx="49" cy="25" r="2.5" fill="#c9cde0"/></svg></div></div>
      <div class="kwg-prompt"><span data-type></span><strong data-message>هيا نرتب المقاطع ونكوّن الكلمة!</strong></div>
      <div class="kwg-slots" data-slots aria-label="أماكن ترتيب المقاطع"></div>
      <div class="kwg-answer" data-answer aria-live="polite"></div>
      <div class="kwg-tray" data-tray aria-label="مقاطع الكلمة"></div>
      <div class="kwg-actions"><button type="button" data-action="replay" hidden>أعد سماع الكلمة</button><button type="button" data-action="next" hidden>الكلمة التالية</button><button type="button" data-action="reset">أعد هذه الكلمة</button><button type="button" data-action="restart" hidden>العب من جديد</button></div>
      <p class="kwg-status" data-status role="status" aria-live="polite"></p>
      <footer class="kwg-credit">إعداد: عبد الله السديري</footer>
    </div>`;

  const slotsEl=root.querySelector('[data-slots]'),trayEl=root.querySelector('[data-tray]');
  const messageEl=root.querySelector('[data-message]'),answerEl=root.querySelector('[data-answer]');
  const timeEl=root.querySelector('[data-time]'),timerEl=root.querySelector('.kwg-timer');
  const progressEl=root.querySelector('[data-progress]'),stageEl=root.querySelector('[data-stage]');
  const carEl=root.querySelector('[data-car]'),statusEl=root.querySelector('[data-status]');
  const replayBtn=root.querySelector('[data-action="replay"]'),nextBtn=root.querySelector('[data-action="next"]');
  const restartBtn=root.querySelector('[data-action="restart"]');

  function current(){return ALL_WORDS[index];}
  function formatTime(ms){const seconds=Math.floor(ms/1000);return`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
  function startTimer(){if(timer||startedAt)return;startedAt=Date.now();timer=setInterval(()=>{timeEl.textContent=formatTime(Date.now()-startedAt);},250);}
  function stopTimer(){clearInterval(timer);timer=null;timerEl.classList.add('is-done');if(startedAt)timeEl.textContent=formatTime(Date.now()-startedAt);}
  function stopAudio(){
    if(!activeAudio)return;
    const audio=activeAudio,finish=activeAudioDone;
    activeAudio=null;activeAudioDone=null;
    audio.pause();audio.currentTime=0;finish?.();
  }
  function resetStageState(){solved=0;picked=null;}

  function build(){
    if(closed)return;
    runToken++;stopAudio();resetStageState();
    const item=current(),stage=STAGES[item.stageIndex];
    messageEl.textContent='هيا نرتب المقاطع ونكوّن الكلمة!';messageEl.className='';answerEl.textContent='';statusEl.textContent='';
    stageEl.textContent=stage.title;progressEl.textContent=`الكلمة ${item.wordIndex+1} من ${stage.words.length}`;
    carEl.style.setProperty('--progress','0%');
    replayBtn.hidden=true;nextBtn.hidden=true;restartBtn.hidden=true;
    slotsEl.replaceChildren();trayEl.replaceChildren();
    item.parts.forEach((part,slotIndex)=>{
      const slot=document.createElement('button');slot.type='button';slot.className='kwg-slot';slot.dataset.want=part;
      slot.setAttribute('aria-label',`المكان ${slotIndex+1}`);slot.addEventListener('click',()=>tapSlot(slot));slotsEl.append(slot);
    });
  const shuffled=shuffle(item.parts,random);
    if(shuffled.every((part,partIndex)=>part===item.parts[partIndex])&&shuffled.length>1)[shuffled[0],shuffled[1]]=[shuffled[1],shuffled[0]];
    shuffled.forEach((part,tileIndex)=>{
      const tile=document.createElement('button');tile.type='button';tile.className='kwg-tile';tile.textContent=part;tile.dataset.part=part;
      tile.setAttribute('aria-label',`مقطع ${part}`);tile.addEventListener('pointerdown',event=>startDrag(event,tile));
      tile.addEventListener('click',event=>{if(event.detail===0)pick(tile);});trayEl.append(tile);
    });
  }

  function pick(tile){
    if(tile.disabled)return;
    const wasPicked=picked===tile;
    picked?.classList.remove('is-picked');picked=wasPicked?null:tile;
    if(picked)picked.classList.add('is-picked');
    slotsEl.querySelectorAll('.kwg-slot:not(.is-filled)').forEach(slot=>slot.classList.toggle('is-armed',Boolean(picked)));
  }
  function tapSlot(slot){if(picked){const tile=picked;pick(tile);place(tile,slot);}}
  function startDrag(event,tile){
    if(event.button!==undefined&&event.button!==0)return;
    event.preventDefault();const startX=event.clientX,startY=event.clientY;let ghost=null,target=null;
    try{tile.setPointerCapture(event.pointerId);}catch{}
    const move=moveEvent=>{
      if(!ghost){if(Math.hypot(moveEvent.clientX-startX,moveEvent.clientY-startY)<6)return;ghost=tile.cloneNode(true);ghost.classList.add('kwg-drag');document.body.append(ghost);tile.classList.add('is-ghost');}
      ghost.style.left=`${moveEvent.clientX}px`;ghost.style.top=`${moveEvent.clientY}px`;
      const element=document.elementFromPoint(moveEvent.clientX,moveEvent.clientY),next=element?.closest('.kwg-slot:not(.is-filled)');
      if(target!==next){target?.classList.remove('is-hover');target=next;target?.classList.add('is-hover');}
    };
    const up=()=>{
      tile.removeEventListener('pointermove',move);tile.removeEventListener('pointerup',up);tile.removeEventListener('pointercancel',up);
      ghost?.remove();tile.classList.remove('is-ghost');target?.classList.remove('is-hover');
      if(target)place(tile,target);else if(!ghost)pick(tile);
    };
    tile.addEventListener('pointermove',move);tile.addEventListener('pointerup',up);tile.addEventListener('pointercancel',up);
  }
  function place(tile,slot){
    if(closed||tile.disabled||slot.classList.contains('is-filled'))return;
    startTimer();
    if(tile.dataset.part===slot.dataset.want){
      slot.textContent=tile.textContent;slot.classList.add('is-filled');slot.disabled=true;tile.remove();solved++;
      carEl.style.setProperty('--progress',`${Math.round(solved/current().parts.length*100)}%`);
      if(solved===current().parts.length)void completeWord();
      else{messageEl.textContent='صحيح! كمل ترتيب المقاطع.';messageEl.classList.remove('is-error');}
    }else{
      messageEl.textContent='حاول مرة ثانية';messageEl.classList.add('is-error');
      tile.classList.remove('is-shake');slot.classList.remove('is-shake');void tile.offsetWidth;tile.classList.add('is-shake');slot.classList.add('is-shake');
      setTimeout(()=>{if(!closed&&solved<current().parts.length)messageEl.classList.remove('is-error');},850);
    }
  }
  async function playSolvedWord(){
    const item=current(),token=++runToken;
    stopAudio();
    const clip=WORD_ORDER_AUDIO_BY_WORD[item.word];
    if(!clip){statusEl.textContent='لا يتوفر تسجيل لهذه الكلمة في المقاطع المرفوعة بعد.';return;}
    statusEl.textContent='يُشغّل تسجيل المعلمة…';
    const audio=new Audio(`${WORD_ORDER_AUDIO_ROOT}${clip.id}.mp3`);activeAudio=audio;
    const ended=new Promise(resolve=>{
      const finish=()=>{if(activeAudio===audio){activeAudio=null;activeAudioDone=null;}resolve();};
      activeAudioDone=finish;
      audio.addEventListener('ended',finish,{once:true});audio.addEventListener('error',finish,{once:true});
    });
    try{await audio.play();}catch{
      if(activeAudio===audio){activeAudio=null;activeAudioDone=null;}
      if(!closed&&token===runToken)statusEl.textContent='تعذر تشغيل التسجيل. اضغط «أعد سماع الكلمة» للمحاولة.';
      return;
    }
    await ended;
    if(closed||token!==runToken)return;
    activeAudio=null;
    if(audio.error){statusEl.textContent='تعذر تحميل التسجيل. اضغط «أعد سماع الكلمة» للمحاولة.';return;}
    statusEl.textContent='';
    await new Promise(resolve=>setTimeout(resolve,850));
    if(!closed&&token===runToken)advance();
  }
  function completeWord(){
    const hasRecording=Boolean(WORD_ORDER_AUDIO_BY_WORD[current().word]);
    answerEl.textContent=current().word;
    messageEl.textContent=hasRecording?'أحسنت! استمع إلى تسجيل الكلمة.':'أحسنت! لا يتوفر تسجيل لهذه الكلمة بعد.';
    messageEl.classList.remove('is-error');
    replayBtn.hidden=!hasRecording;nextBtn.hidden=false;statusEl.textContent='';
    void playSolvedWord();
  }
  function advance(){
    if(index<ALL_WORDS.length-1){index++;build();return;}
    stopTimer();messageEl.textContent=`رائع! أكملت المرحلتين في ${timeEl.textContent} 🌟`;
    nextBtn.hidden=true;replayBtn.hidden=true;restartBtn.hidden=false;
  }
  root.querySelector('[data-action="back"]').addEventListener('click',()=>{close();onBack?.();});
  root.querySelector('[data-action="reset"]').addEventListener('click',build);
  root.querySelector('[data-action="next"]').addEventListener('click',()=>{runToken++;stopAudio();advance();});
  root.querySelector('[data-action="restart"]').addEventListener('click',()=>{index=0;startedAt=0;clearInterval(timer);timer=null;timerEl.classList.remove('is-done');timeEl.textContent='00:00';build();});
  root.querySelector('[data-action="replay"]').addEventListener('click',()=>{void playSolvedWord();});

  function open(){ensureStyle();closed=false;root.hidden=false;root.dataset.open='true';build();root.querySelector('[data-action="back"]').focus();}
  function close(){closed=true;runToken++;stopAudio();clearInterval(timer);timer=null;startedAt=0;index=0;timerEl.classList.remove('is-done');timeEl.textContent='00:00';root.hidden=true;root.dataset.open='false';}
  return Object.freeze({open,close});
}

export const KHALED_WORD_ORDER_STAGES=STAGES;
export const KHALED_WORD_ORDER_WORD_COUNT=ALL_WORDS.length;
