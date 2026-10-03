import { summarizeLearningAttempts,summarizeLearningWindows,learningLevel } from '../progress/learning-metrics.js';
import { summarizeLearningTrends } from '../progress/learning-trends.js';
import { deriveChallengeProgress } from '../challenges/challenge-engine.js';
import { createRewardRepository } from './reward-repository.js';
import { deriveLearningRewardCandidates,applyRewardCandidates,rewardSummary } from './reward-engine.js';

function skillLevels(attemptLog,learnerId){
  const ids=[...new Set((Array.isArray(attemptLog)?attemptLog:[]).filter(event=>event?.learnerId===learnerId&&event?.skillId).map(event=>event.skillId))];
  return ids.map(skillId=>({skillId,level:learningLevel(summarizeLearningAttempts(attemptLog,{learnerId,skillId})).id}));
}

export function createLearningRewardService({repository=createRewardRepository()}={}){
  function evaluate(learnerId,state,{now=new Date(),streakDays=null,weeklyChallengeComplete=null,improvementPct=null}={}){
    const id=String(learnerId||''),attemptLog=Array.isArray(state?.attemptLog)?state.attemptLog:[];
    const windows=summarizeLearningWindows(attemptLog,{learnerId:id,now}),levels=skillLevels(attemptLog,id),trends=summarizeLearningTrends(attemptLog,{learnerId:id,now}),challenges=deriveChallengeProgress(attemptLog,{learnerId:id,now}),ledger=repository.load(id);
    const effectiveStreak=streakDays===null?trends.streakDays:Number(streakDays),effectiveImprovement=improvementPct===null?trends.improvementPct:Number(improvementPct),effectiveWeeklyChallenge=weeklyChallengeComplete===null?challenges.weeklyComplete:Boolean(weeklyChallengeComplete);
    const candidates=deriveLearningRewardCandidates({learnerId:id,windows,skillLevels:levels,streakDays:effectiveStreak,weeklyChallengeComplete:effectiveWeeklyChallenge,improvementPct:effectiveImprovement,totalQuestions:windows.all.questions,now});
    const added=applyRewardCandidates(ledger,candidates,{at:now});
    if(added)repository.save(ledger);
    return Object.freeze({added,windows,trends,challenges,skillLevels:Object.freeze(levels),summary:rewardSummary(ledger)});
  }
  function getSummary(learnerId){return rewardSummary(repository.load(String(learnerId||'')));}
  return Object.freeze({evaluate,getSummary});
}

export function createRewardingRepository({learnerId,repository,rewardService,onEvaluated=null}={}){
  if(!repository?.load||!repository?.save)throw new Error('Learning repository is required');
  if(!rewardService?.evaluate)throw new Error('Reward service is required');
  const id=String(learnerId||'');
  return Object.freeze({...repository,save(state){
    const saved=repository.save(state);
    if(saved){
      const result=rewardService.evaluate(id,state);
      if(typeof onEvaluated==='function'){try{onEvaluated(id,state,result);}catch{}}
    }
    return saved;
  }});
}
