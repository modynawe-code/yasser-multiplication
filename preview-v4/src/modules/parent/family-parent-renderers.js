import { KHALED_SKILLS } from '../khaled/domain/curriculum.js';
import { MASHAAL_KG3_DOMAINS } from '../mashaal/curriculum/kg3-curriculum.js';
import { buildMashaalParentSummary } from '../mashaal/application/parent-summary.js';
import { summarizeLearningAttempts,summarizeLearningWindows,learningLevel } from '../../shared/progress/learning-metrics.js';

function pct(correct,total){return total?Math.round(correct/total*100):0;}
function formatDate(value){try{return new Date(value).toLocaleString('ar-SA',{dateStyle:'medium',timeStyle:'short'});}catch{return value||'—';}}
function metricCard(label,value,sub=''){return `<div class="parent-card"><span>${label}</span><strong>${value}</strong>${sub?`<small>${sub}</small>`:''}</div>`;}
function windowStrip(label,summary){return `<article class="family-window-card"><h3>${label}</h3><dl><div><dt>الأسئلة</dt><dd>${summary.questions}</dd></div><div><dt>صح من أول مرة</dt><dd>${summary.firstTryAccuracy}%</dd></div><div><dt>النجاح النهائي</dt><dd>${summary.finalSuccessRate}%</dd></div><div><dt>الإتقان</dt><dd>${summary.masteryScore}%</dd></div></dl></article>`;}
function skillSummary(log,learnerId,skillId){const summary=summarizeLearningAttempts(log,{learnerId,skillId});return{summary,level:learningLevel(summary)};}
function mashaalStatusClass(status){return status==='mastered'?'master':status==='developing'?'practice':'none';}

export function familyOverview(yasserState,khaledState,mashaalState={}){
  const yasser=summarizeLearningWindows(yasserState.attemptLog,{learnerId:'yasser'}),khaled=summarizeLearningWindows(khaledState.attemptLog,{learnerId:'khaled'}),mashaal=buildMashaalParentSummary(mashaalState);
  const evidence=Array.isArray(mashaalState.evidenceLog)?mashaalState.evidenceLog.length:0;
  return`<h2>تقرير الأطفال</h2><p class="muted">لكل طفل مساره وطريقة تقييمه المناسبة لمرحلته. سجل التعلم التاريخي لا يُمحى عند التحسن لاحقًا.</p>
  <div class="parent-tools"><button class="small-btn" id="familyExportBtn">تنزيل نسخة احتياطية موحدة</button></div>
  <div class="parent-cards family-summary-cards">${metricCard('أسئلة ياسر',yasser.all.questions)}${metricCard('أسئلة خالد',khaled.all.questions)}${metricCard('أدلة تعلم مشاعل',evidence)}${metricCard('مهارات مشاعل الجاهزة',`${mashaal.readySkills}/${mashaal.totalSkills}`)}</div>
  <div class="family-period-section"><h3>ياسر</h3><div class="family-window-grid">${windowStrip('اليوم',yasser.today)}${windowStrip('هذا الأسبوع',yasser.week)}${windowStrip('كل الوقت',yasser.all)}</div></div>
  <div class="family-period-section khaled-period"><h3>خالد</h3><div class="family-window-grid">${windowStrip('اليوم',khaled.today)}${windowStrip('هذا الأسبوع',khaled.week)}${windowStrip('كل الوقت',khaled.all)}</div></div>
  <article class="family-learner-summary mashaal"><div><span>مشاعل</span><strong>روضة ثالثة</strong></div><dl><div><dt>أدلة تعلم</dt><dd>${evidence}</dd></div><div><dt>مهارات موثقة</dt><dd>${mashaal.totalSkills}</dd></div><div><dt>التقييم</dt><dd>نمائي</dd></div></dl></article>`;
}

export function familyYasserReport(state){
  const windows=summarizeLearningWindows(state.attemptLog,{learnerId:'yasser'}),rows=[];let mastered=0;
  for(let table=1;table<=10;table++){const {summary,level}=skillSummary(state.attemptLog,'yasser',`table-${table}`);if(['mastered','expert'].includes(level.id))mastered++;rows.push(`<tr><td><b>جدول ${table}</b></td><td>${summary.questions}</td><td>${summary.historicalErrors}</td><td>${summary.firstTryAccuracy}%</td><td>${summary.finalSuccessRate}%</td><td>${summary.masteryScore}%</td><td><span class="level ${level.id}">${level.label}</span></td></tr>`);}
  return`<h2>ياسر — جدول الضرب</h2><p class="muted">الدقة تقيس أول محاولة. النجاح النهائي يكافئ التصحيح، والإتقان يعطي للتصحيح وزنًا أقل.</p><div class="parent-cards">${metricCard('أسئلة اليوم',windows.today.questions)}${metricCard('إتقان الأسبوع',`${windows.week.masteryScore}%`)}${metricCard('أخطاء تاريخية',windows.all.historicalErrors)}${metricCard('جداول متقنة',`${mastered}/10`)}</div><div class="table-scroll"><table class="table-report"><thead><tr><th>الجدول</th><th>أسئلة</th><th>أخطاء تاريخية</th><th>أول محاولة</th><th>نجاح نهائي</th><th>إتقان</th><th>المستوى</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}

export function familyKhaledReport(state){
  const windows=summarizeLearningWindows(state.attemptLog,{learnerId:'khaled'}),cards=KHALED_SKILLS.map(skill=>{const {summary,level}=skillSummary(state.attemptLog,'khaled',skill.id);return`<article class="family-skill-card"><div class="family-skill-head"><span class="khaled-skill-symbol">${skill.symbol}</span><div><strong>${skill.title}</strong><small>${skill.shortTitle}</small></div><em class="level ${level.id}">${level.label}</em></div><div class="family-skill-metrics"><span>أسئلة <b>${summary.questions}</b></span><span>أول محاولة <b>${summary.firstTryAccuracy}%</b></span><span>نجاح نهائي <b>${summary.finalSuccessRate}%</b></span><span>إتقان <b>${summary.masteryScore}%</b></span><span>أخطاء تاريخية <b>${summary.historicalErrors}</b></span></div></article>`;}).join('');
  return`<h2>خالد — رياضيات أول ابتدائي</h2><p class="muted">المستويات: يتعلم ← يتقدم ← متقن ← خبير. التصحيح يرفع النجاح النهائي، لكنه لا يتحول إلى «صح من أول مرة».</p><div class="parent-cards">${metricCard('أسئلة اليوم',windows.today.questions)}${metricCard('إتقان الأسبوع',`${windows.week.masteryScore}%`)}${metricCard('صحح بعد خطأ',windows.all.correctedAfterError)}${metricCard('أخطاء تاريخية',windows.all.historicalErrors)}</div><div class="family-skill-grid">${cards}</div>`;
}

export function familyMashaalReport(state={}){
  const evidenceCount=Array.isArray(state.evidenceLog)?state.evidenceLog.length:0,summary=buildMashaalParentSummary(state);
  const domains=summary.domains.map(domain=>{const skills=domain.skills.map(skill=>{const badge=skill.contentReady?skill.statusLabel:skill.contentLabel,className=skill.contentReady?mashaalStatusClass(skill.status):'none';return`<div class="mashaal-parent-skill"><div><strong>${skill.title}</strong><small>${skill.contentLabel}</small></div><em class="level ${className}">${badge}</em></div>`;}).join('');return`<article class="family-skill-card mashaal-domain-report"><div class="family-skill-head"><div><strong>${domain.childTitle}</strong><small>${domain.title}</small></div><em class="level none">${domain.ready}/${domain.skills.length} جاهزة</em></div><div class="mashaal-parent-skill-list">${skills}</div></article>`;}).join('');
  return`<h2>مشاعل — روضة ثالثة</h2><p class="muted">التقييم نمائي: «لم تبدأ / تتطور / متقنة»، بدون نسب مئوية. التلاوة لا تستخدم نطقًا صناعيًا.</p><div class="parent-cards">${metricCard('أدلة التعلم',evidenceCount)}${metricCard('المهارات الموثقة',summary.totalSkills)}${metricCard('أنشطة جاهزة',summary.readySkills)}${metricCard('بانتظار ملف الإخلاص',summary.awaitingApprovedHumanAudio)}</div><div class="family-skill-grid">${domains}</div>`;
}

export function familyGenericLearnerReport(profile){const name=profile?.displayName||'الطفل',stage=profile?.presentation?.subtitle||profile?.stage||'مسار تعلم';return`<h2>${name} — ${stage}</h2><p class="muted">هذا الطفل مسجل في منصة التعلم، لكن تقرير مرحلته المتخصص لم يُركب بعد. يبقى ملفه منفصلًا ولا يتم إسقاط تقييم مرحلة أخرى عليه.</p>`;}

export function familySessions(yasserState,khaledState,mashaalState={}){
  const yasser=(yasserState.sessions||[]).map(session=>({learner:'ياسر',at:session.endedAt,label:session.mode==='exam'?'اختبار جدول الضرب':'تدريب جدول الضرب',total:Number(session.completed||0),firstTry:Number(session.firstTryCorrect??session.correct??0),corrected:Number(session.correctedAfterError||0),unresolved:Number(session.unresolved??session.wrong??0),mastery:Number(session.masteryScore??pct(session.correct,session.completed)),incomplete:Boolean(session.incomplete),developmental:false}));
  const khaled=(khaledState.sessions||[]).map(session=>({learner:'خالد',at:session.at,label:KHALED_SKILLS.find(skill=>skill.id===session.skillId)?.title||'رياضيات خالد',total:Number(session.total||0),firstTry:Number(session.firstTryCorrect??session.correct??0),corrected:Number(session.correctedAfterError||0),unresolved:Number(session.unresolved??session.wrong??0),mastery:Number(session.masteryScore??session.pct??0),incomplete:Boolean(session.incomplete),developmental:false}));
  const mashaal=(mashaalState.sessions||[]).map(session=>({learner:'مشاعل',at:session.endedAt||session.at||session.startedAt,label:'نشاط روضة',total:Number(session.total||session.completed||0),incomplete:Boolean(session.incomplete),developmental:true}));
  const sessions=[...yasser,...khaled,...mashaal].sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0,30);if(!sessions.length)return'<h2>آخر الجلسات</h2><p class="muted">لا توجد جلسات مسجلة حتى الآن.</p>';
  const rows=sessions.map(session=>`<tr><td>${formatDate(session.at)}</td><td><b>${session.learner}</b></td><td>${session.label}${session.incomplete?' • غير مكتمل':''}</td><td>${session.total}</td><td>${session.developmental?'—':session.firstTry}</td><td>${session.developmental?'—':session.corrected}</td><td>${session.developmental?'—':session.unresolved}</td><td>${session.developmental?'نمائي':`${session.mastery}%`}</td></tr>`).join('');
  return`<h2>آخر الجلسات</h2><p class="muted">التصحيح يظهر منفصلًا عن الإجابة الصحيحة من أول مرة، ومسار الروضة يبقى نمائيًا.</p><div class="table-scroll"><table class="table-report"><thead><tr><th>الوقت</th><th>الطفل</th><th>النشاط</th><th>عدد</th><th>أول مرة</th><th>بعد تصحيح</th><th>تحتاج مراجعة</th><th>التقييم</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
