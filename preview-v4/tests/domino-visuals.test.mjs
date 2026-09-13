import test from 'node:test';
import assert from 'node:assert/strict';
import {DOMINO_PIP_POSITIONS,dominoHalfMarkup,dominoFaceMarkup,decorateBoard} from '../src/modules/games/domino/domino-visuals.js';

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

function fakeTile(initialClasses=[]){
  const classes=new Set(initialClasses);
  return {
    classList:{
      add:(...values)=>values.forEach(value=>classes.add(value)),
      remove:(...values)=>values.forEach(value=>classes.delete(value)),
      toggle:(value,force)=>{
        if(force===undefined){
          if(classes.has(value)){classes.delete(value);return false;}
          classes.add(value);return true;
        }
        if(force)classes.add(value);else classes.delete(value);
        return force;
      },
      contains:value=>classes.has(value)
    },
    style:{setProperty(){}}
  };
}

test('board keeps regular tiles horizontal and renders doubles perpendicular',()=>{
  const regular=fakeTile(['vertical','chain-turn']);
  const double=fakeTile(['is-double','chain-turn']);
  const board={querySelectorAll:()=>[regular,double]};
  decorateBoard({querySelector:selector=>selector==='#dominoBoard'?board:null});

  assert.equal(regular.classList.contains('vertical'),false);
  assert.equal(double.classList.contains('vertical'),true);
  assert.equal(regular.classList.contains('chain-turn'),false);
  assert.equal(double.classList.contains('chain-turn'),false);
});
