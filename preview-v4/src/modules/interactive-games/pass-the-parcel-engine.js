function cleanRoster(players=[]){
  return [...new Set((Array.isArray(players)?players:[]).map(name=>String(name||'').trim()).filter(Boolean))];
}

function scoreMap(roster,scores={}){
  return Object.fromEntries(roster.map(name=>[name,Math.max(0,Number(scores[name])||0)]));
}

export function createPassParcelGame(players,{targetScore=5}={}){
  const roster=cleanRoster(players);
  return Object.freeze({
    roster,
    scores:scoreMap(roster),
    targetScore:Math.max(1,Number(targetScore)||5),
    holderIndex:0,
    round:0,
    status:'ready',
    durationMs:0,
    questionId:null,
    lastVerdict:null,
    winner:null
  });
}

export function startPassParcelRound(state,{random=Math.random,minMs=12000,maxMs=25000}={}){
  const roster=cleanRoster(state?.roster);
  if(roster.length<2)return state;
  const low=Math.max(1000,Math.floor(Number(minMs)||12000));
  const high=Math.max(low,Math.floor(Number(maxMs)||25000));
  const holderIndex=Math.min(roster.length-1,Math.floor(Math.max(0,Math.min(.999999,Number(random())||0))*roster.length));
  const durationMs=low+Math.floor(Math.max(0,Math.min(.999999,Number(random())||0))*(high-low+1));
  return Object.freeze({
    ...state,
    roster,
    scores:scoreMap(roster,state?.scores),
    holderIndex,
    round:(Number(state?.round)||0)+1,
    status:'passing',
    durationMs,
    questionId:null,
    lastVerdict:null,
    winner:null
  });
}

export function passParcelToNext(state){
  if(state?.status!=='passing'||!state.roster?.length)return state;
  return Object.freeze({...state,holderIndex:(state.holderIndex+1)%state.roster.length});
}

export function stopPassParcelRound(state,questionId){
  if(state?.status!=='passing')return state;
  return Object.freeze({...state,status:'question',questionId:String(questionId||''),durationMs:0});
}

export function answerPassParcelQuestion(state,verdict){
  if(state?.status!=='question'||!state.roster?.length)return state;
  const holder=state.roster[state.holderIndex];
  const scores=scoreMap(state.roster,state.scores);
  if(verdict==='correct')scores[holder]=(scores[holder]||0)+1;
  const winner=verdict==='correct'&&scores[holder]>=state.targetScore?holder:null;
  return Object.freeze({
    ...state,
    scores,
    status:winner?'finished':'round_complete',
    questionId:null,
    lastVerdict:verdict,
    winner
  });
}

export function currentPassParcelHolder(state){
  return state?.roster?.[state.holderIndex]||'';
}
