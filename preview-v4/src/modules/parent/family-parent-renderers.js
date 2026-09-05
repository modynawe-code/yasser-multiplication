import { getOverallProgress, getProgressRows } from '../../application/progress-service.js';
import { KHALED_SKILLS } from '../khaled/domain/curriculum.js';

function pct(correct,total){return total?Math.round(correct/total*100):0;}
function formatDate(value){
  try{return new Date(value).toLocaleString('ar-SA',{dateStyle:'medium',timeStyle:'short'});}catch{return value||'—';}
}

function khaledSkillStatus(item){
  const accuracy=pct(item.correct,item.attempts);
  const recent=item.recent||[];
  const recentAccuracy=recent.length?pct(recent.filter(Boolean).length,recent.length):0;
  if(!item.attempts)return{label:'لم يبدأ',className:'none'};
  if(item.attempts>=10&&accuracy>=85&&recent.length>=5&&recentAccuracy>=80)return{label:'متقن مبدئيًا',className:'master'};
  if(accuracy>=70)return{label:'يتقدم',className:'practice'};
  return{label:'يحتاج تدريب',className:'practice'};
}

export function familyOverview(yasserState,khaledState){
  const yasser=getOverallProgress(yasserState);
  const khaledAccuracy=pct(khaledState.totalCorrect,khaledState.totalAttempts);
  const khaledStarted=KHALED_SKILLS.filter(skill=>(khaledState.skills[skill.id]?.attempts||0)>0).length;
  const totalAttempts=yasser.attempts+khaledState.totalAttempts;
  const totalWrong=yasser.wrong+khaledState.totalWrong;
  return`<h2>تقرير ياسر وخالد</h2>
    <p class="muted">ملخص موحد للتقدم المحفوظ على هذا الجهاز. سجل الأخطاء تاريخي ولا يختفي عند تحسن الإجابة لاحقًا.</p>
    <div class="parent-tools"><button class="small-btn" id="familyExportBtn">تنزيل نسخة احتياطية موحدة</button></div>
    <div class="parent-cards family-summary-cards">
      <div class="parent-card"><span>المحاولات معًا</span><strong>${totalAttempts}</strong></div>
      <div class="parent-card"><span>الأخطاء التاريخية</span><strong>${totalWrong}</strong></div>
      <div class="parent-card"><span>دقة ياسر</span><strong>${yasser.accuracy}%</strong></div>
      <div class="parent-card"><span>دقة خالد</span><strong>${khaledAccuracy}%</strong></div>
    </div>
    <div class="family-learner-summary-grid">
      <article class="family-learner-summary yasser"><div><span>ياسر</span><strong>جدول الضرب</strong></div><dl><div><dt>محاولات</dt><dd>${yasser.attempts}</dd></div><div><dt>جداول متقنة</dt><dd>${yasser.masteredTables}/10</dd></div><div><dt>أخطاء</dt><dd>${yasser.wrong}</dd></div></dl></article>
      <article class="family-learner-summary khaled"><div><span>خالد</span><strong>رياضيات أول ابتدائي</strong></div><dl><div><dt>محاولات</dt><dd>${khaledState.totalAttempts}</dd></div><div><dt>مهارات بدأها</dt><dd>${khaledStarted}/${KHALED_SKILLS.length}</dd></div><div><dt>أخطاء</dt><dd>${khaledState.totalWrong}</dd></div></dl></article>
    </div>`;
}

export function familyYasserReport(state){
  const overall=getOverallProgress(state);
  const rows=getProgressRows(state).map(row=>`<tr><td><b>جدول ${row.table}</b></td><td>${row.attempts}</td><td>${row.wrong}</td><td>${row.accuracy}%</td><td>${row.mastery}%</td></tr>`).join('');
  return`<h2>ياسر — جدول الضرب</h2><div class="parent-cards"><div class="parent-card"><span>المحاولات</span><strong>${overall.attempts}</strong></div><div class="parent-card"><span>الدقة</span><strong>${overall.accuracy}%</strong></div><div class="parent-card"><span>الأخطاء</span><strong>${overall.wrong}</strong></div><div class="parent-card"><span>المتقن</span><strong>${overall.masteredTables}/10</strong></div></div><div class="table-scroll"><table class="table-report"><thead><tr><th>الجدول</th><th>محاولات</th><th>أخطاء</th><th>دقة</th><th>إتقان</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

export function familyKhaledReport(state){
  const accuracy=pct(state.totalCorrect,state.totalAttempts);
  const cards=KHALED_SKILLS.map(skill=>{
    const item=state.skills[skill.id]||{attempts:0,correct:0,wrong:0,recent:[]};
    const status=khaledSkillStatus(item);
    const skillAccuracy=pct(item.correct,item.attempts);
    return`<article class="family-skill-card"><div class="family-skill-head"><span class="khaled-skill-symbol">${skill.symbol}</span><div><strong>${skill.title}</strong><small>${skill.shortTitle}</small></div><em class="level ${status.className}">${status.label}</em></div><div class="family-skill-metrics"><span>محاولات <b>${item.attempts}</b></span><span>أخطاء <b>${item.wrong}</b></span><span>دقة <b>${skillAccuracy}%</b></span></div></article>`;
  }).join('');
  return`<h2>خالد — رياضيات أول ابتدائي</h2><p class="muted">الحالة هنا تدريبية. «متقن مبدئيًا» تتطلب عددًا كافيًا من المحاولات مع ثبات الدقة في الأسئلة الأخيرة.</p><div class="parent-cards"><div class="parent-card"><span>المحاولات</span><strong>${state.totalAttempts}</strong></div><div class="parent-card"><span>الدقة</span><strong>${accuracy}%</strong></div><div class="parent-card"><span>الصحيح</span><strong>${state.totalCorrect}</strong></div><div class="parent-card"><span>الأخطاء</span><strong>${state.totalWrong}</strong></div></div><div class="family-skill-grid">${cards}</div>`;
}

export function familySessions(yasserState,khaledState){
  const yasser=(yasserState.sessions||[]).map(session=>({
    learner:'ياسر',
    at:session.endedAt,
    label:session.mode==='exam'?'اختبار جدول الضرب':'تدريب جدول الضرب',
    correct:Number(session.correct||0),
    wrong:Number(session.wrong||0),
    total:Number(session.completed||0),
    incomplete:Boolean(session.incomplete)
  }));
  const khaled=(khaledState.sessions||[]).map(session=>({
    learner:'خالد',
    at:session.at,
    label:KHALED_SKILLS.find(skill=>skill.id===session.skillId)?.title||'رياضيات خالد',
    correct:Number(session.correct||0),
    wrong:Number(session.wrong||0),
    total:Number(session.total||0),
    incomplete:Boolean(session.incomplete)
  }));
  const sessions=[...yasser,...khaled].sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0,30);
  if(!sessions.length)return'<h2>آخر الجلسات</h2><p class="muted">لا توجد جلسات مسجلة حتى الآن.</p>';
  const rows=sessions.map(session=>`<tr><td>${formatDate(session.at)}</td><td><b>${session.learner}</b></td><td>${session.label}${session.incomplete?' • غير مكتمل':''}</td><td>${session.total}</td><td>${session.correct}</td><td>${session.wrong}</td><td>${pct(session.correct,session.total)}%</td></tr>`).join('');
  return`<h2>آخر الجلسات</h2><p class="muted">مرتبة من الأحدث إلى الأقدم لكلا الطفلين.</p><div class="table-scroll"><table class="table-report"><thead><tr><th>الوقت</th><th>الطفل</th><th>النشاط</th><th>محاولات</th><th>صحيح</th><th>أخطاء</th><th>الدقة</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
