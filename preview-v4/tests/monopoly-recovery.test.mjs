import test from 'node:test';
import assert from 'node:assert/strict';
import {createMonopolyOnlineSession} from '../src/modules/games/monopoly/monopoly-online-session.js';
import {createGameRoomResumeStore} from '../src/modules/games/online/game-room-resume-store.js';
import {installMonopolyRecovery} from '../src/modules/games/monopoly/monopoly-recovery.js';
function memory(){const data=new Map();return{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k),key:i=>[...data.keys()][i],get length(){return data.size;}};}
const saved={gameId:'family-monopoly',code:'123456',token:'test-token-123456789',selfPlayerId:'guest',selfLearnerId:'khaled',expiresAt:new Date(Date.now()+86400000).toISOString()};
const room={code:saved.code,gameId:saved.gameId,selfPlayerId:'guest',status:'playing',version:9,expiresAt:saved.expiresAt,players:[{playerId:'guest',learnerId:'khaled',seat:1}],state:{version:2,status:'playing',phase:'property',turnIndex:1,players:[{id:'host',cash:900},{id:'guest',cash:1400,position:5}],ownership:{3:{ownerId:'guest',houses:2}}}};
function setup(client){const localStorage=memory(),store=createGameRoomResumeStore({localStorage,sessionStorage:memory(),gameId:saved.gameId});store.save(saved);return{localStorage,store,session:createMonopolyOnlineSession({roomClient:client,resumeStore:store,autoPoll:false})};}
for(const operation of ['create','join'])test(`failed ${operation} keeps the saved Monopoly room`,async()=>{
  const fail=async()=>{throw Object.assign(new Error('request failed'),{status:409});};
  const {store,session}=setup({createRoom:fail,joinRoom:fail});
  await assert.rejects(operation==='create'?session.create('yasser'):session.join('654321','khaled'));
  assert.equal(store.load().code,saved.code);assert.equal(session.hasResume('khaled'),true);
});
test('joining the saved room resumes an existing player after play has started',async()=>{
  let joins=0;const {session}=setup({getRoom:async input=>{assert.equal(input.token,saved.token);return{room}},joinRoom:async()=>{joins++;throw Error('already in room')}});
  await session.join(saved.code,'khaled');assert.equal(joins,0);assert.deepEqual(session.snapshot.room.state,room.state);
});
test('new browser session with empty session storage recovers identity money properties and turn',async()=>{
  const {localStorage}=setup({});
  const store=createGameRoomResumeStore({localStorage,sessionStorage:memory(),gameId:saved.gameId});
  const session=createMonopolyOnlineSession({resumeStore:store,autoPoll:false,roomClient:{getRoom:async()=>({room})}});
  assert.equal(session.savedResume().selfLearnerId,'khaled');await session.resume();assert.equal(session.snapshot.selfLearnerId,'khaled');assert.deepEqual(session.snapshot.room.state,room.state);
});
test('a temporary resume failure keeps credentials for another retry',async()=>{
  let fail=true;const {store,session}=setup({getRoom:async()=>{if(fail)throw Error('offline');return{room}}});
  await assert.rejects(session.resume());assert.equal(store.has(),true);fail=false;await session.resume();assert.equal(session.snapshot.connected,true);
});
for(const operation of ['join','resume','refresh','submit'])test(`a delayed ${operation} response cannot reopen a stopped session`,async()=>{
  let resolve;const wait=()=>new Promise(r=>{resolve=r});
  const {session}=setup({getRoom:async()=>({room}),joinRoom:wait,submitAction:wait});
  let pending;
  if(operation==='join')pending=session.join('654321','khaled');
  else if(operation==='resume'){const {session:other}=setup({getRoom:wait});pending=other.resume();other.stop();resolve({room});await pending;assert.equal(other.snapshot.connected,false);return;}
  else{await session.resume();if(operation==='refresh'){
    // Use a fresh client whose first request restores, then defer its refresh.
    let reads=0;const {session:other}=setup({getRoom:()=>++reads===1?Promise.resolve({room}):wait()});await other.resume();pending=other.refresh();other.stop();resolve({room});await pending;assert.equal(other.snapshot.connected,false);return;
  }pending=session.submit('buy');}
  session.stop();resolve({room,playerToken:saved.token});await pending;assert.equal(session.snapshot.connected,false);
});
function lifecycle(recover){const target=new EventTarget(),document=new EventTarget();document.visibilityState='visible';let active=true,paused=0;const timers=[];
  const recovery=installMonopolyRecovery({target,document,isActive:()=>active,recover,suspend:()=>paused++,setTimer:(fn,delay)=>{const timer={fn,delay};timers.push(timer);return timer},clearTimer:t=>{t.cancelled=true}});
  return{target,document,recovery,timers,get paused(){return paused},deactivate(){active=false}};
}
test('returning from hidden state and browser history reconnects without opening setup',async()=>{
  let count=0;const env=lifecycle(async()=>{count++;return true});env.document.visibilityState='hidden';env.document.dispatchEvent(new Event('visibilitychange'));assert.equal(env.paused,1);
  env.document.visibilityState='visible';env.document.dispatchEvent(new Event('visibilitychange'));await env.recovery.reconnect();assert.equal(count,1);
  const event=new Event('pageshow');event.persisted=true;env.target.dispatchEvent(event);await env.recovery.reconnect();assert.equal(count,2);
});
test('duplicate return events coalesce and temporary failures retry with bounded delay',async()=>{
  let count=0;const env=lifecycle(async()=>++count===1?false:true);env.target.dispatchEvent(new Event('online'));await env.recovery.reconnect();assert.equal(count,1);assert.equal(env.timers[0].delay,1000);
  env.timers[0].fn();await env.recovery.reconnect();assert.equal(count,2);assert.equal(env.timers.length,1);
});
test('closing the page cancels scheduled recovery and inactive games are not reopened',async()=>{
  const env=lifecycle(async()=>false);await env.recovery.reconnect();env.target.dispatchEvent(new Event('pagehide'));assert.equal(env.timers[0].cancelled,true);env.deactivate();assert.equal(await env.recovery.reconnect(),null);
});

test('a generic gateway 404 does not delete room credentials',async()=>{
 const {store,session}=setup({getRoom:async()=>{throw Object.assign(new Error('gateway'),{status:404})}});
 await assert.rejects(session.resume());assert.equal(store.has(),true);
});
test('an authoritative expired-room response clears only that player saved room',async()=>{
 const {store,session}=setup({getRoom:async()=>{throw Object.assign(new Error('room_not_found'),{status:404,body:{error:'room_not_found'}})}});
 await assert.rejects(session.resume());assert.equal(store.has(),false);
});
test('connection errors have a usable Arabic message including invalid room credentials',async()=>{
 const {onlineErrorMessage}=await import('../src/modules/games/online/game-room-errors.js');
 assert.match(onlineErrorMessage({status:401,body:{error:'invalid_game_token'}}),/هوية اللاعب/);
 assert.match(onlineErrorMessage(new Error('offline')),/محفوظة/);
});

test('a late poll cannot overwrite a newer authoritative action result',async()=>{
 let reads=0,resolveRead;const {session}=setup({getRoom:()=>++reads===1?Promise.resolve({room}):new Promise(r=>{resolveRead=r}),submitAction:async()=>({room:{...room,version:10,state:{...room.state,phase:'end'}}})});
 await session.resume();const oldPoll=session.refresh();await session.submit('buy');resolveRead({room});await oldPoll;
 assert.equal(session.snapshot.room.version,10);assert.equal(session.snapshot.room.state.phase,'end');
});
