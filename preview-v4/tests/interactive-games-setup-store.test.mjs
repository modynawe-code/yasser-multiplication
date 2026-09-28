import test from 'node:test';
import assert from 'node:assert/strict';
import {independentGameSetupStorageKey,loadIndependentGameSetup,saveIndependentGameSetup} from '../src/modules/interactive-games/setup-store.js';

function memoryStorage(){const values=new Map();return{getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};}

test('stores independent participants and wheel groups under a game-only key',()=>{
  const storage=memoryStorage();
  saveIndependentGameSetup({participants:[' ياسر ','خالد','ياسر'],groups:['الأول','الثاني']},storage);
  assert.deepEqual(loadIndependentGameSetup(storage),{participants:['ياسر','خالد'],groups:['الأول','الثاني']});
  assert.equal(independentGameSetupStorageKey(),'independent-games-setup-v1');
});

test('ignores malformed saved game setup and keeps the game section usable',()=>{
  const storage={getItem:()=>'{bad',setItem(){}};
  assert.deepEqual(loadIndependentGameSetup(storage),{participants:[],groups:[]});
});

test('keeps the current session usable when local storage is unavailable',()=>{
  const storage={getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}};
  assert.deepEqual(loadIndependentGameSetup(storage),{participants:[],groups:[]});
  assert.deepEqual(saveIndependentGameSetup({participants:['أ'],groups:['ب']},storage),{participants:['أ'],groups:['ب']});
});
