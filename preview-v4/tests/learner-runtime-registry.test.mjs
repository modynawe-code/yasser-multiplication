import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createLearnerRuntimeRegistry } from '../src/modules/hub/learner-runtime-registry.js';

test('learner runtime registry activates a registered child and leaves the others',()=>{
  const events=[];
  const registry=createLearnerRuntimeRegistry();
  registry.register('yasser',{enter:()=>events.push('enter:yasser'),leave:()=>events.push('leave:yasser')});
  registry.register('child-four',{enter:()=>events.push('enter:child-four'),leave:()=>events.push('leave:child-four')});
  assert.equal(registry.activate('child-four'),true);
  assert.deepEqual(events,['leave:yasser','enter:child-four']);
  assert.equal(registry.has('child-four'),true);
});

test('main navigation delegates learner selection to the runtime registry',async()=>{
  const main=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
  assert.match(main,/learnerRuntimes\.activate\(learnerId\)/);
  assert.doesNotMatch(main,/learnerId\s*===\s*['"](?:yasser|khaled|mashaal)['"]/);
});
