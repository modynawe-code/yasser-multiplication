const STORAGE_KEY='independent-games-question-bank-v1';
const SEED_VERSION_KEY=`${STORAGE_KEY}:seed-version`;
const IMPORT_METADATA=['grade','semester','subject','lesson','schoolYear','sourceUrl','documentUrl','sourcePage','documentPage','questionType','options','sources','contexts'];

function normalizedKey(value){
  return String(value||'').normalize('NFKC').toLowerCase()
    .replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[\u064B-\u065F\u0670\u0640]/g,'')
    .replace(/[أإآٱ]/g,'ا').replace(/[ى]/g,'ي')
    .replace(/[\s\p{P}\p{S}]+/gu,'');
}

export function normalizeGameQuestion(value,index=0){
  if(typeof value==='string')value={text:value};
  const text=String(value?.text||'').trim();
  if(!text)return null;
  const normalized={id:String(value.id||`manual-${index}-${text}`),text,answer:String(value.answer||'').trim(),source:value.source||'manual'};
  for(const key of IMPORT_METADATA){if(value[key]!==undefined)normalized[key]=value[key];}
  return Object.freeze(normalized);
}

export function mergeGameQuestionBanks(...banks){
  const result=[],byContent=new Map();
  for(const item of banks.flat()){
    const question=normalizeGameQuestion(item,result.length);if(!question)continue;
    const key=`${normalizedKey(question.text)}|${normalizedKey(question.answer)}`;
    const existing=byContent.get(key);
    if(!existing){byContent.set(key,question);result.push(question);continue;}
    const sources=[...new Set([...(existing.sources||[existing.source]),...(question.sources||[question.source])].filter(Boolean))];
    const contextOf=item=>Object.fromEntries(['grade','semester','subject','lesson','schoolYear','sourceUrl','documentUrl','sourcePage','documentPage'].filter(key=>item[key]!==undefined).map(key=>[key,item[key]]));
    const contexts=[...(existing.contexts||[contextOf(existing)]),...(question.contexts||[contextOf(question)])];
    const uniqueContexts=[...new Map(contexts.map(context=>[JSON.stringify(context),context])).values()];
    const merged=Object.freeze({...existing,sources,contexts:uniqueContexts});
    byContent.set(key,merged);result[result.indexOf(existing)]=merged;
  }
  return result;
}

export function orderCurriculumQuestions(questions){
  const bank=(Array.isArray(questions)?questions:[]).map(normalizeGameQuestion).filter(Boolean);
  const subjectOrder=new Map();
  const hasCurriculumScope=question=>question.grade!==undefined&&question.grade!==null&&question.grade!==''&&question.semester!==undefined&&question.semester!==null&&question.semester!==''&&Boolean(question.subject)&&Number.isFinite(Number(question.grade))&&Number.isFinite(Number(question.semester));
  for(const question of bank){
    if(!hasCurriculumScope(question))continue;
    const termKey=`${Number(question.grade)}:${Number(question.semester)}`;
    if(!subjectOrder.has(termKey))subjectOrder.set(termKey,new Map());
    const subjects=subjectOrder.get(termKey);
    if(!subjects.has(question.subject))subjects.set(question.subject,subjects.size);
  }
  return bank.map((question,index)=>({question,index})).sort((a,b)=>{
    const qa=a.question,qb=b.question,hasA=hasCurriculumScope(qa),hasB=hasCurriculumScope(qb);
    if(hasA!==hasB)return hasA?-1:1;
    if(!hasA)return a.index-b.index;
    const termDiff=Number(qa.semester)-Number(qb.semester);if(termDiff)return termDiff;
    const gradeDiff=Number(qa.grade)-Number(qb.grade);if(gradeDiff)return gradeDiff;
    const subjects=subjectOrder.get(`${Number(qa.grade)}:${Number(qa.semester)}`);
    const subjectDiff=subjects.get(qa.subject)-subjects.get(qb.subject);if(subjectDiff)return subjectDiff;
    return a.index-b.index;
  }).map(entry=>entry.question);
}

export function nextGameQuestion(questions,askedIds=[]){
  const bank=orderCurriculumQuestions(questions);
  if(!bank.length)return{question:null,askedIds:[...askedIds],cycleRestarted:false};
  const asked=new Set(askedIds),available=bank.filter(question=>!asked.has(question.id));
  const question=available[0]||null;
  return{question,askedIds:question?[...askedIds,question.id]:[...askedIds],cycleRestarted:false};
}

export function loadGameQuestionBank(storage=globalThis.localStorage,seedQuestions=[],seedVersion=''){
  let parsed=[];
  try{const value=JSON.parse(storage?.getItem(STORAGE_KEY)||'[]');parsed=Array.isArray(value)?orderCurriculumQuestions(value):[];}catch{/* A malformed local bank remains recoverable through the manual editor. */}
  if(!storage||!seedQuestions.length||!seedVersion)return parsed;
  try{
    if(storage.getItem(SEED_VERSION_KEY)===seedVersion)return parsed;
    const merged=orderCurriculumQuestions(mergeGameQuestionBanks(parsed,seedQuestions));
    storage.setItem(STORAGE_KEY,JSON.stringify(merged));
    storage.setItem(SEED_VERSION_KEY,seedVersion);
    return merged;
  }catch{return orderCurriculumQuestions(mergeGameQuestionBanks(parsed,seedQuestions));}
}
export function saveGameQuestionBank(questions,storage=globalThis.localStorage){
  const normalized=orderCurriculumQuestions(mergeGameQuestionBanks(Array.isArray(questions)?questions:[]));
  try{storage?.setItem(STORAGE_KEY,JSON.stringify(normalized));}catch{/* A full or unavailable store leaves this session usable. */}
  return normalized;
}
export function gameQuestionBankStorageKey(){return STORAGE_KEY;}
