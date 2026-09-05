import test from 'node:test';
import assert from 'node:assert/strict';
import { getScene, SCENES, VISUAL_ASSETS } from '../src/ui/visual/scene-manifest.js';

test('every semantic scene resolves to known asset variants',()=>{
  for(const [name,scene] of Object.entries(SCENES)){
    for(const character of ['yasser','assistant']){
      const state=scene[character];
      if(state===null)continue;
      assert.ok(VISUAL_ASSETS[character][state],`${name}.${character}.${state}`);
    }
  }
});

test('temporary feedback scenes return to the question scene',()=>{
  assert.equal(getScene('correct').returnTo,'question');
  assert.equal(getScene('wrong').returnTo,'question');
  assert.ok(getScene('correct').duration>0);
  assert.ok(getScene('wrong').duration>0);
});

test('exam-safe parent scene hides mascots',()=>{
  assert.equal(getScene('parent').yasser,null);
  assert.equal(getScene('parent').assistant,null);
});
