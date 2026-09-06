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

test('initial catalog covers turn-based simultaneous and realtime architecture paths',()=>{
  assert.equal(gameRegistry.get('xo').networkMode,'turn-based');
  assert.equal(gameRegistry.get('rock-paper-scissors').networkMode,'simultaneous');
  assert.equal(gameRegistry.get('number-race').networkMode,'realtime');
});

test('player context carries learner identity but no academic progress state',()=>{
  const player=createPlayerContext({playerId:'p1',learnerId:'khaled',displayName:'خالد'});
  assert.deepEqual(Object.keys(player).sort(),['displayName','learnerId','playerId','theme']);
  assert.equal(player.learnerId,'khaled');
});

test('learning adapter routes questions by learner through a provider boundary',async()=>{
  const calls=[];
  const adapter=createLearningAdapter({providers:{
    yasser:{nextChallenge:payload=>{calls.push(payload.player.learnerId);return{kind:'multiplication'};}},
    khaled:{nextChallenge:payload=>{calls.push(payload.player.learnerId);return{kind:'grade-one'};}}
  }});
  const yasser=createPlayerContext({playerId:'y',learnerId:'yasser',displayName:'ياسر'});
  const khaled=createPlayerContext({playerId:'k',learnerId:'khaled',displayName:'خالد'});
  assert.equal((await adapter.nextChallenge(yasser)).kind,'multiplication');
  assert.equal((await adapter.nextChallenge(khaled)).kind,'grade-one');
  assert.deepEqual(calls,['yasser','khaled']);
});
