import { normalizeLearnerId } from '../../../shared/learners/learner-id.js';

export const GAME_ACTOR_ROLES=Object.freeze(['learner','guardian','system']);
export const GAME_PARTICIPATION_ROLES=Object.freeze(['player','spectator']);
export const GAME_AUTHORITY_ROLES=Object.freeze(['local','host','guest']);

const ACTOR_ROLES=new Set(GAME_ACTOR_ROLES);
const PARTICIPATION_ROLES=new Set(GAME_PARTICIPATION_ROLES);
const AUTHORITY_ROLES=new Set(GAME_AUTHORITY_ROLES);

function role(value,allowed,label){
  const normalized=String(value||'').trim().toLowerCase();
  if(!allowed.has(normalized))throw new TypeError(`invalid ${label}: ${value}`);
  return normalized;
}

export function createGameSessionParticipant({participantId=null,playerId=null,learnerId=null,actorRole='learner',participationRole='player',authorityRole='local',metadata={}}={}){
  const actor=role(actorRole,ACTOR_ROLES,'actor role');
  const participation=role(participationRole,PARTICIPATION_ROLES,'participation role');
  const authority=role(authorityRole,AUTHORITY_ROLES,'authority role');
  const learner=learnerId===null||learnerId===undefined||learnerId===''?null:normalizeLearnerId(learnerId);
  if(actor==='learner'&&!learner)throw new TypeError(`invalid learner: ${learnerId}`);
  if(metadata===null||Array.isArray(metadata)||typeof metadata!=='object')throw new TypeError('participant metadata must be an object');
  const id=String(participantId||playerId||learner||'').trim();
  if(!id)throw new TypeError('participantId is required');
  const player=String(playerId||id).trim();
  return Object.freeze({
    participantId:id,
    playerId:player,
    learnerId:learner,
    actorRole:actor,
    participationRole:participation,
    authorityRole:authority,
    rewardEligible:Boolean(learner&&actor==='learner'&&participation==='player'),
    metadata:Object.freeze({...metadata})
  });
}

export function normalizeGameSessionParticipant(value,defaults={}){
  if(typeof value==='string')return createGameSessionParticipant({participantId:value,playerId:value,learnerId:value,...defaults});
  if(!value||typeof value!=='object')throw new TypeError('session participant must be a learner id or object');
  return createGameSessionParticipant({...defaults,...value});
}

export function normalizeGameSessionParticipants(values=[],defaults={}){
  const result=[],seen=new Set();
  for(const value of Array.isArray(values)?values:[]){
    const participant=normalizeGameSessionParticipant(value,defaults);
    if(seen.has(participant.participantId))throw new Error(`duplicate session participant: ${participant.participantId}`);
    seen.add(participant.participantId);result.push(participant);
  }
  return Object.freeze(result);
}

export function isGameSessionParticipant(value){
  return Boolean(value&&typeof value.participantId==='string'&&ACTOR_ROLES.has(value.actorRole)&&PARTICIPATION_ROLES.has(value.participationRole)&&AUTHORITY_ROLES.has(value.authorityRole));
}
