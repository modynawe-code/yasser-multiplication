import test from 'node:test';
import assert from 'node:assert/strict';
import {createPuzzleDefinition,isPuzzleSolved,puzzlePiecePath} from '../src/modules/games/puzzle/puzzle-engine.js';

test('family photo puzzle creates matching interlocking edges for every neighboring piece',()=>{
  const puzzle=createPuzzleDefinition(4,{random:()=>0.3});
  assert.equal(puzzle.pieces.length,16);
  for(const piece of puzzle.pieces){
    if(piece.column<3){const right=puzzle.pieces[piece.id+1];assert.equal(piece.edges.right,-right.edges.left);}
    if(piece.row<3){const below=puzzle.pieces[piece.id+4];assert.equal(piece.edges.bottom,-below.edges.top);}
  }
});

test('jigsaw shuffle is never left in its solved order',()=>{
  const puzzle=createPuzzleDefinition(3,{random:()=>0.7});
  assert.notDeepEqual(puzzle.shuffled,[0,1,2,3,4,5,6,7,8]);
});

test('puzzle reports completion only after every image piece reaches its matching slot',()=>{
  assert.equal(isPuzzleSolved([0,1,2,3]),true);
  assert.equal(isPuzzleSolved([0,2,1,3]),false);
  assert.equal(isPuzzleSolved([]),false);
});

test('piece SVG path includes all four interlocking sides and closes cleanly',()=>{
  const path=puzzlePiecePath({top:0,right:1,bottom:-1,left:0},{tab:.09});
  assert.match(path,/M0 0/);
  assert.match(path,/C/);
  assert.match(path,/Z$/);
});
