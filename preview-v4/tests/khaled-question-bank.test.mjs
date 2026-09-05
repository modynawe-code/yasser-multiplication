import test from 'node:test';
import assert from 'node:assert/strict';
import { createCountQuestion, createCompareQuestion, createKhaledRound } from '../src/modules/khaled/domain/question-bank.js';

function fixedRandom(values){let i=0;return()=>values[i++%values.length];}

test('count questions stay within first-grade visual range',()=>{
  const question=createCountQuestion({max:5,random:fixedRandom([.6,.2,.8,.4,.1,.9])});
  assert.ok(question.count>=0&&question.count<=5);
  assert.equal(question.correctAnswer,question.count);
  assert.equal(question.options.length,3);
  assert.ok(question.options.includes(question.correctAnswer));
});

test('comparison question correct side matches requested relation',()=>{
  const question=createCompareQuestion({max:5,random:fixedRandom([.8,.2,.9,.3])});
  assert.equal(question.type,'compare-groups');
  assert.notEqual(question.left,question.right);
  const expected=question.prompt.includes('أكثر')?(question.left>question.right?'left':'right'):(question.left<question.right?'left':'right');
  assert.equal(question.correctAnswer,expected);
});

test('ready Khaled skills produce eight-question rounds',()=>{
  for(const skillId of ['numbers-0-5','classify-compare']){
    const round=createKhaledRound({skillId,count:8});
    assert.equal(round.length,8);
    assert.ok(round.every(question=>question.skillId===skillId));
  }
});
