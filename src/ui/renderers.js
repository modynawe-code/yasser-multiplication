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
    const data=state.tables[table],mastery=getTableMastery(state,table),accuracy=getTableAccuracy(state,table);
    const status=data.attempts===0?['لم يبدأ','none']:mastery>=80?['متقن','master']:mastery>=40?['يتقدم','practice']:['يحتاج تدريب','practice'];
    return`<tr><td><b>جدول ${table}</b></td><td>${data.attempts}</td><td>${data.wrong}</td><td>${accuracy}%</td><td>${mastery}%</td><td class="level ${status[1]}">${status[0]}</td></tr>`;
  }).join('');
  return`<div class="table-scroll"><table class="table-report"><thead><tr><th>الجدول</th><th>المحاولات</th><th>الأخطاء</th><th>الدقة الحالية</th><th>الإتقان المؤكد</th><th>الحالة</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

export function renderParentDetails(state){
  return`<h2>تفاصيل الجداول</h2>
    <p class="muted">كل مسألة لها سجل مستقل. الأخطاء التاريخية لا تُحذف عندما تصبح الإجابات صحيحة لاحقًا.</p>
    ${TABLES.map(table=>{
      const mastery=getTableMastery(state,table);
      const facts=Array.from({length:10},(_,i)=>{
        const multiplier=i+1,fact=state.tables[table].facts[multiplier],level=getFactMasteryLevel(fact),label=FACT_LEVEL_LABELS[level];
        return`<article class="fact-status-card ${level}">
          <div class="fact-status-head"><strong>${table} × ${multiplier}</strong><span>${label}</span></div>
          <div class="fact-status-meta"><span>${fact.attempts} محاولة</span><span>${fact.wrong} خطأ تاريخي</span></div>
        </article>`;
      }).join('');
      return`<section class="table-detail-section"><div class="table-detail-title"><h3>جدول ${table}</h3><span>إتقان مؤكد ${mastery}%</span></div><div class="fact-status-grid">${facts}</div></section>`;
    }).join('')}`;
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
    return`<tr><td>${new Date(session.endedAt).toLocaleString('ar-SA')}</td><td>${type}${session.incomplete?' • غير مكتمل':''}</td><td>${(session.selected||[]).join(' + ')}</td><td>${session.completed}</td><td>${session.correct}</td><td>${session.wrong}</td><td>${accuracy}%</td></tr>`;
  }).join('');
  return`<h2>آخر الجلسات</h2>
    <div class="session-overview"><div><span>الجلسات المعروضة</span><strong>${recent.length}</strong></div><div><span>المكتملة</span><strong>${completed}</strong></div><div><span>دقة هذه الجلسات</span><strong>${recentAccuracy}%</strong></div></div>
    <div class="table-scroll"><table class="table-report"><thead><tr><th>الوقت</th><th>النوع</th><th>الجداول</th><th>محاولات</th><th>صحيح</th><th>أخطاء</th><th>الدقة</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
