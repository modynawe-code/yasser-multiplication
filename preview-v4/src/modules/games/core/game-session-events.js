import { createGameEvent } from './game-event-contract.js';
import { gameEventBus } from './game-event-bus.js';
import { normalizeGameSessionParticipants } from './game-session-participant.js';
import { createGamePermissionService } from './game-permission-service.js';

function defaultSessionId(gameId,sequence){return `${gameId}-${Date.now()}-${sequence}`;}
function frozenPlayers(players){return Object.freeze([...(Array.isArray(players)?players:[])]);}
function participantPayload(participants){return Object.freeze(participants.map(item=>Object.freeze({participantId:item.participantId,playerId:item.playerId,learnerId:item.learnerId,actorRole:item.actorRole,participationRole:item.participationRole,authorityRole:item.authorityRole})));}

export function createGameSessionEvents({gameId,onEvent=gameEventBus.publish,sessionIdFactory=null,permissionService=createGamePermissionService()}={}){
  const id=String(gameId||'').trim();
  if(!id)throw new TypeError('gameId is required');
  if(!permissionService?.can)throw new TypeError('permission service is required');
  const makeSessionId=typeof sessionIdFactory==='function'?sessionIdFactory:sequence=>defaultSessionId(id,sequence);
  let sessionId=null,sequence=0,finished=false,participants=Object.freeze([]);

  function emit(type,learnerId,payload={}){
    if(!sessionId||!learnerId)return null;
    const event=createGameEvent({type,gameId:id,learnerId,sessionId,payload});
    if(typeof onEvent==='function'){try{onEvent(event);}catch{}}
    return event;
  }

  function rewardLearners(roster){return roster.filter(item=>permissionService.can(item,'progress.receive')).map(item=>item.learnerId).filter(Boolean);}
  function recipients(roster,learnerIds){return Array.isArray(learnerIds)?learnerIds:rewardLearners(roster);}
  function rosterFrom(players,provided){return provided?normalizeGameSessionParticipants(provided):normalizeGameSessionParticipants(players);}

  function begin(players=[],{sessionId:providedSessionId=null,participants:providedParticipants=null,learnerIds=null,payload={}}={}){
    sequence+=1;
    sessionId=String(providedSessionId||makeSessionId(sequence)||`${id}-session-${sequence}`);
    finished=false;
    const legacyPlayers=frozenPlayers(players);
    participants=rosterFrom(legacyPlayers,providedParticipants);
    const participantSnapshot=participantPayload(participants);
    return Object.freeze(recipients(participants,learnerIds).map(learnerId=>emit('game.started',learnerId,{players:legacyPlayers,participants:participantSnapshot,...payload})).filter(Boolean));
  }

  function complete({players=[],participants:providedParticipants=null,winner=null,learnerIds=null,payload={},winnerGoal=null}={}){
    if(finished||!sessionId)return Object.freeze([]);
    finished=true;
    const roster=providedParticipants?normalizeGameSessionParticipants(providedParticipants):(participants.length?participants:normalizeGameSessionParticipants(players));
    const participantSnapshot=participantPayload(roster);
    const completionPayload={participants:participantSnapshot,...payload,winner};
    const events=[];
    for(const learnerId of recipients(roster,learnerIds)){
      if(winner){
        events.push(emit(learnerId===winner?'game.won':'game.lost',learnerId,completionPayload));
        if(learnerId===winner&&winnerGoal)events.push(emit('game.goal.reached',learnerId,{...completionPayload,...winnerGoal}));
      }
      events.push(emit('game.completed',learnerId,completionPayload));
    }
    return Object.freeze(events.filter(Boolean));
  }

  function getParticipants(){return participants;}
  function can(participantId,permission,context={}){
    const participant=participants.find(item=>item.participantId===participantId||item.playerId===participantId||item.learnerId===participantId);
    return permissionService.can(participant,permission,context);
  }
  function reset(){sessionId=null;finished=false;participants=Object.freeze([]);}
  return Object.freeze({emit,begin,complete,reset,can,getParticipants,getSessionId:()=>sessionId,isFinished:()=>finished});
}
