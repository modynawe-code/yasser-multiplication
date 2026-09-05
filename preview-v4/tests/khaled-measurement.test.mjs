import test from 'node:test';
import assert from 'node:assert/strict';
import { createLengthCompareQuestion,createNonstandardLengthQuestion,createMeasurementGuessQuestion,createMassCompareQuestion,createCapacityCompareQuestion,createMeasurementRoundQuestion } from '../src/modules/khaled/domain/measurement-question-bank.js';
import { createAdvancedKhaledRound } from '../src/modules/khaled/domain/advanced-question-bank.js';
import { readFile } from 'node:fs/promises';

function fixedRandom(values){let i=0;return()=>values[i++%values.length];}

test('measurement generators keep valid answers and ranges',()=>{
  const random=fixedRandom([.2,.8,.9,.3,.6,.1,.7,.4,.5]);
  const length=createLengthCompareQuestion({random});
  assert.notEqual(length.left,length.right);assert.ok(['left','right'].includes(length.correctAnswer));
  const units=createNonstandardLengthQuestion({random});
  assert.ok(units.units>=2&&units.units<=8);assert.ok(units.options.includes(units.correctAnswer));
  const guess=createMeasurementGuessQuestion({random});
  assert.ok(guess.units>=3&&guess.units<=9);assert.ok(guess.options.includes(guess.correctAnswer));
  const mass=createMassCompareQuestion({random});
  assert.notEqual(mass.left,mass.right);assert.ok(['left','right'].includes(mass.correctAnswer));
  const capacity=createCapacityCompareQuestion({random});
  assert.notEqual(capacity.left,capacity.right);assert.ok(['left','right'].includes(capacity.correctAnswer));
});

test('chapter ten rotates through all five measurement activity families',()=>{
  assert.deepEqual(Array.from({length:5},(_,i)=>createMeasurementRoundQuestion(i).type),['length-compare','nonstandard-length','measurement-guess-check','mass-compare','capacity-compare']);
});

test('advanced dispatcher returns complete measurement rounds and ignores core skills',()=>{
  const round=createAdvancedKhaledRound({skillId:'measurement',count:8});
  assert.equal(round.length,8);assert.ok(round.every(question=>question.skillId==='measurement'));
  assert.equal(createAdvancedKhaledRound({skillId:'numbers-0-5',count:8}),null);
});

test('measurement renderer delegates all chapter-ten types',async()=>{
  const renderer=await readFile(new URL('../src/modules/khaled/ui/khaled-measurement-renderer.js',import.meta.url),'utf8');
  for(const type of ['length-compare','nonstandard-length','measurement-guess-check','mass-compare','capacity-compare'])assert.match(renderer,new RegExp(type));
  assert.match(renderer,/data-measure-answer/);
});
