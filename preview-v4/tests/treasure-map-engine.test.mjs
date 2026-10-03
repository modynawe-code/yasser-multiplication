import test from 'node:test';
import assert from 'node:assert/strict';
import {newTreasureGame,setTreasurePlayer,startTreasureGame,stopsFor,TREASURE_ART,TREASURE_MAP,verdictTreasureGame} from '../src/modules/interactive-games/treasure-map-engine.js';

test('uses Wafy map stop limit and the source map coordinate sets',()=>{
  assert.deepEqual(TREASURE_MAP,{MIN_STOPS:6,MAX_STOPS:10,DEFAULT_STOPS:8});assert.equal(stopsFor(99),10);assert.equal(stopsFor(0),8);assert.equal(stopsFor(7.9),7);assert.equal(TREASURE_ART.landscape.trail.length,18);assert.equal(TREASURE_ART.portrait.trail.length,18);
  assert.deepEqual(TREASURE_ART.landscape.trail[0],{x:.345,y:.8});assert.deepEqual(TREASURE_ART.portrait.trail.at(-1),{x:.492,y:.583});
});

test('matches Wafy treasure run initial state and random start selection',()=>{
  const game=newTreasureGame(['أ','ب','ج'],4,'random');
  assert.equal(game.stops,4);assert.equal(game.at,0);assert.deepEqual(game.cleared,[]);assert.deepEqual(game.asked,[]);assert.equal(game.started,false);
  const started=startTreasureGame(game,()=>0);assert.equal(started.started,true);assert.equal(started.answering,'أ');
});
test('controlled mode starts without answerer and accepts a roster player',()=>{
  const started=startTreasureGame(newTreasureGame(['أ','ب'],3,'controlled'),()=>0);
  assert.equal(started.answering,null);assert.equal(setTreasurePlayer(started,'ب').answering,'ب');
});
test('wrong answer keeps the current stop and rotates the same question to another player',()=>{
  const game={...startTreasureGame(newTreasureGame(['أ','ب'],3,'random'),()=>0),answering:'أ'};
  const next=verdictTreasureGame(game,'q1','wrong',()=>0);
  assert.equal(next.at,0);assert.deepEqual(next.cleared,[]);assert.equal(next.answering,'ب');assert.deepEqual(next.asked,['q1']);
});
test('correct answer clears a stop and completes after the configured stop count',()=>{
  const game={...startTreasureGame(newTreasureGame(['أ','ب'],2,'random'),()=>0),answering:'أ'};
  const next=verdictTreasureGame(game,'q1','correct',()=>0),done=verdictTreasureGame({...next,answering:'ب'},'q2','correct',()=>0);
  assert.equal(next.at,1);assert.deepEqual(next.cleared,['q1']);assert.equal(next.finished,false);
  assert.equal(done.at,2);assert.deepEqual(done.cleared,['q1','q2']);assert.equal(done.finished,true);
});
