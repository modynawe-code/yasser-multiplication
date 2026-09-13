import test from 'node:test';
import assert from 'node:assert/strict';
import {DOMINO_PIP_POSITIONS,dominoHalfMarkup,dominoFaceMarkup} from '../src/modules/games/domino/domino-visuals.js';

test('domino pip layouts match standard values 0 through 6',()=>{
  const expected={0:[],1:['mm'],2:['tl','br'],3:['tl','mm','br'],4:['tl','tr','bl','br'],5:['tl','tr','mm','bl','br'],6:['tl','ml','bl','tr','mr','br']};
  for(let value=0;value<=6;value++){
    assert.deepEqual([...DOMINO_PIP_POSITIONS[value]],expected[value]);
    const markup=dominoHalfMarkup(value);
    assert.equal((markup.match(/class="domino-pip/g)||[]).length,value);
  }
});

test('renderer covers the full double-six set of 28 unique tiles',()=>{
  const tiles=[];
  for(let left=0;left<=6;left++)for(let right=left;right<=6;right++)tiles.push(dominoFaceMarkup(left,right));
  assert.equal(tiles.length,28);
  assert.equal(new Set(tiles).size,28);
});

test('face-down renderer exposes no pip values',()=>{
  const markup=dominoFaceMarkup(6,5,{faceDown:true});
  assert.match(markup,/domino-back-face/);
  assert.doesNotMatch(markup,/domino-pip/);
});

test('invalid pip values are rejected',()=>{
  assert.throws(()=>dominoHalfMarkup(-1),RangeError);
  assert.throws(()=>dominoHalfMarkup(7),RangeError);
});
