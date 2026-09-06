import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/domain/state-model.js';
import { createInitialKhaledState } from '../src/modules/khaled/domain/state-model.js';
import { createPlayerContext } from '../src/modules/games/core/player-context.js';
import { createGameLearningAdapter } from '../src/modules/games/learning/game-learning-providers.js';

function cyclingRandom(){
  const values=[.11,.37,.73,.22,.58,.91,.44,.67,.29];let index=0;
  return()=>values[index++%values.length];
}

function setup(){
  const yasserState=createInitialState(),khaledState=createInitialKhaledState();
  let yasserSaves=0,khaledSaves=0;
  const adapter=createGameLearningAdapter({
    getYasserState:()=>yasserState,
    saveYasserState:()=>{yasserSaves+=1;},
    getKhaledState:()=>khaledState,
    saveKhaledState:()=>{khaledSaves+=1;},
    random:cyclingRandom()
  });
  return{adapter,yasserState,khaledState,getSaves:()=>({yasserSaves,khaledSaves})};
}

test('Yasser game challenge uses selected multiplication learning and records a real attempt',async()=>{
  const {adapter,yasserState,getSaves}=setup();
  const player=createPlayerContext({playerId:'yasser',learnerId:'yasser',displayName:'ياسر'});
  const challenge=await adapter.nextChallenge(player,{gameId:'xo'});
  assert.equal(challenge.kind,'multiplication');
  assert.equal(challenge.options.length,3);
  assert.ok(challenge.options.includes(challenge.correctAnswer));
  const before=yasserState.totalAttempts;
  await adapter.recordChallenge(player,{challenge,answer:challenge.correctAnswer,isCorrect:true,responseMs:900});
  assert.equal(yasserState.totalAttempts,before+1);
  assert.equal(yasserState.totalWrong,0);
  assert.equal(getSaves().yasserSaves,1);
});

test('Khaled game challenge stays first-grade visual and records in Khaled only',async()=>{
  const {adapter,yasserState,khaledState,getSaves}=setup();
  const player=createPlayerContext({playerId:'khaled',learnerId:'khaled',displayName:'خالد'});
  const challenge=await adapter.nextChallenge(player,{gameId:'xo'});
  assert.equal(challenge.kind,'count-dots');
  assert.equal(challenge.visual.kind,'dots');
  assert.ok(challenge.options.includes(challenge.correctAnswer));
  const yasserBefore=yasserState.totalAttempts,khaledBefore=khaledState.totalAttempts;
  await adapter.recordChallenge(player,{challenge,answer:challenge.correctAnswer,isCorrect:true,responseMs:1000});
  assert.equal(khaledState.totalAttempts,khaledBefore+1);
  assert.equal(yasserState.totalAttempts,yasserBefore);
  assert.equal(getSaves().khaledSaves,1);
});
