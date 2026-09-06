export const RPS_CHOICES=Object.freeze(['rock','paper','scissors']);

const BEATS=Object.freeze({rock:'scissors',paper:'rock',scissors:'paper'});

function assertPlayer(state,playerId){
  if(!state?.players?.includes(playerId))return{ok:false,reason:'player-not-in-game'};
  return{ok:true};
}

function clone(state){return JSON.parse(JSON.stringify(state));}

export function createRpsState({players=['yasser','khaled'],targetScore=3}={}){
  if(!Array.isArray(players)||players.length!==2||new Set(players).size!==2)throw new TypeError('RPS requires exactly two distinct players');
  if(!Number.isInteger(targetScore)||targetScore<1||targetScore>9)throw new TypeError('targetScore must be between 1 and 9');
  return Object.freeze({
    players:Object.freeze([...players]),
    targetScore,
    round:1,
    status:'choosing',
    chooserIndex:0,
    choices:Object.freeze({}),
    scores:Object.freeze(Object.fromEntries(players.map(id=>[id,0]))),
    roundWinner:null,
    matchWinner:null
  });
}

export function resolveRpsRound(choiceA,choiceB){
  if(!RPS_CHOICES.includes(choiceA)||!RPS_CHOICES.includes(choiceB))throw new TypeError('invalid RPS choice');
  if(choiceA===choiceB)return'draw';
  return BEATS[choiceA]===choiceB?'a':'b';
}

export function submitRpsChoice(state,{playerId,choice}={}){
  const valid=assertPlayer(state,playerId);if(!valid.ok)return valid;
  if(state.status!=='choosing')return{ok:false,reason:'round-not-choosing'};
  if(!RPS_CHOICES.includes(choice))return{ok:false,reason:'invalid-choice'};
  const expectedPlayer=state.players[state.chooserIndex];
  if(expectedPlayer!==playerId)return{ok:false,reason:'not-your-choice'};
  if(state.choices[playerId])return{ok:false,reason:'choice-already-made'};

  const next=clone(state);next.choices[playerId]=choice;
  const otherIndex=next.chooserIndex===0?1:0;
  if(!next.choices[next.players[otherIndex]]){next.chooserIndex=otherIndex;return{ok:true,state:next,reveal:false};}

  const [a,b]=next.players,result=resolveRpsRound(next.choices[a],next.choices[b]);
  next.status='revealed';next.roundWinner=result==='draw'?null:result==='a'?a:b;
  if(next.roundWinner)next.scores[next.roundWinner]=Number(next.scores[next.roundWinner]||0)+1;
  if(next.roundWinner&&next.scores[next.roundWinner]>=next.targetScore){next.status='finished';next.matchWinner=next.roundWinner;}
  return{ok:true,state:next,reveal:true};
}

export function nextRpsRound(state){
  if(state?.status!=='revealed')return{ok:false,reason:'round-not-revealed'};
  const next=clone(state);next.round+=1;next.status='choosing';next.chooserIndex=(next.round-1)%next.players.length;next.choices={};next.roundWinner=null;return{ok:true,state:next};
}

export function resetRpsMatch(state){
  if(!state?.players)return{ok:false,reason:'invalid-state'};
  return{ok:true,state:createRpsState({players:state.players,targetScore:state.targetScore})};
}
