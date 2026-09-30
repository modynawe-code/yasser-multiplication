export const STARTING_CASH=1500;
export const PASS_START_BONUS=200;

const freeze=o=>Object.freeze(o);
export const BOARD=freeze([
  freeze({type:'start',name:'البداية'}),
  freeze({type:'property',name:'الرياض',group:'red',price:160,rent:20,build:100}),
  freeze({type:'chance',name:'مفاجأة'}),
  freeze({type:'property',name:'جدة',group:'red',price:180,rent:24,build:100}),
  freeze({type:'tax',name:'رسوم',amount:100}),
  freeze({type:'property',name:'الدمام',group:'blue',price:200,rent:28,build:120}),
  freeze({type:'jail',name:'زيارة السجن'}),
  freeze({type:'property',name:'الخبر',group:'blue',price:220,rent:32,build:120}),
  freeze({type:'chance',name:'صندوق العائلة'}),
  freeze({type:'property',name:'المدينة',group:'green',price:240,rent:36,build:140}),
  freeze({type:'property',name:'مكة',group:'green',price:260,rent:40,build:140}),
  freeze({type:'tax',name:'صيانة',amount:120}),
  freeze({type:'free',name:'استراحة'}),
  freeze({type:'property',name:'الطائف',group:'orange',price:280,rent:44,build:160}),
  freeze({type:'chance',name:'مفاجأة'}),
  freeze({type:'property',name:'أبها',group:'orange',price:300,rent:48,build:160}),
  freeze({type:'gotojail',name:'إلى السجن'}),
  freeze({type:'property',name:'تبوك',group:'purple',price:320,rent:52,build:180}),
  freeze({type:'property',name:'حائل',group:'purple',price:340,rent:56,build:180}),
  freeze({type:'chance',name:'صندوق العائلة'}),
  freeze({type:'free',name:'موقف مجاني'}),
  freeze({type:'property',name:'القصيم',group:'gold',price:360,rent:60,build:200}),
  freeze({type:'tax',name:'ضريبة أملاك',amount:150}),
  freeze({type:'property',name:'العلا',group:'gold',price:400,rent:70,build:200})
]);

const CHANCE=freeze([
  freeze({text:'هدية عائلية: استلم 100',cash:100}),
  freeze({text:'مصاريف مفاجئة: ادفع 80',cash:-80}),
  freeze({text:'مكافأة: استلم 50',cash:50}),
  freeze({text:'انتقل إلى البداية واستلم 200',moveTo:0,collect:200}),
  freeze({text:'مخالفة: ادفع 50',cash:-50}),
  freeze({text:'ربحت مسابقة: استلم 120',cash:120})
]);

function clone(state){const random=state?.random;const source={...state,random:undefined};const out=globalThis.structuredClone?globalThis.structuredClone(source):JSON.parse(JSON.stringify(source));out.random=random;return out;}
function activePlayers(state){return state.players.filter(p=>!p.bankrupt);}
function nextActiveIndex(state,from){for(let i=1;i<=state.players.length;i++){const idx=(from+i)%state.players.length;if(!state.players[idx].bankrupt)return idx;}return from;}
function ownsGroup(state,ownerId,group){const indexes=BOARD.map((s,i)=>s.type==='property'&&s.group===group?i:-1).filter(i=>i>=0);return indexes.length>0&&indexes.every(i=>state.ownership[i]?.ownerId===ownerId);}
function propertyRent(state,index){const space=BOARD[index],own=state.ownership[index];if(!space||space.type!=='property'||!own)return 0;const base=space.rent*(ownsGroup(state,own.ownerId,space.group)?2:1);return Math.round(base*(1+(own.houses||0)*1.5));}
function bankruptIfNeeded(state,playerIndex,creditorId=null){const player=state.players[playerIndex];if(player.cash>=0||player.bankrupt)return;player.bankrupt=true;player.cash=0;Object.entries(state.ownership).forEach(([idx,own])=>{if(own.ownerId!==player.id)return;if(creditorId)state.ownership[idx]={ownerId:creditorId,houses:own.houses||0};else delete state.ownership[idx];});state.log=`${player.name} أفلس وخرج من الجولة.`;const alive=activePlayers(state);if(alive.length===1){state.status='finished';state.winnerId=alive[0].id;state.phase='finished';state.log=`🏆 ${alive[0].name} فاز بالجولة.`;}}
function debit(state,playerIndex,amount,creditorId=null){const p=state.players[playerIndex];p.cash-=Math.max(0,amount);if(creditorId){const c=state.players.find(x=>x.id===creditorId);if(c&&!c.bankrupt)c.cash+=Math.max(0,amount);}bankruptIfNeeded(state,playerIndex,creditorId);}
function resolveLanding(state){const p=state.players[state.turnIndex],space=BOARD[p.position];state.pending=null;
  if(space.type==='start'||space.type==='free'||space.type==='jail'){state.phase='end';state.log=`${p.name} وصل إلى ${space.name}.`;return;}
  if(space.type==='tax'){debit(state,state.turnIndex,space.amount);if(state.status==='playing'){state.phase='end';state.log=`${p.name} دفع ${space.amount}.`;}return;}
  if(space.type==='gotojail'){p.position=6;p.jailed=true;p.jailTurns=0;state.phase='end';state.log=`${p.name} دخل السجن.`;return;}
  if(space.type==='chance'){const card=CHANCE[Math.floor(state.random()*CHANCE.length)];state.lastCard=card.text;if(card.cash>0)p.cash+=card.cash;if(card.cash<0)debit(state,state.turnIndex,-card.cash);if(state.status!=='playing')return;if(Number.isInteger(card.moveTo)){p.position=card.moveTo;p.cash+=(card.collect||0);}state.phase='end';state.log=card.text;return;}
  if(space.type==='property'){
    const own=state.ownership[p.position];
    if(!own){state.phase='property';state.pending={type:'buy',index:p.position};state.log=`${space.name} متاحة للشراء بـ ${space.price}.`;return;}
    if(own.ownerId===p.id){state.phase='end';state.log=`${space.name} ملك ${p.name}.`;return;}
    const rent=propertyRent(state,p.position);debit(state,state.turnIndex,rent,own.ownerId);if(state.status==='playing'){state.phase='end';const owner=state.players.find(x=>x.id===own.ownerId);state.log=`${p.name} دفع إيجار ${rent} إلى ${owner?.name||'المالك'}.`;}
  }
}

export function createMonopolyState(players,{random=Math.random}={}){
  if(!Array.isArray(players)||players.length<2||players.length>4)throw new TypeError('players must contain 2-4 players');
  const ids=new Set();const normalized=players.map((p,i)=>{const id=String(p.id||`p${i+1}`);if(ids.has(id))throw new TypeError('duplicate player id');ids.add(id);return{id,name:String(p.name||`لاعب ${i+1}`),cash:STARTING_CASH,position:0,jailed:false,jailTurns:0,bankrupt:false};});
  return {version:1,startedAt:new Date().toISOString(),status:'playing',phase:'roll',turnIndex:0,players:normalized,ownership:{},dice:null,doubles:0,winnerId:null,pending:null,lastCard:'',log:`دور ${normalized[0].name}. ارمِ النرد.`,random};
}
export function snapshotState(state){const out=clone({...state,random:undefined});delete out.random;return out;}
export function restoreMonopolyState(raw,{random=Math.random}={}){const state=clone(raw);if(!state||state.version!==1||!Array.isArray(state.players))throw new TypeError('invalid state');state.random=random;return state;}
export function rollDice(state,forced=null){if(state.status!=='playing'||state.phase!=='roll')return state;const next=clone(state);next.random=state.random||Math.random;const p=next.players[next.turnIndex];let d1,d2;if(forced){[d1,d2]=forced;}else{d1=1+Math.floor(next.random()*6);d2=1+Math.floor(next.random()*6);}next.dice=[d1,d2];
  if(p.jailed){if(d1===d2){p.jailed=false;p.jailTurns=0;}else{p.jailTurns++;if(p.jailTurns<3){next.phase='end';next.log=`${p.name} بقي في السجن.`;return next;}debit(next,next.turnIndex,50);if(next.status!=='playing')return next;p.jailed=false;p.jailTurns=0;}}
  const old=p.position;p.position=(p.position+d1+d2)%BOARD.length;if(old+d1+d2>=BOARD.length)p.cash+=PASS_START_BONUS;resolveLanding(next);return next;}
export function payJail(state){if(state.status!=='playing'||state.phase!=='roll')return state;const next=clone(state);next.random=state.random||Math.random;const p=next.players[next.turnIndex];if(!p.jailed||p.cash<50)return state;debit(next,next.turnIndex,50);if(next.status==='playing'){p.jailed=false;p.jailTurns=0;next.log=`${p.name} دفع 50 وخرج من السجن.`;}return next;}
export function buyProperty(state){if(state.status!=='playing'||state.phase!=='property'||state.pending?.type!=='buy')return state;const next=clone(state);next.random=state.random||Math.random;const p=next.players[next.turnIndex],index=next.pending.index,space=BOARD[index];if(!space||space.type!=='property'||next.ownership[index]||p.cash<space.price)return state;p.cash-=space.price;next.ownership[index]={ownerId:p.id,houses:0};next.phase='end';next.pending=null;next.log=`${p.name} اشترى ${space.name}.`;return next;}
export function skipProperty(state){if(state.status!=='playing'||state.phase!=='property')return state;const next=clone(state);next.random=state.random||Math.random;next.phase='end';next.pending=null;next.log='تم تجاوز الشراء.';return next;}
export function buildHouse(state,index){if(state.status!=='playing'||state.phase!=='end')return state;const next=clone(state);next.random=state.random||Math.random;const p=next.players[next.turnIndex],space=BOARD[index],own=next.ownership[index];if(!space||space.type!=='property'||!own||own.ownerId!==p.id||!ownsGroup(next,p.id,space.group)||(own.houses||0)>=4||p.cash<space.build)return state;p.cash-=space.build;own.houses=(own.houses||0)+1;next.log=`${p.name} طوّر ${space.name} — مستوى ${own.houses}.`;return next;}
export function endTurn(state){if(state.status!=='playing'||state.phase!=='end')return state;const next=clone(state);next.random=state.random||Math.random;next.turnIndex=nextActiveIndex(next,next.turnIndex);next.phase='roll';next.dice=null;next.pending=null;next.lastCard='';next.log=`دور ${next.players[next.turnIndex].name}. ارمِ النرد.`;return next;}
export function rentFor(state,index){return propertyRent(state,index);}
export function canBuild(state,index){const p=state.players[state.turnIndex],space=BOARD[index],own=state.ownership[index];return Boolean(state.status==='playing'&&state.phase==='end'&&space?.type==='property'&&own?.ownerId===p?.id&&ownsGroup(state,p.id,space.group)&&(own.houses||0)<4&&p.cash>=space.build);}
