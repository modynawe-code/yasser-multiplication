import test from 'node:test';
import assert from 'node:assert/strict';
import { createMonopolyOnlineSession } from '../src/modules/games/monopoly/monopoly-online-session.js';
import { addMonopolyRoomPlayer, createInitialMonopolyRoomState, applyMonopolyRoomAction } from '../../backend/src/game-room-rules.mjs';

function resumeStore(){let saved=null;return{save(value){saved=value;return true;},load(){return saved;},has(){return Boolean(saved);},clear(){saved=null;return true;}};}

test('Monopoly online session creates a room, starts it, and submits authoritative turns',async()=>{
  let state=createInitialMonopolyRoomState('host',{displayName:'ياسر'}),version=0,received=[];
  const room=({selfPlayerId='host'}={})=>({code:'123456',gameId:'family-monopoly',status:state.status,version,state,players:state.players.map((player,seat)=>({playerId:player.id,learnerId:player.id==='host'?'yasser':'khaled',name:player.name,seat,participationRole:'player',authorityRole:seat===0?'host':'guest'})),selfPlayerId});
  const roomClient={
    async createRoom({gameId,learnerId,displayName}){assert.equal(gameId,'family-monopoly');assert.equal(learnerId,'yasser');state=createInitialMonopolyRoomState('host',{displayName});return{playerToken:'secret',room:room()};},
    async getRoom(){return{room:room()};},
    async submitAction({expectedVersion,type,payload}){assert.equal(expectedVersion,version);const result=applyMonopolyRoomAction(state,{playerId:'host',type,payload});assert.equal(result.ok,true);state=result.state;version+=1;return{room:room()};}
  };
  const session=createMonopolyOnlineSession({roomClient,resumeStore:resumeStore(),autoPoll:false,onRoom:value=>received.push(value)});
  const waiting=await session.create('yasser',{displayName:'ياسر'});
  assert.equal(waiting.status,'waiting');
  assert.equal(session.snapshot.gameId,'family-monopoly');
  state=addMonopolyRoomPlayer(state,'guest',{displayName:'خالد'}).state;version+=1;await session.refresh();
  const started=await session.start();
  assert.equal(started.state.status,'playing');
  assert.ok(received.length>=2);
  await session.submit('roll');
  assert.ok(['property','card','auction','end'].includes(session.snapshot.room.state.phase));
  session.stop();
});
