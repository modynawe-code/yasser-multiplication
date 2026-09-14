import {YASSER_SCIENCE_ASSETS,YASSER_SCIENCE_QUESTIONS} from './science-data.js';

const emptyProgress=()=>({version:1,attempts:[],concepts:{},points:0,bestStreak:0,updatedAt:null});
const cloneProgress=(progress)=>({
  ...emptyProgress(),...(progress||{}),
  attempts:Array.isArray(progress?.attempts)?[...progress.attempts]:[],
  concepts:{...(progress?.concepts||{})}
});

export function validateScienceBank({questions=YASSER_SCIENCE_QUESTIONS,assets=YASSER_SCIENCE_ASSETS}={}){
  const errors=[];const ids=new Set();
  for(const question of questions){
    if(!question?.id||ids.has(question.id))errors.push(`duplicate-or-missing-id:${question?.id||'unknown'}`);else ids.add(question.id);
    if(!question?.concept)errors.push(`missing-concept:${question?.id}`);
    if(!Array.isArray(question?.choices)||question.choices.length<2)errors.push(`invalid-choices:${question?.id}`);
    if(!question?.choices?.includes(question?.answer))errors.push(`answer-not-in-choices:${question?.id}`);
    if(question?.assetId&&!assets?.[question.assetId])errors.push(`missing-asset:${question?.id}:${question.assetId}`);
    if(!question?.source?.label||!question?.source?.page)errors.push(`missing-source:${question?.id}`);
  }
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors)});
}

function shuffle(items,rng=Math.random){
  const output=[...items];
  for(let i=output.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[output[i],output[j]]=[output[j],output[i]];}
  return output;
}

function weakConceptIds(progress){
  return Object.entries(progress?.concepts||{})
    .filter(([,stat])=>(stat?.wrong||0)>(stat?.correct||0)*.45)
    .sort((a,b)=>(b[1].wrong-b[1].correct)-(a[1].wrong-a[1].correct))
    .map(([id])=>id);
}

function createSessionState(mode,selected){
  return {
    mode,questions:selected,index:0,answers:[],correct:0,wrong:0,
    streak:0,bestStreak:0,points:0,completed:false
  };
}

function selectBalancedByUnit(pool,limit,rng){
  const groups=new Map();
  for(const question of pool){
    if(!groups.has(question.unit))groups.set(question.unit,[]);
    groups.get(question.unit).push(question);
  }
  const buckets=shuffle([...groups.entries()],rng).map(([unit,items])=>({unit,items:shuffle(items,rng)}));
  const selected=[];
  while(selected.length<limit&&buckets.some(bucket=>bucket.items.length)){
    for(const bucket of buckets){
      if(selected.length>=limit)break;
      const next=bucket.items.shift();if(next)selected.push(next);
    }
  }
  return shuffle(selected,rng);
}

function selectBalancedByAsset(pool,limit,rng){
  const groups=new Map();
  for(const question of pool){
    const assetId=question.assetId||'no-asset';
    if(!groups.has(assetId))groups.set(assetId,[]);
    groups.get(assetId).push(question);
  }
  const buckets=shuffle([...groups.entries()],rng).map(([assetId,items])=>({assetId,items:shuffle(items,rng)}));
  const selected=[];
  while(selected.length<limit&&buckets.some(bucket=>bucket.items.length)){
    for(const bucket of buckets){
      if(selected.length>=limit)break;
      const next=bucket.items.shift();if(next)selected.push(next);
    }
  }
  return shuffle(selected,rng);
}

function selectExamQuestions(pool,limit,rng){
  if(!limit)return [];
  const imagePool=pool.filter(question=>Boolean(question.assetId));
  const nonImagePool=pool.filter(question=>!question.assetId);
  const imageTarget=Math.min(imagePool.length,limit,Math.max(limit>=10?2:1,Math.round(limit*.2)));
  const imageSelection=selectBalancedByAsset(imagePool,imageTarget,rng);
  const regularTarget=Math.max(0,limit-imageSelection.length);
  const regularSelection=selectBalancedByUnit(nonImagePool,Math.min(regularTarget,nonImagePool.length),rng);
  const used=new Set([...imageSelection,...regularSelection].map(question=>question.id));
  if(imageSelection.length+regularSelection.length<limit){
    const fallback=selectBalancedByUnit(pool.filter(question=>!used.has(question.id)),limit-imageSelection.length-regularSelection.length,rng);
    regularSelection.push(...fallback);
  }
  return shuffle([...imageSelection,...regularSelection],rng);
}

function selectReviewQuestions(questions,reviewQuestionIds,limit,rng){
  const byId=new Map(questions.map(question=>[question.id,question]));
  const targets=reviewQuestionIds.map(id=>byId.get(id)).filter(Boolean);
  if(!targets.length)return [];
  const selected=[];const used=new Set();const concepts=new Set(targets.map(question=>question.concept));
  for(const target of shuffle(targets,rng)){
    const alternatives=questions.filter(question=>question.concept===target.concept&&question.id!==target.id&&!used.has(question.id));
    const pick=shuffle(alternatives,rng)[0]||(!used.has(target.id)?target:null);
    if(pick){selected.push(Object.freeze({...pick,reviewTargetId:target.id}));used.add(pick.id);}
    if(selected.length>=limit)return selected;
  }
  const remaining=shuffle(questions.filter(question=>concepts.has(question.concept)&&!used.has(question.id)),rng);
  selected.push(...remaining.slice(0,limit-selected.length));
  return selected;
}

export function createScienceSession({mode='quick',count,progress,questions=YASSER_SCIENCE_QUESTIONS,rng=Math.random,reviewQuestionIds=[]}={}){
  const safeMode=['quick','images','exam','review'].includes(mode)?mode:'quick';
  const requested=Number(count)||({quick:10,images:8,exam:20,review:10}[safeMode]||10);
  if(safeMode==='review'&&reviewQuestionIds.length){
    const limit=Math.min(requested,reviewQuestionIds.length,questions.length);
    return createSessionState(safeMode,selectReviewQuestions(questions,reviewQuestionIds,limit,rng));
  }
  const pool=safeMode==='images'?questions.filter(item=>Boolean(item.assetId)):questions;
  const limit=Math.min(requested,pool.length);
  if(safeMode==='images')return createSessionState(safeMode,selectBalancedByAsset(pool,limit,rng));
  if(safeMode==='exam')return createSessionState(safeMode,selectExamQuestions(pool,limit,rng));
  const weak=new Set(weakConceptIds(progress));
  const priority=shuffle(pool.filter(item=>weak.has(item.concept)),rng);
  const regular=shuffle(pool.filter(item=>!weak.has(item.concept)),rng);
  const weakSlots=Math.min(Math.ceil(limit*.4),priority.length);
  const selected=[...priority.slice(0,weakSlots),...regular.slice(0,limit-weakSlots)];
  if(selected.length<limit)selected.push(...priority.slice(weakSlots,weakSlots+(limit-selected.length)));
  return createSessionState(safeMode,shuffle(selected,rng));
}

export function submitScienceAnswer({session,answer,answeredAt=new Date().toISOString()}={}){
  if(!session||session.completed||session.index>=session.questions.length)return {accepted:false};
  const question=session.questions[session.index];
  const isCorrect=String(answer)===String(question.answer);
  if(isCorrect){session.correct+=1;session.streak+=1;session.bestStreak=Math.max(session.bestStreak,session.streak);}else{session.wrong+=1;session.streak=0;}
  const earned=isCorrect?10+Math.min(10,Math.floor(Math.max(session.streak-1,0)/3)*2):0;
  session.points+=earned;
  const attempt=Object.freeze({mode:session.mode,questionId:question.id,reviewTargetId:question.reviewTargetId||null,concept:question.concept,unit:question.unit,answer:String(answer),correctAnswer:String(question.answer),isCorrect,earned,answeredAt});
  session.answers.push(attempt);session.index+=1;
  if(session.index>=session.questions.length)session.completed=true;
  return {accepted:true,attempt,question};
}

export function applyScienceAttempt(progress,attempt){
  const next=cloneProgress(progress);const current=next.concepts[attempt.concept]||{correct:0,wrong:0,last:null};
  next.concepts[attempt.concept]={correct:current.correct+(attempt.isCorrect?1:0),wrong:current.wrong+(attempt.isCorrect?0:1),last:attempt.answeredAt};
  next.points+=attempt.earned||0;
  next.attempts.unshift(attempt);next.attempts=next.attempts.slice(0,250);next.updatedAt=attempt.answeredAt;
  return next;
}

export function applyScienceSessionSummary(progress,session){
  const next=cloneProgress(progress);next.bestStreak=Math.max(next.bestStreak||0,session?.bestStreak||0);return next;
}

export function getScienceReviewQuestionIds(progress,{limit=12}={}){
  const misses=[];const seen=new Set();
  for(const attempt of progress?.attempts||[]){
    const targetId=attempt.reviewTargetId||attempt.questionId;
    if(seen.has(targetId))continue;
    seen.add(targetId);
    if(attempt.isCorrect)continue;
    misses.push(targetId);if(misses.length>=limit)break;
  }
  return misses;
}

export function getScienceDashboard(progress){
  const attempts=(progress?.attempts||[]).filter(item=>item.mode!=='review');
  const total=attempts.length;const correct=attempts.filter(item=>item.isCorrect).length;
  const recent=attempts.slice(0,30);const recentCorrect=recent.filter(item=>item.isCorrect).length;
  const accuracy=total?Math.round((correct/total)*100):0;const recentAccuracy=recent.length?Math.round((recentCorrect/recent.length)*100):0;
  const reviewCount=getScienceReviewQuestionIds(progress).length;
  let readiness='ابدأ أول تحدي';
  if(recent.length>=10)readiness=recentAccuracy>=90?'جاهزية قوية':recentAccuracy>=75?'جاهزية جيدة':'تحتاج مراجعة';
  return Object.freeze({total,accuracy,recentAccuracy,reviewCount,readiness,points:progress?.points||0,bestStreak:progress?.bestStreak||0});
}

export function sessionWrongQuestionIds(session){return (session?.answers||[]).filter(item=>!item.isCorrect).map(item=>item.questionId);}
