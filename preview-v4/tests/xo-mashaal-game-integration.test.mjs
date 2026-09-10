import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createInitialMashaalState } from '../src/modules/mashaal/domain/state-model.js';
import { createMashaalGameLearningProvider } from '../src/modules/mashaal/application/game-learning-provider.js';
import { createChallengePresentationRegistry } from '../src/modules/games/core/challenge-presentation-registry.js';
import { createMashaalGameChallengePresenter } from '../src/modules/mashaal/ui/mashaal-game-challenge-presenter.js';

async function source(path){return readFile(new URL(path,import.meta.url),'utf8');}

test('Mashaal game provider exposes KG3 choice challenges and keeps retry evidence distinct',()=>{
  const state=createInitialMashaalState();
  let saves=0;
  const provider=createMashaalGameLearningProvider({getState:()=>state,saveState:()=>{saves+=1;},random:()=>0,now:()=>12345});
  const challenge=provider.nextChallenge();
  assert.equal(challenge.learnerId,'mashaal');
  assert.equal(challenge.kind,'kg3-choice');
  assert.ok(challenge.options.length>=2&&challenge.options.length<=4);
  assert.ok(challenge.options.includes(challenge.correctAnswer));
  const wrong=challenge.options.find(value=>String(value)!==String(challenge.correctAnswer));
  assert.notEqual(wrong,undefined);

  const first=provider.recordChallenge({result:{challenge,answer:wrong,responseMs:800,attemptNumber:1}});
  const second=provider.recordChallenge({result:{challenge,answer:challenge.correctAnswer,responseMs:1200,attemptNumber:2}});
  assert.ok(first);
  assert.ok(second);
  assert.notEqual(first.evidenceId,second.evidenceId);
  assert.equal(state.evidenceLog.length,2);
  assert.equal(saves,2);
});

test('KG3 presenter is registered by challenge kind and resolves the activity option label',()=>{
  const state=createInitialMashaalState();
  const provider=createMashaalGameLearningProvider({getState:()=>state,random:()=>0,now:()=>1});
  const challenge=provider.nextChallenge();
  const registry=createChallengePresentationRegistry();
  registry.register('kg3-choice',createMashaalGameChallengePresenter());
  assert.equal(registry.has(challenge.kind),true);
  const label=registry.labelForOption(challenge,challenge.options[0]);
  assert.equal(typeof label,'string');
  assert.ok(label.length>0);
});

test('XO consumes a generic presentation registry instead of importing Mashaal UI directly',async()=>{
  const controller=await source('../src/modules/games/games-controller.js');
  assert.match(controller,/challengePresentations/);
  assert.match(controller,/renderXoChallengePresentation/);
  assert.doesNotMatch(controller,/from ['"][^'"]*modules\/mashaal\//);
  assert.match(controller,/attemptNumber=challengeState\.attempts\+1/);
});

test('composition root injects Mashaal learning and presentation capabilities without replacing existing learners',async()=>{
  const main=await source('../src/main.js');
  assert.match(main,/createMashaalGameLearningProvider/);
  assert.match(main,/additionalProviders:\{mashaal:mashaalGameLearning\}/);
  assert.match(main,/challengePresentations\.register\('kg3-choice'/);
  assert.match(main,/createGamesController\(\{learningAdapter:gameLearning,challengePresentations/);
  assert.match(main,/getYasserState/);
  assert.match(main,/getKhaledState/);
});
