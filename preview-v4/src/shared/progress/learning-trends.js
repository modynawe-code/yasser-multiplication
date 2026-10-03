import { summarizeLearningAttempts,summarizeLearningWindows } from './learning-metrics.js';

function eventDate(event){const value=event?.createdAt||event?.at;const date=value?new Date(value):null;return date&&!Number.isNaN(date.getTime())?date:null;}
function startOfDay(value){const date=value instanceof Date?new Date(value):new Date(value);date.setHours(0,0,0,0);return date;}
function startOfWeek(value){const date=startOfDay(value);date.setDate(date.getDate()-date.getDay());return date;}
function addDays(value,days){const date=new Date(value);date.setDate(date.getDate()+days);return date;}
function sameDay(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();}
function learnerEvents(attemptLog,learnerId){return(Array.isArray(attemptLog)?attemptLog:[]).filter(event=>(!learnerId||event?.learnerId===learnerId)&&eventDate(event));}
function uniqueDays(events){const days=[];for(const event of events){const day=startOfDay(eventDate(event));if(!days.some(item=>sameDay(item,day)))days.push(day);}return days.sort((a,b)=>b-a);}

export function calculateLearningStreak(attemptLog,{learnerId=null,now=new Date()}={}){
  const days=uniqueDays(learnerEvents(attemptLog,learnerId));if(!days.length)return 0;
  const today=startOfDay(now),yesterday=addDays(today,-1),latest=days[0];
  if(!sameDay(latest,today)&&!sameDay(latest,yesterday))return 0;
  let streak=1,expected=addDays(latest,-1);
  for(let index=1;index<days.length;index++){
    const day=days[index];if(sameDay(day,expected)){streak++;expected=addDays(expected,-1);continue;}
    if(day<expected)break;
  }
  return streak;
}

export function summarizeLearningTrends(attemptLog,{learnerId=null,now=new Date()}={}){
  const events=learnerEvents(attemptLog,learnerId),current=summarizeLearningWindows(events,{learnerId,now}),currentWeekStart=startOfWeek(now),previousWeekStart=addDays(currentWeekStart,-7);
  const previousEvents=events.filter(event=>{const date=eventDate(event);return date>=previousWeekStart&&date<currentWeekStart;});
  const previousWeek=summarizeLearningAttempts(previousEvents,{learnerId});
  const activeDaysThisWeek=uniqueDays(events.filter(event=>eventDate(event)>=currentWeekStart&&eventDate(event)<=now)).length;
  const improvementPct=current.week.questions&&previousWeek.questions?current.week.masteryScore-previousWeek.masteryScore:0;
  return Object.freeze({streakDays:calculateLearningStreak(events,{learnerId,now}),activeDaysThisWeek,improvementPct,previousWeek,currentWeek:current.week});
}
