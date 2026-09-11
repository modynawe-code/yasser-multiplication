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

test('family shell owns only the Khaled home mount',async()=>{
  const familyShell=await read('src/modules/hub/learning-shell.js');
  assert.match(familyShell,/<section id="khaledHomeView" class="view"><\/section>/);
  assert.doesNotMatch(familyShell,/id="khaledSkillList"/);
});

test('Khaled subject gateway separates math, science and Quran',async()=>{
  const shell=await read('src/modules/khaled/ui/khaled-home-shell.js');
  assert.match(shell,/home\.dataset\.presentation==='khaled-home-v4'/);
  for(const id of ['khaledMathOpen','khaledScienceOpen','khaledQuranOpen','khaledHomeToHub','khaledMathView','khaledMathToSubjects','khaledHomeCharacter','khaledAttempts','khaledErrors','khaledSkillList'])assert.match(shell,new RegExp(`id="${id}"`));
  assert.match(shell,/createKhaledScienceController/);
  assert.match(shell,/createKhaledQuranController/);
  assert.match(shell,/\.\.\/science\/khaled-science\.js/);
});

test('subject gateway and math remain tablet responsive',async()=>{
  const gateway=await read('src/modules/khaled/ui/khaled-subject-gateway.css');
  const math=await read('src/modules/khaled/ui/khaled-home.css');
  const controller=await read('src/modules/khaled/ui/khaled-controller.js');
  assert.match(gateway,/@media \(orientation:landscape\) and \(min-width:760px\) and \(max-height:720px\)/);
  assert.match(gateway,/@media\(max-width:700px\)/);
  assert.match(math,/\.khaled-skill strong\{font-size:17px/);
  assert.match(controller,/KHALED_SKILLS\.map/);
});

test('runtime service worker caches successful science resources for later offline use',async()=>{
  const worker=await read('service-worker.js');
  assert.match(worker,/src\/modules\/khaled\/ui\/khaled-home-shell\.js/);
  assert.match(worker,/await cache\.put\(event\.request,response\.clone\(\)\)/);
  assert.match(worker,/const cached=await cache\.match\(event\.request\)\|\|await caches\.match\(event\.request\)/);
});
