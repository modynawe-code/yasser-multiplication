// One local snapshot, independent of educational progress and online rooms.
export const MARIO_SAVE_KEY='family:mario:snapshot:v1';
export const MARIO_SAVE_INTERVAL_MS=15000;
const FORMAT_VERSION=1;

export function marioRomFingerprint(bytes){
  let hash=0x811c9dc5;
  for(const byte of bytes)hash=Math.imul(hash^byte,0x01000193)>>>0;
  return `nes-${bytes.length}-${hash.toString(16)}`;
}
function validState(state){
  return state&&typeof state==='object'&&Array.isArray(state.cpu?.mem)&&state.cpu.mem.length===65536&&
    Array.isArray(state.ppu?.buffer)&&state.ppu.buffer.length===256*240&&
    state.mmap&&state.papu&&state.controllers;
}
export function readMarioSave(storage,romId){
  try{
    const raw=storage.getItem(MARIO_SAVE_KEY);
    if(!raw)return {status:'empty'};
    const saved=JSON.parse(raw);
    if(saved.version!==FORMAT_VERSION||saved.romId!==romId)return {status:'incompatible'};
    if(!Number.isFinite(saved.savedAt)||!validState(saved.state))return {status:'invalid'};
    return {status:'ready',saved};
  }catch{return {status:'unavailable'};}
}
export function writeMarioSave(storage,romId,nes,now=Date.now()){
  try{
    const state=nes.toJSON();
    if(!romId||!validState(state))return {ok:false};
    // Never resume with a finger/key that was held when the snapshot was taken.
    for(const player of [1,2]){
      const controller=state.controllers[player];
      if(controller)state.controllers[player]={...controller,state:Array(8).fill(0x40),baseA:0x40,baseB:0x40,turboA:false,turboB:false,turboToggle:false};
    }
    // setItem replaces atomically: quota failure leaves the previous snapshot intact.
    storage.setItem(MARIO_SAVE_KEY,JSON.stringify({version:FORMAT_VERSION,romId,savedAt:now,state}));
    return {ok:true,savedAt:now};
  }catch{return {ok:false};}
}
