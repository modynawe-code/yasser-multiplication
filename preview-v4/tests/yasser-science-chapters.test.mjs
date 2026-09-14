import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {YASSER_SCIENCE_PLAYABLE_QUESTIONS} from '../src/modules/yasser/science/science-question-bank.js';
import {
  DEFAULT_YASSER_SCIENCE_CHAPTER_ID,
  YASSER_SCIENCE_CHAPTERS,
  filterScienceProgressByChapter,
  filterScienceQuestionsByChapter
} from '../src/modules/yasser/science/science-chapters.js';
import {createScienceSession} from '../src/modules/yasser/science/science-engine.js';

const CHAPTER_ONE_UNITS=new Set(['cells','organization','cell-processes']);
const CHAPTER_TWO_UNITS=new Set(['division','heredity']);

test('chapter 1 cells is the current science scope with the complete verified playable bank',()=>{
  assert.equal(DEFAULT_YASSER_SCIENCE_CHAPTER_ID,'chapter-1-cells');
  assert.equal(YASSER_SCIENCE_CHAPTERS[0].label,'الفصل 1: الخلايا');
  const questions=filterScienceQuestionsByChapter(YASSER_SCIENCE_PLAYABLE_QUESTIONS);
  assert.equal(questions.length,105);
  assert.ok(questions.every(question=>CHAPTER_ONE_UNITS.has(question.unit)));
  assert.ok(questions.every(question=>!CHAPTER_TWO_UNITS.has(question.unit)));
  assert.ok(questions.every(question=>['choice','trueFalse'].includes(question.type)));
  assert.ok(questions.every(question=>Array.isArray(question.choices)&&question.choices.includes(question.answer)));
});

test('chapter 1 playable bank has minimum coverage across cells, organization and cell processes',()=>{
  const questions=filterScienceQuestionsByChapter(YASSER_SCIENCE_PLAYABLE_QUESTIONS);
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

test('quick, image and school exam sessions stay inside current studied scope',()=>{
  const questions=filterScienceQuestionsByChapter(YASSER_SCIENCE_PLAYABLE_QUESTIONS,DEFAULT_YASSER_SCIENCE_CHAPTER_ID);
  for(const mode of ['quick','images','exam']){
    const session=createScienceSession({mode,count:mode==='exam'?20:mode==='images'?10:10,questions,rng:()=>.5});
    assert.ok(session.questions.length>0,mode);
    assert.ok(session.questions.every(question=>CHAPTER_ONE_UNITS.has(question.unit)),mode);
    if(mode==='images')assert.equal(session.questions.length,10);
  }
});

test('chapter progress excludes advanced content and recomputes current points',()=>{
  const progress={points:999,attempts:[
    {questionId:'a',concept:'cell-theory',unit:'cells',isCorrect:true,earned:10,answeredAt:'2026-09-14T10:00:00.000Z'},
    {questionId:'b',concept:'organ',unit:'organization',isCorrect:false,earned:0,answeredAt:'2026-09-14T10:01:00.000Z'},
    {questionId:'c',concept:'meiosis',unit:'division',isCorrect:true,earned:20,answeredAt:'2026-09-14T10:02:00.000Z'}
  ]};
  const chapterOne=filterScienceProgressByChapter(progress,'chapter-1-cells');
  assert.equal(chapterOne.attempts.length,2);assert.equal(chapterOne.points,10);assert.equal(chapterOne.concepts.meiosis,undefined);
  const chapterTwo=filterScienceProgressByChapter(progress,'chapter-2-cell-heredity');
  assert.equal(chapterTwo.attempts.length,1);assert.equal(chapterTwo.points,20);
});

test('science UI is unit-first, hides future chapter selector and keeps full image zoom',()=>{
  const source=readFileSync(new URL('../src/modules/yasser/science/yasser-science.js',import.meta.url),'utf8');
  const css=readFileSync(new URL('../src/modules/yasser/science/yasser-science.css',import.meta.url),'utf8');
  assert.match(source,/الوحدة الأولى: تنوع الحياة/);
  assert.match(source,/الفصل الأول — الخلايا/);
  assert.match(source,/بدون الدروس المتقدمة/);
  assert.doesNotMatch(source,/scienceChapterTabs/);
  assert.doesNotMatch(source,/الفصل 2: الخلية والوراثة/);
  assert.match(source,/YASSER_SCIENCE_PLAYABLE_QUESTIONS/);
  assert.match(source,/YASSER_SCIENCE_VISUAL_ASSETS/);
  assert.match(source,/scienceImageModal/);
  assert.match(source,/تكبير الصورة/);
  assert.match(css,/science-unit-card/);
  assert.match(css,/max-height:590px/);
  assert.match(css,/science-image-modal/);
  assert.match(css,/cursor:zoom-in/);
});
