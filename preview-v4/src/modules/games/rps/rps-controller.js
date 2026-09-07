import { createRpsState,nextRpsRound,resetRpsMatch,submitRpsChoice } from './rps-engine.js';
import { RPS_CHOICE_META,rpsChoiceGraphic } from './rps-graphics.js';
import { ensureRpsShell } from './rps-shell.js';
import { createSpeechService } from '../../../shared/audio/speech-service.js';
import { createFeedbackAudio } from '../../../ui/audio/feedback-audio.js';

const PLAYERS=Object.freeze({
  yasser:{name:'ياسر',theme:'yasser',celebrate:'assets/visual/original/yasser/celebrate.png'},
  khaled:{name:'خالد',theme:'khaled',celebrate:'assets/visual/original/khaled/khaled-celebration.png'}
});
const CHOICES=RPS_CHOICE_META;

const byId=id=>document.getElementById(id);

export function createRpsController({showView,onBack}={}){
  let bound=false,state=null;
  const speech=createSpeechService(),audio=createFeedbackAudio();

  function setMode(active){document.body.classList.toggle('rps-game-mode',Boolean(active));}
  function hideSections(){
    for(const id of ['rpsChoices','rpsHandoff','rpsReveal','rpsFinish']){const node=byId(id);if(node)node.hidden=true;}
  }
  function syncScore(){
    if(!state)return;byId('rpsScoreYasser').textContent=String(state.scores.yasser||0);byId('rpsScoreKhaled').textContent=String(state.scores.khaled||0);byId('rpsRoundNumber').textContent=String(state.round||1);
  }
  function currentPlayer(){return state?.players?.[state.chooserIndex]||null;}
  function applyPlayerTheme(playerId){
    const stage=byId('rpsStage');if(stage){if(playerId)stage.dataset.player=playerId;else delete stage.dataset.player;}
    byId('rpsScoreCardYasser')?.classList.toggle('current',playerId==='yasser');
    byId('rpsScoreCardKhaled')?.classList.toggle('current',playerId==='khaled');
  }

  function renderChoosing(){
    if(!state)return;hideSections();syncScore();
    const playerId=currentPlayer(),player=PLAYERS[playerId],now=byId('rpsPlayerNow'),prompt=byId('rpsPrompt'),choices=byId('rpsChoices');
    applyPlayerTheme(playerId);
    if(now){now.className=`rps-player-now ${player?.theme||''}`;now.textContent=`دور ${player?.name||''}`;}
    if(prompt)prompt.textContent=`${player?.name||''}، اختار حركتك بسرية`;
    if(choices)choices.hidden=false;
  }

  function renderHandoff(){
    hideSections();syncScore();const nextId=currentPlayer(),next=PLAYERS[nextId],handoff=byId('rpsHandoff');applyPlayerTheme(nextId);
    if(byId('rpsPlayerNow')){const now=byId('rpsPlayerNow');now.className=`rps-player-now ${next?.theme||''}`;now.textContent=`دور ${next?.name||''}`;}
    if(byId('rpsPrompt'))byId('rpsPrompt').textContent='لا تطالع اختيار أخوك 👀';
    if(byId('rpsHandoffTitle'))byId('rpsHandoffTitle').textContent=`مرّر الجهاز إلى ${next?.name||'اللاعب الثاني'}`;
    if(handoff)handoff.hidden=false;
  }

  function roundResultText(){
    if(!state)return'';if(!state.roundWinner)return'تعادل! نفس الاختيار 😄';return`${PLAYERS[state.roundWinner]?.name||''} أخذ نقطة ⭐`;
  }

  function renderReveal(){
    hideSections();syncScore();applyPlayerTheme(state.roundWinner||null);const reveal=byId('rpsReveal');if(reveal)reveal.hidden=false;
    const y=state.choices.yasser,k=state.choices.khaled;
    if(byId('rpsRevealYasser'))byId('rpsRevealYasser').innerHTML=rpsChoiceGraphic(y);if(byId('rpsRevealKhaled'))byId('rpsRevealKhaled').innerHTML=rpsChoiceGraphic(k);
    if(byId('rpsResultText'))byId('rpsResultText').textContent=roundResultText();
    const next=byId('rpsNextRound');if(next)next.textContent=state.status==='finished'?'شوف الفائز 🎉':'الجولة التالية';
    if(state.status==='finished'){audio.achievement();speech.speak(`${PLAYERS[state.matchWinner]?.name||''} فاز بالمباراة. مبروك.`);}else if(state.roundWinner){audio.correct();speech.speak(`${PLAYERS[state.roundWinner]?.name||''} أخذ نقطة.`);}
  }

  function renderFinish(){
    hideSections();syncScore();const finish=byId('rpsFinish'),winner=PLAYERS[state?.matchWinner];if(finish)finish.hidden=false;applyPlayerTheme(state?.matchWinner||null);
    if(byId('rpsPlayerNow')){const now=byId('rpsPlayerNow');now.className=`rps-player-now ${winner?.theme||''}`;now.textContent=winner?`الفائز ${winner.name}`:'';}
    if(byId('rpsPrompt'))byId('rpsPrompt').textContent='انتهت المباراة';
    if(byId('rpsFinishTitle'))byId('rpsFinishTitle').textContent=`${winner?.name||''} فاز بالمباراة 🏆`;
    if(byId('rpsFinishArt'))byId('rpsFinishArt').innerHTML=winner?`<img src="${winner.celebrate}" alt="" decoding="async">`:'';
  }

  function choose(choice){
    if(!state||state.status!=='choosing')return;const playerId=currentPlayer(),result=submitRpsChoice(state,{playerId,choice});if(!result.ok)return;state=result.state;
    if(result.reveal){renderReveal();return;}renderHandoff();
  }

  function continueHandoff(){renderChoosing();}
  function advance(){
    if(!state)return;if(state.status==='finished'){renderFinish();return;}
    const result=nextRpsRound(state);if(!result.ok)return;state=result.state;renderChoosing();
  }
  function reset(){
    const result=state?resetRpsMatch(state):{ok:true,state:createRpsState()};if(!result.ok)return;state=result.state;renderChoosing();
  }
  function start(){
    ensureRpsShell();bind();state=createRpsState();setMode(true);showView?.('rpsGameView');renderChoosing();
  }
  function leave(){setMode(false);speech.stop();state=null;applyPlayerTheme(null);onBack?.();}

  function bind(){
    if(bound)return;bound=true;ensureRpsShell();
    byId('rpsBackToGames')?.addEventListener('click',leave);byId('rpsResetMatch')?.addEventListener('click',reset);byId('rpsHandoffContinue')?.addEventListener('click',continueHandoff);byId('rpsNextRound')?.addEventListener('click',advance);byId('rpsPlayAgain')?.addEventListener('click',reset);
    document.querySelectorAll('[data-rps-choice]').forEach(button=>button.addEventListener('click',()=>choose(button.dataset.rpsChoice)));
  }

  return Object.freeze({start,leave,getState(){return state;}});
}
