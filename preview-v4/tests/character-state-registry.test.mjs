import test from 'node:test';
import assert from 'node:assert/strict';
import { createCharacterStateRegistry } from '../src/shared/ui/character-state-registry.js';
import { MASHAAL_CHARACTER_STATE_PACK } from '../src/modules/mashaal/ui/mashaal-character-state-pack.js';
import { MASHAAL_ENCOURAGEMENT_PACK } from '../src/modules/mashaal/encouragement/mashaal-encouragement-pack.js';

test('character state registry is learner-neutral and supports future learner packs',()=>{
  const registry=createCharacterStateRegistry();
  registry.register('future-child',{defaultState:'ready',states:{ready:{assetKey:'future.character.ready'},happy:{assetKey:'future.character.happy'}}});
  assert.equal(registry.resolve('future-child','happy')?.assetKey,'future.character.happy');
  assert.equal(registry.resolve('future-child','missing')?.assetKey,'future.character.ready');
  assert.equal(registry.supports('future-child','ready'),true);
  assert.equal(registry.list('future-child').length,2);
});

test('every Mashaal encouragement cue points to a registered character state',()=>{
  const registry=createCharacterStateRegistry();
  registry.register('mashaal',MASHAAL_CHARACTER_STATE_PACK);
  for(const cues of Object.values(MASHAAL_ENCOURAGEMENT_PACK.cues)){
    for(const cue of cues){
      assert.equal(registry.supports('mashaal',cue.characterState),true,`missing character state ${cue.characterState}`);
      assert.ok(registry.resolve('mashaal',cue.characterState)?.assetKey.startsWith('mashaal.character.'));
    }
  }
  assert.equal(registry.list('mashaal').length,10);
});
