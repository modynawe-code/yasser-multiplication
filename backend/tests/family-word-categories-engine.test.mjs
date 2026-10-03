import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitialFamilyWordCategoriesRoomState,addFamilyWordCategoriesRoomPlayer,applyFamilyWordCategoriesRoomAction,projectFamilyWordCategoriesRoomState} from '../src/family-word-categories-engine.mjs';

function room(){let s=createInitialFamilyWordCategoriesRoomState('a');s=addFamilyWordCategoriesRoomPlayer(s,'b').state;return s;}

test('online categories room supports five players and host configuration',()=>{
  let s=createInitialFamilyWordCategoriesRoomState('a');
  for(const id of ['b','c','d','e'])s=addFamilyWordCategoriesRoomPlayer(s,id).state;
  assert.equal(s.players.length,5);
  assert.equal(addFamilyWordCategoriesRoomPlayer(s,'f').reason,'room-full');
  assert.equal(applyFamilyWordCategoriesRoomAction(s,{playerId:'b',type:'configure',payload:{durationSec:60,roundsTotal:3}}).reason,'host-only');
});

test('shared timer starts server-side and early finish requires a complete valid sheet',()=>{
  let s=applyFamilyWordCategoriesRoomAction(room(),{playerId:'a',type:'start'},{nowMs:1000}).state;
  assert.equal(Date.parse(s.deadlineAt)-Date.parse(s.startedAt),90000);
  const a=Object.fromEntries(s.categories.map(k=>[k,`${s.letter}لف`]));
  assert.equal(applyFamilyWordCategoriesRoomAction(s,{playerId:'a',type:'submit',payload:{answers:{...a,country:''}}},{nowMs:2000}).reason,'incomplete-answers');
  s=applyFamilyWordCategoriesRoomAction(s,{playerId:'a',type:'submit',payload:{answers:a}},{nowMs:5000}).state;
  assert.equal(s.submissions.a.elapsedMs,4000);
  assert.deepEqual(projectFamilyWordCategoriesRoomState(s,{viewerPlayerId:'b'}).submissions,{});
});


test('room projection exposes the authoritative server clock without leaking live answers',()=>{
  let s=applyFamilyWordCategoriesRoomAction(room(),{playerId:'a',type:'start'},{nowMs:1000}).state;
  const answers=Object.fromEntries(s.categories.map(k=>[k,`${s.letter}لف`]));
  s=applyFamilyWordCategoriesRoomAction(s,{playerId:'a',type:'submit',payload:{answers}},{nowMs:5000}).state;
  const projected=projectFamilyWordCategoriesRoomState(s,{viewerPlayerId:'b'});
  assert.equal(Number.isFinite(projected.serverNow),true);
  assert.deepEqual(projected.submittedPlayers,['a']);
  assert.deepEqual(projected.submissions,{});
});
