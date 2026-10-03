import test from 'node:test';
import assert from 'node:assert/strict';
import { createCountByTensQuestion,createFindNumberPatternQuestion,createHundredChartQuestion,createSkipCountQuestion,createNumberPatternsRoundQuestion } from '../src/modules/khaled/domain/number-patterns-question-bank.js';
import { createAdvancedKhaledRound } from '../src/modules/khaled/domain/advanced-question-bank.js';
import { readFile } from 'node:fs/promises';

function fixedRandom(values){let i=0;return()=>values[i++%values.length];}

test('number-pattern generators keep valid arithmetic progressions',()=>{
  const random=fixedRandom([.2,.7,.4,.6,.1,.9,.3,.8,.5]);
  const tens=createCountByTensQuestion({random});assert.equal(tens.step,10);assert.ok(tens.options.includes(tens.correctAnswer));
  const pattern=createFindNumberPatternQuestion({random});assert.ok([1,2,5,10].includes(pattern.step));assert.ok(pattern.options.includes(pattern.correctAnswer));
  const chart=createHundredChartQuestion({random});assert.ok(chart.correctAnswer>=1&&chart.correctAnswer<=100);
  const skip=createSkipCountQuestion({random});assert.ok([2,5,10].includes(skip.step));assert.ok(skip.options.includes(skip.correctAnswer));
});

test('chapter eleven rotates through all four number-pattern families',()=>{
  assert.deepEqual(Array.from({length:4},(_,i)=>createNumberPatternsRoundQuestion(i).type),['count-by-tens','find-number-pattern','hundred-chart','skip-count']);
});

test('advanced dispatcher returns chapter eleven rounds',()=>{
  const round=createAdvancedKhaledRound({skillId:'number-patterns',count:8});
  assert.equal(round.length,8);assert.ok(round.every(question=>question.skillId==='number-patterns'));
});

test('chapter eleven renderer stays visual and modular',async()=>{
  const renderer=await readFile(new URL('../src/modules/khaled/ui/khaled-number-patterns-renderer.js',import.meta.url),'utf8');
  assert.match(renderer,/khaled-number-pattern-row/);assert.match(renderer,/khaled-hundred-mini/);
});
