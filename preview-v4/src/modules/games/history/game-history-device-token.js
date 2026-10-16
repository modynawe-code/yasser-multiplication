export const GAME_HISTORY_DEVICE_TOKEN_KEY='family-game-history-device-token-v1';

export function getGameHistoryDeviceToken(storage=globalThis.localStorage){
  try{return String(storage?.getItem(GAME_HISTORY_DEVICE_TOKEN_KEY)||'').trim();}catch{return'';}
}
export function setGameHistoryDeviceToken(token,storage=globalThis.localStorage){
  const value=String(token||'').trim();
  try{if(value)storage?.setItem(GAME_HISTORY_DEVICE_TOKEN_KEY,value);else storage?.removeItem(GAME_HISTORY_DEVICE_TOKEN_KEY);return Boolean(value);}catch{return false;}
}
export function clearGameHistoryDeviceToken(storage=globalThis.localStorage){
  try{storage?.removeItem(GAME_HISTORY_DEVICE_TOKEN_KEY);return true;}catch{return false;}
}
