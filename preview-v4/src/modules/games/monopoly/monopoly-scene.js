// Presentation geometry only. The engine/server still owns the destination.
export function movementRoute(from,to,{backward=false,teleport=false}={}){
  if(from===to)return[];
  if(teleport)return[to];
  const distance=backward?(from-to+40)%40:(to-from+40)%40;
  return Array.from({length:distance},(_,i)=>(from+(backward?-1:1)*(i+1)+40)%40);
}
export function boardEdge(index){return index<10?'bottom':index<20?'left':index<30?'top':'right';}
export function inwardDirection(index){
  if(index===0)return{x:-1,y:-1};
  if(index===10)return{x:1,y:-1};
  if(index===20)return{x:1,y:1};
  if(index===30)return{x:-1,y:1};
  const edge=boardEdge(index);return{x:edge==='left'?1:edge==='right'?-1:0,y:edge==='top'?1:edge==='bottom'?-1:0};
}
export function pieceOffset(index,slot){
  const d=inwardDirection(index);
  if(index%10===0&&slot>0&&slot<4){
    const positions=[[0,0],[1,1],[2,1],[1,2]];
    return{x:d.x*positions[slot][0]*36,y:d.y*positions[slot][1]*36};
  }
  return{x:d.x*slot*36,y:d.y*slot*36};
}
export function movementSegments(from,route){
  const points=[from,...route],segments=[];
  for(let i=0;i<points.length;){
    const edge=boardEdge(points[i]);let end=i+1;
    while(end<points.length&&end-i<4&&boardEdge(points[end])===edge)end++;
    segments.push({start:Math.max(0,i-1),indexes:points.slice(i,end)});i=end;
  }
  return segments;
}
export function eventArea(width,height,edge){
  const gap=10,status=46,reserve=Math.max(90,(edge==='left'||edge==='right'?width:height)*.2+32);
  let x=gap,y=status,w=width-gap*2,h=height-status-gap;
  if(edge==='bottom')h-=reserve;
  else if(edge==='top'){y=Math.max(status,reserve);h=height-y-gap;}
  else if(edge==='left'){x=reserve;w=width-x-gap;}
  else if(edge==='right')w=width-reserve-gap;
  const max=440;if(w>max){x+=(w-max)/2;w=max;}
  return{x,y,width:w,height:Math.max(100,h),reserve};
}
