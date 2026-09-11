import { createRpsState,nextRpsRound,resetRpsMatch,submitRpsChoice } from './rps-engine.js';
import { RPS_CHOICE_META,rpsChoiceGraphic } from './rps-graphics.js';
import { createRpsAudio } from './rps-audio.js';
import { createRpsEventBridge } from './rps-events.js';
import { ensureRpsShell } from './rps-shell.js';
import { getGameParticipant,listGameParticipants,gameParticipantMarkup } from '../core/game-participant-registry.js';

const CHOICES=RPS_CHOICE_META;
const RPS_INTRO_DURATION_MS=2200;
const RPS_INTRO_REDUCED_MOTION_DURATION_MS=1800;
const byId=id=>document.getElementById(id);

export function createRpsController({showView,onBack,onGameEvent}={}){
  let bound=false,state=null,introTimer=null,transitionTimer=null,interactionLocked=false,selectedPlayers=[];
  const gameAudio=createRpsAudio(),gameEvents=createRpsEventBridge({onEvent:onGameEvent});

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
    for(const id of ['rpsSetup','rpsIntro','rpsTurn','rpsHandoff','rpsReveal','rpsFinish']){const node=byId(id);if(node)node.hidden=true;}
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
    ensureSelectedPair();syncPlayerSlots();
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
  function renderSetup(){
    clearTimers();gameAudio.stop();gameEvents.reset();state=null;interactionLocked=false;hideSections();setStageState('setup');applyPlayerTheme(null);applyWinnerTheme(null);applyScoreFocus(null);ensureSelectedPair();syncScore();renderPicker();
    const setup=byId('rpsSetup');if(setup)setup.hidden=false;
  }
  function beginMatch(){
    ensureSelectedPair();if(selectedPlayers.length!==2)return;
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
    document.querySelectorAll('[data-rps-choice]').forEach(button=>button.classList.remove('picked'));
    if(turn)turn.hidden=false;
    if(announce&&player)gameAudio.turn(player);
  }

  function renderHandoff(){
    hideSections();syncScore();interactionLocked=false;setStageState('handoff');applyWinnerTheme(null);gameAudio.stop();
    const nextId=currentPlayer(),next=participant(nextId),handoff=byId('rpsHandoff'),badge=byId('rpsHandoffPlayer');
    applyPlayerTheme(nextId);applyScoreFocus(nextId);setVisual('rpsHandoffAvatar',next);
    if(badge){badge.className=`rps-player-now ${next?.theme||''}`;badge.textContent=`الحين دور ${next?.displayName||''}`;}
    if(byId('rpsHandoffTitle'))byId('rpsHandoffTitle').textContent=`مرّر الجهاز إلى ${next?.displayName||'اللاعب الثاني'}`;
    if(handoff)handoff.hidden=false;
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
    const next=byId('rpsNextRound');if(next)next.textContent=state.status==='finished'?'شوف الفائز 🏆':'الجولة التالية';
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
    gameEvents.complete({players:state?.players||[],winner:winnerId,scores:state?.scores||{},round:state?.round||null});
    if(winner)gameAudio.win(winner);
  }

  function choose(choice,button){
    if(interactionLocked||!state||state.status!=='choosing')return;
    const playerId=currentPlayer(),result=submitRpsChoice(state,{playerId,choice});if(!result.ok)return;
    interactionLocked=true;state=result.state;gameEvents.choice(playerId,{choice,round:state.round});button?.classList.add('picked');gameAudio.choose();
    transitionTimer=setTimeout(()=>{
      transitionTimer=null;
      if(result.reveal)renderReveal();else renderHandoff();
    },180);
  }

  function continueHandoff(){renderChoosing({announce:true});}
  function advance(){
    if(!state)return;if(state.status==='finished'){renderFinish();return;}
    const result=nextRpsRound(state);if(!result.ok)return;state=result.state;renderChoosing({announce:true});
  }
  function reset(){
    clearTimers();gameAudio.stop();if(!state){renderSetup();return;}
    const result=resetRpsMatch(state);if(!result.ok)return;state=result.state;gameEvents.begin(state.players);renderIntro();
  }
  function start(){
    ensureRpsShell();bind();setMode(true);showView?.('rpsGameView');renderSetup();
  }
  function leave(){clearTimers();interactionLocked=false;setMode(false);gameAudio.stop();gameEvents.reset();state=null;applyPlayerTheme(null);applyWinnerTheme(null);applyScoreFocus(null);onBack?.();}

  function bind(){
    if(bound)return;bound=true;ensureRpsShell();
    byId('rpsBackToGames')?.addEventListener('click',leave);byId('rpsFinishBackToGames')?.addEventListener('click',leave);byId('rpsResetMatch')?.addEventListener('click',reset);byId('rpsStartMatch')?.addEventListener('click',beginMatch);byId('rpsChangePlayers')?.addEventListener('click',renderSetup);byId('rpsHandoffContinue')?.addEventListener('click',continueHandoff);byId('rpsNextRound')?.addEventListener('click',advance);byId('rpsPlayAgain')?.addEventListener('click',reset);
    document.querySelectorAll('[data-rps-choice]').forEach(button=>button.addEventListener('click',()=>choose(button.dataset.rpsChoice,button)));
  }

  return Object.freeze({start,leave,getState(){return state;},getSelectedPlayers(){return Object.freeze([...selectedPlayers]);}});
}
