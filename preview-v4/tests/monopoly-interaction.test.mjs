import test from 'node:test';
import assert from 'node:assert/strict';
import {DICE_ORIENTATIONS,diceCubeMarkup,cameraTransform} from '../src/modules/games/monopoly/monopoly-interaction.js';
import {createMonopolyState,rollDice,drawCard,pickMonopolyCard,flipMonopolyCard,proposeMonopolyTrade,respondMonopolyTrade} from '../src/modules/games/monopoly/monopoly-engine.js';
import {applyMonopolyRoomAction} from '../../backend/src/game-room-rules.mjs';
const players=[{id:'a',name:'أ'},{id:'b',name:'ب'}];
const room=()=>({...createMonopolyState(players),gameId:'family-monopoly'});

test('all six settled cube orientations bring the matching face to the front',()=>{
  const normals={1:[0,0,1],2:[0,-1,0],3:[1,0,0],4:[-1,0,0],5:[0,1,0],6:[0,0,-1]};
  for(let face=1;face<=6;face++){
    const [x,y]=DICE_ORIENTATIONS[face].map(v=>v*Math.PI/180),[nx,ny,nz]=normals[face];
    const rotatedY=[nx*Math.cos(y)+nz*Math.sin(y),ny,-nx*Math.sin(y)+nz*Math.cos(y)];
    const front=rotatedY[1]*Math.sin(x)+rotatedY[2]*Math.cos(x);
    assert.ok(Math.abs(front-1)<1e-8,`face ${face}`);
    const html=diceCubeMarkup(face);assert.equal((html.match(/class="mono-cube-face /g)||[]).length,6);
  }
});
test('camera never pans past the board edges and respects maximum zoom',()=>{
  for(const scale of [.5,1,1.7,5])for(const x of [0,30,200,400])for(const y of [0,40,300,400]){
    const result=cameraTransform(400,400,{x,y},scale);assert.ok(result.scale>=1&&result.scale<=2.8);
    assert.ok(result.x<=0&&result.x>=400*(1-result.scale));assert.ok(result.y<=0&&result.y>=400*(1-result.scale));
  }
  assert.deepEqual(cameraTransform(400,400,{x:0,y:0},1),{scale:1,x:0,y:0});
});
test('picking and flipping a card cannot apply its cash effect prematurely or twice',()=>{
  let state=rollDice(createMonopolyState(players,{random:()=>0}),[1,1]);
  assert.equal(state.pending.stage,'deck');assert.equal(drawCard(state),state);
  state=pickMonopolyCard(state);assert.equal(state.pending.stage,'back');assert.equal(state.players[0].cash,1500);assert.equal(drawCard(state),state);
  state=flipMonopolyCard(state);assert.equal(state.pending.stage,'face');assert.equal(state.players[0].cash,1500);
  state=drawCard(state);assert.equal(state.players[0].cash,1600);assert.equal(drawCard(state),state);
});
test('trade proposal preserves property and balances until recipient accepts',()=>{
  const state=room();state.phase='end';state.ownership[1]={ownerId:'a',houses:0};
  const offer=proposeMonopolyTrade(state,1,'b',10,80);assert.equal(offer.phase,'trade');assert.equal(offer.ownership[1].ownerId,'a');assert.deepEqual(offer.players.map(p=>p.cash),[1500,1500]);
  assert.equal(respondMonopolyTrade(offer,'a',true),offer);
  const accepted=respondMonopolyTrade(offer,'b',true);assert.equal(accepted.ownership[1].ownerId,'b');assert.deepEqual(accepted.players.map(p=>p.cash),[1570,1430]);
  assert.equal(respondMonopolyTrade(accepted,'b',true),accepted);
  const rejected=respondMonopolyTrade(offer,'b',false);assert.equal(rejected.phase,'end');assert.equal(rejected.ownership[1].ownerId,'a');
});
test('trade rejects invalid monetary input and revalidates acceptance',()=>{
  const state=room();state.phase='end';state.ownership[1]={ownerId:'a',houses:0};
  for(const value of [-1,NaN,Infinity,3.5,Number.MAX_SAFE_INTEGER+1])assert.equal(proposeMonopolyTrade(state,1,'b',value,0),state);
  const offered=proposeMonopolyTrade(state,1,'b',0,100);offered.players[1].cash=40;
  const result=respondMonopolyTrade(offered,'b',true);assert.equal(result.ownership[1].ownerId,'a');assert.equal(result.players[1].cash,40);
});
test('server enforces recipient consent and records authoritative presentation actions',()=>{
  const state=room();state.phase='end';state.ownership[1]={ownerId:'a',houses:0};
  const proposal=applyMonopolyRoomAction(state,{playerId:'a',type:'trade',payload:{index:1,targetId:'b',requestCash:80}});
  assert.equal(proposal.ok,true);assert.equal(proposal.state.ownership[1].ownerId,'a');assert.equal(proposal.state.presentation.action,'trade');
  assert.equal(applyMonopolyRoomAction(proposal.state,{playerId:'a',type:'trade-accept'}).reason,'trade-recipient-only');
  assert.equal(applyMonopolyRoomAction(proposal.state,{playerId:'b',type:'end'}).reason,'not-your-turn');
  const accepted=applyMonopolyRoomAction(proposal.state,{playerId:'b',type:'trade-accept'});assert.equal(accepted.ok,true);assert.equal(accepted.state.ownership[1].ownerId,'b');assert.equal(accepted.state.presentation.sequence,2);
});
test('server shares deck/back/face progression and refuses another player to flip',()=>{
  let state=rollDice(room(),[1,1]);
  assert.equal(applyMonopolyRoomAction(state,{playerId:'a',type:'card'}).ok,false);
  state=applyMonopolyRoomAction(state,{playerId:'a',type:'card-pick'}).state;
  assert.equal(state.pending.stage,'back');assert.equal(state.presentation.action,'card-pick');
  assert.equal(applyMonopolyRoomAction(state,{playerId:'b',type:'card-flip'}).reason,'not-your-turn');
  state=applyMonopolyRoomAction(state,{playerId:'a',type:'card-flip'}).state;assert.equal(state.pending.stage,'face');
  const applied=applyMonopolyRoomAction(state,{playerId:'a',type:'card'});assert.equal(applied.ok,true);assert.equal(applied.state.phase,'end');
});

test('camera keeps perimeter landing tiles outside the stationary event arena',()=>{
  for(const target of [{x:46,y:200},{x:354,y:200},{x:200,y:46},{x:200,y:354}]){
    const edge=v=>v<.25?.11:v>.75?.89:.5;
    const t=cameraTransform(400,400,target,1.65,{x:edge(target.x/400),y:edge(target.y/400)});
    const x=(target.x*t.scale+t.x)/400,y=(target.y*t.scale+t.y)/400;
    assert.ok(x<.183||x>.817||y<.183||y>.817);
  }
});
