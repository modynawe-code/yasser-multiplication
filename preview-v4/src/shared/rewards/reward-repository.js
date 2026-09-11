import { createRewardLedger,normalizeRewardLedger } from './reward-engine.js';

const PREFIX='family-learning-rewards-v1';

export function createRewardRepository({storage=globalThis.localStorage}={}){
  function key(learnerId){return `${PREFIX}:${String(learnerId||'')}`;}
  function load(learnerId){
    const id=String(learnerId||'');
    try{return normalizeRewardLedger(JSON.parse(storage?.getItem(key(id))||'null'),id);}catch{return createRewardLedger(id);}
  }
  function save(ledger){
    const normalized=normalizeRewardLedger(ledger,ledger?.learnerId);
    storage?.setItem?.(key(normalized.learnerId),JSON.stringify(normalized));
    return normalized;
  }
  return Object.freeze({load,save,key});
}
