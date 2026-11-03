// Optional, self-hosted genuine Three.js geometry. This layer never chooses dice outcomes.
import {
  WebGLRenderer,Scene,PerspectiveCamera,AmbientLight,DirectionalLight,
  Mesh,BoxGeometry,MeshStandardMaterial,CanvasTexture,Group,
  PlaneGeometry,MeshBasicMaterial,DoubleSide,Vector3,Quaternion,SRGBColorSpace
} from 'three';
import {gsap} from 'gsap';

const FACES=[3,4,2,5,1,6]; // BoxGeometry: +X,-X,+Y,-Y,+Z,-Z. Camera faces +Z.
const NORMALS=[
  new Vector3(1,0,0),new Vector3(-1,0,0),
  new Vector3(0,1,0),new Vector3(0,-1,0),
  new Vector3(0,0,1),new Vector3(0,0,-1)
];
const PIPS={
  1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],
  4:[[-1,-1],[1,-1],[-1,1],[1,1]],
  5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],
  6:[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]
};
function faceTexture(n){
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=256;
  const c=canvas.getContext('2d');
  if(!c)throw new Error('2D texture context unavailable');
  c.fillStyle='#fff7df';c.fillRect(0,0,256,256);
  c.strokeStyle='#e2d0a2';c.lineWidth=9;c.strokeRect(6,6,244,244);
  c.fillStyle='#16392e';
  for(const [x,y] of PIPS[n]){
    c.beginPath();c.arc(128+x*61,128+y*61,17,0,Math.PI*2);c.fill();
  }
  const texture=new CanvasTexture(canvas);
  texture.colorSpace=SRGBColorSpace;
  return texture;
}
export function createThreeDice(board){
  let renderer;
  try{
    renderer=new WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(1.5,Math.max(1,window.devicePixelRatio||1)));
  }catch(error){
    renderer?.dispose();
    throw error;
  }
  const canvas=renderer.domElement;
  canvas.className='tv-three-dice-canvas';
  canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:8';
  board.append(canvas);
  const scene=new Scene();
  const camera=new PerspectiveCamera(38,1,.1,40);
  camera.position.set(0,0,10);
  const ambient=new AmbientLight(0xffffff,2.1);scene.add(ambient);
  const key=new DirectionalLight(0xffedce,3.2);
  key.position.set(-3,5,8);scene.add(key);
  const fill=new DirectionalLight(0x91bdb2,1.1);
  fill.position.set(4,-2,5);scene.add(fill);
  const textures=[1,2,3,4,5,6].map(faceTexture);
  const materials=FACES.map(n=>new MeshStandardMaterial({
    map:textures[n-1],roughness:.32,metalness:.06
  }));
  const geometry=new BoxGeometry(1.45,1.45,1.45);
  const group=new Group();scene.add(group);
  const dice=[0,1].map(i=>{
    const die=new Mesh(geometry,materials);
    die.position.x=(i===0?-1:1)*1.13;
    group.add(die);return die;
  });
  // Contact shadow is a transparent plane behind the cubes.
  const shadowGeometry=new PlaneGeometry(1.8,1.8);
  const shadowMaterial=new MeshBasicMaterial({color:0x071b16,transparent:true,opacity:.24,side:DoubleSide,depthWrite:false});
  const shadows=dice.map((die)=>{
    const m=new Mesh(shadowGeometry,shadowMaterial);
    m.position.set(die.position.x+.15,-.55,-1.45);
    group.add(m);return m;
  });
  let timeline=null,disposed=false,shown=false;
  function resize(){
    if(disposed)return;
    const w=Math.max(1,board.clientWidth),h=Math.max(1,board.clientHeight);
    renderer.setSize(w,h,false);
    camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  function draw(){
    if(disposed)return;
    resize();
    renderer.render(scene,camera);
  }
  function clear(){
    timeline?.kill();timeline=null;
    shown=false;canvas.style.visibility='hidden';
  }
  async function roll(values){
    if(disposed||!Array.isArray(values)||values.length!==2||
      !values.every(v=>Number.isInteger(v)&&v>=1&&v<=6))return false;
    clear();
    const target=values.map(value=>{
      const normal=NORMALS[FACES.indexOf(value)];
      return new Quaternion().setFromUnitVectors(normal,new Vector3(0,0,1));
    });
    dice.forEach((die,i)=>{
      die.position.set((i===0?-1:1)*1.13,-.2,0);
      die.quaternion.copy(target[i]);
      die.rotation.x+=Math.PI*2;die.rotation.y+=Math.PI*2;
    });
    shown=true;canvas.style.visibility='visible';
    draw();
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      dice.forEach((die,i)=>die.quaternion.copy(target[i]));
      draw();return true;
    }
    return await new Promise(resolve=>{
      const tl=gsap.timeline({
        onUpdate:draw,
        onComplete:()=>{
          timeline=null;
          dice.forEach((die,i)=>die.quaternion.copy(target[i]));
          draw();resolve(true);
        },
        onInterrupt:()=>{timeline=null;resolve(false);}
      });
      timeline=tl;
      dice.forEach((die,i)=>{
        die.quaternion.copy(target[i]);
        // GSAP rotates exactly two full revolutions and lands on the server face.
        const rx=die.rotation.x,ry=die.rotation.y;
        tl.fromTo(die.position,{y:2.7+i*.5},{y:-.2,duration:.85,ease:'bounce.out'},i*.09);
        tl.fromTo(die.rotation,{x:rx,y:ry},{x:rx+Math.PI*2,y:ry+Math.PI*2,duration:.77,ease:'power3.out'},i*.09);
      });
    });
  }
  function destroy(){
    if(disposed)return;
    clear();disposed=true;
    for(const t of textures)t.dispose();
    for(const m of materials)m.dispose();
    geometry.dispose();shadowGeometry.dispose();shadowMaterial.dispose();
    renderer.dispose();canvas.remove();
  }
  canvas.style.visibility='hidden';
  return {roll,clear,resize:draw,destroy,get active(){return shown;},engine:'three.js'};
}
