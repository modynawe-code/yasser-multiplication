import test from 'node:test';
import assert from 'node:assert/strict';
import { createMoneyRecognitionQuestion,createCountMoneyQuestion,createMoneyModelQuestion,createEqualAmountsQuestion,createUseMoneyQuestion,createCompareMoneyQuestion,createCanBuyQuestion,createMoneyChangeQuestion,createMoneyRoundQuestion,MONEY_ACTIVITY_TYPES } from '../src/modules/khaled/domain/money-question-bank.js';
import { createAdvancedKhaledRound } from '../src/modules/khaled/domain/advanced-question-bank.js';
import { SAUDI_MONEY_ASSETS } from '../src/modules/khaled/ui/saudi-money-assets.js';
import { readFile } from 'node:fs/promises';

function fixedRandom(values){let i=0;return()=>values[i++%values.length];}
const sum=values=>values.reduce((a,b)=>a+b,0);

test('money recognition uses the textbook denominations as physical pieces: 1, 2, 5 and 10',()=>{
  const expected=[1,2,5,10];
  expected.forEach((value,index)=>{
    const question=createMoneyRecognitionQuestion({random:fixedRandom([index/4+.01,.2,.7,.4,.8])});
    assert.deepEqual(question.coins,[value]);assert.equal(question.correctAnswer,value);assert.ok(question.options.includes(value));
  });
});

test('count-money questions match the visible total and use only textbook denominations',()=>{
  const question=createCountMoneyQuestion({random:fixedRandom([.5,.2,.8,.4,.1,.9])});
  assert.equal(question.correctAnswer,sum(question.coins));assert.ok(question.options.includes(question.correctAnswer));assert.ok(question.coins.every(value=>[1,2,5,10].includes(value)));
});

test('money modeling and buying have exactly one option with the target amount',()=>{
  for(const question of [createMoneyModelQuestion(),createUseMoneyQuestion()]){
    const target=question.target??question.price,matching=question.options.filter(option=>sum(option.coins)===target);
    assert.equal(matching.length,1);assert.equal(matching[0].value,question.correctAnswer);assert.ok(question.options.flatMap(option=>option.coins).every(value=>[1,2,5,10].includes(value)));
  }
});

test('equal and compare money answers always match the visible amounts',()=>{
  for(let i=0;i<30;i++){
    const equal=createEqualAmountsQuestion(),compare=createCompareMoneyQuestion();
    assert.equal(equal.correctAnswer,sum(equal.left)===sum(equal.right)?'yes':'no');
    assert.equal(compare.correctAnswer,sum(compare.left)>sum(compare.right)?'left':'right');
  }
});

test('buying sufficiency and change scenarios are arithmetically valid',()=>{
  for(let i=0;i<30;i++){
    const canBuy=createCanBuyQuestion(),change=createMoneyChangeQuestion();
    assert.equal(canBuy.correctAnswer,canBuy.available>=canBuy.price?'yes':'no');
    assert.equal(change.correctAnswer,change.paid-change.price);assert.ok(change.options.includes(change.correctAnswer));
  }
});

test('money round rotates through eight distinct activity families',()=>{
  assert.equal(MONEY_ACTIVITY_TYPES.length,8);
  assert.deepEqual(Array.from({length:8},(_,i)=>createMoneyRoundQuestion(i).type),MONEY_ACTIVITY_TYPES);
});

test('advanced dispatcher can create a twelve-question money practice without invalid totals',()=>{
  const round=createAdvancedKhaledRound({skillId:'money',count:12});
  assert.equal(round.length,12);assert.ok(round.every(question=>question.skillId==='money'));
  for(const question of round)if(question.coins)assert.ok(question.coins.every(value=>[1,2,5,10].includes(value)));
});

test('currency asset registry uses official Saudi currency imagery for the four textbook denominations',()=>{
  assert.deepEqual(Object.keys(SAUDI_MONEY_ASSETS),['1','2','5','10']);
  for(const asset of Object.values(SAUDI_MONEY_ASSETS)){
    assert.ok(['coin','note'].includes(asset.kind));assert.ok(asset.sources.length>=1);assert.ok(asset.sources.every(url=>url.startsWith('https://www.sama.gov.sa/ar-sa/Currency/PublishingImages/')));
  }
});

test('money renderer is image-first, supports all activities and makes the main currency visual materially larger',async()=>{
  const renderer=await readFile(new URL('../src/modules/khaled/ui/khaled-money-renderer.js',import.meta.url),'utf8');
  const css=await readFile(new URL('../src/modules/khaled/ui/khaled-money.css',import.meta.url),'utf8');
  assert.match(renderer,/data-saudi-money-value/);assert.match(renderer,/compare-money-amounts/);assert.match(renderer,/money-can-buy/);assert.match(renderer,/money-change/);assert.match(renderer,/hydrateSaudiMoneyImages/);
  assert.match(css,/\.khaled-money-stage \.khaled-money-piece\.note\{width:238px/);assert.match(css,/\.khaled-money-stage \.khaled-money-piece\.coin\{width:112px/);assert.match(css,/\.khaled-money-fallback/);
});

test('PWA caches official SAMA currency images after first successful load without coupling install to them',async()=>{
  const worker=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
  assert.match(worker,/shell-\d+/);assert.match(worker,/isSaudiCurrencyImage/);assert.match(worker,/www\.sama\.gov\.sa/);assert.match(worker,/response\.type==='opaque'/);assert.doesNotMatch(worker,/Sixth%20Issue%2010%20Riyal%20Note\.png/);
});
