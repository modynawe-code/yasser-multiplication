import test from 'node:test';
import assert from 'node:assert/strict';
import {validateQuestionRecord} from '../src/shared/question-bank/index.js';
import {YASSER_SCIENCE_UNIT2_QUESTIONS} from '../src/modules/yasser/science/science-unit2-questions.js';

const chapterThreeQuestions=YASSER_SCIENCE_UNIT2_QUESTIONS.filter(question=>question.chapterId==='chapter-3-plants-microorganisms');

test('unit 2 chapter 3 bank keeps at least 22 verified sourced questions',()=>{
  assert.ok(chapterThreeQuestions.length>=22,`chapter 3 questions=${chapterThreeQuestions.length}`);
  const ids=new Set();
  for(const question of chapterThreeQuestions){
    assert.equal(question.unitId,'unit-2-life-processes');
    assert.equal(question.chapterId,'chapter-3-plants-microorganisms');
    assert.equal(question.verified,true);
    assert.ok(Array.isArray(question.sources)&&question.sources.length>=1);
    assert.ok(['choice','trueFalse'].includes(question.type));
    assert.ok(question.choices.includes(question.answer));
    assert.equal(validateQuestionRecord(question).ok,true,validateQuestionRecord(question).errors.join('; '));
    assert.equal(ids.has(question.id),false,`duplicate id: ${question.id}`);
    ids.add(question.id);
  }
});

test('unit 2 bank covers both plant and microorganism life processes',()=>{
  const plant=chapterThreeQuestions.filter(question=>question.topicId==='plant-life-processes');
  const microbes=chapterThreeQuestions.filter(question=>question.topicId==='microorganism-life-processes');
  assert.ok(plant.length>=12,`plant questions=${plant.length}`);
  assert.ok(microbes.length>=10,`microorganism questions=${microbes.length}`);
  assert.ok(chapterThreeQuestions.filter(question=>question.sources.some(source=>source.year==='1447')).length>=8);
});
