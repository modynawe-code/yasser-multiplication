import test from 'node:test';
import assert from 'node:assert/strict';
import {answerDotsBoxesEdge,BOXES_GAME,createDotsBoxesGame,listDotsBoxesEdges,startDotsBoxesGame} from '../src/modules/interactive-games/dots-boxes-engine.js';

const gameWith=(edges,extra={})=>({...startDotsBoxesGame(createDotsBoxesGame(['شمال','جنوب'],{random:()=>0}),{random:()=>0}),...extra,edges});
const openEdge=game=>listDotsBoxesEdges(game.size).find(edge=>game.edges[edge]===undefined);

test('uses Wafy board, seeding, majority and capture streak constants',()=>{
  const game=createDotsBoxesGame(['شمال','جنوب'],{random:()=>0});
  assert.deepEqual(BOXES_GAME,{SIZE:3,BOXES:9,EDGES:24,MAJORITY:5,STREAK_CAP:2,SEED:8});
  assert.equal(listDotsBoxesEdges().length,24);
  assert.equal(new Set(listDotsBoxesEdges()).size,24);
  assert.equal(Object.keys(game.edges).length,8);
  assert.deepEqual(game.teams,['الفريق البرتقالي','الفريق الأخضر']);
  assert.deepEqual(game.teamPlayers,[['شمال'],['جنوب']]);
  for(let row=0;row<3;row++)for(let col=0;col<3;col++)assert.ok(Object.keys(game.edges).filter(edge=>[`h-${row}-${col}`,`h-${row+1}-${col}`,`v-${row}-${col}`,`v-${row}-${col+1}`].includes(edge)).length<=2);
  assert.equal(game.started,false);
  assert.equal(startDotsBoxesGame(game,{random:()=>0}).started,true);
});

test('wrong and skipped answers pass the turn without claiming the picked edge',()=>{
  const game=startDotsBoxesGame(createDotsBoxesGame(['شمال','جنوب'],{random:()=>0}),{random:()=>0}),edge=openEdge(game);
  const wrong=answerDotsBoxesEdge(game,edge,'wrong'),none=answerDotsBoxesEdge(game,edge,'none');
  assert.equal(wrong.edges[edge],undefined);assert.equal(none.edges[edge],undefined);
  assert.equal(wrong.turn,1);assert.equal(none.turn,1);
  assert.equal(wrong.lastMove.verdict,'wrong');assert.equal(none.lastMove.verdict,'none');
});

test('a correct answer claims the edge and passes the turn when no square closes',()=>{
  const game=startDotsBoxesGame(createDotsBoxesGame(['شمال','جنوب'],{random:()=>0}),{random:()=>0}),edge=openEdge(game);
  const next=answerDotsBoxesEdge(game,edge,'correct');
  assert.equal(next.edges[edge],0);assert.equal(next.turn,1);
});

test('closing a square scores it for the team and retains turn below the streak cap',()=>{
  const game=gameWith({'h-0-0':0,'h-1-0':1,'v-0-0':0});
  const next=answerDotsBoxesEdge(game,'v-0-1','correct');
  assert.equal(next.scores[0],1);assert.equal(next.turn,0);assert.deepEqual(next.lastMove.closed,['0-0']);
});

test('passes the turn when two squares have been captured in the current streak',()=>{
  const game=gameWith({'h-0-0':0,'h-1-0':1,'v-0-0':0},{streak:1});
  const next=answerDotsBoxesEdge(game,'v-0-1','correct');
  assert.equal(next.scores[0],1);assert.equal(next.streak,2);assert.equal(next.turn,1);
});

test('five completed squares end the game immediately',()=>{
  const boxes={'2-0':0,'2-1':0,'2-2':0,'1-2':0};
  const edges={'h-0-0':0,'h-1-0':0,'v-0-0':0};
  const game=gameWith(edges,{boxes,scores:[4,0]});
  const next=answerDotsBoxesEdge(game,'v-0-1','correct');
  assert.equal(next.finished,true);assert.equal(next.winner,0);
});

test('ignores occupied edges and moves after the game ends',()=>{
  const game=startDotsBoxesGame(createDotsBoxesGame(['شمال','جنوب'],{random:()=>0}),{random:()=>0}),seed=Object.keys(game.edges)[0];
  assert.equal(answerDotsBoxesEdge(game,seed,'correct'),game);
  const finished={...game,finished:true,winner:0};
  assert.equal(answerDotsBoxesEdge(finished,openEdge(game),'correct'),finished);
});
