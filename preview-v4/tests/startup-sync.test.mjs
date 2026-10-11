import test from 'node:test';
import assert from 'node:assert/strict';
import {runStartupSync} from '../src/shared/sync/startup-sync.js';
import {createFamilyAuthClient} from '../src/shared/sync/family-auth-client.js';
test('stalled cloud startup is aborted and normal requests can run afterwards',async()=>{
  let signal,stalled=true;
  const storage={getItem:()=>JSON.stringify({token:'test'}),setItem(){},removeItem(){}};
  const client=createFamilyAuthClient({baseUrl:'https://example.test',storage,getRequestSignal:()=>signal,fetchFn:async(_url,options)=>{
    if(!stalled)return{ok:true,status:200,json:async()=>({ok:true})};
    return new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true}));
  }});
  assert.equal(await runStartupSync(()=>client.me(),{timeoutMs:20,setSignal:value=>{signal=value;}}),false);
  assert.equal(signal,undefined);
  stalled=false;
  assert.deepEqual(await client.me(),{ok:true});
});
test('completed startup preserves its result and clears the startup signal',async()=>{
  let signal;
  assert.equal(await runStartupSync(async()=>true,{setSignal:value=>{signal=value;}}),true);
  assert.equal(signal,undefined);
});
