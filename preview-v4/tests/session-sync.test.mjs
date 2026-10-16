import test from 'node:test';
import assert from 'node:assert/strict';
import { appendCloudSession,createSessionSyncId,restoreSessionRecord } from '../src/shared/sync/session-sync.js';

test('session sync id is stable and independent of array position',()=>{
  const session={startedAt:'2026-09-08T10:00:00Z',endedAt:'2026-09-08T10:05:00Z',mode:'practice',completed:10,correct:8,wrong:2,masteryScore:80};
  assert.equal(createSessionSyncId('yasser',session),createSessionSyncId('yasser',{...session}));
  assert.notEqual(createSessionSyncId('khaled',session),createSessionSyncId('yasser',session));
});

test('exact cloud session payload restores once and preserves stage-specific metrics',()=>{
  const original={at:'2026-09-08T11:00:00Z',skillId:'money',correct:6,wrong:2,total:8,firstTryCorrect:5,correctedAfterError:1,masteryScore:69,incomplete:false};
  const state={sessions:[]},payload={sessionId:createSessionSyncId('khaled',original),learnerId:'khaled',endedAt:original.at,session:original};
  assert.equal(appendCloudSession(state,payload,{learnerId:'khaled'}),true);
  assert.deepEqual(state.sessions[0],original);
  assert.equal(appendCloudSession(state,payload,{learnerId:'khaled'}),false);
  assert.equal(state.sessions.length,1);
});

test('baseline session and matching cloud row do not duplicate',()=>{
  const original={endedAt:'2026-09-08T12:00:00Z',mode:'exam',completed:30,correct:27,wrong:3,masteryScore:90};
  const state={sessions:[structuredClone(original)]};
  const payload={sessionId:createSessionSyncId('yasser',original),learnerId:'yasser',endedAt:original.endedAt,session:original};
  assert.equal(appendCloudSession(state,payload,{learnerId:'yasser'}),false);
  assert.equal(state.sessions.length,1);
});

test('legacy cloud sessions remain restorable without exact session_json',()=>{
  const payload={sessionId:'legacy-1',learnerId:'mashaal',skillId:'patterns',mode:'activity',startedAt:'2026-09-08T09:00:00Z',endedAt:'2026-09-08T09:03:00Z',correct:0,wrong:0,total:1,incomplete:0};
  const record=restoreSessionRecord(payload);
  assert.equal(record.skillId,'patterns');
  assert.equal(record.at,payload.endedAt);
  assert.equal(record.cloudRestored,true);
});

test('session restore rejects cross-learner payloads',()=>{
  const state={sessions:[]};
  assert.equal(appendCloudSession(state,{learnerId:'khaled',session:{at:'2026-09-08T09:00:00Z'}},{learnerId:'yasser'}),false);
  assert.equal(state.sessions.length,0);
});
