const WIN_LINES=Object.freeze([[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]);
const GAME_ID_PATTERN=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function clone(value){return JSON.parse(JSON.stringify(value));}
function winningLine(board,playerId){return WIN_LINES.find(line=>line.every(index=>board[index]===playerId))||null;}
function otherPlayer(state,playerId){return state.players.find(id=>id!==playerId)||null;}
function normalizeGameId(value){const id=String(value||'').trim().toLowerCase();return GAME_ID_PATTERN.test(id)?id:null;}

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

const RULES=Object.freeze({
  xo:Object.freeze({
    gameId:'xo',
    maxPlayers:2,
    createInitialState:createInitialXoRoomState,
    addPlayer:addXoRoomGuest,
    applyAction(state,{playerId,type,payload={}}={}){return applyXoRoomAction(state,{playerId,type,payload});}
  })
});

export function getGameRoomRules(value){const id=normalizeGameId(value);return id?RULES[id]||null:null;}
export function listGameRoomRuleIds(){return Object.freeze(Object.keys(RULES));}
