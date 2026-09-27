import { getMashaalKg3Activity } from '../curriculum/kg3-activity-catalog.js';

const DAILY_MISSION_POOL=Object.freeze([
  'kg3-letter-hunt-ba-01',
  'kg3-kitchen-count-01',
  'kg3-memory-match-01',
  'kg3-plant-growth-sequence-01',
  'kg3-animal-habitat-01',
  'kg3-color-mix-orange-01',
  'kg3-picture-puzzle-01',
  'kg3-interactive-morning-story-01'
]);

export function mashaalLocalDayKey(value=new Date()){
  const date=value instanceof Date?value:new Date(value);
  if(Number.isNaN(date.getTime()))return '';
  const year=date.getFullYear(),month=String(date.getMonth()+1).padStart(2,'0'),day=String(date.getDate()).padStart(2,'0');
  return `${year}-${month}-${day}`;
}

function dayHash(dayKey){
  let hash=0;
  for(const char of String(dayKey||''))hash=(hash*31+char.charCodeAt(0))>>>0;
  return hash;
}

function completedActivityIdsForDay(state,dayKey){
  const completed=new Set();
  for(const evidence of state?.evidenceLog||[]){
    if(!evidence?.createdAt||mashaalLocalDayKey(evidence.createdAt)!==dayKey)continue;
    const successful=evidence.type==='activity-completion'||(evidence.type==='digital-attempt'&&evidence?.payload?.isCorrect===true);if(!successful)continue;
    const activityId=String(evidence?.payload?.activityId||'');
    if(activityId)completed.add(activityId);
  }
  return completed;
}

export function createMashaalDailyMission(state,{date=new Date(),size=3}={}){
  const dayKey=mashaalLocalDayKey(date),limit=Math.max(1,Math.min(DAILY_MISSION_POOL.length,Number(size)||3));
  const start=dayHash(dayKey)%DAILY_MISSION_POOL.length;
  const ids=Array.from({length:limit},(_,index)=>DAILY_MISSION_POOL[(start+index)%DAILY_MISSION_POOL.length]);
  const completed=completedActivityIdsForDay(state,dayKey);
  const tasks=ids.map(activityId=>{
    const activity=getMashaalKg3Activity(activityId);
    return Object.freeze({
      activityId,
      skillId:activity?.skillId||'',
      title:activity?.experienceTitleAr||activity?.promptAr||'لعبة مشاعل',
      complete:completed.has(activityId)
    });
  });
  const completeCount=tasks.filter(task=>task.complete).length;
  return Object.freeze({
    dayKey,
    tasks:Object.freeze(tasks),
    completeCount,
    total:tasks.length,
    done:tasks.length>0&&completeCount===tasks.length
  });
}

export function listMashaalDailyMissionActivityIds(){return Object.freeze([...DAILY_MISSION_POOL]);}
