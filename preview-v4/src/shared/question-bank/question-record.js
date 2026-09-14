export const QUESTION_BANK_SCHEMA_VERSION=1;

export const QUESTION_TYPES=Object.freeze([
  'choice',
  'trueFalse',
  'shortAnswer',
  'fillBlank',
  'matching',
  'ordering',
  'imageChoice'
]);

export const SOURCE_AUTHORITIES=Object.freeze([
  'official',
  'regional-exam',
  'school-exam',
  'teacher-model',
  'training-model',
  'worksheet',
  'textbook',
  'study-summary',
  'user-upload',
  'unknown'
]);

const clean=(value)=>typeof value==='string'?value.trim():value;
const freezeList=(items=[])=>Object.freeze([...items]);

function normalizeSource(source,index){
  const item=source||{};
  return Object.freeze({
    id:clean(item.id)||`source-${index+1}`,
    label:clean(item.label)||'',
    provider:clean(item.provider)||'',
    url:clean(item.url)||'',
    year:clean(item.year)||'',
    examType:clean(item.examType)||'',
    authority:SOURCE_AUTHORITIES.includes(item.authority)?item.authority:'unknown',
    kind:clean(item.kind)||'',
    page:item.page??null,
    note:clean(item.note)||''
  });
}

export function createQuestionRecord(input={}){
  const sources=(input.sources||[]).map(normalizeSource);
  const record={
    schemaVersion:QUESTION_BANK_SCHEMA_VERSION,
    id:clean(input.id)||'',
    subjectId:clean(input.subjectId)||'',
    gradeId:clean(input.gradeId)||'',
    termId:clean(input.termId)||'',
    curriculumYear:clean(input.curriculumYear)||'',
    unitId:clean(input.unitId)||'',
    chapterId:clean(input.chapterId)||'',
    lessonId:clean(input.lessonId)||'',
    topicId:clean(input.topicId)||'',
    conceptId:clean(input.conceptId)||'',
    sequence:Number.isFinite(input.sequence)?input.sequence:null,
    type:clean(input.type)||'',
    difficulty:Number.isFinite(input.difficulty)?input.difficulty:1,
    prompt:clean(input.prompt)||'',
    choices:freezeList((input.choices||[]).map(clean)),
    answer:input.answer??'',
    explanation:clean(input.explanation)||'',
    assetId:clean(input.assetId)||'',
    tags:freezeList((input.tags||[]).map(clean).filter(Boolean)),
    sources:Object.freeze(sources),
    verified:Boolean(input.verified),
    duplicateOf:clean(input.duplicateOf)||'',
    status:clean(input.status)||'active',
    legacy:input.legacy?Object.freeze({...input.legacy}):null
  };
  return Object.freeze(record);
}

export function validateQuestionRecord(record){
  const errors=[];
  const required=['id','subjectId','gradeId','termId','unitId','chapterId','conceptId','type','prompt'];
  for(const field of required)if(!record?.[field])errors.push(`${field} is required`);
  if(record?.type&&!QUESTION_TYPES.includes(record.type))errors.push(`unsupported question type: ${record.type}`);
  if(!Number.isFinite(record?.difficulty)||record.difficulty<1||record.difficulty>5)errors.push('difficulty must be between 1 and 5');
  if(['choice','trueFalse','imageChoice'].includes(record?.type)){
    if(!Array.isArray(record?.choices)||record.choices.length<2)errors.push('choice question requires at least two choices');
    if(!record?.choices?.includes(record?.answer))errors.push('answer must match one of the choices');
  }else if(record?.answer===''||record?.answer==null){
    errors.push('answer is required');
  }
  if(!Array.isArray(record?.sources)||record.sources.length===0)errors.push('at least one source is required');
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors)});
}
