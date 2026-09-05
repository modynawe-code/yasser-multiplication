import test from 'node:test';
import assert from 'node:assert/strict';
import { createMoneyRecognitionQuestion,createCountMoneyQuestion,createMoneyModelQuestion,createEqualAmountsQuestion,createUseMoneyQuestion,createMoneyRoundQuestion } from '../src/modules/khaled/domain/money-question-bank.js';
import { createAdvancedKhaledRound } from '../src/modules/khaled/domain/advanced-question-bank.js';
import { readFile } from 'node:fs/promises';

function fixedRandom(values){let i=0;return()=>values[i++%values.length];}
const sum=values=>values.reduce((a,b)=>a+b,0);

test('money recognition only uses lesson-introduction amounts 1, 2, 5 and 10',()=>{
  for(const seed of [[.01,.3,.7,.2],[.3,.8,.1,.6],[.6,.1,.9,.4],[.99,.2,.8,.5]]){
    const question=createMoneyRecognitionQuestion({random:fixedRandom(seed)});
    assert.ok([1,2,5,10].includes(question.correctAnswer));
    assert.equal(sum(question.coins),question.correctAnswer);
    assert.ok(question.options.includes(question.correctAnswer));
  }
});

test('count-money questions match the visible total',()=>{
  const question=createCountMoneyQuestion({random:fixedRandom([.5,.2,.8,.4,.1,.9])});
  assert.equal(question.correctAnswer,sum(question.coins));
  assert.ok(question.options.includes(question.correctAnswer));
});

test('money modeling and buying have exactly one option with the target amount',()=>{
  for(const question of [createMoneyModelQuestion(),createUseMoneyQuestion()]){
    const target=question.target??question.price;
    const matching=question.options.filter(option=>sum(option.coins)===target);
    assert.equal(matching.length,1);
    assert.equal(matching[0].value,question.correctAnswer);
  }
});

test('equal amounts answer matches visible totals',()=>{
  for(let i=0;i<20;i++){
    const question=createEqualAmountsQuestion();
    assert.equal(question.correctAnswer,sum(question.left)===sum(question.right)?'yes':'no');
  }
});

test('chapter thirteen round rotates through all five money activities',()=>{
  assert.deepEqual(Array.from({length:5},(_,i)=>createMoneyRoundQuestion(i).type),['money-recognition','count-money','money-model','equal-money-amounts','use-money']);
});

test('advanced dispatcher returns final money rounds',()=>{
  const round=createAdvancedKhaledRound({skillId:'money',count:8});
  assert.equal(round.length,8);assert.ok(round.every(question=>question.skillId==='money'));
});

test('money renderer uses original CSS visuals instead of textbook images',async()=>{
  const renderer=await readFile(new URL('../src/modules/khaled/ui/khaled-money-renderer.js',import.meta.url),'utf8');
  const css=await readFile(new URL('../src/modules/khaled/ui/khaled-money.css',import.meta.url),'utf8');
  assert.match(renderer,/khaled-money-piece/);assert.doesNotMatch(renderer,/<img/i);assert.match(css,/\.khaled-money-piece/);
});
