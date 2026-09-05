import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/domain/state-model.js';
import { createExamQuestions, getAllFacts } from '../src/domain/question-bank.js';
test('all facts covers ten multipliers for each selected table',()=>{const facts=getAllFacts([2,3]);assert.equal(facts.length,20);assert.deepEqual(facts[0],{table:2,multiplier:1});});
test('exam creates requested number and only selected tables',()=>{const questions=createExamQuestions([2,3],30,()=>0.5);assert.equal(questions.length,30);assert.equal(questions.every(q=>[2,3].includes(q.table)),true);});
test('initial state has ten tables and defaults to 2 and 3',()=>{const state=createInitialState();assert.deepEqual(state.selected,[2,3]);assert.equal(Object.keys(state.tables).length,10);});
