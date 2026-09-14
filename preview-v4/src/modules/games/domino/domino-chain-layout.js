export const DOMINO_NORMAL_SCALES=Object.freeze([1,.88,.76]);
const EMERGENCY_SCALES=Object.freeze([.70,.64,.58,.52,.48,.46]);
const ANGLES=Object.freeze({right:0,left:180});

function clamp(value,min,max){return Math.min(max,Math.max(min,value));}
function number(value,fallback){const parsed=Number(value);return Number.isFinite(parsed)?parsed:fallback;}
function normalizeTile(tile){return {left:Number(tile?.left),right:Number(tile?.right)};}
function isDouble(tile){return tile.left===tile.right;}
function halfExtents(rotation,tileWidth,tileHeight,scale){return rotation%180===0?{x:tileWidth*scale/2,y:tileHeight*scale/2}:{x:tileHeight*scale/2,y:tileWidth*scale/2};}
function boundsOf(item,context){const half=halfExtents(item.rotation,context.tileWidth,context.tileHeight,context.scale);return {left:item.x-half.x,right:item.x+half.x,top:item.y-half.y,bottom:item.y+half.y};}
function rotationFor(tile,direction,{anchor=false,corner=false,verticalSign=1}={}){
  if(anchor)return 0;
  if(corner)return direction==='right'?(verticalSign>0?90:270):(verticalSign>0?270:90);
  const angle=ANGLES[direction];
  return isDouble(tile)?(angle+90)%360:angle;
}
function attached(previous,direction,rotation,context,y=previous.y){
  const a=halfExtents(previous.rotation,context.tileWidth,context.tileHeight,context.scale);
  const b=halfExtents(rotation,context.tileWidth,context.tileHeight,context.scale);
  const distance=a.x+b.x-context.overlap*context.scale;
  return{x:previous.x+(direction==='right'?distance:-distance),y,rotation};
}
function insideHorizontal(item,minX,maxX,context){const bounds=boundsOf(item,context);return bounds.left>=minX-.01&&bounds.right<=maxX+.01;}
function flatArmNeed(tiles,direction,context){
  let previous={x:0,y:0,rotation:0},outer=direction==='right'?boundsOf(previous,context).right:-boundsOf(previous,context).left;
  for(const tile of tiles){const item=attached(previous,direction,rotationFor(tile,direction),context);const bounds=boundsOf(item,context);outer=direction==='right'?Math.max(outer,bounds.right):Math.max(outer,-bounds.left);previous=item;}
  return outer;
}
function collides(item,index,items,context){return items.some(other=>Math.abs(index-other.index)>1&&materialOverlap({...item,index},other,context)>.5);}
function available(item,index,items,context){return insideHorizontal(item,context.padding,context.width-context.padding,context)&&!collides(item,index,items,context);}
function placeArm({tiles,indices,direction,verticalSign,anchor,occupied,context}){
  const rowPitch=(context.tileWidth/2+context.tileHeight/2+6)*context.scale;
  let explored=0;
  function search(position,previous,currentDirection,row,afterCorner,placed){
    if(position>=indices.length)return placed;
    if(++explored>5000)return null;
    const items=[...occupied,...placed],index=indices[position];
    const tile=tiles[index];
    if(afterCorner){
      const rotation=rotationFor(tile,currentDirection);
      const item=attached(previous,currentDirection,rotation,context,previous.y+verticalSign*rowPitch/2);
      if(!available(item,index,items,context))return null;
      Object.assign(item,{pathRotation:ANGLES[currentDirection],row:verticalSign*row,isDouble:isDouble(tile),anchor:false,index});
      return search(position+1,item,currentDirection,row,false,[...placed,item]);
    }
    const rotation=rotationFor(tile,currentDirection),straight=attached(previous,currentDirection,rotation,context);
    if(available(straight,index,items,context)){
      Object.assign(straight,{pathRotation:ANGLES[currentDirection],row:verticalSign*row,isDouble:isDouble(tile),anchor:false,index});
      const result=search(position+1,straight,currentDirection,row,false,[...placed,straight]);
      if(result)return result;
    }
    if(isDouble(tile))return null;
    const cornerRotation=rotationFor(tile,currentDirection,{corner:true,verticalSign});
    const corner=attached(previous,currentDirection,cornerRotation,context,previous.y+verticalSign*rowPitch/2);
    if(!available(corner,index,items,context))return null;
    Object.assign(corner,{pathRotation:verticalSign>0?90:270,row:verticalSign*row,isDouble:false,anchor:false,index});
    return search(position+1,corner,currentDirection==='right'?'left':'right',row+1,true,[...placed,corner]);
  }
  return search(0,anchor,direction,0,false,[]);
}
function materialOverlap(a,b,context){
  const A=boundsOf(a,context),B=boundsOf(b,context);
  return Math.max(0,Math.min(A.right,B.right)-Math.max(A.left,B.left))*Math.max(0,Math.min(A.bottom,B.bottom)-Math.max(A.top,B.top));
}
function validLayout(items,context){
  for(const item of items){const bounds=boundsOf(item,context);if(bounds.left<context.padding-.01||bounds.right>context.width-context.padding+.01||bounds.top<context.padding-.01||bounds.bottom>context.height-context.padding+.01)return false;}
  for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++)if(Math.abs(items[i].index-items[j].index)>1&&materialOverlap(items[i],items[j],context)>.5)return false;
  return true;
}
function centerVertically(items,context){
  let top=Infinity,bottom=-Infinity;
  for(const item of items){const bounds=boundsOf(item,context);top=Math.min(top,bounds.top);bottom=Math.max(bottom,bounds.bottom);}
  const shift=context.height/2-(top+bottom)/2;
  return items.map(item=>({...item,y:item.y+shift}));
}
function buildDualArm({tiles,anchorIndex,width,height,padding,tileWidth,tileHeight,scale,overlap}){
  const context={width,height,padding,tileWidth,tileHeight,scale,overlap};
  const leftIndices=Array.from({length:anchorIndex},(_,i)=>anchorIndex-1-i);
  const rightIndices=Array.from({length:tiles.length-anchorIndex-1},(_,i)=>anchorIndex+1+i);
  const leftNeed=flatArmNeed(leftIndices.map(index=>tiles[index]),'left',context);
  const rightNeed=flatArmNeed(rightIndices.map(index=>tiles[index]),'right',context);
  const usable=width-padding*2,totalNeed=leftNeed+rightNeed;
  const anchorHalf=tileWidth*scale/2,minSide=Math.min(usable/2,anchorHalf+tileHeight*scale);
  const ideal=totalNeed<=usable?padding+(usable-totalNeed)/2+leftNeed:padding+usable*(leftNeed/Math.max(1,totalNeed));
  const minX=padding+minSide,maxX=width-padding-minSide,startX=clamp(ideal,minX,maxX);
  const candidates=[startX];
  for(let offset=4;offset<=maxX-minX+4;offset+=4){
    if(startX-offset>=minX)candidates.push(startX-offset);
    if(startX+offset<=maxX)candidates.push(startX+offset);
  }
  for(const anchorX of candidates){
    const anchor={x:anchorX,y:0,rotation:0,pathRotation:0,row:0,isDouble:isDouble(tiles[anchorIndex]),anchor:true,index:anchorIndex};
    let left,right;
    right=placeArm({tiles,indices:rightIndices,direction:'right',verticalSign:1,anchor,occupied:[anchor],context});
    if(right)left=placeArm({tiles,indices:leftIndices,direction:'left',verticalSign:-1,anchor,occupied:[anchor,...right],context});
    if(!left){
      left=placeArm({tiles,indices:leftIndices,direction:'left',verticalSign:-1,anchor,occupied:[anchor],context});
      right=left&&placeArm({tiles,indices:rightIndices,direction:'right',verticalSign:1,anchor,occupied:[anchor,...left],context});
    }
    if(!left||!right)continue;
    const centered=centerVertically([anchor,...left,...right],context);
    if(!validLayout(centered,context))continue;
    return centered.sort((a,b)=>a.index-b.index).map(({index,...item})=>item);
  }
  return null;
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
    const placements=buildDualArm({tiles,anchorIndex,width,height,padding,tileWidth,tileHeight,scale,overlap});
    if(!placements)continue;
    return Object.freeze({placements:Object.freeze(placements.map(item=>Object.freeze({...item,scale}))),scale,anchorSlot:anchorIndex,capacity:28,mode:DOMINO_NORMAL_SCALES.includes(scale)?'dual-arm':'emergency-fit'});
  }
  return Object.freeze({placements:Object.freeze([]),scale:scales.at(-1)??1,anchorSlot:anchorIndex,capacity:28,mode:'unavailable'});
}
