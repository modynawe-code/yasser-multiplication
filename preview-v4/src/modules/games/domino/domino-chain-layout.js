export const DOMINO_NORMAL_SCALES=Object.freeze([1,.88,.76]);
const EMERGENCY_SCALES=Object.freeze([.70,.64,.58,.52,.48,.46]);

function clamp(value,min,max){return Math.min(max,Math.max(min,value));}
function number(value,fallback){const parsed=Number(value);return Number.isFinite(parsed)?parsed:fallback;}
function normalizeTile(tile){return {left:Number(tile?.left),right:Number(tile?.right)};}
function isDouble(tile){return tile.left===tile.right;}
function halfExtents(rotation,context){return rotation%180===0?{x:context.long/2,y:context.short/2}:{x:context.short/2,y:context.long/2};}
function boundsOf(item,context){const half=halfExtents(item.rotation,context);return {left:item.x-half.x,right:item.x+half.x,top:item.y-half.y,bottom:item.y+half.y};}
function inside(item,context){const b=boundsOf(item,context);return b.left>=context.padding-.01&&b.right<=context.width-context.padding+.01&&b.top>=context.padding-.01&&b.bottom<=context.height-context.padding+.01;}
function overlapArea(a,b,context){const A=boundsOf(a,context),B=boundsOf(b,context);return Math.max(0,Math.min(A.right,B.right)-Math.max(A.left,B.left))*Math.max(0,Math.min(A.bottom,B.bottom)-Math.max(A.top,B.top));}
function collides(item,index,placed,context){return placed.some(other=>Math.abs(index-other.index)>1&&overlapArea({...item,index},other,context)>.5);}
function point(x,y){return Object.freeze({x,y});}
function placement({index,tile,x,y,rotation,pathRotation,row,anchor=false,leftPort,rightPort,corner=false}){
  return {index,x,y,rotation,pathRotation,row,anchor,isDouble:isDouble(tile),corner,ports:Object.freeze({left:leftPort,right:rightPort})};
}

function straightCandidate({index,tile,port,rowY,direction,arm,row,context}){
  const double=isDouble(tile),half=double?context.short/2:context.long/2;
  const x=port.x+direction*half,y=rowY;
  let rotation;
  if(double)rotation=direction>0?90:270;
  else rotation=arm==='right'?(direction>0?0:180):(direction>0?180:0);
  const exit=point(x+direction*half,rowY),entry=point(port.x,rowY);
  return placement({index,tile,x,y,rotation,pathRotation:direction>0?0:180,row,
    leftPort:arm==='right'?entry:exit,rightPort:arm==='right'?exit:entry});
}

function cornerCandidate({index,tile,port,rowY,direction,verticalSign,arm,row,context}){
  const nextY=rowY+verticalSign*context.rowPitch;
  const x=port.x,y=(rowY+nextY)/2;
  const entry=point(port.x,rowY),exit=point(port.x,nextY);
  const entryIsLeft=arm==='right';
  const rotation=entryIsLeft?(verticalSign>0?90:270):(verticalSign>0?270:90);
  return placement({index,tile,x,y,rotation,pathRotation:verticalSign>0?90:270,row:row+verticalSign,corner:true,
    leftPort:entryIsLeft?entry:exit,rightPort:entryIsLeft?exit:entry});
}

function outgoingPort(item,arm){return arm==='right'?item.ports.right:item.ports.left;}
function clearanceAfter(item,direction,arm,context){const edge=direction>0?context.width-context.padding:context.padding;const port=outgoingPort(item,arm);return direction>0?edge-port.x:port.x-edge;}
function canPlace(item,index,placed,context){return inside(item,context)&&!collides(item,index,placed,context);}

function buildArm({tiles,indices,arm,anchor,occupied,context}){
  const verticalSign=arm==='right'?1:-1;
  let direction=arm==='right'?1:-1;
  let port=arm==='right'?anchor.ports.right:anchor.ports.left;
  let rowY=anchor.y,row=0;
  const placed=[];
  for(const index of indices){
    const tile=tiles[index],all=[...occupied,...placed];
    const straight=straightCandidate({index,tile,port,rowY,direction,arm,row,context});
    const reserve=context.short+context.long/2;
    const mustTurn=!isDouble(tile)&&(!canPlace(straight,index,all,context)||clearanceAfter(straight,direction,arm,context)<reserve);
    if(mustTurn){
      const corner=cornerCandidate({index,tile,port,rowY,direction,verticalSign,arm,row,context});
      if(!canPlace(corner,index,all,context))return null;
      placed.push(corner);
      port=outgoingPort(corner,arm);
      rowY=port.y;row+=verticalSign;direction*=-1;
      continue;
    }
    if(!canPlace(straight,index,all,context))return null;
    placed.push(straight);
    port=outgoingPort(straight,arm);
  }
  return placed;
}

function validConnections(items,tiles,anchorIndex){
  const byIndex=new Map(items.map(item=>[item.index,item]));
  for(let index=0;index<tiles.length-1;index++){
    if(tiles[index].right!==tiles[index+1].left)return false;
    const a=byIndex.get(index)?.ports.right,b=byIndex.get(index+1)?.ports.left;
    if(!a||!b||Math.abs(a.x-b.x)>.01||Math.abs(a.y-b.y)>.01)return false;
  }
  return byIndex.get(anchorIndex)?.rotation===0;
}

function buildLayout({tiles,anchorIndex,width,height,padding,tileWidth,tileHeight,scale}){
  const context={width,height,padding,long:tileWidth*scale,short:tileHeight*scale,rowPitch:tileWidth*scale};
  const anchorTile=tiles[anchorIndex],anchorX=width/2;
  const leftCount=anchorIndex,rightCount=tiles.length-anchorIndex-1,totalArms=Math.max(1,leftCount+rightCount);
  const minAnchorY=padding+context.long/2,maxAnchorY=height-padding-context.long/2;
  const anchorY=leftCount===rightCount?height/2:minAnchorY+(maxAnchorY-minAnchorY)*(leftCount/totalArms);
  const anchor=placement({index:anchorIndex,tile:anchorTile,x:anchorX,y:anchorY,rotation:0,pathRotation:0,row:0,anchor:true,
    leftPort:point(anchorX-context.long/2,anchorY),rightPort:point(anchorX+context.long/2,anchorY)});
  if(!inside(anchor,context))return null;
  const rightIndices=Array.from({length:tiles.length-anchorIndex-1},(_,i)=>anchorIndex+1+i);
  const leftIndices=Array.from({length:anchorIndex},(_,i)=>anchorIndex-1-i);
  const right=buildArm({tiles,indices:rightIndices,arm:'right',anchor,occupied:[anchor],context});
  if(!right)return null;
  const left=buildArm({tiles,indices:leftIndices,arm:'left',anchor,occupied:[anchor,...right],context});
  if(!left)return null;
  const items=[anchor,...left,...right];
  if(!validConnections(items,tiles,anchorIndex))return null;
  return items.sort((a,b)=>a.index-b.index).map(({index,...item})=>item);
}

function candidateScales(maxScale){
  const ceiling=clamp(number(maxScale,1),.35,1);
  const values=[...DOMINO_NORMAL_SCALES,...EMERGENCY_SCALES].filter(scale=>scale<=ceiling+.001);
  return values.length?values:[Math.min(ceiling,.46)];
}

export function planDominoChain(options={}){
  const tiles=Array.isArray(options.tiles)?options.tiles.map(normalizeTile):[],count=tiles.length;
  const width=Math.max(0,number(options.width,0)),height=Math.max(0,number(options.height,0));
  const tileWidth=Math.max(24,number(options.tileWidth,82)),tileHeight=Math.max(16,number(options.tileHeight,44));
  const padding=Math.max(0,number(options.padding,6));
  const anchorIndex=clamp(Math.trunc(number(options.anchorIndex,0)),0,Math.max(0,count-1));
  if(!count||width<=0||height<=0)return Object.freeze({placements:Object.freeze([]),scale:1,anchorSlot:-1,capacity:28,mode:'empty'});
  const scales=candidateScales(options.maxScale);
  for(const scale of scales){
    const placements=buildLayout({tiles,anchorIndex,width,height,padding,tileWidth,tileHeight,scale});
    if(!placements)continue;
    return Object.freeze({placements:Object.freeze(placements.map(item=>Object.freeze({...item,scale}))),scale,anchorSlot:anchorIndex,capacity:28,mode:DOMINO_NORMAL_SCALES.includes(scale)?'connected-grid':'emergency-fit'});
  }
  return Object.freeze({placements:Object.freeze([]),scale:scales.at(-1)??1,anchorSlot:anchorIndex,capacity:28,mode:'unavailable'});
}
