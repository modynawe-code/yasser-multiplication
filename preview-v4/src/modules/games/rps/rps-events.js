import { createGameSessionEvents } from '../core/game-session-events.js';

function defaultSessionId(sequence){return `rps-${Date.now()}-${sequence}`;}

export function createRpsEventBridge({onEvent,sessionIdFactory=defaultSessionId}={}){
  const session=createGameSessionEvents({gameId:'rock-paper-scissors',onEvent,sessionIdFactory});

  function begin(players=[]){return session.begin(players);}

  function choice(learnerId,{choice=null,round=null}={}){
    return session.emit('game.attempted',learnerId,{choice,round});
  }

  function complete({players=[],winner=null,scores={},round=null}={}){
    return session.complete({players,winner,payload:{scores:{...scores},round}});
  }

  return Object.freeze({begin,choice,complete,reset:session.reset,getSessionId:session.getSessionId});
}
