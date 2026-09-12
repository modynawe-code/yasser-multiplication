import { createOnlineGameSession } from '../online/game-online-session.js';

function learnerMap(room){return Object.fromEntries((room?.players||[]).map(player=>[player.playerId,player.learnerId]));}

export function normalizeOnlineXoRoom(room){
  const map=learnerMap(room),state=room?.state||{};
  return Object.freeze({
    players:Object.freeze((state.players||[]).map(id=>map[id]||id)),
    board:Object.freeze((state.board||Array(9).fill(null)).map(id=>id?map[id]||id:null)),
    currentPlayer:state.currentPlayerId?map[state.currentPlayerId]||state.currentPlayerId:null,
    winner:state.winner?map[state.winner]||state.winner:null,
    winningLine:Object.freeze([...(state.winningLine||[])]),
    rematchReady:Object.freeze((state.rematchReady||[]).map(id=>map[id]||id)),
    moveCount:Number(state.moveCount||0),
    round:Number(state.round||1),
    status:state.status||room?.status||'waiting'
  });
}

export function createXoOnlineSession({roomClient,onRoom,onError,pollIntervalMs=1100,resumeStore,autoPoll=true}={}){
  const session=createOnlineGameSession({gameId:'xo',roomClient,onRoom,onError,pollIntervalMs,resumeStore,autoPoll});
  return Object.freeze({
    create(learnerId,options){return session.create(learnerId,options);},
    join(codeValue,learnerId,options){return session.join(codeValue,learnerId,options);},
    move(cell){return session.submit('move',{cell});},
    pass(){return session.submit('pass');},
    reset(){return session.submit('reset');},
    refresh(){return session.refresh();},
    resume(options){return session.resume(options);},
    reconnect(options){return session.reconnect(options);},
    hasResume(learnerId=null){return session.hasResume(learnerId);},
    stop(options){return session.stop(options);},
    forget(){return session.forget();},
    get snapshot(){const snapshot=session.snapshot;return Object.freeze({...snapshot,xoState:snapshot.room?normalizeOnlineXoRoom(snapshot.room):null});},
    isSelfTurn(){const snapshot=session.snapshot;return Boolean(snapshot.room?.state?.currentPlayerId&&snapshot.room.state.currentPlayerId===snapshot.selfPlayerId);}
  });
}
