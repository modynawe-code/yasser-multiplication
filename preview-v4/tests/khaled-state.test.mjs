import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialKhaledState, recordKhaledAttempt } from '../src/modules/khaled/domain/state-model.js';
import { KHALED_STORAGE_KEY, createKhaledRepository } from '../src/modules/khaled/infrastructure/storage/local-storage-repository.js';

function memoryStorage(){
  const data=new Map();
  return{getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,value),data};
}

test('Khaled uses an isolated storage key',()=>{
  assert.equal(KHALED_STORAGE_KEY,'khaled_grade1_math_v1');
  assert.notEqual(KHALED_STORAGE_KEY,'yasser_mul_v4_preview');
});

test('wrong attempts remain recorded in Khaled progress',()=>{
  const state=createInitialKhaledState();
  const question={id:'q1',correctAnswer:3};
  recordKhaledAttempt(state,{skillId:'numbers-0-5',isCorrect:false,question,answer:2});
  assert.equal(state.totalAttempts,1);
  assert.equal(state.totalWrong,1);
  assert.equal(state.skills['numbers-0-5'].wrong,1);
  assert.deepEqual(state.skills['numbers-0-5'].recent,[false]);
});

test('Khaled repository round-trips progress',()=>{
  const storage=memoryStorage();
  const repository=createKhaledRepository(storage);
  const state=repository.load();
  state.totalAttempts=4;
  repository.save(state);
  assert.equal(repository.load().totalAttempts,4);
});
