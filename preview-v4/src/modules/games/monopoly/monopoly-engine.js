export const STARTING_CASH=1500;
export const PASS_START_BONUS=200;

const freeze=o=>Object.freeze(o);
const property=(name,group,price,rent,build)=>freeze({type:'property',name,group,price,rent,build});
export const BOARD=freeze([
  freeze({type:'start',name:'البداية'}),
  property('رفحاء','brown',60,2,50),freeze({type:'chest',name:'صندوق الجماعة'}),property('طريف','brown',60,4,50),
  freeze({type:'tax',name:'ضريبة الدخل',amount:200}),freeze({type:'railroad',name:'محطة الشمال',price:200}),
  property('عرعر','lightblue',100,6,50),freeze({type:'chance',name:'مفاجأة'}),property('سكاكا','lightblue',100,6,50),property('دومة الجندل','lightblue',120,8,50),
  freeze({type:'jail',name:'زيارة السجن'}),property('تبوك','pink',140,10,100),freeze({type:'utility',name:'شركة الكهرباء',price:150}),property('حائل','pink',140,10,100),property('بريدة','pink',160,12,100),
  freeze({type:'railroad',name:'محطة المدينة',price:200}),property('المدينة','orange',180,14,100),freeze({type:'chest',name:'صندوق الجماعة'}),property('ينبع','orange',180,14,100),property('جدة','orange',200,16,100),
  freeze({type:'free',name:'استراحة'}),property('الطائف','red',220,18,150),freeze({type:'chance',name:'مفاجأة'}),property('مكة','red',220,18,150),property('أبها','red',240,20,150),
  freeze({type:'railroad',name:'محطة الجنوب',price:200}),property('جازان','yellow',260,22,150),property('نجران','yellow',260,22,150),freeze({type:'utility',name:'شركة المياه',price:150}),property('خميس مشيط','yellow',280,24,150),
  freeze({type:'gotojail',name:'إلى السجن'}),property('الخبر','green',300,26,200),property('الدمام','green',300,26,200),freeze({type:'chest',name:'صندوق الجماعة'}),property('الجبيل','green',320,28,200),
  freeze({type:'railroad',name:'محطة الشرق',price:200}),freeze({type:'chance',name:'مفاجأة'}),property('الرياض','darkblue',350,35,200),freeze({type:'tax',name:'ضريبة الرفاهية',amount:100}),property('نيوم','darkblue',400,50,200)
]);

const CHANCE=freeze([
  freeze({text:'مكافأة عائلية: استلم 100',cash:100}),freeze({text:'مصاريف مفاجئة: ادفع 80',cash:-80}),
  freeze({text:'ربحت مسابقة: استلم 150',cash:150}),freeze({text:'انتقل إلى البداية واستلم 200',moveTo:0,collect:200}),
  freeze({text:'ادفع غرامة 50',cash:-50}),freeze({text:'اذهب إلى السجن',moveTo:10,jail:true})
]);
const CHEST=freeze([
  freeze({text:'مساعدة من الجماعة: استلم 100',cash:100}),freeze({text:'هدية لأحد أفراد العائلة: ادفع 50',cash:-50}),
  freeze({text:'مكافأة على التعاون: استلم 75',cash:75}),freeze({text:'رسوم صيانة مشتركة: ادفع 75',cash:-75}),
  freeze({text:'ارجع إلى البداية واستلم 200',moveTo:0,collect:200}),freeze({text:'تجاوزت التحدي العائلي: استلم 120',cash:120})
]);

function clone(state){const random=state?.random;const source={...state,random:undefined};const out=globalThis.structuredClone?globalThis.structuredClone(source):JSON.parse(JSON.stringify(source));out.random=random;return out;}
function activePlayers(state){return state.players.filter(p=>!p.bankrupt);}
function nextActiveIndex(state,from){for(let i=1;i<=state.players.length;i++){const idx=(from+i)%state.players.length;if(!state.players[idx].bankrupt)return idx;}return from;}
function ownsGroup(state,ownerId,group){const indexes=BOARD.map((s,i)=>s.type==='property'&&s.group===group?i:-1).filter(i=>i>=0);return indexes.length>0&&indexes.every(i=>state.ownership[i]?.ownerId===ownerId);}
function propertyRent(state,index){const space=BOARD[index],own=state.ownership[index];if(!space||!own)return 0;
  if(space.type==='property'){const base=space.rent*(ownsGroup(state,own.ownerId,space.group)?2:1);return Math.round(base*(1+(own.houses||0)*1.5));}
  if(space.type==='railroad'){const count=Object.entries(state.ownership).filter(([i,o])=>BOARD[Number(i)].type==='railroad'&&o.ownerId===own.ownerId).length;return 25*(2**Math.max(0,count-1));}
  if(space.type==='utility'){const count=Object.entries(state.ownership).filter(([i,o])=>BOARD[Number(i)].type==='utility'&&o.ownerId===own.ownerId).length;return(state.dice?.reduce((a,b)=>a+b,7)||7)*(count>1?10:4);}
  return 0;
}
function bankruptIfNeeded(state,playerIndex,creditorId=null){const player=state.players[playerIndex];if(player.cash>=0||player.bankrupt)return;player.bankrupt=true;player.cash=0;Object.entries(state.ownership).forEach(([idx,own])=>{if(own.ownerId!==player.id)return;if(creditorId)state.ownership[idx]={ownerId:creditorId,houses:own.houses||0};else delete state.ownership[idx];});state.log=`${player.name} أفلس وخرج من الجولة.`;const alive=activePlayers(state);if(alive.length===1){state.status='finished';state.winnerId=alive[0].id;state.phase='finished';state.log=`🏆 ${alive[0].name} فاز بالجولة.`;}}
function debit(state,playerIndex,amount,creditorId=null){const p=state.players[playerIndex];p.cash-=Math.max(0,amount);if(creditorId){const c=state.players.find(x=>x.id===creditorId);if(c&&!c.bankrupt)c.cash+=Math.max(0,amount);}bankruptIfNeeded(state,playerIndex,creditorId);}
function resolveLanding(state){const p=state.players[state.turnIndex],space=BOARD[p.position];state.pending=null;
  if(space.type==='start'||space.type==='free'||space.type==='jail'){state.phase='end';state.log=`${p.name} وصل إلى ${space.name}.`;return;}
  if(space.type==='tax'){debit(state,state.turnIndex,space.amount);if(state.status==='playing'){state.phase='end';state.log=`${p.name} دفع ${space.amount}.`;}return;}
  if(space.type==='gotojail'){p.position=10;p.jailed=true;p.jailTurns=0;state.phase='end';state.log=`${p.name} دخل السجن.`;return;}
  if(space.type==='chance'||space.type==='chest'){const deck=space.type==='chest'?CHEST:CHANCE;const card=deck[Math.floor(state.random()*deck.length)];state.pending={type:'card',card:{...card}};state.phase='card';state.log=`${p.name} يسحب بطاقة ${space.name}.`;return;}
  if(space.type==='property'||space.type==='railroad'||space.type==='utility'){
    const own=state.ownership[p.position];if(!own){state.phase='property';state.pending={type:'buy',index:p.position};state.log=`${space.name} متاحة للشراء بـ ${space.price}.`;return;}
    if(own.ownerId===p.id){state.phase='end';state.log=`${space.name} ملك ${p.name}.`;return;}
    const rent=propertyRent(state,p.position);debit(state,state.turnIndex,rent,own.ownerId);if(state.status==='playing'){state.phase='end';const owner=state.players.find(x=>x.id===own.ownerId);state.log=`${p.name} دفع إيجار ${rent} إلى ${owner?.name||'المالك'}.`;}
  }
}

export function createMonopolyState(players,{random=Math.random}={}){
  if(!Array.isArray(players)||players.length<2||players.length>4)throw new TypeError('players must contain 2-4 players');
  const ids=new Set();const normalized=players.map((p,i)=>{const id=String(p.id||`p${i+1}`);if(ids.has(id))throw new TypeError('duplicate player id');ids.add(id);return{id,name:String(p.name||`لاعب ${i+1}`),cash:STARTING_CASH,position:0,jailed:false,jailTurns:0,bankrupt:false};});
  return {version:2,startedAt:new Date().toISOString(),status:'playing',phase:'roll',turnIndex:0,players:normalized,ownership:{},dice:null,doubles:0,winnerId:null,pending:null,lastCard:'',log:`دور ${normalized[0].name}. ارمِ النرد.`,random};
}
export function snapshotState(state){const out=clone({...state,random:undefined});delete out.random;return out;}
export function restoreMonopolyState(raw,{random=Math.random}={}){const state=clone(raw);if(!state||(state.version!==1&&state.version!==2)||!Array.isArray(state.players))throw new TypeError('invalid state');state.random=random;return state;}
export function rollDice(state,forced=null){if(state.status!=='playing'||state.phase!=='roll')return state;const next=clone(state);next.random=state.random||Math.random;const p=next.players[next.turnIndex];let d1,d2;if(forced){[d1,d2]=forced;}else{d1=1+Math.floor(next.random()*6);d2=1+Math.floor(next.random()*6);}next.dice=[d1,d2];
  if(p.jailed){if(d1===d2){p.jailed=false;p.jailTurns=0;}else{p.jailTurns++;if(p.jailTurns<3){next.phase='end';next.log=`${p.name} بقي في السجن.`;return next;}debit(next,next.turnIndex,50);if(next.status!=='playing')return next;p.jailed=false;p.jailTurns=0;}}
  const old=p.position;p.position=(p.position+d1+d2)%BOARD.length;if(old+d1+d2>=BOARD.length)p.cash+=PASS_START_BONUS;resolveLanding(next);return next;}
export function payJail(state){if(state.status!=='playing'||state.phase!=='roll')return state;const next=clone(state);next.random=state.random||Math.random;const p=next.players[next.turnIndex];if(!p.jailed||p.cash<50)return state;debit(next,next.turnIndex,50);if(next.status==='playing'){p.jailed=false;p.jailTurns=0;next.log=`${p.name} دفع 50 وخرج من السجن.`;}return next;}
export function buyProperty(state){if(state.status!=='playing'||state.phase!=='property'||state.pending?.type!=='buy')return state;const next=clone(state);next.random=state.random||Math.random;const p=next.players[next.turnIndex],index=next.pending.index,space=BOARD[index];if(!space||!['property','railroad','utility'].includes(space.type)||next.ownership[index]||p.cash<space.price)return state;p.cash-=space.price;next.ownership[index]={ownerId:p.id,houses:0};next.phase='end';next.pending=null;next.log=`${p.name} اشترى ${space.name}.`;return next;}
export function skipProperty(state){if(state.status!=='playing'||state.phase!=='property')return state;const next=clone(state);next.random=state.random||Math.random;const index=next.pending?.index;next.phase='auction';next.pending={type:'auction',index};next.auction={index,bid:0,bidderId:null,nextIndex:nextActiveIndex(next,next.turnIndex),passes:0};next.log=`بدأ مزاد ${BOARD[index]?.name||'العقار'}؛ تبدأ المزايدة من اللاعب التالي.`;return next;}
function finishAuction(state){const auction=state.auction,index=auction?.index,winner=state.players.find(p=>p.id===auction?.bidderId);if(winner&&auction.bid>0){winner.cash-=auction.bid;state.ownership[index]={ownerId:winner.id,houses:0};state.log=`${winner.name} رسا عليه مزاد ${BOARD[index].name} بـ ${auction.bid}.`;}else state.log=`انتهى المزاد دون شراء ${BOARD[index]?.name||'العقار'}.`;state.phase='end';state.pending=null;state.auction=null;}
export function bidAuction(state,amount=10){if(state.status!=='playing'||state.phase!=='auction'||!state.auction)return state;const next=clone(state);next.random=state.random||Math.random;const a=next.auction,p=next.players[a.nextIndex],bid=Math.max(a.bid+10,Number(amount)||0);if(!p||p.bankrupt||p.cash<bid)return state;a.bid=bid;a.bidderId=p.id;a.passes=0;a.nextIndex=nextActiveIndex(next,a.nextIndex);next.log=`${p.name} زايد إلى ${bid}.`;return next;}
export function passAuction(state){if(state.status!=='playing'||state.phase!=='auction'||!state.auction)return state;const next=clone(state);next.random=state.random||Math.random;next.auction.passes++;next.auction.nextIndex=nextActiveIndex(next,next.auction.nextIndex);if(next.auction.passes>=activePlayers(next).length)finishAuction(next);else next.log=`${next.players[next.auction.nextIndex].name} يتخذ قراره في المزاد.`;return next;}
export function drawCard(state){if(state.status!=='playing'||state.phase!=='card'||state.pending?.type!=='card')return state;const next=clone(state);next.random=state.random||Math.random;const {card}=next.pending,p=next.players[next.turnIndex];next.lastCard=card.text;if(card.cash>0)p.cash+=card.cash;if(card.cash<0)debit(next,next.turnIndex,-card.cash);if(next.status!=='playing')return next;if(Number.isInteger(card.moveTo)){if(card.jail){p.position=10;p.jailed=true;p.jailTurns=0;}else{if(p.position>card.moveTo)p.cash+=(card.collect||0);p.position=card.moveTo;}}next.pending=null;next.phase='end';next.log=card.text;return next;}
export function sellProperty(state,index){if(state.status!=='playing'||state.phase!=='end')return state;const next=clone(state);next.random=state.random||Math.random;const p=next.players[next.turnIndex],own=next.ownership[index],space=BOARD[index];if(!own||own.ownerId!==p.id||!space||!['property','railroad','utility'].includes(space.type))return state;const houseCredit=(own.houses||0)*Math.floor((space.build||0)/2),saleCredit=Math.floor(space.price/2);p.cash+=houseCredit+saleCredit;delete next.ownership[index];next.log=`${p.name} باع ${space.name} واستلم ${saleCredit+houseCredit}.`;return next;}
export function tradeProperty(state,index,targetId,offerCash=0,requestCash=0){if(state.status!=='playing'||state.phase!=='end')return state;const current=state.players[state.turnIndex],target=state.players.find(p=>p.id===String(targetId)),own=state.ownership[index],space=BOARD[index],give=Math.max(0,Math.floor(Number(offerCash)||0)),receive=Math.max(0,Math.floor(Number(requestCash)||0));if(!current||!target||target.id===current.id||target.bankrupt||!own||own.ownerId!==current.id||!space||!['property','railroad','utility'].includes(space.type)||current.cash<give||target.cash<receive)return state;const next=clone(state);next.random=state.random||Math.random;next.players[next.turnIndex].cash+=receive-give;const other=next.players.find(p=>p.id===target.id);other.cash+=give-receive;next.ownership[index]={...next.ownership[index],ownerId:target.id};next.log=`تم تبادل ${space.name} بين ${current.name} و${target.name}.`;return next;}
export function buildHouse(state,index){if(state.status!=='playing'||state.phase!=='end')return state;const next=clone(state);next.random=state.random||Math.random;const p=next.players[next.turnIndex],space=BOARD[index],own=next.ownership[index];if(!space||space.type!=='property'||!own||own.ownerId!==p.id||!ownsGroup(next,p.id,space.group)||(own.houses||0)>=4||p.cash<space.build)return state;p.cash-=space.build;own.houses=(own.houses||0)+1;next.log=`${p.name} طوّر ${space.name} — مستوى ${own.houses}.`;return next;}
export function endTurn(state){if(state.status!=='playing'||state.phase!=='end')return state;const next=clone(state);next.random=state.random||Math.random;next.turnIndex=nextActiveIndex(next,next.turnIndex);next.phase='roll';next.dice=null;next.pending=null;next.lastCard='';next.log=`دور ${next.players[next.turnIndex].name}. ارمِ النرد.`;return next;}
export function rentFor(state,index){return propertyRent(state,index);}
export function canBuild(state,index){const p=state.players[state.turnIndex],space=BOARD[index],own=state.ownership[index];return Boolean(state.status==='playing'&&state.phase==='end'&&space?.type==='property'&&own?.ownerId===p?.id&&ownsGroup(state,p.id,space.group)&&(own.houses||0)<4&&p.cash>=space.build);}
