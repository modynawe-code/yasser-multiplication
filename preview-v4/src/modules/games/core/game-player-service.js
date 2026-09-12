import { listGameParticipants } from './game-participant-registry.js';
import { createGameEligibilityService } from './game-eligibility-service.js';

const LEARNING_GATED_MODES=new Set(['required','adaptive']);

export function createGamePlayerService({learningAdapter=null,capabilityProvider=null}={}){
  const eligibility=createGameEligibilityService();
  const participants=listGameParticipants();

  for(const participant of participants){
    const provided=typeof capabilityProvider==='function'?capabilityProvider(participant.learnerId):[];
    eligibility.registerLearner(participant.learnerId,{capabilities:Array.isArray(provided)?provided:[]});
  }

  function supportsLearning(game,learnerId){
    if(!LEARNING_GATED_MODES.has(game?.learningMode))return true;
    return typeof learningAdapter?.supports!=='function'||learningAdapter.supports(learnerId);
  }

  function isEligible(game,learnerId){
    if(!game||!learnerId)return false;
    return supportsLearning(game,learnerId)&&eligibility.evaluate(game,learnerId).eligible;
  }

  function listEligible(game){
    if(!game)return Object.freeze([]);
    return listGameParticipants({supportsLearning:learnerId=>isEligible(game,learnerId)});
  }

  return Object.freeze({isEligible,listEligible,getCapabilities:eligibility.getCapabilities});
}
