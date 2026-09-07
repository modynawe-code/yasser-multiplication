import { createRpsState,nextRpsRound,resetRpsMatch,submitRpsChoice } from './rps-engine.js';
import { RPS_CHOICE_META,rpsChoiceGraphic } from './rps-graphics.js';
import { createRpsAudio } from './rps-audio.js';
import { ensureRpsShell } from './rps-shell.js';

const PLAYERS=Object.freeze({
  yasser:{name:'ياسر',theme:'yasser',avatar:'assets/visual/original/yasser/welcome.png',celebrate:'assets/visual/original/yasser/celebrate.png'},
  khaled:{name:'خالد',theme:'khaled',avatar:'assets/visual/original/khaled/khaled-point-thumbsup.png',celebrate:'assets/visual/original/khaled/khaled-celebration.png'}
});
const CHOICES=RPS_CHOICE_META;
const byId=id=>document.getElementById(id);

export function createRpsController({showView,onBack}={}){
  let bound=false,state=null,introTimer=null,transitionTimer=null,interactionLocked=false;
  const gameAudio=createRpsAudio();

  function setMode(active){document.body.classList.toggle('rps-game-mode',Boolean(active));}
  function clearTimers(){if(introTimer){clearTimeout(introTimer);introTimer=null;}if(transitionTimer){clearTimeout(transitionTimer);transitionTimer=null;}}
  function hideSections(){
    for(const id of ['rpsIntro','rpsTurn','rpsHandoff','rpsReveal','rpsFinish']){const node=byId(id);if(node)node.hidden=true;}
  }
  function setStageState(name){const stage=byId('rpsStage');if(stage)stage.dataset.state=name||'';}
  function syncPips(id,score){byId(id)?.querySelectorAll('i').forEach((pip,index)=>pip.classList.toggle('filled',index<score));}
  function syncScore(){
    if(!state)return;
    const y=state.scores.yasser||0,k=state.scores.khaled||0;
    byId('rpsScoreYasser').textContent=String(y);byId('rpsScoreKhaled').textContent=String(k);byId('rpsRoundNumber').textContent=String(state.round||1);
    syncPips('rpsPipsYasser',y);syncPips('rpsPipsKhaled',k);
  }
  function currentPlayer(){return state?.players?.[state.chooserIndex]||null;}
  function applyPlayerTheme(playerId){
    const stage=byId('rpsStage');if(stage){if(playerId)stage.dataset.player=playerId;else delete stage.dataset.player;}
  }
  function applyScoreFocus(playerId){
    byId('rpsScoreCardYasser')?.classList.toggle('current',playerId==='yasser');
    byId('rpsScoreCardKhaled')?.classList.toggle('current',playerId==='khaled');
  }
  function applyWinnerTheme(playerId){
    const stage=byId('rpsStage');if(stage){if(playerId)stage.dataset.winner=playerId;else delete stage.dataset.winner;}
  }

  function renderIntro(){
    clearTimers();gameAudio.stop();hideSections();syncScore();setStageState('intro');applyPlayerTheme(null);applyWinnerTheme(null);applyScoreFocus(null);
    const intro=byId('rpsIntro');if(intro)intro.hidden=false;
    const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    introTimer=setTimeout(()=>{introTimer=null;renderChoosing({announce:true});},reduced?250:900);
  }

  function renderChoosing({announce=false}={}){
    if(!state)return;hideSections();syncScore();interactionLocked=false;setStageState('choosing');applyWinnerTheme(null);
    const playerId=currentPlayer(),player=PLAYERS[playerId],now=byId('rpsPlayerNow'),prompt=byId('rpsPrompt'),turn=byId('rpsTurn'),avatar=byId('rpsCurrentAvatar');
    applyPlayerTheme(playerId);applyScoreFocus(playerId);
    if(avatar){avatar.src=player?.avatar||'';avatar.alt=player?.name||'';}
    if(now){now.className=`rps-player-now ${player?.theme||''}`;now.textContent=`دور ${player?.name||''}`;}
    if(prompt)prompt.textContent='اختر حركتك';
    document.querySelectorAll('[data-rps-choice]').forEach(button=>button.classList.remove('picked'));
    if(turn)turn.hidden=false;
    if(announce)gameAudio.turn(playerId);
  }

  function renderHandoff(){
    hideSections();syncScore();interactionLocked=false;setStageState('handoff');applyWinnerTheme(null);gameAudio.stop();
    const nextId=currentPlayer(),next=PLAYERS[nextId],handoff=byId('rpsHandoff'),avatar=byId('rpsHandoffAvatar'),badge=byId('rpsHandoffPlayer');
    applyPlayerTheme(nextId);applyScoreFocus(nextId);
    if(avatar){avatar.src=next?.avatar||'';avatar.alt=next?.name||'';}
    if(badge){badge.className=`rps-player-now ${next?.theme||''}`;badge.textContent=`الحين دور ${next?.name||''}`;}
    if(byId('rpsHandoffTitle'))byId('rpsHandoffTitle').textContent=`مرّر الجهاز إلى ${next?.name||'اللاعب الثاني'}`;
    if(handoff)handoff.hidden=false;
  }

  function roundResultText(){
    if(!state)return'';if(!state.roundWinner)return'تعادل! نفس الحركة';return`${PLAYERS[state.roundWinner]?.name||''} يفوز بالجولة!`;
  }

  function renderReveal(){
    hideSections();syncScore();interactionLocked=false;setStageState('reveal');applyPlayerTheme(null);applyWinnerTheme(state.roundWinner||null);applyScoreFocus(state.roundWinner||null);
    const reveal=byId('rpsReveal');if(reveal)reveal.hidden=false;
    const y=state.choices.yasser,k=state.choices.khaled;
    if(byId('rpsRevealYasser'))byId('rpsRevealYasser').innerHTML=rpsChoiceGraphic(y);
    if(byId('rpsRevealKhaled'))byId('rpsRevealKhaled').innerHTML=rpsChoiceGraphic(k);
    if(byId('rpsResultText'))byId('rpsResultText').textContent=roundResultText();
    const point=byId('rpsPointPop');if(point){point.className=`rps-point-pop ${state.roundWinner||''}`;point.textContent=state.roundWinner?'+1':'';}
    const next=byId('rpsNextRound');if(next)next.textContent=state.status==='finished'?'شوف الفائز 🏆':'الجولة التالية';
    gameAudio.reveal();
    if(state.status==='finished')return;
    transitionTimer=setTimeout(()=>{
      transitionTimer=null;
      if(state.roundWinner){gameAudio.pointSfx();gameAudio.point(state.roundWinner);}else gameAudio.draw();
    },260);
  }

  function renderFinish(){
    hideSections();syncScore();interactionLocked=false;setStageState('finish');applyPlayerTheme(null);
    const finish=byId('rpsFinish'),winnerId=state?.matchWinner,winner=PLAYERS[winnerId];applyWinnerTheme(winnerId||null);applyScoreFocus(winnerId||null);
    if(finish)finish.hidden=false;
    if(byId('rpsFinishTitle'))byId('rpsFinishTitle').textContent=`${winner?.name||''} بطل المباراة!`;
    if(byId('rpsFinalScore'))byId('rpsFinalScore').textContent=`${PLAYERS.yasser.name} ${state?.scores?.yasser||0}  —  ${state?.scores?.khaled||0} ${PLAYERS.khaled.name}`;
    if(byId('rpsFinishArt'))byId('rpsFinishArt').innerHTML=winner?`<img src="${winner.celebrate}" alt="" decoding="async">`:'';
    if(winnerId)gameAudio.win(winnerId);
  }

  function choose(choice,button){
    if(interactionLocked||!state||state.status!=='choosing')return;
    const playerId=currentPlayer(),result=submitRpsChoice(state,{playerId,choice});if(!result.ok)return;
    interactionLocked=true;state=result.state;button?.classList.add('picked');gameAudio.choose();
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
    clearTimers();gameAudio.stop();
    const result=state?resetRpsMatch(state):{ok:true,state:createRpsState()};if(!result.ok)return;state=result.state;renderIntro();
  }
  function start(){
    ensureRpsShell();bind();state=createRpsState();setMode(true);showView?.('rpsGameView');renderIntro();
  }
  function leave(){clearTimers();interactionLocked=false;setMode(false);gameAudio.stop();state=null;applyPlayerTheme(null);applyWinnerTheme(null);applyScoreFocus(null);onBack?.();}

  function bind(){
    if(bound)return;bound=true;ensureRpsShell();
    byId('rpsBackToGames')?.addEventListener('click',leave);byId('rpsResetMatch')?.addEventListener('click',reset);byId('rpsHandoffContinue')?.addEventListener('click',continueHandoff);byId('rpsNextRound')?.addEventListener('click',advance);byId('rpsPlayAgain')?.addEventListener('click',reset);
    document.querySelectorAll('[data-rps-choice]').forEach(button=>button.addEventListener('click',()=>choose(button.dataset.rpsChoice,button)));
  }

  return Object.freeze({start,leave,getState(){return state;}});
}
