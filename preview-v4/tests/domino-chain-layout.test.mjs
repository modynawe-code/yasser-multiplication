import test from 'node:test';
import assert from 'node:assert/strict';
import {DOMINO_NORMAL_SCALES,planDominoChain} from '../src/modules/games/domino/domino-chain-layout.js';
const tile=(left,right)=>({left,right});
const LEGAL_CHAIN=[tile(0,0),tile(0,1),tile(1,2),tile(2,2),tile(2,3),tile(3,4),tile(4,4),tile(4,5),tile(5,6),tile(6,6),tile(6,3),tile(3,3),tile(3,1),tile(1,1),tile(1,4),tile(4,6),tile(6,2),tile(2,5),tile(5,5),tile(5,0),tile(0,2),tile(2,4),tile(4,0),tile(0,3),tile(3,5),tile(5,1),tile(1,6),tile(6,0)];
function boundsOf(p,w,h){const vertical=p.rotation%180!==0;const width=(vertical?h:w)*p.scale,height=(vertical?w:h)*p.scale;return {left:p.x-width/2,right:p.x+width/2,top:p.y-height/2,bottom:p.y+height/2};}
function touches(a,b,w,h){const A=boundsOf(a,w,h),B=boundsOf(b,w,h);const gapX=Math.max(0,Math.max(A.left,B.left)-Math.min(A.right,B.right));const gapY=Math.max(0,Math.max(A.top,B.top)-Math.min(A.bottom,B.bottom));return gapX<.1&&gapY<.1;}
function overlapArea(a,b,w,h){const A=boundsOf(a,w,h),B=boundsOf(b,w,h);const overlapX=Math.max(0,Math.min(A.right,B.right)-Math.max(A.left,B.left));const overlapY=Math.max(0,Math.min(A.bottom,B.bottom)-Math.max(A.top,B.top));return overlapX*overlapY;}

test('visible chain stays centered as it grows',()=>{const o={width:680,height:360,tileWidth:82,tileHeight:44};for(const [tiles,anchor] of [[[tile(6,6)],0],[[tile(6,5),tile(6,6)],1],[[tile(6,5),tile(6,6),tile(6,2)],1]]){const p=planDominoChain({...o,tiles,anchorIndex:anchor});const bounds=p.placements.map(x=>boundsOf(x,82,44));const left=Math.min(...bounds.map(x=>x.left)),right=Math.max(...bounds.map(x=>x.right)),top=Math.min(...bounds.map(x=>x.top)),bottom=Math.max(...bounds.map(x=>x.bottom));assert.ok(Math.abs((left+right)/2-340)<.1);assert.ok(Math.abs((top+bottom)/2-180)<.1);}});

test('opening double is horizontal',()=>{const p=planDominoChain({tiles:[tile(6,6)],anchorIndex:0,width:500,height:300,tileWidth:82,tileHeight:44});assert.equal(p.placements[0].rotation%180,0);assert.equal(p.scale,1);});

test('desktop uses the full width before creating a turn',()=>{const tiles=[tile(2,0),tile(0,1),tile(1,5),tile(5,0),tile(0,3),tile(3,1),tile(1,4),tile(4,2)];const p=planDominoChain({tiles,anchorIndex:4,width:900,height:300,tileWidth:82,tileHeight:44,padding:6});assert.equal(p.scale,1);assert.ok(p.placements.every(x=>x.rotation%180===0));});

test('the same chain turns on a phone only after using available width',()=>{const tiles=[tile(2,0),tile(0,1),tile(1,5),tile(5,0),tile(0,3),tile(3,1),tile(1,4),tile(4,2)];const p=planDominoChain({tiles,anchorIndex:4,width:340,height:300,tileWidth:82,tileHeight:44,padding:6});assert.ok(DOMINO_NORMAL_SCALES.includes(p.scale));assert.ok(p.placements.some(x=>x.rotation%180!==0));const horizontal=p.placements.filter(x=>x.rotation%180===0);assert.ok(horizontal.length>=4);});

test('later doubles are perpendicular to local path',()=>{const tiles=[tile(6,4),tile(4,4),tile(4,3),tile(3,2),tile(2,2),tile(2,1),tile(1,0)];const p=planDominoChain({tiles,anchorIndex:3,width:680,height:360,tileWidth:82,tileHeight:44});for(const [i,t] of tiles.entries())if(i!==3&&t.left===t.right)assert.equal((p.placements[i].rotation-p.placements[i].pathRotation+360)%180,90);});

test('legal chain stays physically connected through dynamic turns and doubles',()=>{const p=planDominoChain({tiles:LEGAL_CHAIN,anchorIndex:13,width:680,height:360,tileWidth:82,tileHeight:44});assert.equal(p.placements.length,LEGAL_CHAIN.length);for(let i=0;i<p.placements.length-1;i++)assert.equal(touches(p.placements[i],p.placements[i+1],82,44),true,`gap at ${i}-${i+1}`);});

test('mid-game phone layout avoids material self-overlap',()=>{const tiles=LEGAL_CHAIN.slice(0,14);const p=planDominoChain({tiles,anchorIndex:6,width:340,height:300,tileWidth:82,tileHeight:44,padding:6});assert.equal(p.placements.length,14);const tileArea=82*44*p.scale*p.scale;for(let i=0;i<p.placements.length;i++)for(let j=i+2;j<p.placements.length;j++)assert.ok(overlapArea(p.placements[i],p.placements[j],82,44)<tileArea*.18,`material overlap ${i}-${j}`);});

test('normal phone play uses discrete readable scale tiers',()=>{for(const count of [1,7,14]){const tiles=LEGAL_CHAIN.slice(0,count);const p=planDominoChain({tiles,anchorIndex:Math.floor((count-1)/2),width:340,height:300,tileWidth:82,tileHeight:44,padding:6});assert.ok(DOMINO_NORMAL_SCALES.includes(p.scale),`count ${count} used ${p.scale}`);assert.equal(p.mode,'tiered');}});

test('maxScale prevents zooming back in during the same round',()=>{const tiles=LEGAL_CHAIN.slice(0,7);const p=planDominoChain({tiles,anchorIndex:3,width:340,height:300,tileWidth:82,tileHeight:44,padding:6,maxScale:.76});assert.ok(p.scale<=.76);});

test('full double-six stays inside phone tablet and desktop boards without horizontal scroll',()=>{const tiles=[];for(let l=0;l<=6;l++)for(let r=l;r<=6;r++)tiles.push(tile(l,r));for(const v of [{width:300,height:300},{width:680,height:360},{width:900,height:280}]){const p=planDominoChain({...v,tiles,anchorIndex:14,tileWidth:82,tileHeight:44,padding:6});assert.equal(p.placements.length,28);assert.notEqual(p.mode,'unavailable');assert.ok(new Set(p.placements.map(x=>x.row)).size>1);for(const x of p.placements){const b=boundsOf(x,82,44);assert.ok(b.left>=5.8);assert.ok(b.right<=v.width-5.8);assert.ok(b.top>=5.8);assert.ok(b.bottom<=v.height-5.8);}}});

test('long games use more rows before shrinking on each target device',()=>{const tiles=LEGAL_CHAIN.slice(0,20);for(const expected of [{width:340,height:300,minScale:.76,minRows:3},{width:680,height:360,minScale:.88,minRows:2},{width:900,height:280,minScale:.88,minRows:2}]){const p=planDominoChain({...expected,tiles,anchorIndex:9,tileWidth:82,tileHeight:44,padding:6});assert.ok(p.scale>=expected.minScale,`${expected.width}px shrank to ${p.scale}`);assert.ok(new Set(p.placements.map(x=>x.row)).size>=expected.minRows);}});

test('each lane change uses one explicit corner',()=>{const tiles=LEGAL_CHAIN.slice(0,20);const p=planDominoChain({tiles,anchorIndex:9,width:340,height:300,tileWidth:82,tileHeight:44,padding:6});const rows=new Set(p.placements.map(x=>x.row)).size,corners=p.placements.filter(x=>x.pathRotation===90).length;assert.equal(corners,rows-1);});
