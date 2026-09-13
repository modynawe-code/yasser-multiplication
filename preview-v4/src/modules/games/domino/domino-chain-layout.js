export const DOMINO_NORMAL_SCALES=Object.freeze([1,.88,.76]);
const EMERGENCY_SCALES=Object.freeze([.70,.64,.58,.52,.46]);
const ANGLES=Object.freeze({right:0,down:90,left:180});

function clamp(value,min,max){return Math.min(max,Math.max(min,value));}
function number(value,fallback){const parsed=Number(value);return Number.isFinite(parsed)?parsed:fallback;}
function normalizeTile(tile){return {left:Number(tile?.left),right:Number(tile?.right)};}
function isDouble(tile){return tile.left===tile.right;}
function halfExtents(rotation,tileWidth,tileHeight,scale){return rotation%180===0?{x:tileWidth*scale/2,y:tileHeight*scale/2}:{x:tileHeight*scale/2,y:tileWidth*scale/2};}
function boundsOf(item,tileWidth,tileHeight,scale){const half=halfExtents(item.rotation,tileWidth,tileHeight,scale);return {left:item.x-half.x,right:item.x+half.x,top:item.y-half.y,bottom:item.y+half.y};}
function rotationFor(tile,direction,index,anchorIndex){
  if(index===anchorIndex)return direction==='left'?180:0;
  const angle=ANGLES[direction];
  return isDouble(tile)?(angle+90)%360:angle;
}
function attached(previous,attachDirection,rotation,{tileWidth,tileHeight,scale,overlap}){
  const a=halfExtents(previous.rotation,tileWidth,tileHeight,scale),b=halfExtents(rotation,tileWidth,tileHeight,scale),join=overlap*scale;
  let x=previous.x,y=previous.y;
  if(attachDirection==='right')x+=a.x+b.x-join;
  else if(attachDirection==='left')x-=a.x+b.x-join;
  else y+=a.y+b.y-join;
  return {x,y,rotation};
}
function insideX(item,{width,padding,tileWidth,tileHeight,scale}){const bounds=boundsOf(item,tileWidth,tileHeight,scale);return bounds.left>=padding-.01&&bounds.right<=width-padding+.01;}
function centerPlacements(items,{width,height,padding,tileWidth,tileHeight,scale}){
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
  for(const item of items){const bounds=boundsOf(item,tileWidth,tileHeight,scale);left=Math.min(left,bounds.left);right=Math.max(right,bounds.right);top=Math.min(top,bounds.top);bottom=Math.max(bottom,bounds.bottom);}
  const desiredX=width/2-(left+right)/2,desiredY=height/2-(top+bottom)/2;
  const shiftX=clamp(desiredX,padding-left,width-padding-right),shiftY=clamp(desiredY,padding-top,height-padding-bottom);
  return items.map(item=>({...item,x:item.x+shiftX,y:item.y+shiftY}));
}
function fits(items,{width,height,padding,tileWidth,tileHeight,scale}){
  return items.every(item=>{const bounds=boundsOf(item,tileWidth,tileHeight,scale);return bounds.left>=padding-.01&&bounds.right<=width-padding+.01&&bounds.top>=padding-.01&&bounds.bottom<=height-padding+.01;});
}

/* One connected path in board order: full row, one clean corner, reverse row. */
function buildSerpentine({tiles,anchorIndex,width,height,padding,tileWidth,tileHeight,scale,overlap}){
  if(!tiles.length)return [];
  const context={width,height,padding,tileWidth,tileHeight,scale,overlap};
  const firstRotation=rotationFor(tiles[0],'right',0,anchorIndex),firstHalf=halfExtents(firstRotation,tileWidth,tileHeight,scale);
  const placements=[{x:padding+firstHalf.x,y:padding+tileWidth*scale/2,rotation:firstRotation,pathRotation:0,row:0,isDouble:isDouble(tiles[0]),anchor:anchorIndex===0}];
  let direction='right',row=0,previous=placements[0];
  for(let index=1;index<tiles.length;index++){
    const tile=tiles[index];
    const rotation=rotationFor(tile,direction,index,anchorIndex),straight=attached(previous,direction,rotation,context);
    if(insideX(straight,context)){
      Object.assign(straight,{pathRotation:ANGLES[direction],row,isDouble:isDouble(tile),anchor:index===anchorIndex});
      placements.push(straight);previous=straight;continue;
    }
    const cornerIndex=index-1,before=placements.at(-2);
    if(!before||cornerIndex===anchorIndex)return null;
    placements.pop();
    const corner=attached(before,direction,90,context);
    if(!insideX(corner,context))return null;
    Object.assign(corner,{pathRotation:90,row,isDouble:isDouble(tiles[cornerIndex]),anchor:false});
    placements.push(corner);
    direction=direction==='right'?'left':'right';row+=1;
    const exitRotation=rotationFor(tile,direction,index,anchorIndex),exit=attached(corner,'down',exitRotation,context);
    if(!insideX(exit,context))return null;
    Object.assign(exit,{pathRotation:ANGLES[direction],row,isDouble:isDouble(tile),anchor:index===anchorIndex});
    placements.push(exit);previous=exit;
  }
  const centered=centerPlacements(placements,context);
  return fits(centered,context)?centered:null;
}
function preferredScaleIndex(count,width,height,tileWidth,tileHeight){const density=(count*tileWidth*tileHeight)/Math.max(1,width*height);if(density<=.38)return 0;if(density<=.68)return 1;return 2;}
function candidateScales({count,width,height,tileWidth,tileHeight,maxScale}){
  const preferred=preferredScaleIndex(count,width,height,tileWidth,tileHeight),ceiling=clamp(number(maxScale,1),.35,1);
  const normal=DOMINO_NORMAL_SCALES.slice(preferred).filter(scale=>scale<=ceiling+.001);
  const emergency=EMERGENCY_SCALES.filter(scale=>scale<=ceiling+.001&&scale<(normal.at(-1)??1)-.001),values=[...normal,...emergency];
  if(!values.length)values.push(Math.min(ceiling,.46));
  return values;
}
export function planDominoChain(options={}){
  const tiles=Array.isArray(options.tiles)?options.tiles.map(normalizeTile):[],count=tiles.length;
  const width=Math.max(0,number(options.width,0)),height=Math.max(0,number(options.height,0));
  const tileWidth=Math.max(24,number(options.tileWidth,82)),tileHeight=Math.max(16,number(options.tileHeight,44));
  const padding=Math.max(0,number(options.padding,6)),overlap=Math.max(1,number(options.overlap,1.5));
  const anchorIndex=clamp(Math.trunc(number(options.anchorIndex,0)),0,Math.max(0,count-1));
  if(!count||width<=0||height<=0)return Object.freeze({placements:Object.freeze([]),scale:1,anchorSlot:-1,capacity:28,mode:'empty'});
  const scales=candidateScales({count,width,height,tileWidth,tileHeight,maxScale:options.maxScale});
  for(const scale of scales){
    const placements=buildSerpentine({tiles,anchorIndex,width,height,padding,tileWidth,tileHeight,scale,overlap});
    if(!placements)continue;
    return Object.freeze({placements:Object.freeze(placements.map(item=>Object.freeze({...item,scale}))),scale,anchorSlot:anchorIndex,capacity:28,mode:DOMINO_NORMAL_SCALES.includes(scale)?'tiered':'emergency-fit'});
  }
  return Object.freeze({placements:Object.freeze([]),scale:scales.at(-1)??1,anchorSlot:anchorIndex,capacity:28,mode:'unavailable'});
}
