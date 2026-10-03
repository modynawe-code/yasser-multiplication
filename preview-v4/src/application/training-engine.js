import { createAdaptiveQuestions, createExamQuestions, shuffle } from '../domain/question-bank.js';
import { recordAttempt } from './attempt-service.js';
import { summarizeLearningAttempts } from '../shared/progress/learning-metrics.js';

function sessionId(){return `yas-session-${Date.now()}-${Math.random().toString(16).slice(2)}`;}
function prepareQuestions(questions,id){return questions.map((question,index)=>({...question,learningCycleId:question.learningCycleId||`${id}:${index}:${question.table}x${question.multiplier}`,attemptNumber:Math.max(1,Number(question.attemptNumber||1))}));}

export function createSession({mode,state,selectedTables,customQuestions=null,startedAt=new Date().toISOString()}){
  const id=sessionId(),source=customQuestions||(mode==='exam'?createExamQuestions(selectedTables,30):createAdaptiveQuestions(state,selectedTables,15));
  return{id,mode,selectedTables:[...selectedTables],questions:prepareQuestions(source,id),index:0,correct:0,wrong:0,streak:0,bestStreak:0,answers:[],startedAt,currentQuestionStartedAt:Date.now(),locked:false,lastWeak:[]};
}
export function getCurrentQuestion(session){return session?.questions?.[session.index]||null;}
export function submitSessionAnswer({session,state,answer,now=Date.now()}){
  if(!session||session.locked)return{accepted:false};const numericAnswer=Number(answer);if(!Number.isFinite(numericAnswer))return{accepted:false};const question=getCurrentQuestion(session);if(!question)return{accepted:false};
  session.locked=true;
  const responseMs=Math.max(0,now-session.currentQuestionStartedAt),correctAnswer=question.table*question.multiplier,isCorrect=numericAnswer===correctAnswer;
  const attempt=recordAttempt(state,{question,answer:numericAnswer,responseMs,learningCycleId:question.learningCycleId,attemptNumber:question.attemptNumber,questionCompleted:isCorrect||session.mode==='exam'});
  session.answers.push(attempt);
  if(attempt.isCorrect){session.correct++;session.streak++;session.bestStreak=Math.max(session.bestStreak,session.streak);}
  else{
    session.wrong++;session.streak=0;
    if(session.mode==='practice'){
      const insertAt=Math.min(session.questions.length,session.index+3+Math.floor(Math.random()*3));
      session.questions.splice(insertAt,0,{...question,learningCycleId:question.learningCycleId,attemptNumber:Math.max(1,Number(question.attemptNumber||1))+1});
    }
  }
  session.index++;return{accepted:true,attempt,done:session.index>=session.questions.length};
}
export function unlockNextQuestion(session){session.locked=false;session.currentQuestionStartedAt=Date.now();}
export function getSessionLearningSummary(session){return summarizeLearningAttempts(session?.answers||[],{learnerId:'yasser'});}
export function buildSessionRecord(session,{incomplete=false,endedAt=new Date().toISOString()}={}){
  const summary=getSessionLearningSummary(session);
  return{mode:session.mode,selected:[...session.selectedTables],startedAt:session.startedAt,endedAt,completed:summary.questions,correct:summary.finalCorrect,wrong:summary.unresolved,firstTryCorrect:summary.firstTryCorrect,correctedAfterError:summary.correctedAfterError,assistedCorrect:summary.assistedCorrect,unresolved:summary.unresolved,masteryScore:summary.masteryScore,rawAttempts:summary.rawAttempts,bestStreak:session.bestStreak,incomplete,answers:[...session.answers]};
}
export function getWeakQuestions(session,limit=6){const counts=new Map();session.answers.filter(a=>!a.isCorrect).forEach(a=>{const key=`${a.table}×${a.multiplier}`;counts.set(key,(counts.get(key)||0)+1);});return[...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([key,count])=>{const[table,multiplier]=key.split('×').map(Number);return{table,multiplier,count};});}
export function createWeakPracticeQuestions(weakQuestions,repetitions=3){const questions=[];weakQuestions.forEach(({table,multiplier})=>{for(let i=0;i<repetitions;i++)questions.push({table,multiplier});});return shuffle(questions);}
