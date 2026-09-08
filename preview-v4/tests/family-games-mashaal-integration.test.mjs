import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { listLearnerProfiles } from '../src/shared/learners/learner-registry.js';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('family registry exposes current learners without a numeric child cap',()=>{
  const profiles=listLearnerProfiles();
  assert.deepEqual(profiles.map(item=>item.id),['yasser','khaled','mashaal']);
  assert.equal(profiles.find(item=>item.id==='mashaal')?.curriculumIds.includes('saudi-kg3'),true);
});

test('composition root keeps games, rewards and all three learner runtimes together',async()=>{
  const main=await read('src/main.js');
  for(const token of ['createGamesController','createRewardCabinetController','createAppController','createKhaledController','createMashaalController','createLearnerRuntimeRegistry'])assert.match(main,new RegExp(token));
  for(const learner of ['yasser','khaled','mashaal'])assert.match(main,new RegExp(`learnerRuntimes\\.register\\('${learner}'`));
  assert.match(main,/createMashaalController\(\{repository:mashaalRepository,onExitToHub:\(\)=>hub\?\.show\(\)\}\)/);
});

test('family hub cannot boot without restoring the visible games entry',async()=>{
  const main=await read('src/main.js');
  const hub=await read('src/modules/hub/learning-shell.js');
  const games=await read('src/modules/games/ui/games-shell.js');
  assert.ok(main.indexOf('ensureLearningShell();')<main.indexOf('games.start();'));
  assert.match(hub,/class="hub-heading-actions"/);
  assert.match(games,/querySelector\('#hubView \.hub-heading-actions'\)/);
  assert.match(games,/button\.id='gamesOpenBtn'/);
  assert.match(games,/button\.textContent='🎮 الألعاب'/);
  assert.match(games,/id="gamesHomeView"/);
});

test('learner chooser is open-ended and does not assume exactly two columns',async()=>{
  const registry=await read('src/modules/hub/learner-hub-registry.js');
  const css=await read('src/modules/hub/open-family-learner-grid.css');
  assert.match(registry,/listLearnerProfiles\(\)/);
  assert.match(registry,/grid\.appendChild\(card\)/);
  assert.match(css,/repeat\(auto-fit,minmax\(280px,1fr\)\)/);
  assert.doesNotMatch(css,/grid-template-columns:1fr 1fr/);
});

test('offline shell contains both the restored games platform and Mashaal KG3',async()=>{
  const worker=await read('service-worker.js');
  for(const path of ['modules/games/games-controller.js','modules/games/xo/xo-engine.js','modules/games/rps/rps-controller.js','shared/rewards/reward-engine.js','modules/mashaal/ui/mashaal-controller.js','modules/mashaal/curriculum/kg3-curriculum.js','modules/hub/open-family-learner-grid.css'])assert.match(worker,new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('durable local backup protects Yasser, Khaled, Mashaal and reward records together',async()=>{
  const backup=await read('src/shared/backup/local-backup-service.js');
  for(const key of ['yasser_mul_v4_preview','khaled_grade1_math_v1','family_learning:mashaal','family-learning-rewards-v1:yasser','family-learning-rewards-v1:khaled'])assert.match(backup,new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('parent reporting keeps Mashaal developmental instead of forcing school percentages',async()=>{
  const parent=await read('src/modules/parent/family-parent-renderers.js');
  assert.match(parent,/familyMashaalReport/);
  assert.match(parent,/التقييم نمائي/);
  assert.match(parent,/بدون نسب مئوية/);
});
