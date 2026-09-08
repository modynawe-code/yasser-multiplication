import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { FAMILY_API_PRODUCTION_BASE,getFamilyApiBase } from '../src/shared/config/family-api-config.js';

const LIVE='https://yasser-khaled-family-api.modynawe.workers.dev';

test('family API defaults to the verified production Worker',()=>{
  delete globalThis.__FAMILY_API_BASE_URL__;
  delete globalThis.__FAMILY_API_ALLOW_DEV_OVERRIDE__;
  const storage={getItem:()=>null};
  assert.equal(FAMILY_API_PRODUCTION_BASE,LIVE);
  assert.equal(getFamilyApiBase(storage),LIVE);
});

test('development override is available only on an explicit local web development origin',()=>{
  delete globalThis.__FAMILY_API_BASE_URL__;
  delete globalThis.__FAMILY_API_ALLOW_DEV_OVERRIDE__;
  const storage={getItem:()=> 'http://127.0.0.1:8787/'};
  assert.equal(getFamilyApiBase(storage,{protocol:'http:',hostname:'127.0.0.1'}),'http://127.0.0.1:8787');
});

test('Capacitor ignores a stale localStorage API override and always uses production',()=>{
  delete globalThis.__FAMILY_API_BASE_URL__;
  delete globalThis.__FAMILY_API_ALLOW_DEV_OVERRIDE__;
  const storage={getItem:key=>key==='family_api_base_v1'?'http://127.0.0.1:8787/':null};
  assert.equal(getFamilyApiBase(storage,{protocol:'https:',hostname:'localhost'}),LIVE);
});

test('Android native wrapper patches remote fetch through CapacitorHttp',async()=>{
  const config=JSON.parse(await readFile(new URL('../../capacitor.config.json',import.meta.url),'utf8'));
  assert.equal(config.plugins?.CapacitorHttp?.enabled,true);
  assert.equal(config.webDir,'dist-mobile');
});

test('an explicit runtime-injected API remains higher priority than local storage',()=>{
  globalThis.__FAMILY_API_BASE_URL__='https://example.test/';
  const storage={getItem:()=> 'http://127.0.0.1:8787/'};
  try{assert.equal(getFamilyApiBase(storage,{protocol:'https:',hostname:'localhost'}),'https://example.test');}
  finally{delete globalThis.__FAMILY_API_BASE_URL__;}
});
