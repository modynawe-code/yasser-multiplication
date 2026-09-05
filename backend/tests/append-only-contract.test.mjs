import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('D1 schema prevents attempt and baseline mutation at database level',async()=>{
  const sql=await read('migrations/0001_family_core.sql');
  for(const token of ['attempts_no_delete','BEFORE DELETE ON attempts','attempts_no_update','BEFORE UPDATE ON attempts','learner_baselines_no_delete','BEFORE DELETE ON learner_baselines','learner_baselines_no_update','BEFORE UPDATE ON learner_baselines'])assert.match(sql,new RegExp(token));
  assert.match(sql,/ON DELETE RESTRICT/);
  assert.match(sql,/table_number INTEGER/);assert.match(sql,/multiplier INTEGER/);
});

test('Worker exposes immutable baseline plus append/read sync but no attempt mutation endpoint',async()=>{
  const worker=await read('src/index.mjs');
  assert.match(worker,/\/v1\/sync\/baseline/);
  assert.match(worker,/INSERT OR IGNORE INTO learner_baselines/);
  assert.match(worker,/\/v1\/sync\/attempts/);
  assert.match(worker,/\/v1\/sync\/snapshot/);
  assert.doesNotMatch(worker,/request\.method==='DELETE'.*attempt/s);
  assert.doesNotMatch(worker,/UPDATE attempts SET/);
  assert.doesNotMatch(worker,/DELETE FROM attempts/);
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
