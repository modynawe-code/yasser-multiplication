import test from 'node:test';
import assert from 'node:assert/strict';
import { createSolidIdentifyQuestion,createSolidClassifyQuestion,createGeometryPatternQuestion,createPlaneSolidClassifyQuestion,createPlaneShapeQuestion,createEqualPartsQuestion,createHalfQuestion,createThirdQuarterQuestion,createGeometryFractionsRoundQuestion } from '../src/modules/khaled/domain/geometry-fractions-question-bank.js';
import { createAdvancedKhaledRound } from '../src/modules/khaled/domain/advanced-question-bank.js';
import { readFile } from 'node:fs/promises';

function fixedRandom(values){let i=0;return()=>values[i++%values.length];}

test('geometry and fraction generators always expose their correct visual answer',()=>{
  const random=fixedRandom([.2,.7,.4,.6,.1,.9,.3,.8,.5]);
  for(const question of [createSolidIdentifyQuestion({random}),createSolidClassifyQuestion({random}),createGeometryPatternQuestion({random}),createPlaneShapeQuestion({random}),createHalfQuestion({random}),createThirdQuarterQuestion({random})])assert.ok(question.options.includes(question.correctAnswer));
  const classify=createPlaneSolidClassifyQuestion({random});assert.ok(classify.options.some(option=>option.value===classify.correctAnswer));
  const parts=createEqualPartsQuestion({random});assert.ok(['yes','no'].includes(parts.correctAnswer));
});

test('chapter twelve round covers all eight lesson positions',()=>{
  assert.deepEqual(Array.from({length:8},(_,i)=>createGeometryFractionsRoundQuestion(i).type),['solid-identify','solid-classify','geometry-pattern','plane-solid-classify','plane-shape-identify','equal-parts','fraction-select','fraction-select']);
});

test('advanced dispatcher returns complete geometry-fractions rounds',()=>{
  const round=createAdvancedKhaledRound({skillId:'geometry-fractions',count:8});
  assert.equal(round.length,8);assert.ok(round.every(question=>question.skillId==='geometry-fractions'));
});

test('geometry renderer provides CSS-drawn solids, plane shapes and fraction partitions',async()=>{
  const renderer=await readFile(new URL('../src/modules/khaled/ui/khaled-geometry-fractions-renderer.js',import.meta.url),'utf8');
  const css=await readFile(new URL('../src/modules/khaled/ui/khaled-geometry-fractions.css',import.meta.url),'utf8');
  assert.match(renderer,/khaled-fraction/);assert.match(renderer,/solid-identify/);assert.match(css,/solid\.sphere/);assert.match(css,/flat\.triangle/);
});
