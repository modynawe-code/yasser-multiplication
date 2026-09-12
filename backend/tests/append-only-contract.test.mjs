import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('D1 schema prevents attempt and baseline mutation at database level',async()=>{
  const initial=await read('migrations/0001_family_core.sql');
  const openLearners=await read('migrations/0002_open_learner_slugs.sql');
  for(const sql of [initial,openLearners]){
    for(const token of ['attempts_no_delete','BEFORE DELETE ON attempts','attempts_no_update','BEFORE UPDATE ON attempts','learner_baselines_no_delete','BEFORE DELETE ON learner_baselines','learner_baselines_no_update','BEFORE UPDATE ON learner_baselines'])assert.match(sql,new RegExp(token));
    assert.match(sql,/ON DELETE RESTRICT/);
    assert.match(sql,/table_number INTEGER/);assert.match(sql,/multiplier INTEGER/);
  }
});

test('open learner migration removes fixed names but keeps strict slug and foreign-key contracts',async()=>{
  const sql=await read('migrations/0002_open_learner_slugs.sql');
  assert.doesNotMatch(sql,/slug IN \('yasser','khaled'\)/);
  assert.match(sql,/length\(slug\) BETWEEN 1 AND 64/);
  assert.match(sql,/slug NOT GLOB/);
  assert.match(sql,/PRAGMA defer_foreign_keys = ON/);
  assert.match(sql,/INSERT INTO attempts_v2/);
  assert.match(sql,/CREATE INDEX IF NOT EXISTS idx_attempts_learner_created/);
});

test('generic learning evidence is append-only at database level',async()=>{
  const sql=await read('migrations/0002_open_learner_slugs.sql');
  for(const token of ['CREATE TABLE learning_evidence','learning_evidence_no_delete','BEFORE DELETE ON learning_evidence','learning_evidence_no_update','BEFORE UPDATE ON learning_evidence','idx_learning_evidence_learner_created'])assert.match(sql,new RegExp(token));
});

test('Worker exposes append/read sync but no history mutation endpoint',async()=>{
  const worker=await read('src/index.mjs');
  for(const route of ['/v1/sync/baseline','/v1/sync/attempts','/v1/sync/evidence','/v1/sync/snapshot'])assert.match(worker,new RegExp(route.replaceAll('/','\\/')));
  assert.match(worker,/INSERT OR IGNORE INTO learner_baselines/);
  assert.match(worker,/INSERT OR IGNORE INTO learning_evidence/);
  assert.doesNotMatch(worker,/request\.method==='DELETE'.*attempt/s);
  assert.doesNotMatch(worker,/UPDATE attempts SET/);
  assert.doesNotMatch(worker,/DELETE FROM attempts/);
  assert.doesNotMatch(worker,/UPDATE learning_evidence SET/);
  assert.doesNotMatch(worker,/DELETE FROM learning_evidence/);
});

test('Worker initializes family learners through catalog instead of fixed insert statements',async()=>{
  const worker=await read('src/index.mjs'),learners=await read('src/learners.mjs');
  assert.match(worker,/DEFAULT_LEARNERS/);
  assert.match(worker,/missing=DEFAULT_LEARNERS\.filter/);
  assert.match(learners,/slug:'mashaal'/);
  assert.doesNotMatch(worker,/const yasserId=.*khaledId=/s);
});

test('Worker authenticates sync routes and uses the dedicated DB binding',async()=>{
  const worker=await read('src/index.mjs'),config=JSON.parse(await read('wrangler.jsonc'));
  assert.match(worker,/const auth=await authenticate/);
  assert.match(worker,/if\(!auth\)return response\(request,env,401/);
  assert.match(worker,/env\.DB/);
  assert.equal(config.d1_databases?.[0]?.binding,'DB');
  assert.equal(config.d1_databases?.[0]?.database_name,'yasser-khaled-family');
  assert.doesNotMatch(JSON.stringify(config),/REPLACE_WITH_D1_DATABASE_ID/);
});
