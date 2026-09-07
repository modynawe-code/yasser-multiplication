import { REWARD_BY_ID } from './reward-catalog.js';

export const REWARD_LEDGER_VERSION=1;

function iso(value=new Date()){const date=value instanceof Date?value:new Date(value);return Number.isNaN(date.getTime())?new Date().toISOString():date.toISOString();}
function weekKey(value=new Date()){
  const date=value instanceof Date?new Date(value):new Date(value);date.setHours(0,0,0,0);date.setDate(date.getDate()-date.getDay());
  return date.toISOString().slice(0,10);
}

export function createRewardLedger(learnerId){return{schemaVersion:REWARD_LEDGER_VERSION,learnerId:String(learnerId||''),unlocks:[]};}
export function normalizeRewardLedger(candidate,learnerId){
  const expected=String(learnerId||candidate?.learnerId||'');
  const ledger=candidate&&typeof candidate==='object'?candidate:createRewardLedger(expected);
  const unlocks=Array.isArray(ledger.unlocks)?ledger.unlocks.filter(item=>item&&item.rewardId&&item.awardKey):[];
  return{schemaVersion:REWARD_LEDGER_VERSION,learnerId:expected,unlocks:[...unlocks]};
}

export function recordRewardUnlock(ledger,{learnerId,rewardId,awardKey,source='learning',at=new Date(),meta={}}={}){
  if(!ledger||String(ledger.learnerId)!==String(learnerId))return false;
  if(!REWARD_BY_ID[rewardId]||!awardKey)return false;
  const key=String(awardKey);if(ledger.unlocks.some(item=>item.awardKey===key))return false;
  ledger.unlocks.push(Object.freeze({rewardId,awardKey:key,source,at:iso(at),meta:Object.freeze({...meta})}));
  return true;
}

export function deriveLearningRewardCandidates({learnerId,windows,skillLevels=[],streakDays=0,weeklyChallengeComplete=false,improvementPct=0,totalQuestions=null,now=new Date()}={}){
  const id=String(learnerId||''),week=windows?.week||{},all=windows?.all||{},candidates=[];
  const mastered=skillLevels.filter(item=>['mastered','expert'].includes(item?.level||item?.id));
  const experts=skillLevels.filter(item=>(item?.level||item?.id)==='expert');
  const total=Number(totalQuestions??all.questions??0),wk=weekKey(now);
  const add=(rewardId,awardKey,meta={})=>candidates.push(Object.freeze({learnerId:id,rewardId,awardKey,source:'learning',meta}));

  if(Number(week.questions||0)>=10&&Number(week.firstTryAccuracy||0)>=90)add('accuracy-medal',`accuracy-medal:${wk}`,{period:'week',accuracy:week.firstTryAccuracy});
  mastered.forEach(item=>add('mastery-shield',`mastery-shield:${item.skillId||item.id}`,{skillId:item.skillId||item.id}));
  if(mastered.length>=3)add('mastery-cup','mastery-cup:3-skills',{masteredSkills:mastered.length});
  if(weeklyChallengeComplete)add('weekly-cup',`weekly-cup:${wk}`,{week:wk});
  if(experts.length>=2)add('distinction-crown','distinction-crown:2-expert-skills',{expertSkills:experts.length});
  [3,7,14,30].filter(days=>Number(streakDays)>=days).forEach(days=>add('streak-flame',`streak-flame:${days}`,{days}));
  [100,250,500,1000].filter(target=>total>=target).forEach(target=>add('surprise-box',`surprise-box:${target}`,{questions:target}));
  if(Number(improvementPct)>=10)add('progress-badge',`progress-badge:${wk}`,{improvementPct:Number(improvementPct)});
  return candidates;
}

export function applyRewardCandidates(ledger,candidates,{at=new Date()}={}){
  let added=0;
  for(const candidate of candidates||[])if(recordRewardUnlock(ledger,{...candidate,at}))added++;
  return added;
}

export function rewardSummary(ledger){
  const unlocks=Array.isArray(ledger?.unlocks)?ledger.unlocks:[],counts={};
  unlocks.forEach(item=>{counts[item.rewardId]=(counts[item.rewardId]||0)+1;});
  return Object.freeze({total:unlocks.length,counts:Object.freeze(counts),unlocks:Object.freeze([...unlocks])});
}
