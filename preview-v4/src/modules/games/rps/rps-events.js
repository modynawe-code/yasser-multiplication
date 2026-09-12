import { createGameSessionEvents } from '../core/game-session-events.js';

function defaultSessionId(sequence){return `rps-${Date.now()}-${sequence}`;}

export function createRpsEventBridge({onEvent,sessionIdFactory=defaultSessionId}={}){
  const session=createGameSessionEvents({gameId:'rock-paper-scissors',onEvent,sessionIdFactory});

  function begin(players=[],options={}){return session.begin(players,options);}

  function choice(learnerId,{choice=null,round=null}={}){
    return session.emit('game.attempted',learnerId,{choice,round});
  }

  function complete({players=[],winner=null,scores={},round=null,learnerIds=null,participants=null,payload={}}={}){
    return session.complete({players,winner,learnerIds,participants,payload:{scores:{...scores},round,...payload}});
  }

  return Object.freeze({begin,choice,complete,reset:session.reset,getSessionId:session.getSessionId});
}
