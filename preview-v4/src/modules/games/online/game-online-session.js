import { normalizeLearnerId } from '../../../shared/learners/learner-id.js';
import { createRoomPoller } from './game-room-client.js';
import { createGameRoomResumeStore } from './game-room-resume-store.js';

const GAME_ID_PATTERN=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function normalizeGameId(value){const id=String(value||'').trim().toLowerCase();return GAME_ID_PATTERN.test(id)?id:null;}
function selfParticipant(room,selfPlayerId){return(room?.players||[]).find(item=>item.playerId===selfPlayerId)||null;}
function authorityRole(room,selfPlayerId){
  const participant=selfParticipant(room,selfPlayerId);if(!participant)return null;
  if(participant.authorityRole)return participant.authorityRole;
  return Number(participant.seat)===0?'host':'guest';
}

export function createOnlineGameSession({gameId,roomClient,onRoom,onError,pollIntervalMs=1100,resumeStore=null,autoPoll=true}={}){
  const id=normalizeGameId(gameId);if(!id)throw new TypeError('valid gameId is required');
  if(!roomClient)throw new TypeError('room client required');
  const store=resumeStore||createGameRoomResumeStore({gameId:id});
  let code='',token='',selfPlayerId='',selfLearnerId='',room=null,poller=null;

  function stopPoller(){poller?.stop();poller=null;}
  function clearState(){room=null;code='';token='';selfPlayerId='';selfLearnerId='';}
  function persist(){
    if(!code||!token||!selfPlayerId||!selfLearnerId)return false;
    return store.save({gameId:id,code,token,selfPlayerId,selfLearnerId,expiresAt:room?.expiresAt||''});
  }
  function emit(next){
    if(!next)return null;
    if(next.gameId&&String(next.gameId)!==id)throw new Error(`online room game mismatch: ${next.gameId}`);
    const previous=room;room=next;code=next.code||code;selfPlayerId=next.selfPlayerId||selfPlayerId;persist();
    const unchanged=Boolean(previous&&next&&previous.code===next.code&&previous.version===next.version&&previous.status===next.status);
    if(!unchanged)onRoom?.(next);
    return next;
  }
  function handlePollError(error){
    if(error?.status===401||error?.status===404){store.clear({gameId:id,selfLearnerId});stopPoller();clearState();}
    onError?.(error);
  }
  function startPolling(){
    stopPoller();if(!autoPoll||!code||!token)return;
    poller=createRoomPoller({intervalMs:pollIntervalMs,load:()=>roomClient.getRoom({code,token}),onRoom:emit,onError:handlePollError});poller.start();
  }
  function accept(result,learnerId){
    if(!result?.room||!result?.playerToken)throw new Error('invalid online room response');
    const learner=normalizeLearnerId(learnerId);if(!learner)throw new TypeError('valid learnerId is required');
    code=String(result.room.code||'');token=String(result.playerToken||'');selfPlayerId=String(result.room.selfPlayerId||'');selfLearnerId=learner;
    emit(result.room);startPolling();return result.room;
  }
  async function submit(type,payload={}){
    if(!room)throw new Error('online room unavailable');
    const actionType=String(type||'').trim();if(!actionType)throw new TypeError('action type is required');
    const actionPayload=payload&&typeof payload==='object'&&!Array.isArray(payload)?payload:{};
    try{return emit((await roomClient.submitAction({code,token,expectedVersion:room.version,type:actionType,payload:actionPayload})).room);}
    catch(error){if(error?.body?.room)emit(error.body.room);throw error;}
  }
  async function resume({learnerId=null}={}){
    const saved=store.load({gameId:id,learnerId});if(!saved)return null;
    stopPoller();code=saved.code;token=saved.token;selfPlayerId=saved.selfPlayerId;selfLearnerId=saved.selfLearnerId;
    try{const result=await roomClient.getRoom({code,token});emit(result.room);startPolling();return result.room;}
    catch(error){if(error?.status===401||error?.status===404){store.clear(saved);clearState();}throw error;}
  }
  function stop({forget=false}={}){stopPoller();if(forget)store.clear({gameId:id,selfLearnerId});clearState();}
  function snapshot(){
    const participant=selfParticipant(room,selfPlayerId);
    return Object.freeze({gameId:id,code,token,selfPlayerId,selfLearnerId,room,authorityRole:authorityRole(room,selfPlayerId),participationRole:participant?.participationRole||'player',connected:Boolean(room&&code&&token)});
  }

  return Object.freeze({
    async create(learnerId,{displayName}={}){stop({forget:true});return accept(await roomClient.createRoom({gameId:id,learnerId,displayName}),learnerId);},
    async join(codeValue,learnerId,{displayName}={}){stop({forget:true});return accept(await roomClient.joinRoom({code:codeValue,learnerId,displayName}),learnerId);},
    submit,
    refresh(){if(!code||!token)return Promise.reject(new Error('online room unavailable'));return roomClient.getRoom({code,token}).then(result=>emit(result.room));},
    resume,
    reconnect:resume,
    hasResume(learnerId=null){return store.has({gameId:id,learnerId});},
    stop,
    forget(){stop({forget:true});},
    get snapshot(){return snapshot();}
  });
}
