export const DIE_PIPS=Object.freeze({1:['center'],2:['top-left','bottom-right'],3:['top-left','center','bottom-right'],4:['top-left','top-right','bottom-left','bottom-right'],5:['top-left','top-right','center','bottom-left','bottom-right'],6:['top-left','top-right','middle-left','middle-right','bottom-left','bottom-right']});
export const diePips=face=>(DIE_PIPS[face]||DIE_PIPS[5]).map(position=>`<i class="pip pip-${position}${face===5&&position==='center'?' pip-accent':''}" aria-hidden="true"></i>`).join('');
const orientations={1:[0,0],2:[0,-90],3:[-90,0],4:[90,0],5:[0,90],6:[0,180]};
export function cubeMarkup(value=1){const [x,y]=orientations[value]||orientations[1];return `<span class="vault-die-shadow"></span><span class="vault-cube" style="--rx:${x}deg;--ry:${y}deg">${[1,2,3,4,5,6].map(n=>`<span class="vault-face vault-face-${n}"><span class="die-face">${diePips(n)}</span></span>`).join('')}</span>`;}
export async function animateDie(element,value,{reduced=false,sound=null}={}){
 if(!element)return;const cube=element.querySelector('.vault-cube');if(!cube)return;const [x,y]=orientations[value]||orientations[1];sound?.();
 if(reduced){cube.style.transform=`rotateX(${x}deg) rotateY(${y}deg)`;return;}
 const final=`rotateX(${x}deg) rotateY(${y}deg)`;
 const animation=cube.animate([{transform:'translateY(0) rotateX(15deg) rotateY(-25deg)'},{transform:'translateY(-32px) translateX(-18px) rotateX(210deg) rotateY(250deg)',offset:.27},{transform:'translateY(8px) translateX(14px) rotateX(410deg) rotateY(490deg)',offset:.56},{transform:`translateY(-13px) translateX(-5px) rotateX(${720+x-30}deg) rotateY(${720+y+25}deg)`,offset:.76},{transform:`translateY(3px) rotateX(${720+x+8}deg) rotateY(${720+y-6}deg)`,offset:.9},{transform:`rotateX(${720+x}deg) rotateY(${720+y}deg)`}],{duration:1050,easing:'ease-out',fill:'forwards'});
 try{await animation.finished;}catch{}cube.style.transform=final;animation.cancel();
}
