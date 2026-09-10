const PREFIX='family-learning-game-reward-progress-v1';
const TRACKED=new Set(['game.completed','game.won','game.retry','game.goal.reached','game.cooperation.completed']);

function initial(learnerId){
  return {version:1,learnerId,completions:0,wins:0,retries:0,goals:0,cooperations:0,completedGames:[],seenEvents:[]};
}

function normalized(raw,learnerId){
  const value=raw&&typeof raw==='object'?raw:{};
  const games=[...new Set((value.completedGames||[]).map(item=>String(item||'').trim()).filter(Boolean))];
  const seen=[...new Set((value.seenEvents||[]).map(item=>String(item||'').trim()).filter(Boolean))].slice(-500);
  return {
    version:1,learnerId,
    completions:Math.max(0,Number(value.completions)||0),
    wins:Math.max(0,Number(value.wins)||0),
    retries:Math.max(0,Number(value.retries)||0),
    goals:Math.max(0,Number(value.goals)||0),
    cooperations:Math.max(0,Number(value.cooperations)||0),
    completedGames:games,
    seenEvents:seen
  };
}

function eventKey(event){
  const learnerId=String(event?.learnerId||'').trim().toLowerCase();
  const type=String(event?.type||'').trim();
  const gameId=String(event?.gameId||'').trim();
  const sessionId=String(event?.sessionId||event?.at||'').trim();
  const detail=event?.payload?.attemptNumber??event?.payload?.round??event?.payload?.cell??'';
  return [learnerId,type,gameId,sessionId,detail].join('|');
}

function snapshot(state){
  return Object.freeze({
    completions:state.completions,
    wins:state.wins,
    retries:state.retries,
    goals:state.goals,
    cooperations:state.cooperations,
    uniqueGamesCompleted:state.completedGames.length,
    completedGames:Object.freeze([...state.completedGames])
  });
}

export function createGameRewardProgressTracker({storage=null}={}){
  const memory=new Map();
  const io=storage||{
    getItem:key=>memory.has(key)?memory.get(key):null,
    setItem:(key,value)=>memory.set(key,String(value))
  };
  const key=learnerId=>`${PREFIX}:${String(learnerId||'').trim().toLowerCase()}`;

  function load(learnerId){
    const id=String(learnerId||'').trim().toLowerCase();
    if(!id)return initial('');
    try{return normalized(JSON.parse(io?.getItem?.(key(id))||'null'),id);}catch{return initial(id);}
  }

  function save(state){
    io?.setItem?.(key(state.learnerId),JSON.stringify(state));
    return state;
  }

  function record(event){
    const learnerId=String(event?.learnerId||'').trim().toLowerCase();
    if(!learnerId||!TRACKED.has(event?.type))return get(learnerId);
    const state=load(learnerId),fingerprint=eventKey(event);
    if(state.seenEvents.includes(fingerprint))return snapshot(state);
    state.seenEvents.push(fingerprint);
    if(state.seenEvents.length>500)state.seenEvents.splice(0,state.seenEvents.length-500);
    if(event.type==='game.completed'){
      state.completions+=1;
      const gameId=String(event?.gameId||'').trim();
      if(gameId&&!state.completedGames.includes(gameId))state.completedGames.push(gameId);
    }else if(event.type==='game.won')state.wins+=1;
    else if(event.type==='game.retry')state.retries+=1;
    else if(event.type==='game.goal.reached')state.goals+=1;
    else if(event.type==='game.cooperation.completed')state.cooperations+=1;
    save(state);
    return snapshot(state);
  }

  function get(learnerId){return snapshot(load(learnerId));}
  return Object.freeze({record,get,key});
}
