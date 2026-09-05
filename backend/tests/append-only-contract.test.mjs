import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('D1 schema prevents attempt updates and deletes at database level',async()=>{
  const sql=await read('migrations/0001_family_core.sql');
  assert.match(sql,/CREATE TRIGGER IF NOT EXISTS attempts_no_delete/);
  assert.match(sql,/BEFORE DELETE ON attempts/);
  assert.match(sql,/CREATE TRIGGER IF NOT EXISTS attempts_no_update/);
  assert.match(sql,/BEFORE UPDATE ON attempts/);
  assert.match(sql,/ON DELETE RESTRICT/);
});

test('Worker exposes append/read sync but no attempt mutation endpoint',async()=>{
  const worker=await read('src/index.mjs');
  assert.match(worker,/\/v1\/sync\/attempts/);
  assert.match(worker,/\/v1\/sync\/snapshot/);
  assert.doesNotMatch(worker,/request\.method==='DELETE'.*attempt/s);
  assert.doesNotMatch(worker,/UPDATE attempts SET/);
  assert.doesNotMatch(worker,/DELETE FROM attempts/);
});

test('Worker authenticates sync routes and does not expose D1 credentials to client code',async()=>{
  const worker=await read('src/index.mjs');
  assert.match(worker,/const auth=await authenticate/);
  assert.match(worker,/if\(!auth\)return response\(request,env,401/);
  assert.match(worker,/env\.DB/);
  assert.doesNotMatch(worker,/database_id\s*[:=]\s*['"][^R]/);
});
