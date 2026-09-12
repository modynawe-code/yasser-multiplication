const PREFIX='family-learning-game-progression-v1';
const DEFAULT_LEVEL_XP=100;

export const DEFAULT_GAME_XP_POLICY=Object.freeze({
  'game.completed':20,
  'game.won':10,
  'game.goal.reached':5,
  'game.cooperation.completed':10
});

function normalizePolicy(policy){
  const source=policy&&typeof policy==='object'?policy:{};
  const normalized={};
  for(const [type,value] of Object.entries(source)){
    const points=Number(value);
    if(Number.isFinite(points)&&points>=0)normalized[String(type)]=points;
  }
  return Object.freeze(normalized);
}

function initial(learnerId){return{version:1,learnerId,xp:0,eventCounts:{},seenEvents:[]};}

function normalized(raw,learnerId){
  const value=raw&&typeof raw==='object'?raw:{};
  const counts=value.eventCounts&&typeof value.eventCounts==='object'?value.eventCounts:{};
  const eventCounts={};
  for(const [type,count] of Object.entries(counts))eventCounts[String(type)]=Math.max(0,Number(count)||0);
  return{
    version:1,
    learnerId,
    xp:Math.max(0,Number(value.xp)||0),
    eventCounts,
    seenEvents:[...new Set((value.seenEvents||[]).map(item=>String(item||'').trim()).filter(Boolean))].slice(-750)
  };
}

function eventKey(event){
  const learnerId=String(event?.learnerId||'').trim().toLowerCase();
  const type=String(event?.type||'').trim();
  const gameId=String(event?.gameId||'').trim();
  const sessionId=String(event?.sessionId||event?.at||'').trim();
  const detail=event?.payload?.attemptNumber??event?.payload?.round??event?.payload?.cell??event?.payload?.goal??'';
  return[learnerId,type,gameId,sessionId,detail].join('|');
}

function snapshot(state,levelXp){
  const xp=Math.max(0,Number(state.xp)||0),level=Math.floor(xp/levelXp)+1,currentLevelXp=xp%levelXp;
  return Object.freeze({
    xp,
    level,
    levelXp,
    currentLevelXp,
    xpToNextLevel:levelXp-currentLevelXp,
    eventCounts:Object.freeze({...state.eventCounts})
  });
}

export function createGameProgressionService({storage=null,xpPolicy=DEFAULT_GAME_XP_POLICY,levelXp=DEFAULT_LEVEL_XP}={}){
  const policy=normalizePolicy(xpPolicy),step=Number(levelXp);
  if(!Number.isFinite(step)||step<=0)throw new TypeError('levelXp must be greater than zero');
  const memory=new Map();
  const io=storage||{getItem:key=>memory.has(key)?memory.get(key):null,setItem:(key,value)=>memory.set(key,String(value))};
  const key=learnerId=>`${PREFIX}:${String(learnerId||'').trim().toLowerCase()}`;

  function load(learnerId){
    const id=String(learnerId||'').trim().toLowerCase();
    if(!id)return initial('');
    try{return normalized(JSON.parse(io?.getItem?.(key(id))||'null'),id);}catch{return initial(id);}
  }

  function save(state){io?.setItem?.(key(state.learnerId),JSON.stringify(state));return state;}

  function record(event){
    const learnerId=String(event?.learnerId||'').trim().toLowerCase();
    if(!learnerId)return get('');
    const points=Number(policy[event?.type]||0),state=load(learnerId);
    if(points<=0)return snapshot(state,step);
    const fingerprint=eventKey(event);
    if(state.seenEvents.includes(fingerprint))return snapshot(state,step);
    state.seenEvents.push(fingerprint);
    if(state.seenEvents.length>750)state.seenEvents.splice(0,state.seenEvents.length-750);
    state.xp+=points;
    state.eventCounts[event.type]=(state.eventCounts[event.type]||0)+1;
    save(state);
    return snapshot(state,step);
  }

  function get(learnerId){return snapshot(load(learnerId),step);}
  return Object.freeze({record,get,key,policy,levelXp:step});
}
