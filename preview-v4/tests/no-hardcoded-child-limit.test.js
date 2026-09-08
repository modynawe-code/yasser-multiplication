import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createLearnerProfile } from '../src/shared/learners/learner-profile.js';

test('profile factory accepts another valid child without changing registry implementation',()=>{
  const fourth=createLearnerProfile({id:'child-four',displayName:'طفل رابع'});
  assert.equal(fourth.id,'child-four');
});

test('family hub and parent report layouts do not encode a desktop child count',async()=>{
  const hubCss=await readFile(new URL('../src/modules/hub/learning-hub.css',import.meta.url),'utf8');
  const parentCss=await readFile(new URL('../src/modules/parent/family-parent.css',import.meta.url),'utf8');
  assert.match(hubCss,/learner-grid\{[^}]*repeat\(auto-fit,minmax\(/);
  assert.match(parentCss,/family-learner-summary-grid\{[^}]*repeat\(auto-fit,minmax\(/);
  assert.match(parentCss,/family-parent-nav\{[^}]*repeat\(auto-fit,minmax\(/s);
});
