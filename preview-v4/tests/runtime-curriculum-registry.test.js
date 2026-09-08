import test from 'node:test';
import assert from 'node:assert/strict';
import { createCurriculumRegistry } from '../src/shared/curricula/runtime-registry.js';

test('runtime curriculum registry can accept a future curriculum independently',()=>{
  const registry=createCurriculumRegistry([]);
  registry.register({id:'future-curriculum',title:'منهج جديد',stage:'kg2'});
  assert.equal(registry.get('future-curriculum')?.stage,'kg2');
});
