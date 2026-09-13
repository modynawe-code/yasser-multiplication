import {planDominoChain} from './domino-chain-layout.js';

const PIPS=Object.freeze({
  0:Object.freeze([]),
  1:Object.freeze(['mm']),
  2:Object.freeze(['tl','br']),
  3:Object.freeze(['tl','mm','br']),
  4:Object.freeze(['tl','tr','bl','br']),
  5:Object.freeze(['tl','tr','mm','bl','br']),
  6:Object.freeze(['tl','ml','bl','tr','mr','br'])
});

const ASSET_ROOT='assets/domino/tiles';
const SVG_WIDTH=122;
const SVG_HEIGHT=64;
const HALF_WIDTH=61;
const PIP_COORDS=Object.freeze({
  tl:[15.5,16],tm:[30.5,16],tr:[45.5,16],
  ml:[15.5,32],mm:[30.5,32],mr:[45.5,32],
  bl:[15.5,48],bm:[30.5,48],br:[45.5,48]
});

export const DOMINO_PIP_POSITIONS=PIPS;

function normalizeValue(value){
  const parsed=Number(value);
  if(!Number.isInteger(parsed)||parsed<0||parsed>6)throw new RangeError(`Invalid domino value: ${value}`);
  return parsed;
}

export function dominoAssetKey(left,right){
  const a=normalizeValue(left),b=normalizeValue(right);
  return `${Math.max(a,b)}-${Math.min(a,b)}`;
}

export function dominoAssetPath(left,right){
  return `${ASSET_ROOT}/${dominoAssetKey(left,right)}.svg`;
}

export function dominoHalfMarkup(value){
  const normalized=normalizeValue(value);
  const pips=PIPS[normalized].map(position=>`<i class="domino-pip pip-${position}" aria-hidden="true"></i>`).join('');
  return `<span class="domino-half" data-value="${normalized}" aria-hidden="true">${pips}</span>`;
}

function dominoSvgPips(value,offsetX){
  return PIPS[value].map(position=>{
    const [x,y]=PIP_COORDS[position];
    return `<circle class="domino-svg-pip" cx="${x+offsetX}" cy="${y}" r="4.9"></circle><circle class="domino-svg-pip-highlight" cx="${x+offsetX-1.3}" cy="${y-1.4}" r="1.15"></circle>`;
  }).join('');
}

export function dominoFaceMarkup(left,right,{faceDown=false}={}){
  const a=normalizeValue(left),b=normalizeValue(right);
  if(faceDown)return '<span class="domino-back-face" aria-hidden="true"><i></i></span>';

  const referencePath=dominoAssetPath(a,b);
  return `<svg class="domino-reference-face" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" preserveAspectRatio="xMidYMid meet" data-reference="${referencePath}" data-left="${a}" data-right="${b}" aria-hidden="true" focusable="false">
    <rect class="domino-svg-shadow" x="3" y="4" width="116" height="58" rx="10"></rect>
    <rect class="domino-svg-body" x="1.5" y="1.5" width="119" height="59" rx="10"></rect>
    <rect class="domino-svg-inner" x="4.5" y="4.5" width="113" height="53" rx="7.5"></rect>
    <line class="domino-svg-divider-shadow" x1="${HALF_WIDTH+1}" y1="8" x2="${HALF_WIDTH+1}" y2="56"></line>
    <line class="domino-svg-divider" x1="${HALF_WIDTH}" y1="8" x2="${HALF_WIDTH}" y2="56"></line>
    ${dominoSvgPips(a,0)}
    ${dominoSvgPips(b,HALF_WIDTH)}
  </svg>`;
}

function readLegacyValues(tile){
  const legacy=[...tile.children].filter(node=>node.tagName==='SPAN');
  if(legacy.length<2)return null;
  const left=Number(legacy[0].textContent?.trim()),right=Number(legacy.at(-1).textContent?.trim());
  if(!Number.isInteger(left)||left<0||left>6||!Number.isInteger(right)||right<0||right>6)return null;
  return[left,right];
}

export function enhanceDominoTile(tile){
  if(!tile||tile.dataset.dominoVisual==='true')return false;
  const values=readLegacyValues(tile);
  if(!values)return false;
  const[left,right]=values;
  tile.dataset.dominoVisual='true';
  tile.dataset.left=String(left);
  tile.dataset.right=String(right);
  tile.classList.toggle('is-double',left===right);
  tile.setAttribute('role','img');
  tile.setAttribute('aria-label',`قطعة دومينو ${left} و ${right}`);
  tile.innerHTML=dominoFaceMarkup(left,right);
  return true;
}

function numericStyle(node,property,fallback){
  if(typeof getComputedStyle!=='function')return fallback;
  const value=parseFloat(getComputedStyle(node)[property]);
  return Number.isFinite(value)&&value>0?value:fallback;
}

export function decorateBoard(root){
  const board=root.querySelector?.('#dominoBoard');
  if(!board)return;
  const tiles=[...board.querySelectorAll(':scope > .domino-tile')];
  tiles.forEach((tile,index)=>{
    tile.classList.add('domino-board-tile');
    tile.classList.remove('chain-turn','vertical');
    tile.style.setProperty('--chain-order',String(index));
  });
  if(!tiles.length){
    delete board.dataset.layoutScale;
    delete board.dataset.layoutAnchorKey;
    delete board.dataset.layoutMode;
    board.classList.remove('is-laid-out');
    return;
  }

  const width=board.clientWidth||board.getBoundingClientRect?.().width||0;
  const height=board.clientHeight||board.getBoundingClientRect?.().height||0;
  if(width<80||height<80)return;

  const tileWidth=numericStyle(tiles[0],'width',82);
  const tileHeight=numericStyle(tiles[0],'height',44);
  const anchorKey=board.dataset.anchorKey||'';
  const found=tiles.findIndex(tile=>tile.dataset.dominoKey===anchorKey);
  const anchorIndex=found>=0?found:0;
  const plan=planDominoChain({
    tiles:tiles.map(tile=>({left:Number(tile.dataset.left),right:Number(tile.dataset.right)})),
    anchorIndex,width,height,tileWidth,tileHeight,padding:6
  });
  if(plan.placements.length!==tiles.length)return;

  tiles.forEach((tile,index)=>{
    const placement=plan.placements[index];
    tile.style.left=`${placement.x-tileWidth/2}px`;
    tile.style.top=`${placement.y-tileHeight/2}px`;
    tile.style.setProperty('--domino-board-rotation',`${placement.rotation}deg`);
    tile.style.setProperty('--domino-board-scale',String(placement.scale));
    tile.dataset.pathRotation=String(placement.pathRotation);
    tile.dataset.layoutRow=String(placement.row);
    tile.dataset.anchor=placement.anchor?'true':'false';
  });
  board.classList.add('is-laid-out');
  board.style.setProperty('--domino-layout-scale',String(plan.scale));
  board.dataset.layoutScale=String(plan.scale);
  board.dataset.layoutMode=plan.mode;
}

export function enhanceDominoTiles(root=document){
  const scope=root?.querySelectorAll?root:document;
  scope.querySelectorAll('.domino-tile').forEach(enhanceDominoTile);
  decorateBoard(scope);
}

function ensureStyle(href,key){
  if(typeof document==='undefined'||document.querySelector(`link[data-module-style="${key}"]`))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href=href;
  link.dataset.moduleStyle=key;
  document.head.appendChild(link);
}

export function installDominoVisuals(root=document){
  ensureStyle('src/modules/games/domino/domino-visuals.css','domino-visuals');
  ensureStyle('src/modules/games/domino/domino-chain-layout.css','domino-chain-layout');
  ensureStyle('src/modules/games/domino/domino-reference-assets.css','domino-reference-assets');
  if(!root||typeof MutationObserver==='undefined')return null;
  if(root.__dominoVisualObserver)return root.__dominoVisualObserver;

  let scheduled=false;
  const refresh=()=>{scheduled=false;enhanceDominoTiles(root);};
  const schedule=()=>{
    if(scheduled)return;
    scheduled=true;
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(refresh);
    else queueMicrotask(refresh);
  };

  enhanceDominoTiles(root);
  const observer=new MutationObserver(schedule);
  observer.observe(root,{childList:true,subtree:true});
  if(typeof ResizeObserver!=='undefined'){
    const board=root.querySelector?.('#dominoBoard');
    if(board){
      const resizeObserver=new ResizeObserver(schedule);
      resizeObserver.observe(board);
      Object.defineProperty(root,'__dominoResizeObserver',{value:resizeObserver,configurable:true});
    }
  }
  Object.defineProperty(root,'__dominoVisualObserver',{value:observer,configurable:true});
  return observer;
}
