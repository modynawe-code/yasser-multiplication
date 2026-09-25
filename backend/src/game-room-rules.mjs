import { addFamilyWordCategoriesRoomPlayer, applyFamilyWordCategoriesRoomAction, createInitialFamilyWordCategoriesRoomState, projectFamilyWordCategoriesRoomState } from './family-word-categories-engine.mjs';
import {
  CLASSIC_MOVE_STATE,
  classicAbleToPlay,
  classicBlockedWinner,
  classicMovePermission,
  classicPlayerHasMove,
  distributeClassicDominoTiles,
  orientClassicMove,
  parseClassicTile,
  pickClassicFirstMove
} from './domino-classic-engine.mjs';

const WIN_LINES=Object.freeze([[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]);
const GAME_ID_PATTERN=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RPS_CHOICES=Object.freeze(['rock','paper','scissors']);
const RPS_BEATS=Object.freeze({rock:'scissors',paper:'rock',scissors:'paper'});

function clone(value){return JSON.parse(JSON.stringify(value));}
function winningLine(board,playerId){return WIN_LINES.find(line=>line.every(index=>board[index]===playerId))||null;}
function otherPlayer(state,playerId){return state.players.find(id=>id!==playerId)||null;}
function normalizeGameId(value){const id=String(value||'').trim().toLowerCase();return GAME_ID_PATTERN.test(id)?id:null;}
function resolveRpsRound(choiceA,choiceB){if(choiceA===choiceB)return'draw';return RPS_BEATS[choiceA]===choiceB?'a':'b';}

export function createInitialXoRoomState(hostPlayerId){
  return Object.freeze({gameId:'xo',status:'waiting',players:Object.freeze([hostPlayerId]),board:Object.freeze(Array(9).fill(null)),currentPlayerId:null,winner:null,winningLine:Object.freeze([]),rematchReady:Object.freeze([]),moveCount:0,round:1});
}

export function addXoRoomGuest(state,guestPlayerId){
  if(state?.gameId!=='xo'||state.status!=='waiting'||state.players.length!==1)return{ok:false,reason:'room-not-waiting'};
  const next=clone(state);next.players.push(guestPlayerId);next.status='playing';next.currentPlayerId=next.players[0];next.rematchReady=[];
  return{ok:true,state:next};
}

export function applyXoRoomAction(state,{playerId,type,cell,payload}={}){
  if(state?.gameId!=='xo')return{ok:false,reason:'invalid-game-state'};
  const resolvedCell=cell!==undefined?cell:payload?.cell;
  if(type==='reset'){
    if(!['won','draw'].includes(state.status))return{ok:false,reason:'game-not-finished'};
    if(!state.players.includes(playerId))return{ok:false,reason:'player-not-in-room'};
    const next=clone(state),ready=new Set(next.rematchReady||[]);
    if(ready.has(playerId))return{ok:false,reason:'rematch-already-ready'};
    ready.add(playerId);next.rematchReady=[...ready];
    if(ready.size<next.players.length)return{ok:true,state:next};
    const nextRound=Number(next.round||1)+1;
    next.status='playing';next.board=Array(9).fill(null);next.moveCount=0;next.winner=null;next.winningLine=[];next.rematchReady=[];next.round=nextRound;next.currentPlayerId=next.players[(nextRound-1)%next.players.length];
    return{ok:true,state:next};
  }
  if(state.status!=='playing')return{ok:false,reason:'game-not-playing'};
  if(state.currentPlayerId!==playerId)return{ok:false,reason:'not-your-turn'};
  if(type==='pass'){
    const next=clone(state),other=otherPlayer(next,playerId);if(!other)return{ok:false,reason:'missing-opponent'};
    next.currentPlayerId=other;return{ok:true,state:next};
  }
  if(type!=='move')return{ok:false,reason:'unsupported-action'};
  const index=Number(resolvedCell);if(!Number.isInteger(index)||index<0||index>8)return{ok:false,reason:'invalid-cell'};
  if(state.board[index])return{ok:false,reason:'occupied-cell'};
  const next=clone(state);next.board[index]=playerId;next.moveCount+=1;
  const line=winningLine(next.board,playerId);
  if(line){next.status='won';next.winner=playerId;next.winningLine=line;next.rematchReady=[];next.currentPlayerId=null;return{ok:true,state:next};}
  if(next.moveCount>=9){next.status='draw';next.rematchReady=[];next.currentPlayerId=null;return{ok:true,state:next};}
  next.currentPlayerId=otherPlayer(next,playerId);return{ok:true,state:next};
}

export function createInitialRpsRoomState(hostPlayerId){
  return Object.freeze({gameId:'rock-paper-scissors',status:'waiting',phase:'waiting',players:Object.freeze([hostPlayerId]),targetScore:3,round:1,choices:Object.freeze({}),scores:Object.freeze({[hostPlayerId]:0}),roundWinner:null,matchWinner:null,rematchReady:Object.freeze([])});
}

export function addRpsRoomGuest(state,guestPlayerId){
  if(state?.gameId!=='rock-paper-scissors'||state.status!=='waiting'||state.players.length!==1)return{ok:false,reason:'room-not-waiting'};
  const next=clone(state);next.players.push(guestPlayerId);next.scores[guestPlayerId]=0;next.status='playing';next.phase='choosing';next.choices={};next.rematchReady=[];
  return{ok:true,state:next};
}

export function applyRpsRoomAction(state,{playerId,type,payload={}}={}){
  if(state?.gameId!=='rock-paper-scissors')return{ok:false,reason:'invalid-game-state'};
  if(!state.players?.includes(playerId))return{ok:false,reason:'player-not-in-room'};
  if(type==='reset'){
    if(state.status!=='finished')return{ok:false,reason:'game-not-finished'};
    const next=clone(state),ready=new Set(next.rematchReady||[]);
    if(ready.has(playerId))return{ok:false,reason:'rematch-already-ready'};
    ready.add(playerId);next.rematchReady=[...ready];
    if(ready.size<next.players.length)return{ok:true,state:next};
    next.status='playing';next.phase='choosing';next.round=1;next.choices={};next.scores=Object.fromEntries(next.players.map(id=>[id,0]));next.roundWinner=null;next.matchWinner=null;next.rematchReady=[];
    return{ok:true,state:next};
  }
  if(state.status!=='playing')return{ok:false,reason:'game-not-playing'};
  if(type==='next'){
    if(state.phase!=='revealed')return{ok:false,reason:'round-not-revealed'};
    const next=clone(state);next.round=Number(next.round||1)+1;next.phase='choosing';next.choices={};next.roundWinner=null;
    return{ok:true,state:next};
  }
  if(type!=='choose')return{ok:false,reason:'unsupported-action'};
  if(state.phase!=='choosing')return{ok:false,reason:'round-not-choosing'};
  const choice=String(payload?.choice||'');if(!RPS_CHOICES.includes(choice))return{ok:false,reason:'invalid-choice'};
  if(state.choices?.[playerId])return{ok:false,reason:'choice-already-made'};
  const next=clone(state);next.choices[playerId]=choice;
  if(!next.players.every(id=>Boolean(next.choices[id])))return{ok:true,state:next};
  const [a,b]=next.players,result=resolveRpsRound(next.choices[a],next.choices[b]);
  next.phase='revealed';next.roundWinner=result==='draw'?null:result==='a'?a:b;
  if(next.roundWinner)next.scores[next.roundWinner]=Number(next.scores[next.roundWinner]||0)+1;
  if(next.roundWinner&&next.scores[next.roundWinner]>=Number(next.targetScore||3)){
    next.status='finished';next.phase='finished';next.matchWinner=next.roundWinner;next.rematchReady=[];
  }
  return{ok:true,state:next};
}

export function projectRpsRoomState(state,{viewerPlayerId=null}={}){
  const next=clone(state||{}),chosenPlayers=Object.keys(next.choices||{});next.chosenPlayers=chosenPlayers;
  if(next.phase==='choosing'){
    const ownChoice=viewerPlayerId&&next.choices?.[viewerPlayerId]?next.choices[viewerPlayerId]:null;
    next.choices=ownChoice?{[viewerPlayerId]:ownChoice}:{};
  }
  return Object.freeze(next);
}

function nextDominoPlayer(players,currentPlayer){
  if(!players?.length)return null;
  const index=players.indexOf(currentPlayer);
  return players[(index<0?0:index+1)%players.length]||null;
}

function finishClassicBlockedRound(next){
  const result=classicBlockedWinner(next.players,next.hands);
  next.currentPlayerId=null;next.blocked=true;next.rematchReady=[];
  next.roundTotals=Object.fromEntries(result.totals.map(item=>[item.playerId,item.total]));
  if(result.draw){next.status='draw';next.winner=null;}
  else{next.status='finished';next.winner=result.winner;}
  return next;
}

function settleClassicDominoTurn(next){
  if(next.status!=='playing'||next.boneyard.length>0)return next;
  let guard=0;
  while(next.status==='playing'&&guard++<Math.max(2,next.players.length+1)){
    const moveState=classicAbleToPlay(next.currentPlayerId,next.players,next.hands,next.boneyard.length,next.board);
    if(moveState===CLASSIC_MOVE_STATE.AVAILABLE)return next;
    if(moveState===CLASSIC_MOVE_STATE.DEAD_END)return finishClassicBlockedRound(next);
    next.currentPlayerId=nextDominoPlayer(next.players,next.currentPlayerId);
  }
  return next;
}

function setupClassicDominoRound(players,round=1){
  const{hands,stock}=distributeClassicDominoTiles(players);
  const opening=pickClassicFirstMove(players,hands);
  const board=[];
  let currentPlayerId=players[0]||null;
  if(opening){
    const hand=hands[opening.playerId]||[],index=hand.indexOf(opening.tileId);
    if(index>=0)hand.splice(index,1);
    board.push({tileId:opening.tileId,left:opening.left,right:opening.right,playedBy:opening.playerId,opening:true});
    currentPlayerId=nextDominoPlayer(players,opening.playerId);
  }
  return settleClassicDominoTurn({
    status:'playing',hands,boneyard:stock,board,
    leftEnd:board[0]?.left??null,rightEnd:board.at(-1)?.right??null,
    currentPlayerId,winner:null,blocked:false,roundTotals:{},passCount:0,
    openingPlayerId:opening?.playerId||null,openingTileId:opening?.tileId||null,
    rematchReady:[],round:Number(round||1)
  });
}

function refreshDominoEnds(next){
  next.leftEnd=next.board[0]?.left??null;
  next.rightEnd=next.board.at(-1)?.right??null;
}

export function createInitialDominoRoomState(hostPlayerId){
  return Object.freeze({
    gameId:'domino',status:'waiting',players:Object.freeze([hostPlayerId]),hands:Object.freeze({[hostPlayerId]:Object.freeze([])}),
    boneyard:Object.freeze([]),board:Object.freeze([]),leftEnd:null,rightEnd:null,currentPlayerId:null,winner:null,
    blocked:false,roundTotals:Object.freeze({}),passCount:0,openingPlayerId:null,openingTileId:null,
    rematchReady:Object.freeze([]),round:1
  });
}

export function addDominoRoomGuest(state,guestPlayerId){
  if(state?.gameId!=='domino'||state.status!=='waiting'||state.players.length!==1)return{ok:false,reason:'room-not-waiting'};
  const next=clone(state);next.players.push(guestPlayerId);Object.assign(next,setupClassicDominoRound(next.players,1));
  return{ok:true,state:next};
}

export function applyDominoRoomAction(state,{playerId,type,payload={}}={}){
  if(state?.gameId!=='domino')return{ok:false,reason:'invalid-game-state'};
  if(!state.players?.includes(playerId))return{ok:false,reason:'player-not-in-room'};
  if(type==='reset'){
    if(!['finished','draw'].includes(state.status))return{ok:false,reason:'game-not-finished'};
    const next=clone(state),ready=new Set(next.rematchReady||[]);
    if(ready.has(playerId))return{ok:false,reason:'rematch-already-ready'};
    ready.add(playerId);next.rematchReady=[...ready];
    if(ready.size<next.players.length)return{ok:true,state:next};
    Object.assign(next,setupClassicDominoRound(next.players,Number(next.round||1)+1));
    return{ok:true,state:next};
  }
  if(state.status!=='playing')return{ok:false,reason:'game-not-playing'};
  if(state.currentPlayerId!==playerId)return{ok:false,reason:'not-your-turn'};

  if(type==='draw'){
    if(classicPlayerHasMove(state.hands?.[playerId]||[],state.board))return{ok:false,reason:'playable-tile-available'};
    if(!state.boneyard?.length)return{ok:false,reason:'boneyard-empty'};
    const next=clone(state),tile=next.boneyard.pop();next.hands[playerId].push(tile);next.passCount=0;
    settleClassicDominoTurn(next);refreshDominoEnds(next);
    return{ok:true,state:next};
  }

  if(type==='pass'){
    if(classicPlayerHasMove(state.hands?.[playerId]||[],state.board))return{ok:false,reason:'playable-tile-available'};
    if(state.boneyard?.length)return{ok:false,reason:'draw-before-pass'};
    const next=clone(state);settleClassicDominoTurn(next);refreshDominoEnds(next);
    return{ok:true,state:next};
  }

  if(type!=='play')return{ok:false,reason:'unsupported-action'};
  const tileId=String(payload?.tileId||''),side=String(payload?.side||'right');
  const hand=state.hands?.[playerId]||[],handIndex=hand.indexOf(tileId);
  if(handIndex<0)return{ok:false,reason:'tile-not-in-hand'};
  const tile=parseClassicTile(tileId);if(!tile)return{ok:false,reason:'invalid-tile'};
  const comparable=side==='left'?state.board?.[0]:state.board?.at?.(-1);
  if(!comparable||!classicMovePermission(tileId,comparable,side))return{ok:false,reason:'tile-does-not-match'};
  const oriented=orientClassicMove(tileId,comparable,side);if(!oriented)return{ok:false,reason:'tile-does-not-match'};

  const next=clone(state),entry={tileId,left:oriented.left,right:oriented.right,playedBy:playerId};
  next.hands[playerId].splice(handIndex,1);
  if(side==='left')next.board.unshift(entry);else next.board.push(entry);
  refreshDominoEnds(next);next.passCount=0;
  if(next.hands[playerId].length===0){next.status='finished';next.winner=playerId;next.currentPlayerId=null;next.rematchReady=[];next.roundTotals=Object.fromEntries(next.players.map(id=>[id,(next.hands[id]||[]).reduce((sum,idValue)=>{const value=parseClassicTile(idValue);return sum+(value?value.left+value.right:0);},0)]));return{ok:true,state:next};}
  next.currentPlayerId=nextDominoPlayer(next.players,playerId);
  settleClassicDominoTurn(next);refreshDominoEnds(next);
  return{ok:true,state:next};
}

export function projectDominoRoomState(state,{viewerPlayerId=null}={}){
  const next=clone(state||{}),hands=next.hands||{},boneyard=next.boneyard||[];
  next.hand=viewerPlayerId&&Array.isArray(hands[viewerPlayerId])?[...hands[viewerPlayerId]]:[];
  next.handCounts=Object.fromEntries((next.players||[]).map(playerId=>[playerId,Array.isArray(hands[playerId])?hands[playerId].length:0]));
  next.boneyardCount=boneyard.length;
  delete next.hands;delete next.boneyard;
  return Object.freeze(next);
}

const RULES=Object.freeze({
  xo:Object.freeze({
    gameId:'xo',
    maxPlayers:2,
    maxSpectators:8,
    createInitialState:createInitialXoRoomState,
    addPlayer:addXoRoomGuest,
    applyAction(state,{playerId,type,payload={}}={}){return applyXoRoomAction(state,{playerId,type,payload});}
  }),
  'rock-paper-scissors':Object.freeze({
    gameId:'rock-paper-scissors',
    maxPlayers:2,
    maxSpectators:8,
    createInitialState:createInitialRpsRoomState,
    addPlayer:addRpsRoomGuest,
    applyAction(state,{playerId,type,payload={}}={}){return applyRpsRoomAction(state,{playerId,type,payload});},
    projectState(state,context={}){return projectRpsRoomState(state,context);}
  }),
  'family-word-categories':Object.freeze({
    gameId:'family-word-categories',
    maxPlayers:5,
    maxSpectators:8,
    createInitialState:createInitialFamilyWordCategoriesRoomState,
    addPlayer:addFamilyWordCategoriesRoomPlayer,
    applyAction(state,{playerId,type,payload={}}={}){return applyFamilyWordCategoriesRoomAction(state,{playerId,type,payload});},
    projectState(state,context={}){return projectFamilyWordCategoriesRoomState(state,context);}
  }),
  domino:Object.freeze({
    gameId:'domino',
    maxPlayers:2,
    maxSpectators:8,
    createInitialState:createInitialDominoRoomState,
    addPlayer:addDominoRoomGuest,
    applyAction(state,{playerId,type,payload={}}={}){return applyDominoRoomAction(state,{playerId,type,payload});},
    projectState(state,context={}){return projectDominoRoomState(state,context);}
  })
});

export function getGameRoomRules(value){const id=normalizeGameId(value);return id?RULES[id]||null:null;}
export function listGameRoomRuleIds(){return Object.freeze(Object.keys(RULES));}
