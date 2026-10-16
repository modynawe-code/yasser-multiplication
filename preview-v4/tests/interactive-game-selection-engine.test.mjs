import test from 'node:test';
import assert from 'node:assert/strict';
import {drawParticipant,drawParticipants,normalizeParticipants} from '../src/modules/interactive-games/selection-engine.js';

test('normalizes entered names and removes case-insensitive duplicates',()=>{
  assert.deepEqual(normalizeParticipants([' ياسر ','خالد','ياسر','Khaled','khaled']),['ياسر','خالد','Khaled']);
});

test('draws only from the remaining participants when no-repeat is enabled',()=>{
  const result=drawParticipant(['A','B','C'],{remaining:['B','C'],random:()=>0});
  assert.equal(result.participant,'B');
  assert.deepEqual(result.remaining,['C']);
  assert.equal(result.cycleRestarted,false);
});

test('starts a fresh selection cycle after every participant was drawn',()=>{
  const result=drawParticipant(['A','B'],{remaining:[],random:()=>0.99});
  assert.equal(result.participant,'B');
  assert.deepEqual(result.remaining,['A']);
  assert.equal(result.cycleRestarted,true);
});

test('allows repeats when the no-repeat option is disabled',()=>{
  const result=drawParticipant(['A','B'],{remaining:['B'],noRepeat:false,random:()=>0});
  assert.equal(result.participant,'A');
  assert.deepEqual(result.remaining,['A','B']);
});

test('draws the configured number without replacement from the remaining roster',()=>{
  const values=[0,0.5];
  const result=drawParticipants(['A','B','C'],{remaining:['B','C'],count:2,random:()=>values.shift()});
  assert.deepEqual(result.participants,['B','C']);
  assert.deepEqual(result.remaining,[]);
  assert.equal(result.cycleRestarted,false);
});

test('applies the same no-repeat cycle to Wafy wheel group entries',()=>{
  const result=drawParticipants(['المجموعة أ','المجموعة ب'],{remaining:['المجموعة ب'],random:()=>0});
  assert.deepEqual(result.participants,['المجموعة ب']);
  assert.deepEqual(result.remaining,[]);
  const next=drawParticipants(['المجموعة أ','المجموعة ب'],{remaining:result.remaining,random:()=>0});
  assert.equal(next.cycleRestarted,true);
  assert.deepEqual(next.participants,['المجموعة أ']);
});

test('starts a fresh roster cycle when too few names remain for the requested draw',()=>{
  const values=[0.99,0];
  const result=drawParticipants(['A','B','C'],{remaining:['C'],count:2,random:()=>values.shift()});
  assert.deepEqual(result.participants,['C','A']);
  assert.deepEqual(result.remaining,['B']);
  assert.equal(result.cycleRestarted,true);
});
