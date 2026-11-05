// Optional, self-hosted genuine Three.js geometry. This layer never chooses dice outcomes.
import {
  WebGLRenderer,Scene,PerspectiveCamera,AmbientLight,DirectionalLight,
  Mesh,BoxGeometry,MeshStandardMaterial,CanvasTexture,Group,
  PlaneGeometry,MeshBasicMaterial,DoubleSide,Vector3,Quaternion,SRGBColorSpace,
  CylinderGeometry,SphereGeometry,CircleGeometry,RepeatWrapping
} from 'three';
import {gsap} from 'gsap';

const FACES=[3,4,2,5,1,6]; // BoxGeometry: +X,-X,+Y,-Y,+Z,-Z. Camera faces +Z.
const NORMALS=[
  new Vector3(1,0,0),new Vector3(-1,0,0),
  new Vector3(0,1,0),new Vector3(0,-1,0),
  new Vector3(0,0,1),new Vector3(0,0,-1)
];
const CAMERA_FACE_NORMAL=new Vector3(0,.85,.53).normalize();
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
function woodGrainTexture(){
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=512;
  const c=canvas.getContext('2d');
  if(!c)throw new Error('2D wood texture context unavailable');
  const base=c.createLinearGradient(0,0,512,512);
  base.addColorStop(0,'#89613a');base.addColorStop(.48,'#76502f');base.addColorStop(1,'#624226');
  c.fillStyle=base;c.fillRect(0,0,512,512);
  // Fine, irregular grain catches the Three.js lights without competing with tile text.
  for(let i=0;i<42;i++){
    const y=i*13-8,shift=(i*37)%57;
    c.beginPath();c.moveTo(-20,y);
    c.bezierCurveTo(120,y-9+shift*.12,330,y+8-shift*.1,532,y-3);
    c.strokeStyle=i%4===0?'rgba(226,190,129,.105)':'rgba(38,24,13,.085)';
    c.lineWidth=i%5===0?2:1;c.stroke();
  }
  for(let i=0;i<9;i++){
    const x=35+(i*59)%440,y=24+(i*83)%464;
    c.beginPath();c.ellipse(x,y,18+(i%3)*5,3,((i%4)-2)*.08,0,Math.PI*2);
    c.strokeStyle='rgba(38,24,13,.12)';c.lineWidth=1;c.stroke();
  }
  const texture=new CanvasTexture(canvas);
  texture.colorSpace=SRGBColorSpace;texture.wrapS=RepeatWrapping;texture.wrapT=RepeatWrapping;
  texture.repeat.set(2,2);
  return texture;
}
export function createThreeDice(board,cells=new Map()){
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
  const camera=new PerspectiveCamera(34,1,.1,50);
  const overviewCamera={x:0,y:11,z:6.4};
  camera.position.set(overviewCamera.x,overviewCamera.y,overviewCamera.z);
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
    m.rotation.x=-Math.PI/2;
    m.position.set(die.position.x+.10,.025,-.08);
    group.add(m);return m;
  });
  // A real, light-reactive 3D tabletop. Original forty tiles stay exact in the
  // source artwork; only its printed center is overpainted with a felt inlay.
  const boardGroup=new Group();scene.add(boardGroup);
  const boardResources=[];
  let boardTexture=null,boardReady=false,artVersion=0;
  const tileMeshes=[];
  const BOARD_DEPTH=0;
  const surfaceHeight=2*Math.tan(camera.fov*Math.PI/360)*camera.position.distanceTo(new Vector3(0,0,BOARD_DEPTH));
  const surfaceSize=surfaceHeight*.94;
  const woodTexture=woodGrainTexture();
  const slabMat=new MeshStandardMaterial({map:woodTexture,color:0xffffff,roughness:.62,metalness:.04});
  const rimMat=new MeshStandardMaterial({color:0xcea55a,roughness:.28,metalness:.62});
  const feltMat=new MeshStandardMaterial({color:0x173c2c,roughness:.94,metalness:0});
  const slabGeo=new BoxGeometry(surfaceSize+.16,surfaceSize+.16,.28);
  const feltGeo=new BoxGeometry(surfaceSize+.28,surfaceSize+.28,.14);
  const rimGeoHorizontal=new BoxGeometry(surfaceSize+.34,.09,.11);
  const rimGeoVertical=new BoxGeometry(.11,surfaceSize+.34,.09);
  boardResources.push(woodTexture,slabMat,rimMat,feltMat,slabGeo,feltGeo,rimGeoHorizontal,rimGeoVertical);
  // The board artwork and tabletop now lie flat on the XZ ground plane.
  // Three.js owns the real overhead perspective; tiles remain baked into the exact source image.
  boardGroup.rotation.x=-Math.PI/2;
  const feltSlab=new Mesh(feltGeo,feltMat);
  feltSlab.position.z=-.42;boardGroup.add(feltSlab);
  const slab=new Mesh(slabGeo,slabMat);
  slab.position.z=-.14;boardGroup.add(slab);
  for(const side of [-1,1]){
    const h=new Mesh(rimGeoHorizontal,rimMat);
    h.position.set(0,side*(surfaceSize/2+.065),.015);
    boardGroup.add(h);
    const v=new Mesh(rimGeoVertical,rimMat);
    v.position.set(side*(surfaceSize/2+.065),0,.015);
    boardGroup.add(v);
  }
  let artPlane=null;
  function clearTileMeshes(){
    for(const tile of tileMeshes){
      boardGroup.remove(tile.mesh);
      tile.geometry.dispose();tile.top.dispose();tile.edge.dispose();tile.texture.dispose();
    }
    tileMeshes.length=0;
  }
  function buildRaisedTiles(image){
    clearTileMeshes();
    const boardRect=board.getBoundingClientRect();
    for(const cell of cells.values()){
      const rect=cell.getBoundingClientRect();
      const left=(rect.left-boardRect.left)/Math.max(1,boardRect.width);
      const topFraction=(rect.top-boardRect.top)/Math.max(1,boardRect.height);
      const width=rect.width/Math.max(1,boardRect.width);
      const height=rect.height/Math.max(1,boardRect.height);
      const pixelX=left*image.naturalWidth;
      const pixelY=topFraction*image.naturalHeight;
      const pixelWidth=width*image.naturalWidth;
      const pixelHeight=height*image.naturalHeight;
      const textureCanvas=document.createElement('canvas');
      textureCanvas.width=Math.max(32,Math.round(pixelWidth));
      textureCanvas.height=Math.max(32,Math.round(pixelHeight));
      const textureContext=textureCanvas.getContext('2d');
      if(!textureContext)continue;
      textureContext.drawImage(image,pixelX,pixelY,pixelWidth,pixelHeight,
        0,0,textureCanvas.width,textureCanvas.height);
      const texture=new CanvasTexture(textureCanvas);
      texture.colorSpace=SRGBColorSpace;texture.anisotropy=4;
      const size=boardCellSize(cell),gap=Math.min(.012,Math.min(size.width,size.height)*.025);
      const geometry=new BoxGeometry(Math.max(.02,size.width-gap),Math.max(.02,size.height-gap),.075);
      const top=new MeshBasicMaterial({map:texture});
      const edge=new MeshStandardMaterial({color:0x624d2e,roughness:.58,metalness:.1});
      const mesh=new Mesh(geometry,[edge,edge,edge,edge,top,edge]);
      const x=(left+width/2-.5)*surfaceSize;
      const y=(.5-(topFraction+height/2))*surfaceSize;
      mesh.position.set(x,y,.05);
      boardGroup.add(mesh);
      tileMeshes.push({mesh,geometry,top,edge,texture});
    }
    canvasElement.dataset.raisedTiles=String(tileMeshes.length);
  }
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
      // Keep the felt center intentionally quiet; event cards and dice own this space.
      const texture=new CanvasTexture(canvas);
      texture.colorSpace=SRGBColorSpace;texture.anisotropy=4;
      // Printed board inks retain original colors; wood rim/pawns still react to real lighting.
      const material=new MeshBasicMaterial({map:texture});
      if(artPlane){
        boardGroup.remove(artPlane);
        artPlane.geometry.dispose();artPlane.material.dispose();boardTexture?.dispose();
      }
      const geo=new PlaneGeometry(surfaceSize,surfaceSize);
      artPlane=new Mesh(geo,material);
      artPlane.position.z=.012;
      boardGroup.add(artPlane);
      buildRaisedTiles(img);
      boardTexture=texture;boardReady=true;
      board.classList.add('tv-3d-board-ready');
      board.closest('.tv-board-frame')?.classList.add('tv-3d-board-ready');
      board.dataset.displayEngine='three.js-table';
      board.dataset.displayReason='texture-ready';
      canvasElement.dataset.table='3d';
      draw();
    };
    img.onerror=()=>{
      board.classList.remove('tv-3d-board-ready');
      board.closest('.tv-board-frame')?.classList.remove('tv-3d-board-ready');
      board.dataset.displayEngine='pixi-dom-fallback';
      board.dataset.displayReason='board-art-load-failed';
    };
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
  function boardPoint(cell,localHeight=.035){
    const w=Math.max(1,board.clientWidth),h=Math.max(1,board.clientHeight);
    const localX=((cell.offsetLeft+cell.offsetWidth/2)/w-.5)*surfaceSize*w/h;
    const localY=(.5-(cell.offsetTop+cell.offsetHeight/2)/h)*surfaceSize;
    return boardGroup.localToWorld(new Vector3(localX,localY,localHeight));
  }
  function boardCellSize(cell){
    const w=Math.max(1,board.clientWidth),h=Math.max(1,board.clientHeight);
    return {width:cell.offsetWidth/w*surfaceSize*w/h,height:cell.offsetHeight/h*surfaceSize};
  }
  function worldPoint(cell){
    return boardPoint(cell,.04);
  }
  function makePawn(color){
    const material=new MeshStandardMaterial({color,metalness:.55,roughness:.24});
    const g=new Group();
    const body=new Mesh(pawnBody,material),top=new Mesh(pawnTop,material),
      base=new Mesh(pawnBase,material);
    body.position.y=.17;top.position.y=.39;base.position.y=-.045;
    const shade=new Mesh(pawnShadow,new MeshBasicMaterial({color:0x06241b,transparent:true,opacity:.34,depthWrite:false}));
    shade.rotation.x=-Math.PI/2;shade.position.set(.08,.018,-.08);
    g.add(shade,base,body,top);
    scene.add(g);
    return {group:g,material,shade};
  }
  const propertyMarks=new Map();
  function removePropertyMark(index,mark){
    boardGroup.remove(mark.group);
    mark.group.traverse(node=>{
      node.geometry?.dispose();
      if(Array.isArray(node.material))node.material.forEach(m=>m.dispose());
      else node.material?.dispose();
    });
    propertyMarks.delete(index);
  }
  function syncPropertyMarks(players,cells,colors,ownership={}){
    const entries=Object.entries(ownership||{}).filter(([index,own])=>cells.has(Number(index))&&own?.ownerId);
    const keep=new Set(entries.map(([index])=>String(index)));
    for(const [index,mark] of propertyMarks)if(!keep.has(String(index)))removePropertyMark(index,mark);
    for(const [rawIndex,own] of entries){
      const index=Number(rawIndex),cell=cells.get(index);
      const playerIndex=players.findIndex(p=>p.id===own.ownerId);
      if(playerIndex<0)continue;
      const color=colors[playerIndex%colors.length]||'#18a775';
      let mark=propertyMarks.get(index);
      if(mark?.ownerId===own.ownerId&&mark.houses===(own.houses||0)&&mark.hotel===!!own.hotel)continue;
      if(mark)removePropertyMark(index,mark);
      mark={group:new Group(),ownerId:own.ownerId,houses:own.houses||0,hotel:!!own.hotel};
      const size=boardCellSize(cell),centerX=((cell.offsetLeft+cell.offsetWidth/2)/Math.max(1,board.clientWidth)-.5)*surfaceSize;
      const centerY=(.5-(cell.offsetTop+cell.offsetHeight/2)/Math.max(1,board.clientHeight))*surfaceSize;
      const fill=new Mesh(new PlaneGeometry(size.width*.84,size.height*.84),new MeshBasicMaterial({color,transparent:true,opacity:.11,depthWrite:false,side:DoubleSide}));
      fill.position.set(centerX,centerY,.035);mark.group.add(fill);
      const edge=Math.max(.035,Math.min(size.width,size.height)*.055);
      const trimMat=new MeshStandardMaterial({color,emissive:color,emissiveIntensity:.16,roughness:.35,metalness:.22});
      const trims=[
        [size.width*.84,edge,centerX,centerY+size.height*.42],
        [size.width*.84,edge,centerX,centerY-size.height*.42],
        [edge,size.height*.84,centerX-size.width*.42,centerY],
        [edge,size.height*.84,centerX+size.width*.42,centerY]
      ];
      for(const [width,height,x,y] of trims){
        const bar=new Mesh(new BoxGeometry(width,height,.045),trimMat);
        bar.position.set(x,y,.055);mark.group.add(bar);
      }
      const buildingCount=own.hotel?1:Math.min(4,Math.max(0,own.houses||0));
      if(buildingCount){
        const towardsCenterX=Math.abs(centerX)>Math.abs(centerY),
          houseX=towardsCenterX?centerX-Math.sign(centerX)*size.width*.24:centerX,
          houseY=towardsCenterX?centerY:centerY-Math.sign(centerY)*size.height*.24;
        const buildingColor=own.hotel?0xc95c43:0x52ad68;
        const buildingMat=new MeshStandardMaterial({color:buildingColor,roughness:.45,metalness:.12});
        const step=Math.min(size.width*.18,size.height*.18);
        for(let i=0;i<buildingCount;i++){
          const offset=(i-(buildingCount-1)/2)*step;
          const house=new Mesh(new BoxGeometry(Math.min(.18,size.width*.2),Math.min(.2,size.height*.24),.13),buildingMat);
          house.position.set(houseX+(towardsCenterX?0:offset),houseY+(towardsCenterX?offset:0),.12);
          mark.group.add(house);
          const roof=new Mesh(new BoxGeometry(Math.min(.21,size.width*.23),Math.min(.07,size.height*.09),.055),trimMat);
          roof.position.set(house.position.x,house.position.y,.21);mark.group.add(roof);
        }
      }
      boardGroup.add(mark.group);propertyMarks.set(index,mark);
    }
    canvas.dataset.properties=String(propertyMarks.size);
    canvas.dataset.buildings=String(entries.reduce((sum,[,own])=>sum+(own.hotel?1:Math.max(0,own.houses||0)),0));
  }
  function syncPawns(players,cells,colors,ownership={}){
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
      pawn.group.scale.setScalar(.68+(i===0?.04:0));
    });
    syncPropertyMarks(list,cells,colors,ownership);
    canvas.dataset.pawns=String(pawns.size);
    // Compare pawn projection with the projected center of its source-art tile.
    const w=Math.max(1,board.clientWidth),h=Math.max(1,board.clientHeight);
    const offsets=list.map(p=>{
      const cell=cells.get(p.position||0),pawn=pawns.get(p.id);
      if(!cell||!pawn)return 0;
      const screen=pawn.group.position.clone().project(camera);
      const target=boardPoint(cell,.04).project(camera);
      return Math.hypot((screen.x-target.x)*w/2,(screen.y-target.y)*h/2);
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
    maxCameraLift=Math.max(maxCameraLift,Math.abs(camera.position.y-overviewCamera.y));
    canvas.dataset.maxCameraLift=maxCameraLift.toFixed(2);
    canvas.dataset.cameraRestored=String(Math.abs(camera.position.y-overviewCamera.y)<.02&&Math.abs(camera.position.z-overviewCamera.z)<.02&&Math.abs(camera.zoom-1)<.02&&!board.classList.contains('tv-3d-rolling'));
    camera.lookAt(0,0,0);
    camera.updateProjectionMatrix();
    renderer.render(scene,camera);
  }
  function clear(){
    timeline?.kill();timeline=null;
    shown=false;group.visible=false;
    camera.position.set(overviewCamera.x,overviewCamera.y,overviewCamera.z);camera.zoom=1;
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
      return new Quaternion().setFromUnitVectors(normal,CAMERA_FACE_NORMAL);
    });
    dice.forEach((die,i)=>{
      die.position.set((i===0?-1:1)*.76,.56,0);
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
          camera.position.set(overviewCamera.x,overviewCamera.y,overviewCamera.z);camera.zoom=1;
          board.classList.remove('tv-3d-rolling');
          dice.forEach((die,i)=>die.quaternion.copy(target[i]));
          draw();resolve(true);
        },
        onInterrupt:()=>{
          timeline=null;camera.position.set(overviewCamera.x,overviewCamera.y,overviewCamera.z);camera.zoom=1;
          board.classList.remove('tv-3d-rolling');draw();resolve(false);
        }
      });
      timeline=tl;
      // Genuine Three.js perspective camera crane, not a CSS zoom.
      // Keep the full table edge in frame while making the dice read larger.
      tl.to(camera.position,{y:10.8,z:6.3,duration:.38,ease:'power2.out'},0);
      tl.to(camera,{zoom:1.06,duration:.38,ease:'power2.out',onUpdate:()=>camera.updateProjectionMatrix()},0);
      tl.to(camera.position,{y:overviewCamera.y,z:overviewCamera.z,duration:.43,ease:'power2.inOut'},.75);
      tl.to(camera,{zoom:1,duration:.43,ease:'power2.inOut',onUpdate:()=>camera.updateProjectionMatrix()},.75);
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
    for(const [index,mark] of propertyMarks)removePropertyMark(index,mark);
    if(artPlane){boardGroup.remove(artPlane);artPlane.geometry.dispose();artPlane.material.dispose();}
    boardTexture?.dispose();
    clearTileMeshes();
    for(const resource of boardResources)resource.dispose();
    board.classList.remove('tv-3d-board-ready');
    board.closest('.tv-board-frame')?.classList.remove('tv-3d-board-ready');
    for(const t of textures)t.dispose();
    for(const m of materials)m.dispose();
    geometry.dispose();shadowGeometry.dispose();shadowMaterial.dispose();
    renderer.dispose();canvas.remove();
  }
  group.visible=false;canvas.style.visibility='hidden';
  return {roll,clear,syncPawns,movePawn,setBoardArt,resize:draw,destroy,get active(){return shown;},get boardReady(){return boardReady;},engine:'three.js'};
}
