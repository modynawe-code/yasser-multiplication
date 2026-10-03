import test from 'node:test';
import assert from 'node:assert/strict';
import {BOARD,bidAuction,buildHouse,canBuild,buyProperty,createMonopolyState,drawCard,endTurn,passAuction,rentFor,rentSchedule,rollDice,sellProperty,skipProperty,tradeProperty} from '../src/modules/games/monopoly/monopoly-engine.js';

const players=[{id:'a',name:'أ'},{id:'b',name:'ب'}];

test('board contains all forty classic spaces and four corner spaces',()=>{
  assert.equal(BOARD.length,40);
  assert.deepEqual([0,10,20,30].map(i=>BOARD[i].type),['start','jail','free','gotojail']);
  assert.equal(BOARD.filter(s=>s.type==='railroad').length,4);
  assert.equal(BOARD.filter(s=>s.type==='utility').length,2);
});

test('rolling follows the forty-space route and offers the landing property',()=>{
  let s=createMonopolyState(players);
  s=rollDice(s,[1,2]);
  assert.equal(s.players[0].position,3);
  assert.equal(s.phase,'property');
  assert.equal(s.pending.index,3);
});

test('buying, rent, and selling update cash and ownership',()=>{
  let s=createMonopolyState(players);
  s=rollDice(s,[1,2]);
  s=buyProperty(s);
  assert.equal(s.players[0].cash,1500-BOARD[3].price);
  assert.equal(s.ownership[3].ownerId,'a');
  assert.equal(s.phase,'end');
  assert.equal(rentFor(s,3),BOARD[3].rent);
  s=endTurn(s);
  const beforeA=s.players[0].cash,beforeB=s.players[1].cash;
  s=rollDice(s,[1,2]);
  assert.ok(s.players[0].cash>beforeA);
  assert.ok(s.players[1].cash<beforeB);
  s=createMonopolyState(players);
  s.phase='end';
  s.ownership[3]={ownerId:'a',houses:0};
  const beforeSale=s.players[0].cash;
  s=sellProperty(s,3);
  assert.equal(s.ownership[3],undefined);
  assert.equal(s.players[0].cash,beforeSale+30);
});

test('unbought property can go to an auction winner',()=>{
  let s=createMonopolyState(players);
  s=rollDice(s,[1,2]);
  s=skipProperty(s);
  assert.equal(s.phase,'auction');
  s=bidAuction(s,20);
  s=passAuction(s);
  s=passAuction(s);
  assert.equal(s.phase,'end');
  assert.equal(s.ownership[3].ownerId,'b');
  assert.equal(s.players[1].cash,1480);
});

test('community chest resolves as an overlay card action',()=>{
  let s=createMonopolyState(players,{random:()=>0});
  s=rollDice(s,[1,1]);
  assert.equal(s.players[0].position,2);
  assert.equal(s.phase,'card');
  s=drawCard(s);
  assert.equal(s.phase,'end');
  assert.equal(s.players[0].cash,1600);
  assert.match(s.log,/استلم 100/);
});

test('trade transfers the title and agreed cash',()=>{
  let s=createMonopolyState(players);
  s=rollDice(s,[1,2]);
  s=buyProperty(s);
  s=tradeProperty(s,3,'b',40,10);
  assert.equal(s.ownership[3].ownerId,'b');
  assert.equal(s.players[0].cash,1500-BOARD[3].price-30);
  assert.equal(s.players[1].cash,1530);
});

test('rent schedules match the live game rules',()=>{
  const taif=rentSchedule(21);
  assert.deepEqual({base:taif.base,fullSet:taif.fullSet,houses:taif.houses,build:taif.build},{base:18,fullSet:36,houses:[90,144,198,252],build:150});
  assert.deepEqual(rentSchedule(5).rents,[25,50,100,200]);
  assert.deepEqual({one:rentSchedule(12).oneMultiplier,both:rentSchedule(12).bothMultiplier},{one:4,both:10});
  let s=createMonopolyState(players);s.phase='end';s.ownership={21:{ownerId:'a',houses:0},23:{ownerId:'a',houses:0},24:{ownerId:'a',houses:0}};
  assert.equal(rentFor(s,21),36);s.ownership[21].houses=2;assert.equal(rentFor(s,21),144);
  s.ownership[5]={ownerId:'a',houses:0};s.ownership[15]={ownerId:'a',houses:0};assert.equal(rentFor(s,5),50);
  s.ownership[12]={ownerId:'a',houses:0};s.dice=[3,4];assert.equal(rentFor(s,12),28);
  s.ownership[28]={ownerId:'a',houses:0};assert.equal(rentFor(s,12),70);
});


test('four houses upgrade to a hotel and the board rent level is reflected',()=>{
  let s=createMonopolyState(players);s.phase='end';s.ownership={21:{ownerId:'a',houses:4},23:{ownerId:'a',houses:4},24:{ownerId:'a',houses:4}};
  const before=s.players[0].cash;
  assert.equal(canBuild(s,21),true);
  s=buildHouse(s,21);
  assert.equal(s.ownership[21].houses,4);
  assert.equal(s.ownership[21].hotel,true);
  assert.equal(s.players[0].cash,before-BOARD[21].build);
  assert.equal(rentFor(s,21),rentSchedule(21).hotel);
  assert.equal(rentSchedule(21).hotel,306);
  assert.equal(canBuild(s,21),false);
  const saleBefore=s.players[0].cash;
  s=sellProperty(s,21);
  assert.equal(s.players[0].cash,saleBefore+Math.floor(BOARD[21].price/2)+5*Math.floor(BOARD[21].build/2));
});
