import { MASHAAL_ARABIC_LETTERS,MASHAAL_ARABIC_SECTIONS,getMashaalArabicLetter,getMashaalArabicSection } from '../curriculum/arabic-letter-curriculum.js';

function node(tag,className,text){
  const item=document.createElement(tag);
  if(className)item.className=className;
  if(text!==undefined)item.textContent=text;
  return item;
}

function letterButton(letter){
  const button=node('button','mashaal-arabic-letter');
  button.type='button';
  button.dataset.letterId=letter.id;
  button.setAttribute('aria-label',`حرف ${letter.name}`);
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

function renderSectionIntro(host,section){
  const intro=node('div','mashaal-arabic-section-intro');
  intro.append(node('span','mashaal-arabic-section-icon',section.icon),node('div','mashaal-arabic-section-copy'));
  intro.lastElementChild.append(node('h2','',section.title),node('p','',section.subtitle));
  host.appendChild(intro);
}

export function renderMashaalArabicSectionCards(host){
  if(!host)return;
  host.innerHTML='';
  for(const section of MASHAAL_ARABIC_SECTIONS){
    const button=node('button','mashaal-arabic-section-card');
    button.type='button';
    button.dataset.arabicSection=section.id;
    button.setAttribute('aria-label',`${section.title}، ${section.subtitle}`);
    button.append(node('span','mashaal-arabic-section-card-icon',section.icon));
    const copy=node('span','mashaal-arabic-section-card-copy');
    copy.append(node('strong','',section.title),node('small','',section.subtitle));
    button.appendChild(copy);
    host.appendChild(button);
  }
}

function renderLetterExplorer(host,{onSpeak,onSwitchSection}){
  const body=node('div','mashaal-arabic-explorer');
  const picker=node('div','mashaal-arabic-picker');
  const detail=node('div','mashaal-arabic-letter-detail');
  body.append(picker,detail);host.appendChild(body);

  function showLetter(letter){
    picker.querySelectorAll('[data-letter-id]').forEach(item=>item.dataset.selected=String(item.dataset.letterId===letter.id));
    detail.innerHTML='';
    const hero=node('div','mashaal-arabic-letter-hero');
    hero.append(node('strong','',letter.letter),node('span','',`حرف ${letter.name}`),node('small','',`مثال: ${letter.exampleWord}`));
    const words=node('div','mashaal-arabic-word-row');
    for(const word of letter.words){
      const wordButton=node('button','mashaal-arabic-word',word);wordButton.type='button';
      wordButton.addEventListener('click',()=>onSpeak?.(word));
      words.appendChild(wordButton);
    }
    const actions=node('div','mashaal-arabic-letter-actions');
    const hear=node('button','mashaal-arabic-action','🔊 اسمعي اسم الحرف');hear.type='button';hear.addEventListener('click',()=>onSpeak?.(`هذا حرف ${letter.name}. ${letter.name}. مثال: ${letter.exampleWord}.`));
    const write=node('button','mashaal-arabic-action','✍️ اكتبي الحرف');write.type='button';write.addEventListener('click',()=>onSwitchSection?.('write',letter.id));
    const color=node('button','mashaal-arabic-action','🎨 لوّني الحرف');color.type='button';color.addEventListener('click',()=>onSwitchSection?.('color',letter.id));
    actions.append(hear,write,color);
    detail.append(hero,words,actions);
  }

  renderLetterGrid(picker,showLetter,'alif');
  showLetter(MASHAAL_ARABIC_LETTERS[0]);
}

function mountCanvasPractice(host,{mode,onSpeak,initialLetterId}){
  const state={letter:getMashaalArabicLetter(initialLetterId)||MASHAAL_ARABIC_LETTERS[0],drawing:false,brush:'#6a3f68',last:null};
  const picker=node('div','mashaal-arabic-practice-picker');
  const stage=node('div','mashaal-arabic-practice-stage');
  const toolbar=node('div','mashaal-arabic-practice-toolbar');
  const canvas=document.createElement('canvas');canvas.className='mashaal-arabic-canvas';canvas.width=720;canvas.height=420;canvas.setAttribute('aria-label',mode==='write'?'لوحة تتبع الحرف':'لوحة تلوين الحرف');
  const status=node('p','mashaal-arabic-practice-status',mode==='write'?'اتبعي شكل الحرف بإصبعك.':'اختاري لونًا ولوّني داخل وحول الحرف.');
  stage.append(canvas,toolbar,status);host.append(picker,stage);
  const ctx=canvas.getContext('2d');

  function drawGuide(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#fffafc';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.direction='rtl';
    ctx.font='700 260px system-ui, -apple-system, "Noto Sans Arabic", sans-serif';
    if(mode==='write'){
      ctx.lineWidth=7;ctx.strokeStyle='#d8c8d5';ctx.setLineDash([12,12]);ctx.strokeText(state.letter.letter,canvas.width/2,canvas.height/2+5);
    }else{
      ctx.lineWidth=10;ctx.strokeStyle='#d1c0ce';ctx.setLineDash([]);ctx.strokeText(state.letter.letter,canvas.width/2,canvas.height/2+5);
    }
    ctx.restore();
  }

  function point(event){
    const rect=canvas.getBoundingClientRect();
    return {x:(event.clientX-rect.left)*(canvas.width/Math.max(1,rect.width)),y:(event.clientY-rect.top)*(canvas.height/Math.max(1,rect.height))};
  }
  function start(event){state.drawing=true;state.last=point(event);canvas.setPointerCapture?.(event.pointerId);event.preventDefault();}
  function move(event){
    if(!state.drawing)return;
    const next=point(event);ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=mode==='write'?18:30;ctx.strokeStyle=state.brush;ctx.beginPath();ctx.moveTo(state.last.x,state.last.y);ctx.lineTo(next.x,next.y);ctx.stroke();ctx.restore();state.last=next;event.preventDefault();
  }
  function end(event){state.drawing=false;state.last=null;try{canvas.releasePointerCapture?.(event.pointerId);}catch{}}
  canvas.addEventListener('pointerdown',start);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);

  const clear=node('button','mashaal-arabic-tool','↻ مسح');clear.type='button';clear.addEventListener('click',drawGuide);
  const hear=node('button','mashaal-arabic-tool','🔊 اسمعي');hear.type='button';hear.addEventListener('click',()=>onSpeak?.(`هذا حرف ${state.letter.name}. ${state.letter.name}. مثال: ${state.letter.exampleWord}.`));
  toolbar.append(clear,hear);
  if(mode==='color'){
    const colors=['#dd5f8c','#6a73c9','#39a37c','#e09b34','#74508f','#2f3237'];
    const palette=node('div','mashaal-arabic-palette');
    for(const color of colors){
      const swatch=node('button','mashaal-arabic-swatch');swatch.type='button';swatch.style.setProperty('--swatch',color);swatch.setAttribute('aria-label','اختاري لونًا');swatch.addEventListener('click',()=>{state.brush=color;palette.querySelectorAll('button').forEach(item=>delete item.dataset.selected);swatch.dataset.selected='true';});palette.appendChild(swatch);
    }
    palette.firstElementChild.dataset.selected='true';toolbar.appendChild(palette);state.brush=colors[0];
  }

  function chooseLetter(letter){
    state.letter=letter;picker.querySelectorAll('[data-letter-id]').forEach(item=>item.dataset.selected=String(item.dataset.letterId===letter.id));status.textContent=mode==='write'?`اتبعي حرف ${letter.name} بإصبعك.`:`لوّني حرف ${letter.name}.`;drawGuide();onSpeak?.(`حرف ${letter.name}`);
  }
  renderLetterGrid(picker,chooseLetter,state.letter.id);drawGuide();
}

function renderListening(host,{onSpeak}){
  const quiz=node('div','mashaal-arabic-listen');
  const controls=node('div','mashaal-arabic-listen-controls');
  const hear=node('button','mashaal-arabic-listen-hear','🔊 اسمعي اسم الحرف');hear.type='button';
  const status=node('p','mashaal-arabic-listen-status','اسمعي اسم الحرف ثم اختاريه.');
  const choices=node('div','mashaal-arabic-listen-choices');
  controls.append(hear,status);quiz.append(controls,choices);host.appendChild(quiz);
  let index=0,target=MASHAAL_ARABIC_LETTERS[0],timer=null;

  function shuffled(items){return [...items].sort(()=>Math.random()-.5);}
  function speakTarget(){onSpeak?.(`اختاري حرف ${target.name}. ${target.name}. مثال: ${target.exampleWord}.`);}
  function round(){
    target=MASHAAL_ARABIC_LETTERS[index%MASHAAL_ARABIC_LETTERS.length];index+=1;choices.innerHTML='';status.textContent='اسمعي اسم الحرف ثم اختاريه.';
    const targetIndex=MASHAAL_ARABIC_LETTERS.indexOf(target);
    const options=shuffled([target,MASHAAL_ARABIC_LETTERS[(targetIndex+5)%28],MASHAAL_ARABIC_LETTERS[(targetIndex+11)%28],MASHAAL_ARABIC_LETTERS[(targetIndex+19)%28]]);
    for(const letter of options){
      const button=letterButton(letter);button.classList.add('mashaal-arabic-listen-choice');
      button.addEventListener('click',()=>{if(letter.id!==target.id){button.dataset.outcome='wrong';status.textContent='مو هذا، اسمعي مرة ثانية.';speakTarget();return;}button.dataset.outcome='correct';status.textContent='ممتاز!';timer=setTimeout(()=>{round();speakTarget();},650);});
      choices.appendChild(button);
    }
  }
  hear.addEventListener('click',speakTarget);round();setTimeout(speakTarget,100);
  return ()=>{if(timer)clearTimeout(timer);};
}

function renderWords(host,{onSpeak,initialLetterId}){
  const wrap=node('div','mashaal-arabic-words-view');
  const picker=node('div','mashaal-arabic-practice-picker');
  const words=node('div','mashaal-arabic-word-cards');
  wrap.append(picker,words);host.appendChild(wrap);
  function show(letter){
    picker.querySelectorAll('[data-letter-id]').forEach(item=>item.dataset.selected=String(item.dataset.letterId===letter.id));words.innerHTML='';
    const title=node('h3','',`كلمات حرف ${letter.name}`);words.appendChild(title);
    for(const word of letter.words){const button=node('button','mashaal-arabic-word-card');button.type='button';button.append(node('strong','',word),node('small','','المسي واسمعي'));button.addEventListener('click',()=>onSpeak?.(word));words.appendChild(button);}
  }
  const initial=getMashaalArabicLetter(initialLetterId)||MASHAAL_ARABIC_LETTERS[0];renderLetterGrid(picker,show,initial.id);show(initial);
}

const STORY_ITEMS=Object.freeze([
  Object.freeze({activityId:'kg3-interactive-story-morning-01',title:'قصة مشاعل',subtitle:'اختاري وكمّلي القصة'}),
  Object.freeze({activityId:'kg3-open-seed-journey-01',title:'مغامرة جمع البذور',subtitle:'رتبي مشاهد الرحلة'}),
  Object.freeze({activityId:'kg3-open-tinku-night-01',title:'قصة تينكو الليلية',subtitle:'رتبي لقاءات تينكو'})
]);
const GAME_ITEMS=Object.freeze([
  Object.freeze({activityId:'kg3-letter-hunt-ba-01',title:'مدينة الحروف',subtitle:'صيد الأصوات والحروف'}),
  Object.freeze({activityId:'kg3-memory-match-01',title:'لعبة الذاكرة',subtitle:'طابقي الصور المتشابهة'}),
  Object.freeze({activityId:'kg3-picture-puzzle-01',title:'بزل الصور',subtitle:'ركّبي الصورة من القطع'})
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

export function mountMashaalArabicSection(host,sectionId,{onSpeak,onSwitchSection,onOpenActivity,initialLetterId}={}){
  if(!host)return Object.freeze({destroy(){}});
  host.innerHTML='';
  const section=getMashaalArabicSection(sectionId)||MASHAAL_ARABIC_SECTIONS[0];
  renderSectionIntro(host,section);
  let cleanup=()=>{};
  if(section.id==='letters')renderLetterExplorer(host,{onSpeak,onSwitchSection});
  else if(section.id==='write')mountCanvasPractice(host,{mode:'write',onSpeak,initialLetterId});
  else if(section.id==='color')mountCanvasPractice(host,{mode:'color',onSpeak,initialLetterId});
  else if(section.id==='listen')cleanup=renderListening(host,{onSpeak})||cleanup;
  else if(section.id==='words')renderWords(host,{onSpeak,initialLetterId});
  else if(section.id==='stories')renderLinkedActivities(host,STORY_ITEMS,onOpenActivity);
  else if(section.id==='games')renderLinkedActivities(host,GAME_ITEMS,onOpenActivity);
  return Object.freeze({destroy(){cleanup();host.innerHTML='';}});
}
