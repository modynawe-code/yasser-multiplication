import test from 'node:test';
import assert from 'node:assert/strict';
import { createChallengePresentationRegistry } from '../src/modules/games/core/challenge-presentation-registry.js';
import { createMashaalGameChallengePresenter } from '../src/modules/mashaal/ui/mashaal-game-challenge-presenter.js';
import { createMashaalGameLearningProvider } from '../src/modules/mashaal/application/game-learning-provider.js';
import { createInitialMashaalState } from '../src/modules/mashaal/domain/state-model.js';

test('challenge presentation registry keeps game core learner-neutral',()=>{
  const registry=createChallengePresentationRegistry();
  registry.register('demo',{labelForOption:(_challenge,value)=>`خيار ${value}`});
  assert.equal(registry.labelForOption({kind:'demo'},'A'),'خيار A');
  assert.equal(registry.labelForOption({kind:'unknown'},'A'),'A');
  assert.throws(()=>registry.register('demo',{labelForOption:()=>''}),/already registered/);
});

test('Mashaal game presenter reuses KG3 view-model labels instead of duplicating choice copy',()=>{
  const state=createInitialMashaalState();
  const provider=createMashaalGameLearningProvider({getState:()=>state,random:()=>0,now:()=>1});
  const challenge=provider.nextChallenge();
  const presenter=createMashaalGameChallengePresenter();
  const viewModel=presenter.getViewModel(challenge);
  assert.ok(viewModel);
  const option=challenge.options[0];
  const expected=viewModel.choices.find(item=>String(item.value)===String(option))?.label;
  assert.equal(presenter.labelForOption(challenge,option),expected);
});
