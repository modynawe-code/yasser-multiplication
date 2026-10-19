import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addKingInspectorRoomPlayer,
  applyKingInspectorRoomAction,
  createInitialKingInspectorRoomState,
  projectKingInspectorRoomState,
  KING_INSPECTOR_ROLES,
  KING_INSPECTOR_GAME_ID
} from '../src/king-inspector-game-engine.mjs';

function addFourPlayers(){
  let state=createInitialKingInspectorRoomState('a');
  for(const playerId of ['b','c','d']){
    const result=addKingInspectorRoomPlayer(state,playerId);
    assert.equal(result.ok,true);
    state=result.state;
  }
  return state;
}

function finishCaughtRound(state){
  const king=state.kingPlayerId;
  const inspector=state.players.find(id=>state.roles[id]==='inspector');
  const thief=state.players.find(id=>state.roles[id]==='thief');
  const actions=state.phase==='challenge'?[
    [king,'choose-challenge',{challengeId:'animal-voice'}],
    [thief,'complete-challenge',{}]
  ]:[
    [king,'ask-inspector',{}],
    [inspector,'claim-inspector',{}],
    [king,'issue-command',{}],
    [inspector,'accuse',{targetPlayerId:thief}],
    [king,'choose-challenge',{challengeId:'animal-voice'}],
    [thief,'complete-challenge',{}]
  ];
  for(const [playerId,type,payload] of actions){
    const result=applyKingInspectorRoomAction(state,{playerId,type,payload});
    assert.equal(result.ok,true,`${type} should be valid`);
    state=result.state;
  }
  return state;
}

test('King Inspector waits for exactly four players and hides roles from other devices',()=>{
  let state=createInitialKingInspectorRoomState('a');
  assert.equal(state.gameId,KING_INSPECTOR_GAME_ID);
  assert.equal(state.status,'waiting');
  state=addKingInspectorRoomPlayer(state,'b').state;
  state=addKingInspectorRoomPlayer(state,'c').state;
  assert.equal(state.status,'waiting');
  state=addKingInspectorRoomPlayer(state,'d').state;
  assert.equal(state.status,'playing');
  assert.equal(state.phase,'king-question');
  assert.equal(new Set(Object.values(state.roles)).size,4);
  assert.deepEqual(new Set(Object.values(state.roles)),new Set(KING_INSPECTOR_ROLES));
  assert.equal(addKingInspectorRoomPlayer(state,'e').reason,'room-not-waiting');
  const playerA=projectKingInspectorRoomState(state,{viewerPlayerId:'a'});
  const playerB=projectKingInspectorRoomState(state,{viewerPlayerId:'b'});
  assert.equal(playerA.privateRole,state.roles.a);
  assert.equal(playerB.privateRole,state.roles.b);
  assert.equal('roles' in playerA,false);
  assert.equal('roleHistory' in playerA,false);
  assert.equal(Object.keys(playerA.publicRoles).length,1);
});

test('King Inspector validates the dialogue and records cumulative round wins',()=>{
  let state=addFourPlayers();
  const king=state.kingPlayerId;
  const inspector=state.players.find(id=>state.roles[id]==='inspector');
  const thief=state.players.find(id=>state.roles[id]==='thief');
  assert.equal(applyKingInspectorRoomAction(state,{playerId:inspector,type:'ask-inspector'}).reason,'king-only');
  state=applyKingInspectorRoomAction(state,{playerId:king,type:'ask-inspector'}).state;
  state=applyKingInspectorRoomAction(state,{playerId:inspector,type:'claim-inspector'}).state;
  state=applyKingInspectorRoomAction(state,{playerId:king,type:'issue-command'}).state;
  state=applyKingInspectorRoomAction(state,{playerId:inspector,type:'accuse',payload:{targetPlayerId:thief}}).state;
  assert.equal(state.accusation.caught,true);
  assert.equal(state.scores[king],1);
  assert.equal(state.scores[inspector],1);
  assert.equal(state.publicRoles[thief],'thief');
  const finished=finishCaughtRound(state);
  assert.equal(finished.status,'finished');
  const next=applyKingInspectorRoomAction(finished,{playerId:thief,type:'next-round'});
  assert.equal(next.ok,true);
  assert.equal(next.state.round,2);
  assert.deepEqual(next.state.scores,finished.scores);
});

test('role assignment does not repeat a role for a player until all four have been dealt',()=>{
  let state=addFourPlayers();
  const dealt=Object.fromEntries(state.players.map(id=>[id,new Set()]));
  for(let round=0;round<4;round++){
    for(const playerId of state.players){
      assert.equal(dealt[playerId].has(state.roles[playerId]),false);
      dealt[playerId].add(state.roles[playerId]);
    }
    state=finishCaughtRound(state);
    if(round<3)state=applyKingInspectorRoomAction(state,{playerId:state.players[0],type:'next-round'}).state;
  }
  for(const playerId of state.players)assert.equal(dealt[playerId].size,4);
});
