import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createInitialState,normalizeState,applyYasserAttemptEvent } from '../src/domain/state-model.js';
import { createInitialKhaledState,normalizeKhaledState,applyKhaledAttemptEvent } from '../src/modules/khaled/domain/state-model.js';
import { createInitialMashaalState,normalizeMashaalState } from '../src/modules/mashaal/domain/state-model.js';
import { recordMashaalEvidence } from '../src/modules/mashaal/application/progress-service.js';
import { createFamilySyncCapabilityRegistry } from '../src/shared/sync/family-sync-capability-registry.js';
import { createFamilySyncService } from '../src/shared/sync/family-sync-service.js';

function repo(initial){let value=structuredClone(initial);return{load:()=>structuredClone(value),save(next){value=structuredClone(next);return true;},peek:()=>structuredClone(value)};}
function registryFor({yasserRepository=null,khaledRepository=null,mashaalRepository=null}={}){
  const registry=createFamilySyncCapabilityRegistry();
  if(yasserRepository)registry.register('yasser',{repository:yasserRepository,normalizeState,getAttempts:state=>state.attemptLog||[],applyAttempt:applyYasserAttemptEvent,getSessions:state=>state.sessions||[]});
  if(khaledRepository)registry.register('khaled',{repository:khaledRepository,normalizeState:normalizeKhaledState,getAttempts:state=>state.attemptLog||[],applyAttempt:applyKhaledAttemptEvent,getSessions:state=>state.sessions||[]});
  if(mashaalRepository)registry.register('mashaal',{repository:mashaalRepository,normalizeState:normalizeMashaalState,getEvidence:state=>state.evidenceLog||[],applyEvidence:(state,evidence)=>recordMashaalEvidence(state,{skillId:evidence.skillId,evidence}),getSessions:state=>state.sessions||[]});
  return registry;
}

test('family sync sends registered learner baselines before idempotent event batches',async()=>{
  const yasser=createInitialState(),khaled=createInitialKhaledState(),mashaal=createInitialMashaalState();
  yasser.attemptLog=[{attemptId:'yas-1',learnerId:'yasser',skillId:'table-2',table:2,multiplier:3,answer:6,correctAnswer:6,isCorrect:true,createdAt:'2026-09-05T00:00:00Z'}];
  khaled.attemptLog=[{attemptId:'kha-1',learnerId:'khaled',skillId:'numbers-0-5',questionId:'q',questionType:'count-select',answer:2,correctAnswer:3,isCorrect:false,createdAt:'2026-09-05T00:01:00Z'}];
  const mashaalSkill=Object.keys(mashaal.skills)[0];
  mashaal.evidenceLog=[{evidenceId:'mas-1',learnerId:'mashaal',skillId:mashaalSkill,type:'digital-attempt',createdAt:'2026-09-05T00:02:00Z',payload:{completed:true}}];
  const calls=[],auth={isAuthenticated:()=>true,request:async(path,options)=>{calls.push({path,body:options?.body});return{ok:true};}};
  const registry=registryFor({yasserRepository:repo(yasser),khaledRepository:repo(khaled),mashaalRepository:repo(mashaal)});
  const result=await createFamilySyncService({authClient:auth,capabilityRegistry:registry}).upload();
  assert.deepEqual(calls.filter(call=>call.path==='/v1/sync/baseline').map(call=>call.body.learnerId),['yasser','khaled','mashaal']);
  const attemptCall=calls.find(call=>call.path==='/v1/sync/attempts');
  assert.deepEqual(attemptCall.body.attempts.map(a=>a.attemptId),['yas-1','kha-1']);
  const evidenceCall=calls.find(call=>call.path==='/v1/sync/evidence');
  assert.deepEqual(evidenceCall.body.evidence.map(item=>item.evidenceId),['mas-1']);
  assert.equal(result.learners,3);assert.equal(result.attempts,2);assert.equal(result.evidence,1);
});

test('cloud restore routes immutable events through each learner capability without name branches in the service',async()=>{
  const yasser=createInitialState(),khaled=createInitialKhaledState(),mashaal=createInitialMashaalState();
  const yRepo=repo(createInitialState()),kRepo=repo(createInitialKhaledState()),mRepo=repo(createInitialMashaalState());
  const mashaalSkill=Object.keys(mashaal.skills)[0];
  const auth={isAuthenticated:()=>true,request:async path=>{assert.equal(path,'/v1/sync/snapshot');return{baselines:{yasser,khaled,mashaal},attempts:[
    {attemptId:'yas-r1',learnerId:'yasser',skillId:'table-2',table:2,multiplier:4,answer:8,correctAnswer:8,isCorrect:true,responseMs:500,createdAt:'2026-09-05T00:02:00Z'},
    {attemptId:'kha-r1',learnerId:'khaled',skillId:'numbers-0-5',questionId:'q2',questionType:'count-select',answer:1,correctAnswer:2,isCorrect:false,createdAt:'2026-09-05T00:03:00Z'}
  ],evidence:[{evidenceId:'mas-r1',learnerId:'mashaal',skillId:mashaalSkill,type:'activity-completion',createdAt:'2026-09-05T00:04:00Z',payload:{completed:true}}],sessions:[]};}};
  const registry=registryFor({yasserRepository:yRepo,khaledRepository:kRepo,mashaalRepository:mRepo});
  const result=await createFamilySyncService({authClient:auth,capabilityRegistry:registry}).restore();
  assert.equal(result.applied.yasser.attempts,1);assert.equal(result.applied.khaled.attempts,1);assert.equal(result.applied.mashaal.evidence,1);
  assert.equal(result.attempts,2);assert.equal(result.evidence,1);
  assert.equal(yRepo.peek().totalAttempts,1);assert.equal(yRepo.peek().tables[2].facts[4].correct,1);
  assert.equal(kRepo.peek().totalAttempts,1);assert.equal(kRepo.peek().totalWrong,1);
  assert.equal(mRepo.peek().evidenceLog.some(item=>item.evidenceId==='mas-r1'),true);
});

test('sync service core is learner-neutral while main owns stage-specific adapters',async()=>{
  const service=await readFile(new URL('../src/shared/sync/family-sync-service.js',import.meta.url),'utf8');
  const main=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
  assert.doesNotMatch(service,/yasserRepository|khaledRepository|mashaalRepository|applyYasser|applyKhaled|recordMashaal/);
  assert.match(service,/capabilityRegistry\.list\(\)/);
  assert.match(service,/capabilityRegistry\.get\(event\?\.learnerId\)/);
  assert.match(main,/createFamilySyncCapabilityRegistry/);
  for(const learner of ['yasser','khaled','mashaal'])assert.match(main,new RegExp(`syncCapabilities\\.register\\('${learner}'`));
  assert.match(main,/createFamilySyncService\(\{authClient:cloudAuth,capabilityRegistry:syncCapabilities\}\)/);
});

test('sync upload drops cross-learner events even if a local state is malformed',async()=>{
  const yasser=createInitialState();
  yasser.attemptLog=[{attemptId:'bad-cross',learnerId:'khaled',skillId:'table-2',table:2,multiplier:3,isCorrect:true,createdAt:'2026-09-05T00:00:00Z'}];
  const calls=[],auth={isAuthenticated:()=>true,request:async(path,options)=>{calls.push({path,body:options?.body});return{ok:true};}};
  const registry=registryFor({yasserRepository:repo(yasser)});
  const result=await createFamilySyncService({authClient:auth,capabilityRegistry:registry}).upload();
  assert.equal(result.attempts,0);
  assert.equal(calls.some(call=>call.path==='/v1/sync/attempts'),false);
});
