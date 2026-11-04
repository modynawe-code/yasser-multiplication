import {BOARD,PARTY_COLORS,partyActions,partyPortfolioActions,publicJoinUrl,makePartyConnection,roomCode,demoPlayerAction} from '../shared.js';

const get=id=>document.getElementById(id);
let current=null,pending=false,demoConnection=null,demoBusy=false,demoAttemptedVersion=-1,demoTimer=null;
const demoButton=get('addDemoPlayer');
const demoAllowed=location.hostname==='monopoly-tv-staging.modynawe.workers.dev';
if(demoAllowed)demoButton.hidden=false;
const connection=makePartyConnection({role:'player',onRoom:render,onStatus:(value,error)=>{
  get('remoteStatus').textContent=value==='connected'?'متصل':'جارٍ استعادة الاتصال'+(error?.status?' ('+error.status+')':'');
  get('remoteStatus').classList.toggle('offline',value!=='connected');
}});
function element(tag,cls,text){
  const node=document.createElement(tag);if(cls)node.className=cls;
  if(text!==undefined)node.textContent=String(text);return node;
}
function setStatus(text){get('remoteJoinError').textContent=text;}
async function sendAction(type,payload={}){
  if(pending)return;
  pending=true;
  get('remoteActionError').textContent='';
  get('remoteActions').querySelectorAll('button').forEach(button=>button.disabled=true);
  get('remotePortfolio').querySelectorAll('button').forEach(button=>button.disabled=true);
  get('remoteTurnHint').textContent='جارٍ إرسال الحركة…';
  try{
    if(type==='roll')sound('dice');
    await connection.action(type,payload);
    get('remoteJoinError').textContent='';
    if(type==='buy'||type==='build')sound('purchase');
    else if(type!=='roll')sound('tap');
  }catch(error){
    get('remoteActionError').textContent=error.status===409?
      'تغيرت حالة الغرفة. تحقق من دورك وحاول مجددًا.':
      'تعذّر تنفيذ الحركة: '+(error.message||'اتصال غير متاح');
    sound('error');
  }finally{
    pending=false;
    if(connection.room)render(connection.room);
  }
}
let soundContext=null;
const diceRecordings=[1,2,3].map(index=>new URL('../../src/modules/games/monopoly/assets/audio/dice-roll-'+index+'.mp3',import.meta.url).href);
function sound(type){
  if(type==='dice'){
    const clip=new Audio(diceRecordings[Math.floor(Math.random()*diceRecordings.length)]);
    clip.volume=.5;void clip.play().catch(()=>{});
    return;
  }
  try{
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return;
    soundContext||=new Audio();
    if(soundContext.state==='suspended')void soundContext.resume();
    const oscillator=soundContext.createOscillator(),gain=soundContext.createGain(),now=soundContext.currentTime;
    oscillator.type=type==='dice'?'triangle':'sine';
    oscillator.frequency.setValueAtTime(type==='error'?190:type==='purchase'?680:440,now);
    oscillator.frequency.exponentialRampToValueAtTime(type==='dice'?145:type==='error'?130:880,now+.19);
    gain.gain.setValueAtTime(.06,now);gain.gain.exponentialRampToValueAtTime(.001,now+.22);
    oscillator.connect(gain).connect(soundContext.destination);oscillator.start(now);oscillator.stop(now+.24);
  }catch{}
}
function actionButton(item){
  const button=element('button','party-btn'+(['skip','pass-auction','trade-reject'].includes(item.type)?' secondary':''),item.label);
  button.type='button';button.dataset.action=item.type;button.disabled=pending;
  if(item.type==='roll'){
    let start=null,suppressUntil=0;
    button.classList.add('remote-dice-gesture');
    button.setAttribute('aria-label','ارمِ النرد: اضغط أو اسحب للأعلى');
    button.addEventListener('pointerdown',event=>{
      if(button.disabled)return;
      start={y:event.clientY,id:event.pointerId};
      button.setPointerCapture?.(event.pointerId);
    });
    button.addEventListener('pointerup',event=>{
      if(!start||start.id!==event.pointerId)return;
      const movement=start.y-event.clientY;start=null;
      if(movement>35){
        suppressUntil=performance.now()+700;
        button.classList.add('remote-dice-thrown');
        setTimeout(()=>button.classList.remove('remote-dice-thrown'),350);
        void sendAction('roll');
      }
    });
    button.addEventListener('pointercancel',()=>{start=null;});
    button.addEventListener('click',event=>{
      if(performance.now()<suppressUntil){event.preventDefault();return;}
      void sendAction('roll');
    });
  }else button.addEventListener('click',()=>{void sendAction(item.type,item.payload||{});});
  return button;
}
function tradeForm(index,state){
  const target=get('remoteTradePanel');target.replaceChildren();target.hidden=false;
  const heading=element('h3','','عرض تبادل: '+BOARD[index].name),form=element('form','party-form');
  const label=(text,control)=>{const l=element('label','',text);l.append(control);return l;};
  const players=state.players.filter(p=>p.id!==connection.session?.playerId&&!p.bankrupt);
  const select=element('select');select.required=true;select.name='targetId';
  for(const player of players){const o=element('option','',player.name);o.value=player.id;select.append(o);}
  const cashInput=name=>{const input=element('input');input.type='number';input.name=name;input.min='0';input.max='999999';input.step='1';input.value='0';input.inputMode='numeric';input.required=true;return input;};
  form.append(label('تبادل الأرض مع',select),label('ريالات أدفعها',cashInput('offerCash')),label('ريالات أستلمها',cashInput('requestCash')));
  const submit=element('button','party-btn','إرسال عرض التبادل');submit.type='submit';
  const cancel=element('button','party-btn secondary','إلغاء');cancel.type='button';cancel.addEventListener('click',()=>{target.hidden=true;});
  form.append(submit,cancel);
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const values=new FormData(form),offerCash=Number(values.get('offerCash')),requestCash=Number(values.get('requestCash'));
    const maxCash=state.players[state.turnIndex]?.cash||0;
    if(!Number.isSafeInteger(offerCash)||offerCash<0||offerCash>maxCash||!Number.isSafeInteger(requestCash)||requestCash<0||
       requestCash>state.players.find(p=>p.id===select.value)?.cash){get('remoteTurnDetails').textContent='تأكد من المبالغ وأرصدة اللاعبين';return;}
    target.hidden=true;void sendAction('trade',{index,targetId:select.value,offerCash,requestCash});
  });
  target.append(heading,form);target.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function renderPortfolio(state,self){
  const panel=get('remotePropertyPanel'),dest=get('remotePortfolio');
  dest.replaceChildren();
  const owns=Object.entries(state.ownership||{}).filter(([index,own])=>own?.ownerId===self&&BOARD[Number(index)]);
  panel.hidden=state.status!=='playing'&&owns.length===0;
  if(panel.hidden)return;
  const permissions=partyPortfolioActions(state,self);
  if(!owns.length){dest.append(element('p','party-hint','ما عندك أراضٍ بعد.'));return;}
  for(const [key,ownership] of owns){
    const index=Number(key),tile=BOARD[index],item=element('article','remote-estate');
    const info=element('div','remote-estate-info');
    info.append(element('strong','',tile.name),element('small','','المجموعة: '+(tile.group||tile.type)+' · '+(ownership.mortgaged?'مرهونة · لا إيجار':ownership.hotel?'فندق':(ownership.houses||0)+' بيوت')));
    const actions=element('div','remote-estate-actions');
    permissions.filter(a=>a.index===index).forEach(action=>{
      const button=element('button','party-btn secondary',action.label);
      button.type='button';button.disabled=pending;
      button.addEventListener('click',()=>action.type==='trade'?tradeForm(index,state):void sendAction(action.type,action.payload));
      actions.append(button);
    });
    item.append(info,actions);dest.append(item);
  }
}

function render(room){
  if(!room||room.gameId!=='family-monopoly')return;
  current=room;
  const state=room.state,self=connection.session?.playerId;
  get('remoteJoin').hidden=true;get('remoteStage').hidden=false;get('remoteLeave').hidden=false;
  get('remoteCode').textContent=room.code;
  const tv=new URL('../tv/',location.href);tv.searchParams.set('code',room.code);
  get('tvLink').href=tv.toString();
  const roster=get('remotePlayers');roster.replaceChildren();
  const myPlayer=state.players.find(p=>p.id===self);
  const isMyTurn=state.status==='playing'&&state.players[state.turnIndex]?.id===self;
  state.players.forEach((p,i)=>{
    const item=element('div','remote-player'+(p.id===self?' me':''));
    item.style.setProperty('--player',PARTY_COLORS[i%PARTY_COLORS.length]);
    item.append(element('strong','',p.name+(p.id===self?' (أنت)':'')),element('span','',p.cash===undefined?'جاهز':p.cash+' ريال'));
    roster.append(item);
  });
  renderPortfolio(state,self);
  const actions=partyActions(state,self);
  const dest=get('remoteActions');dest.replaceChildren();
  const headline=get('remoteTurnTitle'),description=get('remoteTurnDetails'),hint=get('remoteTurnHint');
  if(state.status==='waiting'){
    hint.textContent='الاستعداد للعبة';
    headline.textContent='بانتظار اللاعبين';
    description.textContent='عدد اللاعبين: '+state.players.length+' من 4. يبدأ المضيف الجولة عند وجود لاعبين.';
  }else if(state.status==='finished'){
    hint.textContent='انتهت الجولة';headline.textContent='🎉 انتهت اللعبة';
    description.textContent='الفائز: '+(state.players.find(p=>p.id===state.winnerId)?.name||'—');
  }else{
    hint.textContent=isMyTurn?'✅ دورك الآن':'⏳ تابع شاشة التلفزيون';
    headline.textContent=isMyTurn?'يلا، دورك!':'دور '+(state.players[state.turnIndex]?.name||'اللاعب');
    description.textContent=isMyTurn?'اختر الإجراء المناسب من الأزرار':'انتظر دورك. الأرض والنرد والحدث ينعرضون على التلفزيون.';
    if(state.phase==='trade'&&state.tradeOffer?.targetId===self)description.textContent='وصلك عرض تبادل، اختر القبول أو الرفض.';
    if(state.phase==='auction'&&state.players[state.auction?.nextIndex]?.id===self)description.textContent='دورك في المزاد.';
  }
  actions.forEach(action=>dest.append(actionButton(action)));
  if(!actions.length&&state.status==='waiting')dest.append(element('p','party-hint','لازم ينضم لاعب ثاني قبل بدء اللعبة.'));
  if(!actions.length&&state.status==='playing')dest.append(element('p','party-hint','لا توجد حركة مطلوبة منك الآن.'));
  if(state.phase==='trade'&&state.tradeOffer?.targetId===self){
    const proposal=state.tradeOffer;
    description.textContent='وصلك عرض على '+(BOARD[proposal.index]?.name||'أرض')+
      ' · تحصل على '+proposal.offerCash+' ريال وتدفع '+proposal.requestCash+' ريال. اختر قرارك.';
  }
  get('remoteGameLog').textContent=state.log||'المباراة جاهزة';
  const landed=state.pending?.index;
  const space=BOARD[landed]||BOARD[myPlayer?.position];
  get('remoteCurrentProperty').textContent=space?'الخانة: '+space.name+(space.price?' · السعر '+space.price+' ريال':''):'';
}
function queueDemoAction(room){
  if(!demoConnection||demoBusy||room?.status!=='playing')return;
  const playerId=demoConnection.session?.playerId,action=demoPlayerAction(room.state,playerId);
  if(!action||room.version===demoAttemptedVersion)return;
  demoAttemptedVersion=room.version;
  clearTimeout(demoTimer);
  demoTimer=setTimeout(async()=>{
    const latest=demoConnection?.room;
    if(!latest||latest.version!==room.version||demoBusy)return;
    const next=demoPlayerAction(latest.state,demoConnection.session?.playerId);
    if(!next)return;
    demoBusy=true;
    try{await demoConnection.action(next.type,next.payload||{});}
    catch(error){if(error.status!==409)get('remoteActionError').textContent='تعذّر تحريك اللاعب التجريبي: '+(error.message||'اتصال غير متاح');}
    finally{demoBusy=false;if(demoConnection?.room)queueDemoAction(demoConnection.room);}
  },650);
}
demoButton.addEventListener('click',async()=>{
  if(!demoAllowed||!current||demoConnection)return;
  demoButton.disabled=true;demoButton.textContent='جارٍ إضافة اللاعب التجريبي…';
  const values=new Map();
  const isolatedStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
  demoConnection=makePartyConnection({role:'player',storage:isolatedStorage,
    onRoom:room=>{render(room);queueDemoAction(room);}});
  try{
    await demoConnection.join(current.code,'لاعب تجريبي');
    demoButton.textContent='اللاعب التجريبي يلعب تلقائيًا';
  }catch(error){
    demoConnection.leave();demoConnection=null;demoButton.disabled=false;
    demoButton.textContent='إضافة لاعب كمبيوتر للتجربة';
    get('remoteActionError').textContent='تعذّرت إضافة اللاعب التجريبي: '+(error.status||error.message||'اتصال غير متاح');
  }
});
get('remoteForm').addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.currentTarget,submitter=event.submitter;
  const mode=submitter?.value||'create';
  const values=new FormData(form),name=String(values.get('name')||'').trim().slice(0,35);
  const code=roomCode(values.get('code'));
  if(!name){setStatus('اكتب اسم اللاعب أولًا');return;}
  if(mode==='join'&&!code){setStatus('لازم رمز الغرفة المكون من 6 أرقام');return;}
  const buttons=Array.from(form.querySelectorAll('button'));buttons.forEach(b=>b.disabled=true);setStatus('');
  try{if(mode==='create')await connection.create(name);else await connection.join(code,name);}
  catch(err){setStatus('تعذّر الدخول: '+(err.status||err.message));}
  finally{buttons.forEach(b=>b.disabled=false);}
});
get('remoteLeave').addEventListener('click',()=>{
  clearTimeout(demoTimer);demoConnection?.leave();demoConnection=null;demoAttemptedVersion=-1;demoBusy=false;
  demoButton.disabled=false;demoButton.textContent='إضافة لاعب كمبيوتر للتجربة';
  connection.leave();current=null;get('remoteJoin').hidden=false;get('remoteStage').hidden=true;get('remoteLeave').hidden=true;
  get('remoteStatus').textContent='غير متصل';get('remoteStatus').classList.add('offline');
});
get('copyJoin').addEventListener('click',async()=>{
  if(!current)return;
  try{await navigator.clipboard.writeText(publicJoinUrl(current.code));get('copyJoin').textContent='تم نسخ الرابط';}
  catch{get('remoteGameLog').textContent='انسخ هذا الرابط: '+publicJoinUrl(current.code);}
});
const code=roomCode(new URL(location.href).searchParams.get('code'));if(code)get('remoteForm').elements.code.value=code;
void connection.resume();
