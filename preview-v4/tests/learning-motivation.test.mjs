import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildLearningMotivationMarkup } from '../src/shared/ui/learning-motivation.js';
import { createRewardingRepository } from '../src/shared/rewards/learning-reward-service.js';
import { createRewardCapabilityRegistry } from '../src/shared/rewards/reward-capability-registry.js';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('learner motivation summarizes daily, weekly and earned rewards without emoji placeholders',()=>{
  const markup=buildLearningMotivationMarkup({
    challenges:{daily:[{current:12,target:20,pct:60}],weekly:[{complete:true},{complete:false},{complete:true}]},
    trends:{streakDays:4},
    summary:{total:3,unlocks:[{rewardId:'accuracy-medal'}]}
  });
  assert.match(markup,/تحدي اليوم/);assert.match(markup,/12 \/ 20/);
  assert.match(markup,/تحدي الأسبوع/);assert.match(markup,/2 \/ 3/);
  assert.match(markup,/جوائزي/);assert.match(markup,/وسام الدقة/);assert.match(markup,/استمرار 4 يوم/);
  assert.doesNotMatch(markup,/🔥|🏆|🥇|👑|🎁/);
});

test('presentation callback runs only after successful academic persistence and cannot break the save',()=>{
  let saves=0,evaluations=0,presentations=0;
  const repository={load:()=>({attemptLog:[]}),save:()=>{saves++;return true;}};
  const rewardService={evaluate:()=>{evaluations++;return{summary:{total:0,unlocks:[]},challenges:{daily:[],weekly:[]},trends:{streakDays:0}};}};
  const wrapped=createRewardingRepository({learnerId:'yasser',repository,rewardService,onEvaluated:()=>{presentations++;throw new Error('presentation failure');}});
  assert.equal(wrapped.save({attemptLog:[]}),true);
  assert.equal(saves,1);assert.equal(evaluations,1);assert.equal(presentations,1);
});

test('reward capability registry separates academic rewards from developmental learners',()=>{
  const registry=createRewardCapabilityRegistry();
  registry.register('yasser',{mode:'academic'});
  registry.register('khaled',{mode:'academic'});
  registry.register('mashaal',{mode:'developmental'});
  assert.deepEqual(registry.list({mode:'academic'}).map(item=>item.learnerId),['yasser','khaled']);
  assert.equal(registry.supports('mashaal','academic'),false);
  assert.equal(registry.supports('mashaal','developmental'),true);
});

test('composition root owns reward anchors and keeps shared presenter learner-neutral',async()=>{
  const main=await read('src/main.js'),presenter=await read('src/shared/ui/learning-motivation.js'),cabinet=await read('src/shared/ui/reward-cabinet.js'),worker=await read('service-worker.js');
  assert.match(main,/createRewardCapabilityRegistry/);
  assert.match(main,/rewardCapabilities\.register\('yasser',\{mode:'academic'/);
  assert.match(main,/rewardCapabilities\.register\('khaled',\{mode:'academic'/);
  assert.match(main,/rewardCapabilities\.register\('mashaal',\{mode:'developmental'/);
  assert.match(main,/#homeView \.focus-strip/);assert.match(main,/#khaledHomeView \.khaled-stats/);
  assert.match(presenter,/anchorSelector/);
  assert.doesNotMatch(presenter,/#homeView \.focus-strip|#khaledHomeView \.khaled-stats/);
  assert.match(cabinet,/capabilityRegistry/);assert.match(cabinet,/academicCapabilities/);
  assert.doesNotMatch(cabinet,/const LEARNERS/);
  assert.match(worker,/src\/shared\/rewards\/reward-capability-registry\.js/);
  assert.match(worker,/src\/shared\/ui\/learning-motivation\.js/);assert.match(worker,/src\/shared\/ui\/learning-motivation\.css/);assert.match(worker,/shell-\d+/);
});
