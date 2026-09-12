import test from 'node:test';
import assert from 'node:assert/strict';
import { defineGame } from '../src/modules/games/core/game-contract.js';
import { createGameRegistry } from '../src/modules/games/core/game-registry.js';
import { createPlayerContext } from '../src/modules/games/core/player-context.js';
import { createLearningAdapter } from '../src/modules/games/core/learning-adapter.js';
import { gameRegistry } from '../src/modules/games/game-catalog.js';

test('game contract rejects online games without a network mode',()=>{
  assert.throws(()=>defineGame({id:'bad-game',title:'Bad',category:'fun',playModes:['online'],networkMode:'none'}));
});

test('registry filters games without hardcoding the games home screen',()=>{
  const registry=createGameRegistry([
    {id:'one',title:'One',category:'fun',playModes:['solo'],networkMode:'none'},
    {id:'two',title:'Two',category:'educational',playModes:['solo','online'],networkMode:'turn-based'}
  ]);
  assert.deepEqual(registry.list({playMode:'online'}).map(game=>game.id),['two']);
  assert.deepEqual(registry.list({category:'fun'}).map(game=>game.id),['one']);
});

test('initial catalog covers the active online architecture paths',()=>{
  assert.equal(gameRegistry.get('xo').networkMode,'turn-based');
  assert.equal(gameRegistry.get('rock-paper-scissors').networkMode,'simultaneous');
  assert.equal(gameRegistry.get('domino').networkMode,'turn-based');
  assert.equal(gameRegistry.get('number-race'),null);
});

test('player context carries learner identity but no academic progress state',()=>{
  const player=createPlayerContext({playerId:'p1',learnerId:'khaled',displayName:'خالد'});
  assert.deepEqual(Object.keys(player).sort(),['displayName','learnerId','playerId','theme']);
  assert.equal(player.learnerId,'khaled');
});

test('player context accepts any safe future learner slug instead of a fixed child list',()=>{
  const future=createPlayerContext({playerId:'future-player',learnerId:'future-child',displayName:'طفل جديد'});
  assert.equal(future.learnerId,'future-child');
  assert.equal(future.displayName,'طفل جديد');
  assert.throws(()=>createPlayerContext({playerId:'bad',learnerId:'../unsafe'}));
});

test('learning adapter routes questions and exposes educational eligibility by provider registration',async()=>{
  const calls=[];
  const adapter=createLearningAdapter({providers:{
    yasser:{nextChallenge:payload=>{calls.push(payload.player.learnerId);return{kind:'multiplication'};}},
    khaled:{nextChallenge:payload=>{calls.push(payload.player.learnerId);return{kind:'grade-one'};}}
  }});
  const yasser=createPlayerContext({playerId:'y',learnerId:'yasser',displayName:'ياسر'});
  const khaled=createPlayerContext({playerId:'k',learnerId:'khaled',displayName:'خالد'});
  assert.equal(adapter.supports('yasser'),true);
  assert.equal(adapter.supports('khaled'),true);
  assert.equal(adapter.supports('mashaal'),false);
  assert.equal(adapter.supports('future-child'),false);
  assert.deepEqual(adapter.listSupportedLearnerIds(),['yasser','khaled']);
  assert.equal((await adapter.nextChallenge(yasser)).kind,'multiplication');
  assert.equal((await adapter.nextChallenge(khaled)).kind,'grade-one');
  assert.deepEqual(calls,['yasser','khaled']);
});
