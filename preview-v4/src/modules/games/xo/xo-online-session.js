import { createRoomPoller } from '../online/game-room-client.js';

function learnerMap(room){return Object.fromEntries((room?.players||[]).map(player=>[player.playerId,player.learnerId]));}

export function normalizeOnlineXoRoom(room){
  const map=learnerMap(room),state=room?.state||{};
  return Object.freeze({
    players:Object.freeze((state.players||[]).map(id=>map[id]||id)),
    board:Object.freeze((state.board||Array(9).fill(null)).map(id=>id?map[id]||id:null)),
    currentPlayer:state.currentPlayerId?map[state.currentPlayerId]||state.currentPlayerId:null,
    winner:state.winner?map[state.winner]||state.winner:null,
    winningLine:Object.freeze([...(state.winningLine||[])]),
    moveCount:Number(state.moveCount||0),
    round:Number(state.round||1),
    status:state.status||room?.status||'waiting'
  });
}

export function createXoOnlineSession({roomClient,onRoom,onError,pollIntervalMs=1100}={}){
  if(!roomClient)throw new TypeError('room client required');
  let code='',token='',selfPlayerId='',selfLearnerId='',room=null,poller=null;

  function stopPoller(){poller?.stop();poller=null;}
  function emit(next){room=next;onRoom?.(next);return next;}
  function startPolling(){
    stopPoller();if(!code||!token)return;
    poller=createRoomPoller({intervalMs:pollIntervalMs,load:()=>roomClient.getRoom({code,token}),onRoom:emit,onError});
    poller.start();
  }
  function accept(result,learnerId){
    code=result.room.code;token=result.playerToken;selfPlayerId=result.room.selfPlayerId;selfLearnerId=learnerId;emit(result.room);startPolling();return result.room;
  }
  async function submit(type,cell){
    if(!room)throw new Error('online room unavailable');
    try{return emit((await roomClient.submitAction({code,token,expectedVersion:room.version,type,cell})).room);}
    catch(error){if(error?.body?.room)emit(error.body.room);throw error;}
  }

  return Object.freeze({
    async create(learnerId){stopPoller();return accept(await roomClient.createRoom({gameId:'xo',learnerId}),learnerId);},
    async join(codeValue,learnerId){stopPoller();return accept(await roomClient.joinRoom({code:codeValue,learnerId}),learnerId);},
    move(cell){return submit('move',cell);},
    pass(){return submit('pass');},
    reset(){return submit('reset');},
    refresh(){return roomClient.getRoom({code,token}).then(result=>emit(result.room));},
    stop(){stopPoller();room=null;code='';token='';selfPlayerId='';selfLearnerId='';},
    get snapshot(){return Object.freeze({code,token,selfPlayerId,selfLearnerId,room,xoState:room?normalizeOnlineXoRoom(room):null});},
    isSelfTurn(){return Boolean(room?.state?.currentPlayerId&&room.state.currentPlayerId===selfPlayerId);}
  });
}
