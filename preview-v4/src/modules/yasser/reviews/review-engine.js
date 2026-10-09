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
