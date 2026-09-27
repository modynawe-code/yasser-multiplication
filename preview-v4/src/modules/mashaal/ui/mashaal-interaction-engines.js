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
