import test from 'node:test';
import assert from 'node:assert/strict';
import { createMashaalLocalStorageRepository } from '../src/modules/mashaal/infrastructure/local-storage-repository.js';

test('Mashaal local repository is isolated from existing learner storage',()=>{
  const data=new Map();
  const storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
  const repo=createMashaalLocalStorageRepository(storage);
  const state=repo.load();
  state.skills.patterns.status='developing';
  assert.equal(repo.save(state),true);
  assert.equal(repo.load().skills.patterns.status,'developing');
  assert.ok([...data.keys()].every(key=>key.includes('mashaal')));
});
