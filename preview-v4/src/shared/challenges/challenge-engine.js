import { getMetricWindow,summarizeLearningAttempts,learningLevel } from '../progress/learning-metrics.js';
import { summarizeLearningTrends } from '../progress/learning-trends.js';

export const DEFAULT_CHALLENGE_POLICY=Object.freeze({
  daily:Object.freeze({questions:20}),
  weekly:Object.freeze({correctedErrors:5,newlyMasteredSkills:2,activeDays:3})
});

function eventDate(event){const value=event?.createdAt||event?.at;const date=value?new Date(value):null;return date&&!Number.isNaN(date.getTime())?date:null;}
function learnerEvents(attemptLog,learnerId){return(Array.isArray(attemptLog)?attemptLog:[]).filter(event=>(!learnerId||event?.learnerId===learnerId)&&eventDate(event));}
function mastered(level){return level==='mastered'||level==='expert';}

export function newlyMasteredSkillsThisWeek(attemptLog,{learnerId=null,now=new Date()}={}){
  const events=learnerEvents(attemptLog,learnerId),weekStart=getMetricWindow('week',now).start;
  const skillIds=[...new Set(events.map(event=>event?.skillId).filter(Boolean))],newlyMastered=[];
  for(const skillId of skillIds){
    const current=learningLevel(summarizeLearningAttempts(events,{learnerId,skillId})).id;
    if(!mastered(current))continue;
    const before=events.filter(event=>event.skillId===skillId&&eventDate(event)<weekStart);
    const previous=learningLevel(summarizeLearningAttempts(before,{learnerId,skillId})).id;
    if(!mastered(previous))newlyMastered.push(skillId);
  }
  return Object.freeze(newlyMastered);
}

function progressItem(id,label,current,target){
  const safeTarget=Math.max(1,Number(target||1)),safeCurrent=Math.max(0,Number(current||0));
  return Object.freeze({id,label,current:safeCurrent,target:safeTarget,complete:safeCurrent>=safeTarget,pct:Math.min(100,Math.round(safeCurrent/safeTarget*100))});
}

export function deriveChallengeProgress(attemptLog,{learnerId=null,now=new Date(),policy=DEFAULT_CHALLENGE_POLICY}={}){
  const events=learnerEvents(attemptLog,learnerId),today=summarizeLearningAttempts(events,{learnerId,period:'today',now}),week=summarizeLearningAttempts(events,{learnerId,period:'week',now}),trends=summarizeLearningTrends(events,{learnerId,now}),newlyMastered=newlyMasteredSkillsThisWeek(events,{learnerId,now});
  const daily=Object.freeze([
    progressItem('daily-questions',`أجب ${policy.daily.questions} سؤالًا`,today.questions,policy.daily.questions)
  ]);
  const weekly=Object.freeze([
    progressItem('weekly-corrections',`صحح ${policy.weekly.correctedErrors} أخطاء`,week.correctedAfterError,policy.weekly.correctedErrors),
    progressItem('weekly-mastery',`أتقن ${policy.weekly.newlyMasteredSkills} مهارتين`,newlyMastered.length,policy.weekly.newlyMasteredSkills),
    progressItem('weekly-active-days',`تدرّب ${policy.weekly.activeDays} أيام`,trends.activeDaysThisWeek,policy.weekly.activeDays)
  ]);
  return Object.freeze({daily,weekly,dailyComplete:daily.every(item=>item.complete),weeklyComplete:weekly.every(item=>item.complete),newlyMasteredSkills:newlyMastered,trends});
}
