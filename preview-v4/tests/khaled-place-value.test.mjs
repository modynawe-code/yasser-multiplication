import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createPlaceValueModelQuestion,
  createGuessCheckPlaceValueQuestion,
  createRangeRecognitionQuestion,
  createEstimateQuestion,
  createCompareTo100Question,
  createOrderTo100Question
} from '../src/modules/khaled/domain/place-value-question-bank.js';
import { createKhaledRound } from '../src/modules/khaled/domain/question-bank.js';

function fixedRandom(values){let index=0;return()=>values[index++%values.length];}
const random=()=>fixedRandom([.18,.72,.33,.91,.44,.08,.63,.27,.81,.52,.12,.67]);

test('tens and ones model always reconstructs the target number',()=>{
  for(let i=0;i<12;i++){
    const question=createPlaceValueModelQuestion({random:random()});
    assert.equal(question.number,question.tens*10+question.ones);
    assert.ok(question.options.includes(question.number));
    assert.equal(new Set(question.options).size,3);
  }
});

test('place-value clue and range recognition keep valid first-grade ranges',()=>{
  const clue=createGuessCheckPlaceValueQuestion({random:random()});
  const to50=createRangeRecognitionQuestion({max:50,random:random()});
  const to100=createRangeRecognitionQuestion({max:100,random:random()});
  assert.equal(clue.correctAnswer,clue.tens*10+clue.ones);
  assert.ok(to50.correctAnswer>=21&&to50.correctAnswer<=50);
  assert.ok(to100.correctAnswer>=51&&to100.correctAnswer<=100);
  for(const question of [clue,to50,to100])assert.ok(question.options.includes(question.correctAnswer));
});

test('estimation uses the nearest multiple of ten with three unique choices',()=>{
  for(const values of [[.01,.2,.7,.4],[.99,.3,.8,.1],[.55,.6,.2,.9]]){
    const question=createEstimateQuestion({random:fixedRandom(values)});
    const lower=Math.floor(question.exact/10)*10;
    const upper=lower+10;
    const expected=question.exact-lower<upper-question.exact?lower:upper;
    assert.equal(question.correctAnswer,expected);
    assert.equal(new Set(question.options).size,3);
    assert.ok(question.options.includes(expected));
  }
});

test('comparison and ordering stay within zero to one hundred',()=>{
  const compare=createCompareTo100Question({random:random()});
  const order=createOrderTo100Question({random:random()});
  assert.ok(compare.left>=0&&compare.left<=100&&compare.right>=0&&compare.right<=100);
  assert.ok(compare.options.includes(compare.correctAnswer));
  assert.equal(order.numbers.length,3);
  assert.equal(new Set(order.numbers).size,3);
  assert.ok(order.numbers.every(value=>value>=0&&value<=100));
  assert.ok(order.options.includes(order.correctAnswer));
});

test('chapter nine round rotates through all seven represented lesson activities',()=>{
  const round=createKhaledRound({skillId:'place-value',count:14});
  assert.deepEqual(round.map(question=>question.type),[
    'place-value-model','place-value-clue','number-to-50','number-to-100','estimate-nearest-ten','compare-to-100','order-to-100',
    'place-value-model','place-value-clue','number-to-50','number-to-100','estimate-nearest-ten','compare-to-100','order-to-100'
  ]);
  assert.ok(round.every(question=>question.skillId==='place-value'));
});

test('controller delegates place-value visuals to a focused responsive renderer',async()=>{
  const controller=await readFile(new URL('../src/modules/khaled/ui/khaled-controller.js',import.meta.url),'utf8');
  const renderer=await readFile(new URL('../src/modules/khaled/ui/khaled-place-value-renderer.js',import.meta.url),'utf8');
  const css=await readFile(new URL('../src/modules/khaled/ui/khaled-place-value.css',import.meta.url),'utf8');
  assert.match(controller,/isPlaceValueQuestion/);
  assert.match(controller,/renderPlaceValueQuestion/);
  for(const type of ['place-value-model','place-value-clue','number-to-50','number-to-100','estimate-nearest-ten','compare-to-100','order-to-100'])assert.match(renderer,new RegExp(type));
  assert.match(css,/\.khaled-ten-rod/);
  assert.match(css,/\.khaled-one-cube/);
  assert.match(css,/\.khaled-order-answers/);
});
