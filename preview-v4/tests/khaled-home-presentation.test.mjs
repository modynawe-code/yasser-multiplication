import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Khaled home is composed after the family learning shell creates its mount point',async()=>{
  const main=await read('src/main.js');
  assert.match(main,/import \{ ensureKhaledHomeShell \} from '\.\/modules\/khaled\/ui\/khaled-home-shell\.js'/);
  assert.ok(main.indexOf('ensureLearningShell();')<main.indexOf('ensureKhaledHomeShell();'));
  assert.ok(main.indexOf('ensureKhaledHomeShell();')<main.indexOf('ensureMashaalShell();'));
});

test('family learning shell keeps only a Khaled home mount instead of owning learner presentation',async()=>{
  const familyShell=await read('src/modules/hub/learning-shell.js');
  assert.match(familyShell,/<section id="khaledHomeView" class="view"><\/section>/);
  assert.doesNotMatch(familyShell,/id="khaledHomeCharacter"/);
  assert.doesNotMatch(familyShell,/id="khaledSkillList"/);
  assert.doesNotMatch(familyShell,/id="khaledAttempts"/);
});

test('dedicated Khaled home preserves controller and navigation contracts',async()=>{
  const shell=await read('src/modules/khaled/ui/khaled-home-shell.js');
  assert.match(shell,/home\.dataset\.presentation==='khaled-home-v2'/);
  for(const id of ['khaledHomeCharacter','khaledHomeCharacterFallback','khaledHomeToHub','khaledAttempts','khaledErrors','khaledSkillList'])assert.match(shell,new RegExp(`id="${id}"`));
  assert.match(shell,/class="khaled-head khaled-home-hero"/);
  assert.doesNotMatch(shell,/KHALED_SKILLS|getKhaledSkill|data-khaled-skill/);
});

test('Khaled presentation stays first-grade responsive while curriculum rendering remains in controller',async()=>{
  const css=await read('src/modules/khaled/ui/khaled-home.css');
  const controller=await read('src/modules/khaled/ui/khaled-controller.js');
  assert.match(css,/@media \(orientation:landscape\) and \(min-width:760px\) and \(max-height:720px\)/);
  assert.match(css,/@media\(max-width:700px\)/);
  assert.match(css,/@media\(max-width:420px\)/);
  assert.match(controller,/KHALED_SKILLS\.map/);
  assert.match(controller,/byId\('khaledSkillList'\)/);
  assert.match(controller,/byId\('khaledAttempts'\)/);
  assert.match(controller,/byId\('khaledErrors'\)/);
});

test('dedicated Khaled home presentation is part of the versioned offline application shell',async()=>{
  const worker=await read('service-worker.js');
  assert.match(worker,/src\/modules\/khaled\/ui\/khaled-home-shell\.js/);
  assert.match(worker,/src\/modules\/khaled\/ui\/khaled-home\.css/);
  assert.match(worker,/CACHE_VERSION=`\$\{CACHE_PREFIX\}shell-\d+`/);
});
