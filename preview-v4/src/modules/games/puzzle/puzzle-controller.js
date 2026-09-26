import { createPuzzleDefinition,isPuzzleSolved,puzzleBoardAspect,puzzlePiecePath } from './puzzle-engine.js';
import { ensurePuzzleShell } from './puzzle-shell.js';
import { getGameParticipant,listGameParticipants } from '../core/game-participant-registry.js';
import { createGameSessionEvents } from '../core/game-session-events.js';
import { gameHistoryService } from '../history/game-history-service.js';

const byId=id=>document.getElementById(id);
const digits=new Intl.NumberFormat('ar-SA');
const PHOTO_PUZZLE_ID='family-pixel-puzzle';
const PLAYER_THUMBNAILS=Object.freeze({
  yasser:'assets/games/puzzle/thumbnails/yasser-welcome.webp',
  khaled:'assets/games/puzzle/thumbnails/khaled.webp',
  mashaal:'assets/games/puzzle/thumbnails/mashaal.webp'
});
const PICTURES=Object.freeze({
  yasser:Object.freeze([
    Object.freeze({id:'yasser-welcome',src:'assets/visual/original/yasser/welcome.png',thumb:'assets/games/puzzle/thumbnails/yasser-welcome.webp',width:1049,height:1499}),
    Object.freeze({id:'yasser-pose-01',src:'assets/games/puzzle/yasser/pose-01.png',thumb:'assets/games/puzzle/thumbnails/yasser-pose-01.webp',width:1049,height:1499}),
    Object.freeze({id:'yasser-pose-02',src:'assets/games/puzzle/yasser/pose-02.png',thumb:'assets/games/puzzle/thumbnails/yasser-pose-02.webp',width:1448,height:1086}),
    Object.freeze({id:'yasser-pose-03',src:'assets/games/puzzle/yasser/pose-03.png',thumb:'assets/games/puzzle/thumbnails/yasser-pose-03.webp',width:1448,height:1086}),
    Object.freeze({id:'yasser-pose-04',src:'assets/games/puzzle/yasser/pose-04.png',thumb:'assets/games/puzzle/thumbnails/yasser-pose-04.webp',width:1049,height:1499}),
    Object.freeze({id:'yasser-pose-05',src:'assets/games/puzzle/yasser/pose-05.png',thumb:'assets/games/puzzle/thumbnails/yasser-pose-05.webp',width:1049,height:1499}),
    Object.freeze({id:'yasser-pose-06',src:'assets/games/puzzle/yasser/pose-06.png',thumb:'assets/games/puzzle/thumbnails/yasser-pose-06.webp',width:1448,height:1086}),
    Object.freeze({id:'yasser-pose-07',src:'assets/games/puzzle/yasser/pose-07.png',thumb:'assets/games/puzzle/thumbnails/yasser-pose-07.webp',width:1049,height:1499}),
    Object.freeze({id:'yasser-pose-08',src:'assets/games/puzzle/yasser/pose-08.png',thumb:'assets/games/puzzle/thumbnails/yasser-pose-08.webp',width:1049,height:1499})
  ]),
  khaled:Object.freeze([Object.freeze({id:'khaled-default',src:'assets/visual/original/khaled/khaled-point-thumbsup.png',thumb:PLAYER_THUMBNAILS.khaled,width:1086,height:1448})]),
  mashaal:Object.freeze([Object.freeze({id:'mashaal-default',src:'assets/mashaal/domains/language.webp',thumb:PLAYER_THUMBNAILS.mashaal,width:1024,height:1024})])
});

function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function formatTime(seconds){const value=Math.max(0,Math.floor(Number(seconds)||0));return`${digits.format(Math.floor(value/60))}:${digits.format(value%60).padStart(2,'٠')}`;}
function clearFloatStyles(button){
  button.classList.remove('fp-piece-floater');
  for(const property of ['position','left','top','width','height','z-index','transform','margin'])button.style.removeProperty(property);
}

function pieceMarkup(piece,{image,rows,columns,instance}){
  const clipId=`fp-clip-${instance}-${piece.id}`;
  const path=puzzlePiecePath(piece.edges,{tab:.09});
  const sourceX=-piece.column*100,sourceY=-piece.row*100;
  const svg=`<svg viewBox="-18 -18 136 136" preserveAspectRatio="none" role="img" aria-label="قطعة ${digits.format(piece.id+1)}"><defs><clipPath id="${clipId}"><path d="${path}"/></clipPath></defs><image href="${escapeHtml(image)}" x="${sourceX}" y="${sourceY}" width="${columns*100}" height="${rows*100}" preserveAspectRatio="none" clip-path="url(#${clipId})"/><path d="${path}" fill="none" stroke="#fff" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>`;
  return`<button class="fp-piece" type="button" data-piece-id="${piece.id}" aria-label="قطعة ${digits.format(piece.id+1)}، اسحبها لمكانها" aria-pressed="false">${svg}</button>`;
}

export function createPuzzleController({showView,onBack}={}){
  let bound=false,players=[],selectedPlayerId=null,selectedPictureId=null,size=3,definition=null,placed=[],selectedPieceId=null,startedAt=null,timerHandle=null,elapsedSeconds=0,moves=0,active=false,sequence=0;
  const gameEvents=createGameSessionEvents({gameId:PHOTO_PUZZLE_ID});

  function participants(){players=listGameParticipants();return players;}
  function participant(id){return getGameParticipant(id)||players.find(item=>item.learnerId===id)||null;}
  function selectedPlayer(){return participant(selectedPlayerId)||players[0]||null;}
  function picturesFor(player=selectedPlayer()){
    if(!player)return[];
    return PICTURES[player.learnerId]||[{id:`${player.learnerId}-default`,src:player.avatar||'',width:1,height:1}];
  }
  function selectedPicture(){const pictures=picturesFor();return pictures.find(picture=>picture.id===selectedPictureId)||pictures[0]||null;}
  function updateMessage(message){const node=byId('fpMessage');if(node)node.textContent=message;}
  function updateStats(){
    const moved=placed.filter(piece=>piece!==null).length,total=size*size;
    const progress=byId('fpProgress'),time=byId('fpTime');if(progress)progress.textContent=`${digits.format(moved)} / ${digits.format(total)}`;if(time)time.textContent=formatTime(elapsedSeconds);
  }
  function updateConfigLock(){
    for(const node of document.querySelectorAll('#fpPlayers button,#fpPictureChoices button,#puzzleGameView [data-fp-size]'))node.disabled=active;
    const start=byId('fpStart');if(start)start.textContent=active?'أعد خلط القطع':'ابدأ اللعب';
    const again=byId('fpNew');if(again)again.hidden=!definition;
  }
  function renderPlayers(){
    const host=byId('fpPlayers');if(!host)return;
    host.innerHTML=participants().map(player=>`<button class="fp-player" type="button" data-fp-player="${escapeHtml(player.learnerId)}" aria-pressed="${String(player.learnerId===selectedPlayerId)}"><img src="${escapeHtml(PLAYER_THUMBNAILS[player.learnerId]||player.avatar||'')}" alt="" loading="lazy" decoding="async"><span>${escapeHtml(player.displayName)}</span></button>`).join('');
    host.querySelectorAll('[data-fp-player]').forEach(button=>button.addEventListener('click',()=>{
      selectedPlayerId=button.dataset.fpPlayer;
      host.querySelectorAll('[data-fp-player]').forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.fpPlayer===selectedPlayerId)));
      const pictures=picturesFor(selectedPlayer());selectedPictureId=pictures[0]?.id||null;renderPictureChoices();
    }));
    if(!selectedPlayerId&&players[0])selectedPlayerId=players[0].learnerId;
    host.querySelectorAll('[data-fp-player]').forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.fpPlayer===selectedPlayerId)));
    const pictures=picturesFor();if(!pictures.some(picture=>picture.id===selectedPictureId))selectedPictureId=pictures[0]?.id||null;
    renderPictureChoices();
  }
  function renderPictureChoices(){
    const host=byId('fpPictureChoices'),player=selectedPlayer(),pictures=picturesFor(player);if(!host||!player)return;
    if(!pictures.some(picture=>picture.id===selectedPictureId))selectedPictureId=pictures[0]?.id||null;
    host.innerHTML=pictures.map((picture,index)=>`<button class="fp-picture" type="button" data-fp-picture="${escapeHtml(picture.id)}" aria-label="صورة ${escapeHtml(player.displayName)}، اختيار ${digits.format(index+1)}" aria-pressed="${String(picture.id===selectedPictureId)}"><img src="${escapeHtml(picture.thumb||picture.src)}" alt="" loading="lazy" decoding="async"><span>${digits.format(index+1)}</span></button>`).join('');
    host.querySelectorAll('[data-fp-picture]').forEach(button=>button.addEventListener('click',()=>{
      if(active)return;
      selectedPictureId=button.dataset.fpPicture;
      host.querySelectorAll('[data-fp-picture]').forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.fpPicture===selectedPictureId)));
      const picture=selectedPicture(),reference=byId('fpReference');if(reference&&picture){reference.alt=`صورة ${player.displayName} المطلوب تركيبها`;if(!reference.hidden)reference.src=picture.src;}
    }));
    const picture=selectedPicture(),reference=byId('fpReference');if(reference&&picture){reference.alt=`صورة ${player.displayName} المطلوب تركيبها`;if(!reference.hidden)reference.src=picture.src;}
  }
  function renderLevel(){
    document.querySelectorAll('#puzzleGameView [data-fp-size]').forEach(button=>{
      button.setAttribute('aria-pressed',String(Number(button.dataset.fpSize)===size));
    });
  }
  function resetDrag(button){
    clearFloatStyles(button);
    button.setAttribute('aria-pressed','false');
  }
  function selectPiece(pieceId,button){
    selectedPieceId=pieceId;
    document.querySelectorAll('#fpTray .fp-piece').forEach(node=>node.setAttribute('aria-pressed',String(Number(node.dataset.pieceId)===pieceId)));
    if(button)button.focus({preventScroll:true});
    updateMessage(`اخترت القطعة ${digits.format(pieceId+1)}. الحين اضغط مكانها في الصورة.`);
  }
  function setPiecePlaced(button,targetIndex){
    if(!active||!definition||!button)return;
    moves++;
    const targetPiece=definition.pieces[targetIndex];
    if(!targetPiece||targetPiece.id!==Number(button.dataset.pieceId)){
      updateMessage('قريب! هذي القطعة مكانها بمربع ثاني. جرّب مكانًا مختلفًا.');
      updateStats();return;
    }
    const slot=byId('fpBoard')?.querySelector(`[data-target-index="${targetIndex}"]`);if(!slot||placed[targetIndex]!==null)return;
    selectedPieceId=null;placed[targetIndex]=targetPiece.id;clearFloatStyles(button);button.disabled=true;button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',`قطعة ${digits.format(targetPiece.id+1)} في مكانها`);slot.setAttribute('aria-label',`تم تركيب القطعة ${digits.format(targetPiece.id+1)}`);slot.appendChild(button);updateStats();
    if(isPuzzleSolved(placed))finishGame();else updateMessage('صح عليك! اسحب القطعة التالية أو اضغطها ثم اضغط مكانها.');
  }
  function renderBoard(){
    const board=byId('fpBoard'),picture=selectedPicture();if(!board||!definition||!picture)return;
    board.style.setProperty('--fp-size',String(size));board.setAttribute('aria-label',`لوحة بزل ${digits.format(size)} في ${digits.format(size)}`);
    board.style.setProperty('--fp-board-aspect',puzzleBoardAspect(picture.width,picture.height).toFixed(5));
    board.innerHTML=definition.pieces.map(piece=>`<div class="fp-slot" data-target-index="${piece.id}" role="button" tabindex="0" aria-label="مكان القطعة ${digits.format(piece.id+1)}"></div>`).join('');
    board.querySelectorAll('[data-target-index]').forEach(slot=>{
      const place=()=>{if(selectedPieceId===null)return;const button=byId('fpTray')?.querySelector(`[data-piece-id="${selectedPieceId}"]`);setPiecePlaced(button,Number(slot.dataset.targetIndex));};
      slot.addEventListener('click',place);slot.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();place();}});
    });
  }
  function startDrag(event,button){
    if(!active||button.disabled||event.button!==0)return;
    event.preventDefault();
    const rect=button.getBoundingClientRect(),pieceId=Number(button.dataset.pieceId),offsetX=event.clientX-rect.left,offsetY=event.clientY-rect.top;
    sequence++;
    const drag={pieceId,button,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,offsetX,offsetY,moved:false,sequence};
    button.style.position='fixed';button.style.left=`${rect.left}px`;button.style.top=`${rect.top}px`;button.style.width=`${rect.width}px`;button.style.height=`${rect.height}px`;button.style.margin='0';button.classList.add('fp-piece-floater');
    try{button.setPointerCapture(event.pointerId);}catch{}
    const onMove=moveEvent=>{
      if(moveEvent.pointerId!==drag.pointerId)return;
      if(Math.hypot(moveEvent.clientX-drag.startX,moveEvent.clientY-drag.startY)>8)drag.moved=true;
      button.style.left=`${moveEvent.clientX-drag.offsetX}px`;button.style.top=`${moveEvent.clientY-drag.offsetY}px`;
    };
    const onEnd=endEvent=>{
      if(endEvent.pointerId!==drag.pointerId)return;
      button.removeEventListener('pointermove',onMove);button.removeEventListener('pointerup',onEnd);button.removeEventListener('pointercancel',onCancel);
      let target=null;if(drag.moved){const under=document.elementFromPoint(endEvent.clientX,endEvent.clientY);target=under?.closest?.('[data-target-index]')||null;}
      if(target)setPiecePlaced(button,Number(target.dataset.targetIndex));
      if(button.classList.contains('fp-piece-floater'))resetDrag(button);
      if(!drag.moved){resetDrag(button);selectPiece(pieceId,button);}
    };
    const onCancel=()=>{button.removeEventListener('pointermove',onMove);button.removeEventListener('pointerup',onEnd);button.removeEventListener('pointercancel',onCancel);resetDrag(button);};
    button.addEventListener('pointermove',onMove);button.addEventListener('pointerup',onEnd);button.addEventListener('pointercancel',onCancel);
  }
  function renderTray(){
    const tray=byId('fpTray'),picture=selectedPicture();if(!tray||!definition||!picture)return;
    tray.innerHTML=definition.shuffled.map(pieceId=>{
      const piece=definition.pieces[pieceId];return pieceMarkup(piece,{image:picture.src,rows:size,columns:size,instance:sequence});
    }).join('');
    tray.querySelectorAll('.fp-piece').forEach(button=>{
      button.addEventListener('pointerdown',event=>startDrag(event,button));
      button.addEventListener('click',event=>{if(event.detail===0)selectPiece(Number(button.dataset.pieceId),button);});
    });
  }
  function stopClock(){if(timerHandle){clearInterval(timerHandle);timerHandle=null;}}
  function startGame(){
    stopClock();gameEvents.reset();const person=selectedPlayer(),picture=selectedPicture();if(!person||!picture){updateMessage('ما لقينا صور الأطفال في التطبيق.');return;}
    const reference=byId('fpReference');if(reference){reference.src=picture.src;reference.alt=`صورة ${person.displayName} المطلوب تركيبها`;}
    definition=createPuzzleDefinition(size);placed=Array(size*size).fill(null);selectedPieceId=null;moves=0;elapsedSeconds=0;startedAt=new Date().toISOString();active=true;gameEvents.begin([person.learnerId],{payload:{mode:'solo',difficulty:size*size,imageId:picture.id}});
    const win=byId('fpWin'),playArea=byId('fpPlayArea');if(win)win.hidden=true;if(playArea)playArea.hidden=false;
    renderBoard();renderTray();updateStats();updateConfigLock();updateMessage('اسحب القطع إلى أماكنها. وتقدر تضغط القطعة ثم تضغط مكانها.');
    timerHandle=setInterval(()=>{elapsedSeconds=Math.floor((Date.now()-Date.parse(startedAt))/1000);updateStats();},1000);
  }
  function finishGame(){
    stopClock();active=false;elapsedSeconds=Math.floor((Date.now()-Date.parse(startedAt))/1000);updateStats();updateConfigLock();
    const person=selectedPlayer(),picture=selectedPicture(),endedAt=new Date().toISOString(),timeText=formatTime(elapsedSeconds);
    const winTitle=byId('fpWinTitle'),winTime=byId('fpWinTime'),win=byId('fpWin');if(winTitle)winTitle.textContent=`بطل يا ${person?.displayName||''}!`;if(winTime)winTime.textContent=timeText;if(win)win.hidden=false;
    gameEvents.complete({players:[person.learnerId],winner:person.learnerId,payload:{moves,durationSeconds:elapsedSeconds,difficulty:size*size,imageId:picture.id}});
    void gameHistoryService.recordGameResult({
      gameId:PHOTO_PUZZLE_ID,gameVersion:2,startedAt,endedAt,winnerIds:[person.learnerId],
      players:[{learnerId:person.learnerId,displayName:person.displayName,seat:0,score:Math.max(0,100-moves),outcome:'win',details:{moves,durationSeconds:elapsedSeconds}}],
      details:{difficulty:size*size,moves,durationSeconds:elapsedSeconds,imageId:picture.id}
    });
    updateMessage('اكتملت الصورة! نتيجتك انحفظت.');
  }
  function bind(){
    if(bound)return;bound=true;ensurePuzzleShell();renderPlayers();renderLevel();
    document.querySelectorAll('#puzzleGameView [data-fp-size]').forEach(button=>button.addEventListener('click',()=>{if(active)return;size=Number(button.dataset.fpSize)||3;renderLevel();}));
    byId('fpStart')?.addEventListener('click',startGame);byId('fpNew')?.addEventListener('click',startGame);byId('fpPlayAgain')?.addEventListener('click',startGame);
    byId('fpBack')?.addEventListener('click',()=>leave());
    byId('fpReferenceToggle')?.addEventListener('click',event=>{const image=byId('fpReference');if(!image)return;image.hidden=!image.hidden;if(!image.hidden){const picture=selectedPicture();if(picture)image.src=picture.src;}event.currentTarget.setAttribute('aria-expanded',String(!image.hidden));event.currentTarget.textContent=image.hidden?'إظهار الصورة كاملة':'إخفاء الصورة الكاملة';});
  }
  function start(){ensurePuzzleShell();bind();participants();if(!selectedPlayerId&&players[0])selectedPlayerId=players[0].learnerId;renderPlayers();renderLevel();document.body.classList.add('puzzle-game-mode');showView?.('puzzleGameView');updateConfigLock();}
  function leave({navigate=true}={}){stopClock();active=false;definition=null;placed=[];selectedPieceId=null;gameEvents.reset();const playArea=byId('fpPlayArea');if(playArea)playArea.hidden=true;const board=byId('fpBoard'),tray=byId('fpTray');if(board)board.replaceChildren();if(tray)tray.replaceChildren();updateConfigLock();document.body.classList.remove('puzzle-game-mode');if(navigate)onBack?.();}
  return Object.freeze({start,leave,isActive:()=>active,getDifficulty:()=>size});
}
