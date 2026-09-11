import { KHALED_SCIENCE_ATLAS } from './khaled-science-atlas-manifest.js';
import { KHALED_SCIENCE_LESSONS as SOURCE_LESSONS } from './khaled-science-curriculum.js';

export const KHALED_SCIENCE_ART=KHALED_SCIENCE_ATLAS;

function shuffle(items){
  const out=[...items];
  for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
  return out;
}
function adaptActivity(activity){
  if(activity.type==='sequence'){
    return Object.freeze({...activity,type:'matching',prompt:'صل كل مرحلة بترتيبها الصحيح.',spokenPrompt:'صل كل مرحلة من نمو النبات بترتيبها الصحيح.',pairs:Object.freeze(activity.items.map((item,index)=>Object.freeze({left:item.labelAr,leftArt:item.art,right:`stage-${index+1}`,rightLabel:`المرحلة ${index+1}`})))});
  }
  if(activity.options)return Object.freeze({...activity,options:Object.freeze(shuffle(activity.options))});
  return activity;
}
export const KHALED_SCIENCE_LESSONS=Object.freeze(SOURCE_LESSONS.map(lesson=>Object.freeze({...lesson,activities:Object.freeze(lesson.activities.map(adaptActivity))})));
export const KHALED_SCIENCE_ACTIVITY_COUNT=KHALED_SCIENCE_LESSONS.reduce((sum,lesson)=>sum+lesson.activities.length,0);
export function getKhaledScienceLesson(id){return KHALED_SCIENCE_LESSONS.find(lesson=>lesson.id===id)||null;}
