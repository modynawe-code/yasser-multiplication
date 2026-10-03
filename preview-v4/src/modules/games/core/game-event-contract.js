import { normalizeLearnerId } from '../../../shared/learners/learner-id.js';

export const GAME_EVENT_TYPES=Object.freeze([
  'game.started',
  'game.attempted',
  'game.turn.completed',
  'game.retry',
  'game.goal.reached',
  'game.cooperation.completed',
  'game.completed',
  'game.won',
  'game.lost'
]);

const EVENT_TYPES=new Set(GAME_EVENT_TYPES);
const GAME_ID_PATTERN=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function iso(value){
  const date=value instanceof Date?value:new Date(value);
  if(Number.isNaN(date.getTime()))throw new TypeError('game event date is invalid');
  return date.toISOString();
}

export function createGameEvent({type,gameId,learnerId,sessionId=null,at=new Date(),payload={}}={}){
  const normalizedType=String(type||'').trim();
  const normalizedGameId=String(gameId||'').trim();
  const normalizedLearnerId=normalizeLearnerId(learnerId);
  if(!EVENT_TYPES.has(normalizedType))throw new TypeError(`unsupported game event type: ${normalizedType}`);
  if(!GAME_ID_PATTERN.test(normalizedGameId))throw new TypeError(`invalid game id: ${normalizedGameId}`);
  if(!normalizedLearnerId)throw new TypeError(`invalid learner id: ${learnerId}`);
  if(payload===null||Array.isArray(payload)||typeof payload!=='object')throw new TypeError('game event payload must be an object');

  return Object.freeze({
    type:normalizedType,
    gameId:normalizedGameId,
    learnerId:normalizedLearnerId,
    sessionId:sessionId===null?null:String(sessionId).trim()||null,
    at:iso(at),
    payload:Object.freeze({...payload})
  });
}

export function isGameEvent(value){
  return Boolean(
    value&&
    EVENT_TYPES.has(value.type)&&
    GAME_ID_PATTERN.test(String(value.gameId||''))&&
    normalizeLearnerId(value.learnerId)&&
    value.payload&&typeof value.payload==='object'&&!Array.isArray(value.payload)
  );
}
