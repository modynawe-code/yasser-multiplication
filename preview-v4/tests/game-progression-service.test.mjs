import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameProgressionService } from '../src/shared/progress/game-progression-service.js';

function memoryStorage(){const values=new Map();return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value))};}

function event(type,{learnerId='yasser',gameId='xo',sessionId='round-1',payload={}}={}){
  return{type,learnerId,gameId,sessionId,at:'2026-09-12T09:00:00.000Z',payload};
}

test('game progression awards shared XP and derives levels without game-specific code',()=>{
  const service=createGameProgressionService({storage:memoryStorage()});
  assert.deepEqual(service.get('yasser'),{xp:0,level:1,levelXp:100,currentLevelXp:0,xpToNextLevel:100,eventCounts:{}});
  service.record(event('game.completed'));
  service.record(event('game.won'));
  service.record(event('game.goal.reached',{payload:{goal:'win'}}));
  const progress=service.get('yasser');
  assert.equal(progress.xp,35);
  assert.equal(progress.level,1);
  assert.equal(progress.xpToNextLevel,65);
  assert.equal(progress.eventCounts['game.completed'],1);
  assert.equal(progress.eventCounts['game.won'],1);
});

test('game progression is idempotent and levels up from the shared policy',()=>{
  const service=createGameProgressionService({storage:memoryStorage(),xpPolicy:{'game.completed':50},levelXp:100});
  const first=event('game.completed',{sessionId:'a'});
  service.record(first);service.record(first);
  service.record(event('game.completed',{sessionId:'b'}));
  const progress=service.get('yasser');
  assert.equal(progress.xp,100);
  assert.equal(progress.level,2);
  assert.equal(progress.currentLevelXp,0);
  assert.equal(progress.xpToNextLevel,100);
  assert.equal(progress.eventCounts['game.completed'],2);
});

test('unscored events do not change XP',()=>{
  const service=createGameProgressionService({storage:memoryStorage()});
  service.record(event('game.started'));
  service.record(event('game.attempted'));
  service.record(event('game.retry'));
  assert.equal(service.get('yasser').xp,0);
});
