import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameSessionParticipant,normalizeGameSessionParticipants } from '../src/modules/games/core/game-session-participant.js';
import { createGamePermissionService } from '../src/modules/games/core/game-permission-service.js';
import { createGameSessionEvents } from '../src/modules/games/core/game-session-events.js';

test('session participants keep family, participation and authority roles independent',()=>{
  const permissions=createGamePermissionService();
  const learnerHost=createGameSessionParticipant({participantId:'p1',learnerId:'yasser',actorRole:'learner',participationRole:'player',authorityRole:'host'});
  const guardianHost=createGameSessionParticipant({participantId:'parent',actorRole:'guardian',participationRole:'spectator',authorityRole:'host'});
  const learnerSpectator=createGameSessionParticipant({participantId:'observer',learnerId:'mashaal',actorRole:'learner',participationRole:'spectator',authorityRole:'guest'});

  assert.equal(permissions.can(learnerHost,'session.play'),true);
  assert.equal(permissions.can(learnerHost,'session.manage'),true);
  assert.equal(permissions.can(learnerHost,'progress.receive'),true);
  assert.equal(permissions.can(guardianHost,'session.manage'),true);
  assert.equal(permissions.can(guardianHost,'session.play'),false);
  assert.equal(permissions.can(guardianHost,'progress.receive'),false);
  assert.equal(permissions.can(learnerSpectator,'session.spectate'),true);
  assert.equal(permissions.can(learnerSpectator,'progress.receive'),false);
});

test('legacy learner ids normalize as local learner players',()=>{
  const roster=normalizeGameSessionParticipants(['yasser','khaled']);
  assert.deepEqual(roster.map(item=>item.learnerId),['yasser','khaled']);
  assert.equal(roster.every(item=>item.actorRole==='learner'&&item.participationRole==='player'&&item.authorityRole==='local'),true);
});

test('session lifecycle emits progress events only for reward-eligible learner players',()=>{
  const published=[];
  const yasser=createGameSessionParticipant({participantId:'p1',learnerId:'yasser',authorityRole:'host'});
  const parent=createGameSessionParticipant({participantId:'parent',actorRole:'guardian',participationRole:'spectator',authorityRole:'host'});
  const mashaalObserver=createGameSessionParticipant({participantId:'p3',learnerId:'mashaal',participationRole:'spectator',authorityRole:'guest'});
  const session=createGameSessionEvents({gameId:'demo-game',onEvent:event=>published.push(event),sessionIdFactory:()=> 'roles-1'});

  const started=session.begin(['yasser'],{participants:[yasser,parent,mashaalObserver]});
  assert.deepEqual(started.map(event=>event.learnerId),['yasser']);
  assert.equal(started[0].payload.participants.length,3);
  assert.equal(session.can('parent','session.manage'),true);
  assert.equal(session.can('p3','session.play'),false);

  const completed=session.complete({players:['yasser'],winner:'yasser'});
  assert.deepEqual(completed.map(event=>event.type),['game.won','game.completed']);
  assert.equal(published.every(event=>event.learnerId==='yasser'),true);
});
