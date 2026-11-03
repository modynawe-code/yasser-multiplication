import { BOARD } from '../src/modules/games/monopoly/monopoly-engine.js';
import { createGameRoomClient } from '../src/modules/games/online/game-room-client.js';

export { BOARD };
export const PARTY_GAME_ID='family-monopoly';
export const PARTY_COLORS=Object.freeze(['#18a775','#fa9e53','#9a8efa','#ed6799']);
export const GROUP_COLORS=Object.freeze({brown:'#946744',lightblue:'#75cbd7',pink:'#d67fa8',orange:'#e49b49',red:'#cf5f5f',yellow:'#dcbd43',green:'#58ae7c',darkblue:'#5d7ad8'});

export function tileCoordinates(index){
  if(!Number.isInteger(index)||index<0||index>=40)throw new RangeError('tile index 0-39 required');
  if(index<=10)return {row:10,col:10-index};
  if(index<=20)return {row:20-index,col:0};
  if(index<=30)return {row:0,col:index-20};
  return {row:index-30,col:10};
}
export function roomCode(value){const code=String(value||'').replace(/\D/g,'');return code.length===6?code:null;}
export function currentPlayer(state){return state?.players?.[state.turnIndex]||null;}
export function partyActions(state,playerId){
  if(!state||!playerId||!state.players?.some(p=>p.id===playerId))return [];
  if(state.status==='waiting')return state.players[0]?.id===playerId&&state.players.length>=2?[{type:'start',label:'ابدأ اللعبة'}]:[];
  if(state.status!=='playing')return [];
  const self=String(playerId),turn=currentPlayer(state),phase=state.phase;
  if(phase==='trade'){
    if(state.tradeOffer?.targetId!==self)return [];
    return [{type:'trade-accept',label:'قبول التبادل'},{type:'trade-reject',label:'رفض التبادل'}];
  }
  if(phase==='auction'){
    if(state.players[state.auction?.nextIndex]?.id!==self)return [];
    return [{type:'bid',label:'زايد 10 ريال',payload:{amount:Number(state.auction?.bid||0)+10}},{type:'pass-auction',label:'انسحب من المزاد'}];
  }
  if(turn?.id!==self)return [];
  if(phase==='roll')return turn.jailed?[{type:'roll',label:'ارمِ النرد'},{type:'jail',label:'ادفع 50 للخروج'}]:[{type:'roll',label:'ارمِ النرد'}];
  if(phase==='property')return [{type:'buy',label:'اشترِ الأرض'},{type:'skip',label:'تجاوز إلى المزاد'}];
  if(phase==='card'){
    const stage=state.pending?.stage;
    return stage==='deck'?[{type:'card-pick',label:'اسحب البطاقة'}]:stage==='back'?[{type:'card-flip',label:'اكشف البطاقة'}]:stage==='face'?[{type:'card',label:'طبّق البطاقة'}]:[];
  }
  if(phase==='end')return [{type:'end',label:'إنهاء الدور'}];
  return [];
}
export function playerAccent(state,playerId){
  const index=state?.players?.findIndex(x=>x.id===playerId)??-1;
  return PARTY_COLORS[(index<0?0:index)%PARTY_COLORS.length];
}
export function remoteJoinUrl(code,{location=globalThis.location}={}){
  const url=new URL('./controller/',new URL('../monopoly-party/',location.href));
  if(roomCode(code))url.searchParams.set('code',roomCode(code));
  return url.toString();
}
// Only the public six-digit room code is embedded in shareable URLs; never tokens.
export function publicJoinUrl(code,location=globalThis.location){
  const url=new URL('../controller/',location.href.includes('/monopoly-party/')?
    new URL('./',location.href):new URL('./monopoly-party/tv/',location.href));
  if(roomCode(code))url.searchParams.set('code',roomCode(code));
  return url.toString();
}

export function makePartyConnection({role,client=createGameRoomClient(),storage=globalThis.localStorage,onRoom=()=>{},onStatus=()=>{}}={}){
  if(role!=='player'&&role!=='spectator')throw new TypeError('invalid party role');
  const storageKey='monopoly-party-v1-'+role;
  const identityKey=storageKey+'-identity';
  let identity=storage?.getItem(identityKey)||'';
  if(!/^(tv|phone)-[a-f0-9]{16}$/.test(identity)){
    const random=new Uint8Array(8);globalThis.crypto.getRandomValues(random);
    identity=(role==='spectator'?'tv':'phone')+'-'+Array.from(random,b=>b.toString(16).padStart(2,'0')).join('');
    storage?.setItem(identityKey,identity);
  }
  let session=null,room=null,timer=null,stopped=false,polling=false,busy=false;
  function persist(){if(session)storage?.setItem(storageKey,JSON.stringify(session));}
  function setRoom(next){
    if(!next||next.gameId!==PARTY_GAME_ID)throw new Error('wrong room game');
    if(room?.code===next.code&&Number(next.version)<Number(room.version))return;
    room=next;
    onRoom(next,session);
  }
  function startPolling(){
    if(timer!==null)clearTimeout(timer);
    stopped=false;
    const poll=async()=>{
      if(stopped||polling||!session)return;
      polling=true;
      try{
        const r=await client.getRoom({code:session.code,token:session.token});
        setRoom(r.room);onStatus('connected');
      }catch(error){onStatus('offline',error);}finally{
        polling=false;
        if(!stopped&&session)timer=setTimeout(poll,1250);
      }
    };
    timer=setTimeout(poll,1250);
  }
  async function accept(result){
    if(!result?.playerToken||!result?.room)throw new Error('room join failed');
    session={code:result.room.code,token:result.playerToken,playerId:result.room.selfPlayerId,role,identity};
    persist();setRoom(result.room);startPolling();onStatus('connected');
    return result.room;
  }
  return Object.freeze({
    get room(){return room;},
    get session(){return session;},
    get identity(){return identity;},
    async create(name){
      if(role!=='player')throw new Error('spectator cannot create a player room');
      return accept(await client.createRoom({gameId:PARTY_GAME_ID,learnerId:identity,displayName:name}));
    },
    async join(code,name){
      const valid=roomCode(code);if(!valid)throw new TypeError('room code needs exactly 6 digits');
      return accept(await client.joinRoom({code:valid,learnerId:identity,displayName:name,participationRole:role}));
    },
    async resume(){
      let saved;try{saved=JSON.parse(storage?.getItem(storageKey)||'null');}catch{return null;}
      if(!saved||saved.role!==role||saved.identity!==identity||!roomCode(saved.code)||!saved.token)return null;
      session=saved;
      try{
        const result=await client.getRoom({code:saved.code,token:saved.token});
        setRoom(result.room);startPolling();onStatus('connected');return result.room;
      }catch(error){
        if(error.status===401||error.status===404){storage?.removeItem(storageKey);session=null;room=null;}
        onStatus('offline',error);return null;
      }
    },
    async action(type,payload={}){
      if(role!=='player')throw new Error('spectator actions are forbidden');
      if(!session||!room||busy)throw new Error('action unavailable');
      if(!partyActions(room.state,session.playerId).some(item=>item.type===type))throw new Error('action not allowed in current turn');
      busy=true;
      try{
        const result=await client.submitAction({code:session.code,token:session.token,expectedVersion:room.version,type,payload});
        setRoom(result.room);onStatus('connected');return result.room;
      }catch(error){
        if(error.body?.room)setRoom(error.body.room);
        throw error;
      }finally{busy=false;}
    },
    leave(){
      stopped=true;if(timer!==null)clearTimeout(timer);timer=null;
      storage?.removeItem(storageKey);session=null;room=null;
    }
  });
}
