import qrcode from '../vendor/qrcode.mjs';
import {BOARD,GROUP_COLORS,PARTY_COLORS,tileCoordinates,publicJoinUrl,makePartyConnection,roomCode} from '../shared.js';
import {movementRoute} from '../../src/modules/games/monopoly/monopoly-scene.js';

const byId=id=>document.getElementById(id);
const status=byId('connectionStatus');
const board=byId('partyBoard');
const tokenLayer=document.createElement('div');tokenLayer.className='tv-tokens';
const cells=new Map(),pieces=new Map();
let previousRoom=null,sequence=0,latestState=null,voiceEnabled=false,soundContext=null,overviewTimer=null,lastFocus=-1,cinematic=null;
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
    node.append(el('span','tv-buildings'));
    cells.set(i,node);board.append(node);
  });
  const center=el('div','tv-board-center');
  const scene=el('div','tv-center-scene');scene.id='tvCenterScene';scene.dataset.phase='waiting';
  const symbol=el('div','center-mark','🎲');symbol.id='tvCenterSymbol';
  const heading=el('h2','','احتكار المعرفة');heading.id='tvCenterHeadline';
  const detail=el('p','','العب من جوالك · الشاشة تتابع الحكاية');detail.id='tvCenterDetail';
  const dice=el('div','tv-center-dice');dice.id='tvCenterDice';
  scene.append(symbol,heading,detail,dice);center.append(scene);board.append(center,tokenLayer);
}
async function loadBoardArt(){
  // Reuse the same checked Arabic Figma board art as the original Monopoly.
  // The 40 DOM cells still own pieces, houses, hotels and ownership highlights.
  try{
    const url=new URL('../../src/modules/games/monopoly/assets/figma-arabic/board-from-variable-template.png.b64',import.meta.url);
    const response=await fetch(url,{cache:'force-cache'});
    if(!response.ok)throw new Error('board artwork unavailable');
    const source=(await response.text()).trim();
    if(!/^[a-zA-Z0-9+/=\s]+$/.test(source)||source.length<1000)throw new Error('invalid board artwork');
    board.style.backgroundImage='url("data:image/png;base64,'+source.replace(/\s+/g,'')+'")';
    board.classList.add('has-art');
    if(latestState)latestState.players.forEach(player=>place(player.id,player.position||0,false));
    return true;
  }catch{
    // A disconnected/offline TV keeps the readable accessible DOM fallback.
    board.classList.remove('has-art');
    return false;
  }
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
  // Use untransformed coordinates so camera zoom never displaces player pieces.
  const radius=Math.max(16,Math.min(35,tile.offsetWidth*.52));
  piece.style.width=radius+'px';piece.style.height=radius+'px';
  if(!animate)piece.style.transition='none';
  piece.style.left=(tile.offsetLeft+tile.offsetWidth/2-radius/2)+'px';
  piece.style.top=(tile.offsetTop+tile.offsetHeight/2-radius/2)+'px';
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
const diceRecordings=[1,2,3].map(index=>new URL('../../src/modules/games/monopoly/assets/audio/dice-roll-'+index+'.mp3',import.meta.url).href);
function sound(kind){
  if(!voiceEnabled)return;
  if(kind==='dice'){
    const clip=new Audio(diceRecordings[Math.floor(Math.random()*diceRecordings.length)]);
    clip.volume=.6;void clip.play().catch(()=>{});
    return;
  }
  try{
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return;
    soundContext||=new Audio();
    if(soundContext.state==='suspended')void soundContext.resume();
    const source=soundContext.createOscillator(),volume=soundContext.createGain();
    const now=soundContext.currentTime;
    source.type=kind==='step'?'triangle':'sine';
    const pitch=kind==='dice'?180:kind==='purchase'?650:kind==='step'?290:560;
    source.frequency.setValueAtTime(pitch,now);
    source.frequency.exponentialRampToValueAtTime(kind==='dice'?90:pitch*1.25,now+.18);
    volume.gain.setValueAtTime(kind==='step'?.026:.075,now);
    volume.gain.exponentialRampToValueAtTime(.001,now+.23);
    source.connect(volume).connect(soundContext.destination);
    source.start(now);source.stop(now+.24);
  }catch{}
}
function resetCamera(){
  if(cinematic){cinematic.overview();return;}
  lastFocus=-1;
  clearTimeout(overviewTimer);
  board.style.transform='scale(1)';
  board.style.transformOrigin='50% 50%';
  cells.forEach(cell=>cell.classList.remove('is-focused'));
}
function focusCamera(index,zoom=1.09){
  if(cinematic){cinematic.focus(index,zoom);return;}
  const tile=cells.get(index);if(!tile)return;
  cells.forEach(cell=>cell.classList.toggle('is-focused',cell===tile));
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){resetCamera();return;}
  lastFocus=index;
  const x=(tile.offsetLeft+tile.offsetWidth/2)/Math.max(1,board.offsetWidth)*100,
        y=(tile.offsetTop+tile.offsetHeight/2)/Math.max(1,board.offsetHeight)*100;
  board.style.transformOrigin=x.toFixed(2)+'% '+y.toFixed(2)+'%';
  board.style.transform='scale('+zoom+')';
  clearTimeout(overviewTimer);
  overviewTimer=setTimeout(()=>{board.style.transform='scale(1)';},1600);
}
function syncBuildings(state){
  for(const [index,cell] of cells){
    const own=state.ownership?.[index],build=cell.querySelector('.tv-buildings');
    if(!own){
      cell.classList.remove('owned');cell.style.removeProperty('--owner');
      if(build)build.replaceChildren();continue;
    }
    cell.classList.add('owned');
    const playerIndex=state.players.findIndex(p=>p.id===own.ownerId);
    cell.style.setProperty('--owner',PARTY_COLORS[Math.max(0,playerIndex)%PARTY_COLORS.length]);
    if(build){
      build.replaceChildren();
      if(own.hotel)build.append(el('span','tv-hotel','🏨'));
      else for(let i=0;i<Math.min(4,own.houses||0);i++)build.append(el('span','tv-house','⌂'));
    }
  }
}
function updateCenterScene(state,moving=false){
  const scene=byId('tvCenterScene'),heading=byId('tvCenterHeadline'),
        detail=byId('tvCenterDetail'),symbol=byId('tvCenterSymbol'),
        dice=byId('tvCenterDice');
  if(!scene||!heading||!detail||!symbol||!dice)return;
  const playing=state.status==='playing';
  scene.parentElement.classList.toggle('is-playing',playing);
  const phase=moving?'moving':state.status==='waiting'?'waiting':state.phase||'end';
  scene.dataset.phase=phase;
  // Server-provided presentation metadata only: never infer or change financial outcomes.
  const action=String(state.presentation?.action||'');
  const actionScenes={
    buy:{kind:'purchase',symbol:'🏠',title:'تم شراء الملكية'},
    build:{kind:'build',symbol:'🏗️',title:'تم تطوير الملكية'},
    mortgage:{kind:'mortgage',symbol:'📜',title:'تم رهن الملكية'},
    unmortgage:{kind:'mortgage',symbol:'🔓',title:'تم فك الرهن'},
    sell:{kind:'sale',symbol:'💰',title:'تم بيع الملكية'},
    jail:{kind:'jail',symbol:'🔒',title:'حدث السجن'},
    'trade-accept':{kind:'trade',symbol:'🤝',title:'اكتمل التبادل'},
    'trade-reject':{kind:'trade',symbol:'✕',title:'رُفض التبادل'},
    'pass-auction':{kind:'auction',symbol:'🔨',title:'انتهت المزايدة'}
  };
  const actionScene=!moving&&(phase==='end'||(phase==='roll'&&action==='build'))?actionScenes[action]:null;
  scene.dataset.event=actionScene?.kind||phase;
  const player=state.players?.[state.turnIndex];
  const position=state.pending?.index??player?.position;
  const space=BOARD[position],color=GROUP_COLORS[space?.group]||'#d4b66c';
  scene.style.setProperty('--scene-band',color);
  dice.replaceChildren();
  if(state.status==='waiting'){
    symbol.textContent='🎲';heading.textContent='احتكار المعرفة';
    detail.textContent='ينضم اللاعبون من الجوال قبل بدء الجولة';return;
  }
  if(moving){
    symbol.textContent='🎲';heading.textContent='القطعة تتحرك';
    detail.textContent='تابع مسار '+(player?.name||'اللاعب')+' على اللوحة';
  }else if(actionScene){
    symbol.textContent=actionScene.symbol;heading.textContent=actionScene.title;
    detail.textContent=state.log||'تم تحديث حالة الجولة';
  }else if(phase==='roll'){
    symbol.textContent='🎲';heading.textContent='دور '+(player?.name||'اللاعب');
    detail.textContent='ارمِ النرد من جوالك';
  }else if(phase==='property'){
    symbol.textContent='🏠';heading.textContent=space?.name||'صك ملكية';
    detail.textContent='صك ملكية متاح · '+(space?.price??0)+' ريال';
  }else if(phase==='auction'){
    symbol.textContent='🔨';heading.textContent='مزاد '+(space?.name||'أرض');
    detail.textContent='أعلى مزايدة: '+(state.auction?.bid??0)+' ريال';
  }else if(phase==='card'){
    symbol.textContent='🃏';heading.textContent='فرصة أو جماعة';
    detail.textContent=state.pending?.stage==='face'?
      String(state.pending?.card?.text||'اكشف البطاقة من الجوال'):
      'تظهر البطاقة للجميع · القرار من الجوال';
  }else if(phase==='trade'){
    symbol.textContent='🤝';heading.textContent='عرض تبادل';
    detail.textContent='بانتظار قبول أو رفض اللاعب الآخر';
  }else if(state.status==='finished'){
    symbol.textContent='🏆';heading.textContent='انتهت الجولة';
    detail.textContent=state.log||'تهانينا للفائز';
  }else{
    symbol.textContent='✓';heading.textContent='اكتمل الحدث';
    detail.textContent=state.log||'العودة إلى الجولة';
  }
  if(state.dice?.length===2)
    state.dice.forEach(value=>dice.append(el('span','tv-center-die',value)));
}
function renderEvent(state){
  updateCenterScene(state);
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
  if(state.phase==='property'&&state.pending?.index!==undefined){
    const tile=BOARD[state.pending.index];
    dest.append(el('p','tv-highlight','السعر: '+tile.price+' ريال · القرار من جوال اللاعب'));
  }else if(state.phase==='auction'&&state.auction)
    dest.append(el('p','tv-highlight','أعلى مزايدة: '+state.auction.bid+' ريال'));
  if(state.tradeOffer&&state.phase==='trade'){
    const tile=BOARD[state.tradeOffer.index],to=state.players.find(p=>p.id===state.tradeOffer.targetId);
    dest.append(el('p','','تبادل '+(tile?.name||'أرض')+' مع '+(to?.name||'اللاعب')));
  }
  if(state.phase==='card'&&pending?.stage==='face'&&pending.card?.text)dest.append(el('p','',pending.card.text));
  byId('tvPhase').textContent='المرحلة: '+state.phase+' · الدور: '+(player?.name||'—');
  const dice=byId('tvDice');dice.replaceChildren();
  (state.dice||[]).forEach(v=>dice.append(el('div','tv-die',v)));
}
async function animateArrival(prev,next,token,generation){
  const from=prev?.position,to=next?.position;
  if(!Number.isInteger(from)||!Number.isInteger(to)||from===to){place(next.id,to,false);return;}
  const route=movementRoute(from,to,{teleport:(to===10&&next.jailed)||latestState?.presentation?.action==='card'});
  for(const pos of route){
    if(generation!==sequence)return;
    if(cinematic){await cinematic.move(next.id,pos,.24);if(generation!==sequence)return;}
    else place(next.id,pos,true);
    focusCamera(pos,1.075);sound('step');
    if(!cinematic)await new Promise(resolve=>setTimeout(resolve,240));
  }
}
async function renderRoom(room){
  if(!room||room.gameId!=='family-monopoly')return;
  const old=previousRoom;previousRoom=room;
  const generation=++sequence, state=room.state;
  clearTimeout(overviewTimer);
  if(state.phase==='roll'||state.status==='waiting')cinematic?.clearDice();
  latestState=state;
  byId('tvJoin').hidden=true;byId('tvStage').hidden=false;
  drawQr(room.code);addRoster(room);syncPieces(state);
  cinematic?.sync(state);
  syncBuildings(state);
  // A spectator may skip intermediate phases while polling. Preserve a real
  // waiting→post-roll transition so server-authoritative dice and movement still play.
  if(!old||old.code!==room.code||state.status==='waiting'){
    state.players.forEach(p=>place(p.id,p.position||0,false));renderEvent(state);return;
  }
  const moving=state.players.find(p=>old.state?.players?.some(prev=>prev.id===p.id&&prev.position!==p.position));
  if(moving){
    updateCenterScene(state,true);
    byId('tvEvent').replaceChildren(el('strong','','القطعة تتحرك…'));
    byId('tvDice').replaceChildren(...(state.dice||[]).map(v=>el('div','tv-die rolling',v)));
    if((old.state?.phase==='roll'||state.presentation?.action==='roll')&&
       Array.isArray(state.dice)&&state.dice.length===2){
      sound('dice');
      if(cinematic){await cinematic.rollDice(state.dice,old.state);if(generation!==sequence)return;
        cinematic.clearDice();}
    }
    state.players.filter(p=>p.id!==moving.id).forEach(p=>place(p.id,p.position||0,false));
    await animateArrival(old.state.players.find(p=>p.id===moving.id),moving,moving,generation);
    if(generation!==sequence)return;
    focusCamera(moving.position,1.05);
    if(state.ownership?.[moving.position])sound('purchase');
  }else{
    state.players.forEach(p=>place(p.id,p.position||0,false));
    if(state.presentation?.action==='buy'||state.presentation?.action==='build')sound('purchase');
  }
  if(generation===sequence){
    renderEvent(state);
    cinematic?.presentEvent(byId('tvCenterScene'),{phase:state.status==='finished'?'finished':byId('tvCenterScene')?.dataset.event||state.phase,index:state.pending?.index});
    if(cinematic && moving){
      // The card is readable before the view returns to a full board overview.
      overviewTimer=setTimeout(()=>{
        if(generation===sequence)cinematic?.overview();
      },2600);
    }
  }
}
byId('tvJoinForm').addEventListener('submit',async e=>{
  e.preventDefault();const code=roomCode(new FormData(e.currentTarget).get('code'));
  if(!code){byId('tvJoinError').textContent='أدخل 6 أرقام صحيحة';return;}
  const button=e.currentTarget.querySelector('button');button.disabled=true;byId('tvJoinError').textContent='';
  try{await conn.join(code,'شاشة التلفزيون');}
  catch(err){byId('tvJoinError').textContent='تعذّر الربط: '+(err.status||err.message);}
  finally{button.disabled=false;}
});
byId('tvDisconnect').addEventListener('click',()=>{clearTimeout(overviewTimer);++sequence;cinematic?.clearEvent(byId('tvCenterScene'));cinematic?.clearDice();cinematic?.overview();conn.leave();previousRoom=null;byId('tvStage').hidden=true;byId('tvJoin').hidden=false;status.textContent='غير متصل';status.classList.add('offline');});
byId('tvOverview').addEventListener('click',resetCamera);
byId('tvSound').addEventListener('click',()=>{
  voiceEnabled=!voiceEnabled;
  byId('tvSound').setAttribute('aria-pressed',String(voiceEnabled));
  byId('tvSound').textContent=voiceEnabled?'🔊 الصوت مفعّل':'🔇 تفعيل الصوت';
  if(voiceEnabled)sound('purchase');
});
boardSetup();
// The optional bundled renderer is served locally; a failed WebGL context keeps DOM play usable.
void import('../vendor/cinematic-scene.mjs').then(async module=>{
  cinematic=await module.createCinematicScene({board,cells,colors:PARTY_COLORS});
  if(cinematic){board.classList.add('cinematic-ready');if(latestState)cinematic.sync(latestState);}
}).catch(error=>{console.warn('TV cinematic renderer unavailable; retaining accessible DOM fallback',error);});
void loadBoardArt();
const initial=new URL(location.href).searchParams.get('code');if(roomCode(initial))byId('tvJoinForm').elements.code.value=initial;
void conn.resume();
window.addEventListener('resize',()=>{if(latestState){latestState.players?.forEach(p=>place(p.id,p.position||0,false));cinematic?.resize(latestState);}});
