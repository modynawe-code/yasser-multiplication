import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createAdditionSentenceQuestion,
  createZeroAdditionQuestion,
  createNumberBondQuestion,
  createVerticalAdditionQuestion,
  createAdditionStoryQuestion
} from '../src/modules/khaled/domain/addition-question-bank.js';
import { createKhaledRound } from '../src/modules/khaled/domain/question-bank.js';
import { getKhaledSkill } from '../src/modules/khaled/domain/curriculum.js';

function fixedRandom(values){let i=0;return()=>values[i++%values.length];}
const random=()=>fixedRandom([.2,.6,.4,.8,.1,.7,.3,.9,.5]);

test('chapter six curriculum exposes five playable addition families',()=>{
  const skill=getKhaledSkill('addition-foundations');
  assert.deepEqual(skill.activityTypes,['visual-addition','addition-sentence','zero-addition','number-bond','vertical-addition']);
  for(const lesson of ['قصص الجمع','جمل الجمع','تكوين الأعداد 10،11،12','الجمع الرأسي'])assert.ok(skill.lessons.includes(lesson));
});

test('addition generators keep answers valid for first grade ranges',()=>{
  const story=createAdditionStoryQuestion({random:random()});
  const sentence=createAdditionSentenceQuestion({random:random()});
  const zero=createZeroAdditionQuestion({random:random()});
  const bond=createNumberBondQuestion({random:random()});
  const vertical=createVerticalAdditionQuestion({random:random()});

  for(const question of [story,sentence,zero,bond,vertical]){
    assert.equal(question.skillId,'addition-foundations');
    assert.ok(question.options.includes(question.correctAnswer));
    assert.ok(question.spokenPrompt.length>0);
  }
  assert.equal(story.correctAnswer,story.left+story.right);
  assert.equal(sentence.correctAnswer,sentence.left+sentence.right);
  assert.equal(zero.correctAnswer,zero.left+zero.right);
  assert.equal(bond.correctAnswer,bond.total-bond.known);
  assert.equal(vertical.correctAnswer,vertical.left+vertical.right);
  assert.ok(bond.total>=4&&bond.total<=12);
  assert.ok(vertical.correctAnswer<=12);
});

test('addition round rotates through all activity families',()=>{
  const round=createKhaledRound({skillId:'addition-foundations',count:10});
  assert.deepEqual(round.map(question=>question.type),[
    'visual-addition','addition-sentence','zero-addition','number-bond','vertical-addition',
    'visual-addition','addition-sentence','zero-addition','number-bond','vertical-addition'
  ]);
});

test('controller delegates addition visuals to focused renderer',async()=>{
  const controller=await readFile(new URL('../src/modules/khaled/ui/khaled-controller.js',import.meta.url),'utf8');
  const renderer=await readFile(new URL('../src/modules/khaled/ui/khaled-addition-renderer.js',import.meta.url),'utf8');
  const css=await readFile(new URL('../src/modules/khaled/ui/khaled-addition.css',import.meta.url),'utf8');
  assert.match(controller,/isAdditionQuestion/);
  assert.match(controller,/renderAdditionQuestion/);
  for(const type of ['visual-addition','addition-sentence','zero-addition','number-bond','vertical-addition'])assert.match(renderer,new RegExp(type));
  assert.match(css,/\.khaled-number-bond/);
  assert.match(css,/\.khaled-vertical-addition/);
  assert.match(css,/\.khaled-addition-sentence/);
});
