import test from 'node:test';
import assert from 'node:assert/strict';
import { createXoOnlineSession } from '../src/modules/games/xo/xo-online-session.js';

const resumeStore={save:()=>true,load:()=>null,clear:()=>{},has:()=>false};

test('online XO ignores unchanged room refreshes so the lobby is not re-rendered while waiting',async()=>{
  let currentRoom={code:'802749',version:1,status:'waiting',selfPlayerId:'p1',players:[],state:{}};
  const roomClient={
    createRoom:async()=>({room:currentRoom,playerToken:'token'}),
    getRoom:async()=>({room:currentRoom}),
    submitAction:async()=>({room:currentRoom})
  };
  let roomEvents=0;
  const session=createXoOnlineSession({roomClient,onRoom:()=>{roomEvents+=1;},pollIntervalMs:60_000,resumeStore});

  await session.create('mashaal');
  assert.equal(roomEvents,1);

  await session.refresh();
  assert.equal(roomEvents,1);

  currentRoom={...currentRoom,version:2};
  await session.refresh();
  assert.equal(roomEvents,2);

  session.stop();
});
