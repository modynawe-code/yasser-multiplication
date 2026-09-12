import { isGameSessionParticipant } from './game-session-participant.js';

export const GAME_SESSION_PERMISSIONS=Object.freeze([
  'session.view',
  'session.play',
  'session.spectate',
  'session.manage',
  'session.invite',
  'progress.receive'
]);
const PERMISSIONS=new Set(GAME_SESSION_PERMISSIONS);

function defaultDecision(participant,permission){
  if(permission==='session.view')return true;
  if(permission==='session.play')return participant.participationRole==='player';
  if(permission==='session.spectate')return participant.participationRole==='spectator';
  if(permission==='session.manage'||permission==='session.invite')return participant.authorityRole==='host'||participant.authorityRole==='local';
  if(permission==='progress.receive')return participant.rewardEligible===true;
  return false;
}

export function createGamePermissionService({rules={}}={}){
  if(rules===null||Array.isArray(rules)||typeof rules!=='object')throw new TypeError('permission rules must be an object');
  function can(participant,permission,context={}){
    const key=String(permission||'').trim();
    if(!isGameSessionParticipant(participant)||!PERMISSIONS.has(key))return false;
    const custom=rules[key];
    if(typeof custom==='function')return Boolean(custom(participant,context));
    return defaultDecision(participant,key);
  }
  function assert(participant,permission,context={}){
    if(!can(participant,permission,context))throw new Error(`game permission denied: ${permission}`);
    return participant;
  }
  return Object.freeze({can,assert,list:()=>GAME_SESSION_PERMISSIONS});
}
