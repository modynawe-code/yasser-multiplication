import { getLearnerProfile } from '../../../shared/learners/learner-registry.js';

const CAPABILITY_PATTERN=/^[a-z0-9]+(?::[a-z0-9-]+|-[a-z0-9]+)*$/;

function normalizeCapabilities(values){
  if(!Array.isArray(values))throw new TypeError('capabilities must be an array');
  const normalized=[...new Set(values.map(value=>String(value||'').trim().toLowerCase()).filter(Boolean))];
  for(const capability of normalized)if(!CAPABILITY_PATTERN.test(capability))throw new TypeError(`invalid game capability: ${capability}`);
  return Object.freeze(normalized);
}

function eligibilityFor(game){
  const source=game?.metadata?.eligibility||{};
  return Object.freeze({
    allOf:normalizeCapabilities(source.allOf||[]),
    anyOf:normalizeCapabilities(source.anyOf||[]),
    noneOf:normalizeCapabilities(source.noneOf||[])
  });
}

export function createGameEligibilityService(){
  const learnerCapabilities=new Map();

  function registerLearner(learnerId,{capabilities=[]}={}){
    const profile=getLearnerProfile(learnerId);
    if(!profile)throw new TypeError('registered learner is required');
    const normalized=normalizeCapabilities([
      `stage:${String(profile.stage||'').trim().toLowerCase()}`,
      ...capabilities
    ]);
    learnerCapabilities.set(profile.id,normalized);
    return normalized;
  }

  function getCapabilities(learnerId){
    return learnerCapabilities.get(String(learnerId||'').trim().toLowerCase())||Object.freeze([]);
  }

  function evaluate(game,learnerId){
    const capabilities=getCapabilities(learnerId);
    const available=new Set(capabilities);
    const rules=eligibilityFor(game);
    const missingAllOf=rules.allOf.filter(item=>!available.has(item));
    const anyOfMatched=!rules.anyOf.length||rules.anyOf.some(item=>available.has(item));
    const blockedBy=rules.noneOf.filter(item=>available.has(item));
    return Object.freeze({
      eligible:missingAllOf.length===0&&anyOfMatched&&blockedBy.length===0,
      capabilities,
      missingAllOf:Object.freeze(missingAllOf),
      missingAnyOf:anyOfMatched?Object.freeze([]):rules.anyOf,
      blockedBy:Object.freeze(blockedBy)
    });
  }

  function listEligible(games,learnerId){
    return Object.freeze((games||[]).filter(game=>evaluate(game,learnerId).eligible));
  }

  return Object.freeze({registerLearner,getCapabilities,evaluate,listEligible});
}
