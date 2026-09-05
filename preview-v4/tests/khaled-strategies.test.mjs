import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createCountOnAdditionQuestion,
  createNumberLineAdditionQuestion,
  createCountBackSubtractionQuestion,
  createNumberSentenceQuestion,
  createNumberLineSubtractionQuestion
} from '../src/modules/khaled/domain/add-sub-strategies-question-bank.js';
import { createKhaledRound } from '../src/modules/khaled/domain/question-bank.js';

function fixedRandom(values){let index=0;return()=>values[index++%values.length];}
const random=()=>fixedRandom([.18,.72,.33,.91,.44,.08,.63,.27,.81,.52]);

test('counting strategies move in the correct arithmetic direction within twelve',()=>{
  const on=createCountOnAdditionQuestion({random:random()});
  const back=createCountBackSubtractionQuestion({random:random()});
  assert.equal(on.correctAnswer,on.start+on.steps);
  assert.equal(back.correctAnswer,back.start-back.steps);
  assert.ok(on.correctAnswer<=12);
  assert.ok(back.correctAnswer>=0);
  assert.ok(on.options.includes(on.correctAnswer));
  assert.ok(back.options.includes(back.correctAnswer));
});

test('number-line strategies use valid start, jump and destination values',()=>{
  const add=createNumberLineAdditionQuestion({random:random()});
  const subtract=createNumberLineSubtractionQuestion({random:random()});
  assert.equal(add.direction,'forward');
  assert.equal(subtract.direction,'backward');
  assert.equal(add.correctAnswer,add.start+add.steps);
  assert.equal(subtract.correctAnswer,subtract.start-subtract.steps);
  for(const question of [add,subtract]){
    assert.ok(question.start>=0&&question.start<=12);
    assert.ok(question.correctAnswer>=0&&question.correctAnswer<=12);
    assert.equal(new Set(question.options).size,3);
  }
});

test('number sentence choices contain exactly one mathematically correct equation',()=>{
  for(const chooser of [[.9,.2,.3,.4,.5,.6,.7],[.1,.7,.4,.2,.8,.3,.6]]){
    const question=createNumberSentenceQuestion({random:fixedRandom(chooser)});
    assert.equal(question.options.length,3);
    assert.equal(new Set(question.options).size,3);
    assert.ok(question.options.includes(question.correctAnswer));
    const correctCount=question.options.filter(option=>{
      const [expression,result]=option.split('=');
      const operation=expression.includes('+')?'+':'-';
      const [a,b]=expression.split(operation).map(Number);
      const expected=operation==='+'?a+b:a-b;
      return expected===Number(result);
    }).length;
    assert.equal(correctCount,1);
  }
});

test('chapter eight round rotates through all five represented strategies',()=>{
  const round=createKhaledRound({skillId:'add-sub-strategies',count:10});
  assert.deepEqual(round.map(question=>question.type),[
    'count-on-addition','number-line-addition','count-back-subtraction','number-sentence','number-line-subtraction',
    'count-on-addition','number-line-addition','count-back-subtraction','number-sentence','number-line-subtraction'
  ]);
  assert.ok(round.every(question=>question.skillId==='add-sub-strategies'));
});

test('controller delegates chapter eight to focused responsive renderer',async()=>{
  const controller=await readFile(new URL('../src/modules/khaled/ui/khaled-controller.js',import.meta.url),'utf8');
  const renderer=await readFile(new URL('../src/modules/khaled/ui/khaled-strategies-renderer.js',import.meta.url),'utf8');
  const css=await readFile(new URL('../src/modules/khaled/ui/khaled-strategies.css',import.meta.url),'utf8');
  assert.match(controller,/isStrategiesQuestion/);
  assert.match(controller,/renderStrategiesQuestion/);
  for(const type of ['count-on-addition','number-line-addition','count-back-subtraction','number-sentence','number-line-subtraction'])assert.match(renderer,new RegExp(type));
  assert.match(css,/\.khaled-strategy-number-line/);
  assert.match(css,/\.khaled-count-strategy/);
  assert.match(css,/@media\(max-width:420px\)/);
});
