// Wafy BoxesGame engine port: 3x3 board, eight safe opening edges, majority
// of five, and a two-square capture streak cap.
export const BOXES_GAME=Object.freeze({SIZE:3,BOXES:9,EDGES:24,MAJORITY:5,STREAK_CAP:2,SEED:8});
const {SIZE,EDGES,MAJORITY,STREAK_CAP,SEED}=BOXES_GAME;

export function listDotsBoxesEdges(size=SIZE){
  const edges=[];
  for(let row=0;row<=size;row++)for(let col=0;col<size;col++)edges.push(`h-${row}-${col}`);
  for(let row=0;row<size;row++)for(let col=0;col<=size;col++)edges.push(`v-${row}-${col}`);
  return edges;
}
function boxEdges(row,col){return[`h-${row}-${col}`,`h-${row+1}-${col}`,`v-${row}-${col}`,`v-${row}-${col+1}`];}
function edgeBoxes(edge){const[o,r,c]=edge.split('-');const row=Number(r),col=Number(c);return o==='h'?[[row-1,col],[row,col]]:[[row,col-1],[row,col]];}
function sidesDrawn(edges,row,col){return boxEdges(row,col).filter(edge=>edges[edge]!==undefined).length;}
function seedEdges(random){
  const edges={};
  for(let count=0;count<SEED;count++){
    const eligible=listDotsBoxesEdges().filter(edge=>edges[edge]===undefined&&edgeBoxes(edge).every(([row,col])=>row<0||row>=SIZE||col<0||col>=SIZE||sidesDrawn(edges,row,col)<3));
    if(!eligible.length)break;
    edges[eligible[Math.floor(random()*eligible.length)]]=-1;
  }
  return edges;
}
export function createDotsBoxesGame(roster=[],{random=Math.random}={}){
  const teamPlayers=[[],[]];
  roster.map(value=>String(value||'').trim()).filter(Boolean).forEach((name,index)=>teamPlayers[index%2].push(name));
  return{size:SIZE,teams:['الفريق البرتقالي','الفريق الأخضر'],teamPlayers,turn:0,edges:seedEdges(random),boxes:{},scores:[0,0],winner:null,finished:false,lastMove:null,started:false,selected:null,streak:0,cursor:[0,0]};
}
export function startDotsBoxesGame(game,{random=Math.random}={}){
  if(!game||game.started||!game.teamPlayers[0].length||!game.teamPlayers[1].length)return game;
  return{...game,started:true,turn:random()<0.5?0:1,cursor:[0,0],selected:null,lastMove:null,streak:0};
}
function score(boxes,team){return Object.values(boxes).filter(owner=>owner===team||owner?.team===team).length;}
function finishedWinner(game){
  if(game.scores[0]>=MAJORITY)return 0;
  if(game.scores[1]>=MAJORITY)return 1;
  if(!game.finished)return null;
  return game.scores[0]===game.scores[1]?null:game.scores[0]>game.scores[1]?0:1;
}
export function pickDotsBoxesEdge(game,edgeId){
  if(!game||!game.started||game.finished||!listDotsBoxesEdges(game.size).includes(edgeId)||game.edges[edgeId]!==undefined)return game;
  return{...game,selected:edgeId};
}
export function answerDotsBoxesEdge(game,edgeId,verdict){
  const picked=game?.selected===edgeId?game:pickDotsBoxesEdge(game,edgeId);
  if(picked===game)return game;
  const team=game.turn,correct=verdict===true||verdict==='correct',outcome=correct?'correct':verdict==='none'?'none':'wrong';
  const next={...picked,edges:{...picked.edges},boxes:{...picked.boxes},scores:[...picked.scores],cursor:[...picked.cursor],selected:null,lastMove:{edgeId,verdict:outcome,correct,team,closed:[]}};
  next.cursor[team]=(next.cursor[team]+1)%Math.max(1,next.teamPlayers[team].length);
  if(!correct){next.turn=1-team;next.streak=0;next.lastMove.closed=[];return next;}
  next.edges[edgeId]=team;
  const closed=[];
  for(const[row,col]of edgeBoxes(edgeId)){
    if(row<0||row>=SIZE||col<0||col>=SIZE)continue;
    const id=`${row}-${col}`;
    if(next.boxes[id]===undefined&&boxEdges(row,col).every(edge=>next.edges[edge]!==undefined)){next.boxes[id]=team;closed.push(id);}
  }
  next.scores[team]=score(next.boxes,team);next.lastMove.closed=closed;
  next.streak=closed.length?game.streak+closed.length:0;
  next.finished=Object.keys(next.edges).length===EDGES||next.scores[team]>=MAJORITY;
  next.winner=finishedWinner(next);
  if(!next.finished&&(!closed.length||next.streak>=STREAK_CAP))next.turn=1-team;
  return next;
}
