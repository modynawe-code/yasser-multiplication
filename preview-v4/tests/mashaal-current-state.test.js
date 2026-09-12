import test from 'node:test';
import assert from 'node:assert/strict';
import { getLearnerProfile } from '../src/shared/learners/learner-registry.js';

test('Mashaal foundation is registered before UI/backend migration',()=>assert.equal(getLearnerProfile('mashaal')?.module,'mashaal'));
