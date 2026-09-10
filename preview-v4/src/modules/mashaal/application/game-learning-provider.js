import { listMashaalKg3Activities,getMashaalKg3Activity } from '../curriculum/kg3-activity-catalog.js';
import { createMashaalDigitalAttempt } from './digital-attempt.js';
import { recordMashaalEvidence } from './progress-service.js';

function eligibleActivities(){
  return listMashaalKg3Activities().filter(activity=>{
    const choices=Array.isArray(activity?.choices)?activity.choices:[];
    const correct=String(activity?.correctChoice||'');
    return activity?.evidenceType==='digital-attempt'&&choices.length>=2&&choices.length<=4&&correct&&correct!=='done'&&!correct.includes('|');
  });
}

function pick(values,random=Math.random){
  if(!values.length)throw new Error('no Mashaal game-compatible activities are available');
  const index=Math.min(values.length-1,Math.max(0,Math.floor(Number(random())*values.length)));
  return values[index];
}

export function createMashaalGameLearningProvider({getState,saveState,random=Math.random,now=()=>Date.now()}={}){
  if(typeof getState!=='function')throw new TypeError('Mashaal state getter is required');
  const activities=eligibleActivities();

  return Object.freeze({
    listActivityIds(){return Object.freeze(activities.map(item=>item.id));},
    nextChallenge(){
      const activity=pick(activities,random);
      const challengeId=`game-mashaal-${activity.id}-${now()}`;
      return Object.freeze({
        id:challengeId,
        learnerId:'mashaal',
        kind:'kg3-choice',
        prompt:activity.promptAr,
        spokenPrompt:activity.audioPromptAr||activity.promptAr,
        options:Object.freeze([...activity.choices]),
        correctAnswer:activity.correctChoice,
        visual:Object.freeze({
          kind:'mashaal-activity',
          stimulus:activity.stimulus?Object.freeze({...activity.stimulus}):null,
          optionKeys:Object.freeze([...activity.choices])
        }),
        source:Object.freeze({activityId:activity.id,skillId:activity.skillId})
      });
    },
    recordChallenge({result}){
      const activityId=result?.challenge?.source?.activityId;
      const activity=activityId?getMashaalKg3Activity(activityId):null;
      const state=getState();
      if(!activity||!state)return null;
      const isCorrect=String(result.answer)===String(activity.correctChoice);
      const evidence=createMashaalDigitalAttempt({
        evidenceId:`${result.challenge.id}:attempt`,
        skillId:activity.skillId,
        isCorrect,
        responseMs:result.responseMs
      });
      if(!recordMashaalEvidence(state,{skillId:activity.skillId,evidence}))return null;
      saveState?.(state);
      return evidence;
    }
  });
}
