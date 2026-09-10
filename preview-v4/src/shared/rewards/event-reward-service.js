import { applyRewardCandidates,rewardSummary } from './reward-engine.js';

export function createEventRewardService({repository,ruleRegistry,catalogRegistry}={}){
  if(!repository?.load||!repository?.save)throw new TypeError('reward repository is required');
  if(!ruleRegistry?.matching)throw new TypeError('reward rule registry is required');
  if(!catalogRegistry?.getReward)throw new TypeError('reward catalog registry is required');

  function handle(event,{context={}}={}){
    const learnerId=String(event?.learnerId||'').trim().toLowerCase();
    if(!learnerId||!event?.type)return Object.freeze({added:0,matched:0,summary:rewardSummary(repository.load(learnerId))});
    const ledger=repository.load(learnerId);
    const rules=ruleRegistry.matching(learnerId,event,context);
    const candidates=[];
    for(const rule of rules){
      const reward=catalogRegistry.getReward(rule.rewardId);
      if(!reward)continue;
      const awardKey=rule.awardKey?rule.awardKey(event,context):`${rule.id}:${event.gameId||'event'}:${event.sessionId||event.at}`;
      if(!awardKey)continue;
      candidates.push(Object.freeze({
        learnerId,
        rewardId:reward.id,
        awardKey:String(awardKey),
        source:'game',
        meta:Object.freeze({ruleId:rule.id,eventType:event.type,gameId:event.gameId||null,...context?.rewardMeta})
      }));
    }
    const added=applyRewardCandidates(ledger,candidates,{at:event.at||new Date(),isKnownReward:id=>Boolean(catalogRegistry.getReward(id))});
    if(added)repository.save(ledger);
    return Object.freeze({added,matched:rules.length,summary:rewardSummary(ledger)});
  }

  function getSummary(learnerId){return rewardSummary(repository.load(String(learnerId||'')));}
  return Object.freeze({handle,getSummary});
}
