// Optional, self-hosted genuine Three.js geometry. This layer never chooses dice outcomes.
import {
  WebGLRenderer,Scene,PerspectiveCamera,AmbientLight,DirectionalLight,
  Mesh,BoxGeometry,MeshStandardMaterial,CanvasTexture,Group,
  PlaneGeometry,MeshBasicMaterial,DoubleSide,Vector3,Quaternion,SRGBColorSpace,
  CylinderGeometry,SphereGeometry,CircleGeometry
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
  const geometry=new BoxGeometry(1.03,1.03,1.03);
  const group=new Group();scene.add(group);
  const dice=[0,1].map(i=>{
    const die=new Mesh(geometry,materials);
    die.position.x=(i===0?-1:1)*.76;
    group.add(die);return die;
  });
  // Contact shadow is a transparent plane behind the cubes.
  const shadowGeometry=new PlaneGeometry(1.25,1.25);
  const shadowMaterial=new MeshBasicMaterial({color:0x071b16,transparent:true,opacity:.24,side:DoubleSide,depthWrite:false});
  const shadows=dice.map((die)=>{
    const m=new Mesh(shadowGeometry,shadowMaterial);
    m.position.set(die.position.x+.10,-.35,-.9);
    group.add(m);return m;
  });
  // A real, light-reactive 3D tabletop. Original forty tiles stay exact in the
  // source artwork; only its printed center is overpainted with a felt inlay.
  const boardGroup=new Group();scene.add(boardGroup);
  const boardResources=[];
  let boardTexture=null,boardReady=false,artVersion=0;
  const BOARD_DEPTH=-.83;
  const surfaceHeight=2*Math.tan(camera.fov*Math.PI/360)*(camera.position.z-BOARD_DEPTH);
  const slabMat=new MeshStandardMaterial({color:0x77502d,roughness:.52,metalness:.08});
  const rimMat=new MeshStandardMaterial({color:0xcea55a,roughness:.28,metalness:.62});
  const feltMat=new MeshStandardMaterial({color:0x173c2c,roughness:.94,metalness:0});
  const slabGeo=new BoxGeometry(surfaceHeight+.12,surfaceHeight+.12,.26);
  const feltGeo=new BoxGeometry(surfaceHeight+.23,surfaceHeight+.23,.13);
  const rimGeoHorizontal=new BoxGeometry(surfaceHeight+.32,.085,.2);
  const rimGeoVertical=new BoxGeometry(.085,surfaceHeight+.32,.2);
  boardResources.push(slabMat,rimMat,feltMat,slabGeo,feltGeo,rimGeoHorizontal,rimGeoVertical);
  const feltSlab=new Mesh(feltGeo,feltMat);
  feltSlab.position.z=BOARD_DEPTH-.36;boardGroup.add(feltSlab);
  const slab=new Mesh(slabGeo,slabMat);
  slab.position.z=BOARD_DEPTH-.18;boardGroup.add(slab);
  for(const side of [-1,1]){
    const h=new Mesh(rimGeoHorizontal,rimMat);
    h.position.set(0,side*(surfaceHeight/2+.07),BOARD_DEPTH-.11);
    boardGroup.add(h);
    const v=new Mesh(rimGeoVertical,rimMat);
    v.position.set(side*(surfaceHeight/2+.07),0,BOARD_DEPTH-.11);
    boardGroup.add(v);
  }
  let artPlane=null;
  // Image is supplied only by the already-loaded self-hosted board source.
  function setBoardArt(source){
    if(disposed||typeof source!=='string'||!source.startsWith('data:image/png;base64,'))return;
    const revision=++artVersion;
    const img=new Image();
    img.onload=()=>{
      if(disposed||revision!==artVersion)return;
      const canvas=document.createElement('canvas');
      canvas.width=canvas.height=1024;
      const ctx=canvas.getContext('2d');
      if(!ctx)return;
      // Transparent pixels in the source artwork must not expose dark wood.
      ctx.fillStyle='#eee8d4';ctx.fillRect(0,0,1024,1024);
      ctx.drawImage(img,0,0,1024,1024);
      // Clean the non-playable border in the supplied board scan; retain the 40 tiles.
      const outerMargin=60;
      ctx.fillStyle='#eee8d4';
      ctx.fillRect(0,0,outerMargin,1024);
      ctx.fillRect(1024-outerMargin,0,outerMargin,1024);
      ctx.fillRect(0,0,1024,outerMargin);
      ctx.fillRect(0,1024-outerMargin,1024,outerMargin);
      // Source art includes a printed brand in its center. Preserve the 40 tiles.
      const inset=188,edge=1024-2*inset;
      const gradient=ctx.createRadialGradient(512,430,30,512,512,500);
      gradient.addColorStop(0,'#39775a');
      gradient.addColorStop(.58,'#245941');
      gradient.addColorStop(1,'#153c2d');
      ctx.fillStyle=gradient;
      ctx.fillRect(inset,inset,edge,edge);
      ctx.strokeStyle='rgba(205,169,96,.8)';
      ctx.lineWidth=5;ctx.strokeRect(inset+9,inset+9,edge-18,edge-18);
      // Embossed decorative central emblem, not an oversized logo or UI panel.
      ctx.save();ctx.translate(512,512);ctx.rotate(Math.PI/4);
      ctx.strokeStyle='rgba(236,224,175,.25)';ctx.lineWidth=12;
      ctx.strokeRect(-185,-185,370,370);
      ctx.strokeStyle='rgba(52,92,71,.16)';ctx.lineWidth=3;
      ctx.strokeRect(-170,-170,340,340);
      ctx.restore();
      const texture=new CanvasTexture(canvas);
      texture.colorSpace=SRGBColorSpace;texture.anisotropy=4;
      // Printed board inks retain original colors; wood rim/pawns still react to real lighting.
      const material=new MeshBasicMaterial({map:texture});
      if(artPlane){
        boardGroup.remove(artPlane);
        artPlane.geometry.dispose();artPlane.material.dispose();boardTexture?.dispose();
      }
      const geo=new PlaneGeometry(surfaceHeight,surfaceHeight);
      artPlane=new Mesh(geo,material);
      artPlane.position.z=BOARD_DEPTH+.015;
      boardGroup.add(artPlane);
      boardTexture=texture;boardReady=true;
      board.classList.add('tv-3d-board-ready');
      board.dataset.displayEngine='three.js-table';
      board.dataset.displayReason='texture-ready';
      canvasElement.dataset.table='3d';
      draw();
    };
    img.onerror=()=>{board.classList.remove('tv-3d-board-ready');};
    img.src=source;
  }
  const canvasElement=canvas;
  // Shared WebGL context: three-dimensional player pieces with server-owned positions.
  const pawnBody=new CylinderGeometry(.13,.19,.34,20);
  const pawnTop=new SphereGeometry(.135,16,12);
  const pawnBase=new CylinderGeometry(.23,.23,.065,24);
  const pawnShadow=new CircleGeometry(.23,24);
  const pawns=new Map();
  let lastCells=null;
  function worldPoint(cell){
    const w=Math.max(1,board.clientWidth),h=Math.max(1,board.clientHeight);
    // Project against each pawn's z=1 depth, not the z=0 image plane.
    // This removes the outward displacement near corner tiles.
    const worldH=2*Math.tan(camera.fov*Math.PI/360)*(camera.position.z-1);
    return new Vector3(((cell.offsetLeft+cell.offsetWidth/2)/w-.5)*worldH*w/h,
      (.5-(cell.offsetTop+cell.offsetHeight/2)/h)*worldH,1);
  }
  function makePawn(color){
    const material=new MeshStandardMaterial({color,metalness:.55,roughness:.24});
    const g=new Group();
    const body=new Mesh(pawnBody,material),top=new Mesh(pawnTop,material),
      base=new Mesh(pawnBase,material);
    body.position.y=.17;top.position.y=.39;base.position.y=-.045;
    const shade=new Mesh(pawnShadow,new MeshBasicMaterial({color:0x06241b,transparent:true,opacity:.34,depthWrite:false}));
    shade.position.set(.08,-.21,-.28);
    g.add(shade,base,body,top);
    scene.add(g);
    return {group:g,material,shade};
  }
  function syncPawns(players,cells,colors){
    if(disposed)return;
    lastCells=cells;
    const list=players||[],ids=new Set(list.map(p=>p.id));
    for(const [id,pawn] of pawns){
      if(!ids.has(id)){
        gsap.killTweensOf(pawn.group.position);
        scene.remove(pawn.group);pawn.material.dispose();
        pawn.shade.material.dispose();pawns.delete(id);
      }
    }
    list.forEach((p,i)=>{
      let pawn=pawns.get(p.id),fresh=false;
      if(!pawn){pawn=makePawn(colors[i%colors.length]||'#18a775');pawns.set(p.id,pawn);fresh=true;}
      const cell=cells.get(p.position||0);
      if(fresh&&cell)pawn.group.position.copy(worldPoint(cell));
      pawn.group.scale.setScalar(.9+(i===0?.1:0));
    });
    canvas.dataset.pawns=String(pawns.size);
    // QA-only geometry diagnostic: projected 3D origin vs actual DOM tile center.
    const w=Math.max(1,board.clientWidth),h=Math.max(1,board.clientHeight);
    const offsets=list.map(p=>{
      const cell=cells.get(p.position||0),pawn=pawns.get(p.id);
      if(!cell||!pawn)return 0;
      const screen=pawn.group.position.clone().project(camera);
      return Math.hypot((screen.x+1)*w/2-(cell.offsetLeft+cell.offsetWidth/2),
        (1-screen.y)*h/2-(cell.offsetTop+cell.offsetHeight/2));
    });
    canvas.dataset.maxPawnOffset=String(Math.round(Math.max(0,...offsets)));
    canvas.style.visibility='visible';draw();
  }
  async function movePawn(id,index,duration=.24){
    const pawn=pawns.get(id),cell=lastCells?.get(index);
    if(disposed||!pawn||!cell)return false;
    const point=worldPoint(cell);
    gsap.killTweensOf(pawn.group.position);
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      pawn.group.position.copy(point);draw();return true;
    }
    return new Promise(resolve=>{
      gsap.to(pawn.group.position,{x:point.x,y:point.y,z:point.z,
        duration,ease:'power1.inOut',onUpdate:draw,onComplete:()=>resolve(true),
        onInterrupt:()=>resolve(false)});
    });
  }
  let timeline=null,disposed=false,shown=false;
  let renderWidth=0,renderHeight=0;
  function resize(){
    if(disposed)return;
    const w=Math.max(1,board.clientWidth),h=Math.max(1,board.clientHeight);
    if(w!==renderWidth||h!==renderHeight){
      renderWidth=w;renderHeight=h;
      renderer.setSize(w,h,false);
      camera.aspect=w/h;camera.updateProjectionMatrix();
    }
  }
  let maxCameraLift=0;
  function draw(){
    if(disposed)return;
    resize();
    maxCameraLift=Math.max(maxCameraLift,camera.position.y);
    canvas.dataset.maxCameraLift=maxCameraLift.toFixed(2);
    canvas.dataset.cameraRestored=String(Math.abs(camera.position.y)<.02&&!board.classList.contains('tv-3d-rolling'));
    camera.lookAt(0,0,-.8);
    renderer.render(scene,camera);
  }
  function clear(){
    timeline?.kill();timeline=null;
    shown=false;group.visible=false;
    camera.position.set(0,0,10);
    board.classList.remove('tv-3d-rolling');
    canvas.style.visibility=(boardReady||pawns.size)?'visible':'hidden';
    draw();
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
      die.position.set((i===0?-1:1)*.76,-.25,0);
      die.quaternion.copy(target[i]);
      die.rotation.x+=Math.PI*2;die.rotation.y+=Math.PI*2;
    });
    shown=true;group.visible=true;board.classList.add('tv-3d-rolling');
    canvas.dataset.dice=values.join(',');canvas.style.visibility='visible';
    draw();
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      dice.forEach((die,i)=>die.quaternion.copy(target[i]));
      board.classList.remove('tv-3d-rolling');
      draw();return true;
    }
    return await new Promise(resolve=>{
      const tl=gsap.timeline({
        onUpdate:draw,
        onComplete:()=>{
          timeline=null;
          camera.position.set(0,0,10);
          board.classList.remove('tv-3d-rolling');
          dice.forEach((die,i)=>die.quaternion.copy(target[i]));
          draw();resolve(true);
        },
        onInterrupt:()=>{
          timeline=null;camera.position.set(0,0,10);
          board.classList.remove('tv-3d-rolling');draw();resolve(false);
        }
      });
      timeline=tl;
      // Genuine Three.js perspective camera crane, not a CSS zoom.
      tl.to(camera.position,{y:2.1,z:10.4,duration:.38,ease:'power2.out'},0);
      tl.to(camera.position,{y:0,z:10,duration:.43,ease:'power2.inOut'},.75);
      dice.forEach((die,i)=>{
        die.quaternion.copy(target[i]);
        // GSAP rotates exactly two full revolutions and lands on the server face.
        const rx=die.rotation.x,ry=die.rotation.y;
        tl.fromTo(die.position,{y:1.65+i*.3},{y:-.25,duration:.85,ease:'bounce.out'},i*.09);
        tl.fromTo(die.rotation,{x:rx,y:ry},{x:rx+Math.PI*2,y:ry+Math.PI*2,duration:.77,ease:'power3.out'},i*.09);
      });
    });
  }
  function destroy(){
    if(disposed)return;
    clear();disposed=true;
    for(const pawn of pawns.values()){
      gsap.killTweensOf(pawn.group.position);
      scene.remove(pawn.group);pawn.material.dispose();pawn.shade.material.dispose();
    }
    pawns.clear();pawnBody.dispose();pawnTop.dispose();pawnBase.dispose();pawnShadow.dispose();
    if(artPlane){boardGroup.remove(artPlane);artPlane.geometry.dispose();artPlane.material.dispose();}
    boardTexture?.dispose();
    for(const resource of boardResources)resource.dispose();
    board.classList.remove('tv-3d-board-ready');
    for(const t of textures)t.dispose();
    for(const m of materials)m.dispose();
    geometry.dispose();shadowGeometry.dispose();shadowMaterial.dispose();
    renderer.dispose();canvas.remove();
  }
  group.visible=false;canvas.style.visibility='hidden';
  return {roll,clear,syncPawns,movePawn,setBoardArt,resize:draw,destroy,get active(){return shown;},get boardReady(){return boardReady;},engine:'three.js'};
}
