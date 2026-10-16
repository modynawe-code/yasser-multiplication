const clampSize=value=>Math.max(2,Math.min(6,Math.trunc(Number(value)||3)));

export function puzzleBoardAspect(width,height){
  const imageWidth=Number(width),imageHeight=Number(height);
  return Number.isFinite(imageWidth)&&Number.isFinite(imageHeight)&&imageWidth>0&&imageHeight>0?imageWidth/imageHeight:1;
}

export function createPuzzleDefinition(size=3,{random=Math.random}={}){
  const rows=clampSize(size),columns=rows,pieces=[];
  const horizontal=Array.from({length:rows-1},()=>Array.from({length:columns},()=>random()<.5?1:-1));
  const vertical=Array.from({length:rows},()=>Array.from({length:columns-1},()=>random()<.5?1:-1));
  for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
    const index=row*columns+column;
    pieces.push(Object.freeze({
      id:index,row,column,
      edges:Object.freeze({
        top:row===0?0:-horizontal[row-1][column],
        right:column===columns-1?0:vertical[row][column],
        bottom:row===rows-1?0:horizontal[row][column],
        left:column===0?0:-vertical[row][column-1]
      })
    }));
  }
  let shuffled=pieces.map(piece=>piece.id);
  for(let index=shuffled.length-1;index>0;index--){const target=Math.floor(random()*(index+1));[shuffled[index],shuffled[target]]=[shuffled[target],shuffled[index]];}
  if(shuffled.every((piece,index)=>piece===index)&&shuffled.length>1)[shuffled[0],shuffled[1]]=[shuffled[1],shuffled[0]];
  return Object.freeze({rows,columns,pieces:Object.freeze(pieces),shuffled:Object.freeze(shuffled)});
}

export function puzzlePiecePath(edges,{cell=100,tab=.18}={}){
  const length=Number(cell)||100,depth=length*Math.max(.08,Math.min(.24,Number(tab)||.18));
  const point=(start,tangent,normal,distance,outset)=>[
    +(start[0]+tangent[0]*distance+normal[0]*outset).toFixed(2),
    +(start[1]+tangent[1]*distance+normal[1]*outset).toFixed(2)
  ];
  const edge=(start,tangent,normal,sign)=>{
    const end=point(start,tangent,normal,length,0);
    if(!sign)return`L${end[0]} ${end[1]}`;
    const out=depth*sign;
    const p1=point(start,tangent,normal,length*.30,0),p2=point(start,tangent,normal,length*.38,out),p3=point(start,tangent,normal,length*.42,out);
    const p4=point(start,tangent,normal,length*.44,out*1.9),p5=point(start,tangent,normal,length*.56,out*1.9),p6=point(start,tangent,normal,length*.58,out);
    const p7=point(start,tangent,normal,length*.62,out),p8=point(start,tangent,normal,length*.70,0);
    return`L${p1[0]} ${p1[1]} C${p2[0]} ${p2[1]} ${p3[0]} ${p3[1]} ${p3[0]} ${p3[1]} C${p4[0]} ${p4[1]} ${p5[0]} ${p5[1]} ${p6[0]} ${p6[1]} C${p7[0]} ${p7[1]} ${p8[0]} ${p8[1]} ${p8[0]} ${p8[1]} L${end[0]} ${end[1]}`;
  };
  return[
    `M0 0`,edge([0,0],[1,0],[0,-1],edges.top),
    edge([length,0],[0,1],[1,0],edges.right),
    edge([length,length],[-1,0],[0,1],edges.bottom),
    edge([0,length],[0,-1],[-1,0],edges.left),'Z'
  ].join(' ');
}

export function isPuzzleSolved(placements){
  return Array.isArray(placements)&&placements.length>0&&placements.every((piece,index)=>piece===index);
}
