import { isLearnerContext } from './player-context.js';

export function createLearningAdapter({providers={}}={}){
  const providerMap=new Map(Object.entries(providers));

  function providerFor(player){
    if(!isLearnerContext(player))throw new TypeError('valid player context is required');
    const provider=providerMap.get(player.learnerId);
    if(!provider)throw new Error(`learning provider is not configured for ${player.learnerId}`);
    return provider;
  }

  async function nextChallenge(player,request={}){
    const provider=providerFor(player);
    if(typeof provider.nextChallenge!=='function')throw new Error('learning provider does not implement nextChallenge');
    return provider.nextChallenge({player,request:{...request}});
  }

  async function recordChallenge(player,result={}){
    const provider=providerFor(player);
    if(typeof provider.recordChallenge!=='function')return null;
    return provider.recordChallenge({player,result:{...result}});
  }

  return Object.freeze({nextChallenge,recordChallenge});
}
