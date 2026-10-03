import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const configUrl=new URL('../wrangler.jsonc',import.meta.url);
const readConfig=async()=>JSON.parse(await readFile(configUrl,'utf8'));

test('Cloudflare config is pinned to the dedicated family-learning resources',async()=>{
  const config=await readConfig();
  assert.equal(config.name,'yasser-khaled-family-api');
  assert.equal(config.account_id,'cb1e4fe9d46768f7400d427eaecceb49');
  assert.equal(config.ai?.binding,'AI');
  assert.equal(config.ratelimits?.length,1);
  assert.equal(config.ratelimits[0].name,'VOICE_RATE_LIMITER');
  assert.equal(config.ratelimits[0].simple.limit,90);
  assert.equal(config.ratelimits[0].simple.period,60);
  assert.equal(config.d1_databases?.length,1);
  const db=config.d1_databases[0];
  assert.equal(db.binding,'DB');
  assert.equal(db.database_name,'yasser-khaled-family');
  assert.equal(db.database_id,'843c2084-7857-45a7-9b61-7ce064a9f7a0');
  assert.doesNotMatch(JSON.stringify(config),/REPLACE_WITH_D1_DATABASE_ID/);
});

test('Cloudflare CORS includes the real Capacitor Android origin',async()=>{
  const config=await readConfig();
  const origins=String(config.vars?.ALLOWED_ORIGINS||'').split(',');
  assert.ok(origins.includes('https://localhost'));
  assert.ok(origins.includes('capacitor://localhost'));
});

test('backend source continues to use isolated DB AI and rate-limit bindings',async()=>{
  const source=await readFile(new URL('../src/index.mjs',import.meta.url),'utf8');
  const voice=await readFile(new URL('../src/voice.mjs',import.meta.url),'utf8');
  assert.match(source,/env\.DB\.prepare/);
  assert.match(voice,/env\.AI\.run/);
  assert.match(voice,/env\.VOICE_RATE_LIMITER\.limit/);
  assert.doesNotMatch(source,/env\.yasser_khaled_family/);
});
