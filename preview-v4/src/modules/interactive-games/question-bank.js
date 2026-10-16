const STORAGE_KEY='independent-games-question-bank-v1';
const SEED_VERSION_KEY=`${STORAGE_KEY}:seed-version`;
const IMPORT_METADATA=[
  'grade','semester','subject','lesson','schoolYear','sourceUrl','documentUrl','sourcePage','documentPage',
  'questionType','options','sources','contexts','category','subCategory','difficulty','audience','language',
  'tags','acceptedAnswers','reviewStatus','enabledForPlay','duplicateOf','batch','originalText','originalAnswer',
  'notes','country','capital','region'
];

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

function contextOf(item){
  return Object.fromEntries(
    ['grade','semester','subject','lesson','schoolYear','sourceUrl','documentUrl','sourcePage','documentPage','category','subCategory','batch']
      .filter(key=>item[key]!==undefined)
      .map(key=>[key,item[key]])
  );
}

function mergeQuestion(existing,incoming,{preserveId=false}={}){
  const sources=[...new Set([...(existing.sources||[existing.source]),...(incoming.sources||[incoming.source])].filter(Boolean))];
  const contexts=[...(existing.contexts||[contextOf(existing)]),...(incoming.contexts||[contextOf(incoming)])];
  const uniqueContexts=[...new Map(contexts.map(context=>[JSON.stringify(context),context])).values()];
  const tags=[...new Set([...(Array.isArray(existing.tags)?existing.tags:[]),...(Array.isArray(incoming.tags)?incoming.tags:[])])];
  const acceptedAnswers=[...new Set([...(Array.isArray(existing.acceptedAnswers)?existing.acceptedAnswers:[]),...(Array.isArray(incoming.acceptedAnswers)?incoming.acceptedAnswers:[])])];
  return Object.freeze({
    ...existing,
    ...incoming,
    id:preserveId?existing.id:incoming.id,
    sources,
    contexts:uniqueContexts,
    ...(tags.length?{tags}:{}),
    ...(acceptedAnswers.length?{acceptedAnswers}:{})
  });
}

export function mergeGameQuestionBanks(...banks){
  const result=[],byId=new Map(),byContent=new Map();
  const register=question=>{
    byId.set(question.id,question);
    byContent.set(`${normalizedKey(question.text)}|${normalizedKey(question.answer)}`,question);
  };
  for(const item of banks.flat()){
    const question=normalizeGameQuestion(item,result.length);if(!question)continue;
    const contentKey=`${normalizedKey(question.text)}|${normalizedKey(question.answer)}`;
    const existingById=byId.get(question.id);
    const existing=existingById||byContent.get(contentKey);
    if(!existing){result.push(question);register(question);continue;}
    const merged=mergeQuestion(existing,question,{preserveId:!existingById});
    const at=result.indexOf(existing);if(at>=0)result[at]=merged;
    byId.delete(existing.id);
    byContent.delete(`${normalizedKey(existing.text)}|${normalizedKey(existing.answer)}`);
    register(merged);
  }
  return result;
}

export function isPlayableGameQuestion(question){
  if(!question)return false;
  if(question.enabledForPlay===false)return false;
  return !['pending_review','needs_revision','duplicate'].includes(String(question.reviewStatus||''));
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
  const difficultyOrder={easy:0,medium:1,hard:2};
  return bank.map((question,index)=>({question,index})).sort((a,b)=>{
    const qa=a.question,qb=b.question,hasA=hasCurriculumScope(qa),hasB=hasCurriculumScope(qb);
    if(hasA!==hasB)return hasA?-1:1;
    if(hasA){
      const termDiff=Number(qa.semester)-Number(qb.semester);if(termDiff)return termDiff;
      const gradeDiff=Number(qa.grade)-Number(qb.grade);if(gradeDiff)return gradeDiff;
      const subjects=subjectOrder.get(`${Number(qa.grade)}:${Number(qa.semester)}`);
      const subjectDiff=subjects.get(qa.subject)-subjects.get(qb.subject);if(subjectDiff)return subjectDiff;
      return a.index-b.index;
    }
    const categoryA=String(qa.category||''),categoryB=String(qb.category||'');
    if(Boolean(categoryA)!==Boolean(categoryB))return categoryA?-1:1;
    const categoryDiff=categoryA.localeCompare(categoryB,'ar');if(categoryDiff)return categoryDiff;
    const subDiff=String(qa.subCategory||'').localeCompare(String(qb.subCategory||''),'ar');if(subDiff)return subDiff;
    const difficultyDiff=(difficultyOrder[qa.difficulty]??9)-(difficultyOrder[qb.difficulty]??9);if(difficultyDiff)return difficultyDiff;
    return a.index-b.index;
  }).map(entry=>entry.question);
}

export function nextGameQuestion(questions,askedIds=[]){
  const bank=orderCurriculumQuestions(questions).filter(isPlayableGameQuestion);
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