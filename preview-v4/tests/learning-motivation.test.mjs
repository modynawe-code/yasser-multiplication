import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildLearningMotivationMarkup } from '../src/shared/ui/learning-motivation.js';
import { createRewardingRepository } from '../src/shared/rewards/learning-reward-service.js';

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

test('composition root displays motivation for both learners and offline shell owns its assets',async()=>{
  const main=await read('src/main.js'),presenter=await read('src/shared/ui/learning-motivation.js'),worker=await read('service-worker.js');
  assert.match(main,/renderLearningMotivation/);assert.match(main,/onEvaluated/);
  assert.match(main,/presentLearningStatus\('yasser'/);assert.match(main,/presentLearningStatus\('khaled'/);
  assert.match(presenter,/#homeView \.focus-strip/);assert.match(presenter,/#khaledHomeView \.khaled-stats/);
  assert.match(worker,/src\/shared\/ui\/learning-motivation\.js/);assert.match(worker,/src\/shared\/ui\/learning-motivation\.css/);assert.match(worker,/shell-\d+/);
});
