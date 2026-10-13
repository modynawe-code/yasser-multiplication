import test from 'node:test';
import assert from 'node:assert/strict';
import {createMarioController} from '../src/modules/games/mario/mario-controller.js';

test('Mario touch input isolates pointers, releases outside targets and respects lifecycle',async()=>{
  class Target {
    listeners=new Map();attributes={};disabled=false;textContent='';
    style={setProperty:(key,value)=>{this.attributes[key]=value;}};
    classes=new Set();classList={add:name=>this.classes.add(name),remove:name=>this.classes.delete(name),contains:name=>this.classes.has(name),toggle:(name,on)=>on?this.classes.add(name):this.classes.delete(name)};
    constructor(name){this.dataset={marioButton:name};}
    setAttribute(name,value){this.attributes[name]=value;}
    addEventListener(type,handler){const list=this.listeners.get(type)||[];list.push(handler);this.listeners.set(type,list);}
    removeEventListener(type,handler){this.listeners.set(type,(this.listeners.get(type)||[]).filter(item=>item!==handler));}
    fire(type,extra={}){for(const handler of this.listeners.get(type)||[])handler({currentTarget:this,preventDefault(){},...extra});}
    setPointerCapture(){}
    replaceChildren(){}
    getBoundingClientRect(){return {left:0,right:60,top:0,bottom:60};}
  }
  const names=['UP','LEFT','DOWN','RIGHT','A','B','SELECT','START'];
  const buttons=Object.fromEntries(names.map(name=>[name,new Target(name)]));
  const ids=Object.fromEntries(['marioGameView','marioScreen','marioStatus','marioPause','marioReset','marioFullscreen','marioBackToGames'].map(id=>[id,new Target()]));
  const document=new Target();Object.assign(document,{visibilityState:'visible',body:new Target(),baseURI:'https://example.test/',getElementById:id=>ids[id],querySelector:selector=>buttons[selector.match(/"([A-Z]+)"/)?.[1]],querySelectorAll:()=>Object.values(buttons)});
  const viewport=new Target();Object.assign(viewport,{height:900,offsetTop:0});
  const events=new Target(),calls=[];
  const saved=new Map();
  const globals={document,visualViewport:viewport,innerHeight:900,confirm:()=>false,addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events),fetch:async()=>({ok:true,arrayBuffer:async()=>new Uint8Array([0x4e,0x45,0x53,0x1a,...Array(12).fill(0)]).buffer}),jsnes:{Controller:Object.fromEntries(names.map(name=>[`BUTTON_${name}`,name])),Browser:class{nes={buttonDown:(_,name)=>calls.push(['down',name]),buttonUp:(_,name)=>calls.push(['up',name]),reset:()=>calls.push(['reset'])};loadROM(){}destroy(){}start(){}stop(){}}}};
  for(const [key,value] of Object.entries(globals)){saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});}
  let back=0;const controller=createMarioController({onBack:()=>back++});
  try{
    controller.start();await new Promise(resolve=>setImmediate(resolve));
    assert.equal(buttons.A.disabled,false);
    assert.equal(ids.marioGameView.attributes['--mario-viewport-height'],'900px');
    const pointer=(button,type,id,x=30)=>buttons[button].fire(type,{pointerId:id,clientX:x,clientY:30});
    pointer('RIGHT','pointerdown',1);pointer('A','pointerdown',2);pointer('B','pointerdown',3);
    assert.deepEqual(calls,[['down','RIGHT'],['down','A'],['down','B']]);
    pointer('RIGHT','pointermove',1,80);
    assert.deepEqual(calls.at(-1),['up','RIGHT']);
    assert.equal(buttons.DOWN.attributes['aria-pressed'],'false','sliding must not activate a neighbour');
    assert.equal(buttons.A.attributes['aria-pressed'],'true');
    pointer('RIGHT','pointermove',1);assert.deepEqual(calls.at(-1),['down','RIGHT']);
    pointer('A','pointercancel',2);assert.deepEqual(calls.at(-1),['up','A']);
    pointer('B','lostpointercapture',3);assert.deepEqual(calls.at(-1),['up','B']);
    pointer('A','pointerdown',4);pointer('A','pointerdown',5);pointer('A','pointerup',4);
    assert.equal(buttons.A.attributes['aria-pressed'],'true','one pointer must not release another');
    pointer('A','pointerup',5);assert.equal(buttons.A.attributes['aria-pressed'],'false');
    ids.marioPause.fire('click');const count=calls.length;pointer('A','pointerdown',6);
    assert.equal(calls.length,count,'paused game must ignore input');
    ids.marioPause.fire('click');pointer('LEFT','pointerdown',7);events.fire('blur');
    assert.equal(buttons.LEFT.attributes['aria-pressed'],'false');
    pointer('B','pointerdown',8);document.visibilityState='hidden';document.fire('visibilitychange');
    assert.equal(buttons.B.attributes['aria-pressed'],'false');document.visibilityState='visible';
    ids.marioReset.fire('click');assert.equal(calls.some(call=>call[0]==='reset'),false);
    ids.marioBackToGames.fire('click');assert.equal(back,0);
    viewport.height=620;viewport.fire('resize');assert.equal(ids.marioGameView.attributes['--mario-viewport-height'],'620px');
    globalThis.confirm=()=>true;ids.marioReset.fire('click');assert.deepEqual(calls.at(-1),['reset']);
    ids.marioBackToGames.fire('click');assert.equal(back,1);
    assert.equal(viewport.listeners.get('resize').length,0,'leaving removes viewport listeners');
  }finally{
    controller.leave();for(const [key,descriptor] of saved)descriptor?Object.defineProperty(globalThis,key,descriptor):delete globalThis[key];
  }
});
