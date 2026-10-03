import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Khaled controller renders classification and equality as visual-first activities',async()=>{
  const controller=await read('src/modules/khaled/ui/khaled-controller.js');
  assert.match(controller,/question\.type==='classify-one-property'/);
  assert.match(controller,/question\.type==='classify-two-properties'/);
  assert.match(controller,/question\.type==='equality-groups'/);
  assert.match(controller,/classifyToken/);
  assert.match(controller,/visualAnswerButton/);
  assert.match(controller,/khaled-equality/);
});

test('classification visuals distinguish color and shape without image dependencies',async()=>{
  const css=await read('src/modules/khaled/ui/khaled-activity-types.css');
  for(const shape of ['circle','square','triangle'])assert.match(css,new RegExp(`shape-${shape}`));
  for(const color of ['orange','blue','green'])assert.match(css,new RegExp(`color-${color}`));
  assert.match(css,/khaled-classify-stage/);
  assert.match(css,/khaled-equality-group/);
  assert.match(css,/@media\(max-width:420px\)/);
});

test('activity visual module is imported and available offline',async()=>{
  const characterCss=await read('src/modules/khaled/ui/khaled-character-system.css');
  const worker=await read('service-worker.js');
  assert.match(characterCss,/khaled-activity-types\.css/);
  assert.match(worker,/khaled-activity-types\.css/);
});
