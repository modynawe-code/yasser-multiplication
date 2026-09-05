import test from 'node:test';
import assert from 'node:assert/strict';
import { getScene, SCENES } from '../src/ui/visual/scene-manifest.js';
import { VISUAL_ASSETS } from '../src/ui/visual/character-assets.js';

test('every semantic scene resolves to a known visual asset',()=>{
  for(const [name,scene] of Object.entries(SCENES)){
    for(const character of ['yasser','assistant']){
      const state=scene[character];
      if(state===null)continue;
      assert.ok(VISUAL_ASSETS[character]?.[state],`${name}.${character}.${state}`);
    }
  }
});

test('temporary feedback scenes return to the calm question state',()=>{
  assert.equal(getScene('correct').returnTo,'question');
  assert.equal(getScene('wrong').returnTo,'question');
  assert.ok(getScene('correct').duration>0);
  assert.ok(getScene('wrong').duration>0);
});

test('exam and parent scenes remain distraction free',()=>{
  for(const sceneName of ['exam','parent']){
    assert.equal(getScene(sceneName).yasser,null);
    assert.equal(getScene(sceneName).assistant,null);
  }
});

test('result scenes use distinct visual states',()=>{
  assert.equal(getScene('result-developing').yasser,'encourage');
  assert.equal(getScene('result-good').yasser,'mastered');
  assert.equal(getScene('result-excellent').yasser,'celebrate');
});
