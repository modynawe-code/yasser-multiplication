export const GAME_ID='gold-vault';
export function vaultEdges(size=4){const edges=[];for(let r=0;r<=size;r++)for(let c=0;c<size;c++)edges.push({id:`h-${r}-${c}`,r,c,axis:'h'});for(let r=0;r<size;r++)for(let c=0;c<=size;c++)edges.push({id:`v-${r}-${c}`,r,c,axis:'v'});return edges;}
export function cellEdges(r,c){return [`h-${r}-${c}`,`h-${r+1}-${c}`,`v-${r}-${c}`,`v-${r}-${c+1}`];}
export function scores(state){return Object.fromEntries(state.players.map(p=>[p.id,Object.values(state.cells).filter(id=>id===p.id).length]));}
export function createVaultState(players,{size=4,round=1,mode='dice'}={}){
 if(!Array.isArray(players)||players.length!==2||new Set(players.map(p=>p.id)).size!==2||players.some(p=>!p.id))throw new TypeError('two unique players required');
 if(!Number.isInteger(size)||size<3||size>6||!['dice','thinking'].includes(mode))throw new TypeError('invalid board configuration');
 return {gameId:GAME_ID,schemaVersion:1,id:globalThis.crypto?.randomUUID?.()||`vault-${Date.now()}-${Math.random()}`,players:players.map(p=>({id:String(p.id),name:String(p.name||p.id).slice(0,32)})),size,mode,round,status:'playing',phase:mode==='dice'?'roll':'place',turnIndex:(round-1)%2,remaining:mode==='dice'?0:1,dice:null,edges:{},cells:{},moveCount:0,eventSeq:0,lastEvent:null,startedAt:new Date().toISOString(),winner:null,rematchReady:[]};
}
export function previewVaultEdge(state,id){
 if(state.edges[id]||!vaultEdges(state.size).some(e=>e.id===id))return [];
 const completed=[];for(let r=0;r<state.size;r++)for(let c=0;c<state.size;c++){const key=`${r}-${c}`,bounds=cellEdges(r,c);if(!state.cells[key]&&bounds.includes(id)&&bounds.every(e=>e===id||state.edges[e]))completed.push(key);}return completed;
}
function randomDie(){const bytes=new Uint32Array(1);if(globalThis.crypto?.getRandomValues){do{crypto.getRandomValues(bytes);}while(bytes[0]>=4294967292);return bytes[0]%6+1;}return 1+Math.floor(Math.random()*6);}
export function applyVaultAction(state,{playerId,type,payload={}}={}, {die=randomDie}={}){
 if(state?.gameId!==GAME_ID||state.schemaVersion!==1)return {ok:false,reason:'invalid-game-state'};
 if(!state.players.some(p=>p.id===playerId))return {ok:false,reason:'player-not-in-room'};
 if(type==='reset'){
  if(state.status!=='finished')return {ok:false,reason:'game-not-finished'};
  if(state.rematchReady.includes(playerId))return {ok:false,reason:'rematch-already-ready'};
  const next=structuredClone(state);next.rematchReady.push(playerId);
  return {ok:true,state:next.rematchReady.length===2?createVaultState(state.players,{size:state.size,mode:state.mode,round:state.round+1}):next};
 }
 if(state.status!=='playing')return {ok:false,reason:'game-not-playing'};
 if(state.players[state.turnIndex].id!==playerId)return {ok:false,reason:'not-your-turn'};
 const next=structuredClone(state);
 if(type==='roll'){
  if(state.phase!=='roll')return {ok:false,reason:'already-rolled'};
  const value=die();if(!Number.isInteger(value)||value<1||value>6)return {ok:false,reason:'invalid-die'};
  next.dice=value;next.remaining=Math.min(value,vaultEdges(state.size).length-state.moveCount);next.phase='place';next.eventSeq++;next.lastEvent={seq:next.eventSeq,type:'roll',playerId,value};return {ok:true,state:next};
 }
 if(type!=='edge')return {ok:false,reason:'unsupported-action'};
 if(state.phase!=='place'||state.remaining<1)return {ok:false,reason:'roll-first'};
 const id=payload.edgeId;if(typeof id!=='string'||!vaultEdges(state.size).some(e=>e.id===id))return {ok:false,reason:'invalid-edge'};
 if(state.edges[id])return {ok:false,reason:'occupied-edge'};
 const captured=previewVaultEdge(state,id);next.edges[id]=playerId;captured.forEach(key=>{next.cells[key]=playerId;});next.moveCount++;next.remaining--;
 if(Object.keys(next.cells).length===state.size**2){next.status='finished';next.phase='finished';next.remaining=0;next.endedAt=new Date().toISOString();const points=scores(next),[a,b]=next.players.map(p=>p.id);next.winner=points[a]===points[b]?null:points[a]>points[b]?a:b;}
 else if(state.mode==='thinking'&&captured.length){next.remaining=1;}
 else if(next.remaining===0){next.turnIndex=1-state.turnIndex;next.phase=state.mode==='dice'?'roll':'place';next.remaining=state.mode==='dice'?0:1;}
 next.eventSeq++;next.lastEvent={seq:next.eventSeq,type:'edge',edgeId:id,playerId,captured,turnChanged:next.turnIndex!==state.turnIndex};return {ok:true,state:next};
}
export function restoreVaultState(value){
 try{const s=structuredClone(value);if(s.gameId!==GAME_ID||s.schemaVersion!==1||s.players?.length!==2||!Number.isInteger(s.size)||s.size<3||s.size>6||![0,1].includes(s.turnIndex)||!['dice','thinking'].includes(s.mode)||!['playing','finished'].includes(s.status))return null;
 const ids=new Set(s.players.map(p=>p.id)),valid=new Set(vaultEdges(s.size).map(e=>e.id));if(ids.size!==2||Object.entries(s.edges).some(([e,id])=>!valid.has(e)||!ids.has(id))||s.moveCount!==Object.keys(s.edges).length)return null;
 for(let r=0;r<s.size;r++)for(let c=0;c<s.size;c++){const k=`${r}-${c}`,closed=cellEdges(r,c).every(e=>s.edges[e]);if(Boolean(s.cells[k])!==closed||s.cells[k]&&!ids.has(s.cells[k]))return null;}
 if(Object.keys(s.cells).some(k=>!/^\d-\d$/.test(k)||k.split('-').some(x=>Number(x)>=s.size))||!Number.isInteger(s.remaining)||s.remaining<0||s.remaining>6||!['roll','place','finished'].includes(s.phase))return null;
 if(s.status==='finished'&&Object.keys(s.cells).length!==s.size**2||s.phase==='roll'&&s.remaining!==0||s.phase==='place'&&s.remaining<1)return null;return s;}catch{return null;}
}
