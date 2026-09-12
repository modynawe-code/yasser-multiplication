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
  for(const token of ['createGamesController','createRewardCabinetController','createRewardCapabilityRegistry','createAppController','createKhaledController','createMashaalController','createLearnerRuntimeRegistry'])assert.match(main,new RegExp(token));
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
  assert.match(games,/hub-action-games/);
  assert.match(games,/<strong>الألعاب<\/strong>/);
  assert.match(games,/فتح منطقة الألعاب العائلية/);
  assert.doesNotMatch(games,/🎮/);
  assert.match(games,/id="gamesHomeView"/);
});

test('learner chooser stays registry-driven while using the approved adaptive tablet composition',async()=>{
  const registry=await read('src/modules/hub/learner-hub-registry.js');
  const css=await read('src/modules/hub/open-family-learner-grid.css');
  assert.match(registry,/listLearnerProfiles\(\)/);
  assert.match(registry,/grid\.appendChild\(card\)/);
  assert.match(registry,/profile\.presentation\?\.homeVariant/);
  assert.doesNotMatch(registry,/profile\.id==='mashaal'/);
  assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css,/@media \(orientation:portrait\) and \(max-width:900px\)[\s\S]*grid-template-columns:1fr/);
  assert.match(css,/@media\(max-width:520px\)[\s\S]*grid-template-columns:44% 1fr/);
  assert.doesNotMatch(css,/\.learner-grid\{[^}]*grid-template-columns:1fr 1fr/);
});

test('XO lobby presents one play mode at a time and uses Mashaal registered artwork',async()=>{
  const games=await read('src/modules/games/ui/games-shell.js');
  const participants=await read('src/modules/games/core/game-participant-registry.js');
  const css=await read('src/modules/games/ui/games-open-family.css');
  assert.match(games,/data-xo-lobby-mode-button="local"/);
  assert.match(games,/data-xo-lobby-mode-button="online"/);
  assert.match(games,/data-xo-lobby-panel="online"[^>]*hidden/);
  assert.match(games,/bindXoLobbyModeSwitch\(\)/);
  assert.match(participants,/profile\.presentation\?\.avatar/);
  assert.match(css,/\.xo-lobby-player\.mashaal/);
  assert.match(css,/\.xo-board\.locked\{opacity:1;filter:none\}/);
  assert.match(css,/\.xo-board\.locked \.xo-cell\{background:#fff\}/);
  assert.match(css,/\.xo-cell:disabled\{opacity:1\}/);
  assert.match(css,/\.xo-layout\{margin-top:6px;align-items:start\}/);
});

test('offline shell contains both the restored games platform and Mashaal KG3',async()=>{
  const worker=await read('service-worker.js');
  for(const path of ['modules/games/games-controller.js','modules/games/xo/xo-engine.js','modules/games/rps/rps-controller.js','shared/rewards/reward-engine.js','shared/rewards/reward-capability-registry.js','modules/mashaal/ui/mashaal-controller.js','modules/mashaal/curriculum/kg3-curriculum.js','modules/hub/open-family-learner-grid.css'])assert.match(worker,new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('durable local backup uses open family namespaces while preserving legacy Yasser and Khaled migration keys',async()=>{
  const backup=await read('src/shared/backup/local-backup-service.js');
  assert.match(backup,/TRACKED_PREFIXES=Object\.freeze\(\['family_learning:','family-learning-rewards-v1:','family-learning-game-reward-progress-v1:'\]\)/);
  assert.match(backup,/LOCAL_BACKUP_DIRECTORY='FamilyLearning'/);
  assert.match(backup,/LEGACY_LOCAL_BACKUP_DIRECTORY='YasserKhaledLearning'/);
  assert.match(backup,/yasser_mul_v4_preview/);
  assert.match(backup,/khaled_grade1_math_v1/);
  assert.doesNotMatch(backup,/family_learning:mashaal/);
});

test('parent reporting keeps Mashaal developmental instead of forcing school percentages',async()=>{
  const parent=await read('src/modules/parent/family-parent-renderers.js');
  assert.match(parent,/familyMashaalReport/);
  assert.match(parent,/التقييم نمائي/);
  assert.match(parent,/بدون نسب مئوية/);
});
