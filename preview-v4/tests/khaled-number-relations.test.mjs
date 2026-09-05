import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createSpokenNumberQuestion,
  createNumberCompareQuestion,
  createNumberOrderQuestion,
  createOrdinalQuestion,
  createKhaledRound
} from '../src/modules/khaled/domain/question-bank.js';

function fixedRandom(values){let i=0;return()=>values[i++%values.length];}
const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('spoken number recognition stays in the selected chapter range',()=>{
  for(const [min,max,skillId] of [[0,5,'numbers-0-5'],[6,10,'numbers-6-10'],[11,20,'numbers-11-20']]){
    const question=createSpokenNumberQuestion({min,max,random:fixedRandom([.55,.2,.8,.4,.1,.9,.3])});
    assert.equal(question.type,'spoken-number-select');
    assert.equal(question.skillId,skillId);
    assert.ok(question.correctAnswer>=min&&question.correctAnswer<=max);
    assert.ok(question.options.includes(question.correctAnswer));
    assert.match(question.spokenPrompt,new RegExp(String(question.correctAnswer)));
  }
});

test('number comparison chooses the requested larger or smaller value',()=>{
  for(const values of [[.8,.2,.9,.4],[.2,.8,.1,.5]]){
    const question=createNumberCompareQuestion({min:0,max:10,random:fixedRandom(values)});
    assert.equal(question.type,'number-compare');
    assert.notEqual(question.left,question.right);
    const expected=question.prompt.includes('أكبر')?Math.max(question.left,question.right):Math.min(question.left,question.right);
    assert.equal(question.correctAnswer,expected);
    assert.ok(question.options.includes(expected));
  }
});

test('number ordering generator is reusable for both number chapters',()=>{
  const ten=createNumberOrderQuestion({min:6,max:10,random:fixedRandom([.5,.2,.8,.4,.1,.9])});
  const twenty=createNumberOrderQuestion({min:11,max:20,random:fixedRandom([.5,.2,.8,.4,.1,.9])});
  assert.equal(ten.skillId,'numbers-6-10');
  assert.equal(twenty.skillId,'numbers-11-20');
  for(const question of [ten,twenty]){
    assert.equal(question.items.filter(item=>item===null).length,1);
    assert.ok(question.options.includes(question.correctAnswer));
  }
});

test('ordinal question maps a spoken position to the matching visible item',()=>{
  const question=createOrdinalQuestion({random:fixedRandom([.45,.8,.3,.6,.1,.9])});
  assert.equal(question.type,'ordinal-select');
  assert.equal(question.correctAnswer,question.items[question.targetPosition-1]);
  assert.ok(question.targetPosition>=1&&question.targetPosition<=5);
  assert.ok(question.options.includes(question.correctAnswer));
});

test('number chapters mix recognition and relation activities instead of count-only rounds',()=>{
  const small=createKhaledRound({skillId:'numbers-0-5',count:8});
  assert.deepEqual([...new Set(small.map(item=>item.type))].sort(),['count-select','spoken-number-select']);

  const medium=createKhaledRound({skillId:'numbers-6-10',count:10});
  for(const type of ['count-select','spoken-number-select','number-compare','number-order','ordinal-select'])assert.ok(medium.some(item=>item.type===type));

  const large=createKhaledRound({skillId:'numbers-11-20',count:8});
  for(const type of ['count-select','spoken-number-select','number-compare','number-order'])assert.ok(large.some(item=>item.type===type));
});

test('Khaled UI auto-speaks each current question and still allows replay',async()=>{
  const controller=await read('src/modules/khaled/ui/khaled-controller.js');
  assert.match(controller,/function speakQuestion\(question\)/);
  assert.match(controller,/speech\.speak\(question\.spokenPrompt/);
  assert.match(controller,/speakQuestion\(question\)/);
  assert.match(controller,/hearKhaledQuestion/);
  assert.match(controller,/question\.type==='spoken-number-select'/);
  assert.match(controller,/question\.type==='number-compare'/);
  assert.match(controller,/question\.type==='ordinal-select'/);
});

test('number relation CSS is imported through the Khaled activity visual module',async()=>{
  const activityCss=await read('src/modules/khaled/ui/khaled-activity-types.css');
  const numberCss=await read('src/modules/khaled/ui/khaled-number-relations.css');
  assert.match(activityCss,/khaled-number-relations\.css/);
  for(const selector of ['khaled-spoken-number','khaled-number-compare','khaled-ordinal-row'])assert.match(numberCss,new RegExp(selector));
});
