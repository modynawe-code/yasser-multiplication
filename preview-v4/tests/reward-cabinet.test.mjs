import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildRewardCabinetMarkup } from '../src/shared/ui/reward-cabinet.js';

const status={
  summary:{total:2,counts:{'mastery-cup':1,'streak-flame':1},unlocks:[{rewardId:'mastery-cup',at:'2026-09-07T10:00:00Z'},{rewardId:'streak-flame',at:'2026-09-07T11:00:00Z'}]},
  trends:{streakDays:3},
  challenges:{weekly:[{complete:true},{complete:false},{complete:false}]}
};

test('reward cabinet renders the full eight-item catalog with learner-specific PNG contracts',()=>{
  const markup=buildRewardCabinetMarkup({learnerId:'yasser',status});
  assert.equal((markup.match(/data-reward-id=/g)||[]).length,8);
  assert.match(markup,/assets\/rewards\/yasser\/mastery-cup\.png/);
  assert.match(markup,/data-reward-id="mastery-cup" data-unlocked="true"/);
  assert.match(markup,/data-reward-id="weekly-cup" data-unlocked="false"/);
  assert.doesNotMatch(markup,/🏆|🎯|🔥|⭐/u);
});

test('Khaled cabinet uses a separate graphics namespace from Yasser',()=>{
  const markup=buildRewardCabinetMarkup({learnerId:'khaled',status});
  assert.match(markup,/assets\/rewards\/khaled\/mastery-cup\.png/);
  assert.doesNotMatch(markup,/assets\/rewards\/yasser\//);
});

test('composition root owns cabinet navigation while learner controllers stay untouched',async()=>{
  const main=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
  const yasser=await readFile(new URL('../src/ui/app-controller.js',import.meta.url),'utf8');
  const khaled=await readFile(new URL('../src/modules/khaled/ui/khaled-controller.js',import.meta.url),'utf8');
  assert.match(main,/createRewardCabinetController/);
  assert.match(main,/cabinet\.start\(\)/);
  assert.match(main,/cabinet\?\.leave\(\)/);
  assert.doesNotMatch(yasser,/rewardCabinet|reward-cabinet/);
  assert.doesNotMatch(khaled,/rewardCabinet|reward-cabinet/);
});

test('reward cabinet module and styling are part of the offline shell',async()=>{
  const worker=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
  assert.match(worker,/src\/shared\/ui\/reward-cabinet\.js/);
  assert.match(worker,/src\/shared\/ui\/reward-cabinet\.css/);
  assert.match(worker,/shell-\d+/);
});
