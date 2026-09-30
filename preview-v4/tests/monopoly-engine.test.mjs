import test from 'node:test';import assert from 'node:assert/strict';
import {BOARD,buildHouse,buyProperty,createMonopolyState,endTurn,rollDice,skipProperty} from '../src/modules/games/monopoly/monopoly-engine.js';
const players=[{id:'a',name:'أ'},{id:'b',name:'ب'}];
test('roll moves player and offers unowned property',()=>{let s=createMonopolyState(players);s=rollDice(s,[1,2]);assert.equal(s.players[0].position,3);assert.equal(s.phase,'property');assert.equal(s.pending.index,3);});
test('buy property deducts cash and records owner',()=>{let s=createMonopolyState(players);s=rollDice(s,[1,2]);s=buyProperty(s);assert.equal(s.players[0].cash,1500-BOARD[3].price);assert.equal(s.ownership[3].ownerId,'a');assert.equal(s.phase,'end');});
test('rent transfers cash to owner',()=>{let s=createMonopolyState(players);s=rollDice(s,[1,2]);s=buyProperty(s);s=endTurn(s);const beforeA=s.players[0].cash,beforeB=s.players[1].cash;s=rollDice(s,[1,2]);assert.ok(s.players[0].cash>beforeA);assert.ok(s.players[1].cash<beforeB);assert.equal(s.phase,'end');});
test('skip property reaches end phase',()=>{let s=createMonopolyState(players);s=rollDice(s,[1,2]);s=skipProperty(s);assert.equal(s.phase,'end');assert.equal(s.ownership[3],undefined);});
test('building requires full color group',()=>{let s=createMonopolyState(players);s.ownership[1]={ownerId:'a',houses:0};s.phase='end';assert.equal(buildHouse(s,1),s);s.ownership[3]={ownerId:'a',houses:0};const next=buildHouse(s,1);assert.equal(next.ownership[1].houses,1);assert.ok(next.players[0].cash<s.players[0].cash);});
