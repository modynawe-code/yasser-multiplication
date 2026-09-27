import { createMashaalChoiceVisual } from './mashaal-visuals.js';

export function buildMashaalMemoryDeck(items,{random=Math.random}={}){
  const source=[...new Set((items||[]).map(String).filter(Boolean))];
  const deck=source.flatMap((pair,index)=>[
    {id:`${pair}-a-${index}`,pair,visualKey:pair},
    {id:`${pair}-b-${index}`,pair,visualKey:pair}
  ]);
  for(let index=deck.length-1;index>0;index--){
    const target=Math.max(0,Math.min(index,Math.floor(Number(random())*(index+1))));
    [deck[index],deck[target]]=[deck[target],deck[index]];
  }
  return deck;
}

export function addMashaalSequenceValue(sequence,value){
  const next=[...(sequence||[])],token=String(value);
  if(!token||next.includes(token))return next;
  next.push(token);
  return next;
}

export function mashaalTraceIsComplete(reached,total,{minimumRatio=.75}={}){
  const safeTotal=Math.max(1,Number(total)||1),safeReached=Math.max(0,Number(reached)||0);
  return safeReached>=safeTotal-1&&safeReached/safeTotal>=minimumRatio;
}

export function isMashaalLetterHuntTarget(value,targets=[]){
  return new Set((targets||[]).map(String)).has(String(value));
}

export function canAddMashaalKitchenItem(current,target){
  const safeCurrent=Math.max(0,Number(current)||0),safeTarget=Math.max(0,Number(target)||0);
  return safeCurrent<safeTarget;
}

export function isMashaalHabitatMatch(animal,habitat,pairs={}){
  return String(pairs?.[String(animal)]||'')===String(habitat||'');
}

export function isMashaalAnimalSortMatch(animal,bin,pairs={}){
  return String(pairs?.[String(animal)]||'')===String(bin||'');
}

export function isMashaalColorMixCorrect(selection,correctPair=[]){
  const selected=[...(selection||[])].map(String).sort();
  const correct=[...(correctPair||[])].map(String).sort();
  return selected.length===correct.length&&selected.every((value,index)=>value===correct[index]);
}

export function moveMashaalMaze(position,direction,{size=5,walls=[]}={}){
  const safeSize=Math.max(2,Number(size)||5),[row,col]=Array.isArray(position)?position:[0,0];
  const deltas={up:[-1,0],down:[1,0],left:[0,-1],right:[0,1]},delta=deltas[String(direction)]||[0,0];
  const next=[row+delta[0],col+delta[1]];
  if(next[0]<0||next[1]<0||next[0]>=safeSize||next[1]>=safeSize)return [row,col];
  const blocked=new Set((walls||[]).map(String));
  if(blocked.has(next[0]+','+next[1]))return [row,col];
  return next;
}

export function createMashaalPuzzleOrder(total){
  const count=Math.max(4,Number(total)||4),order=Array.from({length:count},(_,index)=>index);
  if(count===4)return [2,0,3,1];
  return [...order.slice(1),order[0]];
}

export function swapMashaalPuzzleTiles(order,first,second){
  const next=[...(order||[])],a=Number(first),b=Number(second);
  if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>=next.length||b>=next.length||a===b)return next;
  [next[a],next[b]]=[next[b],next[a]];
  return next;
}

export function isMashaalPuzzleSolved(order){
  return (order||[]).every((value,index)=>Number(value)===index);
}

function visualCard(choice,viewModel,className){
  const button=document.createElement('button');button.type='button';button.className=className;button.dataset.value=choice.value;button.setAttribute('aria-label',choice.label);
  const visual=document.createElement('span');visual.className='mashaal-interaction-card-visual';visual.appendChild(createMashaalChoiceVisual(choice.visualKey,viewModel));
  const label=document.createElement('span');label.className='mashaal-interaction-card-label';label.textContent=choice.label;button.append(visual,label);
  return button;
}

export function mountMashaalDragSequence(host,viewModel,{onSubmit}={}){
  host.innerHTML='';host.classList.add('mashaal-interaction-host','mashaal-drag-sequence-host');
  let order=[],destroyed=false,suppressClick=false;
  const answer=document.createElement('div');answer.className='mashaal-drop-zone';answer.setAttribute('aria-label','منطقة الترتيب');
  const tray=document.createElement('div');tray.className='mashaal-drag-tray';
  host.append(answer,tray);

  function renderAnswer(){
    answer.innerHTML='';
    for(let index=0;index<viewModel.correctValues.length;index++){
      const slot=document.createElement('button');slot.type='button';slot.className='mashaal-sequence-slot';
      const value=order[index];
      if(value){
        const choice=viewModel.choices.find(item=>item.value===value);
        slot.dataset.filled='true';slot.setAttribute('aria-label',`إزالة ${choice?.label||value} من الترتيب`);
        slot.appendChild(createMashaalChoiceVisual(choice?.visualKey||value,viewModel,{compact:true}));
        const badge=document.createElement('b');badge.textContent=String(index+1);slot.appendChild(badge);
        slot.addEventListener('click',()=>{order=order.filter(item=>item!==value);render();});
      }else{
        slot.disabled=true;slot.setAttribute('aria-label',`المكان ${index+1}`);
        const number=document.createElement('span');number.textContent=String(index+1);slot.appendChild(number);
      }
      answer.appendChild(slot);
    }
  }

  function add(value){
    if(destroyed)return;
    order=addMashaalSequenceValue(order,value);
    render();
    if(order.length===viewModel.correctValues.length)onSubmit?.([...order]);
  }

  function bindDrag(button,value){
    let startX=0,startY=0,dragging=false;
    button.addEventListener('pointerdown',event=>{
      if(button.disabled)return;
      startX=event.clientX;startY=event.clientY;dragging=true;suppressClick=false;
      button.setPointerCapture?.(event.pointerId);button.classList.add('dragging');
    });
    button.addEventListener('pointermove',event=>{
      if(!dragging)return;
      const dx=event.clientX-startX,dy=event.clientY-startY;
      if(Math.hypot(dx,dy)>8)suppressClick=true;
      button.style.transform=`translate(${dx}px,${dy}px) scale(1.04)`;
    });
    const end=event=>{
      if(!dragging)return;dragging=false;button.classList.remove('dragging');button.style.transform='';
      try{button.releasePointerCapture?.(event.pointerId);}catch{}
      const target=document.elementFromPoint?.(event.clientX,event.clientY);
      if(suppressClick&&target?.closest?.('.mashaal-drop-zone'))add(value);
    };
    button.addEventListener('pointerup',end);button.addEventListener('pointercancel',end);
    button.addEventListener('click',()=>{if(suppressClick){suppressClick=false;return;}add(value);});
  }

  function render(){
    renderAnswer();tray.innerHTML='';
    for(const choice of viewModel.choices){
      const button=visualCard(choice,viewModel,'mashaal-drag-card');
      button.disabled=order.includes(choice.value);
      if(button.disabled)button.setAttribute('aria-disabled','true');
      bindDrag(button,choice.value);tray.appendChild(button);
    }
  }

  render();
  return Object.freeze({
    reset(){order=[];render();},
    destroy(){destroyed=true;host.classList.remove('mashaal-interaction-host','mashaal-drag-sequence-host');host.innerHTML='';}
  });
}

export function mountMashaalMemoryMatch(host,viewModel,{onComplete,random=Math.random}={}){
  host.innerHTML='';host.classList.add('mashaal-interaction-host','mashaal-memory-host');
  const deck=buildMashaalMemoryDeck(viewModel.stimulus?.items||[],{random});
  let open=[],matched=new Set(),locked=false,timer=null,destroyed=false;
  const grid=document.createElement('div');grid.className='mashaal-memory-grid';host.appendChild(grid);

  function conceal(){
    for(const id of open){
      const button=grid.querySelector(`[data-card-id="${CSS.escape(id)}"]`);
      if(button&&!matched.has(id)){button.dataset.open='false';button.setAttribute('aria-pressed','false');}
    }
    open=[];locked=false;
  }

  function reveal(button,card){
    if(destroyed||locked||matched.has(card.id)||open.includes(card.id))return;
    button.dataset.open='true';button.setAttribute('aria-pressed','true');open.push(card.id);
    if(open.length<2)return;
    const first=deck.find(item=>item.id===open[0]),second=deck.find(item=>item.id===open[1]);
    if(first?.pair===second?.pair){
      matched.add(first.id);matched.add(second.id);
      for(const id of open){const node=grid.querySelector(`[data-card-id="${CSS.escape(id)}"]`);if(node)node.dataset.matched='true';}
      open=[];
      if(matched.size===deck.length)onComplete?.();
      return;
    }
    locked=true;timer=setTimeout(conceal,650);
  }

  for(const card of deck){
    const button=document.createElement('button');button.type='button';button.className='mashaal-memory-card';button.dataset.cardId=card.id;button.dataset.open='false';button.setAttribute('aria-pressed','false');button.setAttribute('aria-label','بطاقة ذاكرة');
    const back=document.createElement('span');back.className='mashaal-memory-back';back.textContent='؟';
    const face=document.createElement('span');face.className='mashaal-memory-face';face.appendChild(createMashaalChoiceVisual(card.visualKey,viewModel));
    button.append(back,face);button.addEventListener('click',()=>reveal(button,card));grid.appendChild(button);
  }

  return Object.freeze({
    reset(){if(timer)clearTimeout(timer);open=[];matched.clear();locked=false;grid.querySelectorAll('.mashaal-memory-card').forEach(button=>{button.dataset.open='false';delete button.dataset.matched;button.setAttribute('aria-pressed','false');});},
    destroy(){destroyed=true;if(timer)clearTimeout(timer);host.classList.remove('mashaal-interaction-host','mashaal-memory-host');host.innerHTML='';}
  });
}

export function mountMashaalLetterHunt(host,viewModel,{onComplete}={}){
  host.innerHTML='';host.classList.add('mashaal-interaction-host','mashaal-letter-hunt-host');
  const targets=new Set((viewModel.stimulus?.targets||[]).map(String));
  let found=new Set(),destroyed=false;
  const banner=document.createElement('div');banner.className='mashaal-letter-hunt-banner';
  const letter=document.createElement('strong');letter.textContent=viewModel.stimulus?.sound||'';
  const copy=document.createElement('span');copy.textContent='اصيدي الأشياء اللي تبدأ بهذا الصوت';
  banner.append(letter,copy);
  const field=document.createElement('div');field.className='mashaal-letter-hunt-field';
  const status=document.createElement('p');status.className='mashaal-hunt-status';status.setAttribute('aria-live','polite');
  host.append(banner,field,status);

  function updateStatus(message=''){
    const left=Math.max(0,targets.size-found.size);
    status.textContent=message||(left?'باقي '+left:'لقيتيها كلها!');
  }
  for(const choice of viewModel.choices){
    const button=visualCard(choice,viewModel,'mashaal-hunt-card');button.dataset.huntValue=choice.value;
    button.addEventListener('click',()=>{
      if(destroyed||found.has(choice.value))return;
      if(isMashaalLetterHuntTarget(choice.value,targets)){
        found.add(choice.value);button.dataset.found='true';button.disabled=true;updateStatus('ممتاز!');
        if(found.size===targets.size)onComplete?.();
      }else{
        button.dataset.miss='true';updateStatus('مو هذا، دوري على صوت '+(viewModel.stimulus?.sound||''));
        setTimeout(()=>{if(!destroyed)delete button.dataset.miss;},420);
      }
    });
    field.appendChild(button);
  }
  updateStatus();
  return Object.freeze({
    reset(){found.clear();field.querySelectorAll('button').forEach(button=>{button.disabled=false;delete button.dataset.found;delete button.dataset.miss;});updateStatus();},
    destroy(){destroyed=true;host.classList.remove('mashaal-interaction-host','mashaal-letter-hunt-host');host.innerHTML='';}
  });
}

export function mountMashaalKitchenCount(host,viewModel,{onComplete}={}){
  host.innerHTML='';host.classList.add('mashaal-interaction-host','mashaal-kitchen-count-host');
  const target=Math.max(1,Number(viewModel.stimulus?.count)||1);
  const available=Math.max(target,Number(viewModel.stimulus?.available)||target);
  const item=String(viewModel.stimulus?.item||'apple');
  let placed=0,destroyed=false,suppressClick=false;
  const counter=document.createElement('div');counter.className='mashaal-kitchen-counter';counter.setAttribute('aria-live','polite');
  const bowl=document.createElement('div');bowl.className='mashaal-kitchen-bowl';bowl.setAttribute('aria-label','الطبق');
  const bowlItems=document.createElement('div');bowlItems.className='mashaal-kitchen-bowl-items';bowl.appendChild(bowlItems);
  const tray=document.createElement('div');tray.className='mashaal-kitchen-tray';
  host.append(counter,bowl,tray);

  function updateCounter(){counter.textContent=placed+' من '+target;}
  function finishIfReady(){if(placed===target)onComplete?.();}
  function add(button){
    if(destroyed||button.disabled||!canAddMashaalKitchenItem(placed,target))return;
    placed+=1;button.disabled=true;button.dataset.used='true';
    const mini=createMashaalChoiceVisual(item,viewModel,{compact:true});mini.classList?.add?.('mashaal-kitchen-placed-item');bowlItems.appendChild(mini);
    updateCounter();finishIfReady();
  }
  function bindIngredient(button){
    let dragging=false,startX=0,startY=0;
    button.addEventListener('pointerdown',event=>{if(button.disabled)return;dragging=true;suppressClick=false;startX=event.clientX;startY=event.clientY;button.setPointerCapture?.(event.pointerId);button.classList.add('dragging');});
    button.addEventListener('pointermove',event=>{if(!dragging)return;const dx=event.clientX-startX,dy=event.clientY-startY;if(Math.hypot(dx,dy)>8)suppressClick=true;button.style.transform='translate('+dx+'px,'+dy+'px) scale(1.05)';});
    const end=event=>{if(!dragging)return;dragging=false;button.classList.remove('dragging');button.style.transform='';try{button.releasePointerCapture?.(event.pointerId);}catch{}const targetNode=document.elementFromPoint?.(event.clientX,event.clientY);if(suppressClick&&targetNode?.closest?.('.mashaal-kitchen-bowl'))add(button);};
    button.addEventListener('pointerup',end);button.addEventListener('pointercancel',end);
    button.addEventListener('click',()=>{if(suppressClick){suppressClick=false;return;}add(button);});
  }
  for(let index=0;index<available;index++){
    const button=document.createElement('button');button.type='button';button.className='mashaal-kitchen-item';button.setAttribute('aria-label','تفاحة '+(index+1));button.appendChild(createMashaalChoiceVisual(item,viewModel));bindIngredient(button);tray.appendChild(button);
  }
  updateCounter();
  return Object.freeze({
    reset(){placed=0;bowlItems.innerHTML='';tray.querySelectorAll('button').forEach(button=>{button.disabled=false;delete button.dataset.used;button.style.transform='';});updateCounter();},
    destroy(){destroyed=true;host.classList.remove('mashaal-interaction-host','mashaal-kitchen-count-host');host.innerHTML='';}
  });
}

export function mountMashaalAnimalHabitat(host,viewModel,{onComplete}={}){
  host.innerHTML='';host.classList.add('mashaal-interaction-host','mashaal-animal-habitat-host');
  const animals=[...(viewModel.stimulus?.animals||[])],habitats=[...(viewModel.stimulus?.habitats||[])],pairs={...(viewModel.stimulus?.pairs||{})};
  let selectedAnimal=null,matched=new Set(),destroyed=false;
  const status=document.createElement('p');status.className='mashaal-habitat-status';status.setAttribute('aria-live','polite');status.textContent='اختاري حيوان ثم مكانه.';
  const animalGrid=document.createElement('div');animalGrid.className='mashaal-animal-grid';
  const habitatGrid=document.createElement('div');habitatGrid.className='mashaal-habitat-grid';
  host.append(animalGrid,habitatGrid,status);

  function choiceFor(value){return viewModel.choices.find(choice=>choice.value===value)||{value,label:value,visualKey:value};}
  function clearAnimalSelection(){animalGrid.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed','false'));selectedAnimal=null;}
  function match(animal,habitat){
    if(destroyed||matched.has(animal))return;
    if(!isMashaalHabitatMatch(animal,habitat,pairs)){status.textContent='مو مكانه، جرّبي مكان ثاني.';return;}
    matched.add(animal);
    const animalButton=animalGrid.querySelector('[data-animal="'+animal+'"]');
    const habitatButton=habitatGrid.querySelector('[data-habitat="'+habitat+'"]');
    if(animalButton){animalButton.dataset.matched='true';animalButton.disabled=true;}
    if(habitatButton){habitatButton.dataset.matched='true';habitatButton.disabled=true;}
    clearAnimalSelection();status.textContent='ممتاز!';
    if(matched.size===animals.length)onComplete?.();
  }

  for(const animal of animals){
    const button=visualCard(choiceFor(animal),viewModel,'mashaal-animal-card');button.dataset.animal=animal;button.setAttribute('aria-pressed','false');
    let dragging=false,startX=0,startY=0,moved=false;
    button.addEventListener('pointerdown',event=>{if(button.disabled)return;dragging=true;moved=false;startX=event.clientX;startY=event.clientY;button.setPointerCapture?.(event.pointerId);button.classList.add('dragging');});
    button.addEventListener('pointermove',event=>{if(!dragging)return;const dx=event.clientX-startX,dy=event.clientY-startY;if(Math.hypot(dx,dy)>8)moved=true;button.style.transform='translate('+dx+'px,'+dy+'px) scale(1.04)';});
    const end=event=>{if(!dragging)return;dragging=false;button.classList.remove('dragging');button.style.transform='';try{button.releasePointerCapture?.(event.pointerId);}catch{}if(moved){const node=document.elementFromPoint?.(event.clientX,event.clientY)?.closest?.('[data-habitat]');if(node)match(animal,node.dataset.habitat);}};
    button.addEventListener('pointerup',end);button.addEventListener('pointercancel',end);
    button.addEventListener('click',()=>{if(moved){moved=false;return;}if(button.disabled)return;clearAnimalSelection();selectedAnimal=animal;button.setAttribute('aria-pressed','true');status.textContent='الحين اختاري مكانه.';});
    animalGrid.appendChild(button);
  }
  for(const habitat of habitats){
    const button=visualCard(choiceFor(habitat),viewModel,'mashaal-habitat-card');button.dataset.habitat=habitat;
    button.addEventListener('click',()=>{if(selectedAnimal)match(selectedAnimal,habitat);else status.textContent='اختاري الحيوان أول.';});
    habitatGrid.appendChild(button);
  }
  return Object.freeze({
    reset(){matched.clear();clearAnimalSelection();animalGrid.querySelectorAll('button').forEach(button=>{button.disabled=false;delete button.dataset.matched;});habitatGrid.querySelectorAll('button').forEach(button=>{button.disabled=false;delete button.dataset.matched;});status.textContent='اختاري حيوان ثم مكانه.';},
    destroy(){destroyed=true;host.classList.remove('mashaal-interaction-host','mashaal-animal-habitat-host');host.innerHTML='';}
  });
}

export function mountMashaalColorMixLab(host,viewModel,{onComplete}={}){
  host.innerHTML='';host.classList.add('mashaal-interaction-host','mashaal-color-lab-host');
  const colors=[...(viewModel.stimulus?.colors||[])],correctPair=[...(viewModel.stimulus?.correctPair||[])],target=String(viewModel.stimulus?.target||'orange');
  let selected=[],destroyed=false,timer=null;
  const goal=document.createElement('div');goal.className='mashaal-color-goal';
  const goalText=document.createElement('span');goalText.textContent='نبغى نسوي';
  goal.append(goalText,createMashaalChoiceVisual(target,viewModel,{compact:true}));
  const beaker=document.createElement('div');beaker.className='mashaal-color-beaker';
  const mixture=document.createElement('div');mixture.className='mashaal-color-mixture';beaker.appendChild(mixture);
  const tray=document.createElement('div');tray.className='mashaal-color-tray';
  const status=document.createElement('p');status.className='mashaal-color-status';status.setAttribute('aria-live','polite');status.textContent='اختاري لونين.';
  host.append(goal,beaker,tray,status);

  function choiceFor(value){return viewModel.choices.find(choice=>choice.value===value)||{value,label:value,visualKey:value};}
  function resetSelection(){selected=[];mixture.innerHTML='';delete beaker.dataset.result;tray.querySelectorAll('button').forEach(button=>{button.disabled=false;button.setAttribute('aria-pressed','false');});}
  function choose(color,button){
    if(destroyed||button.disabled||selected.includes(color)||selected.length>=2)return;
    selected.push(color);button.setAttribute('aria-pressed','true');button.disabled=true;mixture.appendChild(createMashaalChoiceVisual(color,viewModel,{compact:true}));
    if(selected.length<2){status.textContent='اختاري اللون الثاني.';return;}
    if(isMashaalColorMixCorrect(selected,correctPair)){beaker.dataset.result=target;mixture.replaceChildren(createMashaalChoiceVisual(target,viewModel));status.textContent='صح! صار برتقالي.';onComplete?.();return;}
    status.textContent='طلع لون مختلف، جرّبي لونين ثانيين.';timer=setTimeout(()=>{if(!destroyed){resetSelection();status.textContent='اختاري لونين.';}},650);
  }
  for(const color of colors){const choice=choiceFor(color),button=visualCard(choice,viewModel,'mashaal-color-pot');button.setAttribute('aria-pressed','false');button.addEventListener('click',()=>choose(color,button));tray.appendChild(button);}
  return Object.freeze({
    reset(){if(timer)clearTimeout(timer);resetSelection();status.textContent='اختاري لونين.';},
    destroy(){destroyed=true;if(timer)clearTimeout(timer);host.classList.remove('mashaal-interaction-host','mashaal-color-lab-host');host.innerHTML='';}
  });
}

export function mountMashaalInteractiveStory(host,viewModel,{onComplete,onSpeak}={}){
  host.innerHTML='';host.classList.add('mashaal-interaction-host','mashaal-story-host');
  const steps=[...(viewModel.stimulus?.steps||[])];
  let index=0,destroyed=false,completed=false;
  const progress=document.createElement('div');progress.className='mashaal-story-progress';
  const scene=document.createElement('div');scene.className='mashaal-story-scene';
  const prompt=document.createElement('h3');prompt.className='mashaal-story-prompt';
  const choices=document.createElement('div');choices.className='mashaal-story-choices';
  const status=document.createElement('p');status.className='mashaal-story-status';status.setAttribute('aria-live','polite');
  host.append(progress,scene,prompt,choices,status);

  function choiceFor(value){return viewModel.choices.find(choice=>choice.value===value)||{value,label:value,visualKey:value};}
  function renderStep(){
    if(destroyed||completed)return;
    const step=steps[index];if(!step){completed=true;onComplete?.();return;}
    progress.textContent=(index+1)+' / '+steps.length;
    scene.replaceChildren(createMashaalChoiceVisual(step.scene,viewModel));
    prompt.textContent=step.promptAr||'وش يصير بعد؟';choices.innerHTML='';status.textContent='';
    for(const value of step.choices||[]){
      const choice=choiceFor(value),button=visualCard(choice,viewModel,'mashaal-story-choice');button.dataset.storyValue=value;
      button.addEventListener('click',()=>{
        if(destroyed||completed)return;
        if(String(value)!==String(step.correctChoice)){button.dataset.miss='true';status.textContent='جربي مرة ثانية.';setTimeout(()=>{if(!destroyed)delete button.dataset.miss;},420);return;}
        button.dataset.correct='true';choices.querySelectorAll('button').forEach(item=>item.disabled=true);status.textContent='ممتاز!';
        index+=1;
        if(index>=steps.length){completed=true;scene.replaceChildren(createMashaalChoiceVisual('breakfast',viewModel));prompt.textContent='اكتملت قصة الصباح.';choices.innerHTML='';progress.textContent=steps.length+' / '+steps.length;onComplete?.();return;}
        const next=steps[index];setTimeout(()=>{if(!destroyed&&!completed){renderStep();onSpeak?.(next.audioPromptAr||next.promptAr||'');}},350);
      });
      choices.appendChild(button);
    }
  }
  renderStep();
  return Object.freeze({
    reset(){index=0;completed=false;renderStep();},
    destroy(){destroyed=true;host.classList.remove('mashaal-interaction-host','mashaal-story-host');host.innerHTML='';}
  });
}

export function mountMashaalAnimalMaze(host,viewModel,{onComplete}={}){
  host.innerHTML='';host.classList.add('mashaal-interaction-host','mashaal-maze-host');
  const size=Math.max(2,Number(viewModel.stimulus?.size)||5),walls=[...(viewModel.stimulus?.walls||[])];
  const finish=[...(viewModel.stimulus?.finish||[size-1,size-1])];
  const start=[...(viewModel.stimulus?.start||[0,0])];
  const animal=String(viewModel.stimulus?.animal||'duck'),goal=String(viewModel.stimulus?.goal||'pond');
  let position=[...start],completed=false,destroyed=false,moves=0;
  const board=document.createElement('div');board.className='mashaal-maze-board';board.style.setProperty('--maze-size',String(size));
  const controls=document.createElement('div');controls.className='mashaal-maze-controls';
  const status=document.createElement('p');status.className='mashaal-maze-status';status.setAttribute('aria-live','polite');
  host.append(board,controls,status);

  function key(row,col){return row+','+col;}
  function same(a,b){return Number(a?.[0])===Number(b?.[0])&&Number(a?.[1])===Number(b?.[1]);}
  function renderBoard(){
    board.innerHTML='';
    for(let row=0;row<size;row++)for(let col=0;col<size;col++){
      const cell=document.createElement('div');cell.className='mashaal-maze-cell';cell.dataset.row=String(row);cell.dataset.col=String(col);
      if(walls.includes(key(row,col))){cell.dataset.wall='true';cell.setAttribute('aria-hidden','true');}
      if(same([row,col],finish)){cell.dataset.goal='true';cell.appendChild(createMashaalChoiceVisual(goal,viewModel,{compact:true}));}
      if(same([row,col],position)){cell.dataset.player='true';cell.appendChild(createMashaalChoiceVisual(animal,viewModel,{compact:true}));}
      board.appendChild(cell);
    }
    status.textContent=completed?'وصلت البطة للبركة!':'الحركات: '+moves;
  }
  function move(direction){
    if(destroyed||completed)return;
    const next=moveMashaalMaze(position,direction,{size,walls});
    if(same(next,position)){status.textContent='الطريق مقفل من هنا.';return;}
    position=next;moves+=1;
    if(same(position,finish)){completed=true;renderBoard();onComplete?.();return;}
    renderBoard();
  }
  for(const [direction,label] of [['up','↑'],['left','←'],['down','↓'],['right','→']]){
    const button=document.createElement('button');button.type='button';button.className='mashaal-maze-move';button.dataset.direction=direction;button.textContent=label;button.setAttribute('aria-label',direction==='up'?'فوق':direction==='down'?'تحت':direction==='left'?'يسار':'يمين');button.addEventListener('click',()=>move(direction));controls.appendChild(button);
  }
  renderBoard();
  return Object.freeze({
    reset(){position=[...start];moves=0;completed=false;renderBoard();},
    destroy(){destroyed=true;host.classList.remove('mashaal-interaction-host','mashaal-maze-host');host.innerHTML='';}
  });
}

export function mountMashaalPicturePuzzle(host,viewModel,{onComplete}={}){
  host.innerHTML='';host.classList.add('mashaal-interaction-host','mashaal-picture-puzzle-host');
  const rows=Math.max(2,Number(viewModel.stimulus?.rows)||2),cols=Math.max(2,Number(viewModel.stimulus?.cols)||2),total=rows*cols;
  const imagePath=String(viewModel.stimulus?.imagePath||'');
  let order=createMashaalPuzzleOrder(total),selected=null,completed=false,destroyed=false,moves=0;
  const preview=document.createElement('div');preview.className='mashaal-puzzle-preview';
  const previewImg=document.createElement('img');previewImg.src=imagePath;previewImg.alt='الصورة الكاملة';previewImg.decoding='async';preview.appendChild(previewImg);
  const board=document.createElement('div');board.className='mashaal-picture-puzzle-board';board.style.setProperty('--puzzle-cols',String(cols));board.style.setProperty('--puzzle-rows',String(rows));
  const status=document.createElement('p');status.className='mashaal-picture-puzzle-status';status.setAttribute('aria-live','polite');
  host.append(preview,board,status);

  function render(){
    board.innerHTML='';
    order.forEach((tileId,position)=>{
      const button=document.createElement('button');button.type='button';button.className='mashaal-picture-puzzle-tile';button.dataset.position=String(position);button.dataset.tile=String(tileId);button.setAttribute('aria-label','قطعة '+(position+1));
      const sourceRow=Math.floor(tileId/cols),sourceCol=tileId%cols;
      button.style.backgroundImage='url("'+imagePath.replace(/"/g,'')+'")';
      button.style.backgroundSize=(cols*100)+'% '+(rows*100)+'%';
      button.style.backgroundPosition=(cols===1?0:(sourceCol/(cols-1))*100)+'% '+(rows===1?0:(sourceRow/(rows-1))*100)+'%';
      if(selected===position)button.dataset.selected='true';
      button.addEventListener('click',()=>select(position));board.appendChild(button);
    });
    status.textContent=completed?'اكتملت الصورة!':'الحركات: '+moves;
  }
  function select(position){
    if(destroyed||completed)return;
    if(selected===null){selected=position;render();return;}
    if(selected===position){selected=null;render();return;}
    order=swapMashaalPuzzleTiles(order,selected,position);selected=null;moves+=1;
    if(isMashaalPuzzleSolved(order)){completed=true;render();onComplete?.();return;}
    render();
  }
  render();
  return Object.freeze({
    reset(){order=createMashaalPuzzleOrder(total);selected=null;moves=0;completed=false;render();},
    destroy(){destroyed=true;host.classList.remove('mashaal-interaction-host','mashaal-picture-puzzle-host');host.innerHTML='';}
  });
}

export function mountMashaalAnimalSort(host,viewModel,{onComplete}={}){
  host.innerHTML='';host.classList.add('mashaal-interaction-host','mashaal-animal-sort-host');
  const animals=[...(viewModel.stimulus?.animals||[])],bins=[...(viewModel.stimulus?.bins||[])],pairs={...(viewModel.stimulus?.pairs||{})};
  let selectedAnimal=null,placed=new Map(),destroyed=false;
  const tray=document.createElement('div');tray.className='mashaal-animal-sort-tray';
  const binGrid=document.createElement('div');binGrid.className='mashaal-animal-sort-bins';
  const status=document.createElement('p');status.className='mashaal-animal-sort-status';status.setAttribute('aria-live','polite');status.textContent='اختاري الحيوان ثم مكانه.';
  host.append(tray,binGrid,status);

  function choiceFor(value){return viewModel.choices.find(choice=>choice.value===value)||{value,label:value,visualKey:value};}
  function binLabel(bin){return bin==='farm'?'المزرعة':'البرية';}
  function clearSelection(){selectedAnimal=null;tray.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed','false'));}
  function place(animal,bin){
    if(destroyed||placed.has(animal))return;
    if(!isMashaalAnimalSortMatch(animal,bin,pairs)){status.textContent='جرّبي المكان الثاني.';return;}
    placed.set(animal,bin);
    const animalButton=tray.querySelector('[data-sort-animal="'+animal+'"]');if(animalButton){animalButton.disabled=true;animalButton.dataset.placed='true';}
    const target=binGrid.querySelector('[data-sort-bin="'+bin+'"] .mashaal-animal-sort-bin-items');
    if(target){const item=document.createElement('span');item.className='mashaal-animal-sort-placed';item.appendChild(createMashaalChoiceVisual(animal,viewModel,{compact:true}));target.appendChild(item);}
    clearSelection();status.textContent='صح!';if(placed.size===animals.length)onComplete?.();
  }

  for(const animal of animals){
    const button=visualCard(choiceFor(animal),viewModel,'mashaal-animal-sort-card');button.dataset.sortAnimal=animal;button.setAttribute('aria-pressed','false');
    let dragging=false,moved=false,startX=0,startY=0;
    button.addEventListener('pointerdown',event=>{if(button.disabled)return;dragging=true;moved=false;startX=event.clientX;startY=event.clientY;button.setPointerCapture?.(event.pointerId);button.classList.add('dragging');});
    button.addEventListener('pointermove',event=>{if(!dragging)return;const dx=event.clientX-startX,dy=event.clientY-startY;if(Math.hypot(dx,dy)>8)moved=true;button.style.transform='translate('+dx+'px,'+dy+'px) scale(1.04)';});
    const end=event=>{if(!dragging)return;dragging=false;button.classList.remove('dragging');button.style.transform='';try{button.releasePointerCapture?.(event.pointerId);}catch{}if(moved){const binNode=document.elementFromPoint?.(event.clientX,event.clientY)?.closest?.('[data-sort-bin]');if(binNode)place(animal,binNode.dataset.sortBin);}};
    button.addEventListener('pointerup',end);button.addEventListener('pointercancel',end);
    button.addEventListener('click',()=>{if(moved){moved=false;return;}if(button.disabled)return;clearSelection();selectedAnimal=animal;button.setAttribute('aria-pressed','true');status.textContent='الحين اختاري المزرعة أو البرية.';});
    tray.appendChild(button);
  }
  for(const bin of bins){
    const button=document.createElement('button');button.type='button';button.className='mashaal-animal-sort-bin';button.dataset.sortBin=bin;button.setAttribute('aria-label',binLabel(bin));
    const title=document.createElement('strong');title.textContent=binLabel(bin);
    const items=document.createElement('span');items.className='mashaal-animal-sort-bin-items';button.append(title,items);
    button.addEventListener('click',()=>{if(selectedAnimal)place(selectedAnimal,bin);else status.textContent='اختاري الحيوان أول.';});binGrid.appendChild(button);
  }
  return Object.freeze({
    reset(){placed.clear();clearSelection();tray.querySelectorAll('button').forEach(button=>{button.disabled=false;delete button.dataset.placed;button.style.transform='';});binGrid.querySelectorAll('.mashaal-animal-sort-bin-items').forEach(node=>node.innerHTML='');status.textContent='اختاري الحيوان ثم مكانه.';},
    destroy(){destroyed=true;host.classList.remove('mashaal-interaction-host','mashaal-animal-sort-host');host.innerHTML='';}
  });
}

export function mountMashaalTracing(host,viewModel,{onComplete}={}){
  host.innerHTML='';host.classList.add('mashaal-interaction-host','mashaal-trace-host');
  let completed=false,active=false,reached=0,tapIndex=0;
  const board=document.createElement('div');board.className='mashaal-trace-board';
  board.innerHTML='<svg class="mashaal-trace-svg" viewBox="0 0 400 240" role="img" aria-label="مسار تتبع متعرج"><path class="mashaal-trace-guide" d="M30 120 C80 20 140 220 200 120 S320 20 370 120"></path><polyline class="mashaal-trace-trail" points=""></polyline></svg>';
  const status=document.createElement('p');status.className='mashaal-trace-status';status.setAttribute('aria-live','polite');status.textContent='ابدئي من الدائرة واتبعي الطريق حتى النجمة.';
  const fallback=document.createElement('div');fallback.className='mashaal-trace-fallback';fallback.setAttribute('aria-label','بديل اللمس');
  const fallbackLabel=document.createElement('span');fallbackLabel.textContent='أو المسِي النقاط بالترتيب:';
  const dots=document.createElement('div');dots.className='mashaal-trace-dots';fallback.append(fallbackLabel,dots);host.append(board,status,fallback);

  const svg=board.querySelector('svg'),path=board.querySelector('.mashaal-trace-guide'),trail=board.querySelector('.mashaal-trace-trail');
  const checkpoints=[];
  const total=path.getTotalLength?.()||0;
  const checkpointCount=14;
  for(let index=0;index<checkpointCount;index++){
    const point=path.getPointAtLength(total*(index/(checkpointCount-1)));checkpoints.push({x:point.x,y:point.y});
  }

  function pointForEvent(event){
    const rect=svg.getBoundingClientRect(),x=(event.clientX-rect.left)*(400/Math.max(1,rect.width)),y=(event.clientY-rect.top)*(240/Math.max(1,rect.height));return{x,y};
  }
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
  function finish(){if(completed)return;completed=true;status.textContent='ممتاز! وصلتي للنهاية.';onComplete?.();}
  function resetTrace(message='حاولي مرة ثانية وابدئي من الدائرة.'){active=false;reached=0;trail.setAttribute('points','');status.textContent=message;}
  function advance(point){
    const target=checkpoints[Math.min(reached,checkpoints.length-1)];
    if(target&&distance(point,target)<=42)reached=Math.min(checkpoints.length,reached+1);
    const existing=trail.getAttribute('points');trail.setAttribute('points',`${existing} ${point.x.toFixed(1)},${point.y.toFixed(1)}`.trim());
  }

  board.addEventListener('pointerdown',event=>{
    if(completed)return;const point=pointForEvent(event);
    if(distance(point,checkpoints[0])>48){resetTrace('ابدئي من الدائرة أولًا.');return;}
    active=true;reached=1;trail.setAttribute('points',`${point.x.toFixed(1)},${point.y.toFixed(1)}`);board.setPointerCapture?.(event.pointerId);event.preventDefault();
  });
  board.addEventListener('pointermove',event=>{if(!active||completed)return;advance(pointForEvent(event));event.preventDefault();});
  const end=event=>{
    if(!active||completed)return;active=false;try{board.releasePointerCapture?.(event.pointerId);}catch{}
    if(mashaalTraceIsComplete(reached,checkpoints.length))finish();else resetTrace();
  };
  board.addEventListener('pointerup',end);board.addEventListener('pointercancel',end);

  for(let index=0;index<5;index++){
    const button=document.createElement('button');button.type='button';button.className='mashaal-trace-dot';button.textContent=String(index+1);button.setAttribute('aria-label',`النقطة ${index+1}`);
    button.addEventListener('click',()=>{
      if(completed)return;
      if(index!==tapIndex){tapIndex=0;dots.querySelectorAll('button').forEach(item=>delete item.dataset.done);status.textContent='بالترتيب من 1 إلى 5.';return;}
      button.dataset.done='true';tapIndex+=1;if(tapIndex===5)finish();
    });dots.appendChild(button);
  }

  return Object.freeze({
    reset(){completed=false;tapIndex=0;dots.querySelectorAll('button').forEach(item=>delete item.dataset.done);resetTrace('ابدئي من الدائرة واتبعي الطريق حتى النجمة.');},
    destroy(){host.classList.remove('mashaal-interaction-host','mashaal-trace-host');host.innerHTML='';}
  });
}
