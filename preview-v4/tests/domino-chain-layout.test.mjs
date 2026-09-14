import test from 'node:test';
import assert from 'node:assert/strict';
import {DOMINO_NORMAL_SCALES,planDominoChain} from '../src/modules/games/domino/domino-chain-layout.js';

const tile=(left,right)=>({left,right});
const LEGAL_CHAIN=[tile(0,0),tile(0,1),tile(1,2),tile(2,2),tile(2,3),tile(3,4),tile(4,4),tile(4,5),tile(5,6),tile(6,6),tile(6,3),tile(3,3),tile(3,1),tile(1,1),tile(1,4),tile(4,6),tile(6,2),tile(2,5),tile(5,5),tile(5,0),tile(0,2),tile(2,4),tile(4,0),tile(0,3),tile(3,5),tile(5,1),tile(1,6),tile(6,0)];
const DEVICES=[
  {name:'small phone',width:320,height:240,tileWidth:78,tileHeight:41},
  {name:'phone',width:390,height:260,tileWidth:84,tileHeight:44},
  {name:'Galaxy Tab',width:680,height:300,tileWidth:90,tileHeight:47},
  {name:'desktop',width:900,height:260,tileWidth:96,tileHeight:50}
];

function boundsOf(p,w,h){const vertical=p.rotation%180!==0;const width=(vertical?h:w)*p.scale,height=(vertical?w:h)*p.scale;return {left:p.x-width/2,right:p.x+width/2,top:p.y-height/2,bottom:p.y+height/2};}
function touches(a,b,w,h){const A=boundsOf(a,w,h),B=boundsOf(b,w,h);const gapX=Math.max(0,Math.max(A.left,B.left)-Math.min(A.right,B.right));const gapY=Math.max(0,Math.max(A.top,B.top)-Math.min(A.bottom,B.bottom));return gapX<.2&&gapY<.2;}
function overlapArea(a,b,w,h){const A=boundsOf(a,w,h),B=boundsOf(b,w,h);return Math.max(0,Math.min(A.right,B.right)-Math.max(A.left,B.left))*Math.max(0,Math.min(A.bottom,B.bottom)-Math.max(A.top,B.top));}
function visualHalves(placement,tile,w){const angle=placement.rotation*Math.PI/180,d=w*placement.scale/4,dx=Math.cos(angle)*d,dy=Math.sin(angle)*d;return[{value:tile.left,x:placement.x-dx,y:placement.y-dy},{value:tile.right,x:placement.x+dx,y:placement.y+dy}];}
function nearestJoin(a,tileA,b,tileB,w){let nearest=null;for(const A of visualHalves(a,tileA,w))for(const B of visualHalves(b,tileB,w)){const distance=Math.hypot(A.x-B.x,A.y-B.y);if(!nearest||distance<nearest.distance)nearest={left:A.value,right:B.value,distance};}return nearest;}

test('opening tile is the fixed horizontal anchor',()=>{
  const plan=planDominoChain({tiles:LEGAL_CHAIN.slice(0,15),anchorIndex:7,width:390,height:260,tileWidth:84,tileHeight:44,padding:6});
  assert.equal(plan.anchorSlot,7);
  assert.equal(plan.placements[7].anchor,true);
  assert.equal(plan.placements[7].rotation%180,0);
});

test('desktop uses width while phone creates readable lanes',()=>{
  const tiles=LEGAL_CHAIN.slice(0,10),anchorIndex=4;
  const desktop=planDominoChain({tiles,anchorIndex,width:900,height:260,tileWidth:96,tileHeight:50,padding:6});
  const phone=planDominoChain({tiles,anchorIndex,width:320,height:240,tileWidth:78,tileHeight:41,padding:6});
  assert.ok(desktop.placements.every(item=>item.pathRotation%180===0));
  assert.ok(phone.placements.some(item=>item.pathRotation%180!==0));
  assert.ok(new Set(phone.placements.map(item=>item.row)).size>1);
});

test('new normal tile becomes the corner instead of moving the previous tile into it',()=>{
  const tiles=Array.from({length:14},(_,i)=>tile(i%6,(i+1)%6));
  let previous=planDominoChain({tiles:tiles.slice(0,1),anchorIndex:0,width:340,height:230,tileWidth:82,tileHeight:44,padding:6});
  let checked=false;
  for(let count=2;count<=tiles.length;count++){
    const current=planDominoChain({tiles:tiles.slice(0,count),anchorIndex:0,width:340,height:230,tileWidth:82,tileHeight:44,padding:6});
    const newTile=current.placements.at(-1);
    if(current.scale===previous.scale&&newTile.pathRotation%180!==0){
      assert.equal(previous.placements.at(-1).pathRotation%180,0);
      assert.equal(newTile.rotation%180,90);
      checked=true;break;
    }
    previous=current;
  }
  assert.equal(checked,true);
});

test('doubles stay perpendicular to their local path and never act as corners',()=>{
  const plan=planDominoChain({tiles:LEGAL_CHAIN,anchorIndex:13,width:390,height:260,tileWidth:84,tileHeight:44,padding:6});
  for(const [index,current] of LEGAL_CHAIN.entries()){
    if(index===13||current.left!==current.right)continue;
    const placement=plan.placements[index];
    assert.equal((placement.rotation-placement.pathRotation+360)%180,90,`double ${index}`);
    assert.equal(placement.pathRotation%180,0,`double used as corner ${index}`);
  }
});

test('connected chain has no gaps or non-adjacent overlap',()=>{
  const {placements}=planDominoChain({tiles:LEGAL_CHAIN,anchorIndex:13,width:390,height:260,tileWidth:84,tileHeight:44,padding:6});
  assert.equal(placements.length,28);
  for(let i=0;i<placements.length-1;i++)assert.equal(touches(placements[i],placements[i+1],84,44),true,`gap ${i}-${i+1}`);
  for(let i=0;i<placements.length;i++)for(let j=i+2;j<placements.length;j++)assert.ok(overlapArea(placements[i],placements[j],84,44)<=.51,`overlap ${i}-${j}`);
});

test('every physical join touches equal pip values through left arm, corners and doubles',()=>{
  const {placements}=planDominoChain({tiles:LEGAL_CHAIN,anchorIndex:13,width:390,height:260,tileWidth:84,tileHeight:44,padding:6});
  for(let i=0;i<placements.length-1;i++){
    const join=nearestJoin(placements[i],LEGAL_CHAIN[i],placements[i+1],LEGAL_CHAIN[i+1],84);
    assert.equal(join.left,join.right,`visual pip mismatch ${i}-${i+1}`);
  }
});

test('left arm faces preserve logical pip order instead of mirroring the chain',()=>{
  const tiles=[tile(0,1),tile(1,2),tile(2,3),tile(3,4),tile(4,5)];
  const {placements}=planDominoChain({tiles,anchorIndex:3,width:900,height:260,tileWidth:96,tileHeight:50,padding:6});
  assert.equal(placements[2].rotation%360,0);
  assert.equal(nearestJoin(placements[2],tiles[2],placements[3],tiles[3],96).left,3);
});

test('mobile reserves the edge turn before a following double',()=>{
  const base=[tile(0,1),tile(1,2),tile(2,3),tile(3,4)];
  const before=planDominoChain({tiles:base,anchorIndex:0,width:320,height:240,tileWidth:78,tileHeight:41,padding:6});
  const after=planDominoChain({tiles:[...base,tile(4,4)],anchorIndex:0,width:320,height:240,tileWidth:78,tileHeight:41,padding:6});
  assert.equal(before.placements[3].rotation,after.placements[3].rotation);
  assert.equal(after.placements[4].pathRotation%180,0);
  assert.equal((after.placements[4].rotation-after.placements[4].pathRotation+360)%180,90);
});

test('all 28 tiles fit each target board without clipping or scrolling',()=>{
  for(const device of DEVICES){
    const plan=planDominoChain({...device,tiles:LEGAL_CHAIN,anchorIndex:13,padding:6});
    assert.equal(plan.placements.length,28,device.name);
    assert.notEqual(plan.mode,'unavailable',device.name);
    for(const placement of plan.placements){
      const bounds=boundsOf(placement,device.tileWidth,device.tileHeight);
      assert.ok(bounds.left>=5.8&&bounds.right<=device.width-5.8,`${device.name} horizontal clip`);
      assert.ok(bounds.top>=5.8&&bounds.bottom<=device.height-5.8,`${device.name} vertical clip`);
    }
  }
});

test('every game stage fits with opening at either side or middle on phones',()=>{
  for(const device of DEVICES.slice(0,2))for(let count=1;count<=28;count++){
    const tiles=LEGAL_CHAIN.slice(0,count);
    for(const anchorIndex of new Set([0,Math.floor((count-1)/2),count-1])){
      const plan=planDominoChain({...device,tiles,anchorIndex,padding:6});
      assert.equal(plan.placements.length,count,`${device.name}: ${count} tiles, anchor ${anchorIndex}`);
      assert.equal(plan.placements[anchorIndex].rotation%180,0);
    }
  }
});

test('normal play keeps readable scale tiers before emergency fitting',()=>{
  for(const device of DEVICES){
    const plan=planDominoChain({...device,tiles:LEGAL_CHAIN.slice(0,10),anchorIndex:4,padding:6});
    assert.ok(DOMINO_NORMAL_SCALES.includes(plan.scale),`${device.name} used ${plan.scale}`);
    assert.equal(plan.mode,'dual-arm');
  }
});
