import {isRoomUnavailableError} from './game-room-errors.js';
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
  let code='',token='',selfPlayerId='',selfLearnerId='',room=null,poller=null,generation=0,needsNotification=false;

  function stopPoller(){poller?.stop();poller=null;}
  function clearState(){room=null;code='';token='';selfPlayerId='';selfLearnerId='';}
  function persist(){
    if(!code||!token||!selfPlayerId||!selfLearnerId)return false;
    return store.save({gameId:id,code,token,selfPlayerId,selfLearnerId,expiresAt:room?.expiresAt||''});
  }
  function emit(next){
    if(!next)return null;
    if(next.gameId&&String(next.gameId)!==id)throw new Error(`online room game mismatch: ${next.gameId}`);
    const previous=room;if(previous?.code===next.code&&Number(next.version)<Number(previous.version))return previous;room=next;code=next.code||code;selfPlayerId=next.selfPlayerId||selfPlayerId;persist();
    const unchanged=Boolean(!needsNotification&&previous&&next&&previous.code===next.code&&previous.version===next.version&&previous.status===next.status);
    needsNotification=false;if(!unchanged)onRoom?.(next);
    return next;
  }
  function handlePollError(error){
    needsNotification=true;
    if(isRoomUnavailableError(error)){generation++;store.clear({gameId:id,selfLearnerId});stopPoller();clearState();}
    onError?.(error);
  }
  function startPolling(){
    stopPoller();if(!autoPoll||!code||!token)return;
    const current=generation,currentCode=code,currentToken=token;
    poller=createRoomPoller({intervalMs:pollIntervalMs,load:()=>roomClient.getRoom({code:currentCode,token:currentToken}),onRoom:next=>{if(current===generation)emit(next);},onError:error=>{if(current===generation)handlePollError(error);}});poller.start();
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
    const current=generation;
    try{const result=await roomClient.submitAction({code,token,expectedVersion:room.version,type:actionType,payload:actionPayload});return current===generation?emit(result.room):null;}
    catch(error){if(current!==generation)return null;if(error?.body?.room)emit(error.body.room);throw error;}
  }
  async function resume({learnerId=null}={}){
    const saved=store.load({gameId:id,learnerId});if(!saved)return null;
    stopPoller();const current=++generation;room=null;code=saved.code;token=saved.token;selfPlayerId=saved.selfPlayerId;selfLearnerId=saved.selfLearnerId;
    try{const result=await roomClient.getRoom({code,token});if(current!==generation)return null;emit(result.room);startPolling();return result.room;}
    catch(error){if(current!==generation)return null;if(isRoomUnavailableError(error)){store.clear(saved);clearState();}throw error;}
  }
  function stop({forget=false}={}){generation++;stopPoller();if(forget)store.clear({gameId:id,selfLearnerId});clearState();}
  function snapshot(){
    const participant=selfParticipant(room,selfPlayerId);
    return Object.freeze({gameId:id,code,token,selfPlayerId,selfLearnerId,room,authorityRole:authorityRole(room,selfPlayerId),participationRole:participant?.participationRole||'player',connected:Boolean(room&&code&&token)});
  }

  return Object.freeze({
    async create(learnerId,{displayName}={}){stop();const current=generation;try{const result=await roomClient.createRoom({gameId:id,learnerId,displayName});return current===generation?accept(result,learnerId):null;}catch(error){if(current!==generation)return null;throw error;}},
    async join(codeValue,learnerId,{displayName,participationRole='player'}={}){
      const saved=store.load({gameId:id,learnerId});
      if(saved&&saved.code===String(codeValue))return resume({learnerId});
      stop();const current=generation;try{const result=await roomClient.joinRoom({code:codeValue,learnerId,displayName,participationRole});return current===generation?accept(result,learnerId):null;}catch(error){if(current!==generation)return null;throw error;}
    },
    submit,
    async refresh(){if(!code||!token)throw new Error('online room unavailable');const current=generation;try{const result=await roomClient.getRoom({code,token});return current===generation?emit(result.room):null;}catch(error){if(current!==generation)return null;throw error;}},
    resume,
    reconnect:resume,
    savedResume(learnerId=null){return store.load({gameId:id,learnerId});},
    hasResume(learnerId=null){return store.has({gameId:id,learnerId});},
    stop,
    forget(){stop({forget:true});},
    get snapshot(){return snapshot();}
  });
}
