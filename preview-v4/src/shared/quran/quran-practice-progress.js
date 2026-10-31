// Separate, local-only per-learner Quran practice log. Do not overwrite the
// family's existing curriculum, page mastery, or parent evidence storage.
const BASE='family-learning:quran-practice:v1:';
const LEARNERS=new Set(['yasser','khaled','mashaal']);
const STAGES=new Set(['listened','repeated','reviewed']);
const MAX_SURAHS=114;
const MAX_VERSES=286;
const MAX_RECORDS=1000;

export function practiceStorageKey(learnerId){
  return LEARNERS.has(learnerId)?BASE+learnerId:null;
}
export function validPracticeVerse(surahNumber,ayahNumber){
  return Number.isInteger(surahNumber)&&surahNumber>=1&&surahNumber<=MAX_SURAHS
    &&Number.isInteger(ayahNumber)&&ayahNumber>=1&&ayahNumber<=MAX_VERSES;
}
function normalize(raw){
  if(raw?.version!==1||typeof raw.records!=='object'||Array.isArray(raw.records)||raw.records===null)
    return {version:1,records:{},last:null};
  const entries=Object.entries(raw.records).filter(([key,record])=>{
    const parts=/^(\d{1,3}):(\d{1,3})$/.exec(key);
    const surah=Number(parts?.[1]),verse=Number(parts?.[2]);
    return validPracticeVerse(surah,verse)&&record&&STAGES.has(record.stage)
      &&Number.isInteger(record.attempts)&&record.attempts>=0&&record.attempts<100000
      &&typeof record.updatedAt==='string';
  }).slice(-MAX_RECORDS);
  return {version:1,records:Object.fromEntries(entries),
    last:raw.last&&validPracticeVerse(raw.last.surahNumber,raw.last.ayahNumber)?raw.last:null};
}
export function loadQuranPractice(learnerId,{storage=globalThis.localStorage}={}){
  const key=practiceStorageKey(learnerId);
  if(!key)return {version:1,records:{},last:null};
  try{return normalize(JSON.parse(storage?.getItem(key)||'null'));}catch{return {version:1,records:{},last:null};}
}
export function markQuranPractice(learnerId,{surahNumber,fromAyah,toAyah,stage},{
  storage=globalThis.localStorage,now=()=>new Date().toISOString()
}={}){
  const key=practiceStorageKey(learnerId),from=Number(fromAyah),to=Number(toAyah),surah=Number(surahNumber);
  if(!key||!validPracticeVerse(surah,from)||!validPracticeVerse(surah,to)||to<from
    ||to-from>50||!STAGES.has(stage)||learnerId==='mashaal'&&stage==='reviewed')return false;
  const current=loadQuranPractice(learnerId,{storage}),date=now();
  if(typeof date!=='string'||date.length>50)return false;
  const records={...current.records};
  for(let ayah=from;ayah<=to;ayah++){
    const id=surah+':'+ayah,previous=records[id];
    const rank={listened:0,repeated:1,reviewed:2};
    const nextStage=previous&&rank[previous.stage]>rank[stage]?previous.stage:stage;
    records[id]={stage:nextStage,attempts:Math.min(99999,(previous?.attempts||0)+1),updatedAt:date};
  }
  const bounded=Object.fromEntries(Object.entries(records).slice(-MAX_RECORDS));
  const updated={version:1,records:bounded,last:{surahNumber:surah,ayahNumber:from,stage,updatedAt:date}};
  try{
    storage?.setItem(key,JSON.stringify(updated));
    // Notify the existing family sync cycle; offline learners keep local state.
    try{globalThis.dispatchEvent?.(new Event('family:quran-practice-changed'));}catch{}
    return true;
  }catch{return false;}
}
export function getQuranPracticeStage(learnerId,surahNumber,ayahNumber,{storage=globalThis.localStorage}={}){
  if(!validPracticeVerse(surahNumber,ayahNumber))return null;
  return loadQuranPractice(learnerId,{storage}).records[surahNumber+':'+ayahNumber]||null;
}
