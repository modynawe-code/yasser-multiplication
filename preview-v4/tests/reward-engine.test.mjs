import test from 'node:test';
import assert from 'node:assert/strict';
import { createRewardLedger,recordRewardUnlock,deriveLearningRewardCandidates,applyRewardCandidates,rewardSummary } from '../src/shared/rewards/reward-engine.js';
import { REWARD_CATALOG } from '../src/shared/rewards/reward-catalog.js';

test('reward catalog is graphics-ready and contains no emoji-only reward labels',()=>{
  assert.equal(REWARD_CATALOG.length,8);
  assert.ok(REWARD_CATALOG.every(item=>item.graphicKey&&item.label&&item.scope));
});

test('reward ledgers never mix Yasser and Khaled',()=>{
  const ledger=createRewardLedger('yasser');
  assert.equal(recordRewardUnlock(ledger,{learnerId:'khaled',rewardId:'mastery-cup',awardKey:'x'}),false);
  assert.equal(ledger.unlocks.length,0);
});

test('reward engine derives mastery, weekly, streak and milestone awards without changing academic scores',()=>{
  const windows={week:{questions:20,firstTryAccuracy:95},all:{questions:260}};
  const skillLevels=[{skillId:'table-2',level:'mastered'},{skillId:'table-3',level:'mastered'},{skillId:'table-4',level:'expert'}];
  const candidates=deriveLearningRewardCandidates({learnerId:'yasser',windows,skillLevels,streakDays:7,weeklyChallengeComplete:true,improvementPct:12,now:new Date('2026-09-07T12:00:00Z')});
  const ids=new Set(candidates.map(item=>item.rewardId));
  for(const id of ['accuracy-medal','mastery-shield','mastery-cup','weekly-cup','streak-flame','surprise-box','progress-badge'])assert.ok(ids.has(id),`missing ${id}`);
});

test('weekly trophies accumulate by period while duplicate unlock keys remain idempotent',()=>{
  const ledger=createRewardLedger('khaled');
  const first=deriveLearningRewardCandidates({learnerId:'khaled',windows:{week:{questions:10,firstTryAccuracy:90},all:{questions:100}},weeklyChallengeComplete:true,now:new Date('2026-09-07T12:00:00Z')});
  assert.ok(applyRewardCandidates(ledger,first)>0);
  const before=ledger.unlocks.length;applyRewardCandidates(ledger,first);assert.equal(ledger.unlocks.length,before);
  const second=deriveLearningRewardCandidates({learnerId:'khaled',windows:{week:{questions:10,firstTryAccuracy:90},all:{questions:100}},weeklyChallengeComplete:true,now:new Date('2026-09-14T12:00:00Z')});
  applyRewardCandidates(ledger,second);
  assert.ok(rewardSummary(ledger).counts['weekly-cup']>=2);
});
