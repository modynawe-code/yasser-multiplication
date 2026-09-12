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

function createDominoDeck(){
  const deck=[];
  for(let a=0;a<=6;a++)for(let b=a;b<=6;b++)deck.push(`${a}-${b}`);
  return deck;
}
function secureIndex(max){
  if(max<=1)return 0;
  const values=new Uint32Array(1);crypto.getRandomValues(values);return values[0]%max;
}
function shuffledDominoDeck(){
  const deck=createDominoDeck();
  for(let index=deck.length-1;index>0;index--){const swap=secureIndex(index+1);[deck[index],deck[swap]]=[deck[swap],deck[index]];}
  return deck;
}
function dominoValues(tileId){
  const match=/^([0-6])-([0-6])$/.exec(String(tileId||''));if(!match)return null;
  const a=Number(match[1]),b=Number(match[2]);return a<=b?[a,b]:null;
}
function dominoPipSum(hand){return(hand||[]).reduce((sum,tile)=>{const values=dominoValues(tile);return sum+(values?values[0]+values[1]:0);},0);}
function dominoPlayable(tileId,leftEnd,rightEnd,boardLength=0){
  const values=dominoValues(tileId);if(!values)return false;if(!boardLength)return true;
  return values.includes(leftEnd)||values.includes(rightEnd);
}
function playerHasDominoMove(state,playerId){
  const hand=state.hands?.[playerId]||[];return hand.some(tile=>dominoPlayable(tile,state.leftEnd,state.rightEnd,state.board?.length||0));
}
function dominoStarter(players,hands){
  let best=null;
  for(let seat=0;seat<players.length;seat++){
    const playerId=players[seat];
    for(const tile of hands[playerId]||[]){
      const [a,b]=dominoValues(tile)||[-1,-1],isDouble=a===b,rank=(isDouble?100:0)+a+b;
      if(!best||rank>best.rank||(rank===best.rank&&seat<best.seat))best={playerId,rank,seat};
    }
  }
  return best?.playerId||players[0]||null;
}
function dealDominoRound(players,round=1){
  const deck=shuffledDominoDeck(),hands=Object.fromEntries(players.map(id=>[id,[]]));
  for(let count=0;count<7;count++)for(const playerId of players)hands[playerId].push(deck.pop());
  return{
    status:'playing',hands,boneyard:deck,board:[],leftEnd:null,rightEnd:null,
    currentPlayerId:dominoStarter(players,hands),winner:null,blocked:false,passCount:0,
    rematchReady:[],round:Number(round||1)
  };
}
function orientDomino(tileId,side,leftEnd,rightEnd,boardLength){
  const values=dominoValues(tileId);if(!values)return null;const[a,b]=values;
  if(!boardLength)return{left:a,right:b};
  if(side==='left'){
    if(b===leftEnd)return{left:a,right:b};
    if(a===leftEnd)return{left:b,right:a};
    return null;
  }
  if(side==='right'){
    if(a===rightEnd)return{left:a,right:b};
    if(b===rightEnd)return{left:b,right:a};
    return null;
  }
  return null;
}
function finishBlockedDomino(next){
  const totals=next.players.map(playerId=>({playerId,total:dominoPipSum(next.hands[playerId])})).sort((a,b)=>a.total-b.total);
  next.currentPlayerId=null;next.blocked=true;next.rematchReady=[];
  if(totals.length>=2&&totals[0].total===totals[1].total){next.status='draw';next.winner=null;}
  else{next.status='finished';next.winner=totals[0]?.playerId||null;}
}

export function createInitialDominoRoomState(hostPlayerId){
  return Object.freeze({
    gameId:'domino',status:'waiting',players:Object.freeze([hostPlayerId]),hands:Object.freeze({[hostPlayerId]:Object.freeze([])}),
    boneyard:Object.freeze([]),board:Object.freeze([]),leftEnd:null,rightEnd:null,currentPlayerId:null,winner:null,
    blocked:false,passCount:0,rematchReady:Object.freeze([]),round:1
  });
}

export function addDominoRoomGuest(state,guestPlayerId){
  if(state?.gameId!=='domino'||state.status!=='waiting'||state.players.length!==1)return{ok:false,reason:'room-not-waiting'};
  const next=clone(state);next.players.push(guestPlayerId);Object.assign(next,dealDominoRound(next.players,1));
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
    Object.assign(next,dealDominoRound(next.players,Number(next.round||1)+1));
    return{ok:true,state:next};
  }
  if(state.status!=='playing')return{ok:false,reason:'game-not-playing'};
  if(state.currentPlayerId!==playerId)return{ok:false,reason:'not-your-turn'};
  if(type==='draw'){
    if(playerHasDominoMove(state,playerId))return{ok:false,reason:'playable-tile-available'};
    if(!state.boneyard?.length)return{ok:false,reason:'boneyard-empty'};
    const next=clone(state),tile=next.boneyard.pop();next.hands[playerId].push(tile);next.passCount=0;
    return{ok:true,state:next};
  }
  if(type==='pass'){
    if(playerHasDominoMove(state,playerId))return{ok:false,reason:'playable-tile-available'};
    if(state.boneyard?.length)return{ok:false,reason:'draw-before-pass'};
    const next=clone(state);next.passCount=Number(next.passCount||0)+1;
    if(next.passCount>=next.players.length){finishBlockedDomino(next);return{ok:true,state:next};}
    next.currentPlayerId=otherPlayer(next,playerId);return{ok:true,state:next};
  }
  if(type!=='play')return{ok:false,reason:'unsupported-action'};
  const tileId=String(payload?.tileId||''),side=String(payload?.side||'right');
  const hand=state.hands?.[playerId]||[],handIndex=hand.indexOf(tileId);
  if(handIndex<0)return{ok:false,reason:'tile-not-in-hand'};
  const oriented=orientDomino(tileId,side,state.leftEnd,state.rightEnd,state.board?.length||0);
  if(!oriented)return{ok:false,reason:'tile-does-not-match'};
  const next=clone(state),entry={tileId,left:oriented.left,right:oriented.right,playedBy:playerId};
  next.hands[playerId].splice(handIndex,1);
  if(!next.board.length){next.board=[entry];next.leftEnd=entry.left;next.rightEnd=entry.right;}
  else if(side==='left'){next.board.unshift(entry);next.leftEnd=entry.left;}
  else{next.board.push(entry);next.rightEnd=entry.right;}
  next.passCount=0;
  if(next.hands[playerId].length===0){next.status='finished';next.winner=playerId;next.currentPlayerId=null;next.rematchReady=[];return{ok:true,state:next};}
  next.currentPlayerId=otherPlayer(next,playerId);
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
