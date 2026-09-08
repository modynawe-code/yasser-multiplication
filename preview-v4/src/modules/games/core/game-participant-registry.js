import { getLearnerProfile, listLearnerProfiles } from '../../../shared/learners/learner-registry.js';
import { createPlayerContext } from './player-context.js';

const ARTWORK=Object.freeze({
  yasser:Object.freeze({avatar:'assets/visual/original/yasser/welcome.png',celebration:'assets/visual/original/yasser/celebrate.png'}),
  khaled:Object.freeze({avatar:'assets/visual/original/khaled/khaled-point-thumbsup.png',celebration:'assets/visual/original/khaled/khaled-celebration.png'})
});

function toParticipant(profile){
  if(!profile)return null;
  const player=createPlayerContext({
    playerId:profile.id,
    learnerId:profile.id,
    displayName:profile.displayName,
    theme:profile.themeId||profile.id
  });
  const artwork=ARTWORK[profile.id]||{};
  return Object.freeze({
    ...player,
    symbol:String(profile.presentation?.symbol||'🎮'),
    accent:String(profile.presentation?.accent||'violet'),
    avatar:artwork.avatar||null,
    celebrationAvatar:artwork.celebration||artwork.avatar||null
  });
}

export function getGameParticipant(learnerId){
  return toParticipant(getLearnerProfile(learnerId));
}

export function listGameParticipants({supportsLearning}={}){
  const filter=typeof supportsLearning==='function'?supportsLearning:()=>true;
  return Object.freeze(listLearnerProfiles().filter(profile=>filter(profile.id)).map(toParticipant));
}

export function gameParticipantMarkup(participant,{imageClass='',fallbackClass=''}={}){
  if(!participant)return'';
  if(participant.avatar)return `<img class="${imageClass}" src="${participant.avatar}" alt="" decoding="async">`;
  return `<span class="${fallbackClass}" aria-hidden="true">${participant.symbol}</span>`;
}
