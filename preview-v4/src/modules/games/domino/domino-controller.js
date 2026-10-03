import {createDominoOnlineSession,normalizeOnlineDominoRoom} from './domino-online-session.js';
import {createGameRoomClient} from '../online/game-room-client.js';
import {ensureDominoShell} from './domino-shell.js';
import {getGameParticipant,listGameParticipants,gameParticipantMarkup} from '../core/game-participant-registry.js';
import {chooseAutomaticDominoSide} from './domino-placement-policy.js';
import {decorateBoard,enhanceDominoTile} from './domino-visuals.js';

const byId=id=>document.getElementById(id);
let singleton=null;

function showView(id){
  document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id===id));
  globalThis.scrollTo?.(0,0);
}
function participant(id){return getGameParticipant(id);}
function playerMarkup(player){
  if(!player)return'';
  return `${gameParticipantMarkup(player,{imageClass:'domino-player-image',fallbackClass:'domino-player-fallback'})}<span>${player.displayName}</span>`;
}
function tileValues(tileId){
  const match=/^([0-6])-([0-6])$/.exec(String(tileId||''));
  return match?[Number(match[1]),Number(match[2])]:null;
}
function tileKey(left,right){
  const a=Number(left),b=Number(right);
  return Number.isInteger(a)&&Number.isInteger(b)?`${Math.min(a,b)}-${Math.max(a,b)}`:'';
}
function tileFace(left,right,{compact=false,className='',dataKey='',dataId=''}={}){
  const classes=['domino-tile',compact?'compact':'',className].filter(Boolean).join(' ');
  const key=dataKey?` data-domino-key="${dataKey}"`:'';
  const id=dataId?` data-domino-id="${dataId}"`:'';
  return `<span class="${classes}"${key}${id} aria-label="${left} و ${right}"><span>${left}</span><i></i><span>${right}</span></span>`;
}
function legalSides(state,tileId){
  const values=tileValues(tileId);
  if(!values)return[];
  if(!state.board.length)return['right'];
  const[a,b]=values,sides=[];
  if(a===state.leftEnd||b===state.leftEnd)sides.push('left');
  if(a===state.rightEnd||b===state.rightEnd)sides.push('right');
  return sides;
}

export function createDominoController({roomClient=createGameRoomClient()}={}){
  let bound=false,busy=false,selectedLearner=null,state=null,room=null,selectedTileId=null,visualAnchorId=null,visualAnchorRound=null;
  const session=createDominoOnlineSession({roomClient,onRoom:handleRoom,onError:handleError});

  function participants(){return listGameParticipants();}
  function setStatus(message,error=false){const node=byId('dominoOnlineStatus');if(node){node.textContent=message||'';node.classList.toggle('error',Boolean(error));}}
  function setActionStatus(message,error=false){const node=byId('dominoActionStatus');if(node){node.textContent=message||'';node.classList.toggle('error',Boolean(error));}}
  function setCode(code){const box=byId('dominoRoomCodeBox'),value=byId('dominoRoomCode');if(value)value.textContent=code||'------';if(box)box.hidden=!code;}
  function visualAnchorIndex(){
    if(!state?.board?.length)return 0;
    const found=state.board.findIndex(item=>item?.tileId===visualAnchorId);
    if(found>=0)return found;
    const opening=state.board.findIndex(item=>item?.opening===true);
    return opening>=0?opening:Math.floor((state.board.length-1)/2);
  }

  function renderPicker(){
    const host=byId('dominoPlayerPicker');
    if(!host)return;
    const available=participants();
    if(!selectedLearner&&available[0])selectedLearner=available[0].learnerId;
    host.innerHTML=available.map(player=>{
      const selected=selectedLearner===player.learnerId;
      return `<button type="button" class="domino-player-pick ${player.theme} ${selected?'selected':''}" data-domino-player="${player.learnerId}" aria-pressed="${selected?'true':'false'}">${playerMarkup(player)}</button>`;
    }).join('');
    host.querySelectorAll('[data-domino-player]').forEach(button=>button.addEventListener('click',()=>{
      selectedLearner=button.dataset.dominoPlayer;
      renderPicker();
      setStatus(`هذا الجهاز مع ${participant(selectedLearner)?.displayName||selectedLearner}.`);
      const resume=byId('dominoResumeRoom');
      if(resume)resume.hidden=!session.hasResume(selectedLearner);
    }));
    const resume=byId('dominoResumeRoom');
    if(resume)resume.hidden=!session.hasResume(selectedLearner);
  }

  function playerCards(){
    const host=byId('dominoPlayers');
    if(!host||!state)return;
    const self=session.snapshot.selfLearnerId;
    host.innerHTML=state.players.map(id=>{
      const player=participant(id),current=state.currentPlayer===id,count=state.handCounts[id]??0;
      return `<article class="domino-player-card ${player?.theme||''} ${current?'current':''} ${id===self?'self':''}"><span class="domino-player-avatar">${playerMarkup(player)}</span><div><strong>${player?.displayName||id}</strong><small>${id===self?'أنت':'الخصم'} • ${count} قطع</small></div></article>`;
    }).join('');
  }

  function syncVisualAnchor(){
    if(!state)return;
    if(visualAnchorRound!==state.round){visualAnchorRound=state.round;visualAnchorId=null;selectedTileId=null;}
    if(!visualAnchorId&&state.board.length){
      const item=state.board.find(candidate=>candidate?.opening===true)||state.board[state.board.length===1?0:Math.floor((state.board.length-1)/2)];
      visualAnchorId=item?.tileId||null;
    }
  }

  function bindBoardEndTarget(node,side){
    if(!node)return;
    node.onclick=null;node.onkeydown=null;
    if(!selectedTileId||!side){node.removeAttribute('role');node.removeAttribute('tabindex');node.removeAttribute('aria-label');return;}
    node.setAttribute('role','button');
    node.setAttribute('tabindex','0');
    node.setAttribute('aria-label',side==='left'?'العب القطعة في الطرف الأيسر':'العب القطعة في الطرف الأيمن');
    const activate=()=>selectedTileId&&play(selectedTileId,side);
    node.onclick=activate;
    node.onkeydown=event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();activate();}
    };
  }

  function createBoardTile(item){
    const holder=document.createElement('div');
    holder.innerHTML=tileFace(item.left,item.right,{compact:true,dataKey:tileKey(item.left,item.right),dataId:item.tileId});
    const node=holder.firstElementChild;
    enhanceDominoTile(node);
    return node;
  }

  function boardMarkup(){
    const host=byId('dominoBoard');
    if(!host||!state)return;
    syncVisualAnchor();
    if(!state.board.length){
      host.innerHTML='<div class="domino-board-empty">نجهز أول قطعة…</div>';
      host.classList.remove('choose-side');
      delete host.dataset.anchorId;
      return;
    }
    const self=session.snapshot.selfLearnerId;
    const isTurn=state.status==='playing'&&state.currentPlayer===self;
    const selectedSides=selectedTileId&&isTurn?legalSides(state,selectedTileId):[];
    host.dataset.anchorId=visualAnchorId||'';
    host.classList.toggle('choose-side',selectedSides.length>1);
    host.querySelector('.domino-board-empty')?.remove();
    const existing=new Map([...host.querySelectorAll(':scope > .domino-tile[data-domino-id]')].map(node=>[node.dataset.dominoId,node]));
    state.board.forEach((item,index)=>{
      const node=existing.get(item.tileId)||createBoardTile(item);
      existing.delete(item.tileId);
      node.classList.toggle('board-end-left',index===0);
      node.classList.toggle('board-end-right',index===state.board.length-1);
      node.dataset.dominoKey=tileKey(item.left,item.right);
      if(host.children[index]!==node)host.insertBefore(node,host.children[index]||null);
    });
    existing.forEach(node=>node.remove());
    bindBoardEndTarget(host.querySelector('.board-end-left'),selectedSides.includes('left')?'left':null);
    bindBoardEndTarget(host.querySelector('.board-end-right'),selectedSides.includes('right')?'right':null);
    decorateBoard(document);
  }

  function handMarkup(){
    const host=byId('dominoHand');
    if(!host||!state)return;
    const self=session.snapshot.selfLearnerId;
    const isTurn=state.status==='playing'&&state.currentPlayer===self;
    if(!isTurn||!state.hand.includes(selectedTileId)||legalSides(state,selectedTileId).length<2)selectedTileId=null;
    host.innerHTML=state.hand.map(tileId=>{
      const values=tileValues(tileId)||[0,0],sides=isTurn?legalSides(state,tileId):[],selected=selectedTileId===tileId;
      const automaticSide=chooseAutomaticDominoSide({state,sides,anchorIndex:visualAnchorIndex()});
      const controls=automaticSide
        ?`<button type="button" class="domino-play-whole" data-domino-tile="${tileId}" data-domino-side="${automaticSide}" aria-label="العب القطعة ${values[0]} و ${values[1]}"></button>`
        :sides.length>1
          ?`<button type="button" class="domino-select-whole" data-domino-select="${tileId}" aria-label="اختر القطعة ${values[0]} و ${values[1]} ثم اختر الطرف المضيء على الطاولة"></button>`
          :'';
      return `<div class="domino-hand-item ${sides.length?'playable':''} ${selected?'selected':''}">${tileFace(values[0],values[1])}${controls}</div>`;
    }).join('');
    host.querySelectorAll('[data-domino-tile]').forEach(button=>button.addEventListener('click',()=>play(button.dataset.dominoTile,button.dataset.dominoSide)));
    host.querySelectorAll('[data-domino-select]').forEach(button=>button.addEventListener('click',()=>{selectedTileId=button.dataset.dominoSelect;renderGame();}));
  }

  function renderSidePicker(){
    const picker=byId('dominoSidePicker');
    if(picker)picker.hidden=true;
  }

  function renderResult(){
    const finish=byId('dominoFinish');
    if(!finish||!state)return;
    const ended=['finished','draw'].includes(state.status),handPanel=byId('dominoHandPanel');
    finish.hidden=!ended;
    if(handPanel)handPanel.hidden=ended;
    if(!ended)return;
    selectedTileId=null;
    const self=session.snapshot.selfLearnerId,winner=participant(state.winner),title=byId('dominoFinishTitle'),copy=byId('dominoFinishCopy');
    if(title)title.textContent=state.status==='draw'?'تعادل في الجولة':state.winner===self?'فزت بالجولة!':`${winner?.displayName||'اللاعب الثاني'} فاز بالجولة`;
    if(copy)copy.textContent=state.blocked?'انقفلت الطاولة، وفاز صاحب أقل مجموع نقاط.':'أول لاعب تخلص من كل قطعه يفوز.';
    const rematch=byId('dominoRematch'),ready=state.rematchReady.includes(self);
    if(rematch){rematch.disabled=ready;rematch.textContent=ready?'بانتظار اللاعب الثاني…':'جولة ثانية';}
  }

  function renderGame(){
    if(!state)return;
    byId('dominoSetup').hidden=true;
    byId('dominoTableWrap').hidden=false;
    byId('dominoRoundBadge').hidden=false;
    if(byId('dominoRound'))byId('dominoRound').textContent=String(state.round);
    playerCards();
    boardMarkup();
    handMarkup();
    renderSidePicker();
    renderResult();
    if(byId('dominoStockCount'))byId('dominoStockCount').textContent=String(state.boneyardCount);
    const self=session.snapshot.selfLearnerId,current=participant(state.currentPlayer),banner=byId('dominoTurnBanner'),handTitle=byId('dominoHandTitle');
    const isTurn=state.status==='playing'&&state.currentPlayer===self;
    const hasMove=isTurn&&state.hand.some(tile=>legalSides(state,tile).length>0);
    if(banner){
      banner.classList.toggle('your-turn',isTurn);
      banner.textContent=state.status==='playing'
        ?(isTurn?(hasMove?'دورك الآن — العب قطعة مضيئة':state.boneyardCount>0?'دورك الآن — اسحب من المخزون':'ننتظر تحديث الدور…'):`دور ${current?.displayName||'اللاعب الثاني'} الآن`)
        :'انتهت الجولة';
    }
    if(handTitle){
      const choosingEndpoint=Boolean(selectedTileId&&legalSides(state,selectedTileId).length>1);
      handTitle.textContent=!isTurn?'شاهد الطاولة وانتظر دورك':choosingEndpoint?'اختر الطرف المضيء على الطاولة':hasMove?'اختر قطعة مضيئة':state.boneyardCount>0?'ما عندك قطعة مناسبة — اسحب من المخزون':'لا توجد حركة متاحة';
    }
    const draw=byId('dominoDraw');
    if(draw)draw.disabled=busy||!isTurn||hasMove||state.boneyardCount<=0;
  }

  function renderWaiting(){
    byId('dominoSetup').hidden=false;
    byId('dominoTableWrap').hidden=true;
    byId('dominoRoundBadge').hidden=true;
    setCode(room?.code||session.snapshot.code);
    renderPicker();
    setStatus('بانتظار اللاعب الثاني يدخل بنفس رمز الغرفة.');
  }
  function handleRoom(nextRoom){
    room=nextRoom;
    state=normalizeOnlineDominoRoom(nextRoom);
    setCode(nextRoom.status==='waiting'?nextRoom.code:'');
    if(nextRoom.status==='waiting')renderWaiting();
    else{setStatus('');renderGame();}
  }
  function errorMessage(error){
    const code=error?.message||error?.body?.error||'';
    const messages={version_conflict:'تحدثت الطاولة من الجهاز الثاني. حاول مرة ثانية.',room_not_found:'رمز الغرفة غير موجود أو انتهت الغرفة.',room_not_waiting:'الغرفة بدأت بالفعل.',room_full:'الغرفة مكتملة.',learner_already_in_room:'اختر لاعبًا مختلفًا في الجهاز الثاني.',too_many_join_attempts:'محاولات دخول كثيرة. انتظر شوي ثم حاول مرة ثانية.','not-your-turn':'مو دورك الآن.','tile-does-not-match':'هذه القطعة ما تركب على طرف الطاولة.','playable-tile-available':'عندك قطعة تقدر تلعبها.','boneyard-empty':'المخزون انتهى.'};
    return messages[code]||'تعذر تنفيذ الحركة. حاول مرة ثانية.';
  }
  function handleError(error){busy=false;const message=errorMessage(error);if(state&&state.status!=='waiting')setActionStatus(message,true);else setStatus(message,true);renderGame();}
  async function withAction(action){if(busy)return;busy=true;setActionStatus('');renderGame();try{await action();}catch(error){handleError(error);}finally{busy=false;renderGame();}}
  function play(tileId,side){selectedTileId=null;return withAction(()=>session.play(tileId,side));}
  function draw(){selectedTileId=null;return withAction(()=>session.draw());}
  function rematch(){selectedTileId=null;visualAnchorId=null;return withAction(()=>session.reset());}

  async function createRoom(){
    if(!selectedLearner){setStatus('اختر اللاعب أولًا.',true);return;}
    if(busy)return;
    busy=true;setStatus('ننشئ الغرفة…');setCode('');
    try{const player=participant(selectedLearner);await session.create(selectedLearner,{displayName:player?.displayName});}
    catch(error){handleError(error);}finally{busy=false;}
  }
  async function joinRoom(){
    if(!selectedLearner){setStatus('اختر اللاعب أولًا.',true);return;}
    const code=String(byId('dominoRoomCodeInput')?.value||'').replace(/\D/g,'').slice(0,6);
    if(code.length!==6){setStatus('اكتب رمز الغرفة المكوّن من 6 أرقام.',true);return;}
    if(busy)return;
    busy=true;setStatus('ندخل الغرفة…');
    try{const player=participant(selectedLearner);await session.join(code,selectedLearner,{displayName:player?.displayName});}
    catch(error){handleError(error);}finally{busy=false;}
  }
  async function resumeRoom(){
    if(!selectedLearner||busy)return;
    busy=true;setStatus('نرجع للغرفة…');
    try{const restored=await session.resume({learnerId:selectedLearner});if(!restored)setStatus('ما فيه غرفة محفوظة.',true);}
    catch(error){handleError(error);}finally{busy=false;}
  }

  function backToGames(){
    session.stop();state=null;room=null;selectedTileId=null;visualAnchorId=null;visualAnchorRound=null;
    document.body.classList.remove('domino-game-mode');setActionStatus('');setStatus('');showView('gamesHomeView');
  }
  function bind(){
    if(bound)return;
    bound=true;
    byId('dominoBackToGames')?.addEventListener('click',backToGames);
    byId('dominoFinishBack')?.addEventListener('click',backToGames);
    byId('dominoCreateRoom')?.addEventListener('click',createRoom);
    byId('dominoJoinRoom')?.addEventListener('click',joinRoom);
    byId('dominoResumeRoom')?.addEventListener('click',resumeRoom);
    byId('dominoDraw')?.addEventListener('click',draw);
    byId('dominoRematch')?.addEventListener('click',rematch);
    byId('dominoPlayLeft')?.addEventListener('click',()=>selectedTileId&&play(selectedTileId,'left'));
    byId('dominoPlayRight')?.addEventListener('click',()=>selectedTileId&&play(selectedTileId,'right'));
  }
  function start(){
    ensureDominoShell();bind();document.body.classList.add('domino-game-mode','games-mode');
    selectedLearner=selectedLearner||participants()[0]?.learnerId||null;
    state=null;room=null;selectedTileId=null;visualAnchorId=null;visualAnchorRound=null;
    setCode('');setActionStatus('');byId('dominoTableWrap').hidden=true;byId('dominoSetup').hidden=false;renderPicker();setStatus('');showView('dominoGameView');
  }
  return Object.freeze({start,backToGames});
}

export function launchGame(){ensureDominoShell();singleton=singleton||createDominoController();singleton.start();return singleton;}
export default launchGame;
