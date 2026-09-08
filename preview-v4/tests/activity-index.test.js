import test from 'node:test';
import assert from 'node:assert/strict';
import * as activities from '../src/shared/activities/index.js';

test('shared activity API exposes reusable primitives',()=>{
  assert.equal(typeof activities.createActivityDefinition,'function');
  assert.equal(typeof activities.createActivityResult,'function');
});
