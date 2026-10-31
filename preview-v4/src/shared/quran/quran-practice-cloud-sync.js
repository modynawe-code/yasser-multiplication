import {loadQuranPractice,practiceStorageKey,validPracticeVerse} from './quran-practice-progress.js';

const LEARNERS=['yasser','khaled','mashaal'];
const KIND='family-quran-practice-v1';
const STAGES={listened:0,repeated:1,reviewed:2};
const MAX_ITEMS=1000,CHUNK_SIZE=30;
const cleanDate=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))?value:null;

function normalized(value,learner){
  const source=value?.version===1&&value.records&&typeof value.records==='object'?value.records:{};
  const records={};
  for(const [key,item] of Object.entries(source).slice(-MAX_ITEMS)){
    const parts=/^(\d{1,3}):(\d{1,3})$/.exec(key);
    if(!parts||!validPracticeVerse(+parts[1],+parts[2])||!(item?.stage in STAGES)
      ||learner==='mashaal'&&item.stage==='reviewed')continue;
    const updatedAt=cleanDate(item.updatedAt);
    const attempts=Number(item.attempts);
    if(!updatedAt||!Number.isInteger(attempts)||attempts<0||attempts>99999)continue;
    records[key]={stage:item.stage,attempts,updatedAt};
  }
  const l=value?.last;
  const last=l&&validPracticeVerse(Number(l.surahNumber),Number(l.ayahNumber))
    &&cleanDate(l.updatedAt)&&l.stage in STAGES
    &&!(learner==='mashaal'&&l.stage==='reviewed')
    ?{surahNumber:Number(l.surahNumber),ayahNumber:Number(l.ayahNumber),
      stage:l.stage,updatedAt:l.updatedAt}:null;
  return {version:1,records,last};
}

export function mergeQuranPracticeSnapshots(left,right,learnerId){
  if(!LEARNERS.includes(learnerId))throw new Error('invalid-quran-learner');
  const a=normalized(left,learnerId),b=normalized(right,learnerId),records={...a.records};
  for(const [key,item] of Object.entries(b.records)){
    const prev=records[key];
    if(!prev){records[key]=item;continue;}
    const latest=Date.parse(item.updatedAt)>Date.parse(prev.updatedAt)?item:prev;
    records[key]={
      stage:STAGES[item.stage]>STAGES[prev.stage]?item.stage:prev.stage,
      attempts:Math.max(item.attempts,prev.attempts),
      updatedAt:latest.updatedAt
    };
  }
  const ordered=Object.entries(records).sort((a,b)=>
    Date.parse(a[1].updatedAt)-Date.parse(b[1].updatedAt)).slice(-MAX_ITEMS);
  const aDate=Date.parse(a.last?.updatedAt||0),bDate=Date.parse(b.last?.updatedAt||0);
  return {version:1,records:Object.fromEntries(ordered),
    last:bDate>aDate?b.last:a.last};
}

function hashRecord(text){
  let h=2166136261;
  for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
  return (h>>>0).toString(16).padStart(8,'0');
}

export function extractRemoteQuranPractice(snapshot,learner){
  let merged={version:1,records:{},last:null};
  for(const event of Array.isArray(snapshot?.sessions)?snapshot.sessions:[]){
    if(event?.learnerId!==learner||event?.session?.kind!==KIND
      ||event.session.learnerId!==learner)continue;
    merged=mergeQuranPracticeSnapshots(merged,event.session.practice,learner);
  }
  return merged;
}

export function createQuranPracticeCloudSync({authClient,storage=globalThis.localStorage}={}){
  if(!authClient?.request||!authClient?.isAuthenticated)throw new Error('auth required');
  let active=null;
  const sync=()=>{
    if(active)return active;
    active=(async()=>{
      if(!authClient.isAuthenticated())return {ok:false,reason:'not-connected'};
      // Read cloud BEFORE uploading to preserve work done on another device.
      const snapshot=await authClient.request('/v1/sync/snapshot');
      let restored=0,sent=0;
      for(const learner of LEARNERS){
        const key=practiceStorageKey(learner);
        const local=loadQuranPractice(learner,{storage});
        const remote=extractRemoteQuranPractice(snapshot,learner);
        const merged=mergeQuranPracticeSnapshots(local,remote,learner);
        const rows=Object.entries(merged.records).sort(([a],[b])=>a.localeCompare(b));
        // Never replace local progress until a consistent merge was validated.
        if(JSON.stringify(merged)!==JSON.stringify(local)){
          storage.setItem(key,JSON.stringify(merged));restored++;
        }
        for(let i=0;i<rows.length;i+=CHUNK_SIZE){
          const group=Object.fromEntries(rows.slice(i,i+CHUNK_SIZE));
          const last=i+CHUNK_SIZE>=rows.length?merged.last:null;
          const practice={version:1,records:group,last};
          const blob=JSON.stringify(practice);
          const id='quran-'+learner+'-'+hashRecord(blob)+'-'+hashRecord(blob.split('').reverse().join(''));
          await authClient.request('/v1/sync/session',{method:'POST',body:{
            sessionId:id,learnerId:learner,skillId:KIND,mode:'self-report',
            startedAt:null,endedAt:last?.updatedAt||null,
            correct:0,wrong:0,total:Object.keys(group).length,incomplete:false,
            session:{kind:KIND,learnerId:learner,practice}
          }});
          sent++;
        }
      }
      return {ok:true,restored,uploadedChunks:sent};
    })().finally(()=>{active=null;});
    return active;
  };
  return Object.freeze({sync});
}
