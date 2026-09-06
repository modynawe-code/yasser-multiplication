const LEARNERS=Object.freeze(['yasser','khaled']);

export function createPlayerContext({playerId,learnerId,displayName,theme}={}){
  const id=String(playerId||'').trim();
  const learner=String(learnerId||'').trim();
  if(!id)throw new TypeError('playerId is required');
  if(!LEARNERS.includes(learner))throw new TypeError(`unsupported learner: ${learner}`);

  return Object.freeze({
    playerId:id,
    learnerId:learner,
    displayName:String(displayName||learner).trim(),
    theme:theme||learner,
  });
}

export function isLearnerContext(value){
  return Boolean(value&&typeof value.playerId==='string'&&LEARNERS.includes(value.learnerId));
}
