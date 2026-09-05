import test from 'node:test';
import assert from 'node:assert/strict';
import { FAMILY_API_PRODUCTION_BASE,getFamilyApiBase } from '../src/shared/config/family-api-config.js';

const LIVE='https://yasser-khaled-family-api.modynawe.workers.dev';

test('family API defaults to the verified production Worker',()=>{
  delete globalThis.__FAMILY_API_BASE_URL__;
  const storage={getItem:()=>null};
  assert.equal(FAMILY_API_PRODUCTION_BASE,LIVE);
  assert.equal(getFamilyApiBase(storage),LIVE);
});

test('development override stays available without changing production default',()=>{
  delete globalThis.__FAMILY_API_BASE_URL__;
  const storage={getItem:()=> 'http://127.0.0.1:8787/'};
  assert.equal(getFamilyApiBase(storage),'http://127.0.0.1:8787');
});
