import { TABLES } from '../domain/constants.js';
import { getTableMastery, getTableAccuracy, getFactMasteryLevel } from '../domain/mastery.js';
import { getOverallProgress } from '../application/progress-service.js';

const FACT_LEVEL_LABELS={
  new:'لم يبدأ',
  learning:'يتعلم',
  good:'جيد',
  mastered:'متقن',
  review:'يحتاج مراجعة'
};

function getTableStatus(state,table){
  const data=state.tables[table],mastery=getTableMastery(state,table);
  if(data.attempts===0)return{label:'لم يبدأ',className:'none'};
  if(mastery>=80)return{label:'متقن',className:'master'};
  if(mastery>=40)return{label:'يتقدم',className:'practice'};
  return{label:'يحتاج تدريب',className:'practice'};
}

function formatSessionDate(value){
  try{return new Date(value).toLocaleString('ar-SA',{dateStyle:'medium',timeStyle:'short'});}catch{return new Date(value).toLocaleString('ar-SA');}
}

export function selectedText(selected){return selected.map(n=>`جدول ${n}`).join(' + ');}

export function renderHome({state,$,all}){
  all('.table-chip').forEach(button=>button.classList.toggle('selected',state.selected.includes(Number(button.dataset.table))));
  $('focusSummary').textContent=selectedText(state.selected);
  $('miniAttempts').textContent=state.totalAttempts;
  $('miniErrors').textContent=state.totalWrong;
  $('progressList').innerHTML=TABLES.map(table=>{
    const mastery=getTableMastery(state,table),shown=state.tables[table].attempts?`${mastery}%`:'—';
    return`<div class="progress-item"><b>${table}</b><div class="bar"><i style="width:${mastery}%"></i></div><span class="pct">${shown}</span></div>`;
  }).join('');
}

export function renderLearn({state,$}){
  $('learnMeta').textContent=selectedText(state.selected);
  $('learnTables').innerHTML=state.selected.map(table=>`<section class="learn-table"><h3>جدول ${table}</h3><div class="facts">${Array.from({length:10},(_,i)=>{const multiplier=i+1;return`<div class="fact"><span>${table} × ${multiplier} =</span><span class="ans">${table*multiplier}</span></div>`;}).join('')}</div></section>`).join('');
  $('toggleAnswers').textContent='اخفِ النتائج';
}

export function renderParentOverview(state){
  const overall=getOverallProgress(state);
  return`<h2>تقرير ياسر</h2>
    <p class="muted">سجل تراكمي محفوظ على هذا الجهاز حاليًا، إلى أن نربطه بالـBackend.</p>
    <div class="parent-tools"><button class="small-btn" id="exportBtn">تنزيل نسخة احتياطية</button></div>
    <div class="parent-cards">
      <div class="parent-card"><span>إجمالي المحاولات</span><strong>${overall.attempts}</strong></div>
      <div class="parent-card"><span>الدقة الحالية</span><strong>${overall.accuracy}%</strong></div>
      <div class="parent-card"><span>الأخطاء التاريخية</span><strong>${overall.wrong}</strong></div>
      <div class="parent-card"><span>جداول بإتقان مؤكد</span><strong>${overall.masteredTables}/10</strong></div>
    </div>
    <div class="metric-guide" role="note">
      <strong>كيف تقرأ التقرير؟</strong>
      <span><b>الدقة الحالية:</b> نسبة الإجابات الصحيحة من جميع المحاولات.</span>
      <span><b>الإتقان المؤكد:</b> لا يُحسب إلا بعد تكرار الإجابة الصحيحة وثباتها، لذلك قد يكون أقل من الدقة.</span>
    </div>
    ${renderReportTable(state)}`;
}

export function renderReportTable(state){
  const rows=TABLES.map(table=>{
    const data=state.tables[table],mastery=getTableMastery(state,table),accuracy=getTableAccuracy(state,table),status=getTableStatus(state,table);
    return`<tr><td><b>جدول ${table}</b></td><td>${data.attempts}</td><td>${data.wrong}</td><td>${accuracy}%</td><td>${mastery}%</td><td class="level ${status.className}">${status.label}</td></tr>`;
  }).join('');
  const cards=TABLES.map(table=>{
    const data=state.tables[table],mastery=getTableMastery(state,table),accuracy=getTableAccuracy(state,table),status=getTableStatus(state,table);
    return`<article class="mobile-table-card">
      <div class="mobile-table-head"><strong>جدول ${table}</strong><span class="level ${status.className}">${status.label}</span></div>
      <div class="mobile-table-metrics"><span>محاولات <b>${data.attempts}</b></span><span>أخطاء <b>${data.wrong}</b></span><span>دقة <b>${accuracy}%</b></span><span>إتقان <b>${mastery}%</b></span></div>
    </article>`;
  }).join('');
  return`<div class="table-scroll report-table-desktop"><table class="table-report"><thead><tr><th>الجدول</th><th>المحاولات</th><th>الأخطاء</th><th>الدقة الحالية</th><th>الإتقان المؤكد</th><th>الحالة</th></tr></thead><tbody>${rows}</tbody></table></div><div class="mobile-table-list">${cards}</div>`;
}

export function renderParentDetails(state){
  const startedTables=TABLES.filter(table=>state.tables[table].attempts>0);
  const unstartedTables=TABLES.filter(table=>state.tables[table].attempts===0);
  const startedMarkup=startedTables.length?startedTables.map(table=>{
    const mastery=getTableMastery(state,table);
    const facts=Array.from({length:10},(_,i)=>{
      const multiplier=i+1,fact=state.tables[table].facts[multiplier],level=getFactMasteryLevel(fact),label=FACT_LEVEL_LABELS[level];
      return`<article class="fact-status-card ${level}">
        <div class="fact-status-head"><strong>${table} × ${multiplier}</strong><span>${label}</span></div>
        <div class="fact-status-meta"><span>${fact.attempts} محاولة</span><span>${fact.wrong} خطأ تاريخي</span></div>
      </article>`;
    }).join('');
    return`<section class="table-detail-section"><div class="table-detail-title"><h3>جدول ${table}</h3><span>إتقان مؤكد ${mastery}%</span></div><div class="fact-status-grid">${facts}</div></section>`;
  }).join(''):'<div class="empty-report-note">لم يبدأ ياسر التدريب على أي جدول حتى الآن.</div>';
  const unstartedMarkup=unstartedTables.length?`<section class="unstarted-tables"><strong>جداول لم يبدأ بها بعد</strong><div>${unstartedTables.map(table=>`<span>جدول ${table}</span>`).join('')}</div></section>`:'';
  return`<h2>تفاصيل الجداول</h2>
    <p class="muted">نعرض هنا الجداول التي تدرب عليها ياسر بالتفصيل. الأخطاء التاريخية لا تُحذف عندما تصبح الإجابات صحيحة لاحقًا.</p>
    ${startedMarkup}${unstartedMarkup}`;
}

export function renderSessions(state){
  if(!state.sessions.length)return'<h2>آخر الجلسات</h2><p class="muted">لا توجد جلسات بعد.</p>';
  const recent=state.sessions.slice(0,20);
  const completed=recent.filter(session=>!session.incomplete).length;
  const totalAnswers=recent.reduce((sum,session)=>sum+Number(session.completed||0),0);
  const totalCorrect=recent.reduce((sum,session)=>sum+Number(session.correct||0),0);
  const recentAccuracy=totalAnswers?Math.round((totalCorrect/totalAnswers)*100):0;
  const rows=recent.map(session=>{
    const accuracy=session.completed?Math.round((session.correct/session.completed)*100):0,type=session.mode==='exam'?'اختبار':'تدريب';
    return`<tr><td>${formatSessionDate(session.endedAt)}</td><td>${type}${session.incomplete?' • غير مكتمل':''}</td><td>${selectedText(session.selected||[])}</td><td>${session.completed}</td><td>${session.correct}</td><td>${session.wrong}</td><td>${accuracy}%</td></tr>`;
  }).join('');
  const cards=recent.map(session=>{
    const accuracy=session.completed?Math.round((session.correct/session.completed)*100):0,type=session.mode==='exam'?'اختبار':'تدريب';
    return`<article class="session-card-mobile">
      <div class="session-card-head"><strong>${type}</strong><span>${accuracy}%</span></div>
      <div class="session-card-date">${formatSessionDate(session.endedAt)}${session.incomplete?' • غير مكتمل':''}</div>
      <div class="session-card-tables">${selectedText(session.selected||[])}</div>
      <div class="session-card-stats"><span>محاولات <b>${session.completed}</b></span><span>صحيح <b>${session.correct}</b></span><span>أخطاء <b>${session.wrong}</b></span></div>
    </article>`;
  }).join('');
  return`<h2>آخر الجلسات</h2>
    <div class="session-overview"><div><span>الجلسات المعروضة</span><strong>${recent.length}</strong></div><div><span>المكتملة</span><strong>${completed}</strong></div><div><span>دقة هذه الجلسات</span><strong>${recentAccuracy}%</strong></div></div>
    <div class="table-scroll sessions-table-desktop"><table class="table-report"><thead><tr><th>الوقت</th><th>النوع</th><th>الجداول</th><th>محاولات</th><th>صحيح</th><th>أخطاء</th><th>الدقة</th></tr></thead><tbody>${rows}</tbody></table></div><div class="session-list-mobile">${cards}</div>`;
}
