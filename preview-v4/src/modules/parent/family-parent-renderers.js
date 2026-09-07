import { KHALED_SKILLS } from '../khaled/domain/curriculum.js';
import { summarizeLearningAttempts,summarizeLearningWindows,learningLevel } from '../../shared/progress/learning-metrics.js';

function pct(correct,total){return total?Math.round(correct/total*100):0;}
function formatDate(value){try{return new Date(value).toLocaleString('ar-SA',{dateStyle:'medium',timeStyle:'short'});}catch{return value||'—';}}
function metricCard(label,value,sub=''){return `<div class="parent-card"><span>${label}</span><strong>${value}</strong>${sub?`<small>${sub}</small>`:''}</div>`;}
function windowStrip(label,summary){return `<article class="family-window-card"><h3>${label}</h3><dl><div><dt>الأسئلة</dt><dd>${summary.questions}</dd></div><div><dt>صح من أول مرة</dt><dd>${summary.firstTryAccuracy}%</dd></div><div><dt>النجاح النهائي</dt><dd>${summary.finalSuccessRate}%</dd></div><div><dt>الإتقان</dt><dd>${summary.masteryScore}%</dd></div></dl></article>`;}
function skillSummary(log,learnerId,skillId){const summary=summarizeLearningAttempts(log,{learnerId,skillId});return{summary,level:learningLevel(summary)};}

export function familyOverview(yasserState,khaledState){
  const yasser=summarizeLearningWindows(yasserState.attemptLog,{learnerId:'yasser'}),khaled=summarizeLearningWindows(khaledState.attemptLog,{learnerId:'khaled'});
  const totalQuestions=yasser.all.questions+khaled.all.questions,totalErrors=yasser.all.historicalErrors+khaled.all.historicalErrors;
  return`<h2>تقرير ياسر وخالد</h2>
    <p class="muted">التقدم الحقيقي لا يُصفّر. «اليوم» و«هذا الأسبوع» نوافذ عرض فقط، بينما السجل الكامل يبقى محفوظًا.</p>
    <div class="parent-tools"><button class="small-btn" id="familyExportBtn">تنزيل نسخة احتياطية موحدة</button></div>
    <div class="parent-cards family-summary-cards">
      ${metricCard('الأسئلة المكتملة',totalQuestions,'لياسر وخالد')}
      ${metricCard('الأخطاء التاريخية',totalErrors,'لا تُحذف عند التصحيح')}
      ${metricCard('إتقان ياسر',`${yasser.all.masteryScore}%`,'وزن التصحيح أقل من أول محاولة')}
      ${metricCard('إتقان خالد',`${khaled.all.masteryScore}%`,'وزن التصحيح أقل من أول محاولة')}
    </div>
    <div class="family-period-section"><h3>ياسر</h3><div class="family-window-grid">${windowStrip('اليوم',yasser.today)}${windowStrip('هذا الأسبوع',yasser.week)}${windowStrip('كل الوقت',yasser.all)}</div></div>
    <div class="family-period-section khaled-period"><h3>خالد</h3><div class="family-window-grid">${windowStrip('اليوم',khaled.today)}${windowStrip('هذا الأسبوع',khaled.week)}${windowStrip('كل الوقت',khaled.all)}</div></div>`;
}

export function familyYasserReport(state){
  const windows=summarizeLearningWindows(state.attemptLog,{learnerId:'yasser'}),rows=[];let mastered=0;
  for(let table=1;table<=10;table++){
    const {summary,level}=skillSummary(state.attemptLog,'yasser',`table-${table}`);if(['mastered','expert'].includes(level.id))mastered++;
    rows.push(`<tr><td><b>جدول ${table}</b></td><td>${summary.questions}</td><td>${summary.historicalErrors}</td><td>${summary.firstTryAccuracy}%</td><td>${summary.finalSuccessRate}%</td><td>${summary.masteryScore}%</td><td><span class="level ${level.id}">${level.label}</span></td></tr>`);
  }
  return`<h2>ياسر — جدول الضرب</h2><p class="muted">الدقة تقيس أول محاولة. النجاح النهائي يكافئ التصحيح، والإتقان يعطي للتصحيح وزنًا أقل.</p>
    <div class="parent-cards">${metricCard('أسئلة اليوم',windows.today.questions)}${metricCard('إتقان الأسبوع',`${windows.week.masteryScore}%`)}${metricCard('أخطاء تاريخية',windows.all.historicalErrors)}${metricCard('جداول متقنة',`${mastered}/10`)}</div>
    <div class="table-scroll"><table class="table-report"><thead><tr><th>الجدول</th><th>أسئلة</th><th>أخطاء تاريخية</th><th>أول محاولة</th><th>نجاح نهائي</th><th>إتقان</th><th>المستوى</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}

export function familyKhaledReport(state){
  const windows=summarizeLearningWindows(state.attemptLog,{learnerId:'khaled'}),cards=KHALED_SKILLS.map(skill=>{
    const {summary,level}=skillSummary(state.attemptLog,'khaled',skill.id);
    return`<article class="family-skill-card"><div class="family-skill-head"><span class="khaled-skill-symbol">${skill.symbol}</span><div><strong>${skill.title}</strong><small>${skill.shortTitle}</small></div><em class="level ${level.id}">${level.label}</em></div><div class="family-skill-metrics"><span>أسئلة <b>${summary.questions}</b></span><span>أول محاولة <b>${summary.firstTryAccuracy}%</b></span><span>نجاح نهائي <b>${summary.finalSuccessRate}%</b></span><span>إتقان <b>${summary.masteryScore}%</b></span><span>أخطاء تاريخية <b>${summary.historicalErrors}</b></span></div></article>`;
  }).join('');
  return`<h2>خالد — رياضيات أول ابتدائي</h2><p class="muted">المستويات: يتعلم ← يتقدم ← متقن ← خبير. التصحيح يرفع النجاح النهائي، لكنه لا يتحول إلى «صح من أول مرة».</p>
    <div class="parent-cards">${metricCard('أسئلة اليوم',windows.today.questions)}${metricCard('إتقان الأسبوع',`${windows.week.masteryScore}%`)}${metricCard('صحح بعد خطأ',windows.all.correctedAfterError)}${metricCard('أخطاء تاريخية',windows.all.historicalErrors)}</div>
    <div class="family-skill-grid">${cards}</div>`;
}

export function familySessions(yasserState,khaledState){
  const yasser=(yasserState.sessions||[]).map(session=>({learner:'ياسر',at:session.endedAt,label:session.mode==='exam'?'اختبار جدول الضرب':'تدريب جدول الضرب',total:Number(session.completed||0),firstTry:Number(session.firstTryCorrect??session.correct??0),corrected:Number(session.correctedAfterError||0),unresolved:Number(session.unresolved??session.wrong??0),mastery:Number(session.masteryScore??pct(session.correct,session.completed)),incomplete:Boolean(session.incomplete)}));
  const khaled=(khaledState.sessions||[]).map(session=>({learner:'خالد',at:session.at,label:KHALED_SKILLS.find(skill=>skill.id===session.skillId)?.title||'رياضيات خالد',total:Number(session.total||0),firstTry:Number(session.firstTryCorrect??session.correct??0),corrected:Number(session.correctedAfterError||0),unresolved:Number(session.unresolved??session.wrong??0),mastery:Number(session.masteryScore??session.pct??0),incomplete:Boolean(session.incomplete)}));
  const sessions=[...yasser,...khaled].sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0,30);
  if(!sessions.length)return'<h2>آخر الجلسات</h2><p class="muted">لا توجد جلسات مسجلة حتى الآن.</p>';
  const rows=sessions.map(session=>`<tr><td>${formatDate(session.at)}</td><td><b>${session.learner}</b></td><td>${session.label}${session.incomplete?' • غير مكتمل':''}</td><td>${session.total}</td><td>${session.firstTry}</td><td>${session.corrected}</td><td>${session.unresolved}</td><td>${session.mastery}%</td></tr>`).join('');
  return`<h2>آخر الجلسات</h2><p class="muted">التصحيح يظهر منفصلًا عن الإجابة الصحيحة من أول مرة.</p><div class="table-scroll"><table class="table-report"><thead><tr><th>الوقت</th><th>الطفل</th><th>النشاط</th><th>أسئلة</th><th>أول مرة</th><th>بعد تصحيح</th><th>تحتاج مراجعة</th><th>إتقان</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
