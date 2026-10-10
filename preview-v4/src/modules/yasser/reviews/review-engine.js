import {gradeAnswer,summarize,motivationFor} from './math-grade6-data.js';
export const storageKeyFor=id=>`family:yasser:grade6:${id}:northelite:v1`;
export function gradeReviewAnswer(q,values){
 if(q.lang!=='en')return gradeAnswer(q,values);
 const normal=v=>String(v??'').normalize('NFKC').toLowerCase().trim().replace(/[‘’]/g,"'").replace(/[.!?]+$/,'').replace(/\s+/g,' ').trim();
 return q.fields.map((f,i)=>f.accepted.some(a=>normal(a)===normal(values?.[i])));
}
export function summarizeReview(qs,responses){
 const eligible=qs.filter(q=>!q.sourceIssue),resolved=Object.fromEntries(Object.entries(responses).filter(([,r])=>!r.pending));
 const s=summarize(eligible,resolved),pending=eligible.filter(q=>responses[q.id]?.pending).length;
 return {...s,percent:eligible.length?s.percent:0,unanswered:s.unanswered-pending,pending,excluded:qs.length-eligible.length,selfReviewed:eligible.filter(q=>responses[q.id]?.selfReviewed).length};
}
export function summarizeHistory(history,qs){
 const completed=history.filter(h=>h.finished&&h.summary),full=completed.filter(h=>h.mode==='exam'&&!h.summary.pending&&h.ids.length===qs.length&&qs.every(q=>h.ids.includes(q.id))),last=full.at(-1),previous=full.at(-2);
 return {total:completed.length,exams:completed.filter(h=>h.mode==='exam').length,training:completed.filter(h=>h.mode==='train').length,bestFullExam:full.length?Math.max(...full.map(h=>h.summary.percent)):null,improvement:last&&previous?last.summary.percent-previous.summary.percent:null};
}
export function encouragement(responses){return motivationFor(Object.fromEntries(Object.entries(responses).filter(([,r])=>!r.pending)));}

// Fisher–Yates: persist the result once per attempt, never shuffle during rendering.
export function shuffleReviewItems(items,random=Math.random){
 const result=[...items];
 for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
 return result;
}
export function canShuffleReviewChoices(q){
 return Array.isArray(q.choices)&&q.choices.length>1&&q.shuffleChoices!==false
  &&!q.choices.some(c=>/جميع ما سبق|كل ما سبق|كلا ما سبق|الاختيار [أبجده]|all of the above|none of the above|both [a-d] and [a-d]/i.test(c));
}
export function createReviewAttempt(qs,{mode,ids=qs.map(q=>q.id),history=[],active=null,random=Math.random,randomize=true,startedAt=new Date().toISOString()}={}){
 const firstTraining=mode==='train'&&!history.some(a=>a.mode==='train')&&active?.mode!=='train'
  &&ids.length===qs.length&&qs.every(q=>ids.includes(q.id));
 const orderedIds=randomize&&!firstTraining?shuffleReviewItems(ids,random):[...ids];
 const choiceOrders={};
 if(randomize)for(const id of orderedIds){const q=qs.find(q=>q.id===id);if(canShuffleReviewChoices(q))choiceOrders[id]=shuffleReviewItems(q.choices,random);}
 return {mode,ids:orderedIds,choiceOrders,index:0,responses:{},drafts:{},startedAt,finished:false};
}
export function questionForReviewAttempt(q,attempt){
 const order=attempt?.choiceOrders?.[q.id];
 // Legacy attempts keep their original choice order and all saved answers.
 if(!Array.isArray(order)||!q.choices||order.length!==q.choices.length||new Set(order).size!==new Set(q.choices).size||!order.every(c=>q.choices.includes(c)))return q;
 return {...q,choices:order};
}
export function sameReviewQuestionSet(a,b){return a.length===b.length&&new Set(a).size===new Set(b).size&&a.every(id=>b.includes(id));}
