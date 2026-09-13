import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  DOMINO_PIP_POSITIONS,
  dominoHalfMarkup,
  dominoFaceMarkup,
  dominoAssetKey,
  dominoAssetPath,
  enhanceDominoTile
} from '../src/modules/games/domino/domino-visuals.js';

const referenceCss=readFileSync(new URL('../src/modules/games/domino/domino-reference-assets.css',import.meta.url),'utf8');

test('domino pip layouts match standard values 0 through 6',()=>{
  const expected={0:[],1:['mm'],2:['tl','br'],3:['tl','mm','br'],4:['tl','tr','bl','br'],5:['tl','tr','mm','bl','br'],6:['tl','ml','bl','tr','mr','br']};
  for(let value=0;value<=6;value++){
    assert.deepEqual([...DOMINO_PIP_POSITIONS[value]],expected[value]);
    assert.equal((dominoHalfMarkup(value).match(/class="domino-pip/g)||[]).length,value);
  }
});

test('reference asset paths use the upstream max-min naming',()=>{
  assert.equal(dominoAssetKey(2,6),'6-2');
  assert.equal(dominoAssetPath(2,6),'assets/domino/tiles/6-2.svg');
});

test('renderer covers the full double-six set with clean inline SVG faces',()=>{
  const tiles=[];
  for(let left=0;left<=6;left++)for(let right=left;right<=6;right++)tiles.push(dominoFaceMarkup(left,right));
  assert.equal(tiles.length,28);
  assert.equal(new Set(tiles).size,28);
  assert.ok(tiles.every(markup=>markup.includes('<svg class="domino-reference-face"')));
  assert.ok(tiles.every(markup=>markup.includes('viewBox="0 0 122 64"')));
  assert.ok(tiles.every(markup=>markup.includes('data-reference="assets/domino/tiles/')));
  assert.ok(tiles.every(markup=>!markup.includes('<img')));
});

test('inline face renders every requested pip inside the fixed tile viewport',()=>{
  const markup=dominoFaceMarkup(6,5);
  assert.equal((markup.match(/class="domino-svg-pip"/g)||[]).length,11);
  assert.equal((markup.match(/class="domino-svg-pip-highlight"/g)||[]).length,11);
  assert.match(markup,/data-left="6" data-right="5"/);
  assert.doesNotMatch(markup,/--domino-face-rotation/);
});

test('face-down renderer exposes no pip values',()=>{
  const markup=dominoFaceMarkup(6,5,{faceDown:true});
  assert.match(markup,/domino-back-face/);
  assert.doesNotMatch(markup,/domino-svg-pip/);
  assert.doesNotMatch(markup,/domino-pip/);
});

test('invalid pip values are rejected',()=>{
  assert.throws(()=>dominoHalfMarkup(-1),RangeError);
  assert.throws(()=>dominoHalfMarkup(7),RangeError);
});

test('visual enhancer marks doubles without deciding board orientation',()=>{
  const classes=new Set();
  const tile={
    dataset:{},
    children:[{tagName:'SPAN',textContent:'5'},{tagName:'I',textContent:''},{tagName:'SPAN',textContent:'5'}],
    classList:{
      toggle:(name,force)=>force?classes.add(name):classes.delete(name),
      add:name=>classes.add(name),
      remove:name=>classes.delete(name)
    },
    setAttribute(){},
    set innerHTML(value){this.rendered=value;}
  };
  assert.equal(enhanceDominoTile(tile),true);
  assert.equal(classes.has('is-double'),true);
  assert.equal(classes.has('vertical'),false);
  assert.match(tile.rendered,/data-reference="assets\/domino\/tiles\/5-5\.svg"/);
  assert.match(tile.rendered,/<svg class="domino-reference-face"/);
});

test('reference face CSS cannot return laid-out board tiles to relative flow',()=>{
  const genericRule=referenceCss.match(/\.domino-tile\[data-domino-visual="true"\]\s*\{([^}]*)\}/)?.[1]||'';
  assert.doesNotMatch(genericRule,/position\s*:\s*relative\s*!important/i);
  assert.match(referenceCss,/\.domino-board \.domino-board-tile\[data-domino-visual="true"\]\s*\{\s*position\s*:\s*absolute\s*!important\s*;/i);
});
