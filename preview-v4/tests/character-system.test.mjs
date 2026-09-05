import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('student views expose stable visual slots without coupling assets into HTML',async()=>{
  const html=await read('index.html');
  const css=await read('src/ui/styles/character-system.css');
  assert.match(html,/src\/ui\/styles\/character-system\.css/);
  for(const id of ['homeYasser','homeAssistant','learnYasser','learnAssistant','sessionYasser','sessionAssistant','resultYasser','resultAssistant','resultCelebration']){
    assert.match(html,new RegExp(`id="${id}"`));
  }
  for(const container of ['introCharacters','homeCharacters','learnVisuals','sessionVisuals','resultCharacters']){
    assert.match(html,new RegExp(`id="${container}"`));
  }
  assert.doesNotMatch(html,/assets\/visual\/.*\.b64\.txt/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/data-scene-motion="celebrate"/);
  assert.match(css,/exam-mode/);
});

test('learning flow delegates feedback visuals and sounds to focused controllers',async()=>{
  const controller=await read('src/ui/app-controller.js');
  assert.match(controller,/createSceneController/);
  assert.match(controller,/createFeedbackAudio/);
  assert.match(controller,/visuals\.render\('correct'\)/);
  assert.match(controller,/visuals\.render\('wrong'\)/);
  assert.match(controller,/audio\.correct\(\)/);
  assert.match(controller,/audio\.wrong\(\)/);
  assert.match(controller,/audio\.achievement\(\)/);
  assert.match(controller,/mode==='exam'\?'exam':'question'/);
  assert.match(controller,/visuals\.result\(pct\)/);
  assert.match(controller,/visuals\.render\('parent'\)/);
});

test('offline shell caches semantic visual system and feedback audio module',async()=>{
  const worker=await read('service-worker.js');
  assert.match(worker,/character-system\.css/);
  assert.match(worker,/scene-controller\.js/);
  assert.match(worker,/character-assets\.js/);
  assert.match(worker,/feedback-audio\.js/);
  for(const asset of ['yasser\/welcome','yasser\/thinking','yasser\/encourage','yasser\/celebrate','yasser\/mastered','assistant\/idle','assistant\/thinking','assistant\/celebrate']){
    assert.match(worker,new RegExp(`assets/visual/${asset}\\.b64\\.txt`));
  }
});
