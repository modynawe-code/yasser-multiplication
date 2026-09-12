import { createDominoOnlineSession,normalizeOnlineDominoRoom } from './domino-online-session.js';
import { createGameRoomClient } from '../online/game-room-client.js';
import { ensureDominoShell } from './domino-shell.js';
import { getGameParticipant,listGameParticipants,gameParticipantMarkup } from '../core/game-participant-registry.js';

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
  const match=/^([0-6])-([0-6])$/.exec(String(tileId||''));return match?[Number(match[1]),Number(match[2])]:null;
}
function tileFace(left,right,{compact=false}={}){
  return `<span class="domino-tile ${compact?'compact':''}" aria-label="${left} و ${right}"><span>${left}</span><i></i><span>${right}</span></span>`;
}
function legalSides(state,tileId){
  const values=tileValues(tileId);if(!values)return[];
  if(!state.board.length)return['right'];
  const[a,b]=values,sides=[];
  if(a===state.leftEnd||b===state.leftEnd)sides.push('left');
  if(a===state.rightEnd||b===state.rightEnd)sides.push('right');
  return sides;
}

export function createDominoController({roomClient=createGameRoomClient()}={}){
  let bound=false,busy=false,selectedLearner=null,state=null,room=null;
  const session=createDominoOnlineSession({roomClient,onRoom:handleRoom,onError:handleError});

  function participants(){return listGameParticipants();}
  function setStatus(message,error=false){
    const node=byId('dominoOnlineStatus');if(node){node.textContent=message||'';node.classList.toggle('error',Boolean(error));}
  }
  function setActionStatus(message,error=false){
    const node=byId('dominoActionStatus');if(node){node.textContent=message||'';node.classList.toggle('error',Boolean(error));}
  }
  function setCode(code){
    const box=byId('dominoRoomCodeBox'),value=byId('dominoRoomCode');
    if(value)value.textContent=code||'------';if(box)box.hidden=!code;
  }
  function renderPicker(){
    const host=byId('dominoPlayerPicker');if(!host)return;
    const available=participants();
    if(!selectedLearner&&available[0])selectedLearner=available[0].learnerId;
    host.innerHTML=available.map(player=>{
      const selected=selectedLearner===player.learnerId;
      return `<button type="button" class="domino-player-pick ${player.theme} ${selected?'selected':''}" data-domino-player="${player.learnerId}" aria-pressed="${selected?'true':'false'}">${playerMarkup(player)}</button>`;
    }).join('');
    host.querySelectorAll('[data-domino-player]').forEach(button=>button.addEventListener('click',()=>{
      selectedLearner=button.dataset.dominoPlayer;renderPicker();setStatus(`هذا الجهاز مع ${participant(selectedLearner)?.displayName||selectedLearner}.`);
      const resume=byId('dominoResumeRoom');if(resume)resume.hidden=!session.hasResume(selectedLearner);
    }));
    const resume=byId('dominoResumeRoom');if(resume)resume.hidden=!session.hasResume(selectedLearner);
  }

  function playerCards(){
    const host=byId('dominoPlayers');if(!host||!state)return;
    const self=session.snapshot.selfLearnerId;
    host.innerHTML=state.players.map(id=>{
      const player=participant(id),current=state.currentPlayer===id,count=state.handCounts[id]??0;
      return `<article class="domino-player-card ${player?.theme||''} ${current?'current':''} ${id===self?'self':''}">
        <span class="domino-player-avatar">${playerMarkup(player)}</span>
        <div><strong>${player?.displayName||id}</strong><small>${id===self?'أنت':'الخصم'} • ${count} قطع</small></div>
      </article>`;
    }).join('');
  }

  function boardMarkup(){
    const host=byId('dominoBoard');if(!host||!state)return;
    if(!state.board.length){host.innerHTML='<div class="domino-board-empty">ابدأ بأول قطعة</div>';return;}
    host.innerHTML=state.board.map(item=>tileFace(item.left,item.right,{compact:true})).join('');
  }

  function handMarkup(){
    const host=byId('dominoHand');if(!host||!state)return;
    const self=session.snapshot.selfLearnerId,isTurn=state.status==='playing'&&state.currentPlayer===self;
    host.innerHTML=state.hand.map(tileId=>{
      const values=tileValues(tileId)||[0,0],sides=isTurn?legalSides(state,tileId):[];
      const controls=sides.length===1
        ?`<button type="button" class="domino-play-whole" data-domino-tile="${tileId}" data-domino-side="${sides[0]}" aria-label="العب القطعة ${values[0]} و ${values[1]}"></button>`
        :sides.length>1
          ?`<div class="domino-side-choices"><button type="button" data-domino-tile="${tileId}" data-domino-side="left">يسار</button><button type="button" data-domino-tile="${tileId}" data-domino-side="right">يمين</button></div>`
          :'';
      return `<div class="domino-hand-item ${sides.length?'playable':''}">${tileFace(values[0],values[1])}${controls}</div>`;
    }).join('');
    host.querySelectorAll('[data-domino-tile]').forEach(button=>button.addEventListener('click',()=>play(button.dataset.dominoTile,button.dataset.dominoSide)));
  }

  function renderResult(){
    const finish=byId('dominoFinish');if(!finish||!state)return;
    const ended=['finished','draw'].includes(state.status);finish.hidden=!ended;if(!ended)return;
    const self=session.snapshot.selfLearnerId,winner=participant(state.winner),title=byId('dominoFinishTitle'),copy=byId('dominoFinishCopy');
    if(title)title.textContent=state.status==='draw'?'تعادل في الجولة':state.winner===self?'فزت بالجولة!':`${winner?.displayName||'اللاعب الثاني'} فاز بالجولة`;
    if(copy)copy.textContent=state.blocked?'انقفلت الطاولة، وفاز صاحب أقل مجموع نقاط.':'أول لاعب تخلص من كل قطعه يفوز.';
    const rematch=byId('dominoRematch'),ready=state.rematchReady.includes(self);
    if(rematch){rematch.disabled=ready;rematch.textContent=ready?'بانتظار اللاعب الثاني…':'جولة ثانية';}
  }

  function renderGame(){
    if(!state)return;
    byId('dominoSetup').hidden=true;byId('dominoTableWrap').hidden=false;byId('dominoRoundBadge').hidden=false;
    if(byId('dominoRound'))byId('dominoRound').textContent=String(state.round);
    playerCards();boardMarkup();handMarkup();renderResult();
    if(byId('dominoStockCount'))byId('dominoStockCount').textContent=String(state.boneyardCount);
    const self=session.snapshot.selfLearnerId,current=participant(state.currentPlayer),banner=byId('dominoTurnBanner'),handTitle=byId('dominoHandTitle');
    const isTurn=state.status==='playing'&&state.currentPlayer===self,hasMove=isTurn&&state.hand.some(tile=>legalSides(state,tile).length>0);
    if(banner){
      banner.classList.toggle('your-turn',isTurn);
      banner.textContent=state.status==='playing'?(isTurn?'دورك الآن — اختر قطعة مناسبة':`دور ${current?.displayName||'اللاعب الثاني'} الآن`):'انتهت الجولة';
    }
    if(handTitle)handTitle.textContent=isTurn?(hasMove?'اختر قطعة مضيئة':'ما عندك قطعة مناسبة'):'شاهد الطاولة وانتظر دورك';
    const draw=byId('dominoDraw'),pass=byId('dominoPass');
    if(draw)draw.disabled=busy||!isTurn||hasMove||state.boneyardCount<=0;
    if(pass)pass.disabled=busy||!isTurn||hasMove||state.boneyardCount>0;
  }

  function renderWaiting(){
    byId('dominoSetup').hidden=false;byId('dominoTableWrap').hidden=true;byId('dominoRoundBadge').hidden=true;
    setCode(room?.code||session.snapshot.code);renderPicker();setStatus('بانتظار اللاعب الثاني يدخل بنفس رمز الغرفة.');
  }

  function handleRoom(nextRoom){
    room=nextRoom;state=normalizeOnlineDominoRoom(nextRoom);setCode(nextRoom.status==='waiting'?nextRoom.code:'');
    if(nextRoom.status==='waiting')renderWaiting();else{setStatus('');renderGame();}
  }

  function errorMessage(error){
    const code=error?.message||error?.body?.error||'';
    const messages={
      version_conflict:'تحدثت الطاولة من الجهاز الثاني. حاول مرة ثانية.',
      room_not_found:'رمز الغرفة غير موجود أو انتهت الغرفة.',
      room_not_waiting:'الغرفة بدأت بالفعل.',
      room_full:'الغرفة مكتملة.',
      learner_already_in_room:'اختر لاعبًا مختلفًا في الجهاز الثاني.',
      too_many_join_attempts:'محاولات دخول كثيرة. انتظر شوي ثم حاول مرة ثانية.',
      'not-your-turn':'مو دورك الآن.',
      'tile-does-not-match':'هذه القطعة ما تركب على طرف الطاولة.',
      'playable-tile-available':'عندك قطعة تقدر تلعبها.',
      'draw-before-pass':'اسحب من المخزون قبل تمرير الدور.',
      'boneyard-empty':'المخزون انتهى.'
    };
    return messages[code]||'تعذر تنفيذ الحركة. حاول مرة ثانية.';
  }
  function handleError(error){busy=false;const message=errorMessage(error);if(state&&state.status!=='waiting')setActionStatus(message,true);else setStatus(message,true);renderGame();}

  async function withAction(action){
    if(busy)return;busy=true;setActionStatus('');renderGame();
    try{await action();}catch(error){handleError(error);}finally{busy=false;renderGame();}
  }
  function play(tileId,side){return withAction(()=>session.play(tileId,side));}
  function draw(){return withAction(()=>session.draw());}
  function pass(){return withAction(()=>session.pass());}
  function rematch(){return withAction(()=>session.reset());}

  async function createRoom(){
    if(!selectedLearner){setStatus('اختر اللاعب أولًا.',true);return;}
    if(busy)return;busy=true;setStatus('ننشئ الغرفة…');setCode('');
    try{const player=participant(selectedLearner);await session.create(selectedLearner,{displayName:player?.displayName});}
    catch(error){handleError(error);}finally{busy=false;}
  }
  async function joinRoom(){
    if(!selectedLearner){setStatus('اختر اللاعب أولًا.',true);return;}
    const code=String(byId('dominoRoomCodeInput')?.value||'').replace(/\D/g,'').slice(0,6);
    if(code.length!==6){setStatus('اكتب رمز الغرفة المكوّن من 6 أرقام.',true);return;}
    if(busy)return;busy=true;setStatus('ندخل الغرفة…');
    try{const player=participant(selectedLearner);await session.join(code,selectedLearner,{displayName:player?.displayName});}
    catch(error){handleError(error);}finally{busy=false;}
  }
  async function resumeRoom(){
    if(!selectedLearner||busy)return;busy=true;setStatus('نرجع للغرفة…');
    try{const restored=await session.resume({learnerId:selectedLearner});if(!restored)setStatus('ما فيه غرفة محفوظة.',true);}
    catch(error){handleError(error);}finally{busy=false;}
  }

  function backToGames(){
    session.stop();state=null;room=null;document.body.classList.remove('domino-game-mode');setActionStatus('');setStatus('');showView('gamesHomeView');
  }
  function bind(){
    if(bound)return;bound=true;
    byId('dominoBackToGames')?.addEventListener('click',backToGames);
    byId('dominoFinishBack')?.addEventListener('click',backToGames);
    byId('dominoCreateRoom')?.addEventListener('click',createRoom);
    byId('dominoJoinRoom')?.addEventListener('click',joinRoom);
    byId('dominoResumeRoom')?.addEventListener('click',resumeRoom);
    byId('dominoDraw')?.addEventListener('click',draw);
    byId('dominoPass')?.addEventListener('click',pass);
    byId('dominoRematch')?.addEventListener('click',rematch);
  }
  function start(){
    ensureDominoShell();bind();document.body.classList.add('domino-game-mode','games-mode');
    selectedLearner=selectedLearner||participants()[0]?.learnerId||null;state=null;room=null;setCode('');setActionStatus('');
    byId('dominoTableWrap').hidden=true;byId('dominoSetup').hidden=false;renderPicker();setStatus('');showView('dominoGameView');
  }
  return Object.freeze({start,backToGames});
}

export function launchGame(){
  ensureDominoShell();singleton=singleton||createDominoController();singleton.start();return singleton;
}

export default launchGame;
