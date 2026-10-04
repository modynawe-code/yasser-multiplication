import test from 'node:test';
import assert from 'node:assert/strict';
import { createFamilyAuthClient, FAMILY_AUTH_SESSION_KEY } from '../src/shared/sync/family-auth-client.js';

function memoryStorage(){const map=new Map();return{getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,String(value)),removeItem:key=>map.delete(key),dump:()=>Object.fromEntries(map)};}

test('parent login stores only returned session data, never password',async()=>{
  const storage=memoryStorage(),calls=[];
  const fetchFn=async(url,options)=>{calls.push({url,options});return{ok:true,status:200,json:async()=>({token:'secret-session-token',expiresAt:'2026-10-01T00:00:00Z',parent:{email:'parent@example.com'}})};};
  const client=createFamilyAuthClient({baseUrl:'https://api.example.test',fetchFn,storage});
  await client.login('parent@example.com','never-store-this-password');
  const persisted=storage.getItem(FAMILY_AUTH_SESSION_KEY);
  assert.match(persisted,/secret-session-token/);
  assert.doesNotMatch(persisted,/never-store-this-password/);
  assert.match(calls[0].options.body,/never-store-this-password/);
});

test('authenticated request sends bearer token and clears it after unauthorized response',async()=>{
  const storage=memoryStorage();storage.setItem(FAMILY_AUTH_SESSION_KEY,JSON.stringify({token:'abc',email:'p@example.com'}));
  let header='';const fetchFn=async(_url,options)=>{header=options.headers.authorization;return{ok:false,status:401,json:async()=>({error:'unauthorized'})};};
  const client=createFamilyAuthClient({baseUrl:'https://api.example.test',fetchFn,storage});
  await assert.rejects(()=>client.me());
  assert.equal(header,'Bearer abc');assert.equal(storage.getItem(FAMILY_AUTH_SESSION_KEY),null);
});


test('family code connects without exposing email or password in the UI contract',async()=>{
  const sessionStorage=memoryStorage(),familyStorage=memoryStorage(),calls=[];
  const fetchFn=async(url,options)=>{
    calls.push({url,options});
    if(url.endsWith('/v1/auth/login'))return{ok:false,status:401,json:async()=>({error:'invalid_credentials'})};
    if(url.endsWith('/v1/auth/register'))return{ok:true,status:201,json:async()=>({token:'family-session',expiresAt:'2026-12-01T00:00:00Z',parent:{email:'synthetic@family.invalid'}})};
    throw new Error('unexpected request');
  };
  const client=createFamilyAuthClient({baseUrl:'https://api.example.test',fetchFn,storage:sessionStorage,familyStorage});
  await client.connectFamilyCode('A7K3Q9');
  assert.equal(client.isAuthenticated(),true);
  assert.equal(familyStorage.getItem('family-shared-code-v1'),'A7K3Q9');
  assert.equal(calls.length,2);
  assert.doesNotMatch(calls[0].options.body,/A7K3Q9/);
  assert.doesNotMatch(calls[1].options.body,/A7K3Q9/);
});
