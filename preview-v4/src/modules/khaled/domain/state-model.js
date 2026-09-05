import { KHALED_SKILLS } from './curriculum.js';

export const KHALED_SCHEMA_VERSION=1;

function blankSkill(){return{attempts:0,correct:0,wrong:0,recent:[],last:null};}

export function createInitialKhaledState(){
  return{
    schemaVersion:KHALED_SCHEMA_VERSION,
    skills:Object.fromEntries(KHALED_SKILLS.map(skill=>[skill.id,blankSkill()])),
    sessions:[],
    totalAttempts:0,
    totalCorrect:0,
    totalWrong:0
  };
}

export function normalizeKhaledState(candidate){
  const state=candidate&&typeof candidate==='object'?candidate:createInitialKhaledState();
  state.schemaVersion=KHALED_SCHEMA_VERSION;
  if(!state.skills||typeof state.skills!=='object')state.skills={};
  for(const skill of KHALED_SKILLS){
    if(!state.skills[skill.id])state.skills[skill.id]=blankSkill();
    const item=state.skills[skill.id];
    item.attempts=Number(item.attempts||0);
    item.correct=Number(item.correct||0);
    item.wrong=Number(item.wrong||0);
    item.recent=Array.isArray(item.recent)?item.recent.map(Boolean).slice(-10):[];
    item.last=item.last||null;
  }
  state.sessions=Array.isArray(state.sessions)?state.sessions.slice(0,100):[];
  state.totalAttempts=Number(state.totalAttempts||0);
  state.totalCorrect=Number(state.totalCorrect||0);
  state.totalWrong=Number(state.totalWrong||0);
  return state;
}

export function recordKhaledAttempt(state,{skillId,isCorrect,question,answer}){
  const skill=state.skills[skillId];
  if(!skill)throw new Error(`Unknown Khaled skill state: ${skillId}`);
  const now=new Date().toISOString();
  state.totalAttempts+=1;
  skill.attempts+=1;
  if(isCorrect){state.totalCorrect+=1;skill.correct+=1;}
  else{state.totalWrong+=1;skill.wrong+=1;}
  skill.recent=[...skill.recent,isCorrect].slice(-10);
  skill.last=now;
  return{at:now,skillId,isCorrect,questionId:question.id,answer,correctAnswer:question.correctAnswer};
}
