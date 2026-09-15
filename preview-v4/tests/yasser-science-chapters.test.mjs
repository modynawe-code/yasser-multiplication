import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {YASSER_SCIENCE_PLAYABLE_QUESTIONS} from '../src/modules/yasser/science/science-question-bank.js';
import {DEFAULT_YASSER_SCIENCE_CHAPTER_ID,DEFAULT_YASSER_SCIENCE_UNIT_ID,YASSER_SCIENCE_CHAPTERS,YASSER_SCIENCE_UNITS,filterScienceProgressByChapter,filterScienceProgressByUnit,filterScienceQuestionsByChapter,filterScienceQuestionsByUnit} from '../src/modules/yasser/science/science-chapters.js';
import {createScienceSession} from '../src/modules/yasser/science/science-engine.js';

const CHAPTER_ONE_UNITS=new Set(['cells','organization','cell-processes']);
const CHAPTER_TWO_UNITS=new Set(['division','heredity']);
const CHAPTER_THREE_UNITS=new Set(['plant-processes','microorganisms']);
const CHAPTER_FOUR_UNITS=new Set(['body-processes','movement-senses']);
const CHAPTER_FIVE_UNITS=new Set(['food-relations','ecosystems']);
const CHAPTER_SIX_UNITS=new Set(['earth-resources','resource-protection']);
const UNIT_TWO_UNITS=new Set([...CHAPTER_THREE_UNITS,...CHAPTER_FOUR_UNITS]);

test('unit 1 remains stable as a review scope',()=>{
  assert.equal(DEFAULT_YASSER_SCIENCE_CHAPTER_ID,'chapter-1-cells');
  const questions=filterScienceQuestionsByUnit(YASSER_SCIENCE_PLAYABLE_QUESTIONS,'unit-1-diversity-of-life');
  assert.equal(questions.length,105);
  assert.ok(questions.every(question=>CHAPTER_ONE_UNITS.has(question.unit)));
});

test('unit 2 remains a review scope with chapters 3 and 4',()=>{
  const unit=YASSER_SCIENCE_UNITS.find(item=>item.id==='unit-2-life-processes');
  assert.equal(unit?.status,'review');
  assert.deepEqual(unit?.allowedChapterIds,['chapter-3-plants-microorganisms','chapter-4-human-animals']);
  const questions=filterScienceQuestionsByUnit(YASSER_SCIENCE_PLAYABLE_QUESTIONS,'unit-2-life-processes');
  assert.ok(questions.length>=40,`unit 2=${questions.length}`);
  assert.ok(questions.some(question=>CHAPTER_THREE_UNITS.has(question.unit)));
  assert.ok(questions.some(question=>CHAPTER_FOUR_UNITS.has(question.unit)));
  assert.ok(questions.every(question=>UNIT_TWO_UNITS.has(question.unit)));
});

test('unit 3 is current and exposes chapter 5 only',()=>{
  assert.equal(DEFAULT_YASSER_SCIENCE_UNIT_ID,'unit-3-ecosystems-resources');
  const unit=YASSER_SCIENCE_UNITS.find(item=>item.id===DEFAULT_YASSER_SCIENCE_UNIT_ID);
  assert.equal(unit?.shortLabel,'الأنظمة البيئية ومواردها');
  assert.equal(unit?.status,'current');
  assert.equal(unit?.currentChapterId,'chapter-5-ecosystems');
  assert.deepEqual(unit?.allowedChapterIds,['chapter-5-ecosystems']);
  const questions=filterScienceQuestionsByUnit(YASSER_SCIENCE_PLAYABLE_QUESTIONS);
  assert.ok(questions.length>=30,`unit 3 current scope=${questions.length}`);
  assert.ok(questions.every(question=>CHAPTER_FIVE_UNITS.has(question.unit)));
  assert.ok(questions.every(question=>!CHAPTER_SIX_UNITS.has(question.unit)));
  assert.ok(questions.every(question=>['choice','trueFalse'].includes(question.type)));
  assert.ok(questions.every(question=>Array.isArray(question.choices)&&question.choices.includes(question.answer)));
});

test('chapter 6 question bank is prepared but isolated from current unit 3 practice',()=>{
  const questions=filterScienceQuestionsByChapter(YASSER_SCIENCE_PLAYABLE_QUESTIONS,'chapter-6-earth-resources');
  assert.ok(questions.length>=20,`chapter 6=${questions.length}`);
  assert.ok(questions.every(question=>CHAPTER_SIX_UNITS.has(question.unit)));
  const current=filterScienceQuestionsByUnit(YASSER_SCIENCE_PLAYABLE_QUESTIONS,'unit-3-ecosystems-resources');
  assert.ok(current.every(question=>!CHAPTER_SIX_UNITS.has(question.unit)));
});

test('unit 3 quick, image and school exam sessions stay inside chapter 5',()=>{
  const questions=filterScienceQuestionsByUnit(YASSER_SCIENCE_PLAYABLE_QUESTIONS,'unit-3-ecosystems-resources');
  const visual=questions.filter(question=>question.assetId);
  assert.ok(visual.length>=7,`unit 3 visual=${visual.length}`);
  for(const mode of ['quick','exam']){
    const session=createScienceSession({mode,count:mode==='exam'?20:10,questions,rng:()=>.5});
    assert.equal(session.questions.length,mode==='exam'?20:10,mode);
    assert.ok(session.questions.every(question=>CHAPTER_FIVE_UNITS.has(question.unit)),mode);
  }
  const imageSession=createScienceSession({mode:'images',count:Math.min(10,visual.length),questions:visual,rng:()=>.5});
  assert.ok(imageSession.questions.length>=7);
  assert.ok(imageSession.questions.every(question=>question.assetId&&CHAPTER_FIVE_UNITS.has(question.unit)));
});

test('unit progress excludes attempts from other science units',()=>{
  const progress={points:999,attempts:[
    {questionId:'a',concept:'cell-theory',unit:'cells',isCorrect:true,earned:10,answeredAt:'2026-09-14T10:00:00.000Z'},
    {questionId:'b',concept:'roots',unit:'plant-processes',isCorrect:true,earned:10,answeredAt:'2026-09-14T10:01:00.000Z'},
    {questionId:'c',concept:'food-web',unit:'food-relations',isCorrect:true,earned:10,answeredAt:'2026-09-14T10:02:00.000Z'},
    {questionId:'d',concept:'biome',unit:'ecosystems',isCorrect:false,earned:0,answeredAt:'2026-09-14T10:03:00.000Z'},
    {questionId:'e',concept:'soil',unit:'earth-resources',isCorrect:true,earned:10,answeredAt:'2026-09-14T10:04:00.000Z'}
  ]};
  const unitThree=filterScienceProgressByUnit(progress,'unit-3-ecosystems-resources');
  assert.equal(unitThree.attempts.length,2);assert.equal(unitThree.points,10);assert.equal(unitThree.concepts.soil,undefined);
  const chapterOne=filterScienceProgressByChapter(progress,'chapter-1-cells');
  assert.equal(chapterOne.attempts.length,1);assert.equal(chapterOne.points,10);
});

test('science UI connects unit 3 visual assets and keeps learner wording neutral',()=>{
  const source=readFileSync(new URL('../src/modules/yasser/science/yasser-science.js',import.meta.url),'utf8');
  const chapters=readFileSync(new URL('../src/modules/yasser/science/science-chapters.js',import.meta.url),'utf8');
  const css=readFileSync(new URL('../src/modules/yasser/science/yasser-science.css',import.meta.url),'utf8');
  assert.match(source,/علوم الفصل الدراسي الأول/);
  assert.match(source,/scienceUnitSwitch/);
  assert.match(source,/YASSER_SCIENCE_UNIT3_VISUAL_ASSETS/);
  assert.match(source,/أسئلة بصرية بالصور والمخططات/);
  assert.doesNotMatch(source,/صور الكتاب/);
  assert.match(source,/الفصل الخامس —/);
  assert.match(chapters,/currentChapterId:'chapter-5-ecosystems'/);
  assert.match(chapters,/allowedChapterIds:Object\.freeze\(\['chapter-5-ecosystems'\]\)/);
  assert.match(source,/visualUnitQuestions/);
  assert.match(source,/scienceImageModal/);
  assert.match(source,/تكبير الصورة/);
  assert.match(css,/science-unit-switch/);
  assert.match(css,/science-unit-pick\.active/);
  assert.match(css,/max-height:590px/);
  assert.match(css,/cursor:zoom-in/);
});
