import { createRoomPoller } from '../online/game-room-client.js';
import { createGameRoomResumeStore } from '../online/game-room-resume-store.js';

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

export function createXoOnlineSession({roomClient,onRoom,onError,pollIntervalMs=1100,resumeStore=createGameRoomResumeStore()}={}){
  if(!roomClient)throw new TypeError('room client required');
  let code='',token='',selfPlayerId='',selfLearnerId='',room=null,poller=null;

  function stopPoller(){poller?.stop();poller=null;}
  function persist(){
    if(!code||!token||!selfPlayerId||!selfLearnerId)return false;
    return resumeStore.save({gameId:'xo',code,token,selfPlayerId,selfLearnerId,expiresAt:room?.expiresAt||''});
  }
  function emit(next){room=next;persist();onRoom?.(next);return next;}
  function handlePollError(error){
    if(error?.status===401||error?.status===404){resumeStore.clear({selfLearnerId});stopPoller();}
    onError?.(error);
  }
  function startPolling(){
    stopPoller();if(!code||!token)return;
    poller=createRoomPoller({intervalMs:pollIntervalMs,load:()=>roomClient.getRoom({code,token}),onRoom:emit,onError:handlePollError});
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
  async function resume(){
    const saved=resumeStore.load();if(!saved)return null;
    stopPoller();code=saved.code;token=saved.token;selfPlayerId=saved.selfPlayerId;selfLearnerId=saved.selfLearnerId;
    try{
      const result=await roomClient.getRoom({code,token});emit(result.room);startPolling();return result.room;
    }catch(error){
      if(error?.status===401||error?.status===404){resumeStore.clear(saved);code='';token='';selfPlayerId='';selfLearnerId='';room=null;}
      throw error;
    }
  }
  function stop({forget=false}={}){
    stopPoller();if(forget)resumeStore.clear({selfLearnerId});room=null;code='';token='';selfPlayerId='';selfLearnerId='';
  }

  return Object.freeze({
    async create(learnerId){stop({forget:true});return accept(await roomClient.createRoom({gameId:'xo',learnerId}),learnerId);},
    async join(codeValue,learnerId){stop({forget:true});return accept(await roomClient.joinRoom({code:codeValue,learnerId}),learnerId);},
    move(cell){return submit('move',cell);},
    pass(){return submit('pass');},
    reset(){return submit('reset');},
    refresh(){return roomClient.getRoom({code,token}).then(result=>emit(result.room));},
    resume,
    hasResume(){return resumeStore.has();},
    stop,
    forget(){stop({forget:true});},
    get snapshot(){return Object.freeze({code,token,selfPlayerId,selfLearnerId,room,xoState:room?normalizeOnlineXoRoom(room):null});},
    isSelfTurn(){return Boolean(room?.state?.currentPlayerId&&room.state.currentPlayerId===selfPlayerId);}
  });
}
