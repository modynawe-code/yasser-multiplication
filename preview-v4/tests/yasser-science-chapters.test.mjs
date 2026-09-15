import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {YASSER_SCIENCE_PLAYABLE_QUESTIONS} from '../src/modules/yasser/science/science-question-bank.js';
import {
  DEFAULT_YASSER_SCIENCE_CHAPTER_ID,
  DEFAULT_YASSER_SCIENCE_UNIT_ID,
  YASSER_SCIENCE_CHAPTERS,
  YASSER_SCIENCE_UNITS,
  filterScienceProgressByChapter,
  filterScienceProgressByUnit,
  filterScienceQuestionsByChapter,
  filterScienceQuestionsByUnit
} from '../src/modules/yasser/science/science-chapters.js';
import {createScienceSession} from '../src/modules/yasser/science/science-engine.js';

const CHAPTER_ONE_UNITS=new Set(['cells','organization','cell-processes']);
const CHAPTER_TWO_UNITS=new Set(['division','heredity']);
const CHAPTER_THREE_UNITS=new Set(['plant-processes','microorganisms']);

test('unit 1 remains stable as a review scope',()=>{
  assert.equal(DEFAULT_YASSER_SCIENCE_CHAPTER_ID,'chapter-1-cells');
  assert.equal(YASSER_SCIENCE_CHAPTERS[0].label,'الفصل 1: الخلايا');
  const questions=filterScienceQuestionsByUnit(YASSER_SCIENCE_PLAYABLE_QUESTIONS,'unit-1-diversity-of-life');
  assert.equal(questions.length,105);
  assert.ok(questions.every(question=>CHAPTER_ONE_UNITS.has(question.unit)));
  assert.ok(questions.every(question=>!CHAPTER_TWO_UNITS.has(question.unit)));
  assert.ok(questions.every(question=>['choice','trueFalse'].includes(question.type)));
  assert.ok(questions.every(question=>Array.isArray(question.choices)&&question.choices.includes(question.answer)));
});

test('unit 2 is the current scope and exposes chapter 3 only',()=>{
  assert.equal(DEFAULT_YASSER_SCIENCE_UNIT_ID,'unit-2-life-processes');
  assert.equal(YASSER_SCIENCE_UNITS.find(unit=>unit.id===DEFAULT_YASSER_SCIENCE_UNIT_ID)?.shortLabel,'عمليات الحياة');
  const questions=filterScienceQuestionsByUnit(YASSER_SCIENCE_PLAYABLE_QUESTIONS);
  assert.ok(questions.length>=22,`unit 2 current scope=${questions.length}`);
  assert.ok(questions.every(question=>CHAPTER_THREE_UNITS.has(question.unit)));
  assert.ok(questions.every(question=>!CHAPTER_ONE_UNITS.has(question.unit)&&!CHAPTER_TWO_UNITS.has(question.unit)));
  assert.ok(questions.every(question=>['choice','trueFalse'].includes(question.type)));
  assert.ok(questions.every(question=>question.choices.includes(question.answer)));
});

test('unit 1 playable bank keeps minimum coverage across cells, organization and cell processes',()=>{
  const questions=filterScienceQuestionsByUnit(YASSER_SCIENCE_PLAYABLE_QUESTIONS,'unit-1-diversity-of-life');
  const count=(unit)=>questions.filter(question=>question.unit===unit).length;
  assert.ok(count('cells')>=50,`cells=${count('cells')}`);
  assert.ok(count('organization')>=10,`organization=${count('organization')}`);
  assert.ok(count('cell-processes')>=25,`cell-processes=${count('cell-processes')}`);
});

test('chapter 2 remains isolated and is not mixed into current practice',()=>{
  const questions=filterScienceQuestionsByChapter(YASSER_SCIENCE_PLAYABLE_QUESTIONS,'chapter-2-cell-heredity');
  assert.ok(questions.length>=10);
  assert.ok(questions.every(question=>CHAPTER_TWO_UNITS.has(question.unit)));
  assert.ok(questions.every(question=>!CHAPTER_ONE_UNITS.has(question.unit)));
});

test('unit 2 quick and school exam sessions stay inside chapter 3',()=>{
  const questions=filterScienceQuestionsByUnit(YASSER_SCIENCE_PLAYABLE_QUESTIONS,'unit-2-life-processes');
  for(const mode of ['quick','exam']){
    const session=createScienceSession({mode,count:mode==='exam'?20:10,questions,rng:()=>.5});
    assert.equal(session.questions.length,mode==='exam'?20:10,mode);
    assert.ok(session.questions.every(question=>CHAPTER_THREE_UNITS.has(question.unit)),mode);
  }
});

test('unit progress excludes other science units and recomputes points',()=>{
  const progress={points:999,attempts:[
    {questionId:'a',concept:'cell-theory',unit:'cells',isCorrect:true,earned:10,answeredAt:'2026-09-14T10:00:00.000Z'},
    {questionId:'b',concept:'roots',unit:'plant-processes',isCorrect:true,earned:10,answeredAt:'2026-09-14T10:01:00.000Z'},
    {questionId:'c',concept:'bacteria',unit:'microorganisms',isCorrect:false,earned:0,answeredAt:'2026-09-14T10:02:00.000Z'},
    {questionId:'d',concept:'meiosis',unit:'division',isCorrect:true,earned:20,answeredAt:'2026-09-14T10:03:00.000Z'}
  ]};
  const unitTwo=filterScienceProgressByUnit(progress,'unit-2-life-processes');
  assert.equal(unitTwo.attempts.length,2);assert.equal(unitTwo.points,10);assert.equal(unitTwo.concepts['cell-theory'],undefined);assert.equal(unitTwo.concepts.meiosis,undefined);
  const chapterOne=filterScienceProgressByChapter(progress,'chapter-1-cells');
  assert.equal(chapterOne.attempts.length,1);assert.equal(chapterOne.points,10);
});

test('science UI is unit-first, defaults to unit 2 and does not expose advanced chapter 4',()=>{
  const source=readFileSync(new URL('../src/modules/yasser/science/yasser-science.js',import.meta.url),'utf8');
  const css=readFileSync(new URL('../src/modules/yasser/science/yasser-science.css',import.meta.url),'utf8');
  assert.match(source,/علوم الفصل الدراسي الأول/);
  assert.match(source,/scienceUnitSwitch/);
  assert.match(source,/YASSER_SCIENCE_UNITS/);
  assert.match(source,/DEFAULT_YASSER_SCIENCE_UNIT_ID/);
  assert.match(source,/بدون الدروس المتقدمة/);
  assert.doesNotMatch(source,/الفصل الرابع/);
  assert.match(source,/أسئلة بصرية بالصور والمخططات/);
  assert.doesNotMatch(source,/صور الكتاب/);
  assert.match(source,/YASSER_SCIENCE_UNIT2_VISUAL_ASSETS/);
  assert.match(source,/visualUnitQuestions/);
  assert.match(source,/scienceImageModal/);
  assert.match(source,/تكبير الصورة/);
  assert.match(css,/science-unit-switch/);
  assert.match(css,/science-unit-pick\.active/);
  assert.match(css,/button:disabled/);
  assert.match(css,/max-height:590px/);
  assert.match(css,/cursor:zoom-in/);
});
