import test from 'node:test';
import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import {createPuzzleDefinition,isPuzzleSolved,puzzleBoardAspect,puzzlePiecePath} from '../src/modules/games/puzzle/puzzle-engine.js';

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

test('photo board keeps each selected image aspect ratio instead of cropping portraits into squares',()=>{
  assert.equal(puzzleBoardAspect(1049,1499),1049/1499);
  assert.equal(puzzleBoardAspect(1448,1086),4/3);
  assert.equal(puzzleBoardAspect(1024,1024),1);
  assert.equal(puzzleBoardAspect(0,1024),1);
});

test('mobile board fits its grid column and placed pieces do not get scaled twice',async()=>{
  const css=await readFile(new URL('../src/modules/games/puzzle/puzzle.css',import.meta.url),'utf8');
  assert.match(css,/\.fp-board \.fp-piece svg\{width:100%;height:100%/);
  assert.doesNotMatch(css,/\.fp-board \.fp-piece svg\{width:136%;height:136%/);
  assert.match(css,/\.fp-board\{width:min\(100%,86vw\)/);
  assert.match(css,/aspect-ratio:var\(--fp-board-aspect\)/);
});

test('mobile puzzle pieces keep touch input for drag while the tray scrolls horizontally',async()=>{
  const css=await readFile(new URL('../src/modules/games/puzzle/puzzle.css',import.meta.url),'utf8');
  const controller=await readFile(new URL('../src/modules/games/puzzle/puzzle-controller.js',import.meta.url),'utf8');
  assert.match(css,/\.fp-tray \.fp-piece\{[^}]*touch-action:none/);
  assert.match(controller,/drag\.mode==='scroll'&&tray\)\{tray\.scrollLeft/);
  assert.match(controller,/drag\.mode==='drag'\)\{floatPiece\(\)/);
});

test('puzzle setup has no empty board before start and displays an unambiguous progress counter',async()=>{
  const shell=await readFile(new URL('../src/modules/games/puzzle/puzzle-shell.js',import.meta.url),'utf8');
  assert.match(shell,/id="fpPlayArea" hidden/);
  assert.match(shell,/id="fpPictureChoices"/);
  assert.match(shell,/id="fpProgress" dir="ltr"/);
});

test('all eight supplied Yasser poses are bundled and selectable',async()=>{
  const controller=await readFile(new URL('../src/modules/games/puzzle/puzzle-controller.js',import.meta.url),'utf8');
  const thumbnails=await readFile(new URL('../assets/games/puzzle/thumbnails/yasser-pose-01.webp',import.meta.url));
  assert.ok(thumbnails.byteLength<20000,'selector thumbnail should stay small');
  for(let index=1;index<=8;index++){
    const name=`pose-${String(index).padStart(2,'0')}.png`;
    assert.ok(controller.includes(`assets/games/puzzle/yasser/${name}`),`missing gallery entry for ${name}`);
    await access(new URL(`../assets/games/puzzle/yasser/${name}`,import.meta.url));
    const thumbnail=`assets/games/puzzle/thumbnails/yasser-pose-${String(index).padStart(2,'0')}.webp`;
    assert.ok(controller.includes(thumbnail),`missing lightweight selector preview for pose ${index}`);
    await access(new URL(`../${thumbnail}`,import.meta.url));
  }
  assert.match(controller,/yasser-welcome/);
  assert.match(controller,/khaled-default/);
  assert.match(controller,/mashaal-default/);
});
