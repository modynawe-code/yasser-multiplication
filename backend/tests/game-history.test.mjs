import test from 'node:test';
import assert from 'node:assert/strict';
import {buildOnlineRoomMatch,normalizeGameMatch} from '../src/game-history.mjs';

test('generic local history contract supports current and future games',()=>{
  const parsed=normalizeGameMatch({
    matchId:'local-future-1',gameId:'future-game',gameVersion:2,playMode:'local',
    startedAt:'2026-09-25T18:00:00Z',endedAt:'2026-09-25T18:05:00Z',winnerIds:['yasser'],
    players:[
      {learnerId:'yasser',displayName:'ياسر',score:9,outcome:'win'},
      {learnerId:'khaled',displayName:'خالد',score:6,outcome:'loss'}
    ],
    details:{rounds:3}
  },{recordedAt:'2026-09-25T18:05:01Z',familyId:'par-family-1'});
  assert.equal(parsed.ok,true);
  assert.equal(parsed.value.gameId,'future-game');
  assert.equal(parsed.value.players.length,2);
  assert.deepEqual(parsed.value.winnerIds,['yasser']);
  assert.equal(parsed.value.recordedAt,'2026-09-25T18:05:01Z');
});

test('history contract rejects winners that are not participants',()=>{
  const parsed=normalizeGameMatch({
    matchId:'bad-1',gameId:'xo',playMode:'local',winnerIds:['mashaal'],
    players:[{learnerId:'yasser',displayName:'ياسر'},{learnerId:'khaled',displayName:'خالد'}]
  },{familyId:'par-family-1'});
  assert.equal(parsed.ok,false);
  assert.equal(parsed.error,'invalid_winners');
});

test('online XO terminal room becomes a server-timestamped history match',()=>{
  const roomRow={id:'room-1',code:'123456',game_id:'xo',history_family_id:'par-family-1',created_at:'2026-09-25T18:00:00Z'};
  const players=[
    {player_id:'pa',learner_id:'yasser',display_name:'ياسر',seat:0,participation_role:'player'},
    {player_id:'pb',learner_id:'khaled',display_name:'خالد',seat:1,participation_role:'player'}
  ];
  const built=buildOnlineRoomMatch({
    roomRow,players,version:8,recordedAt:'2026-09-25T18:04:00Z',
    state:{status:'won',winner:'pa',round:1,moveCount:7}
  });
  assert.equal(built.ok,true);
  assert.equal(built.value.matchId,'online-room-1-v8');
  assert.deepEqual(built.value.winnerIds,['yasser']);
  assert.equal(built.value.players.find(p=>p.learnerId==='yasser').outcome,'win');
  assert.equal(built.value.players.find(p=>p.learnerId==='khaled').outcome,'loss');
  assert.equal(built.value.endedAt,'2026-09-25T18:04:00.000Z');
});

test('non-terminal online state does not create history',()=>{
  const built=buildOnlineRoomMatch({
    roomRow:{id:'room-2',code:'123456',game_id:'rock-paper-scissors',history_family_id:'par-family-1',created_at:'2026-09-25T18:00:00Z'},
    players:[],version:2,state:{status:'playing',phase:'choosing'}
  });
  assert.equal(built,null);
});

test('family word online result maps player ids to learner ids and scores',()=>{
  const built=buildOnlineRoomMatch({
    roomRow:{id:'room-3',code:'654321',game_id:'family-word-categories',history_family_id:'par-family-1',created_at:'2026-09-25T18:00:00Z'},
    players:[
      {player_id:'pa',learner_id:'father',display_name:'الأب',seat:0,participation_role:'player'},
      {player_id:'pb',learner_id:'yasser',display_name:'ياسر',seat:1,participation_role:'player'}
    ],
    version:20,recordedAt:'2026-09-25T18:10:00Z',
    state:{status:'finished',winnerIds:['pb'],scores:{pa:110,pb:125},roundsTotal:3,usedLetters:['م','س','ب']}
  });
  assert.equal(built.ok,true);
  assert.deepEqual(built.value.winnerIds,['yasser']);
  assert.equal(built.value.players.find(p=>p.learnerId==='yasser').score,125);
});


test('online room without a family identity is not written to family history',()=>{
  const built=buildOnlineRoomMatch({
    roomRow:{id:'room-public',code:'111111',game_id:'xo',created_at:'2026-09-25T18:00:00Z'},
    players:[
      {player_id:'pa',learner_id:'yasser',display_name:'ياسر',seat:0,participation_role:'player'},
      {player_id:'pb',learner_id:'khaled',display_name:'خالد',seat:1,participation_role:'player'}
    ],
    version:4,state:{status:'won',winner:'pa',round:1}
  });
  assert.equal(built,null);
});
