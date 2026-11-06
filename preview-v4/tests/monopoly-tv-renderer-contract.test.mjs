import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scene=read('../tools/monopoly-tv-renderer/scene.mjs');
const entry=read('monopoly-party/tv/tv.js');
const css=read('monopoly-party/party.css');
const controller=read('monopoly-party/controller/remote.js');
const tvHtml=read('monopoly-party/tv/index.html');
const pkg=JSON.parse(read('../tools/monopoly-tv-renderer/package.json'));
test('real renderer uses pinned PixiJS and GSAP instead of inert dependency',()=>{
  assert.equal(pkg.dependencies['pixi.js'],'8.22.0');
  assert.equal(pkg.dependencies.gsap,'3.15.0');
  assert.match(scene,/import\s*\{[^}]*Application[^}]*\}\s*from\s*'pixi.js'/);
  assert.match(scene,/import\s*\{\s*gsap\s*\}\s*from\s*'gsap'/);
  assert.match(scene,/await app\.init\(/);
  assert.match(scene,/gsap\.to\(board,/);
  assert.match(scene,/gsap\.to\(actor\.position,/);
});
test('TV integrates local bundled renderer and retains DOM fallback',()=>{
  assert.match(entry,/import\('\.\.\/vendor\/cinematic-scene\.mjs'\)/);
  assert.match(entry,/cinematic\?\.sync\(state\)/);
  assert.match(entry,/await cinematic\.move\(/);
  assert.match(entry,/cinematic\.focus\(index,zoom\)/);
  assert.match(entry,/catch\(error=>\{[^}]*console\.warn\('TV cinematic renderer unavailable/);
  assert.match(css,/\.tv-board\.cinematic-ready \.tv-token\{visibility:hidden\}/);
});
test('Three.js initializes before Pixi to reserve the TV browser WebGL context',()=>{
  assert.ok(scene.indexOf('threeDice=createThreeDice(board,cells)')<scene.indexOf('await app.init('));
  assert.match(scene,/board\.dataset\.displayEngine='pixi-dom-fallback'/);
  assert.match(scene,/board\.dataset\.displayReason='webgl-context-unavailable'/);
  assert.match(scene,/board\.dataset\.displayReason='webgl-render-failed'/);
  assert.doesNotMatch(entry,/board\.dataset\.displayEngine='pixi-three'/);
  assert.match(scene,/get engine\(\)\{return threeDice\?\.boardReady\?'three\.js-table':'pixi\.js-fallback';\}/);
});
test('Three.js waits for the hidden TV board to have measurable layout before creating raised tiles',()=>{
  const d=read('../tools/monopoly-tv-renderer/dice3d.mjs');
  assert.match(d,/const cellRects=cells\.size===40/);
  assert.match(d,/boardRect\.width<2\|\|boardRect\.height<2/);
  assert.match(d,/cellRects\.some\(rect=>rect\.width<2\|\|rect\.height<2\)/);
  assert.match(d,/board\.dataset\.displayReason='board-layout-pending'/);
  assert.match(d,/if\(boardReady&&boardArtCanvas&&tileMeshes\.length!==40&&buildRaisedTiles\(boardArtCanvas\)\)markBoardReady\(\)/);
  assert.match(d,/new ResizeObserver\(\(\)=>\{/);
  assert.match(d,/requestAnimationFrame\(\(\)=>\{/);
  assert.match(d,/if\(buildRaisedTiles\(boardArtCanvas\)\)\{markBoardReady\(\);draw\(\);\}/);
  assert.match(d,/boardLayoutObserver\?\.disconnect\(\)/);
});
test('installed family service workers revalidate Monopoly TV assets after staging deploys',()=>{
  const sw=read('service-worker.js');
  assert.match(sw,/const isMonopolyAsset=new URL\(event\.request\.url\)\.pathname\.includes\('\/monopoly-party\/'\)/);
  assert.match(sw,/if\(!isMonopolyAsset&&new URL\(event\.request\.url\)\.origin===self\.location\.origin/);
});
test('rendering does not authorize server money, player actions or mutate snapshots',()=>{
  assert.doesNotMatch(scene,/submitAction|createRoom|fetch\(|\.cash\s*[+\-*/]?=|\.ownership\s*=/);
  assert.match(scene,/prefers-reduced-motion/);
  assert.match(scene,/function destroy\(/);
});

test('cinematic dice are drawn from authoritative faces before piece travel',()=>{
  assert.match(scene,/async function rollDice\(values(?:,previousState=null)?\)/);
  assert.match(scene,/values\.every\(n=>Number\.isInteger\(n\)&&n>=1&&n<=6\)/);
  assert.match(scene,/pipLayout\[number\]/);
  assert.match(scene,/gsap\.timeline\(/);
  assert.match(scene,/onInterrupt:/);
  assert.match(entry,/await cinematic\.rollDice\(state\.dice,old\.state\)/);
  assert.doesNotMatch(entry,/await cinematic\.rollDice\(state\.dice,old\.state\);if\(generation!==sequence\)return;\s*cinematic\.clearDice\(\)/,
    'settled dice remain visible through the landing event');
  const d=read('../tools/monopoly-tv-renderer/dice3d.mjs');
  assert.match(d,/z:1\.8,duration:\.22,ease:'power2\.out'/);
  assert.match(css,/\.tv-board\.tv-3d-board-ready \.tv-center-dice\{display:none\}/);
  assert.match(entry,/if\(generation!==sequence\)return/);
  assert.match(entry,/cinematic\?\.clearDice\(\)/);
});

test('genuine 3D dice use Three.js geometry, six face textures and authoritative results',()=>{
  const d=read('../tools/monopoly-tv-renderer/dice3d.mjs');
  assert.match(d,/from 'three'/);
  assert.match(d,/new BoxGeometry\(/);
  assert.match(d,/new WebGLRenderer\(/);
  assert.match(d,/new MeshStandardMaterial\(/);
  assert.match(d,/new DirectionalLight\(/);
  assert.match(d,/const FACES=\[3,4,2,5,1,6\]/);
  assert.match(d,/FACES\.indexOf\(value\)/);
  assert.match(d,/setFromUnitVectors\(/);
  assert.match(d,/Number\.isInteger\(v\)&&v>=1&&v<=6/);
  assert.match(d,/prefers-reduced-motion/);
  assert.match(d,/renderer\.dispose\(\)/);
  assert.match(scene,/createThreeDice\(board,cells\)/);
  assert.match(scene,/threeDice\.roll\(values\)/);
  assert.match(scene,/using PixiJS dice fallback/);
  assert.doesNotMatch(d,/submitAction|createRoom|game\.cash\s*=/);
  const pkg=JSON.parse(read('../tools/monopoly-tv-renderer/package.json'));
  assert.equal(pkg.dependencies.three,'0.187.0');
});

test('3D pieces use mesh geometry and authoritative board coordinates',()=>{
  const d=read('../tools/monopoly-tv-renderer/dice3d.mjs');
  assert.match(d,/new CylinderGeometry\(/);
  assert.match(d,/new SphereGeometry\(/);
  assert.match(d,/function syncPawns\(players,cells,colors,ownership=\{\}\)/);
  assert.match(d,/function movePawn\(id,index,duration/);
  assert.match(d,/canvas\.dataset\.pawns=String\(pawns\.size\)/);
  assert.match(d,/canvas\.dataset\.dice=values\.join\(','\)/);
  assert.match(scene,/threeDice\.syncPawns\(state\.players,cells,colors,state\.ownership\|\|\{\}\)/);
  assert.match(scene,/threeDice\.movePawn\(id,index,duration\)/);
  assert.match(scene,/layer\.visible=false/);
});
test('Three.js dice and pawns use soft contact shadows instead of opaque squares',()=>{
  const d=read('../tools/monopoly-tv-renderer/dice3d.mjs');
  assert.match(d,/function softShadowTexture\(\)/);
  assert.match(d,/createRadialGradient\(64,64,4,64,64,64\)/);
  assert.match(d,/rgba\(5,18,14,0\)/);
  assert.match(d,/const shadowMaterial=new MeshBasicMaterial\(\{map:shadowTexture/);
  assert.match(d,/shadeMaterial=new MeshBasicMaterial\(\{map:shadowTexture/);
  assert.match(d,/shadowTexture\.dispose\(\)/);
});

test('3D pieces and ownership markers sit above raised tile surfaces',()=>{
  const d=read('../tools/monopoly-tv-renderer/dice3d.mjs');
  assert.match(d,/const TILE_TOP=\.05\+\.075\/2/);
  assert.match(d,/return boardPoint\(cell,TILE_TOP\+\.058,slotIndex\)/);
  assert.match(d,/fill\.position\.set\(centerX,centerY,TILE_TOP\+\.008\)/);
  assert.match(d,/bar\.position\.set\(x,y,TILE_TOP\+\.033\)/);
  assert.match(d,/TILE_TOP\+houseDepth\/2\+\.018/);
  assert.match(d,/house\.position\.z\+houseDepth\/2\+roofDepth\/2\+\.006/);
  assert.match(d,/const target=worldPoint\(cell,i\)\.project\(camera\)/);
});

test('four 3D player pieces have distinct silhouettes and stay at the outside of their tile',()=>{
  const d=read('../tools/monopoly-tv-renderer/dice3d.mjs');
  assert.match(d,/ConeGeometry,TorusGeometry/);
  assert.match(d,/styleIndex%4===0/);
  assert.match(d,/styleIndex%4===1/);
  assert.match(d,/styleIndex%4===2/);
  assert.match(d,/new ConeGeometry\(/);
  assert.match(d,/new TorusGeometry\(/);
  assert.match(d,/row===0\?\[\[ -\.18,\.31\],\[\.18,\.31\],\[-\.18,\.12\],\[\.18,\.12\]\]/);
  assert.match(d,/corner\?\[\[inwardX\*\.34,inwardY\*\.34\],\[inwardX\*\.04,inwardY\*\.34\]/);
  assert.match(d,/row===10\?/);
  assert.match(d,/col===0\?/);
  assert.match(d,/pawn\.group\.scale\.setScalar\(isCornerCell\(cell\)\?\.46:\.60\)/);
  assert.match(d,/pawn=makePawn\(colors\[i%colors\.length\]\|\|'#18a775',i\)/);
  assert.match(d,/worldPoint\(cell,i\)/);
  assert.match(d,/worldPoint\(cell,pawn\.slot\|\|0\)/);
});

test('GSAP camera uses clamped XY follow and returns to overview after an event',()=>{
  assert.match(scene,/const maxX=\(scale-1\)\*w\/2,maxY=\(scale-1\)\*h\/2/);
  assert.match(scene,/const x=limit\(\(w\/2-point\.x\)\*scale,-maxX,maxX\)/);
  assert.match(scene,/const y=limit\(\(h\/2-point\.y\)\*scale,-maxY,maxY\)/);
  assert.match(scene,/transformOrigin:'50% 50%',scale,x,y/);
  assert.match(scene,/transformOrigin:'50% 50%',scale:1,x:0,y:0/);
  assert.match(entry,/overviewTimer=setTimeout\(\(\)=>\{/);
  assert.match(entry,/if\(generation===sequence\)cinematic\?\.overview\(\)/);
  assert.match(entry,/clearTimeout\(overviewTimer\);\+\+sequence/);
});

test('event card reveal is GSAP-driven, cancellable and never writes game state',()=>{
  assert.match(scene,/function presentEvent\(node,\{phase='end',index=null\}=\{\}\)/);
  assert.match(scene,/eventTimeline=gsap\.timeline/);
  assert.match(scene,/function clearEvent\(node\)/);
  assert.match(scene,/eventTimeline\?\.kill\(\)/);
  assert.match(entry,/cinematic\?\.presentEvent\(byId\('tvCenterScene'\)/);
  assert.match(entry,/cinematic\?\.clearEvent\(byId\('tvCenterScene'\)\)/);
});
test('TV HUD uses one phase-specific instruction and Arabic stage labels',()=>{
  assert.match(tvHtml,/id="tvSessionHint"/);
  assert.match(entry,/const instructions=\{[\s\S]*?roll:'ارمِ النرد من جوال اللاعب'[\s\S]*?property:'قرار الشراء أو المزاد من يد التحكم'/);
  assert.match(entry,/const phaseLabels=\{roll:'رمي النرد',property:'قرار الشراء',auction:'المزاد',card:'البطاقة',trade:'التبادل',end:'نهاية الدور'\}/);
  assert.match(entry,/byId\('tvSessionHint'\)\.hidden=true/);
  assert.doesNotMatch(entry,/textContent='المرحلة: '\+state\.phase/);
  assert.doesNotMatch(entry,/dest\.append\(el\('strong','',headline\),el\('p','',state\.log/);
});

test('spectator does not skip the first authoritative roll when polling jumps from waiting',()=>{
  assert.doesNotMatch(entry,/old\.status==='waiting'\|\|state\.status==='waiting'/);
  assert.match(entry,/if\(!old\|\|old\.code!==room\.code\|\|state\.status==='waiting'\)/);
  assert.match(entry,/state\.presentation\?\.action==='roll'/);
  assert.match(entry,/old\.state\?\.phase==='roll'/);
  assert.match(entry,/Array\.isArray\(state\.dice\)&&state\.dice\.length===2/);
  assert.match(entry,/await cinematic\.rollDice\(state\.dice,old\.state\)/);
});

test('authoritative event scene types provide visible and cancellable state-specific presentations',()=>{
  for(const action of ['buy','build','mortgage','unmortgage','sell','jail','trade-accept','trade-reject']){
    assert.ok(entry.includes("'"+action+"':")||entry.includes(action+':'),"missing action scene: "+action);
  }
  for(const kind of ['purchase','build','mortgage','sale','jail','trade']){
    assert.match(scene,new RegExp("'"+kind+"'"));
    assert.match(css,new RegExp('data-event='+kind));
  }
  assert.match(entry,/scene\.dataset\.event=actionScene\?\.kind\|\|phase/);
  assert.match(entry,/detail\.textContent=state\.log\|\|'تم تحديث حالة الجولة'/);
  assert.match(entry,/cinematic\?\.presentEvent\(byId\('tvCenterScene'\),\{phase:/);
  assert.doesNotMatch(scene,/submitAction|createRoom|fetch\(/);
});

test('Three.js owns a textured, lit, actual 3D board while keeping 40 original tiles',()=>{
  const d=read('../tools/monopoly-tv-renderer/dice3d.mjs');
  assert.match(d,/const boardGroup=new Group\(\);scene\.add\(boardGroup\)/);
  assert.match(d,/const slabGeo=new BoxGeometry\(/);
  assert.match(d,/const feltGeo=new BoxGeometry\(/);
  assert.match(d,/const rimGeoHorizontal=new BoxGeometry\(/);
  assert.match(d,/const geo=new PlaneGeometry\(surfaceSize,surfaceSize\)/);
  assert.match(d,/boardGroup\.rotation\.x=-Math\.PI\/2/);
  assert.match(d,/board\.closest\('\.tv-board-frame'\)\?\.classList\.add\('tv-3d-board-ready'\)/);
  assert.match(d,/function syncPropertyMarks\(players,cells,colors,ownership=\{\}\)/);
  assert.match(d,/canvas\.dataset\.properties=String\(propertyMarks\.size\)/);
  assert.match(d,/new CanvasTexture\(canvas\)/);
  assert.match(d,/function buildRaisedTiles\(image\)/);
  assert.match(d,/const geometry=new BoxGeometry\(Math\.max\(\.02,size\.width-gap\),Math\.max\(\.02,size\.height-gap\),\.075\)/);
  assert.match(d,/canvasElement\.dataset\.raisedTiles=String\(tileMeshes\.length\)/);
  assert.match(d,/const boardRect=board\.getBoundingClientRect\(\)/);
  assert.match(d,/const rect=cell\.getBoundingClientRect\(\)/);
  assert.doesNotMatch(d,/cell\.offsetLeft\/boardWidth/);
  assert.match(d,/const crop=img\.naturalWidth\*\.071,playable=img\.naturalWidth-2\*crop/);
  assert.match(d,/if\(buildRaisedTiles\(boardArtCanvas\)\)markBoardReady\(\)/);
  assert.match(d,/Keep the exact aligned source crop on the raised surface/);
  assert.doesNotMatch(d,/textureContext\.fillText\(/);
  assert.match(d,/clearTileMeshes\(\)/);
  assert.match(d,/board\.classList\.add\('tv-3d-board-ready'\)/);
  assert.match(d,/board\.classList\.remove\('tv-3d-board-ready'\)/);
  assert.match(d,/canvasElement\.dataset\.table='3d'/);
  assert.match(scene,/threeDice=createThreeDice\(board,cells\)/);
  assert.match(scene,/function setBoardArt\(source\)/);
  assert.match(entry,/cinematic\?\.setBoardArt\(boardArtSource\)/);
  assert.match(entry,/if\(boardArtSource\)cinematic\.setBoardArt\(boardArtSource\)/);
  assert.match(css,/\.tv-board\.tv-3d-board-ready/);
  assert.doesNotMatch(d,/submitAction|createRoom|fetch\(/);
});

test('TV idle and pre-roll center stay open, with readable-sized 3D pawns',()=>{
  const d=read('../tools/monopoly-tv-renderer/dice3d.mjs');
  assert.match(css,/\.tv-center-scene\[data-phase=waiting\],\s*\.tv-view \.tv-center-scene\[data-phase=roll\]\{\s*display:none;/);
  assert.match(css,/\.tv-view \.tv-board\.has-art \.tv-board-center\{[\s\S]*?background:linear-gradient\(145deg,#2c6d50 0%,#1d5039 56%,#143b2b 100%\)/);
  assert.doesNotMatch(css,/\.tv-view \.tv-board\.has-art \.tv-board-center\.is-playing\s*\{[^}]*background:/,
    'the no-WebGL fallback must keep the whole board center felt-green while playing');
  assert.match(css,/\.tv-board-center\.is-playing \.tv-center-scene\[data-event=auction\][\s\S]*?background:linear-gradient\(155deg,#f9f4e9,#dceadd\)/,
    'event cards keep their own surface instead of recoloring the whole board center');
  assert.match(d,/pawn\.group\.scale\.setScalar\(isCornerCell\(cell\)\?\.46:\.60\)/);
  assert.match(css,/\.tv-board\.has-art\{\s*padding:0;/);
  assert.match(css,/background-size:116\.55% 116\.55%/);
});

test('TV event styling and fullscreen affordance are explicit, while the demo player reads as automatic',()=>{
  assert.match(tvHtml,/id="tvFullscreen"[^>]*>ملء شاشة التلفزيون/);
  assert.match(entry,/document\.documentElement\.requestFullscreen\(\{navigationUI:'hide'\}\)/);
  assert.match(entry,/webkitRequestFullscreen/);
  assert.match(entry,/document\.addEventListener\('fullscreenchange',syncFullscreenButton\)/);
  assert.match(entry,/const centerHouseIcon='<svg/);
  assert.match(entry,/function setCenterSymbol\(symbol,value\)/);
  assert.match(css,/\.tv-board-center\.is-playing \.tv-center-scene::before\{\s*content:none;/);
  assert.match(controller,/demoButton\.classList\.add\('is-auto'\)/);
  assert.match(css,/\.remote-card #addDemoPlayer\.is-auto\{opacity:1/);
});

test('Three.js renders a real tabletop perspective instead of a front-facing board',()=>{
  const d=read('../tools/monopoly-tv-renderer/dice3d.mjs');
  assert.match(d,/function woodGrainTexture\(\)/);
  assert.match(d,/const slabMat=new MeshStandardMaterial\(\{map:woodTexture/);
  assert.match(d,/texture\.wrapS=RepeatWrapping;texture\.wrapT=RepeatWrapping/);
  assert.match(d,/new PerspectiveCamera\(34,1/);
  assert.match(d,/overviewCamera=\{x:0,y:11,z:6\.4\}/);
  assert.match(d,/boardGroup\.rotation\.x=-Math\.PI\/2/);
  assert.match(d,/camera\.lookAt\(0,0,0\)/);
  assert.match(d,/tl\.to\(camera\.position,\{y:10\.8,z:6\.3/);
  assert.match(d,/tl\.to\(camera,\{zoom:1\.06/);
  assert.match(css,/\.tv-board-frame\.tv-3d-board-ready\{[\s\S]*?background:transparent/);
});

test('3D table fits the roll zoom and drops the old inner CSS frame',()=>{
  const d=read('../tools/monopoly-tv-renderer/dice3d.mjs');
  assert.match(d,/const surfaceSize=surfaceHeight\*\.76/);
  assert.match(css,/\.tv-view \.tv-board\.tv-3d-board-ready\{[\s\S]*?box-shadow:none;/);
});

test('dice roll uses a real Three.js camera crane and always restores the tile projection',()=>{
  const d=read('../tools/monopoly-tv-renderer/dice3d.mjs');
  assert.match(d,/camera\.lookAt\(0,0,0\)/);
  assert.match(d,/tl\.to\(camera\.position,\{y:10\.8,z:6\.3/);
  assert.match(d,/tl\.to\(camera\.position,\{y:overviewCamera\.y,z:overviewCamera\.z/);
  assert.match(d,/camera\.position\.set\(overviewCamera\.x,overviewCamera\.y,overviewCamera\.z\)/);
  assert.match(d,/board\.classList\.add\('tv-3d-rolling'\)/);
  assert.match(d,/board\.classList\.remove\('tv-3d-rolling'\)/);
  assert.match(css,/\.tv-board\.tv-3d-board-ready\.tv-3d-rolling \.tv-cell/);
  assert.match(d,/prefers-reduced-motion/);
});
