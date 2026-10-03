export const LEARNING_METRICS_VERSION=1;

export const MASTERY_WEIGHTS=Object.freeze({
  firstTry:1,
  corrected:0.5,
  assisted:0.25,
  unresolved:0
});

function clampPct(value){return Math.max(0,Math.min(100,Math.round(value||0)));}
function eventDate(event){const value=event?.createdAt||event?.at;const date=value?new Date(value):null;return date&&!Number.isNaN(date.getTime())?date:null;}
function startOfDay(now){const date=new Date(now);date.setHours(0,0,0,0);return date;}
function startOfWeek(now){const date=startOfDay(now);date.setDate(date.getDate()-date.getDay());return date;}

export function getMetricWindow(period='all',now=new Date()){
  const current=now instanceof Date?new Date(now):new Date(now);
  if(period==='today')return{period,start:startOfDay(current),end:current};
  if(period==='week')return{period,start:startOfWeek(current),end:current};
  return{period:'all',start:null,end:current};
}

export function filterAttemptEvents(attemptLog,{period='all',now=new Date(),learnerId=null,skillId=null}={}){
  const window=getMetricWindow(period,now);
  return(Array.isArray(attemptLog)?attemptLog:[]).filter(event=>{
    if(learnerId&&event?.learnerId!==learnerId)return false;
    if(skillId&&event?.skillId!==skillId)return false;
    if(!window.start)return true;
    const date=eventDate(event);return Boolean(date&&date>=window.start&&date<=window.end);
  });
}

function groupKey(event,index){
  return String(event?.learningCycleId||event?.questionInstanceId||event?.questionCycleId||event?.attemptId||`legacy-${index}`);
}

export function groupQuestionOutcomes(attemptLog,options={}){
  const events=filterAttemptEvents(attemptLog,options),groups=new Map();
  events.forEach((event,index)=>{
    const key=groupKey(event,index),list=groups.get(key)||[];list.push(event);groups.set(key,list);
  });
  return[...groups.entries()].map(([key,list])=>{
    const ordered=[...list].sort((a,b)=>(eventDate(a)?.getTime()||0)-(eventDate(b)?.getTime()||0));
    const first=ordered[0],correctIndex=ordered.findIndex(item=>Boolean(item.isCorrect)),finalCorrect=correctIndex>=0;
    const usedHint=ordered.some(item=>Boolean(item.usedHint));
    let outcome='unresolved',weight=MASTERY_WEIGHTS.unresolved;
    if(finalCorrect&&correctIndex===0&&!usedHint){outcome='firstTry';weight=MASTERY_WEIGHTS.firstTry;}
    else if(finalCorrect&&correctIndex===1&&!usedHint){outcome='corrected';weight=MASTERY_WEIGHTS.corrected;}
    else if(finalCorrect){outcome='assisted';weight=MASTERY_WEIGHTS.assisted;}
    return Object.freeze({
      key,
      learnerId:first?.learnerId||null,
      skillId:first?.skillId||null,
      questionId:first?.questionId||null,
      attempts:ordered.length,
      wrongAttempts:ordered.filter(item=>!item.isCorrect).length,
      firstTryCorrect:outcome==='firstTry',
      finalCorrect,
      corrected:outcome==='corrected',
      assisted:outcome==='assisted',
      outcome,
      weight,
      startedAt:first?.createdAt||first?.at||null,
      completedAt:ordered.at(-1)?.createdAt||ordered.at(-1)?.at||null
    });
  });
}

export function summarizeLearningAttempts(attemptLog,options={}){
  const events=filterAttemptEvents(attemptLog,options),outcomes=groupQuestionOutcomes(attemptLog,options),questions=outcomes.length;
  const firstTryCorrect=outcomes.filter(item=>item.firstTryCorrect).length;
  const correctedAfterError=outcomes.filter(item=>item.corrected).length;
  const assistedCorrect=outcomes.filter(item=>item.assisted).length;
  const unresolved=outcomes.filter(item=>!item.finalCorrect).length;
  const finalCorrect=outcomes.filter(item=>item.finalCorrect).length;
  const masteryPoints=outcomes.reduce((sum,item)=>sum+item.weight,0);
  return Object.freeze({
    period:options.period||'all',
    questions,
    rawAttempts:events.length,
    historicalErrors:events.filter(item=>!item.isCorrect).length,
    firstTryCorrect,
    correctedAfterError,
    assistedCorrect,
    unresolved,
    finalCorrect,
    firstTryAccuracy:questions?clampPct(firstTryCorrect/questions*100):0,
    finalSuccessRate:questions?clampPct(finalCorrect/questions*100):0,
    masteryScore:questions?clampPct(masteryPoints/questions*100):0,
    masteryPoints:Number(masteryPoints.toFixed(2))
  });
}

export function learningLevel(summary,{minimumQuestions=5}={}){
  const questions=Number(summary?.questions||0),score=Number(summary?.masteryScore||0);
  if(!questions)return Object.freeze({id:'not-started',label:'لم يبدأ'});
  if(questions<minimumQuestions||score<60)return Object.freeze({id:'learning',label:'يتعلم'});
  if(score<80)return Object.freeze({id:'progressing',label:'يتقدم'});
  if(score<92||questions<Math.max(10,minimumQuestions))return Object.freeze({id:'mastered',label:'متقن'});
  return Object.freeze({id:'expert',label:'خبير'});
}

export function summarizeLearningWindows(attemptLog,options={}){
  const now=options.now||new Date(),base={...options,now};
  delete base.period;
  return Object.freeze({
    today:summarizeLearningAttempts(attemptLog,{...base,period:'today'}),
    week:summarizeLearningAttempts(attemptLog,{...base,period:'week'}),
    all:summarizeLearningAttempts(attemptLog,{...base,period:'all'})
  });
}
