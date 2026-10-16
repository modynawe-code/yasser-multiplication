/*
 * Classic domino rules adapted from andrew1407/Domino (MIT).
 * Upstream: https://github.com/andrew1407/Domino
 * Core behavior preserved: double-six deck, 7 tiles for two players / 5 for 3-4,
 * highest double (otherwise highest pip sum) opens automatically, draw-until-playable,
 * automatic skip when stock is empty, and dead-end detection.
 */

export const CLASSIC_MOVE_STATE=Object.freeze({AVAILABLE:'available',SKIPPABLE:'skippable',DEAD_END:'dead-end'});

export function parseClassicTile(tileId){
  const match=/^([0-6])-([0-6])$/.exec(String(tileId||''));
  if(!match)return null;
  return Object.freeze({left:Number(match[1]),right:Number(match[2])});
}

export function classicTileId(left,right){
  const a=Number(left),b=Number(right);
  if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||a>6||b<0||b>6)return null;
  return `${a}-${b}`;
}

export function createClassicDominoDeck(){
  const deck=[];
  for(let left=0;left<=6;left++)for(let right=0;right<=left;right++)deck.push(`${left}-${right}`);
  return deck;
}

export function distributeClassicDominoTiles(players,deck=createClassicDominoDeck(),random=Math.random){
  const remaining=[...deck],hands=Object.fromEntries(players.map(player=>[player,[]]));
  const handSize=players.length>2?5:7;
  for(const player of players){
    for(let index=0;index<handSize;index++){
      const pickedIndex=Math.floor(Math.max(0,Math.min(.999999999,Number(random())||0))*remaining.length);
      const[picked]=remaining.splice(pickedIndex,1);
      hands[player].push(picked);
    }
  }
  return{hands,stock:remaining};
}

export function pickClassicFirstMove(players,hands){
  let maxDouble=null,maxTileSum=null;
  const save=(target,playerId,tileId,tile)=>{target.playerId=playerId;target.tileId=tileId;target.tile=tile;};
  for(const playerId of players){
    for(const tileId of hands[playerId]||[]){
      const tile=parseClassicTile(tileId);if(!tile)continue;
      const sum=tile.left+tile.right;
      if(tile.left===tile.right){
        if(!maxDouble||maxDouble.tile.left<tile.left)save(maxDouble||(maxDouble={}),playerId,tileId,tile);
      }else if(!maxTileSum||maxTileSum.sum<sum){
        if(!maxTileSum)maxTileSum={};
        save(maxTileSum,playerId,tileId,tile);maxTileSum.sum=sum;
      }
    }
  }
  const found=maxDouble||maxTileSum;
  return found?Object.freeze({playerId:found.playerId,tileId:found.tileId,left:found.tile.left,right:found.tile.right}):null;
}

export function classicMovePermission(tileId,comparable,side){
  const tile=parseClassicTile(tileId);if(!tile||!comparable)return false;
  return side==='left'
    ? tile.left===comparable.left||tile.right===comparable.left
    : side==='right'
      ? tile.left===comparable.right||tile.right===comparable.right
      : false;
}

export function orientClassicMove(tileId,comparable,side){
  const tile=parseClassicTile(tileId);if(!tile||!comparable||!classicMovePermission(tileId,comparable,side))return null;
  if(side==='left'){
    const reversed=comparable.left!==tile.right;
    return reversed?{left:tile.right,right:tile.left}:{left:tile.left,right:tile.right};
  }
  const reversed=comparable.right!==tile.left;
  return reversed?{left:tile.right,right:tile.left}:{left:tile.left,right:tile.right};
}

export function classicTilePlayable(tileId,board){
  if(!board?.length)return true;
  const left=board[0],right=board[board.length-1];
  return classicMovePermission(tileId,left,'left')||classicMovePermission(tileId,right,'right');
}

export function classicPlayerHasMove(hand,board){return(hand||[]).some(tileId=>classicTilePlayable(tileId,board));}

export function classicAbleToPlay(currentPlayer,players,hands,stockSize,board){
  if(stockSize>0)return CLASSIC_MOVE_STATE.AVAILABLE;
  if(classicPlayerHasMove(hands[currentPlayer]||[],board))return CLASSIC_MOVE_STATE.AVAILABLE;
  const othersCanMove=players.some(playerId=>playerId!==currentPlayer&&classicPlayerHasMove(hands[playerId]||[],board));
  return othersCanMove?CLASSIC_MOVE_STATE.SKIPPABLE:CLASSIC_MOVE_STATE.DEAD_END;
}

export function classicPipSum(hand){
  return(hand||[]).reduce((sum,tileId)=>{const tile=parseClassicTile(tileId);return sum+(tile?tile.left+tile.right:0);},0);
}

export function classicBlockedWinner(players,hands){
  const totals=players.map(playerId=>({playerId,total:classicPipSum(hands[playerId]||[])}));
  const min=Math.min(...totals.map(item=>item.total));
  const winners=totals.filter(item=>item.total===min);
  return Object.freeze({winner:winners.length===1?winners[0].playerId:null,draw:winners.length!==1,totals:Object.freeze(totals)});
}
