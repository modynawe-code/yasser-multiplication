const SEGMENT_LENGTHS=Object.freeze([4,2,9,2,9,2,9]);
const LEFT_DIRECTIONS=Object.freeze(['left','down','right','down','left','down','right']);
const RIGHT_DIRECTIONS=Object.freeze(['right','up','left','up','right','up','left']);
const ANGLES=Object.freeze({right:0,down:90,left:180,up:270});

function clamp(value,min,max){return Math.min(max,Math.max(min,value));}
function normalizeNumber(value,fallback){const parsed=Number(value);return Number.isFinite(parsed)?parsed:fallback;}
function normalizeTile(tile){return {left:Number(tile?.left),right:Number(tile?.right)};}
function normalizeAngle(value){return ((value%360)+360)%360;}
function isDouble(tile){return tile.left===tile.right;}
function halfExtents(rotation,tileWidth,tileHeight){return rotation%180===0?{x:tileWidth/2,y:tileHeight/2}:{x:tileHeight/2,y:tileWidth/2};}
function axisFor(direction){return direction==='left'||direction==='right'?'x':'y';}
function coefficientFor(direction){return direction==='left'||direction==='up'?-1:1;}
function rowFor(side,segment){return side==='left'?-(segment+1):segment+1;}

function cornerCandidate(position,{direction,previousDirection,previousIsDouble,tileWidth,tileHeight}){
  const next={...position};
  if(direction==='down'||direction==='up'){
    const coefficientX=previousDirection==='left'?-1:1;
    const coefficientY=direction==='up'?-1:1;
    if(previousIsDouble){
      next.x+=tileHeight*coefficientX;
      next.y+=tileWidth*.5*coefficientY;
    }else{
      next.x+=tileWidth*.75*coefficientX;
      next.y+=tileWidth*.25*coefficientY;
    }
  }else{
    const coefficientX=previousDirection==='left'||direction==='left'?-1:1;
    const coefficientY=previousDirection==='up'||direction==='up'?-1:1;
    if(previousIsDouble)next.x+=tileWidth*coefficientX;
    else{
      next.x+=tileWidth*.75*coefficientX;
      next.y+=tileWidth*.25*coefficientY;
    }
  }
  return next;
}

function nudgeToTouch(previous,current,{tileWidth,tileHeight,overlap}){
  const previousHalf=halfExtents(previous.rotation,tileWidth,tileHeight);
  const currentHalf=halfExtents(current.rotation,tileWidth,tileHeight);
  const dx=current.x-previous.x,dy=current.y-previous.y;
  const gapX=Math.abs(dx)-(previousHalf.x+currentHalf.x);
  const gapY=Math.abs(dy)-(previousHalf.y+currentHalf.y);
  if(gapX>0)current.x-=Math.sign(dx)*(gapX+overlap);
  if(gapY>0)current.y-=Math.sign(dy)*(gapY+overlap);
  return current;
}

function placeArm({tiles,placements,anchorIndex,indices,directions,side,tileWidth,tileHeight,overlap}){
  let position={x:0,y:0},previousIndex=anchorIndex,previousDirection=null,cursor=0;
  for(let segment=0;segment<SEGMENT_LENGTHS.length&&cursor<indices.length;segment++){
    const direction=directions[segment],capacity=SEGMENT_LENGTHS[segment],group=indices.slice(cursor,cursor+capacity);
    const axis=axisFor(direction),coefficient=coefficientFor(direction);
    for(let item=0;item<group.length;item++){
      const index=group[item],tile=tiles[index],double=isDouble(tile);
      const movementAngle=ANGLES[direction];
      const flowAngle=side==='right'?movementAngle:normalizeAngle(movementAngle+180);
      const rotation=double?normalizeAngle(flowAngle+90):flowAngle;
      const previous=placements[previousIndex];
      if(segment===0&&item===0){
        const previousHalf=halfExtents(previous.rotation,tileWidth,tileHeight);
        const currentHalf=halfExtents(rotation,tileWidth,tileHeight);
        position[axis]+=coefficient*((axis==='x'?previousHalf.x+currentHalf.x:previousHalf.y+currentHalf.y)-overlap);
      }else if(item===0){
        position=cornerCandidate(position,{direction,previousDirection,previousIsDouble:isDouble(tiles[previousIndex]),tileWidth,tileHeight});
        const candidate={x:position.x,y:position.y,rotation};
        nudgeToTouch(previous,candidate,{tileWidth,tileHeight,overlap});
        position={x:candidate.x,y:candidate.y};
      }else{
        const previousHalf=halfExtents(previous.rotation,tileWidth,tileHeight);
        const currentHalf=halfExtents(rotation,tileWidth,tileHeight);
        position[axis]+=coefficient*((axis==='x'?previousHalf.x+currentHalf.x:previousHalf.y+currentHalf.y)-overlap);
      }
      placements[index]={x:position.x,y:position.y,rotation,pathRotation:movementAngle,row:rowFor(side,segment),isDouble:double,anchor:false};
      previousIndex=index;
    }
    cursor+=group.length;
    previousDirection=direction;
  }
}

function boundsFor(placements,tileWidth,tileHeight){
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
  for(const placement of placements){
    const half=halfExtents(placement.rotation,tileWidth,tileHeight);
    left=Math.min(left,placement.x-half.x);right=Math.max(right,placement.x+half.x);
    top=Math.min(top,placement.y-half.y);bottom=Math.max(bottom,placement.y+half.y);
  }
  return {left,right,top,bottom};
}

export function planDominoChain(options={}){
  const tiles=Array.isArray(options.tiles)?options.tiles.map(normalizeTile):[];
  const count=tiles.length,width=Math.max(0,normalizeNumber(options.width,0)),height=Math.max(0,normalizeNumber(options.height,0));
  const tileWidth=Math.max(24,normalizeNumber(options.tileWidth,82)),tileHeight=Math.max(16,normalizeNumber(options.tileHeight,44));
  const padding=Math.max(0,normalizeNumber(options.padding,6)),overlap=Math.max(1,normalizeNumber(options.overlap,1.5));
  const anchorIndex=clamp(Math.trunc(normalizeNumber(options.anchorIndex,0)),0,Math.max(0,count-1));
  if(!count||width<=0||height<=0)return Object.freeze({placements:Object.freeze([]),scale:1,anchorSlot:-1,capacity:28});
  const canonical=new Array(count);
  canonical[anchorIndex]={x:0,y:0,rotation:0,pathRotation:0,row:0,isDouble:isDouble(tiles[anchorIndex]),anchor:true};
  placeArm({tiles,placements:canonical,anchorIndex,indices:Array.from({length:anchorIndex},(_,offset)=>anchorIndex-1-offset),directions:LEFT_DIRECTIONS,side:'left',tileWidth,tileHeight,overlap});
  placeArm({tiles,placements:canonical,anchorIndex,indices:Array.from({length:count-anchorIndex-1},(_,offset)=>anchorIndex+1+offset),directions:RIGHT_DIRECTIONS,side:'right',tileWidth,tileHeight,overlap});
  if(canonical.some(item=>!item))return Object.freeze({placements:Object.freeze([]),scale:1,anchorSlot:-1,capacity:28});
  const bounds=boundsFor(canonical,tileWidth,tileHeight);
  const requiredHalfX=Math.max(Math.abs(bounds.left),Math.abs(bounds.right),tileWidth/2);
  const requiredHalfY=Math.max(Math.abs(bounds.top),Math.abs(bounds.bottom),tileHeight/2);
  const availableHalfX=Math.max(1,width/2-padding),availableHalfY=Math.max(1,height/2-padding);
  const scale=Math.min(1,availableHalfX/requiredHalfX,availableHalfY/requiredHalfY);
  const centerX=width/2,centerY=height/2;
  const placements=canonical.map(item=>Object.freeze({...item,x:centerX+item.x*scale,y:centerY+item.y*scale,scale}));
  return Object.freeze({placements:Object.freeze(placements),scale,anchorSlot:anchorIndex,capacity:28});
}
