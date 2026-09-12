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
  })
});

export function getGameRoomRules(value){const id=normalizeGameId(value);return id?RULES[id]||null:null;}
export function listGameRoomRuleIds(){return Object.freeze(Object.keys(RULES));}
