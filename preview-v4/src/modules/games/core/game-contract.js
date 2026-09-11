export const GAME_CATEGORIES=Object.freeze(['educational','fun','hybrid']);
export const GAME_NETWORK_MODES=Object.freeze(['none','turn-based','simultaneous','realtime']);
export const GAME_PLAY_MODES=Object.freeze(['solo','local','online','coop']);
export const GAME_LEARNING_MODES=Object.freeze(['none','optional','required','adaptive']);

const ID_PATTERN=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function uniqueStrings(values,name){
  if(!Array.isArray(values)||!values.length)throw new TypeError(`${name} must be a non-empty array`);
  const normalized=[...new Set(values.map(value=>String(value).trim()).filter(Boolean))];
  if(!normalized.length)throw new TypeError(`${name} must contain at least one value`);
  return normalized;
}

function assertAllowed(value,allowed,name){
  if(!allowed.includes(value))throw new TypeError(`${name} is invalid: ${value}`);
  return value;
}

export function defineGame(definition={}){
  const id=String(definition.id||'').trim();
  const title=String(definition.title||'').trim();
  if(!ID_PATTERN.test(id))throw new TypeError(`game id is invalid: ${id}`);
  if(!title)throw new TypeError('game title is required');

  const category=assertAllowed(definition.category,GAME_CATEGORIES,'category');
  const networkMode=assertAllowed(definition.networkMode??'none',GAME_NETWORK_MODES,'networkMode');
  const learningMode=assertAllowed(definition.learningMode??'none',GAME_LEARNING_MODES,'learningMode');
  const playModes=uniqueStrings(definition.playModes||['solo'],'playModes');
  playModes.forEach(mode=>assertAllowed(mode,GAME_PLAY_MODES,'playMode'));

  const minPlayers=Number(definition.minPlayers??1);
  const maxPlayers=Number(definition.maxPlayers??minPlayers);
  if(!Number.isInteger(minPlayers)||!Number.isInteger(maxPlayers)||minPlayers<1||maxPlayers<minPlayers){
    throw new TypeError('player limits are invalid');
  }

  if(playModes.includes('online')&&networkMode==='none')throw new TypeError('online games require a network mode');
  if(!playModes.includes('online')&&networkMode!=='none')throw new TypeError('network mode requires online play');

  return Object.freeze({
    id,
    title,
    category,
    playModes:Object.freeze(playModes),
    networkMode,
    learningMode,
    minPlayers,
    maxPlayers,
    version:Number.isInteger(definition.version)&&definition.version>0?definition.version:1,
    load:typeof definition.load==='function'?definition.load:null,
    metadata:Object.freeze({...definition.metadata})
  });
}
