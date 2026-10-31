import test from 'node:test';
import assert from 'node:assert/strict';
import {createQuranPracticeCloudSync,mergeQuranPracticeSnapshots,extractRemoteQuranPractice}
  from '../src/shared/quran/quran-practice-cloud-sync.js';
import {practiceStorageKey} from '../src/shared/quran/quran-practice-progress.js';

function memory(){
  const values=new Map();
  return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
}
function state(key,stage,stamp,attempts=1){
  return {version:1,records:{[key]:{stage,attempts,updatedAt:stamp}},
    last:{surahNumber:Number(key.split(':')[0]),ayahNumber:Number(key.split(':')[1]),stage,updatedAt:stamp}};
}
function fakeCloud(){
  const sessions=new Map();
  return {
    sessions,authenticated:true,
    isAuthenticated(){return this.authenticated;},
    async request(path,{method,body}={}){
      if(path==='/v1/sync/snapshot')
        return {sessions:[...sessions.values()]};
      if(path!=='/v1/sync/session'||method!=='POST')throw Error('unknown API request');
      if(!sessions.has(body.sessionId))sessions.set(body.sessionId,{...body});
      return {ok:true};
    }
  };
}
test('merging conflicting devices never downgrades a manually reviewed ayah',()=>{
  const old=state('1:2','reviewed','2026-10-01T10:00:00Z',5);
  const newer=state('1:2','listened','2026-10-02T10:00:00Z',2);
  const merged=mergeQuranPracticeSnapshots(old,newer,'yasser');
  assert.equal(merged.records['1:2'].stage,'reviewed');
  assert.equal(merged.records['1:2'].attempts,5);
  assert.equal(merged.last.updatedAt,newer.last.updatedAt);
});
test('two linked devices recover independent progress without rewriting other learners',async()=>{
  const api=fakeCloud(),phone=memory(),tablet=memory();
  phone.setItem(practiceStorageKey('khaled'),JSON.stringify(state('93:1','repeated','2026-10-01T10:00:00Z',3)));
  tablet.setItem(practiceStorageKey('khaled'),JSON.stringify(state('94:1','listened','2026-10-02T10:00:00Z',1)));
  tablet.setItem(practiceStorageKey('mashaal'),JSON.stringify(state('114:1','repeated','2026-10-03T10:00:00Z',2)));
  const a=createQuranPracticeCloudSync({authClient:api,storage:phone});
  const b=createQuranPracticeCloudSync({authClient:api,storage:tablet});
  assert.equal((await a.sync()).ok,true);
  const firstCount=api.sessions.size;
  assert.equal((await a.sync()).uploadedChunks,0,'unchanged progress must not post again');
  assert.equal(api.sessions.size,firstCount);
  assert.equal((await b.sync()).ok,true);
  assert.equal((await a.sync()).ok,true);
  await b.sync();
  const p=JSON.parse(phone.getItem(practiceStorageKey('khaled'))).records;
  const t=JSON.parse(tablet.getItem(practiceStorageKey('khaled'))).records;
  assert.deepEqual(p,t);
  assert.ok(p['93:1']&&p['94:1']);
  assert.equal(phone.getItem(practiceStorageKey('mashaal'))!==null,true);
  assert.equal(JSON.parse(phone.getItem(practiceStorageKey('mashaal'))).records['114:1'].stage,'repeated');
  assert.equal(phone.getItem(practiceStorageKey('yasser')),null);
});
test('invalid records, forged learner events and KG3 review scores are ignored',()=>{
  const bad={version:1,records:{'114:1':{stage:'reviewed',attempts:10,updatedAt:'2026-10-01T00:00:00Z'}}};
  const result=mergeQuranPracticeSnapshots({},bad,'mashaal');
  assert.deepEqual(result.records,{});
  const cloud={sessions:[{learnerId:'khaled',session:{kind:'family-quran-practice-v1',learnerId:'yasser',practice:bad}}]};
  assert.deepEqual(extractRemoteQuranPractice(cloud,'khaled').records,{});
});
test('offline authentication leaves local Quran practice intact',async()=>{
  const api=fakeCloud(),storage=memory(),key=practiceStorageKey('yasser');
  storage.setItem(key,JSON.stringify(state('38:2','listened','2026-10-01T00:00:00Z')));
  api.authenticated=false;
  const result=await createQuranPracticeCloudSync({authClient:api,storage}).sync();
  assert.equal(result.ok,false);
  assert.equal(api.sessions.size,0);
  assert.equal(JSON.parse(storage.getItem(key)).records['38:2'].stage,'listened');
});
