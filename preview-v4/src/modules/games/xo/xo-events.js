import { createGameEvent } from '../core/game-event-contract.js';
import { gameEventBus } from '../core/game-event-bus.js';

function defaultSessionId(sequence){return `xo-${Date.now()}-${sequence}`;}

export function createXoEventBridge({onEvent=gameEventBus.publish,sessionIdFactory=defaultSessionId}={}){
  let sessionId=null,sequence=0,finished=false;

  function emit(type,learnerId,payload={}){
    if(!sessionId||!learnerId)return null;
    const event=createGameEvent({type,gameId:'xo',learnerId,sessionId,payload});
    if(typeof onEvent==='function'){try{onEvent(event);}catch{}}
    return event;
  }

  function begin(players=[],{sessionId:providedSessionId=null,learnerIds=null}={}){
    sequence+=1;
    sessionId=String(providedSessionId||sessionIdFactory(sequence)||`xo-session-${sequence}`);
    finished=false;
    const recipients=Array.isArray(learnerIds)?learnerIds:players;
    return Object.freeze((recipients||[]).map(learnerId=>emit('game.started',learnerId,{players:Object.freeze([...players])})).filter(Boolean));
  }

  function attempt(learnerId,{isCorrect=false,attemptNumber=1,challengeKind=null}={}){
    const payload={isCorrect:Boolean(isCorrect),attemptNumber:Number(attemptNumber)||1,challengeKind:challengeKind||null};
    const events=[emit('game.attempted',learnerId,payload)];
    if(payload.attemptNumber>1)events.push(emit('game.retry',learnerId,payload));
    return Object.freeze(events.filter(Boolean));
  }

  function turn(learnerId,{cell=null,online=false}={}){
    return emit('game.turn.completed',learnerId,{cell,online:Boolean(online)});
  }

  function complete({players=[],winner=null,status=null,learnerIds=null}={}){
    if(finished||!sessionId)return Object.freeze([]);
    finished=true;
    const recipients=Array.isArray(learnerIds)?learnerIds:players;
    const events=[];
    for(const learnerId of recipients||[]){
      if(winner){
        events.push(emit(learnerId===winner?'game.won':'game.lost',learnerId,{winner,status}));
        if(learnerId===winner)events.push(emit('game.goal.reached',learnerId,{goal:'win',winner,status}));
      }
      events.push(emit('game.completed',learnerId,{winner,status}));
    }
    return Object.freeze(events.filter(Boolean));
  }

  function reset(){sessionId=null;finished=false;}
  return Object.freeze({begin,attempt,turn,complete,reset,getSessionId:()=>sessionId});
}
