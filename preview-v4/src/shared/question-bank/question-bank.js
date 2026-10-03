import {createQuestionRecord,validateQuestionRecord} from './question-record.js';

const normalizeText=(value='')=>String(value)
  .trim()
  .toLowerCase()
  .replace(/[أإآ]/g,'ا')
  .replace(/ة/g,'ه')
  .replace(/ى/g,'ي')
  .replace(/[\u064B-\u065F\u0670]/g,'')
  .replace(/[^\p{L}\p{N}]+/gu,' ')
  .replace(/\s+/g,' ')
  .trim();

export function questionFingerprint(record){
  return `${record.subjectId}|${record.gradeId}|${normalizeText(record.prompt)}|${normalizeText(record.answer)}`;
}

export function createQuestionBank(records=[],options={}){
  const questions=Object.freeze(records.map(record=>record?.schemaVersion?record:createQuestionRecord(record)));
  const validation=validateQuestionBank(questions);
  if(options.strict&& !validation.ok)throw new Error(validation.errors.join('\n'));
  return Object.freeze({
    id:options.id||'question-bank',
    version:options.version||1,
    questions,
    validation
  });
}

export function validateQuestionBank(records=[]){
  const errors=[];
  const ids=new Set();
  records.forEach((record,index)=>{
    const result=validateQuestionRecord(record);
    for(const error of result.errors)errors.push(`${record?.id||`#${index+1}`}: ${error}`);
    if(record?.id){
      if(ids.has(record.id))errors.push(`${record.id}: duplicate id`);
      ids.add(record.id);
    }
  });
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors)});
}

function matches(record,filters){
  const scalarFields=['subjectId','gradeId','termId','curriculumYear','unitId','chapterId','lessonId','topicId','conceptId','type','assetId','status'];
  for(const field of scalarFields){
    const expected=filters[field];
    if(expected==null||expected==='')continue;
    const accepted=Array.isArray(expected)?expected:[expected];
    if(!accepted.includes(record[field]))return false;
  }
  if(filters.verified!=null&&record.verified!==filters.verified)return false;
  if(filters.maxSequence!=null&&record.sequence!=null&&record.sequence>filters.maxSequence)return false;
  if(filters.minDifficulty!=null&&record.difficulty<filters.minDifficulty)return false;
  if(filters.maxDifficulty!=null&&record.difficulty>filters.maxDifficulty)return false;
  if(filters.tags?.length&&!filters.tags.every(tag=>record.tags.includes(tag)))return false;
  if(filters.sourceAuthority){
    const accepted=Array.isArray(filters.sourceAuthority)?filters.sourceAuthority:[filters.sourceAuthority];
    if(!record.sources.some(source=>accepted.includes(source.authority)))return false;
  }
  if(filters.examType){
    const accepted=Array.isArray(filters.examType)?filters.examType:[filters.examType];
    if(!record.sources.some(source=>accepted.includes(source.examType)))return false;
  }
  return true;
}

export function queryQuestionBank(bankOrRecords,filters={}){
  const records=Array.isArray(bankOrRecords)?bankOrRecords:(bankOrRecords?.questions||[]);
  return records.filter(record=>matches(record,filters));
}

export function findExactQuestionDuplicates(bankOrRecords){
  const records=Array.isArray(bankOrRecords)?bankOrRecords:(bankOrRecords?.questions||[]);
  const groups=new Map();
  for(const record of records){
    const key=questionFingerprint(record);
    const list=groups.get(key)||[];
    list.push(record.id);
    groups.set(key,list);
  }
  return [...groups.entries()]
    .filter(([,ids])=>ids.length>1)
    .map(([fingerprint,ids])=>Object.freeze({fingerprint,ids:Object.freeze(ids)}));
}

export function getQuestionBankCoverage(bankOrRecords){
  const records=Array.isArray(bankOrRecords)?bankOrRecords:(bankOrRecords?.questions||[]);
  const bySubject={};const byUnit={};const byChapter={};const byType={};
  for(const record of records){
    bySubject[record.subjectId]=(bySubject[record.subjectId]||0)+1;
    byUnit[record.unitId]=(byUnit[record.unitId]||0)+1;
    byChapter[record.chapterId]=(byChapter[record.chapterId]||0)+1;
    byType[record.type]=(byType[record.type]||0)+1;
  }
  return Object.freeze({total:records.length,bySubject:Object.freeze(bySubject),byUnit:Object.freeze(byUnit),byChapter:Object.freeze(byChapter),byType:Object.freeze(byType)});
}
