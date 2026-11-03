import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scene=read('../tools/monopoly-tv-renderer/scene.mjs');
const entry=read('monopoly-party/tv/tv.js');
const css=read('monopoly-party/party.css');
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
  assert.match(entry,/catch\(error=>\{console\.warn/);
  assert.match(css,/\.tv-board\.cinematic-ready \.tv-token\{visibility:hidden\}/);
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
  assert.match(scene,/createThreeDice\(board\)/);
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
  assert.match(d,/function syncPawns\(players,cells,colors\)/);
  assert.match(d,/function movePawn\(id,index,duration/);
  assert.match(d,/canvas\.dataset\.pawns=String\(pawns\.size\)/);
  assert.match(d,/canvas\.dataset\.dice=values\.join\(','\)/);
  assert.match(scene,/threeDice\.syncPawns\(state\.players,cells,colors\)/);
  assert.match(scene,/threeDice\.movePawn\(id,index,duration\)/);
  assert.match(scene,/layer\.visible=false/);
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
