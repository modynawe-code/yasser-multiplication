import { getFamilyApiBase } from '../../../shared/config/family-api-config.js';

async function parseResponse(response){
  let body=null;try{body=await response.json();}catch{}
  if(response.ok)return body;
  const error=new Error(body?.error||`game_room_http_${response.status}`);error.status=response.status;error.body=body;throw error;
}

export function createGameRoomClient({baseUrl=getFamilyApiBase(),fetchImpl=globalThis.fetch}={}){
  if(typeof fetchImpl!=='function')throw new TypeError('fetch implementation required');
  const base=String(baseUrl||'').replace(/\/$/,'');
  async function request(path,{method='GET',body,token}={}){
    const headers={'content-type':'application/json'};if(token)headers['x-game-token']=token;
    const response=await fetchImpl(`${base}${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});
    return parseResponse(response);
  }
  return Object.freeze({
    createRoom({gameId='xo',learnerId}){return request('/v1/games/rooms',{method:'POST',body:{gameId,learnerId}});},
    joinRoom({code,learnerId}){return request('/v1/games/rooms/join',{method:'POST',body:{code,learnerId}});},
    getRoom({code,token}){return request(`/v1/games/rooms/${encodeURIComponent(code)}`,{token});},
    submitAction({code,token,expectedVersion,type,cell}){return request(`/v1/games/rooms/${encodeURIComponent(code)}/actions`,{method:'POST',token,body:{expectedVersion,type,cell}});}
  });
}

export function createRoomPoller({load,onRoom,onError,intervalMs=1100,setTimer=setTimeout,clearTimer=clearTimeout}={}){
  let timer=null,stopped=true,busy=false;
  async function tick(){
    if(stopped||busy)return;busy=true;
    try{const result=await load();if(!stopped)onRoom?.(result?.room||result);}catch(error){if(!stopped)onError?.(error);}finally{busy=false;if(!stopped)timer=setTimer(tick,intervalMs);}
  }
  return Object.freeze({
    start(){if(!stopped)return;stopped=false;tick();},
    stop(){stopped=true;if(timer!==null){clearTimer(timer);timer=null;}},
    get running(){return!stopped;}
  });
}
