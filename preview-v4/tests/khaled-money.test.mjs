import test from 'node:test';
import assert from 'node:assert/strict';
import { createMoneyRecognitionQuestion,createCountMoneyQuestion,createMoneyModelQuestion,createEqualAmountsQuestion,createUseMoneyQuestion,createMoneyRoundQuestion } from '../src/modules/khaled/domain/money-question-bank.js';
import { createAdvancedKhaledRound } from '../src/modules/khaled/domain/advanced-question-bank.js';
import { SAUDI_MONEY_ASSETS } from '../src/modules/khaled/ui/saudi-money-assets.js';
import { readFile } from 'node:fs/promises';

function fixedRandom(values){let i=0;return()=>values[i++%values.length];}
const sum=values=>values.reduce((a,b)=>a+b,0);

test('money recognition uses the textbook denominations as physical pieces: 1, 2, 5 and 10',()=>{
  const expected=[1,2,5,10];
  expected.forEach((value,index)=>{
    const question=createMoneyRecognitionQuestion({random:fixedRandom([index/4+.01,.2,.7,.4,.8])});
    assert.deepEqual(question.coins,[value]);
    assert.equal(question.correctAnswer,value);
    assert.ok(question.options.includes(value));
  });
});

test('count-money questions match the visible total and use only textbook denominations',()=>{
  const question=createCountMoneyQuestion({random:fixedRandom([.5,.2,.8,.4,.1,.9])});
  assert.equal(question.correctAnswer,sum(question.coins));
  assert.ok(question.options.includes(question.correctAnswer));
  assert.ok(question.coins.every(value=>[1,2,5,10].includes(value)));
});

test('money modeling and buying have exactly one option with the target amount',()=>{
  for(const question of [createMoneyModelQuestion(),createUseMoneyQuestion()]){
    const target=question.target??question.price;
    const matching=question.options.filter(option=>sum(option.coins)===target);
    assert.equal(matching.length,1);
    assert.equal(matching[0].value,question.correctAnswer);
    assert.ok(question.options.flatMap(option=>option.coins).every(value=>[1,2,5,10].includes(value)));
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

test('currency asset registry uses official Saudi currency imagery for the four textbook denominations',()=>{
  assert.deepEqual(Object.keys(SAUDI_MONEY_ASSETS),['1','2','5','10']);
  for(const asset of Object.values(SAUDI_MONEY_ASSETS)){
    assert.ok(['coin','note'].includes(asset.kind));
    assert.ok(asset.sources.length>=1);
    assert.ok(asset.sources.every(url=>url.startsWith('https://www.sama.gov.sa/ar-sa/Currency/PublishingImages/')));
  }
});

test('money renderer is image-first with a non-blocking educational fallback',async()=>{
  const renderer=await readFile(new URL('../src/modules/khaled/ui/khaled-money-renderer.js',import.meta.url),'utf8');
  const css=await readFile(new URL('../src/modules/khaled/ui/khaled-money.css',import.meta.url),'utf8');
  assert.match(renderer,/data-saudi-money-value/);
  assert.match(renderer,/<img class="khaled-money-photo"/);
  assert.match(renderer,/hydrateSaudiMoneyImages/);
  assert.match(css,/\.khaled-money-photo/);
  assert.match(css,/\.khaled-money-fallback/);
});

test('PWA caches official SAMA currency images after first successful load without coupling install to them',async()=>{
  const worker=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
  assert.match(worker,/shell-\d+/);
  assert.match(worker,/isSaudiCurrencyImage/);
  assert.match(worker,/www\.sama\.gov\.sa/);
  assert.match(worker,/response\.type==='opaque'/);
  assert.doesNotMatch(worker,/Sixth%20Issue%2010%20Riyal%20Note\.png/);
});