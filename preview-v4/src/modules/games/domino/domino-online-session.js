import { createOnlineGameSession } from '../online/game-online-session.js';

function learnerMap(room){return Object.fromEntries((room?.players||[]).map(player=>[player.playerId,player.learnerId]));}
function mapPlayer(map,value){return value?map[value]||value:null;}

export function normalizeOnlineDominoRoom(room){
  const map=learnerMap(room),state=room?.state||{};
  const handCounts=Object.fromEntries(Object.entries(state.handCounts||{}).map(([playerId,count])=>[map[playerId]||playerId,Number(count||0)]));
  return Object.freeze({
    players:Object.freeze((state.players||[]).map(id=>map[id]||id)),
    status:state.status||room?.status||'waiting',
    round:Number(state.round||1),
    board:Object.freeze((state.board||[]).map(item=>Object.freeze({...item,playedBy:mapPlayer(map,item.playedBy)}))),
    hand:Object.freeze([...(state.hand||[])]),
    handCounts:Object.freeze(handCounts),
    boneyardCount:Number(state.boneyardCount||0),
    leftEnd:state.leftEnd===null||state.leftEnd===undefined?null:Number(state.leftEnd),
    rightEnd:state.rightEnd===null||state.rightEnd===undefined?null:Number(state.rightEnd),
    currentPlayer:mapPlayer(map,state.currentPlayerId),
    winner:mapPlayer(map,state.winner),
    blocked:Boolean(state.blocked),
    passCount:Number(state.passCount||0),
    rematchReady:Object.freeze((state.rematchReady||[]).map(id=>map[id]||id))
  });
}

export function createDominoOnlineSession({roomClient,onRoom,onError,pollIntervalMs=900,resumeStore,autoPoll=true}={}){
  const session=createOnlineGameSession({gameId:'domino',roomClient,onRoom,onError,pollIntervalMs,resumeStore,autoPoll});
  return Object.freeze({
    create(learnerId,options){return session.create(learnerId,options);},
    join(codeValue,learnerId,options){return session.join(codeValue,learnerId,options);},
    play(tileId,side='right'){return session.submit('play',{tileId,side});},
    draw(){return session.submit('draw');},
    pass(){return session.submit('pass');},
    reset(){return session.submit('reset');},
    refresh(){return session.refresh();},
    resume(options){return session.resume(options);},
    hasResume(learnerId=null){return session.hasResume(learnerId);},
    stop(options){return session.stop(options);},
    forget(){return session.forget();},
    get snapshot(){const snapshot=session.snapshot;return Object.freeze({...snapshot,dominoState:snapshot.room?normalizeOnlineDominoRoom(snapshot.room):null});}
  });
}
