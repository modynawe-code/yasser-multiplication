const DEFAULT_SCALES=Object.freeze([1,.94,.88,.82,.76,.70,.66]);

function clamp(value,min,max){return Math.min(max,Math.max(min,value));}
function normalizeNumber(value,fallback){const parsed=Number(value);return Number.isFinite(parsed)?parsed:fallback;}
function normalizeTile(tile){return {left:Number(tile?.left),right:Number(tile?.right)};}

function buildTrack({width,height,tileWidth,tileHeight,padding,scale}){
  const w=tileWidth*scale,h=tileHeight*scale,overlap=Math.max(1,2*scale);
  const horizontalStep=Math.max(w*.86,w-overlap);
  const connectorStep=Math.max((w+h)/2-overlap,h*.95);
  const rowStep=connectorStep;
  const left=padding+w/2,right=width-padding-w/2;
  const firstY=padding+w/2;
  if(right<left||height-padding-firstY<w/2)return [];
  const slots=[];
  let direction=1;
  let previousX=null;
  for(let row=0;;row++){
    const y=firstY+row*rowStep;
    if(y+w/2>height-padding+.01)break;
    if(row===0){
      for(let x=left;x<=right+.01;x+=horizontalStep)slots.push({x,y,pathRotation:0,row});
    }else{
      const connectorX=clamp(previousX,left,right);
      slots.push({x:connectorX,y,pathRotation:90,row});
      let x=connectorX+direction*connectorStep;
      if(direction>0){for(;x<=right+.01;x+=horizontalStep)slots.push({x,y,pathRotation:0,row});}
      else{for(;x>=left-.01;x-=horizontalStep)slots.push({x,y,pathRotation:180,row});}
    }
    if(slots.length===0)break;
    previousX=slots.at(-1).x;
    direction*=-1;
  }
  return slots;
}

function chooseAnchorSlot(slots,{count,anchorIndex,width,height}){
  const minSlot=anchorIndex;
  const maxSlot=slots.length-(count-anchorIndex);
  if(minSlot>maxSlot)return -1;
  const cx=width/2,cy=height/2;
  let best=-1,bestScore=Infinity;
  for(let index=minSlot;index<=maxSlot;index++){
    const slot=slots[index];
    const verticalPenalty=slot.pathRotation%180===0?0:Math.max(width,height)*.15;
    const score=Math.hypot(slot.x-cx,slot.y-cy)+verticalPenalty;
    if(score<bestScore){bestScore=score;best=index;}
  }
  return best;
}

export function planDominoChain(options={}){
  const tiles=Array.isArray(options.tiles)?options.tiles.map(normalizeTile):[];
  const count=tiles.length;
  const width=Math.max(0,normalizeNumber(options.width,0));
  const height=Math.max(0,normalizeNumber(options.height,0));
  const tileWidth=Math.max(24,normalizeNumber(options.tileWidth,82));
  const tileHeight=Math.max(16,normalizeNumber(options.tileHeight,44));
  const padding=Math.max(0,normalizeNumber(options.padding,6));
  const anchorIndex=clamp(Math.trunc(normalizeNumber(options.anchorIndex,0)),0,Math.max(0,count-1));
  if(!count||width<=0||height<=0)return Object.freeze({placements:Object.freeze([]),scale:1,anchorSlot:-1,capacity:0});
  const scales=[...DEFAULT_SCALES];
  const requestedMin=clamp(normalizeNumber(options.minScale,.66),.5,1);
  if(requestedMin<scales.at(-1))scales.push(requestedMin);
  let chosen=null;
  for(const scale of scales){
    if(scale<requestedMin-.001)continue;
    const slots=buildTrack({width,height,tileWidth,tileHeight,padding,scale});
    const anchorSlot=chooseAnchorSlot(slots,{count,anchorIndex,width,height});
    if(anchorSlot>=0){chosen={scale,slots,anchorSlot};break;}
  }
  if(!chosen){
    const scale=requestedMin;
    const slots=buildTrack({width,height,tileWidth,tileHeight,padding,scale});
    const anchorSlot=chooseAnchorSlot(slots,{count,anchorIndex,width,height});
    chosen={scale,slots,anchorSlot};
  }
  const {scale,slots,anchorSlot}=chosen;
  if(anchorSlot<0)return Object.freeze({placements:Object.freeze([]),scale,anchorSlot:-1,capacity:slots.length});
  const start=anchorSlot-anchorIndex;
  const placements=tiles.map((tile,index)=>{
    const slot=slots[start+index];
    const isDouble=tile.left===tile.right;
    const rotation=(slot.pathRotation+(isDouble?90:0)+360)%360;
    return Object.freeze({x:slot.x,y:slot.y,rotation,pathRotation:slot.pathRotation,scale,row:slot.row,isDouble});
  });
  return Object.freeze({placements:Object.freeze(placements),scale,anchorSlot,capacity:slots.length});
}
