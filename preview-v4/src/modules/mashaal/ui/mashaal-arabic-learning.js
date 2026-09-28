import { MASHAAL_ARABIC_LETTERS,MASHAAL_ARABIC_SECTIONS,getMashaalArabicLetter,getMashaalArabicSection } from '../curriculum/arabic-letter-curriculum.js';
import { createMashaalArabicProgress } from '../application/arabic-progress.js';
import { MASHAAL_ARABIC_MINI_STORIES } from '../curriculum/arabic-mini-stories.js';
import { createMashaalArabicLetterAudioPlayer,MASHAAL_ARABIC_LETTER_AUDIO_SOURCE } from '../curriculum/arabic-letter-audio.js';

const progress=createMashaalArabicProgress();
const letterAudio=createMashaalArabicLetterAudioPlayer();

function node(tag,className,text){
  const item=document.createElement(tag);
  if(className)item.className=className;
  if(text!==undefined)item.textContent=text;
  return item;
}

function letterAudioCredit(){
  const note=node('p','mashaal-arabic-audio-credit');
  note.append(document.createTextNode('نطق الحروف: '+MASHAAL_ARABIC_LETTER_AUDIO_SOURCE.organization+' · '));
  const link=node('a','', 'المصدر الرسمي');
  link.href=MASHAAL_ARABIC_LETTER_AUDIO_SOURCE.pageUrl;
  link.target='_blank';
  link.rel='noopener noreferrer';
  note.appendChild(link);
  return note;
}

function imageNode(item,className=''){
  const image=document.createElement('img');
  if(className)image.className=className;
  image.src=item.image;
  image.alt=item.word;
  image.loading='lazy';
  image.decoding='async';
  image.draggable=false;
  return image;
}

function statusText(value){
  if(value==='mastered')return 'أتقنته';
  if(value==='learning')return 'أتعلّمه';
  return 'جديد';
}

function letterButton(letter){
  const button=node('button','mashaal-arabic-letter');
  button.type='button';
  button.dataset.letterId=letter.id;
  button.dataset.progress=progress.status(letter.id);
  button.setAttribute('aria-label','حرف '+letter.name+'، '+statusText(button.dataset.progress));
  button.append(node('strong','',letter.letter),node('small','',letter.name));
  return button;
}

function renderLetterGrid(host,onChoose,selectedId=''){
  const grid=node('div','mashaal-arabic-letter-grid');
  for(const letter of MASHAAL_ARABIC_LETTERS){
    const button=letterButton(letter);
    if(letter.id===selectedId)button.dataset.selected='true';
    button.addEventListener('click',()=>onChoose(letter));
    grid.appendChild(button);
  }
  host.appendChild(grid);
  return grid;
}

function refreshLetterStatuses(host,selectedId=''){
  host.querySelectorAll('[data-letter-id]').forEach(button=>{
    button.dataset.progress=progress.status(button.dataset.letterId);
    button.dataset.selected=String(button.dataset.letterId===selectedId);
  });
}

function renderProgressSummary(host){
  const summary=progress.summary(MASHAAL_ARABIC_LETTERS.map(item=>item.id));
  const wrap=node('div','mashaal-arabic-progress-summary');
  const copy=node('div','mashaal-arabic-progress-copy');
  copy.append(node('strong','',summary.mastered+' / '+summary.total+' حروف متقنة'),node('small','',summary.learning+' قيد التعلّم'));
  const meter=node('div','mashaal-arabic-progress-meter');
  const bar=node('span','mashaal-arabic-progress-bar');
  bar.style.width=(summary.total?Math.round(summary.mastered/summary.total*100):0)+'%';
  meter.appendChild(bar);wrap.append(copy,meter);host.appendChild(wrap);
}

function renderSectionIntro(host,section){
  const intro=node('div','mashaal-arabic-section-intro');
  intro.append(node('span','mashaal-arabic-section-icon',section.icon),node('div','mashaal-arabic-section-copy'));
  intro.lastElementChild.append(node('h2','',section.title),node('p','',section.subtitle));
  host.appendChild(intro);
}

export function renderMashaalArabicSectionCards(host){
  if(!host)return;
  host.innerHTML='';
  renderProgressSummary(host);
  for(const section of MASHAAL_ARABIC_SECTIONS){
    const button=node('button','mashaal-arabic-section-card');
    button.type='button';
    button.dataset.arabicSection=section.id;
    button.setAttribute('aria-label',section.title+'، '+section.subtitle);
    button.append(node('span','mashaal-arabic-section-card-icon',section.icon));
    const copy=node('span','mashaal-arabic-section-card-copy');
    copy.append(node('strong','',section.title),node('small','',section.subtitle));
    button.appendChild(copy);
    host.appendChild(button);
  }
}

function pictureCard(item,{button=false,onClick}={}){
  const card=node(button?'button':'div','mashaal-arabic-picture-card');
  if(button)card.type='button';
  card.append(imageNode(item,'mashaal-arabic-picture'),node('strong','',item.word));
  if(onClick)card.addEventListener('click',onClick);
  return card;
}

function pictureRow(items){
  const row=node('div','mashaal-arabic-picture-row');
  for(const item of items)row.appendChild(pictureCard(item));
  return row;
}

function renderLetterExplorer(host,{onSwitchSection}){
  const body=node('div','mashaal-arabic-explorer');
  const picker=node('div','mashaal-arabic-picker');
  const detail=node('div','mashaal-arabic-letter-detail');
  body.append(picker,detail);host.appendChild(body);

  function showLetter(letter){
    progress.record(letter.id,'view');
    refreshLetterStatuses(picker,letter.id);
    detail.innerHTML='';
    const hero=node('div','mashaal-arabic-letter-hero');
    const state=node('span','mashaal-arabic-mastery-chip',statusText(progress.status(letter.id)));
    state.dataset.state=progress.status(letter.id);
    hero.append(node('strong','',letter.letter),node('span','', 'حرف '+letter.name),node('small','', 'أمثلة مصوّرة تبدأ بالحرف'),state);
    const actions=node('div','mashaal-arabic-letter-actions');
    const hear=node('button','mashaal-arabic-action','🔊 اسم الحرف');
    hear.type='button';hear.addEventListener('click',()=>letterAudio.play(letter.id));
    const write=node('button','mashaal-arabic-action','✍️ أتدرب على الكتابة');
    write.type='button';write.addEventListener('click',()=>onSwitchSection?.('write',letter.id));
    const color=node('button','mashaal-arabic-action','🎨 ألوّن الحرف');
    color.type='button';color.addEventListener('click',()=>onSwitchSection?.('color',letter.id));
    const play=node('button','mashaal-arabic-action','🎮 ألعب بالحرف');
    play.type='button';play.addEventListener('click',()=>onSwitchSection?.('games',letter.id));
    actions.append(hear,write,color,play);
    detail.append(hero,pictureRow(letter.items),actions,letterAudioCredit());
  }

  renderLetterGrid(picker,showLetter,'alif');
  showLetter(MASHAAL_ARABIC_LETTERS[0]);
}

function mountCanvasPractice(host,{mode,initialLetterId}){
  const state={
    letter:getMashaalArabicLetter(initialLetterId)||MASHAAL_ARABIC_LETTERS[0],
    drawing:false,brush:'#6a3f68',width:mode==='write'?18:30,last:null,points:[],history:[],eraser:false
  };
  const picker=node('div','mashaal-arabic-practice-picker');
  const reference=node('div','mashaal-arabic-practice-reference');
  const stage=node('div','mashaal-arabic-practice-stage');
  const toolbar=node('div','mashaal-arabic-practice-toolbar');
  const canvas=document.createElement('canvas');
  canvas.className='mashaal-arabic-canvas';canvas.width=720;canvas.height=420;
  canvas.setAttribute('aria-label',mode==='write'?'لوحة تتبع الحرف':'لوحة تلوين الحرف');
  const status=node('p','mashaal-arabic-practice-status',mode==='write'?'تتبعي شكل الحرف بإصبعك ثم اضغطي تحققي.':'اختاري لونًا ولوّني الحرف.');
  stage.append(reference,canvas,toolbar,status);host.append(picker,stage);
  const ctx=canvas.getContext('2d');
  const mask=document.createElement('canvas');mask.width=canvas.width;mask.height=canvas.height;
  const maskCtx=mask.getContext('2d');

  function glyphFont(context){
    context.font='700 260px system-ui, -apple-system, "Noto Sans Arabic", sans-serif';
    context.textAlign='center';context.textBaseline='middle';context.direction='rtl';
  }
  function drawMask(){
    maskCtx.clearRect(0,0,mask.width,mask.height);maskCtx.save();glyphFont(maskCtx);
    maskCtx.fillStyle='#000';maskCtx.strokeStyle='#000';maskCtx.lineWidth=46;maskCtx.lineJoin='round';
    maskCtx.strokeText(state.letter.letter,mask.width/2,mask.height/2+5);maskCtx.fillText(state.letter.letter,mask.width/2,mask.height/2+5);
    maskCtx.restore();
  }
  function drawGuide(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#fffafc';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.save();glyphFont(ctx);
    if(mode==='write'){
      ctx.lineWidth=8;ctx.strokeStyle='#cfbdca';ctx.setLineDash([14,12]);ctx.strokeText(state.letter.letter,canvas.width/2,canvas.height/2+5);
    }else{
      ctx.lineWidth=12;ctx.strokeStyle='#cdb8c8';ctx.setLineDash([]);ctx.strokeText(state.letter.letter,canvas.width/2,canvas.height/2+5);
    }
    ctx.restore();drawMask();state.points=[];state.history=[];
  }
  function renderReference(){
    reference.innerHTML='';
    reference.append(node('strong','', 'حرف '+state.letter.name),pictureRow(state.letter.items));
  }
  function snapshot(){
    try{
      state.history.push(ctx.getImageData(0,0,canvas.width,canvas.height));
      if(state.history.length>10)state.history.shift();
    }catch{}
  }
  function undo(){
    const previous=state.history.pop();
    if(previous)ctx.putImageData(previous,0,0);
  }
  function point(event){
    const rect=canvas.getBoundingClientRect();
    return {x:(event.clientX-rect.left)*(canvas.width/Math.max(1,rect.width)),y:(event.clientY-rect.top)*(canvas.height/Math.max(1,rect.height))};
  }
  function start(event){
    snapshot();state.drawing=true;state.last=point(event);state.points.push(state.last);
    canvas.setPointerCapture?.(event.pointerId);event.preventDefault();
  }
  function move(event){
    if(!state.drawing)return;
    const next=point(event);state.points.push(next);
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=state.width;
    ctx.strokeStyle=state.eraser?'#fffafc':state.brush;
    ctx.beginPath();ctx.moveTo(state.last.x,state.last.y);ctx.lineTo(next.x,next.y);ctx.stroke();ctx.restore();
    state.last=next;event.preventDefault();
  }
  function end(event){state.drawing=false;state.last=null;try{canvas.releasePointerCapture?.(event.pointerId);}catch{}}
  canvas.addEventListener('pointerdown',start);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);

  const clear=node('button','mashaal-arabic-tool','↻ مسح');clear.type='button';clear.addEventListener('click',drawGuide);
  const undoButton=node('button','mashaal-arabic-tool','↶ تراجع');undoButton.type='button';undoButton.addEventListener('click',undo);
  const hearLetter=node('button','mashaal-arabic-tool','🔊 اسمعي الحرف');hearLetter.type='button';hearLetter.addEventListener('click',()=>letterAudio.play(state.letter.id));
  toolbar.append(clear,undoButton,hearLetter);

  if(mode==='write'){
    const check=node('button','mashaal-arabic-tool mashaal-arabic-check','✓ تحققي');check.type='button';
    check.addEventListener('click',()=>{
      if(state.points.length<12){status.textContent='ارسمي على الحرف أولًا ثم تحققي.';return;}
      const data=maskCtx.getImageData(0,0,mask.width,mask.height).data;
      let inside=0;
      for(const p of state.points){
        const x=Math.max(0,Math.min(mask.width-1,Math.round(p.x))),y=Math.max(0,Math.min(mask.height-1,Math.round(p.y)));
        if(data[(y*mask.width+x)*4+3]>0)inside+=1;
      }
      const ratio=inside/state.points.length,ok=ratio>=.68;
      progress.record(state.letter.id,'writing',{correct:ok});
      status.textContent=ok?'ممتاز! أغلب خطك داخل شكل الحرف.':'جربي مرة ثانية وخلي الخط أقرب لشكل الحرف.';
      refreshLetterStatuses(picker,state.letter.id);
    });
    toolbar.appendChild(check);
  }else{
    const eraser=node('button','mashaal-arabic-tool','⌫ ممحاة');eraser.type='button';
    eraser.addEventListener('click',()=>{state.eraser=!state.eraser;eraser.dataset.active=String(state.eraser);});
    toolbar.appendChild(eraser);
    const palette=node('div','mashaal-arabic-palette');
    for(const color of ['#dd5f8c','#6a73c9','#39a37c','#e09b34','#74508f','#2f3237']){
      const swatch=node('button','mashaal-arabic-swatch');swatch.type='button';swatch.style.setProperty('--swatch',color);swatch.setAttribute('aria-label','اختاري لونًا');
      swatch.addEventListener('click',()=>{state.brush=color;state.eraser=false;eraser.dataset.active='false';palette.querySelectorAll('button').forEach(item=>delete item.dataset.selected);swatch.dataset.selected='true';});
      palette.appendChild(swatch);
    }
    palette.firstElementChild.dataset.selected='true';toolbar.appendChild(palette);
    const sizes=node('div','mashaal-arabic-brush-sizes');
    for(const value of [18,30,44]){
      const button=node('button','mashaal-arabic-size',value===18?'صغير':value===30?'وسط':'كبير');button.type='button';
      if(value===30)button.dataset.selected='true';
      button.addEventListener('click',()=>{state.width=value;sizes.querySelectorAll('button').forEach(item=>delete item.dataset.selected);button.dataset.selected='true';});
      sizes.appendChild(button);
    }
    toolbar.appendChild(sizes);
  }

  function chooseLetter(letter){
    state.letter=letter;progress.record(letter.id,'view');refreshLetterStatuses(picker,letter.id);
    status.textContent=mode==='write'?'تتبعي حرف '+letter.name+' ثم اضغطي تحققي.':'لوّني حرف '+letter.name+'.';
    renderReference();drawGuide();
  }
  renderLetterGrid(picker,chooseLetter,state.letter.id);renderReference();drawGuide();stage.appendChild(letterAudioCredit());
}

function renderListening(host){
  const quiz=node('div','mashaal-arabic-listen');
  const controls=node('div','mashaal-arabic-listen-controls');
  const hear=node('button','mashaal-arabic-listen-hear','🔊 اسمعي اسم الحرف');hear.type='button';
  const status=node('p','mashaal-arabic-listen-status','اسمعي اسم الحرف ثم اختاريه.');
  const choices=node('div','mashaal-arabic-listen-choices');
  controls.append(hear,status,letterAudioCredit());quiz.append(controls,choices);host.appendChild(quiz);
  let index=0,target=MASHAAL_ARABIC_LETTERS[0],timer=null;
  function shuffled(items){return [...items].sort(()=>Math.random()-.5);}
  function playTarget(){return letterAudio.play(target.id);}
  function round(){
    target=MASHAAL_ARABIC_LETTERS[index%MASHAAL_ARABIC_LETTERS.length];index+=1;choices.innerHTML='';status.textContent='اسمعي اسم الحرف ثم اختاريه.';
    const targetIndex=MASHAAL_ARABIC_LETTERS.indexOf(target);
    const options=shuffled([target,MASHAAL_ARABIC_LETTERS[(targetIndex+5)%28],MASHAAL_ARABIC_LETTERS[(targetIndex+11)%28],MASHAAL_ARABIC_LETTERS[(targetIndex+19)%28]]);
    for(const letter of options){
      const button=letterButton(letter);button.classList.add('mashaal-arabic-listen-choice');
      button.addEventListener('click',()=>{
        const correct=letter.id===target.id;progress.record(target.id,'attempt',{correct});
        if(!correct){button.dataset.outcome='wrong';status.textContent='مو هذا، اسمعي مرة ثانية.';playTarget();return;}
        button.dataset.outcome='correct';status.textContent='ممتاز! اضغطي اسمعي للحرف التالي.';timer=setTimeout(()=>{round();},650);
      });
      choices.appendChild(button);
    }
  }
  hear.addEventListener('click',playTarget);round();
  return ()=>{if(timer)clearTimeout(timer);};
}

function shuffled(items){return [...items].sort(()=>Math.random()-.5);}

function renderWordBuilder(host,letter){
  const box=node('section','mashaal-arabic-word-builder');
  let itemIndex=0;
  function render(){
    box.innerHTML='';
    const item=letter.items[itemIndex%letter.items.length];
    const head=node('div','mashaal-arabic-word-builder-head');
    head.append(imageNode(item,'mashaal-arabic-builder-image'),node('div',''));
    head.lastElementChild.append(node('strong','', 'كوّني كلمة '+item.word),node('small','', 'اضغطي الحروف بالترتيب'));
    const answer=node('div','mashaal-arabic-built-word','');
    const letters=node('div','mashaal-arabic-scrambled-letters');
    let built='';
    const chars=shuffled(Array.from(item.word).map((char,index)=>({char,index})));
    for(const entry of chars){
      const button=node('button','mashaal-arabic-scramble-letter',entry.char);button.type='button';
      button.addEventListener('click',()=>{
        if(button.disabled)return;button.disabled=true;built+=entry.char;answer.textContent=built;
        if(Array.from(built).length===Array.from(item.word).length){
          const ok=built===item.word;
          progress.record(letter.id,'word',{correct:ok});
          answer.dataset.outcome=ok?'correct':'wrong';
          if(ok)answer.textContent='✓ '+item.word;
          else setTimeout(()=>render(),700);
        }
      });
      letters.appendChild(button);
    }
    const next=node('button','mashaal-arabic-tool','كلمة ثانية');next.type='button';
    next.addEventListener('click',()=>{itemIndex=(itemIndex+1)%letter.items.length;render();});
    box.append(head,answer,letters,next);
  }
  render();host.appendChild(box);
}

function renderWords(host,{initialLetterId}){
  const wrap=node('div','mashaal-arabic-words-view');
  const picker=node('div','mashaal-arabic-practice-picker');
  const words=node('div','mashaal-arabic-word-cards');
  const builder=node('div','mashaal-arabic-builder-host');
  wrap.append(picker,words,builder);host.appendChild(wrap);
  function show(letter){
    progress.record(letter.id,'view');refreshLetterStatuses(picker,letter.id);words.innerHTML='';builder.innerHTML='';
    const title=node('h3','', 'كلمات حرف '+letter.name);words.appendChild(title);
    for(const item of letter.items)words.appendChild(pictureCard(item,{button:true,onClick:()=>{}}));
    renderWordBuilder(builder,letter);
  }
  const initial=getMashaalArabicLetter(initialLetterId)||MASHAAL_ARABIC_LETTERS[0];renderLetterGrid(picker,show,initial.id);show(initial);
}

function optionLetters(target,count=4){
  const index=MASHAAL_ARABIC_LETTERS.indexOf(target);
  const picks=[target];
  for(const offset of [4,9,15,21])if(picks.length<count)picks.push(MASHAAL_ARABIC_LETTERS[(index+offset)%MASHAAL_ARABIC_LETTERS.length]);
  return shuffled(picks);
}

function renderArabicGames(host,{initialLetterId}){
  const shell=node('div','mashaal-arabic-games');
  const modeBar=node('div','mashaal-arabic-game-modes');
  const game=node('div','mashaal-arabic-game-stage');
  shell.append(modeBar,game);host.appendChild(shell);
  let roundIndex=Math.max(0,MASHAAL_ARABIC_LETTERS.findIndex(item=>item.id===initialLetterId));
  const modes=[
    ['first','الحرف الأول','اختاري أول حرف للصورة'],
    ['match','الصورة المناسبة','اختاري صورة تبدأ بالحرف'],
    ['odd','الصورة الدخيلة','اكتشفي الصورة المختلفة']
  ];

  function nextLetter(){const letter=MASHAAL_ARABIC_LETTERS[roundIndex%MASHAAL_ARABIC_LETTERS.length];roundIndex+=1;return letter;}
  function feedback(text,ok){const item=node('p','mashaal-arabic-game-feedback',text);item.dataset.outcome=ok?'correct':'wrong';return item;}

  function firstLetterRound(){
    game.innerHTML='';const target=nextLetter(),item=target.items[(roundIndex-1)%target.items.length];
    const title=node('h3','', 'ما الحرف الأول؟');game.append(title,pictureCard(item));
    const choices=node('div','mashaal-arabic-game-letter-options');
    for(const letter of optionLetters(target)){
      const button=letterButton(letter);button.addEventListener('click',()=>{
        const ok=letter.id===target.id;progress.record(target.id,'game',{correct:ok});
        game.querySelector('.mashaal-arabic-game-feedback')?.remove();game.appendChild(feedback(ok?'ممتاز! '+item.word+' تبدأ بحرف '+target.name:'جربي مرة ثانية.',ok));
        if(ok)setTimeout(firstLetterRound,700);
      });choices.appendChild(button);
    }
    game.appendChild(choices);
  }

  function matchRound(){
    game.innerHTML='';const target=nextLetter(),targetIndex=MASHAAL_ARABIC_LETTERS.indexOf(target);
    game.append(node('h3','', 'اختاري صورة تبدأ بحرف '+target.name),node('div','mashaal-arabic-game-target-letter',target.letter));
    const candidates=[target,...[5,11,18].map(offset=>MASHAAL_ARABIC_LETTERS[(targetIndex+offset)%28])];
    const cards=node('div','mashaal-arabic-game-image-options');
    for(const letter of shuffled(candidates)){
      const item=letter.items[(roundIndex+letter.order)%letter.items.length];
      cards.appendChild(pictureCard(item,{button:true,onClick:()=>{
        const ok=letter.id===target.id;progress.record(target.id,'game',{correct:ok});
        game.querySelector('.mashaal-arabic-game-feedback')?.remove();game.appendChild(feedback(ok?'صحيح! '+item.word:'هذه تبدأ بحرف آخر، حاولي مرة ثانية.',ok));
        if(ok)setTimeout(matchRound,700);
      }}));
    }
    game.appendChild(cards);
  }

  function oddRound(){
    game.innerHTML='';const target=nextLetter(),targetIndex=MASHAAL_ARABIC_LETTERS.indexOf(target),other=MASHAAL_ARABIC_LETTERS[(targetIndex+7)%28];
    game.append(node('h3','', 'ثلاث صور تبدأ بحرف '+target.name+'، أي صورة مختلفة؟'));
    const entries=[...target.items.map(item=>({item,letterId:target.id})),{item:other.items[0],letterId:other.id}];
    const cards=node('div','mashaal-arabic-game-image-options');
    for(const entry of shuffled(entries)){
      cards.appendChild(pictureCard(entry.item,{button:true,onClick:()=>{
        const ok=entry.letterId!==target.id;progress.record(target.id,'game',{correct:ok});
        game.querySelector('.mashaal-arabic-game-feedback')?.remove();game.appendChild(feedback(ok?'ممتاز! هذه هي الصورة الدخيلة.':'هذه من صور حرف '+target.name+'.',ok));
        if(ok)setTimeout(oddRound,700);
      }}));
    }
    game.appendChild(cards);
  }

  const runners={first:firstLetterRound,match:matchRound,odd:oddRound};
  let active='first';
  for(const [id,title,subtitle] of modes){
    const button=node('button','mashaal-arabic-game-mode');button.type='button';button.dataset.mode=id;
    button.append(node('strong','',title),node('small','',subtitle));
    button.addEventListener('click',()=>{active=id;modeBar.querySelectorAll('button').forEach(item=>item.dataset.selected=String(item.dataset.mode===active));runners[active]();});
    modeBar.appendChild(button);
  }
  modeBar.firstElementChild.dataset.selected='true';runners[active]();
}

const STORY_ITEMS=Object.freeze([
  Object.freeze({activityId:'kg3-interactive-story-morning-01',title:'قصة مشاعل',subtitle:'اختاري وكمّلي القصة'}),
  Object.freeze({activityId:'kg3-open-seed-journey-01',title:'مغامرة جمع البذور',subtitle:'رتبي مشاهد الرحلة'}),
  Object.freeze({activityId:'kg3-open-tinku-night-01',title:'قصة تينكو الليلية',subtitle:'رتبي لقاءات تينكو'})
]);

function renderLinkedActivities(host,items,onOpenActivity){
  const grid=node('div','mashaal-arabic-linked-grid');
  for(const item of items){
    const button=node('button','mashaal-arabic-linked-card');button.type='button';button.dataset.activityId=item.activityId;
    button.append(node('strong','',item.title),node('small','',item.subtitle),node('span','','ابدئي'));
    button.addEventListener('click',()=>onOpenActivity?.(item.activityId));grid.appendChild(button);
  }
  host.appendChild(grid);
}

function renderMiniStories(host,onOpenActivity){
  const shell=node('div','mashaal-arabic-stories');
  const selector=node('div','mashaal-arabic-story-selector');
  const stage=node('div','mashaal-arabic-story-stage');
  shell.append(selector,stage);host.appendChild(shell);

  function sceneCard(scene,index,{button=false,onClick}={}){
    const card=node(button?'button':'article','mashaal-arabic-story-scene');
    if(button)card.type='button';
    const number=node('span','mashaal-arabic-story-number',String(index+1));
    card.append(number,imageNode(scene,'mashaal-arabic-story-image'),node('strong','',scene.word),node('p','',scene.text));
    if(onClick)card.addEventListener('click',onClick);
    return card;
  }

  function showStory(story){
    selector.querySelectorAll('button').forEach(item=>item.dataset.selected=String(item.dataset.storyId===story.id));
    stage.innerHTML='';
    stage.append(node('h3','',story.title));
    const scenes=node('div','mashaal-arabic-story-scenes');
    story.scenes.forEach((scene,index)=>scenes.appendChild(sceneCard(scene,index)));
    const quiz=node('button','mashaal-arabic-tool mashaal-arabic-story-quiz','🧩 رتّبي الأحداث');
    quiz.type='button';quiz.addEventListener('click',()=>startQuiz(story));
    stage.append(scenes,quiz);
  }

  function startQuiz(story){
    stage.innerHTML='';
    stage.append(node('h3','',story.title),node('p','mashaal-arabic-story-instruction','اضغطي الصور بترتيب القصة من الأول إلى الأخير.'));
    const picked=node('div','mashaal-arabic-story-picked','الترتيب: ');
    const choices=node('div','mashaal-arabic-story-scenes mashaal-arabic-story-quiz-grid');
    const answer=[];
    const shuffledScenes=shuffled(story.scenes.map((scene,index)=>({scene,index})));
    for(const entry of shuffledScenes){
      const card=sceneCard(entry.scene,entry.index,{button:true,onClick:()=>{
        if(card.disabled)return;
        card.disabled=true;answer.push(entry.index);picked.textContent='الترتيب: '+answer.map(value=>value+1).join(' ← ');
        if(answer.length===story.scenes.length){
          const ok=answer.every((value,index)=>value===index);
          progress.record(story.letterId,'attempt',{correct:ok});
          const feedback=node('p','mashaal-arabic-game-feedback',ok?'ممتاز! رتبتِ أحداث القصة بشكل صحيح.':'الترتيب يحتاج محاولة ثانية.');
          feedback.dataset.outcome=ok?'correct':'wrong';stage.appendChild(feedback);
          const again=node('button','mashaal-arabic-tool',ok?'اقرئي القصة مرة ثانية':'أعيدي المحاولة');
          again.type='button';again.addEventListener('click',()=>ok?showStory(story):startQuiz(story));stage.appendChild(again);
        }
      }});
      card.querySelector('p')?.remove();
      choices.appendChild(card);
    }
    stage.append(picked,choices);
  }

  for(const story of MASHAAL_ARABIC_MINI_STORIES){
    const button=node('button','mashaal-arabic-story-tab');button.type='button';button.dataset.storyId=story.id;
    button.textContent=story.title;button.addEventListener('click',()=>showStory(story));selector.appendChild(button);
  }
  showStory(MASHAAL_ARABIC_MINI_STORIES[0]);

  const more=node('section','mashaal-arabic-more-stories');
  more.append(node('h3','', 'قصص إضافية موجودة في التطبيق'));
  renderLinkedActivities(more,STORY_ITEMS,onOpenActivity);
  shell.appendChild(more);
}

export function mountMashaalArabicSection(host,sectionId,{onSpeak,onSwitchSection,onOpenActivity,initialLetterId}={}){
  if(!host)return Object.freeze({destroy(){}});
  host.innerHTML='';
  const section=getMashaalArabicSection(sectionId)||MASHAAL_ARABIC_SECTIONS[0];
  renderSectionIntro(host,section);
  let cleanup=()=>{};
  if(section.id==='letters')renderLetterExplorer(host,{onSwitchSection});
  else if(section.id==='write')mountCanvasPractice(host,{mode:'write',initialLetterId});
  else if(section.id==='color')mountCanvasPractice(host,{mode:'color',initialLetterId});
  else if(section.id==='listen')cleanup=renderListening(host)||cleanup;
  else if(section.id==='words')renderWords(host,{initialLetterId});
  else if(section.id==='stories')renderMiniStories(host,onOpenActivity);
  else if(section.id==='games')renderArabicGames(host,{initialLetterId});
  return Object.freeze({destroy(){letterAudio.stop();cleanup();host.innerHTML='';}});
}
