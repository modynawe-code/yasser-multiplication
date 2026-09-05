import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCountQuestion,
  createClassifyQuestion,
  createEqualityQuestion,
  createCompareQuestion,
  createPositionQuestion,
  createPatternQuestion,
  createNumberOrderQuestion,
  createVisualAdditionQuestion,
  createKhaledRound
} from '../src/modules/khaled/domain/question-bank.js';

function fixedRandom(values){let i=0;return()=>values[i++%values.length];}

test('count questions stay within requested first-grade range',()=>{
  const small=createCountQuestion({min:0,max:5,random:fixedRandom([.6,.2,.8,.4,.1,.9])});
  assert.ok(small.count>=0&&small.count<=5);
  assert.equal(small.correctAnswer,small.count);
  assert.equal(small.options.length,3);
  assert.ok(small.options.includes(small.correctAnswer));

  const medium=createCountQuestion({min:6,max:10,random:fixedRandom([.6,.2,.8,.4,.1,.9])});
  assert.ok(medium.count>=6&&medium.count<=10);
  assert.equal(medium.skillId,'numbers-6-10');

  const large=createCountQuestion({min:11,max:20,random:fixedRandom([.6,.2,.8,.4,.1,.9])});
  assert.ok(large.count>=11&&large.count<=20);
  assert.equal(large.skillId,'numbers-11-20');
});

test('single-property classification has one option matching the requested shared property',()=>{
  for(const values of [[.2,.1,.9,.4,.7,.3,.8],[.8,.7,.1,.2,.3,.6,.4]]){
    const question=createClassifyQuestion({multipleProperties:false,random:fixedRandom(values)});
    assert.equal(question.type,'classify-one-property');
    assert.equal(question.options.length,3);
    assert.ok(question.options.some(option=>option.key===question.correctAnswer));
    const correct=question.options.find(option=>option.key===question.correctAnswer);
    if(question.criterion==='color')assert.ok(question.group.every(item=>item.color===correct.color));
    else assert.ok(question.group.every(item=>item.shape===correct.shape));
  }
});

test('two-property classification requires an exact shape and color match',()=>{
  const question=createClassifyQuestion({multipleProperties:true,random:fixedRandom([.2,.7,.4,.8,.1,.6,.3])});
  assert.equal(question.type,'classify-two-properties');
  const correct=question.options.find(option=>option.key===question.correctAnswer);
  assert.ok(correct);
  assert.ok(question.group.every(item=>item.shape===correct.shape&&item.color===correct.color));
  assert.equal(new Set(question.options.map(option=>option.key)).size,3);
});

test('equality question answer matches whether both groups have the same count',()=>{
  for(const values of [[.4,.9,.2],[.7,.1,.2,.8]]){
    const question=createEqualityQuestion({max:5,random:fixedRandom(values)});
    assert.equal(question.type,'equality-groups');
    assert.equal(question.correctAnswer,question.left===question.right?'yes':'no');
    assert.deepEqual(question.options.map(option=>option.value),['yes','no']);
  }
});

test('comparison question correct side matches requested relation',()=>{
  const question=createCompareQuestion({max:5,random:fixedRandom([.8,.2,.9,.3])});
  assert.equal(question.type,'compare-groups');
  assert.notEqual(question.left,question.right);
  const expected=question.prompt.includes('أكثر')?(question.left>question.right?'left':'right'):(question.left<question.right?'left':'right');
  assert.equal(question.correctAnswer,expected);
});

test('position questions expose a visible target and valid answer',()=>{
  for(const randomValues of [[.1,.9,.3],[.45,.7,.4],[.9,.8,.2]]){
    const question=createPositionQuestion({random:fixedRandom(randomValues)});
    assert.equal(question.type,'position-select');
    assert.ok(question.items.length>=2);
    assert.ok(question.options.includes(question.correctAnswer));
  }
});

test('pattern question answer continues the generated sequence',()=>{
  const question=createPatternQuestion({random:fixedRandom([.1,.7,.2,.9,.3])});
  assert.equal(question.type,'pattern-next');
  assert.ok(question.items.length>=4);
  assert.ok(question.options.includes(question.correctAnswer));
});

test('number-order questions stay within 11 to 20 and hide one value',()=>{
  const question=createNumberOrderQuestion({random:fixedRandom([.5,.6,.1,.9,.3,.7,.2,.8])});
  assert.equal(question.type,'number-order');
  assert.equal(question.skillId,'numbers-11-20');
  assert.equal(question.items.filter(value=>value===null).length,1);
  assert.ok(question.correctAnswer>=11&&question.correctAnswer<=20);
  assert.ok(question.options.includes(question.correctAnswer));
});

test('visual addition combines two non-empty groups with total at most ten',()=>{
  const question=createVisualAdditionQuestion({maxTotal:10,random:fixedRandom([.4,.5,.2,.8,.1,.7,.3,.9])});
  assert.equal(question.type,'visual-addition');
  assert.equal(question.skillId,'addition-foundations');
  assert.ok(question.left>=1&&question.right>=1);
  assert.equal(question.correctAnswer,question.left+question.right);
  assert.ok(question.correctAnswer<=10);
  assert.ok(question.options.includes(question.correctAnswer));
});

test('chapter-one round covers all four represented lesson activity families',()=>{
  const round=createKhaledRound({skillId:'classify-compare',count:8});
  assert.deepEqual(round.map(question=>question.type),[
    'classify-one-property','classify-two-properties','equality-groups','compare-groups',
    'classify-one-property','classify-two-properties','equality-groups','compare-groups'
  ]);
});

test('all ready Khaled skills produce eight-question rounds',()=>{
  for(const skillId of ['numbers-0-5','numbers-6-10','numbers-11-20','classify-compare','position-pattern','addition-foundations']){
    const round=createKhaledRound({skillId,count:8});
    assert.equal(round.length,8);
    assert.ok(round.every(question=>question.skillId===skillId));
  }
});
