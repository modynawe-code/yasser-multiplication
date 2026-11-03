import qrcode from '../vendor/qrcode.mjs';
import {BOARD,GROUP_COLORS,PARTY_COLORS,tileCoordinates,publicJoinUrl,makePartyConnection,roomCode} from '../shared.js';
import {movementRoute} from '../../src/modules/games/monopoly/monopoly-scene.js';

const byId=id=>document.getElementById(id);
const status=byId('connectionStatus');
const board=byId('partyBoard');
const tokenLayer=document.createElement('div');tokenLayer.className='tv-tokens';
const cells=new Map(),pieces=new Map();
let previousRoom=null,sequence=0,latestState=null;
const conn=makePartyConnection({role:'spectator',onRoom:renderRoom,onStatus:(value,error)=>{
  status.textContent=value==='connected'?'متصل بالغرفة':'الاتصال غير متاح'+(error?.status?' ('+error.status+')':'');
  status.classList.toggle('offline',value!=='connected');
}});
function el(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);return node;}
function boardSetup(){
  BOARD.forEach((item,i)=>{
    const c=tileCoordinates(i),node=el('div','tv-cell');
    node.dataset.index=String(i);node.dataset.type=item.type;
    node.style.gridColumn=String(c.col+1);node.style.gridRow=String(c.row+1);
    node.style.setProperty('--group',GROUP_COLORS[item.group]||'#97b39c');
    node.append(el('strong','',item.name));
    if(item.price)node.append(el('small','',item.price+' ر'));
    cells.set(i,node);board.append(node);
  });
  const center=el('div','tv-board-center');
  const title=el('div');
  title.append(el('div','center-mark','🎲'),el('h2','','احتكار المعرفة'),el('p','','العب من جوالك · الشاشة تتابع الحكاية'));
  center.append(title);board.append(center,tokenLayer);
}
function drawQr(code){
  const url=publicJoinUrl(code);
  const qr=qrcode(0,'M');qr.addData(url);qr.make();
  byId('tvQr').innerHTML=qr.createSvgTag({cellSize:5,margin:12,scalable:true});
  byId('tvRemoteLink').href=url;byId('tvRemoteLink').textContent=url;
  byId('tvCode').textContent=code;
}
function addRoster(room){
  const dest=byId('tvPlayers');dest.replaceChildren();
  const activeId=room.state?.players?.[room.state?.turnIndex]?.id;
  (room.state?.players||[]).forEach((player,i)=>{
    const item=el('div','tv-player'+(activeId===player.id?' active':''));
    item.style.setProperty('--player',PARTY_COLORS[i%PARTY_COLORS.length]);
    item.append(el('strong','',player.name),el('small','',room.status==='waiting'?'جاهز للدخول':player.bankrupt?'خرج من اللعبة':'الرصيد: '+player.cash+' ريال'));
    dest.append(item);
  });
}
function place(playerId,index,animate=false){
  const tile=cells.get(index),piece=pieces.get(playerId);if(!tile||!piece)return;
  const cell=tile.getBoundingClientRect(),b=board.getBoundingClientRect();
  const radius=Math.max(16,Math.min(35,cell.width*.52));
  piece.style.width=radius+'px';piece.style.height=radius+'px';
  if(!animate)piece.style.transition='none';
  piece.style.left=(cell.left-b.left+cell.width/2-radius/2)+'px';
  piece.style.top=(cell.top-b.top+cell.height/2-radius/2)+'px';
  if(!animate)requestAnimationFrame(()=>{piece.style.transition='';});
}
function syncPieces(state){
  const ids=new Set(state.players.map(p=>p.id));
  for(const [id,node] of pieces)if(!ids.has(id)){node.remove();pieces.delete(id);}
  state.players.forEach((p,i)=>{
    let node=pieces.get(p.id);
    if(!node){
      node=el('div','tv-token',p.name.slice(0,1));node.style.setProperty('--player',PARTY_COLORS[i%PARTY_COLORS.length]);
      node.setAttribute('aria-label','قطعة اللاعب '+p.name);tokenLayer.append(node);pieces.set(p.id,node);
    }
    node.classList.toggle('active',state.players[state.turnIndex]?.id===p.id);
  });
}
function renderEvent(state){
  const dest=byId('tvEvent');dest.replaceChildren();
  if(state.status==='waiting'){
    dest.append(el('strong','','بانتظار بدء اللعبة'),el('p','','ينضم لاعبان على الأقل، ثم يضغط المضيف «ابدأ اللعبة» من جواله.'));
    byId('tvPhase').textContent='بانتظار اللاعبين · '+state.players.length+' / 4';
    byId('tvDice').replaceChildren();return;
  }
  const player=state.players[state.turnIndex];
  const pending=state.pending;
  const landing=state.players.find(x=>x.id===state.presentation?.actorId)||player;
  const name=pending&&BOARD[pending.index]?BOARD[pending.index].name:BOARD[landing?.position]?.name;
  let headline='دور '+(player?.name||'اللاعب');
  if(state.phase==='property')headline='أرض متاحة للشراء';
  else if(state.phase==='auction')headline='مزاد على الأرض';
  else if(state.phase==='card')headline='بطاقة '+(pending?.card?.text?'الفرصة أو الجماعة':'بانتظار السحب');
  else if(state.phase==='trade')headline='عرض تبادل';
  else if(state.phase==='end')headline='الحدث اكتمل';
  if(state.status==='finished')headline='نهاية الجولة';
  dest.append(el('strong','',headline),el('p','',state.log||'تابع اللعبة من الجوال'));
  if(name)dest.append(el('p','','الموقع: '+name));
  if(state.phase==='card'&&pending?.stage==='face'&&pending.card?.text)dest.append(el('p','',pending.card.text));
  byId('tvPhase').textContent='المرحلة: '+state.phase+' · الدور: '+(player?.name||'—');
  const dice=byId('tvDice');dice.replaceChildren();
  (state.dice||[]).forEach(v=>dice.append(el('div','tv-die',v)));
}
async function animateArrival(prev,next,token,generation){
  const from=prev?.position,to=next?.position;
  if(!Number.isInteger(from)||!Number.isInteger(to)||from===to){place(next.id,to,false);return;}
  const route=movementRoute(from,to,{teleport:to===10&&next.jailed});
  for(const pos of route){
    if(generation!==sequence)return;
    place(next.id,pos,true);
    await new Promise(resolve=>setTimeout(resolve,240));
  }
}
async function renderRoom(room){
  if(!room||room.gameId!=='family-monopoly')return;
  const old=previousRoom;previousRoom=room;
  const generation=++sequence, state=room.state;
  latestState=state;
  byId('tvJoin').hidden=true;byId('tvStage').hidden=false;
  drawQr(room.code);addRoster(room);syncPieces(state);
  for(const [i,own] of Object.entries(state.ownership||{})){
    const tile=cells.get(Number(i));if(tile){tile.classList.add('owned');tile.style.setProperty('--owner',PARTY_COLORS[Math.max(0,state.players.findIndex(p=>p.id===own.ownerId))%PARTY_COLORS.length]);}
  }
  if(!old||old.code!==room.code||old.status==='waiting'||state.status==='waiting'){
    state.players.forEach(p=>place(p.id,p.position||0,false));renderEvent(state);return;
  }
  const moving=state.players.find(p=>old.state?.players?.some(prev=>prev.id===p.id&&prev.position!==p.position));
  if(moving){
    state.players.filter(p=>p.id!==moving.id).forEach(p=>place(p.id,p.position||0,false));
    await animateArrival(old.state.players.find(p=>p.id===moving.id),moving,moving,generation);
  }else state.players.forEach(p=>place(p.id,p.position||0,false));
  if(generation===sequence)renderEvent(state);
}
byId('tvJoinForm').addEventListener('submit',async e=>{
  e.preventDefault();const code=roomCode(new FormData(e.currentTarget).get('code'));
  if(!code){byId('tvJoinError').textContent='أدخل 6 أرقام صحيحة';return;}
  const button=e.currentTarget.querySelector('button');button.disabled=true;byId('tvJoinError').textContent='';
  try{await conn.join(code,'شاشة التلفزيون');}
  catch(err){byId('tvJoinError').textContent='تعذّر الربط: '+(err.status||err.message);}
  finally{button.disabled=false;}
});
byId('tvDisconnect').addEventListener('click',()=>{conn.leave();previousRoom=null;byId('tvStage').hidden=true;byId('tvJoin').hidden=false;status.textContent='غير متصل';status.classList.add('offline');});
boardSetup();
const initial=new URL(location.href).searchParams.get('code');if(roomCode(initial))byId('tvJoinForm').elements.code.value=initial;
void conn.resume();
window.addEventListener('resize',()=>{if(latestState)latestState.players?.forEach(p=>place(p.id,p.position||0,false));});
