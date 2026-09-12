import { createRpsState,nextRpsRound,resetRpsMatch,submitRpsChoice } from './rps-engine.js';
import { RPS_CHOICE_META,rpsChoiceGraphic } from './rps-graphics.js';
import { createRpsAudio } from './rps-audio.js';
import { createRpsEventBridge } from './rps-events.js';
import { createRpsOnlineSession,normalizeOnlineRpsRoom } from './rps-online-session.js';
import { createGameRoomClient } from '../online/game-room-client.js';
import { ensureRpsShell } from './rps-shell.js';
import { getGameParticipant,listGameParticipants,gameParticipantMarkup } from '../core/game-participant-registry.js';

const CHOICES=RPS_CHOICE_META;
const RPS_INTRO_DURATION_MS=2200;
const RPS_INTRO_REDUCED_MOTION_DURATION_MS=1800;
const byId=id=>document.getElementById(id);

export function createRpsController({showView,onBack,onGameEvent,roomClient=createGameRoomClient()}={}){
  let bound=false,state=null,introTimer=null,transitionTimer=null,interactionLocked=false,selectedPlayers=[];
  let playMode='local',selectedOnlineLearner=null,onlineBusy=false,onlineLastStatus='',onlineMatchSequence=0,onlineCompletionKey='',onlineFinishShownKey='';
  const gameAudio=createRpsAudio(),gameEvents=createRpsEventBridge({onEvent:onGameEvent});
  const onlineSession=createRpsOnlineSession({roomClient,onRoom:handleOnlineRoom,onError:handleOnlineError});

  function participant(id){return getGameParticipant(id);}
  function participants(){return listGameParticipants();}
  function ensureSelectedPair(){
    const available=participants(),ids=new Set(available.map(item=>item.learnerId));
    selectedPlayers=selectedPlayers.filter(id=>ids.has(id));
    for(const item of available){if(selectedPlayers.length>=2)break;if(!selectedPlayers.includes(item.learnerId))selectedPlayers.push(item.learnerId);}
    if(selectedPlayers.length>2)selectedPlayers=selectedPlayers.slice(0,2);
    return available;
  }
  function playerVisual(player){return player?gameParticipantMarkup(player,{fallbackClass:'rps-participant-fallback'}):'';}
  function setVisual(id,player){const host=byId(id);if(host)host.innerHTML=playerVisual(player);}
  function setMode(active){document.body.classList.toggle('rps-game-mode',Boolean(active));}
  function clearTimers(){if(introTimer){clearTimeout(introTimer);introTimer=null;}if(transitionTimer){clearTimeout(transitionTimer);transitionTimer=null;}}
  function hideSections(){
    for(const id of ['rpsSetup','rpsIntro','rpsTurn','rpsHandoff','rpsOnlineWait','rpsReveal','rpsFinish']){const node=byId(id);if(node)node.hidden=true;}
  }
  function setStageState(name){const stage=byId('rpsStage');if(stage)stage.dataset.state=name||'';}
  function syncPips(id,score){byId(id)?.querySelectorAll('i').forEach((pip,index)=>pip.classList.toggle('filled',index<score));}
  function slotSuffix(index){return index===0?'A':'B';}
  function activePlayerIds(){return state?.players?.length===2?[...state.players]:[...selectedPlayers];}

  function syncPlayerSlots(){
    const ids=activePlayerIds();
    ids.forEach((playerId,index)=>{
      const player=participant(playerId);if(!player)return;
      const suffix=slotSuffix(index),card=byId(`rpsScoreCard${suffix}`),intro=byId(`rpsIntroPlayer${suffix}`),reveal=byId(`rpsRevealSide${suffix}`);
      if(card){card.className=`rps-score-card ${player.theme}`;card.dataset.playerId=playerId;}
      if(intro){intro.className=`rps-intro-player ${player.theme}`;intro.dataset.playerId=playerId;}
      if(reveal){reveal.className=`rps-battle-side ${player.theme}`;reveal.dataset.playerId=playerId;}
      setVisual(`rpsScoreAvatar${suffix}`,player);setVisual(`rpsIntroAvatar${suffix}`,player);setVisual(`rpsRevealAvatar${suffix}`,player);
      const scoreName=byId(`rpsScoreName${suffix}`),introName=byId(`rpsIntroName${suffix}`),revealName=byId(`rpsRevealName${suffix}`);
      if(scoreName)scoreName.textContent=player.displayName;if(introName)introName.textContent=player.displayName;if(revealName)revealName.textContent=player.displayName;
    });
  }

  function syncScore(){
    if(playMode==='local')ensureSelectedPair();syncPlayerSlots();
    const ids=activePlayerIds();
    ids.forEach((playerId,index)=>{
      const suffix=slotSuffix(index),score=state?.scores?.[playerId]||0,node=byId(`rpsScore${suffix}`);
      if(node)node.textContent=String(score);syncPips(`rpsPips${suffix}`,score);
    });
    const round=byId('rpsRoundNumber');if(round)round.textContent=String(state?.round||1);
  }
  function currentPlayer(){return state?.players?.[state.chooserIndex]||null;}
  function applyPlayerTheme(playerId){
    const stage=byId('rpsStage'),player=participant(playerId);if(stage){if(player)stage.dataset.player=player.theme;else delete stage.dataset.player;}
  }
  function applyScoreFocus(playerId){
    const ids=activePlayerIds();ids.forEach((id,index)=>byId(`rpsScoreCard${slotSuffix(index)}`)?.classList.toggle('current',id===playerId));
  }
  function applyWinnerTheme(playerId){
    const stage=byId('rpsStage'),player=participant(playerId);if(stage){if(player)stage.dataset.winner=player.theme;else delete stage.dataset.winner;}
  }

  function renderPicker(){
    const available=ensureSelectedPair(),host=byId('rpsPlayerPicker');if(!host)return;
    host.innerHTML=available.map(player=>{
      const selected=selectedPlayers.includes(player.learnerId);
      return `<button class="rps-player-pick ${player.theme} ${selected?'selected':''}" data-rps-player="${player.learnerId}" aria-pressed="${selected?'true':'false'}">${playerVisual(player)}<strong>${player.displayName}</strong></button>`;
    }).join('');
    host.querySelectorAll('[data-rps-player]').forEach(button=>button.addEventListener('click',()=>togglePlayer(button.dataset.rpsPlayer)));
    const start=byId('rpsStartMatch');if(start)start.disabled=selectedPlayers.length!==2;
  }
  function togglePlayer(playerId){
    if(selectedPlayers.includes(playerId)){
      if(selectedPlayers.length>1)selectedPlayers=selectedPlayers.filter(id=>id!==playerId);
    }else if(selectedPlayers.length<2)selectedPlayers=[...selectedPlayers,playerId];
    else selectedPlayers=[selectedPlayers[1],playerId];
    renderPicker();syncScore();
  }

  function renderOnlinePicker(){
    const host=byId('rpsOnlinePlayerPicker');if(!host)return;
    host.innerHTML=participants().map(player=>{
      const selected=selectedOnlineLearner===player.learnerId;
      return `<button class="rps-player-pick ${player.theme} ${selected?'selected':''}" data-rps-online-player="${player.learnerId}" aria-pressed="${selected?'true':'false'}">${playerVisual(player)}<strong>${player.displayName}</strong></button>`;
    }).join('');
    host.querySelectorAll('[data-rps-online-player]').forEach(button=>button.addEventListener('click',()=>{
      selectedOnlineLearner=button.dataset.rpsOnlinePlayer;renderOnlinePicker();setOnlineStatus(`هذا الجهاز مع ${participant(selectedOnlineLearner)?.displayName||selectedOnlineLearner}.`);
    }));
    const resume=byId('rpsResumeRoom');if(resume)resume.hidden=!onlineSession.hasResume(selectedOnlineLearner||null);
  }
  function setOnlineStatus(message,error=false){const node=byId('rpsOnlineStatus');if(node){node.textContent=message||'';node.classList.toggle('error',Boolean(error));}}
  function setRoomCode(code){const box=byId('rpsRoomCodeBox'),value=byId('rpsRoomCode');if(value)value.textContent=code||'------';if(box)box.hidden=!code;}
  function syncSetupMode(){
    document.querySelectorAll('[data-rps-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.rpsMode===playMode)));
    const local=byId('rpsLocalSetupPanel'),online=byId('rpsOnlineSetupPanel');if(local)local.hidden=playMode!=='local';if(online)online.hidden=playMode!=='online';
    if(playMode==='online')renderOnlinePicker();else renderPicker();
  }
  function chooseMode(mode){
    const next=mode==='online'?'online':'local';if(next===playMode)return;
    if(next==='local')onlineSession.stop();
    playMode=next;interactionLocked=false;setRoomCode('');setOnlineStatus('');syncSetupMode();syncScore();
  }

  function renderSetup(){
    clearTimers();gameAudio.stop();gameEvents.reset();state=null;interactionLocked=false;hideSections();setStageState('setup');applyPlayerTheme(null);applyWinnerTheme(null);applyScoreFocus(null);ensureSelectedPair();syncScore();
    const setup=byId('rpsSetup');if(setup)setup.hidden=false;syncSetupMode();
    const reset=byId('rpsResetMatch');if(reset)reset.disabled=false;
  }
  function beginMatch(){
    if(playMode!=='local')return;ensureSelectedPair();if(selectedPlayers.length!==2)return;
    state=createRpsState({players:[...selectedPlayers],targetScore:3});gameEvents.begin(state.players);syncScore();renderIntro();
  }

  function renderIntro(){
    clearTimers();gameAudio.stop();hideSections();syncScore();setStageState('intro');applyPlayerTheme(null);applyWinnerTheme(null);applyScoreFocus(null);
    const intro=byId('rpsIntro');if(intro)intro.hidden=false;
    const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    introTimer=setTimeout(()=>{introTimer=null;renderChoosing({announce:true});},reduced?RPS_INTRO_REDUCED_MOTION_DURATION_MS:RPS_INTRO_DURATION_MS);
  }

  function renderChoosing({announce=false}={}){
    if(!state)return;hideSections();syncScore();interactionLocked=false;setStageState('choosing');applyWinnerTheme(null);
    const playerId=currentPlayer(),player=participant(playerId),now=byId('rpsPlayerNow'),prompt=byId('rpsPrompt'),turn=byId('rpsTurn');
    applyPlayerTheme(playerId);applyScoreFocus(playerId);setVisual('rpsCurrentAvatar',player);
    if(now){now.className=`rps-player-now ${player?.theme||''}`;now.textContent=`دور ${player?.displayName||''}`;}
    if(prompt)prompt.textContent='اختر حركتك';
    document.querySelectorAll('[data-rps-choice]').forEach(button=>{button.classList.remove('picked');button.disabled=false;});
    if(turn)turn.hidden=false;
    const reset=byId('rpsResetMatch');if(reset)reset.disabled=false;
    if(announce&&player)gameAudio.turn(player);
  }

  function renderOnlineChoosing(){
    if(!state)return;hideSections();syncScore();interactionLocked=false;setStageState('choosing');applyWinnerTheme(null);
    const selfId=onlineSession.snapshot.selfLearnerId,player=participant(selfId),now=byId('rpsPlayerNow'),prompt=byId('rpsPrompt'),turn=byId('rpsTurn');
    applyPlayerTheme(selfId);applyScoreFocus(selfId);setVisual('rpsCurrentAvatar',player);
    if(now){now.className=`rps-player-now ${player?.theme||''}`;now.textContent=`دور ${player?.displayName||''}`;}
    if(prompt)prompt.textContent='اختر حركتك — اختيارك سري';
    document.querySelectorAll('[data-rps-choice]').forEach(button=>{button.classList.remove('picked');button.disabled=false;});
    if(turn)turn.hidden=false;
    const reset=byId('rpsResetMatch');if(reset)reset.disabled=true;
  }

  function renderHandoff(){
    hideSections();syncScore();interactionLocked=false;setStageState('handoff');applyWinnerTheme(null);gameAudio.stop();
    const nextId=currentPlayer(),next=participant(nextId),handoff=byId('rpsHandoff'),badge=byId('rpsHandoffPlayer');
    applyPlayerTheme(nextId);applyScoreFocus(nextId);setVisual('rpsHandoffAvatar',next);
    if(badge){badge.className=`rps-player-now ${next?.theme||''}`;badge.textContent=`الحين دور ${next?.displayName||''}`;}
    if(byId('rpsHandoffTitle'))byId('rpsHandoffTitle').textContent=`مرّر الجهاز إلى ${next?.displayName||'اللاعب الثاني'}`;
    if(handoff)handoff.hidden=false;
  }

  function renderOnlineWait(){
    hideSections();syncScore();interactionLocked=true;setStageState('online-wait');applyWinnerTheme(null);gameAudio.stop();
    const selfId=onlineSession.snapshot.selfLearnerId,self=participant(selfId),opponentId=state?.players?.find(id=>id!==selfId),opponent=participant(opponentId),wait=byId('rpsOnlineWait');
    applyPlayerTheme(selfId);applyScoreFocus(selfId);setVisual('rpsOnlineWaitAvatar',self);
    const title=byId('rpsOnlineWaitTitle'),copy=byId('rpsOnlineWaitCopy');if(title)title.textContent='تم اختيارك ✓';if(copy)copy.textContent=`بانتظار اختيار ${opponent?.displayName||'اللاعب الثاني'}…`;
    if(wait)wait.hidden=false;
    const reset=byId('rpsResetMatch');if(reset)reset.disabled=true;
  }

  function roundResultText(){
    if(!state)return'';if(!state.roundWinner)return'تعادل! نفس الحركة';return`${participant(state.roundWinner)?.displayName||''} يفوز بالجولة!`;
  }

  function renderReveal(){
    hideSections();syncScore();interactionLocked=false;setStageState('reveal');applyPlayerTheme(null);applyWinnerTheme(state.roundWinner||null);applyScoreFocus(state.roundWinner||null);
    const reveal=byId('rpsReveal');if(reveal)reveal.hidden=false;
    const [a,b]=state.players;
    if(byId('rpsRevealA'))byId('rpsRevealA').innerHTML=rpsChoiceGraphic(state.choices[a]);
    if(byId('rpsRevealB'))byId('rpsRevealB').innerHTML=rpsChoiceGraphic(state.choices[b]);
    if(byId('rpsResultText'))byId('rpsResultText').textContent=roundResultText();
    const winner=participant(state.roundWinner),point=byId('rpsPointPop');if(point){point.className=`rps-point-pop ${winner?.theme||''}`;point.textContent=state.roundWinner?'+1':'';}
    const next=byId('rpsNextRound');
    if(next){
      next.hidden=false;
      if(playMode==='online'&&state.status!=='finished'){
        const host=onlineSession.snapshot.authorityRole==='host';next.disabled=!host;next.textContent=host?'الجولة التالية':'بانتظار صاحب الغرفة…';
      }else{next.disabled=false;next.textContent=state.status==='finished'?'شوف الفائز 🏆':'الجولة التالية';}
    }
    const reset=byId('rpsResetMatch');if(reset)reset.disabled=playMode==='online';
    gameAudio.reveal();
    if(state.status==='finished')return;
    transitionTimer=setTimeout(()=>{
      transitionTimer=null;
      if(state.roundWinner&&winner){gameAudio.pointSfx();gameAudio.point(winner);}else gameAudio.draw();
    },260);
  }

  function renderFinish(){
    hideSections();syncScore();interactionLocked=false;setStageState('finish');applyPlayerTheme(null);
    const finish=byId('rpsFinish'),winnerId=state?.matchWinner,winner=participant(winnerId);applyWinnerTheme(winnerId||null);applyScoreFocus(winnerId||null);
    if(finish)finish.hidden=false;
    if(byId('rpsFinishTitle'))byId('rpsFinishTitle').textContent=`${winner?.displayName||''} بطل المباراة!`;
    const [a,b]=state?.players||[],playerA=participant(a),playerB=participant(b);
    if(byId('rpsFinalScore'))byId('rpsFinalScore').textContent=`${playerA?.displayName||''} ${state?.scores?.[a]||0}  —  ${state?.scores?.[b]||0} ${playerB?.displayName||''}`;
    const art=byId('rpsFinishArt');if(art)art.innerHTML=winner?(winner.celebrationAvatar?`<img src="${winner.celebrationAvatar}" alt="" decoding="async">`:playerVisual(winner)):'';
    const playAgain=byId('rpsPlayAgain'),change=byId('rpsChangePlayers');
    if(playMode==='online'){
      const selfId=onlineSession.snapshot.selfLearnerId,ready=state?.rematchReady?.includes(selfId);if(playAgain){playAgain.disabled=ready;playAgain.textContent=ready?'تم — بانتظار الطرف الثاني':'العبوا مرة ثانية';}if(change)change.hidden=true;
    }else{
      if(playAgain){playAgain.disabled=false;playAgain.textContent='العبوا مرة ثانية';}if(change)change.hidden=false;
      gameEvents.complete({players:state?.players||[],winner:winnerId,scores:state?.scores||{},round:state?.round||null});
    }
    const reset=byId('rpsResetMatch');if(reset)reset.disabled=false;
    if(winner)gameAudio.win(winner);
  }

  async function choose(choice,button){
    if(interactionLocked||!state)return;
    if(playMode==='online'){
      if(state.status!=='playing'||state.phase!=='choosing'||onlineSession.hasChosen())return;
      interactionLocked=true;button?.classList.add('picked');document.querySelectorAll('[data-rps-choice]').forEach(item=>item.disabled=true);gameAudio.choose();
      const selfId=onlineSession.snapshot.selfLearnerId;
      try{await onlineSession.choose(choice);gameEvents.choice(selfId,{choice,round:state.round});}
      catch(error){handleOnlineError(error);}
      finally{interactionLocked=false;}
      return;
    }
    if(state.status!=='choosing')return;
    const playerId=currentPlayer(),result=submitRpsChoice(state,{playerId,choice});if(!result.ok)return;
    interactionLocked=true;state=result.state;gameEvents.choice(playerId,{choice,round:state.round});button?.classList.add('picked');gameAudio.choose();
    transitionTimer=setTimeout(()=>{
      transitionTimer=null;
      if(result.reveal)renderReveal();else renderHandoff();
    },180);
  }

  function continueHandoff(){if(playMode==='local')renderChoosing({announce:true});}
  async function advance(){
    if(!state)return;
    if(playMode==='online'){
      if(state.status==='finished'){onlineFinishShownKey=onlineFinishKey(state);renderFinish();return;}
      if(state.phase!=='revealed'||onlineSession.snapshot.authorityRole!=='host')return;
      if(onlineBusy)return;onlineBusy=true;try{await onlineSession.next();}catch(error){handleOnlineError(error);}finally{onlineBusy=false;}return;
    }
    if(state.status==='finished'){renderFinish();return;}
    const result=nextRpsRound(state);if(!result.ok)return;state=result.state;renderChoosing({announce:true});
  }
  async function reset(){
    clearTimers();gameAudio.stop();
    if(playMode==='online'){
      if(!state||state.status!=='finished'||onlineBusy)return;const selfId=onlineSession.snapshot.selfLearnerId;if(state.rematchReady?.includes(selfId))return;
      onlineBusy=true;try{await onlineSession.reset();}catch(error){handleOnlineError(error);}finally{onlineBusy=false;}return;
    }
    if(!state){renderSetup();return;}
    const result=resetRpsMatch(state);if(!result.ok)return;state=result.state;gameEvents.begin(state.players);renderIntro();
  }

  function onlineFinishKey(next=state){return `${onlineSession.snapshot.code}:${next?.round||0}:${next?.matchWinner||''}`;}
  function syncOnlineEvents(next){
    const snap=onlineSession.snapshot,selfId=snap.selfLearnerId;if(!selfId)return;
    const newMatch=!gameEvents.getSessionId()||(onlineLastStatus==='finished'&&next.status==='playing');
    if(newMatch&&next.status==='playing'){
      onlineMatchSequence+=1;gameEvents.reset();gameEvents.begin([selfId],{sessionId:`rps-online-${snap.code}-${onlineMatchSequence}`,learnerIds:[selfId],payload:{mode:'online'}});onlineCompletionKey='';onlineFinishShownKey='';
    }
    if(next.status==='finished'){
      const key=onlineFinishKey(next);if(key&&key!==onlineCompletionKey){onlineCompletionKey=key;gameEvents.complete({players:[selfId],winner:next.matchWinner,learnerIds:[selfId],scores:next.scores||{},round:next.round||null,payload:{mode:'online'}});}
    }
    onlineLastStatus=next.status;
  }
  function renderOnlineRoom(room){
    const next=normalizeOnlineRpsRoom(room);state={...next,players:[...next.players],scores:{...next.scores},choices:{...next.choices},rematchReady:[...next.rematchReady]};selectedPlayers=[...state.players];syncScore();
    const snap=onlineSession.snapshot;if(snap.code)setRoomCode(snap.code);if(snap.selfLearnerId)selectedOnlineLearner=snap.selfLearnerId;
    if(state.status==='waiting'){
      hideSections();setStageState('setup');const setup=byId('rpsSetup');if(setup)setup.hidden=false;syncSetupMode();setOnlineStatus('بانتظار اللاعب الثاني…');return;
    }
    syncOnlineEvents(state);setOnlineStatus('');
    if(state.status==='finished'){
      if(onlineFinishShownKey===onlineFinishKey(state))renderFinish();else renderReveal();return;
    }
    if(state.phase==='revealed'){renderReveal();return;}
    if(onlineSession.hasChosen()){renderOnlineWait();return;}
    renderOnlineChoosing();
  }
  function handleOnlineRoom(room){if(playMode!=='online'||!room)return;renderOnlineRoom(room);}
  function handleOnlineError(error){
    if(playMode!=='online')return;
    const code=error?.body?.error||error?.message||'';
    const messages={room_not_found:'الغرفة غير موجودة أو انتهت.',room_full:'الغرفة مكتملة.',learner_already_in_room:'هذا الطفل موجود في الغرفة بالفعل.',room_not_waiting:'المباراة بدأت بالفعل.',version_conflict:'تم تحديث حالة المباراة، حاول مرة أخرى.'};
    setOnlineStatus(messages[code]||'تعذر الاتصال بالغرفة. حاول مرة أخرى.',true);
  }
  async function createOnlineRoom(){
    if(!selectedOnlineLearner){setOnlineStatus('اختر الطفل صاحب هذا الجهاز أولًا.',true);return;}if(onlineBusy)return;onlineBusy=true;setOnlineStatus('ننشئ الغرفة…');setRoomCode('');
    try{await onlineSession.create(selectedOnlineLearner);const snap=onlineSession.snapshot;setRoomCode(snap.code);setOnlineStatus('بانتظار اللاعب الثاني…');}
    catch(error){handleOnlineError(error);}finally{onlineBusy=false;}
  }
  async function joinOnlineRoom(){
    if(!selectedOnlineLearner){setOnlineStatus('اختر الطفل صاحب هذا الجهاز أولًا.',true);return;}const code=String(byId('rpsRoomCodeInput')?.value||'').replace(/\D/g,'').slice(0,6);if(code.length!==6){setOnlineStatus('اكتب رمز الغرفة المكوّن من 6 أرقام.',true);return;}if(onlineBusy)return;onlineBusy=true;setOnlineStatus('ندخل الغرفة…');
    try{await onlineSession.join(code,selectedOnlineLearner);}
    catch(error){handleOnlineError(error);}finally{onlineBusy=false;}
  }
  async function resumeOnlineRoom(){
    if(onlineBusy)return;onlineBusy=true;setOnlineStatus('نستعيد الغرفة…');
    try{const room=await onlineSession.resume({learnerId:selectedOnlineLearner||null});if(!room){setOnlineStatus('لا توجد غرفة محفوظة.',true);return;}selectedOnlineLearner=onlineSession.snapshot.selfLearnerId;renderOnlineRoom(room);}
    catch(error){handleOnlineError(error);}finally{onlineBusy=false;}
  }

  function start(){
    ensureRpsShell();bind();setMode(true);showView?.('rpsGameView');playMode='local';selectedOnlineLearner=null;onlineLastStatus='';onlineMatchSequence=0;onlineCompletionKey='';onlineFinishShownKey='';renderSetup();
  }
  function leave(){clearTimers();interactionLocked=false;setMode(false);gameAudio.stop();gameEvents.reset();onlineSession.forget();state=null;applyPlayerTheme(null);applyWinnerTheme(null);applyScoreFocus(null);playMode='local';onBack?.();}

  function bind(){
    if(bound)return;bound=true;ensureRpsShell();
    byId('rpsBackToGames')?.addEventListener('click',leave);byId('rpsFinishBackToGames')?.addEventListener('click',leave);byId('rpsResetMatch')?.addEventListener('click',reset);byId('rpsStartMatch')?.addEventListener('click',beginMatch);byId('rpsChangePlayers')?.addEventListener('click',renderSetup);byId('rpsHandoffContinue')?.addEventListener('click',continueHandoff);byId('rpsNextRound')?.addEventListener('click',advance);byId('rpsPlayAgain')?.addEventListener('click',reset);
    byId('rpsCreateRoom')?.addEventListener('click',createOnlineRoom);byId('rpsJoinRoom')?.addEventListener('click',joinOnlineRoom);byId('rpsResumeRoom')?.addEventListener('click',resumeOnlineRoom);
    document.querySelectorAll('[data-rps-mode]').forEach(button=>button.addEventListener('click',()=>chooseMode(button.dataset.rpsMode)));
    document.querySelectorAll('[data-rps-choice]').forEach(button=>button.addEventListener('click',()=>choose(button.dataset.rpsChoice,button)));
  }

  return Object.freeze({start,leave,getState(){return state;},getSelectedPlayers(){return Object.freeze([...selectedPlayers]);},getPlayMode(){return playMode;},getOnlineSnapshot(){return onlineSession.snapshot;}});
}