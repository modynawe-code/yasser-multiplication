import test from 'node:test';
import assert from 'node:assert/strict';
import {learnerScopedStoragePrefix,resetLearnerScopedProgress} from '../src/shared/progress/learner-scoped-reset.js';

function createMemoryStorage(entries={}){
  const values=new Map(Object.entries(entries));
  return{
    get length(){return values.size;},
    key(index){return [...values.keys()][index]??null;},
    getItem(key){return values.has(key)?values.get(key):null;},
    setItem(key,value){values.set(String(key),String(value));},
    removeItem(key){values.delete(String(key));}
  };
}

test('learner scoped reset removes every subject store for only that learner',()=>{
  const storage=createMemoryStorage({
    'family-learning:yasser:science:v1':'science-progress',
    'family-learning:yasser:quran:v1':'quran-progress',
    'family-learning:khaled:science:v1':'khaled-science',
    'family_learning:mashaal':'mashaal-base',
    'family-ui:theme':'keep-me'
  });

  const removed=resetLearnerScopedProgress(storage,'YASSER');

  assert.deepEqual(new Set(removed),new Set([
    'family-learning:yasser:science:v1',
    'family-learning:yasser:quran:v1'
  ]));
  assert.equal(storage.getItem('family-learning:yasser:science:v1'),null);
  assert.equal(storage.getItem('family-learning:yasser:quran:v1'),null);
  assert.equal(storage.getItem('family-learning:khaled:science:v1'),'khaled-science');
  assert.equal(storage.getItem('family_learning:mashaal'),'mashaal-base');
  assert.equal(storage.getItem('family-ui:theme'),'keep-me');
});

test('khaled reset covers current and future khaled subject stores',()=>{
  const storage=createMemoryStorage({
    'family-learning:khaled:science:v1':'science',
    'family-learning:khaled:future-subject:v2':'future',
    'family-learning:yasser:science:v1':'yasser'
  });
  resetLearnerScopedProgress(storage,'khaled');
  assert.equal(storage.getItem('family-learning:khaled:science:v1'),null);
  assert.equal(storage.getItem('family-learning:khaled:future-subject:v2'),null);
  assert.equal(storage.getItem('family-learning:yasser:science:v1'),'yasser');
});

test('learner prefix requires an id',()=>{
  assert.throws(()=>learnerScopedStoragePrefix(''),/learner id is required/);
});
