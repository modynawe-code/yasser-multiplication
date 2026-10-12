import test from 'node:test';
import assert from 'node:assert/strict';
import {movementRoute,movementSegments,eventArea,boardEdge} from '../src/modules/games/monopoly/monopoly-scene.js';
import {cameraTransform} from '../src/modules/games/monopoly/monopoly-interaction.js';

test('presentation route handles passing start, reverse cards and jail without inventing a roll',()=>{
 assert.deepEqual(movementRoute(38,3),[39,0,1,2,3]);
 assert.deepEqual(movementRoute(1,38,{backward:true}),[0,39,38]);
 assert.deepEqual(movementRoute(7,10,{teleport:true}),[10]);
 assert.deepEqual(movementRoute(7,7),[]);
});
test('camera segments remain on one board edge and cover long routes in small groups',()=>{
 for(let from=0;from<40;from++)for(let count=1;count<=12;count++){
   const route=movementRoute(from,(from+count)%40),segments=movementSegments(from,route);
   assert.deepEqual(segments.flatMap(s=>s.indexes),[from,...route]);
   for(const segment of segments){assert.ok(segment.indexes.length<=4);assert.equal(new Set(segment.indexes.map(boardEdge)).size,1);}
 }
});
test('event card leaves a clear arrival lane on every edge at phone and tablet sizes',()=>{
 for(const size of [354,384,700,768])for(const edge of ['top','bottom','left','right']){
   const area=eventArea(size,size,edge);
   assert.ok(area.x>=0&&area.y>=0&&area.x+area.width<=size&&area.y+area.height<=size);
   const world={x:edge==='left'?size*.125:edge==='right'?size*.875:size*.5,y:edge==='top'?size*.125:edge==='bottom'?size*.875:size*.5};
   const anchor={x:edge==='left'?.12:edge==='right'?.88:.5,y:edge==='top'?.12:edge==='bottom'?.88:.5};
   const t=cameraTransform(size,size,world,1.25,anchor),x=world.x*t.scale+t.x,y=world.y*t.scale+t.y;
   const radius=16+8;
   assert.ok(x+radius<=area.x||x-radius>=area.x+area.width||y+radius<=area.y||y-radius>=area.y+area.height,`${size} ${edge}`);
 }
});
