import { createGameEvent } from './game-event-contract.js';
import { gameEventBus } from './game-event-bus.js';

function defaultSessionId(gameId,sequence){return `${gameId}-${Date.now()}-${sequence}`;}
function frozenPlayers(players){return Object.freeze([...(Array.isArray(players)?players:[])]);}

export function createGameSessionEvents({gameId,onEvent=gameEventBus.publish,sessionIdFactory=null}={}){
  const id=String(gameId||'').trim();
  if(!id)throw new TypeError('gameId is required');
  const makeSessionId=typeof sessionIdFactory==='function'?sessionIdFactory:sequence=>defaultSessionId(id,sequence);
  let sessionId=null,sequence=0,finished=false;

  function emit(type,learnerId,payload={}){
    if(!sessionId||!learnerId)return null;
    const event=createGameEvent({type,gameId:id,learnerId,sessionId,payload});
    if(typeof onEvent==='function'){try{onEvent(event);}catch{}}
    return event;
  }

  function begin(players=[],{sessionId:providedSessionId=null,learnerIds=null,payload={}}={}){
    sequence+=1;
    sessionId=String(providedSessionId||makeSessionId(sequence)||`${id}-session-${sequence}`);
    finished=false;
    const roster=frozenPlayers(players);
    const recipients=Array.isArray(learnerIds)?learnerIds:roster;
    return Object.freeze((recipients||[]).map(learnerId=>emit('game.started',learnerId,{players:roster,...payload})).filter(Boolean));
  }

  function complete({players=[],winner=null,learnerIds=null,payload={},winnerGoal=null}={}){
    if(finished||!sessionId)return Object.freeze([]);
    finished=true;
    const recipients=Array.isArray(learnerIds)?learnerIds:players;
    const completionPayload={...payload,winner};
    const events=[];
    for(const learnerId of recipients||[]){
      if(winner){
        events.push(emit(learnerId===winner?'game.won':'game.lost',learnerId,completionPayload));
        if(learnerId===winner&&winnerGoal)events.push(emit('game.goal.reached',learnerId,{...completionPayload,...winnerGoal}));
      }
      events.push(emit('game.completed',learnerId,completionPayload));
    }
    return Object.freeze(events.filter(Boolean));
  }

  function reset(){sessionId=null;finished=false;}
  return Object.freeze({emit,begin,complete,reset,getSessionId:()=>sessionId,isFinished:()=>finished});
}
