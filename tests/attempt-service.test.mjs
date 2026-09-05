import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/domain/state-model.js';
import { recordAttempt } from '../src/application/attempt-service.js';
test('attempt event updates aggregate counters and preserves historical wrong count',()=>{const state=createInitialState();const wrong=recordAttempt(state,{question:{table:3,multiplier:7},answer:20,responseMs:1200,createdAt:'2026-09-05T00:00:00Z'});const right=recordAttempt(state,{question:{table:3,multiplier:7},answer:21,responseMs:800,createdAt:'2026-09-05T00:01:00Z'});assert.equal(wrong.isCorrect,false);assert.equal(right.isCorrect,true);assert.equal(state.tables[3].facts[7].wrong,1);assert.equal(state.tables[3].facts[7].correct,1);assert.equal(state.totalAttempts,2);});
