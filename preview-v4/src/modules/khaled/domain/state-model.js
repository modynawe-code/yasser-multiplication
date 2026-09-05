import { KHALED_SKILLS } from './curriculum.js';
import { appendAttemptEvent, createAttemptId, createLedgerBaseline, normalizeAttemptLog, normalizeLedgerBaseline, summarizeAttemptLedger } from '../../../shared/data/attempt-ledger.js';

export const KHALED_SCHEMA_VERSION=2;

function blankSkill(){return{attempts:0,correct:0,wrong:0,recent:[],last:null};}

export function createInitialKhaledState(){
  return{
    schemaVersion:KHALED_SCHEMA_VERSION,
    skills:Object.fromEntries(KHALED_SKILLS.map(skill=>[skill.id,blankSkill()])),
    sessions:[],
    attemptLog:[],
    ledgerBaseline:createLedgerBaseline(),
    totalAttempts:0,
    totalCorrect:0,
    totalWrong:0
  };
}

export function normalizeKhaledState(candidate){
  const state=candidate&&typeof candidate==='object'?candidate:createInitialKhaledState();
  const sourceVersion=Number(state.schemaVersion||0);
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
  state.attemptLog=normalizeAttemptLog(state.attemptLog);
  state.ledgerBaseline=normalizeLedgerBaseline(state.ledgerBaseline,sourceVersion<KHALED_SCHEMA_VERSION?{
    attempts:state.totalAttempts,
    correct:state.totalCorrect,
    wrong:state.totalWrong
  }:{attempts:0,correct:0,wrong:0});
  const ledgerTotals=summarizeAttemptLedger({baseline:state.ledgerBaseline,attemptLog:state.attemptLog});
  state.totalAttempts=Math.max(state.totalAttempts,ledgerTotals.attempts);
  state.totalCorrect=Math.max(state.totalCorrect,ledgerTotals.correct);
  state.totalWrong=Math.max(state.totalWrong,ledgerTotals.wrong);
  state.schemaVersion=KHALED_SCHEMA_VERSION;
  return state;
}

export function recordKhaledAttempt(state,{skillId,isCorrect,question,answer,createdAt=new Date().toISOString()}){
  const skill=state.skills[skillId];
  if(!skill)throw new Error(`Unknown Khaled skill state: ${skillId}`);
  state.totalAttempts+=1;
  skill.attempts+=1;
  if(isCorrect){state.totalCorrect+=1;skill.correct+=1;}
  else{state.totalWrong+=1;skill.wrong+=1;}
  skill.recent=[...skill.recent,isCorrect].slice(-10);
  skill.last=createdAt;
  const event={
    attemptId:createAttemptId('kha'),
    schemaVersion:1,
    learnerId:'khaled',
    skillId,
    questionId:question.id,
    questionType:question.type,
    answer,
    correctAnswer:question.correctAnswer,
    isCorrect:Boolean(isCorrect),
    createdAt,
    at:createdAt
  };
  appendAttemptEvent(state,event);
  return event;
}
