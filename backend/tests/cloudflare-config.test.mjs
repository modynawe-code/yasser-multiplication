import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const configUrl=new URL('../wrangler.jsonc',import.meta.url);
const readConfig=async()=>JSON.parse(await readFile(configUrl,'utf8'));

test('Cloudflare config is pinned to the dedicated family-learning resources',async()=>{
  const config=await readConfig();
  assert.equal(config.name,'yasser-khaled-family-api');
  assert.equal(config.account_id,'cb1e4fe9d46768f7400d427eaecceb49');
  assert.equal(config.d1_databases?.length,1);
  const db=config.d1_databases[0];
  assert.equal(db.binding,'DB');
  assert.equal(db.database_name,'yasser-khaled-family');
  assert.equal(db.database_id,'843c2084-7857-45a7-9b61-7ce064a9f7a0');
  assert.doesNotMatch(JSON.stringify(config),/REPLACE_WITH_D1_DATABASE_ID/);
});

test('backend source continues to use env.DB so Wrangler auto-binding must not replace it',async()=>{
  const source=await readFile(new URL('../src/index.mjs',import.meta.url),'utf8');
  assert.match(source,/env\.DB\.prepare/);
  assert.doesNotMatch(source,/env\.yasser_khaled_family/);
});
