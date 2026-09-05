import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createSubtractionStoryQuestion,
  createSubtractionSentenceQuestion,
  createZeroWholeSubtractionQuestion,
  createVerticalSubtractionQuestion
} from '../src/modules/khaled/domain/subtraction-question-bank.js';
import { createKhaledRound } from '../src/modules/khaled/domain/question-bank.js';

function fixedRandom(values){let i=0;return()=>values[i++%values.length];}
const random=()=>fixedRandom([.2,.6,.4,.8,.1,.7,.3,.9,.5]);

test('subtraction generators never create negative answers and stay within twelve',()=>{
  const questions=[
    createSubtractionStoryQuestion({random:random()}),
    createSubtractionSentenceQuestion({random:random()}),
    createZeroWholeSubtractionQuestion({random:random()}),
    createVerticalSubtractionQuestion({random:random()})
  ];
  for(const question of questions){
    assert.equal(question.skillId,'subtraction-foundations');
    assert.ok(question.correctAnswer>=0&&question.correctAnswer<=12);
    assert.ok(question.options.includes(question.correctAnswer));
    assert.equal(question.correctAnswer,question.start-question.removed);
    assert.ok(question.spokenPrompt.length>0);
  }
});

test('zero and whole subtraction covers both special cases',()=>{
  const removeAll=createZeroWholeSubtractionQuestion({random:fixedRandom([.5,.9,.2,.4,.6,.8])});
  const removeZero=createZeroWholeSubtractionQuestion({random:fixedRandom([.5,.1,.2,.4,.6,.8])});
  assert.ok(removeAll.removed===removeAll.start||removeZero.removed===removeZero.start);
  assert.ok(removeAll.removed===0||removeZero.removed===0);
});

test('subtraction round rotates through story, sentence, zero-whole and vertical work',()=>{
  const round=createKhaledRound({skillId:'subtraction-foundations',count:8});
  assert.deepEqual(round.map(question=>question.type),[
    'visual-subtraction','subtraction-sentence','zero-whole-subtraction','vertical-subtraction',
    'visual-subtraction','subtraction-sentence','zero-whole-subtraction','vertical-subtraction'
  ]);
});

test('controller delegates subtraction visuals to focused renderer',async()=>{
  const controller=await readFile(new URL('../src/modules/khaled/ui/khaled-controller.js',import.meta.url),'utf8');
  const renderer=await readFile(new URL('../src/modules/khaled/ui/khaled-subtraction-renderer.js',import.meta.url),'utf8');
  const css=await readFile(new URL('../src/modules/khaled/ui/khaled-subtraction.css',import.meta.url),'utf8');
  assert.match(controller,/isSubtractionQuestion/);
  assert.match(controller,/renderSubtractionQuestion/);
  for(const type of ['visual-subtraction','subtraction-sentence','zero-whole-subtraction','vertical-subtraction'])assert.match(renderer,new RegExp(type));
  assert.match(css,/\.khaled-subtract-group/);
  assert.match(css,/\.khaled-vertical-subtraction/);
});
