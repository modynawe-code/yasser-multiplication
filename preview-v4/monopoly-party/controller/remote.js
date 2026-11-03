import {BOARD,PARTY_COLORS,partyActions,publicJoinUrl,makePartyConnection,roomCode} from '../shared.js';

const get=id=>document.getElementById(id);
let current=null,pending=false;
const connection=makePartyConnection({role:'player',onRoom:render,onStatus:(value,error)=>{
  get('remoteStatus').textContent=value==='connected'?'متصل':'جارٍ استعادة الاتصال'+(error?.status?' ('+error.status+')':'');
  get('remoteStatus').classList.toggle('offline',value!=='connected');
}});
function element(tag,cls,text){
  const node=document.createElement(tag);if(cls)node.className=cls;
  if(text!==undefined)node.textContent=String(text);return node;
}
function setStatus(text){get('remoteJoinError').textContent=text;}
function actionButton(item){
  const button=element('button','party-btn'+(item.type==='skip'||item.type==='pass-auction'||item.type==='trade-reject'?' secondary':''),item.label);
  button.type='button';button.dataset.action=item.type;button.disabled=pending;
  button.addEventListener('click',async()=>{
    if(pending)return;
    pending=true;button.disabled=true;get('remoteTurnHint').textContent='جارٍ إرسال الحركة…';
    try{await connection.action(item.type,item.payload||{});}
    catch(error){
      get('remoteTurnDetails').textContent=error.status===409?'حدث تغيير في الغرفة، تم تحديث الحالة. حاول مجددًا إذا كان دورك.':'تعذّر تنفيذ الحركة: '+(error.message||'اتصال غير متاح');
    }finally{pending=false;if(connection.room)render(connection.room);}
  });
  return button;
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
  get('remoteGameLog').textContent=state.log||'المباراة جاهزة';
  const landed=state.pending?.index;
  const space=BOARD[landed]||BOARD[myPlayer?.position];
  get('remoteCurrentProperty').textContent=space?'الخانة: '+space.name+(space.price?' · السعر '+space.price+' ريال':''):'';
}
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
