import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/domain/state-model.js';
import { createInitialKhaledState } from '../src/modules/khaled/domain/state-model.js';
import { createInitialMashaalState } from '../src/modules/mashaal/domain/state-model.js';
import { recordMashaalEvidence } from '../src/modules/mashaal/application/progress-service.js';
import { createFamilySyncService } from '../src/shared/sync/family-sync-service.js';

function repo(initial){let value=structuredClone(initial);return{load:()=>structuredClone(value),save(next){value=structuredClone(next);return true;},peek:()=>structuredClone(value)};}

test('family sync sends immutable baselines before idempotent attempt batches',async()=>{
  const yasser=createInitialState(),khaled=createInitialKhaledState();
  yasser.attemptLog=[{attemptId:'yas-1',learnerId:'yasser',skillId:'table-2',table:2,multiplier:3,answer:6,correctAnswer:6,isCorrect:true,createdAt:'2026-09-05T00:00:00Z'}];
  khaled.attemptLog=[{attemptId:'kha-1',learnerId:'khaled',skillId:'numbers-0-5',questionId:'q',questionType:'count-select',answer:2,correctAnswer:3,isCorrect:false,createdAt:'2026-09-05T00:01:00Z'}];
  const calls=[],auth={isAuthenticated:()=>true,request:async(path,options)=>{calls.push({path,body:options?.body});return{ok:true};}};
  const service=createFamilySyncService({authClient:auth,yasserRepository:repo(yasser),khaledRepository:repo(khaled)});
  const result=await service.upload();
  assert.equal(calls[0].path,'/v1/sync/baseline');assert.equal(calls[0].body.learnerId,'yasser');
  assert.equal(calls[1].path,'/v1/sync/baseline');assert.equal(calls[1].body.learnerId,'khaled');
  const attemptCall=calls.find(call=>call.path==='/v1/sync/attempts');
  assert.deepEqual(attemptCall.body.attempts.map(a=>a.attemptId),['yas-1','kha-1']);
  assert.equal(result.attempts,2);assert.equal(result.evidence,0);
});

test('family sync keeps Mashaal developmental evidence separate from scored attempts',async()=>{
  const mashaal=createInitialMashaalState();
  recordMashaalEvidence(mashaal,{skillId:'count-and-quantity',evidence:{evidenceId:'msh-ev-1',type:'activity-completion',payload:{completed:true},createdAt:'2026-09-08T05:00:00Z'}});
  const calls=[],auth={isAuthenticated:()=>true,request:async(path,options)=>{calls.push({path,body:options?.body});return{ok:true};}};
  const service=createFamilySyncService({authClient:auth,yasserRepository:repo(createInitialState()),khaledRepository:repo(createInitialKhaledState()),mashaalRepository:repo(mashaal)});
  const result=await service.upload();
  assert.equal(calls.filter(call=>call.path==='/v1/sync/baseline').length,3);
  const evidenceCall=calls.find(call=>call.path==='/v1/sync/evidence');
  assert.equal(evidenceCall.body.evidence[0].learnerId,'mashaal');
  assert.equal(evidenceCall.body.evidence[0].evidenceId,'msh-ev-1');
  assert.equal(result.evidence,1);
});

test('cloud restore replays only history IDs missing from immutable baselines',async()=>{
  const yasser=createInitialState(),khaled=createInitialKhaledState(),mashaal=createInitialMashaalState();
  const yRepo=repo(createInitialState()),kRepo=repo(createInitialKhaledState()),mRepo=repo(createInitialMashaalState());
  const auth={isAuthenticated:()=>true,request:async path=>{assert.equal(path,'/v1/sync/snapshot');return{baselines:{yasser,khaled,mashaal},attempts:[
    {attemptId:'yas-r1',learnerId:'yasser',skillId:'table-2',table:2,multiplier:4,answer:8,correctAnswer:8,isCorrect:true,responseMs:500,createdAt:'2026-09-05T00:02:00Z'},
    {attemptId:'kha-r1',learnerId:'khaled',skillId:'numbers-0-5',questionId:'q2',questionType:'count-select',answer:1,correctAnswer:2,isCorrect:false,createdAt:'2026-09-05T00:03:00Z'}
  ],evidence:[{evidenceId:'msh-r1',learnerId:'mashaal',skillId:'count-and-quantity',type:'activity-completion',payload:{completed:true},createdAt:'2026-09-08T05:00:00Z'}]};}};
  const result=await createFamilySyncService({authClient:auth,yasserRepository:yRepo,khaledRepository:kRepo,mashaalRepository:mRepo}).restore();
  assert.equal(result.appliedYasser,1);assert.equal(result.appliedKhaled,1);assert.equal(result.appliedMashaal,1);
  assert.equal(yRepo.peek().totalAttempts,1);assert.equal(yRepo.peek().tables[2].facts[4].correct,1);
  assert.equal(kRepo.peek().totalAttempts,1);assert.equal(kRepo.peek().totalWrong,1);
  assert.equal(mRepo.peek().evidenceLog.length,1);assert.equal(mRepo.peek().skills['count-and-quantity'].status,'developing');
});
