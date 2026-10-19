export const KING_INSPECTOR_GAME_ID='king-inspector-thief-executioner';
export const KING_INSPECTOR_ROLES=Object.freeze(['king','inspector','thief','executioner']);
export const KING_INSPECTOR_CHALLENGES=Object.freeze(['animal-voice','tongue-twister','funny-sentence']);

const ROLE_SET=new Set(KING_INSPECTOR_ROLES);
const CHALLENGE_SET=new Set(KING_INSPECTOR_CHALLENGES);
const clone=value=>JSON.parse(JSON.stringify(value));

function randomIndex(max){
  const values=new Uint32Array(1);
  if(globalThis.crypto?.getRandomValues){
    const limit=Math.floor(0x100000000/max)*max;
    do{globalThis.crypto.getRandomValues(values);}while(values[0]>=limit);
    return values[0]%max;
  }
  return Math.floor(Math.random()*max);
}

function permutations(values){
  if(values.length<2)return[values];
  const result=[];
  for(let i=0;i<values.length;i++)for(const tail of permutations([...values.slice(0,i),...values.slice(i+1)]))result.push([values[i],...tail]);
  return result;
}

function roleHistoryForNextRound(state){
  const history=clone(state.roleHistory||{});
  if(state.players.every(id=>new Set(history[id]||[]).size===KING_INSPECTOR_ROLES.length)){
    return Object.fromEntries(state.players.map(id=>[id,[]]));
  }
  return history;
}

function shuffledAssignment(players,history){
  const options=permutations([...KING_INSPECTOR_ROLES]).filter(roles=>players.every((player,index)=>!(history[player]||[]).includes(roles[index])));
  if(!options.length)throw new Error('role_assignment_unavailable');
  const assignment=options[randomIndex(options.length)];
  return Object.fromEntries(players.map((player,index)=>[player,assignment[index]]));
}

function startRound(state,round=Number(state.round||0)+1){
  const next=clone(state),history=roleHistoryForNextRound(next);
  const roles=shuffledAssignment(next.players,history);
  for(const playerId of next.players)history[playerId]=[...(history[playerId]||[]),roles[playerId]];
  next.roleHistory=history;next.roles=roles;next.round=round;next.status='playing';next.phase='king-question';
  next.kingPlayerId=next.players.find(id=>roles[id]==='king');next.inspectorRevealedId=null;next.accusation=null;
  next.winnerIds=[];next.penaltyTargetId=null;next.penaltyChallengeId=null;next.penaltySkipped=false;next.publicRoles=null;
  next.startedAt=new Date().toISOString();next.endedAt=null;
  return next;
}

export function createInitialKingInspectorRoomState(hostPlayerId){
  return Object.freeze({gameId:KING_INSPECTOR_GAME_ID,status:'waiting',phase:'waiting',players:Object.freeze([hostPlayerId]),round:0,roles:Object.freeze({}),roleHistory:Object.freeze({[hostPlayerId]:Object.freeze([])}),scores:Object.freeze({[hostPlayerId]:0}),winnerIds:Object.freeze([]),startedAt:null});
}

export function addKingInspectorRoomPlayer(state,playerId){
  if(state?.gameId!==KING_INSPECTOR_GAME_ID||state.status!=='waiting')return{ok:false,reason:'room-not-waiting'};
  if(state.players.includes(playerId))return{ok:false,reason:'player-already-in-room'};
  if(state.players.length>=KING_INSPECTOR_ROLES.length)return{ok:false,reason:'room-full'};
  const next=clone(state);next.players.push(playerId);next.scores[playerId]=0;next.roleHistory[playerId]=[];
  return{ok:true,state:next.players.length===KING_INSPECTOR_ROLES.length?startRound(next,1):next};
}

export function applyKingInspectorRoomAction(state,{playerId,type,payload={}}={}){
  if(state?.gameId!==KING_INSPECTOR_GAME_ID)return{ok:false,reason:'invalid-game-state'};
  if(!state.players?.includes(playerId))return{ok:false,reason:'player-not-in-room'};
  if(type==='next-round'){
    if(state.status!=='finished')return{ok:false,reason:'round-not-finished'};
    return{ok:true,state:startRound(state,Number(state.round||0)+1)};
  }
  if(state.status!=='playing')return{ok:false,reason:'game-not-playing'};
  const role=state.roles?.[playerId];
  if(type==='ask-inspector'){
    if(state.phase!=='king-question')return{ok:false,reason:'wrong-game-phase'};
    if(role!=='king')return{ok:false,reason:'king-only'};
    const next=clone(state);next.phase='inspector-claim';return{ok:true,state:next};
  }
  if(type==='claim-inspector'){
    if(state.phase!=='inspector-claim')return{ok:false,reason:'wrong-game-phase'};
    if(role!=='inspector')return{ok:false,reason:'inspector-only'};
    const next=clone(state);next.inspectorRevealedId=playerId;next.phase='king-command';return{ok:true,state:next};
  }
  if(type==='issue-command'){
    if(state.phase!=='king-command')return{ok:false,reason:'wrong-game-phase'};
    if(role!=='king')return{ok:false,reason:'king-only'};
    const next=clone(state);next.phase='inspector-choosing';return{ok:true,state:next};
  }
  if(type==='accuse'){
    if(state.phase!=='inspector-choosing')return{ok:false,reason:'wrong-game-phase'};
    if(role!=='inspector'||state.inspectorRevealedId!==playerId)return{ok:false,reason:'inspector-only'};
    const target=String(payload.targetPlayerId||'');
    if(!state.players.includes(target)||target===playerId||target===state.kingPlayerId)return{ok:false,reason:'invalid-suspect'};
    const thiefId=state.players.find(id=>state.roles[id]==='thief'),executionerId=state.players.find(id=>state.roles[id]==='executioner');
    const caught=target===thiefId,next=clone(state);
    next.accusation={inspectorId:playerId,targetPlayerId:target,caught};
    next.publicRoles={...next.roles};
    next.winnerIds=caught?[next.kingPlayerId,playerId,executionerId]:[thiefId];
    next.penaltyTargetId=caught?thiefId:playerId;
    for(const winnerId of next.winnerIds)next.scores[winnerId]=Number(next.scores[winnerId]||0)+1;
    next.phase='challenge';
    return{ok:true,state:next};
  }
  if(type==='choose-challenge'){
    if(state.phase!=='challenge')return{ok:false,reason:'wrong-game-phase'};
    if(role!=='king')return{ok:false,reason:'king-only'};
    const challenge=String(payload.challengeId||'');if(!CHALLENGE_SET.has(challenge))return{ok:false,reason:'invalid-challenge'};
    const next=clone(state);next.penaltyChallengeId=challenge;next.phase='challenge-response';return{ok:true,state:next};
  }
  if(type==='skip-challenge'){
    if(!['challenge','challenge-response'].includes(state.phase))return{ok:false,reason:'wrong-game-phase'};
    if(playerId!==state.penaltyTargetId&&role!=='king')return{ok:false,reason:'penalty-target-only'};
    const next=clone(state);next.penaltySkipped=true;next.status='finished';next.phase='finished';next.endedAt=new Date().toISOString();return{ok:true,state:next};
  }
  if(type==='complete-challenge'){
    if(state.phase!=='challenge-response')return{ok:false,reason:'wrong-game-phase'};
    if(playerId!==state.penaltyTargetId)return{ok:false,reason:'penalty-target-only'};
    const next=clone(state);next.status='finished';next.phase='finished';next.endedAt=new Date().toISOString();return{ok:true,state:next};
  }
  return{ok:false,reason:'unsupported-action'};
}

export function projectKingInspectorRoomState(state,{viewerPlayerId=null}={}){
  const next=clone(state||{}),roles=next.roles||{};
  next.privateRole=viewerPlayerId?roles[viewerPlayerId]||null:null;
  next.publicRoles={};
  if(next.kingPlayerId)next.publicRoles[next.kingPlayerId]='king';
  if(next.inspectorRevealedId)next.publicRoles[next.inspectorRevealedId]='inspector';
  if(next.phase==='challenge'||next.phase==='challenge-response'||next.phase==='finished')next.publicRoles={...roles};
  delete next.roles;delete next.roleHistory;
  return Object.freeze(next);
}
