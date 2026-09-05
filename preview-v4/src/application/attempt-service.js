import { appendAttemptEvent, createAttemptId } from '../shared/data/attempt-ledger.js';

export function recordAttempt(state,{question,answer,responseMs,createdAt=new Date().toISOString()}){
  const correctAnswer=question.table*question.multiplier,
    isCorrect=Number(answer)===correctAnswer,
    table=state.tables[question.table],
    fact=table.facts[question.multiplier];

  table.attempts++;state.totalAttempts++;fact.attempts++;fact.last=createdAt;fact.recent.push(isCorrect);fact.recent=fact.recent.slice(-5);
  const normalizedResponseMs=Number.isFinite(Number(responseMs))?Math.max(0,Number(responseMs)):null;
  fact.lastResponseMs=normalizedResponseMs;
  if(normalizedResponseMs!==null){fact.responseTimes.push(normalizedResponseMs);fact.responseTimes=fact.responseTimes.slice(-20);}
  if(isCorrect){table.correct++;state.totalCorrect++;fact.correct++;}
  else{table.wrong++;state.totalWrong++;fact.wrong++;}

  const event={
    attemptId:createAttemptId('yas'),
    schemaVersion:1,
    learnerId:'yasser',
    skillId:`table-${question.table}`,
    table:question.table,
    multiplier:question.multiplier,
    questionId:`${question.table}x${question.multiplier}`,
    answer:Number(answer),
    correctAnswer,
    isCorrect,
    responseMs:normalizedResponseMs,
    createdAt
  };
  appendAttemptEvent(state,event);
  return event;
}
