export const DOMINO_NORMAL_SCALES=Object.freeze([1,.88,.76]);
const EMERGENCY_SCALES=Object.freeze([.70,.64,.58,.52,.46]);
const ANGLES=Object.freeze({right:0,down:90,left:180,up:270});

function clamp(value,min,max){return Math.min(max,Math.max(min,value));}
function normalizeNumber(value,fallback){const parsed=Number(value);return Number.isFinite(parsed)?parsed:fallback;}
function normalizeTile(tile){return {left:Number(tile?.left),right:Number(tile?.right)};}
function normalizeAngle(value){return ((value%360)+360)%360;}
function isDouble(tile){return tile.left===tile.right;}
function oppositeHorizontal(direction){return direction==='left'?'right':'left';}
function halfExtents(rotation,tileWidth,tileHeight){return rotation%180===0?{x:tileWidth/2,y:tileHeight/2}:{x:tileHeight/2,y:tileWidth/2};}
function rotationFor(tile,direction,side){
  const movementAngle=ANGLES[direction];
  const flowAngle=side==='right'?movementAngle:normalizeAngle(movementAngle+180);
  return isDouble(tile)?normalizeAngle(flowAngle+90):flowAngle;
}
function rowFor(side,lane){return side==='left'?-(lane+1):lane+1;}
function scaledExtents(rotation,tileWidth,tileHeight,scale){return halfExtents(rotation,tileWidth*scale,tileHeight*scale);}

function straightArmSpan({tiles,indices,side,direction,tileWidth,tileHeight,scale,overlap,anchorRotation=0}){
  const anchorHalf=scaledExtents(anchorRotation,tileWidth,tileHeight,scale).x;
  if(!indices.length)return anchorHalf;
  let distance=0,previousRotation=anchorRotation,currentHalfX=anchorHalf;
  for(const index of indices){
    const rotation=rotationFor(tiles[index],direction,side);
    const previousHalf=scaledExtents(previousRotation,tileWidth,tileHeight,scale);
    const currentHalf=scaledExtents(rotation,tileWidth,tileHeight,scale);
    distance+=previousHalf.x+currentHalf.x-overlap*scale;
    previousRotation=rotation;
    currentHalfX=currentHalf.x;
  }
  return distance+currentHalfX;
}

function centerChainInBoard(placements,{width,height,padding,tileWidth,tileHeight,scale}){
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
  for(const placement of placements){
    const half=scaledExtents(placement.rotation,tileWidth,tileHeight,scale);
    left=Math.min(left,placement.x-half.x);
    right=Math.max(right,placement.x+half.x);
    top=Math.min(top,placement.y-half.y);
    bottom=Math.max(bottom,placement.y+half.y);
  }
  const desiredX=width/2-(left+right)/2;
  const desiredY=height/2-(top+bottom)/2;
  const shiftX=clamp(desiredX,padding-left,width-padding-right);
  const shiftY=clamp(desiredY,padding-top,height-padding-bottom);
  return placements.map(item=>({...item,x:item.x+shiftX,y:item.y+shiftY}));
}

function withinBoard(candidate,{width,height,padding,tileWidth,tileHeight,scale}){
  const half=scaledExtents(candidate.rotation,tileWidth,tileHeight,scale);
  return candidate.x-half.x>=padding-.01&&candidate.x+half.x<=width-padding+.01&&candidate.y-half.y>=padding-.01&&candidate.y+half.y<=height-padding+.01;
}

function attachedCandidate(previous,attachDirection,pathDirection,tile,{side,tileWidth,tileHeight,scale,overlap}){
  const rotation=rotationFor(tile,pathDirection,side);
  const previousHalf=scaledExtents(previous.rotation,tileWidth,tileHeight,scale);
  const currentHalf=scaledExtents(rotation,tileWidth,tileHeight,scale);
  const visualOverlap=overlap*scale;
  let x=previous.x,y=previous.y;
  if(attachDirection==='right')x+=previousHalf.x+currentHalf.x-visualOverlap;
  else if(attachDirection==='left')x-=previousHalf.x+currentHalf.x-visualOverlap;
  else if(attachDirection==='down')y+=previousHalf.y+currentHalf.y-visualOverlap;
  else y-=previousHalf.y+currentHalf.y-visualOverlap;
  return {x,y,rotation,pathRotation:ANGLES[pathDirection],isDouble:isDouble(tile),anchor:false};
}

function clampTurnInside(candidate,{horizontalDirection,nextTile,side,width,padding,tileWidth,tileHeight,scale}){
  const currentHalf=scaledExtents(candidate.rotation,tileWidth,tileHeight,scale);
  let requiredHalfX=currentHalf.x;
  if(nextTile){
    const exitDirection=oppositeHorizontal(horizontalDirection);
    const exitRotation=rotationFor(nextTile,exitDirection,side);
    requiredHalfX=Math.max(requiredHalfX,scaledExtents(exitRotation,tileWidth,tileHeight,scale).x);
  }
  if(horizontalDirection==='right')candidate.x=Math.min(candidate.x,width-padding-requiredHalfX);
  else candidate.x=Math.max(candidate.x,padding+requiredHalfX);
  return candidate;
}

function clampExitInside(candidate,{width,padding,tileWidth,tileHeight,scale}){
  const half=scaledExtents(candidate.rotation,tileWidth,tileHeight,scale);
  candidate.x=clamp(candidate.x,padding+half.x,width-padding-half.x);
  return candidate;
}

function placeArmDynamic({tiles,placements,anchorIndex,indices,side,startHorizontal,verticalDirection,width,height,padding,tileWidth,tileHeight,scale,overlap}){
  if(!indices.length)return true;
  let previous=placements[anchorIndex];
  let horizontalDirection=startHorizontal;
  let phase='horizontal';
  let verticalOriginY=null;
  let lane=0;
  const scaledWidth=tileWidth*scale,scaledHeight=tileHeight*scale;
  const laneTarget=Math.max(scaledHeight*1.2,(scaledWidth+scaledHeight)/2-overlap*scale);
  const context={side,width,height,padding,tileWidth,tileHeight,scale,overlap};

  for(let position=0;position<indices.length;position++){
    const index=indices[position],tile=tiles[index],finalItem=position===indices.length-1;
    let candidate;
    if(phase==='horizontal'){
      const straight=attachedCandidate(previous,horizontalDirection,horizontalDirection,tile,context);
      const straightHalf=scaledExtents(straight.rotation,tileWidth,tileHeight,scale);
      const sideRoom=horizontalDirection==='right'
        ?width-padding-(straight.x+straightHalf.x)
        :(straight.x-straightHalf.x)-padding;
      const canStayStraight=withinBoard(straight,context)&&(finalItem||sideRoom>=scaledHeight*.55);
      if(canStayStraight){
        candidate=straight;
      }else{
        candidate=attachedCandidate(previous,horizontalDirection,verticalDirection,tile,context);
        const nextTile=finalItem?null:tiles[indices[position+1]];
        clampTurnInside(candidate,{horizontalDirection,nextTile,side,width,padding,tileWidth,tileHeight,scale});
        if(!withinBoard(candidate,context))return false;
        phase='vertical';
        verticalOriginY=candidate.y;
      }
    }else{
      const moved=Math.abs(previous.y-verticalOriginY);
      if(moved>=laneTarget){
        const nextHorizontal=oppositeHorizontal(horizontalDirection);
        candidate=attachedCandidate(previous,verticalDirection,nextHorizontal,tile,context);
        clampExitInside(candidate,{width,padding,tileWidth,tileHeight,scale});
        if(!withinBoard(candidate,context))return false;
        horizontalDirection=nextHorizontal;
        phase='horizontal';
        lane+=1;
        verticalOriginY=null;
      }else{
        candidate=attachedCandidate(previous,verticalDirection,verticalDirection,tile,context);
        if(!withinBoard(candidate,context))return false;
      }
    }
    candidate.row=rowFor(side,lane);
    placements[index]=Object.freeze(candidate);
    previous=candidate;
  }
  return true;
}

function preferredScaleIndex(count,width,height,tileWidth,tileHeight){
  const density=(count*tileWidth*tileHeight)/Math.max(1,width*height);
  if(density<=.34)return 0;
  if(density<=.62)return 1;
  return 2;
}

function candidateScales({count,width,height,tileWidth,tileHeight,maxScale}){
  const preferredIndex=preferredScaleIndex(count,width,height,tileWidth,tileHeight);
  const ceiling=clamp(normalizeNumber(maxScale,1),.35,1);
  const normal=DOMINO_NORMAL_SCALES.slice(preferredIndex).filter(scale=>scale<=ceiling+.001);
  const emergency=EMERGENCY_SCALES.filter(scale=>scale<=ceiling+.001&&scale<(normal.at(-1)??1)-.001);
  const values=[...normal,...emergency];
  if(!values.length)values.push(Math.min(ceiling,.46));
  return values;
}

function attemptLayout({tiles,anchorIndex,width,height,padding,tileWidth,tileHeight,overlap,scale}){
  const placements=new Array(tiles.length);
  const leftIndices=Array.from({length:anchorIndex},(_,offset)=>anchorIndex-1-offset);
  const rightIndices=Array.from({length:tiles.length-anchorIndex-1},(_,offset)=>anchorIndex+1+offset);
  const leftSpan=straightArmSpan({tiles,indices:leftIndices,side:'left',direction:'left',tileWidth,tileHeight,scale,overlap});
  const rightSpan=straightArmSpan({tiles,indices:rightIndices,side:'right',direction:'right',tileWidth,tileHeight,scale,overlap});
  const anchorHalf=scaledExtents(0,tileWidth,tileHeight,scale).x;
  const straightFits=leftSpan+rightSpan<=width-padding*2+.01;
  const preferredAnchorX=straightFits?width/2+(leftSpan-rightSpan)/2:width/2;
  const anchorX=clamp(preferredAnchorX,padding+anchorHalf,width-padding-anchorHalf);
  placements[anchorIndex]=Object.freeze({
    x:anchorX,y:height/2,rotation:0,pathRotation:0,row:0,isDouble:isDouble(tiles[anchorIndex]),anchor:true,scale
  });
  const common={tiles,placements,anchorIndex,width,height,padding,tileWidth,tileHeight,scale,overlap};
  const leftOk=placeArmDynamic({...common,indices:leftIndices,side:'left',startHorizontal:'left',verticalDirection:'down'});
  if(!leftOk)return null;
  const rightOk=placeArmDynamic({...common,indices:rightIndices,side:'right',startHorizontal:'right',verticalDirection:'up'});
  if(!rightOk)return null;
  if(placements.some(item=>!item))return null;
  const centered=centerChainInBoard(placements,{width,height,padding,tileWidth,tileHeight,scale});
  return Object.freeze(centered.map(item=>Object.freeze({...item,scale})));
}

export function planDominoChain(options={}){
  const tiles=Array.isArray(options.tiles)?options.tiles.map(normalizeTile):[];
  const count=tiles.length,width=Math.max(0,normalizeNumber(options.width,0)),height=Math.max(0,normalizeNumber(options.height,0));
  const tileWidth=Math.max(24,normalizeNumber(options.tileWidth,82)),tileHeight=Math.max(16,normalizeNumber(options.tileHeight,44));
  const padding=Math.max(0,normalizeNumber(options.padding,6)),overlap=Math.max(1,normalizeNumber(options.overlap,1.5));
  const anchorIndex=clamp(Math.trunc(normalizeNumber(options.anchorIndex,0)),0,Math.max(0,count-1));
  if(!count||width<=0||height<=0)return Object.freeze({placements:Object.freeze([]),scale:1,anchorSlot:-1,capacity:28,mode:'empty'});

  const scales=candidateScales({count,width,height,tileWidth,tileHeight,maxScale:options.maxScale});
  for(const scale of scales){
    const placements=attemptLayout({tiles,anchorIndex,width,height,padding,tileWidth,tileHeight,overlap,scale});
    if(!placements)continue;
    const mode=DOMINO_NORMAL_SCALES.includes(scale)?'tiered':'emergency-fit';
    return Object.freeze({placements,scale,anchorSlot:anchorIndex,capacity:28,mode});
  }

  return Object.freeze({placements:Object.freeze([]),scale:scales.at(-1)??1,anchorSlot:anchorIndex,capacity:28,mode:'unavailable'});
}
