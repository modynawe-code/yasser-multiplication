function normalizeSides(sides){return Array.isArray(sides)?sides.filter(side=>side==='left'||side==='right'):[];}
export function dominoSideChoiceIsEquivalent(state,sides){const legal=normalizeSides(sides);return legal.length===2&&Number(state?.leftEnd)===Number(state?.rightEnd);}
export function chooseAutomaticDominoSide({state,sides,anchorIndex=0}={}){
  const legal=normalizeSides(sides);
  if(legal.length===0)return null;
  if(legal.length===1)return legal[0];
  if(!dominoSideChoiceIsEquivalent(state,legal))return null;
  const boardLength=Array.isArray(state?.board)?state.board.length:0;
  const safeAnchor=Math.max(0,Math.min(boardLength-1,Number.isFinite(Number(anchorIndex))?Math.trunc(Number(anchorIndex)):0));
  const leftCount=safeAnchor;
  const rightCount=Math.max(0,boardLength-1-safeAnchor);
  return leftCount<=rightCount?'left':'right';
}
