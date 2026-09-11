import { normalizeLearnerId } from '../../../shared/learners/learner-id.js';

export function createPlayerContext({playerId,learnerId,displayName,theme}={}){
  const id=String(playerId||'').trim();
  const learner=normalizeLearnerId(learnerId);
  if(!id)throw new TypeError('playerId is required');
  if(!learner)throw new TypeError(`invalid learner: ${learnerId}`);

  return Object.freeze({
    playerId:id,
    learnerId:learner,
    displayName:String(displayName||learner).trim(),
    theme:String(theme||learner).trim()||learner,
  });
}

export function isLearnerContext(value){
  return Boolean(value&&typeof value.playerId==='string'&&normalizeLearnerId(value.learnerId));
}
