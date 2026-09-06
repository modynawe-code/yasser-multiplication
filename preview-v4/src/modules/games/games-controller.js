import { gameRegistry } from './game-catalog.js';
import { createPlayerContext } from './core/player-context.js';
import { createXoState,passXoTurn,playXoMove } from './xo/xo-engine.js';
import { createXoOnlineSession,normalizeOnlineXoRoom } from './xo/xo-online-session.js';
import { createGameRoomClient } from './online/game-room-client.js';
import { ensureGamesShell } from './ui/games-shell.js';
import { createSpeechService } from '../../shared/audio/speech-service.js';
import { createFeedbackAudio } from '../../ui/audio/feedback-audio.js';

const PLAYER_ASSETS=Object.freeze({
  yasser:'assets/visual/original/yasser/welcome.png',
  khaled:'assets/visual/original/khaled/khaled-point-thumbsup.png'
});
const CELEBRATION_ASSETS=Object.freeze({
  yasser:'assets/visual/original/yasser/celebrate.png',
  khaled:'assets/visual/original/khaled/khaled-celebration.png'
});
const PLAYERS=Object.freeze({
  yasser:createPlayerContext({playerId:'yasser',learnerId:'yasser',displayName:'ياسر',theme:'yasser'}),
  khaled:createPlayerContext({playerId:'khaled',learnerId:'khaled',displayName:'خالد',theme:'khaled'})
});

function allViews(){return[...document.querySelectorAll('.view')];}
function show(id){allViews().forEach(view=>view.classList.toggle('active',view.id===id));window.scrollTo(0,0);}
function byId(id){return document.getElementById(id);}
function categoryLabel(category){return category==='educational'?'تعليمية':category==='fun'?'مرح':'تعليم + مرح';}
function learningLabel(mode){return mode==='required'?'تعلم أساسي':mode==='optional'?'تعلم اختياري':mode==='adaptive'?'تعلم متكيف':'مرح فقط';}
function gameIcon(id){return id==='xo'?'⭕':id==='rock-paper-scissors'?'✊':id==='number-race'?'🏁':'🎮';}
function now(){return globalThis.performance?.now?.()??Date.now();}

export function createGamesController({learningAdapter,onBeforeEnter,onExitToHub,roomClient=createGameRoomClient()}={}){
  let bound=false,xoState=null,nextStarter='yasser',challengeState=null,challengeRequest=0,passTimer=null;
  let playMode='local',selectedOnlineLearner=null,onlineBusy=false,onlineTurnVersion=-1,onlineCelebrated='',restoringOnline=false;
  const speech=createSpeechService(),audio=createFeedbackAudio();
  const onlineSession=createXoOnlineSession({roomClient,onRoom:handleOnlineRoom,onError:handleOnlineError});

  function clearPassTimer(){if(passTimer){clearTimeout(passTimer);passTimer=null;}}
  function clearChallenge(){challengeRequest+=1;challengeState=null;clearPassTimer();speech.stop();}
  function setXoMode(active){document.body.classList.toggle('xo-game-mode',Boolean(active));}
  function lobbyStatus(message,error=false){const node=byId('xoLobbyStatus');if(node){node.textContent=message||'';node.classList.toggle('error',Boolean(error));}}
  function setRoomCode(code){const box=byId('xoRoomCodeBox'),value=byId('xoRoomCode');if(value)value.textContent=code||'------';if(box)box.hidden=!code;}
  function enterGamesChrome(){document.body.classList.remove('hub-mode','khaled-mode','family-parent-mode');document.body.classList.add('games-mode');}

  function leave(){
    document.body.classList.remove('games-mode','xo-game-mode');
    clearChallenge();onlineSession.forget();
    xoState=null;playMode='local';onlineTurnVersion=-1;onlineCelebrated='';
  }

  function enterHome(){
    onBeforeEnter?.();
    onlineSession.stop();clearChallenge();xoState=null;playMode='local';setXoMode(false);
    enterGamesChrome();renderCatalog();show('gamesHomeView');
  }

  function renderCatalog(){
    const host=byId('gamesCatalog');if(!host)return;
    host.innerHTML=gameRegistry.list().map(game=>{
      const ready=game.id==='xo';
      return `<button class="game-card ${ready?'ready':'locked'}" data-game-id="${game.id}" ${ready?'':'disabled'}>
        <span class="game-card-status">${ready?'جاهزة للتجربة':'قريبًا'}</span>
        <span class="game-card-icon" aria-hidden="true">${gameIcon(game.id)}</span>
        <strong>${game.title}</strong>
        <p>${game.metadata.description||''}</p>
        <span class="game-card-meta"><span class="game-chip">${categoryLabel(game.category)}</span><span class="game-chip">${learningLabel(game.learningMode)}</span><span class="game-chip">${ready?'محلي + أونلاين':'قريبًا'}</span></span>
      </button>`;
    }).join('');
    host.querySelector('[data-game-id="xo"]')?.addEventListener('click',openXoLobby);
  }

  function openXoLobby(){
    clearChallenge();onlineSession.forget();xoState=null;setXoMode(false);playMode='local';selectedOnlineLearner=null;onlineTurnVersion=-1;onlineCelebrated='';
    document.querySelectorAll('[data-xo-learner]').forEach(button=>button.classList.remove('selected'));
    const input=byId('xoRoomCodeInput');if(input)input.value='';setRoomCode('');lobbyStatus('');show('xoLobbyView');
  }

  function chooseOnlineLearner(learnerId){
    selectedOnlineLearner=learnerId;
    document.querySelectorAll('[data-xo-learner]').forEach(button=>button.classList.toggle('selected',button.dataset.xoLearner===learnerId));
    lobbyStatus(`هذا الجهاز مع ${PLAYERS[learnerId].displayName}.`);
  }

  function startLocalXo(){
    onlineSession.forget();playMode='local';nextStarter=nextStarter==='yasser'?'khaled':'yasser';
    xoState=createXoState({players:['yasser','khaled'],startingPlayer:nextStarter});
    clearChallenge();setXoMode(true);byId('xoModeLabel').textContent='نسخة محلية — جهاز واحد';
    show('xoGameView');renderXo();beginTurnChallenge();
  }

  async function createOnlineRoom(){
    if(!selectedOnlineLearner){lobbyStatus('اختر ياسر أو خالد لهذا الجهاز أولًا.',true);return;}
    if(onlineBusy)return;onlineBusy=true;lobbyStatus('ننشئ الغرفة…');setRoomCode('');
    try{await onlineSession.create(selectedOnlineLearner);const snap=onlineSession.snapshot;setRoomCode(snap.code);lobbyStatus('بانتظار اللاعب الثاني…');}
    catch(error){handleOnlineError(error);}
    finally{onlineBusy=false;}
  }

  async function joinOnlineRoom(){
    if(!selectedOnlineLearner){lobbyStatus('اختر ياسر أو خالد لهذا الجهاز أولًا.',true);return;}
    const code=String(byId('xoRoomCodeInput')?.value||'').replace(/\D/g,'').slice(0,6);if(code.length!==6){lobbyStatus('اكتب رمز الغرفة المكوّن من 6 أرقام.',true);return;}
    if(onlineBusy)return;onlineBusy=true;lobbyStatus('ندخل الغرفة…');
    try{await onlineSession.join(code,selectedOnlineLearner);}
    catch(error){handleOnlineError(error);}
    finally{onlineBusy=false;}
  }

  function handleOnlineError(error){
    if(error?.message==='version_conflict'||error?.message==='rematch-already-ready')return;
    if(error?.message==='too_many_join_attempts'){lobbyStatus('محاولات دخول كثيرة. انتظر شوي ثم جرّب مرة ثانية.',true);return;}
    if(playMode==='online'&&(error?.status===401||error?.status===404)){
      onlineSession.forget();clearChallenge();xoState=null;playMode='local';setXoMode(false);enterGamesChrome();show('xoLobbyView');setRoomCode('');lobbyStatus('انتهت الغرفة أو تعذر الرجوع لها. أنشئ غرفة جديدة.',true);return;
    }
    if(error?.message==='learner_already_in_room'){lobbyStatus('اختر الطفل الثاني في الجهاز الآخر.',true);return;}
    if(error?.message==='room_not_waiting'||error?.message==='room_full'){lobbyStatus('الغرفة بدأت أو اكتملت. أنشئ غرفة جديدة.',true);return;}
    if(error?.message==='room_not_found'){lobbyStatus('رمز الغرفة غير موجود أو انتهت صلاحيته.',true);return;}
    if(playMode==='online'){
      const label=byId('xoModeLabel');if(label)label.textContent='أونلاين — جاري إعادة الاتصال…';return;
    }
    lobbyStatus('اللعب أونلاين غير متاح الآن. جرّب مرة ثانية.',true);
  }

  function handleOnlineRoom(room){
    if(!room)return;
    const snap=onlineSession.snapshot;selectedOnlineLearner=snap.selfLearnerId||selectedOnlineLearner;enterGamesChrome();setRoomCode(room.status==='waiting'?room.code:'');
    if(room.status==='waiting'){
      playMode='online';setXoMode(false);show('xoLobbyView');document.querySelectorAll('[data-xo-learner]').forEach(button=>button.classList.toggle('selected',button.dataset.xoLearner===selectedOnlineLearner));lobbyStatus('بانتظار اللاعب الثاني…');return;
    }
    playMode='online';xoState=normalizeOnlineXoRoom(room);setXoMode(true);
    if(byId('xoModeLabel'))byId('xoModeLabel').textContent=`أونلاين — غرفة ${room.code}`;
    if(!byId('xoGameView')?.classList.contains('active'))show('xoGameView');
    renderXo();
    if(xoState.status!=='playing'){
      clearChallenge();
      const key=`${xoState.round}:${xoState.status}:${xoState.winner||''}`;
      if(onlineCelebrated!==key){onlineCelebrated=key;audio.achievement();speech.speak(xoState.status==='won'?`${PLAYERS[xoState.winner]?.displayName||''} فاز بالجولة. أحسنتم.`:'تعادل جميل. أحسنتم.');}
      return;
    }
    onlineCelebrated='';
    const selfLearner=snap.selfLearnerId;
    if(xoState.currentPlayer!==selfLearner){clearChallenge();renderWaitingForOpponent();onlineTurnVersion=room.version;return;}
    if(onlineTurnVersion!==room.version||challengeState?.playerId!==selfLearner){onlineTurnVersion=room.version;clearChallenge();beginTurnChallenge();}
  }

  function renderWaitingForOpponent(){
    const current=PLAYERS[xoState?.currentPlayer],box=byId('xoChallenge'),prompt=byId('xoChallengePrompt'),visual=byId('xoChallengeVisual'),options=byId('xoChallengeOptions'),feedback=byId('xoChallengeFeedback'),hear=byId('xoHearChallenge');
    box?.classList.remove('unlocked','finished');if(hear)hear.hidden=true;
    if(prompt)prompt.textContent=`دور ${current?.displayName||'اللاعب الثاني'} الآن`;
    if(visual)visual.innerHTML='';if(options)options.innerHTML='';if(feedback)feedback.textContent='انتظر شوي…';
    renderXo();
  }

  async function resetXo(){
    if(playMode==='online'){
      if(onlineBusy)return;onlineBusy=true;clearChallenge();
      try{await onlineSession.reset();}catch(error){handleOnlineError(error);}finally{onlineBusy=false;}
      return;
    }
    nextStarter=nextStarter==='yasser'?'khaled':'yasser';xoState=createXoState({players:['yasser','khaled'],startingPlayer:nextStarter});
    clearChallenge();setXoMode(true);renderXo();beginTurnChallenge();
  }

  function tokenMarkup(playerId){const player=PLAYERS[playerId];if(!player)return'';return `<span class="xo-token ${player.theme}" aria-hidden="true"><img src="${PLAYER_ASSETS[player.learnerId]}" alt="" decoding="async"></span>`;}
  function isMoveUnlocked(){
    const base=Boolean(xoState?.status==='playing'&&challengeState?.playerId===xoState.currentPlayer&&challengeState.unlocked);
    return playMode==='online'?base&&onlineSession.isSelfTurn():base;
  }
  function statusText(){
    if(!xoState)return'';if(xoState.status==='won')return`فاز ${PLAYERS[xoState.winner]?.displayName||''} 🎉`;if(xoState.status==='draw')return'تعادل جميل 🤝';
    if(playMode==='online'&&!onlineSession.isSelfTurn())return'بانتظار اللاعب الثاني';if(isMoveUnlocked())return'اختر مربعًا';return'جاوب السؤال أولًا';
  }

  function renderXo(){
    if(!xoState)return;const board=byId('xoBoard');if(!board)return;
    const current=xoState.currentPlayer?PLAYERS[xoState.currentPlayer]:null,reset=byId('xoReset');if(reset)reset.hidden=playMode==='online'||xoState.status!=='playing';
    byId('xoTurnName').textContent=current?.displayName||(xoState.status==='draw'?'تعادل':PLAYERS[xoState.winner]?.displayName||'');byId('xoStatusText').textContent=statusText();
    byId('xoPlayerYasser')?.classList.toggle('active',xoState.currentPlayer==='yasser'||xoState.winner==='yasser');byId('xoPlayerKhaled')?.classList.toggle('active',xoState.currentPlayer==='khaled'||xoState.winner==='khaled');
    const wins=new Set(xoState.winningLine||[]),unlocked=isMoveUnlocked();board.classList.toggle('locked',xoState.status==='playing'&&!unlocked);
    board.innerHTML=xoState.board.map((playerId,index)=>`<button class="xo-cell ${wins.has(index)?'win':''}" role="gridcell" data-xo-cell="${index}" ${playerId||xoState.status!=='playing'||!unlocked?'disabled':''} aria-label="${playerId?`الخانة للاعب ${PLAYERS[playerId].displayName}`:`خانة فارغة ${index+1}`}">${playerId?tokenMarkup(playerId):''}</button>`).join('');
    board.querySelectorAll('[data-xo-cell]').forEach(button=>button.addEventListener('click',()=>playCell(Number(button.dataset.xoCell))));if(xoState.status!=='playing')renderFinishedChallenge();
  }

  function renderFinishedChallenge(){
    const box=byId('xoChallenge'),prompt=byId('xoChallengePrompt'),visual=byId('xoChallengeVisual'),options=byId('xoChallengeOptions'),feedback=byId('xoChallengeFeedback'),hear=byId('xoHearChallenge');box?.classList.remove('unlocked');box?.classList.add('finished');if(hear)hear.hidden=true;
    if(xoState?.status==='won'){
      const winner=PLAYERS[xoState.winner],asset=CELEBRATION_ASSETS[xoState.winner];if(prompt)prompt.textContent=`${winner?.displayName||''} فاز بالجولة 🎉`;if(visual)visual.innerHTML=`<div class="xo-finish-art"><img src="${asset}" alt="" decoding="async"></div>`;if(feedback)feedback.textContent='ممتاز! جاهزين لجولة ثانية؟';
    }else{if(prompt)prompt.textContent='تعادل جميل 🤝';if(visual)visual.innerHTML=`<div class="xo-finish-art dual"><img src="${CELEBRATION_ASSETS.yasser}" alt="" decoding="async"><img src="${CELEBRATION_ASSETS.khaled}" alt="" decoding="async"></div>`;if(feedback)feedback.textContent='جولة قوية من الاثنين.';}
    if(options){
      const ready=new Set(xoState?.rematchReady||[]),self=playMode==='online'?onlineSession.snapshot.selfLearnerId:null,selfReady=Boolean(self&&ready.has(self)),readyPlayer=[...ready][0];
      if(playMode==='online'&&ready.size){
        if(feedback)feedback.textContent=selfReady?'أنت جاهز 👍 ننتظر اللاعب الثاني.':`${PLAYERS[readyPlayer]?.displayName||'اللاعب الثاني'} جاهز لجولة ثانية.`;
      }
      options.innerHTML=`<button class="btn primary xo-play-again" id="xoPlayAgain" ${selfReady?'disabled':''}>${selfReady?'بانتظار اللاعب الثاني…':'العبوا مرة ثانية'}</button>`;
      if(!selfReady)byId('xoPlayAgain')?.addEventListener('click',resetXo);
    }
  }

  function challengeVisualMarkup(challenge){if(challenge?.visual?.kind!=='dots')return'';const count=Number(challenge.visual.count||0);if(count===0)return'<div class="xo-zero">0 — ما فيه دوائر</div>';return `<div class="xo-dot-group" aria-label="${count} دوائر">${Array.from({length:count},()=>'<span class="xo-dot" aria-hidden="true"></span>').join('')}</div>`;}

  function renderChallenge(){
    if(!challengeState)return;const {challenge,unlocked}=challengeState,box=byId('xoChallenge'),prompt=byId('xoChallengePrompt'),visual=byId('xoChallengeVisual'),options=byId('xoChallengeOptions'),feedback=byId('xoChallengeFeedback'),hear=byId('xoHearChallenge');
    box?.classList.remove('finished');box?.classList.toggle('unlocked',Boolean(unlocked));if(hear)hear.hidden=false;if(prompt)prompt.textContent=challenge.prompt;if(visual)visual.innerHTML=challengeVisualMarkup(challenge);
    if(options){options.innerHTML=challenge.options.map(value=>`<button class="xo-challenge-option" data-challenge-answer="${String(value)}" ${unlocked?'disabled':''}>${value}</button>`).join('');options.querySelectorAll('[data-challenge-answer]').forEach(button=>button.addEventListener('click',()=>answerChallenge(button.dataset.challengeAnswer,button)));}
    if(feedback)feedback.textContent=unlocked?'أحسنت ⭐ الآن اختر مربعك.':'';renderXo();
  }

  async function beginTurnChallenge(){
    if(!xoState||xoState.status!=='playing')return;if(playMode==='online'&&!onlineSession.isSelfTurn()){renderWaitingForOpponent();return;}
    const playerId=xoState.currentPlayer,player=PLAYERS[playerId],requestId=++challengeRequest;challengeState=null;
    const prompt=byId('xoChallengePrompt'),visual=byId('xoChallengeVisual'),options=byId('xoChallengeOptions'),feedback=byId('xoChallengeFeedback'),hear=byId('xoHearChallenge');byId('xoChallenge')?.classList.remove('unlocked','finished');if(hear)hear.hidden=false;
    if(prompt)prompt.textContent=`نجهز سؤال ${player.displayName}…`;if(visual)visual.innerHTML='';if(options)options.innerHTML='';if(feedback)feedback.textContent='';renderXo();
    try{
      if(!learningAdapter?.nextChallenge)throw new Error('learning adapter unavailable');const challenge=await learningAdapter.nextChallenge(player,{gameId:'xo',playMode});
      if(requestId!==challengeRequest||xoState?.currentPlayer!==playerId)return;challengeState={playerId,challenge,attempts:0,unlocked:false,startedAt:now()};renderChallenge();speech.speak(challenge.spokenPrompt||challenge.prompt||'');
    }catch{
      if(requestId!==challengeRequest||xoState?.currentPlayer!==playerId)return;challengeState={playerId,challenge:{prompt:'تعذر تجهيز السؤال — العب دورك',options:[],correctAnswer:null},attempts:0,unlocked:true,startedAt:now(),fallback:true};if(prompt)prompt.textContent='تعذر تجهيز السؤال — العب دورك';if(feedback)feedback.textContent='اللعبة مستمرة بدون تعطيل.';renderXo();
    }
  }

  async function answerChallenge(answer,button){
    if(!challengeState||challengeState.unlocked||challengeState.playerId!==xoState?.currentPlayer)return;const {challenge}=challengeState,player=PLAYERS[challengeState.playerId];const isCorrect=String(answer)===String(challenge.correctAnswer),responseMs=Math.max(0,Math.round(now()-challengeState.startedAt));
    try{await learningAdapter?.recordChallenge?.(player,{gameId:'xo',challenge,answer,isCorrect,responseMs});}catch{}
    if(isCorrect){challengeState.unlocked=true;button?.classList.add('good');audio.correct();byId('xoChallengeFeedback').textContent='أحسنت ⭐ الآن اختر مربعك.';byId('xoChallenge')?.classList.add('unlocked');byId('xoChallengeOptions')?.querySelectorAll('button').forEach(item=>item.disabled=true);renderXo();return;}
    challengeState.attempts+=1;button?.classList.add('bad');if(button)button.disabled=true;audio.wrong();if(challengeState.attempts<2){byId('xoChallengeFeedback').textContent='جرّب مرة ثانية — تقدر عليها.';return;}
    byId('xoChallengeFeedback').textContent='ننتقل للدور الثاني، ونرجع أقوى.';const playerId=challengeState.playerId;byId('xoChallengeOptions')?.querySelectorAll('button').forEach(item=>item.disabled=true);
    passTimer=setTimeout(async()=>{
      passTimer=null;if(!xoState||xoState.currentPlayer!==playerId||xoState.status!=='playing')return;
      if(playMode==='online'){try{clearChallenge();await onlineSession.pass();}catch(error){handleOnlineError(error);}return;}
      const result=passXoTurn(xoState,{playerId});if(!result.ok)return;xoState=result.state;clearChallenge();renderXo();beginTurnChallenge();
    },700);
  }

  async function playCell(cell){
    if(!xoState||xoState.status!=='playing'||!isMoveUnlocked())return;
    if(playMode==='online'){
      if(onlineBusy)return;onlineBusy=true;clearChallenge();renderXo();
      try{await onlineSession.move(cell);}catch(error){handleOnlineError(error);}finally{onlineBusy=false;}return;
    }
    const playerId=xoState.currentPlayer,result=playXoMove(xoState,{playerId,cell});if(!result.ok)return;xoState=result.state;clearChallenge();renderXo();if(xoState.status==='playing')beginTurnChallenge();else{audio.achievement();speech.speak(xoState.status==='won'?`${PLAYERS[xoState.winner]?.displayName||''} فاز بالجولة. أحسنتم.`:'تعادل جميل. أحسنتم.');}
  }

  async function restoreOnlineRoom(){
    if(restoringOnline||!onlineSession.hasResume())return;restoringOnline=true;onBeforeEnter?.();enterGamesChrome();
    try{await onlineSession.resume();}catch(error){handleOnlineError(error);}finally{restoringOnline=false;}
  }

  function backToGames(){clearChallenge();onlineSession.forget();xoState=null;playMode='local';setXoMode(false);renderCatalog();show('gamesHomeView');}

  function bind(){
    if(bound)return;bound=true;ensureGamesShell();
    byId('gamesOpenBtn')?.addEventListener('click',enterHome);byId('gamesBackToHub')?.addEventListener('click',()=>{leave();onExitToHub?.();});
    byId('xoLobbyBack')?.addEventListener('click',backToGames);byId('xoLocalStart')?.addEventListener('click',startLocalXo);byId('xoOnlineCreate')?.addEventListener('click',createOnlineRoom);byId('xoOnlineJoin')?.addEventListener('click',joinOnlineRoom);
    document.querySelectorAll('[data-xo-learner]').forEach(button=>button.addEventListener('click',()=>chooseOnlineLearner(button.dataset.xoLearner)));
    byId('xoRoomCodeInput')?.addEventListener('input',event=>{event.target.value=String(event.target.value||'').replace(/\D/g,'').slice(0,6);});
    byId('xoBackToGames')?.addEventListener('click',backToGames);byId('xoReset')?.addEventListener('click',resetXo);byId('xoHearChallenge')?.addEventListener('click',()=>{const challenge=challengeState?.challenge;if(challenge)speech.speak(challenge.spokenPrompt||challenge.prompt||'');});
    Promise.resolve().then(restoreOnlineRoom).catch(()=>null);
  }

  return Object.freeze({start(){bind();},enter:enterHome,leave,getXoState(){return xoState;},getChallengeState(){return challengeState;},getPlayMode(){return playMode;}});
}
