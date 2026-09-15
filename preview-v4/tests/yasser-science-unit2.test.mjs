import test from 'node:test';
import assert from 'node:assert/strict';
import {validateQuestionRecord} from '../src/shared/question-bank/index.js';
import {YASSER_SCIENCE_UNIT2_QUESTIONS} from '../src/modules/yasser/science/science-unit2-questions.js';

test('unit 2 chapter 3 bank contains 22 verified sourced questions',()=>{
  assert.equal(YASSER_SCIENCE_UNIT2_QUESTIONS.length,22);
  const ids=new Set();
  for(const question of YASSER_SCIENCE_UNIT2_QUESTIONS){
    assert.equal(question.unitId,'unit-2-life-processes');
    assert.equal(question.chapterId,'chapter-3-plants-microorganisms');
    assert.equal(question.verified,true);
    assert.equal(question.assetId,'');
    assert.ok(question.sources.length>=1);
    assert.ok(question.sources.some(source=>source.authority==='textbook'));
    assert.ok(['choice','trueFalse'].includes(question.type));
    assert.ok(question.choices.includes(question.answer));
    assert.equal(validateQuestionRecord(question).ok,true,validateQuestionRecord(question).errors.join('; '));
    assert.equal(ids.has(question.id),false,`duplicate id: ${question.id}`);
    ids.add(question.id);
  }
});

test('unit 2 bank covers both plant and microorganism life processes',()=>{
  const plant=YASSER_SCIENCE_UNIT2_QUESTIONS.filter(question=>question.topicId==='plant-life-processes');
  const microbes=YASSER_SCIENCE_UNIT2_QUESTIONS.filter(question=>question.topicId==='microorganism-life-processes');
  assert.equal(plant.length,12);
  assert.equal(microbes.length,10);
  assert.ok(YASSER_SCIENCE_UNIT2_QUESTIONS.filter(question=>question.sources.some(source=>source.year==='1447')).length>=8);
});
