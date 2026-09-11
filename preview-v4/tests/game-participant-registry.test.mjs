import test from 'node:test';
import assert from 'node:assert/strict';
import { getGameParticipant,listGameParticipants } from '../src/modules/games/core/game-participant-registry.js';
import { getLearnerProfile } from '../src/shared/learners/learner-registry.js';

test('fun participant registry exposes every registered family learner without a numeric cap',()=>{
  assert.deepEqual(listGameParticipants().map(item=>item.learnerId),['yasser','khaled','mashaal']);
  const mashaal=getGameParticipant('mashaal');
  const profile=getLearnerProfile('mashaal');
  assert.equal(mashaal.displayName,'مشاعل');
  assert.equal(mashaal.avatar,'assets/mashaal/choices/happy.webp');
  assert.equal(mashaal.celebrationAvatar,'assets/mashaal/choices/happy.webp');
  assert.equal(mashaal.symbol,profile.presentation.symbol);
});

test('approved family game artwork remains presentation data, not identity logic',()=>{
  const yasser=getGameParticipant('yasser');
  const khaled=getGameParticipant('khaled');
  const mashaal=getGameParticipant('mashaal');
  assert.match(yasser.avatar,/yasser\/welcome\.png$/);
  assert.match(yasser.celebrationAvatar,/yasser\/celebrate\.png$/);
  assert.match(khaled.avatar,/khaled\/khaled-point-thumbsup\.png$/);
  assert.match(khaled.celebrationAvatar,/khaled\/khaled-celebration\.png$/);
  assert.match(mashaal.avatar,/mashaal\/choices\/happy\.webp$/);
});

test('educational participant filtering follows provider capability rather than child names',()=>{
  const supported=new Set(['yasser','khaled']);
  const participants=listGameParticipants({supportsLearning:id=>supported.has(id)});
  assert.deepEqual(participants.map(item=>item.learnerId),['yasser','khaled']);
  assert.equal(participants.some(item=>item.learnerId==='mashaal'),false);
});
