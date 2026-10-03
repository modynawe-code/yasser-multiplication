// Port of Wafy's 5x5 Letters Challenge board and path test.
export const LETTERS_GAME=Object.freeze({ROWS:5,COLS:5});
export const LETTERS=Object.freeze(Array.from('ابتثجحخدذرزسشصضطظعغفقكلمنهوي'));
const OFFSETS_EVEN=[[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]];
const OFFSETS_ODD=[[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]];
export function shuffleLetters(values,random=Math.random){const output=[...values];for(let i=output.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[output[i],output[j]]=[output[j],output[i]];}return output;}
export function lettersNeighbors(row,col,rows=5,cols=5){return(row%2?OFFSETS_ODD:OFFSETS_EVEN).map(([dr,dc])=>[row+dr,col+dc]).filter(([r,c])=>r>=0&&r<rows&&c>=0&&c<cols);}
export function newLettersBoard(random=Math.random,letters=LETTERS){const picked=shuffleLetters(letters,random).slice(0,25);return Array.from({length:5},(_,row)=>Array.from({length:5},(_,col)=>({row,col,letter:picked[row*5+col],owner:null})));}
export function claimLetterCell(board,row,col,team){return board.map(line=>line.map(cell=>cell.row===row&&cell.col===col?{...cell,owner:team}:cell));}
export function isLettersBoardFull(board){return board.every(row=>row.every(cell=>cell.owner!==null));}
export function lettersWinningPath(board,team){
  if(!board?.length||!board[0]?.length)return false;
  const rows=board.length,cols=board[0].length,starts=[];
  for(let i=0;i<(team==='orange'?cols:rows);i++){const row=team==='orange'?0:i,col=team==='orange'?i:0;if(board[row][col]?.owner===team)starts.push([row,col]);}
  const seen=new Set(),queue=[...starts];
  while(queue.length){const[row,col]=queue.shift(),key=`${row},${col}`;if(seen.has(key))continue;seen.add(key);if(team==='orange'?row===rows-1:col===cols-1)return true;for(const[nextRow,nextCol]of lettersNeighbors(row,col,rows,cols))if(board[nextRow][nextCol]?.owner===team)queue.push([nextRow,nextCol]);}
  return false;
}
export function newLettersGame(roster=[],random=Math.random){const teams={orange:[],green:[]};roster.forEach((name,index)=>teams[index%2?'green':'orange'].push(name));return{board:newLettersBoard(random),teams,turn:'orange',cursor:{orange:0,green:0},started:false,selected:null,winner:null,finished:false};}
export function startLettersGame(game,random=Math.random){return!game||game.started?game:{...game,started:true,turn:random()<.5?'orange':'green',cursor:{orange:0,green:0},selected:null};}
export function pickLetterCell(game,row,col){if(!game?.started||game.finished||game.winner||!game.teams[game.turn].length||game.board[row]?.[col]?.owner!==null)return game;return{...game,selected:{row,col}};}
export function verdictLetterCell(game,verdict){if(!game?.selected||game.finished||game.winner)return game;const team=game.turn,roster=game.teams[team],nextCursor=(game.cursor[team]+1)%Math.max(1,roster.length),correct=verdict==='correct';let board=game.board,winner=null;if(correct){board=claimLetterCell(board,game.selected.row,game.selected.col,team);if(lettersWinningPath(board,team))winner=team;}return{...game,board,turn:correct?team:team==='orange'?'green':'orange',cursor:{...game.cursor,[team]:nextCursor},selected:null,winner,finished:Boolean(winner)||isLettersBoardFull(board)};}
