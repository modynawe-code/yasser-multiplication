import { gameRegistry } from './game-catalog.js';
import { createPlayerContext } from './core/player-context.js';
import { createXoState,playXoMove } from './xo/xo-engine.js';
import { ensureGamesShell } from './ui/games-shell.js';

const PLAYER_ASSETS=Object.freeze({
  yasser:'assets/visual/original/yasser/welcome.png',
  khaled:'assets/visual/original/khaled/khaled-point-thumbsup.png'
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

export function createGamesController({onBeforeEnter,onExitToHub}={}){
  let bound=false,xoState=null,nextStarter='yasser';

  function leave(){
    document.body.classList.remove('games-mode');
    xoState=null;
  }

  function enterHome(){
    onBeforeEnter?.();
    document.body.classList.remove('hub-mode','khaled-mode','family-parent-mode');
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
    show('xoGameView');
    renderXo();
  }

  function resetXo(){
    nextStarter=nextStarter==='yasser'?'khaled':'yasser';
    xoState=createXoState({players:['yasser','khaled'],startingPlayer:nextStarter});
    renderXo();
  }

  function tokenMarkup(playerId){
    const player=PLAYERS[playerId];
    if(!player)return'';
    return `<span class="xo-token ${player.theme}" aria-hidden="true"><img src="${PLAYER_ASSETS[player.learnerId]}" alt="" decoding="async"></span>`;
  }

  function statusText(){
    if(!xoState)return'';
    if(xoState.status==='won')return`فاز ${PLAYERS[xoState.winner]?.displayName||''} 🎉`;
    if(xoState.status==='draw')return'تعادل جميل 🤝';
    return'اختر مربعًا';
  }

  function renderXo(){
    if(!xoState)return;
    const board=byId('xoBoard');if(!board)return;
    const current=xoState.currentPlayer?PLAYERS[xoState.currentPlayer]:null;
    byId('xoTurnName').textContent=current?.displayName||(xoState.status==='draw'?'تعادل':PLAYERS[xoState.winner]?.displayName||'');
    byId('xoStatusText').textContent=statusText();
    byId('xoPlayerYasser')?.classList.toggle('active',xoState.currentPlayer==='yasser'||xoState.winner==='yasser');
    byId('xoPlayerKhaled')?.classList.toggle('active',xoState.currentPlayer==='khaled'||xoState.winner==='khaled');

    const wins=new Set(xoState.winningLine||[]);
    board.innerHTML=xoState.board.map((playerId,index)=>`<button class="xo-cell ${wins.has(index)?'win':''}" role="gridcell" data-xo-cell="${index}" ${playerId||xoState.status!=='playing'?'disabled':''} aria-label="${playerId?`الخانة للاعب ${PLAYERS[playerId].displayName}`:`خانة فارغة ${index+1}`}">${playerId?tokenMarkup(playerId):''}</button>`).join('');
    board.querySelectorAll('[data-xo-cell]').forEach(button=>button.addEventListener('click',()=>playCell(Number(button.dataset.xoCell))));
  }

  function playCell(cell){
    if(!xoState||xoState.status!=='playing')return;
    const result=playXoMove(xoState,{playerId:xoState.currentPlayer,cell});
    if(!result.ok)return;
    xoState=result.state;
    renderXo();
  }

  function bind(){
    if(bound)return;bound=true;
    ensureGamesShell();
    byId('gamesOpenBtn')?.addEventListener('click',enterHome);
    byId('gamesBackToHub')?.addEventListener('click',()=>{leave();onExitToHub?.();});
    byId('xoBackToGames')?.addEventListener('click',()=>{xoState=null;renderCatalog();show('gamesHomeView');});
    byId('xoReset')?.addEventListener('click',resetXo);
  }

  return Object.freeze({start(){bind();},enter:enterHome,leave,getXoState(){return xoState;}});
}
