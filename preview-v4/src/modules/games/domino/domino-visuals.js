const PIPS=Object.freeze({
  0:Object.freeze([]),
  1:Object.freeze(['mm']),
  2:Object.freeze(['tl','br']),
  3:Object.freeze(['tl','mm','br']),
  4:Object.freeze(['tl','tr','bl','br']),
  5:Object.freeze(['tl','tr','mm','bl','br']),
  6:Object.freeze(['tl','ml','bl','tr','mr','br'])
});

export const DOMINO_PIP_POSITIONS=PIPS;

function normalizeValue(value){
  const parsed=Number(value);
  if(!Number.isInteger(parsed)||parsed<0||parsed>6)throw new RangeError(`Invalid domino value: ${value}`);
  return parsed;
}

export function dominoHalfMarkup(value){
  const normalized=normalizeValue(value);
  const pips=PIPS[normalized].map(position=>`<i class="domino-pip pip-${position}" aria-hidden="true"></i>`).join('');
  return `<span class="domino-half" data-value="${normalized}" aria-hidden="true">${pips}</span>`;
}

export function dominoFaceMarkup(left,right,{faceDown=false}={}){
  const a=normalizeValue(left),b=normalizeValue(right);
  if(faceDown)return '<span class="domino-back-face" aria-hidden="true"><i></i></span>';
  return `${dominoHalfMarkup(a)}<span class="domino-divider" aria-hidden="true"></span>${dominoHalfMarkup(b)}`;
}

function readLegacyValues(tile){
  const legacy=[...tile.children].filter(node=>node.tagName==='SPAN');
  if(legacy.length<2)return null;
  const left=Number(legacy[0].textContent?.trim()),right=Number(legacy.at(-1).textContent?.trim());
  if(!Number.isInteger(left)||left<0||left>6||!Number.isInteger(right)||right<0||right>6)return null;
  return [left,right];
}

export function enhanceDominoTile(tile){
  if(!tile||tile.dataset.dominoVisual==='true')return false;
  const values=readLegacyValues(tile);if(!values)return false;
  const[left,right]=values;
  tile.dataset.dominoVisual='true';tile.dataset.left=String(left);tile.dataset.right=String(right);
  tile.classList.toggle('is-double',left===right);
  tile.setAttribute('role','img');tile.setAttribute('aria-label',`قطعة دومينو ${left} و ${right}`);
  tile.innerHTML=dominoFaceMarkup(left,right);
  return true;
}

function decorateBoard(root){
  const board=root.querySelector?.('#dominoBoard');if(!board)return;
  const tiles=[...board.querySelectorAll(':scope > .domino-tile')];
  tiles.forEach((tile,index)=>{
    tile.classList.add('domino-board-tile');
    tile.classList.remove('chain-turn');
    tile.classList.toggle('vertical',tile.classList.contains('is-double'));
    tile.style.setProperty('--chain-order',String(index));
  });
}

export function enhanceDominoTiles(root=document){
  const scope=root?.querySelectorAll?root:document;
  scope.querySelectorAll('.domino-tile').forEach(enhanceDominoTile);
  decorateBoard(scope);
}

function ensureVisualStyle(){
  if(typeof document==='undefined'||document.querySelector('link[data-module-style="domino-visuals"]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='src/modules/games/domino/domino-visuals.css';link.dataset.moduleStyle='domino-visuals';document.head.appendChild(link);
}

export function installDominoVisuals(root=document){
  ensureVisualStyle();
  if(!root||typeof MutationObserver==='undefined')return null;
  if(root.__dominoVisualObserver)return root.__dominoVisualObserver;
  let scheduled=false;
  const refresh=()=>{
    scheduled=false;
    enhanceDominoTiles(root);
  };
  const schedule=()=>{
    if(scheduled)return;scheduled=true;
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(refresh);else queueMicrotask(refresh);
  };
  enhanceDominoTiles(root);
  const observer=new MutationObserver(schedule);
  observer.observe(root,{childList:true,subtree:true});
  Object.defineProperty(root,'__dominoVisualObserver',{value:observer,configurable:true});
  return observer;
}
