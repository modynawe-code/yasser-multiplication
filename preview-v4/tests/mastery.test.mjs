import test from 'node:test';
import assert from 'node:assert/strict';
import { isFactMastered, getFactMasteryLevel } from '../src/domain/mastery.js';
test('fact is not mastered after one correct answer',()=>{assert.equal(isFactMastered({attempts:1,correct:1,recent:[true]}),false);});
test('fact requires repeated recent success and acceptable lifetime accuracy',()=>{assert.equal(isFactMastered({attempts:4,correct:3,recent:[false,true,true,true]}),true);assert.equal(isFactMastered({attempts:5,correct:3,recent:[true,true,true]}),false);});
test('mastery level distinguishes new, learning and mastered',()=>{assert.equal(getFactMasteryLevel({attempts:0,correct:0,wrong:0,recent:[]}),'new');assert.equal(getFactMasteryLevel({attempts:2,correct:1,wrong:1,recent:[true,false]}),'review');assert.equal(getFactMasteryLevel({attempts:4,correct:4,wrong:0,recent:[true,true,true]}),'mastered');});
