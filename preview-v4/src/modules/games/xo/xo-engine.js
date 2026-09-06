const WINNING_LINES=Object.freeze([
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
].map(line=>Object.freeze(line)));

function normalizePlayers(players){
  if(!Array.isArray(players)||players.length!==2)throw new TypeError('XO requires exactly two players');
  const ids=players.map(value=>String(value||'').trim());
  if(ids.some(id=>!id)||ids[0]===ids[1])throw new TypeError('XO players must be two distinct ids');
  return ids;
}

function winningLine(board){
  for(const line of WINNING_LINES){
    const [a,b,c]=line;
    if(board[a]&&board[a]===board[b]&&board[a]===board[c])return line;
  }
  return null;
}

export function createXoState({players,startingPlayer}={}){
  const [first,second]=normalizePlayers(players);
  const current=startingPlayer?String(startingPlayer):first;
  if(current!==first&&current!==second)throw new TypeError('startingPlayer must belong to the game');
  return Object.freeze({
    version:1,
    players:Object.freeze([first,second]),
    board:Object.freeze(Array(9).fill(null)),
    currentPlayer:current,
    status:'playing',
    winner:null,
    winningLine:null,
    moveCount:0
  });
}

export function playXoMove(state,{playerId,cell}={}){
  if(!state||state.status!=='playing')return{ok:false,reason:'game-finished',state};
  const player=String(playerId||'');
  const index=Number(cell);
  if(player!==state.currentPlayer)return{ok:false,reason:'not-your-turn',state};
  if(!Number.isInteger(index)||index<0||index>8)return{ok:false,reason:'invalid-cell',state};
  if(state.board[index]!==null)return{ok:false,reason:'occupied-cell',state};

  const board=[...state.board];
  board[index]=player;
  const line=winningLine(board);
  const moveCount=state.moveCount+1;
  const isDraw=!line&&moveCount===9;
  const nextPlayer=state.players[0]===player?state.players[1]:state.players[0];

  const nextState=Object.freeze({
    ...state,
    board:Object.freeze(board),
    currentPlayer:line||isDraw?null:nextPlayer,
    status:line?'won':isDraw?'draw':'playing',
    winner:line?player:null,
    winningLine:line?Object.freeze([...line]):null,
    moveCount
  });
  return{ok:true,reason:null,state:nextState};
}

export function getXoWinningLines(){return WINNING_LINES;}
