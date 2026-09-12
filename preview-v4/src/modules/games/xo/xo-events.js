import { createGameSessionEvents } from '../core/game-session-events.js';

function defaultSessionId(sequence){return `xo-${Date.now()}-${sequence}`;}

export function createXoEventBridge({onEvent,sessionIdFactory=defaultSessionId}={}){
  const session=createGameSessionEvents({gameId:'xo',onEvent,sessionIdFactory});

  function begin(players=[],options={}){return session.begin(players,options);}

  function attempt(learnerId,{isCorrect=false,attemptNumber=1,challengeKind=null}={}){
    const payload={isCorrect:Boolean(isCorrect),attemptNumber:Number(attemptNumber)||1,challengeKind:challengeKind||null};
    const events=[session.emit('game.attempted',learnerId,payload)];
    if(payload.attemptNumber>1)events.push(session.emit('game.retry',learnerId,payload));
    return Object.freeze(events.filter(Boolean));
  }

  function turn(learnerId,{cell=null,online=false}={}){
    return session.emit('game.turn.completed',learnerId,{cell,online:Boolean(online)});
  }

  function complete({players=[],winner=null,status=null,learnerIds=null}={}){
    return session.complete({
      players,
      winner,
      learnerIds,
      payload:{status},
      winnerGoal:winner?{goal:'win'}:null
    });
  }

  return Object.freeze({begin,attempt,turn,complete,reset:session.reset,getSessionId:session.getSessionId});
}
