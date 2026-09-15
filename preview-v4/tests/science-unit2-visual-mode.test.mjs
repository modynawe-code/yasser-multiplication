import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {YASSER_SCIENCE_PLAYABLE_QUESTIONS} from '../src/modules/yasser/science/science-question-bank.js';
import {YASSER_SCIENCE_VISUAL_ASSETS} from '../src/modules/yasser/science/science-visuals.js';
import {YASSER_SCIENCE_UNIT2_VISUAL_ASSETS} from '../src/modules/yasser/science/science-unit2-visuals.generated.js';
import {filterScienceQuestionsByUnit} from '../src/modules/yasser/science/science-chapters.js';

test('unit 2 image challenge has resolvable current visual questions',()=>{
  const assets={...YASSER_SCIENCE_VISUAL_ASSETS,...YASSER_SCIENCE_UNIT2_VISUAL_ASSETS};
  const questions=filterScienceQuestionsByUnit(YASSER_SCIENCE_PLAYABLE_QUESTIONS,'unit-2-life-processes');
  const visualQuestions=questions.filter(question=>question.assetId&&assets[question.assetId]);
  assert.ok(visualQuestions.length>=5,`unit 2 visual questions=${visualQuestions.length}`);
  assert.ok(visualQuestions.every(question=>assets[question.assetId]?.src));
});

test('science UI does not label visual questions as coming from the book',()=>{
  const source=readFileSync(new URL('../src/modules/yasser/science/yasser-science.js',import.meta.url),'utf8');
  assert.equal(source.includes('صور الكتاب'),false);
  assert.match(source,/أسئلة بصرية بالصور والمخططات/);
});
