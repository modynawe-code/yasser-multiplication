import { gameRegistry } from './game-catalog.js';
import { createPlayerContext } from './core/player-context.js';
import { createXoState,passXoTurn,playXoMove } from './xo/xo-engine.js';
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

export function createGamesController({learningAdapter,onBeforeEnter,onExitToHub}={}){
  let bound=false,xoState=null,nextStarter='yasser',challengeState=null,challengeRequest=0,passTimer=null;
  const speech=createSpeechService(),audio=createFeedbackAudio();

  function clearPassTimer(){if(passTimer){clearTimeout(passTimer);passTimer=null;}}
  function clearChallenge(){challengeRequest+=1;challengeState=null;clearPassTimer();speech.stop();}
  function setXoMode(active){document.body.classList.toggle('xo-game-mode',Boolean(active));}

  function leave(){
    document.body.classList.remove('games-mode','xo-game-mode');
    clearChallenge();
    xoState=null;
  }

  function enterHome(){
    onBeforeEnter?.();
    document.body.classList.remove('hub-mode','khaled-mode','family-parent-mode','xo-game-mode');
    document.body.classList.add('games-mode');
    renderCatalog();
    show('gamesHomeView');
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
        <span class="game-card-meta"><span class="game-chip">${categoryLabel(game.category)}</span><span class="game-chip">${learningLabel(game.learningMode)}</span><span class="game-chip">${game.playModes.includes('online')?'أونلاين لاحقًا':'محلية'}</span></span>
      </button>`;
    }).join('');
    host.querySelector('[data-game-id="xo"]')?.addEventListener('click',startLocalXo);
  }

  function startLocalXo(){
    nextStarter=nextStarter==='yasser'?'khaled':'yasser';
    xoState=createXoState({players:['yasser','khaled'],startingPlayer:nextStarter});
    clearChallenge();setXoMode(true);
    show('xoGameView');
    renderXo();
    beginTurnChallenge();
  }

  function resetXo(){
    nextStarter=nextStarter==='yasser'?'khaled':'yasser';
    xoState=createXoState({players:['yasser','khaled'],startingPlayer:nextStarter});
    clearChallenge();setXoMode(true);
    renderXo();
    beginTurnChallenge();
  }

  function tokenMarkup(playerId){
    const player=PLAYERS[playerId];
    if(!player)return'';
    return `<span class="xo-token ${player.theme}" aria-hidden="true"><img src="${PLAYER_ASSETS[player.learnerId]}" alt="" decoding="async"></span>`;
  }

  function isMoveUnlocked(){return Boolean(xoState?.status==='playing'&&challengeState?.playerId===xoState.currentPlayer&&challengeState.unlocked);}

  function statusText(){
    if(!xoState)return'';
    if(xoState.status==='won')return`فاز ${PLAYERS[xoState.winner]?.displayName||''} 🎉`;
    if(xoState.status==='draw')return'تعادل جميل 🤝';
    if(isMoveUnlocked())return'اختر مربعًا';
    return'جاوب السؤال أولًا';
  }

  function renderXo(){
    if(!xoState)return;
    const board=byId('xoBoard');if(!board)return;
    const current=xoState.currentPlayer?PLAYERS[xoState.currentPlayer]:null;
    byId('xoTurnName').textContent=current?.displayName||(xoState.status==='draw'?'تعادل':PLAYERS[xoState.winner]?.displayName||'');
    byId('xoStatusText').textContent=statusText();
    byId('xoPlayerYasser')?.classList.toggle('active',xoState.currentPlayer==='yasser'||xoState.winner==='yasser');
    byId('xoPlayerKhaled')?.classList.toggle('active',xoState.currentPlayer==='khaled'||xoState.winner==='khaled');

    const wins=new Set(xoState.winningLine||[]),unlocked=isMoveUnlocked();
    board.classList.toggle('locked',xoState.status==='playing'&&!unlocked);
    board.innerHTML=xoState.board.map((playerId,index)=>`<button class="xo-cell ${wins.has(index)?'win':''}" role="gridcell" data-xo-cell="${index}" ${playerId||xoState.status!=='playing'||!unlocked?'disabled':''} aria-label="${playerId?`الخانة للاعب ${PLAYERS[playerId].displayName}`:`خانة فارغة ${index+1}`}">${playerId?tokenMarkup(playerId):''}</button>`).join('');
    board.querySelectorAll('[data-xo-cell]').forEach(button=>button.addEventListener('click',()=>playCell(Number(button.dataset.xoCell))));
    if(xoState.status!=='playing')renderFinishedChallenge();
  }

  function renderFinishedChallenge(){
    const box=byId('xoChallenge'),prompt=byId('xoChallengePrompt'),visual=byId('xoChallengeVisual'),options=byId('xoChallengeOptions'),feedback=byId('xoChallengeFeedback'),hear=byId('xoHearChallenge');
    box?.classList.remove('unlocked');box?.classList.add('finished');if(hear)hear.hidden=true;
    if(xoState?.status==='won'){
      const winner=PLAYERS[xoState.winner],asset=CELEBRATION_ASSETS[xoState.winner];
      if(prompt)prompt.textContent=`${winner?.displayName||''} فاز بالجولة 🎉`;
      if(visual)visual.innerHTML=`<div class="xo-finish-art"><img src="${asset}" alt="" decoding="async"></div>`;
      if(feedback)feedback.textContent='ممتاز! جاهزين لجولة ثانية؟';
    }else{
      if(prompt)prompt.textContent='تعادل جميل 🤝';
      if(visual)visual.innerHTML=`<div class="xo-finish-art dual"><img src="${CELEBRATION_ASSETS.yasser}" alt="" decoding="async"><img src="${CELEBRATION_ASSETS.khaled}" alt="" decoding="async"></div>`;
      if(feedback)feedback.textContent='جولة قوية من الاثنين.';
    }
    if(options){options.innerHTML='<button class="btn primary xo-play-again" id="xoPlayAgain">العبوا مرة ثانية</button>';byId('xoPlayAgain')?.addEventListener('click',resetXo);}
  }

  function challengeVisualMarkup(challenge){
    if(challenge?.visual?.kind!=='dots')return'';
    const count=Number(challenge.visual.count||0);
    if(count===0)return'<div class="xo-zero">0 — ما فيه دوائر</div>';
    return `<div class="xo-dot-group" aria-label="${count} دوائر">${Array.from({length:count},()=>'<span class="xo-dot" aria-hidden="true"></span>').join('')}</div>`;
  }

  function renderChallenge(){
    if(!challengeState)return;
    const {challenge,unlocked}=challengeState,box=byId('xoChallenge'),prompt=byId('xoChallengePrompt'),visual=byId('xoChallengeVisual'),options=byId('xoChallengeOptions'),feedback=byId('xoChallengeFeedback'),hear=byId('xoHearChallenge');
    box?.classList.remove('finished');box?.classList.toggle('unlocked',Boolean(unlocked));if(hear)hear.hidden=false;
    if(prompt)prompt.textContent=challenge.prompt;
    if(visual)visual.innerHTML=challengeVisualMarkup(challenge);
    if(options){
      options.innerHTML=challenge.options.map(value=>`<button class="xo-challenge-option" data-challenge-answer="${String(value)}" ${unlocked?'disabled':''}>${value}</button>`).join('');
      options.querySelectorAll('[data-challenge-answer]').forEach(button=>button.addEventListener('click',()=>answerChallenge(button.dataset.challengeAnswer,button)));
    }
    if(feedback)feedback.textContent=unlocked?'أحسنت ⭐ الآن اختر مربعك.':'';
    renderXo();
  }

  async function beginTurnChallenge(){
    if(!xoState||xoState.status!=='playing')return;
    const playerId=xoState.currentPlayer,player=PLAYERS[playerId],requestId=++challengeRequest;
    challengeState=null;
    const prompt=byId('xoChallengePrompt'),visual=byId('xoChallengeVisual'),options=byId('xoChallengeOptions'),feedback=byId('xoChallengeFeedback'),hear=byId('xoHearChallenge');
    byId('xoChallenge')?.classList.remove('unlocked','finished');if(hear)hear.hidden=false;
    if(prompt)prompt.textContent=`نجهز سؤال ${player.displayName}…`;
    if(visual)visual.innerHTML='';if(options)options.innerHTML='';if(feedback)feedback.textContent='';
    renderXo();

    try{
      if(!learningAdapter?.nextChallenge)throw new Error('learning adapter unavailable');
      const challenge=await learningAdapter.nextChallenge(player,{gameId:'xo',playMode:'local'});
      if(requestId!==challengeRequest||xoState?.currentPlayer!==playerId)return;
      challengeState={playerId,challenge,attempts:0,unlocked:false,startedAt:now()};
      renderChallenge();
      speech.speak(challenge.spokenPrompt||challenge.prompt||'');
    }catch{
      if(requestId!==challengeRequest||xoState?.currentPlayer!==playerId)return;
      challengeState={playerId,challenge:{prompt:'تعذر تجهيز السؤال — العب دورك',options:[],correctAnswer:null},attempts:0,unlocked:true,startedAt:now(),fallback:true};
      if(prompt)prompt.textContent='تعذر تجهيز السؤال — العب دورك';if(feedback)feedback.textContent='اللعبة مستمرة بدون تعطيل.';
      renderXo();
    }
  }

  async function answerChallenge(answer,button){
    if(!challengeState||challengeState.unlocked||challengeState.playerId!==xoState?.currentPlayer)return;
    const {challenge}=challengeState,player=PLAYERS[challengeState.playerId];
    const isCorrect=String(answer)===String(challenge.correctAnswer),responseMs=Math.max(0,Math.round(now()-challengeState.startedAt));
    try{await learningAdapter?.recordChallenge?.(player,{gameId:'xo',challenge,answer,isCorrect,responseMs});}catch{}

    if(isCorrect){
      challengeState.unlocked=true;button?.classList.add('good');audio.correct();
      byId('xoChallengeFeedback').textContent='أحسنت ⭐ الآن اختر مربعك.';
      byId('xoChallenge')?.classList.add('unlocked');
      byId('xoChallengeOptions')?.querySelectorAll('button').forEach(item=>item.disabled=true);
      renderXo();
      return;
    }

    challengeState.attempts+=1;button?.classList.add('bad');if(button)button.disabled=true;audio.wrong();
    if(challengeState.attempts<2){byId('xoChallengeFeedback').textContent='جرّب مرة ثانية — تقدر عليها.';return;}

    byId('xoChallengeFeedback').textContent='ننتقل للدور الثاني، ونرجع أقوى.';
    const playerId=challengeState.playerId;
    byId('xoChallengeOptions')?.querySelectorAll('button').forEach(item=>item.disabled=true);
    passTimer=setTimeout(()=>{
      passTimer=null;
      if(!xoState||xoState.currentPlayer!==playerId||xoState.status!=='playing')return;
      const result=passXoTurn(xoState,{playerId});if(!result.ok)return;
      xoState=result.state;clearChallenge();renderXo();beginTurnChallenge();
    },700);
  }

  function playCell(cell){
    if(!xoState||xoState.status!=='playing'||!isMoveUnlocked())return;
    const playerId=xoState.currentPlayer,result=playXoMove(xoState,{playerId,cell});
    if(!result.ok)return;
    xoState=result.state;clearChallenge();renderXo();
    if(xoState.status==='playing')beginTurnChallenge();
    else{
      audio.achievement();
      const message=xoState.status==='won'?`${PLAYERS[xoState.winner]?.displayName||''} فاز بالجولة. أحسنتم.`:'تعادل جميل. أحسنتم.';
      speech.speak(message);
    }
  }

  function bind(){
    if(bound)return;bound=true;
    ensureGamesShell();
    byId('gamesOpenBtn')?.addEventListener('click',enterHome);
    byId('gamesBackToHub')?.addEventListener('click',()=>{leave();onExitToHub?.();});
    byId('xoBackToGames')?.addEventListener('click',()=>{clearChallenge();xoState=null;setXoMode(false);renderCatalog();show('gamesHomeView');});
    byId('xoReset')?.addEventListener('click',resetXo);
    byId('xoHearChallenge')?.addEventListener('click',()=>{const challenge=challengeState?.challenge;if(challenge)speech.speak(challenge.spokenPrompt||challenge.prompt||'');});
  }

  return Object.freeze({start(){bind();},enter:enterHome,leave,getXoState(){return xoState;},getChallengeState(){return challengeState;}});
}
