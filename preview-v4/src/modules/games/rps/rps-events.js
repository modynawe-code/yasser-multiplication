import { createGameEvent } from '../core/game-event-contract.js';
import { gameEventBus } from '../core/game-event-bus.js';

function defaultSessionId(sequence){return `rps-${Date.now()}-${sequence}`;}

export function createRpsEventBridge({onEvent=gameEventBus.publish,sessionIdFactory=defaultSessionId}={}){
  let sessionId=null,sequence=0,finished=false;

  function emit(type,learnerId,payload={}){
    if(!sessionId||!learnerId)return null;
    const event=createGameEvent({type,gameId:'rock-paper-scissors',learnerId,sessionId,payload});
    if(typeof onEvent==='function'){try{onEvent(event);}catch{}}
    return event;
  }

  function begin(players=[]){
    sequence+=1;sessionId=String(sessionIdFactory(sequence)||`rps-session-${sequence}`);finished=false;
    return Object.freeze((players||[]).map(learnerId=>emit('game.started',learnerId,{players:Object.freeze([...players])})).filter(Boolean));
  }

  function choice(learnerId,{choice=null,round=null}={}){
    return emit('game.attempted',learnerId,{choice,round});
  }

  function complete({players=[],winner=null,scores={},round=null}={}){
    if(finished||!sessionId)return Object.freeze([]);
    finished=true;
    const events=[];
    for(const learnerId of players){
      if(winner)events.push(emit(learnerId===winner?'game.won':'game.lost',learnerId,{winner,scores:{...scores},round}));
      events.push(emit('game.completed',learnerId,{winner,scores:{...scores},round}));
    }
    return Object.freeze(events.filter(Boolean));
  }

  function reset(){sessionId=null;finished=false;}
  return Object.freeze({begin,choice,complete,reset,getSessionId:()=>sessionId});
}
