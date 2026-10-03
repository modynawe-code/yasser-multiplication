import { createOnlineGameSession } from '../online/game-online-session.js';

function learnerMap(room){return Object.fromEntries((room?.players||[]).map(player=>[player.playerId,player.learnerId]));}
function mapPlayer(map,value){return value?map[value]||value:null;}

export function normalizeOnlineRpsRoom(room){
  const map=learnerMap(room),state=room?.state||{};
  const scores=Object.fromEntries(Object.entries(state.scores||{}).map(([playerId,score])=>[map[playerId]||playerId,Number(score||0)]));
  const choices=Object.fromEntries(Object.entries(state.choices||{}).map(([playerId,choice])=>[map[playerId]||playerId,choice]));
  return Object.freeze({
    players:Object.freeze((state.players||[]).map(id=>map[id]||id)),
    targetScore:Number(state.targetScore||3),
    round:Number(state.round||1),
    status:state.status||room?.status||'waiting',
    phase:state.phase||'waiting',
    choices:Object.freeze(choices),
    chosenPlayers:Object.freeze((state.chosenPlayers||Object.keys(state.choices||{})).map(id=>map[id]||id)),
    scores:Object.freeze(scores),
    roundWinner:mapPlayer(map,state.roundWinner),
    matchWinner:mapPlayer(map,state.matchWinner),
    rematchReady:Object.freeze((state.rematchReady||[]).map(id=>map[id]||id))
  });
}

export function createRpsOnlineSession({roomClient,onRoom,onError,pollIntervalMs=1100,resumeStore,autoPoll=true}={}){
  const session=createOnlineGameSession({gameId:'rock-paper-scissors',roomClient,onRoom,onError,pollIntervalMs,resumeStore,autoPoll});
  return Object.freeze({
    create(learnerId,options){return session.create(learnerId,options);},
    join(codeValue,learnerId,options){return session.join(codeValue,learnerId,options);},
    choose(choice){return session.submit('choose',{choice});},
    next(){return session.submit('next');},
    reset(){return session.submit('reset');},
    refresh(){return session.refresh();},
    resume(options){return session.resume(options);},
    reconnect(options){return session.reconnect(options);},
    hasResume(learnerId=null){return session.hasResume(learnerId);},
    stop(options){return session.stop(options);},
    forget(){return session.forget();},
    get snapshot(){const snapshot=session.snapshot;return Object.freeze({...snapshot,rpsState:snapshot.room?normalizeOnlineRpsRoom(snapshot.room):null});},
    hasChosen(){const snapshot=session.snapshot,state=snapshot.room?.state||{};return Boolean((state.chosenPlayers||[]).includes(snapshot.selfPlayerId)||state.choices?.[snapshot.selfPlayerId]);}
  });
}
