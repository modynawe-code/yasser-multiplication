import test from 'node:test';
import assert from 'node:assert/strict';
import {lettersNeighbors,lettersWinningPath,newLettersBoard,newLettersGame,pickLetterCell,startLettersGame,verdictLetterCell} from '../src/modules/interactive-games/letters-challenge-engine.js';

test('builds Wafy 5x5 board with unclaimed letters',()=>{const board=newLettersBoard(()=>0);assert.equal(board.length,5);assert.equal(board.flat().length,25);assert.ok(board.flat().every(cell=>cell.owner===null&&cell.letter));});
test('uses odd-row hex adjacency and keeps neighbors inside board',()=>{assert.deepEqual(lettersNeighbors(0,0),[[0,1],[1,0]]);assert.ok(lettersNeighbors(1,0).some(([row,col])=>row===0&&col===1));});
test('matches Wafy paths: orange top-to-bottom, green side-to-side',()=>{
  let board=newLettersBoard(()=>0);board=board.map((row,r)=>row.map((cell,c)=>c===2?{...cell,owner:'orange'}:cell));
  assert.equal(lettersWinningPath(board,'orange'),true);assert.equal(lettersWinningPath(board,'green'),false);
  board=board.map((row,r)=>row.map((cell,c)=>c===2?{...cell,owner:r===2?null:'orange'}:cell));assert.equal(lettersWinningPath(board,'orange'),false);
  board=newLettersBoard(()=>0).map((row,r)=>row.map((cell,c)=>r===2?{...cell,owner:'green'}:cell));
  assert.equal(lettersWinningPath(board,'green'),true);
});
test('a correct response claims the picked letter; a wrong response leaves it open',()=>{
  const started=startLettersGame(newLettersGame(['A','B'],()=>0),()=>0),cell=started.board[2][2];
  const picked=pickLetterCell(started,2,2),wrong=verdictLetterCell(picked,'wrong');
  assert.equal(wrong.board[2][2].owner,null);assert.equal(wrong.turn,'green');
  const correct=verdictLetterCell(picked,'correct');assert.equal(correct.board[2][2].owner,'orange');assert.equal(correct.turn,'orange');
  assert.equal(cell.owner,null);
});
