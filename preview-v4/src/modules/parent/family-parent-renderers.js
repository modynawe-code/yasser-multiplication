import { getOverallProgress, getProgressRows } from '../../application/progress-service.js';
import { KHALED_SKILLS } from '../khaled/domain/curriculum.js';
import { MASHAAL_KG3_DOMAINS } from '../mashaal/curriculum/kg3-curriculum.js';

function pct(correct,total){return total?Math.round(correct/total*100):0;}
function formatDate(value){try{return new Date(value).toLocaleString('ar-SA',{dateStyle:'medium',timeStyle:'short'});}catch{return value||'—';}}

function khaledSkillStatus(item){
  const accuracy=pct(item.correct,item.attempts),recent=item.recent||[],recentAccuracy=recent.length?pct(recent.filter(Boolean).length,recent.length):0;
  if(!item.attempts)return{label:'لم يبدأ',className:'none'};
  if(item.attempts>=10&&accuracy>=85&&recent.length>=5&&recentAccuracy>=80)return{label:'متقن مبدئيًا',className:'master'};
  if(accuracy>=70)return{label:'يتقدم',className:'practice'};
  return{label:'يحتاج تدريب',className:'practice'};
}

export function familyOverview(yasserState,khaledState,mashaalState={}){
  const yasser=getOverallProgress(yasserState),khaledAccuracy=pct(khaledState.totalCorrect,khaledState.totalAttempts);
  const khaledStarted=KHALED_SKILLS.filter(skill=>(khaledState.skills[skill.id]?.attempts||0)>0).length;
  const mashaalEvidence=Array.isArray(mashaalState.evidenceLog)?mashaalState.evidenceLog.length:0;
  return`<h2>تقرير الأطفال</h2>
    <p class="muted">لكل طفل مساره وطريقة تقييمه المناسبة لمرحلته. سجل التعلم التاريخي لا يُمحى عند التحسن لاحقًا.</p>
    <div class="parent-tools"><button class="small-btn" id="familyExportBtn">تنزيل نسخة احتياطية موحدة</button></div>
    <div class="parent-cards family-summary-cards">
      <div class="parent-card"><span>محاولات ياسر</span><strong>${yasser.attempts}</strong></div>
      <div class="parent-card"><span>محاولات خالد</span><strong>${khaledState.totalAttempts}</strong></div>
      <div class="parent-card"><span>أدلة تعلم مشاعل</span><strong>${mashaalEvidence}</strong></div>
      <div class="parent-card"><span>مجالات KG3</span><strong>${MASHAAL_KG3_DOMAINS.length}</strong></div>
    </div>
    <div class="family-learner-summary-grid">
      <article class="family-learner-summary yasser"><div><span>ياسر</span><strong>جدول الضرب</strong></div><dl><div><dt>محاولات</dt><dd>${yasser.attempts}</dd></div><div><dt>جداول متقنة</dt><dd>${yasser.masteredTables}/10</dd></div><div><dt>دقة</dt><dd>${yasser.accuracy}%</dd></div></dl></article>
      <article class="family-learner-summary khaled"><div><span>خالد</span><strong>رياضيات أول ابتدائي</strong></div><dl><div><dt>محاولات</dt><dd>${khaledState.totalAttempts}</dd></div><div><dt>مهارات بدأها</dt><dd>${khaledStarted}/${KHALED_SKILLS.length}</dd></div><div><dt>دقة</dt><dd>${khaledAccuracy}%</dd></div></dl></article>
      <article class="family-learner-summary mashaal"><div><span>مشاعل</span><strong>روضة ثالثة</strong></div><dl><div><dt>أدلة تعلم</dt><dd>${mashaalEvidence}</dd></div><div><dt>مجالات رسمية</dt><dd>${MASHAAL_KG3_DOMAINS.length}</dd></div><div><dt>التقييم</dt><dd>نمائي</dd></div></dl></article>
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
    const item=state.skills[skill.id]||{attempts:0,correct:0,wrong:0,recent:[]},status=khaledSkillStatus(item),skillAccuracy=pct(item.correct,item.attempts);
    return`<article class="family-skill-card"><div class="family-skill-head"><span class="khaled-skill-symbol">${skill.symbol}</span><div><strong>${skill.title}</strong><small>${skill.shortTitle}</small></div><em class="level ${status.className}">${status.label}</em></div><div class="family-skill-metrics"><span>محاولات <b>${item.attempts}</b></span><span>أخطاء <b>${item.wrong}</b></span><span>دقة <b>${skillAccuracy}%</b></span></div></article>`;
  }).join('');
  return`<h2>خالد — رياضيات أول ابتدائي</h2><p class="muted">الحالة هنا تدريبية. «متقن مبدئيًا» تتطلب عددًا كافيًا من المحاولات مع ثبات الدقة في الأسئلة الأخيرة.</p><div class="parent-cards"><div class="parent-card"><span>المحاولات</span><strong>${state.totalAttempts}</strong></div><div class="parent-card"><span>الدقة</span><strong>${accuracy}%</strong></div><div class="parent-card"><span>الصحيح</span><strong>${state.totalCorrect}</strong></div><div class="parent-card"><span>الأخطاء</span><strong>${state.totalWrong}</strong></div></div><div class="family-skill-grid">${cards}</div>`;
}

export function familyMashaalReport(state={}){
  const evidenceCount=Array.isArray(state.evidenceLog)?state.evidenceLog.length:0,sessionCount=Array.isArray(state.sessions)?state.sessions.length:0;
  const domains=MASHAAL_KG3_DOMAINS.map(domain=>`<article class="family-skill-card mashaal-domain-report"><div class="family-skill-head"><div><strong>${domain.childTitle}</strong><small>${domain.title}</small></div><em class="level none">المجال معتمد</em></div></article>`).join('');
  return`<h2>مشاعل — روضة ثالثة</h2><p class="muted">التقييم لمشاعل نمائي وليس نسبة مئوية. المجالات الستة مثبتة من دليل الخطط السعودي الحالي، أما المهارات التفصيلية فلا تُعرض كتقييم حتى اكتمال توثيقها من الأدلة التطبيقية.</p><div class="parent-cards"><div class="parent-card"><span>أدلة التعلم</span><strong>${evidenceCount}</strong></div><div class="parent-card"><span>الجلسات</span><strong>${sessionCount}</strong></div><div class="parent-card"><span>المجالات</span><strong>${MASHAAL_KG3_DOMAINS.length}</strong></div></div><div class="family-skill-grid">${domains}</div>`;
}

export function familySessions(yasserState,khaledState,mashaalState={}){
  const yasser=(yasserState.sessions||[]).map(session=>({learner:'ياسر',at:session.endedAt,label:session.mode==='exam'?'اختبار جدول الضرب':'تدريب جدول الضرب',correct:Number(session.correct||0),wrong:Number(session.wrong||0),total:Number(session.completed||0),incomplete:Boolean(session.incomplete),scored:true}));
  const khaled=(khaledState.sessions||[]).map(session=>({learner:'خالد',at:session.at,label:KHALED_SKILLS.find(skill=>skill.id===session.skillId)?.title||'رياضيات خالد',correct:Number(session.correct||0),wrong:Number(session.wrong||0),total:Number(session.total||0),incomplete:Boolean(session.incomplete),scored:true}));
  const mashaal=(mashaalState.sessions||[]).map(session=>({learner:'مشاعل',at:session.endedAt||session.at||session.startedAt,label:'نشاط روضة',correct:0,wrong:0,total:Number(session.total||session.completed||0),incomplete:Boolean(session.incomplete),scored:false}));
  const sessions=[...yasser,...khaled,...mashaal].sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0,30);
  if(!sessions.length)return'<h2>آخر الجلسات</h2><p class="muted">لا توجد جلسات مسجلة حتى الآن.</p>';
  const rows=sessions.map(session=>`<tr><td>${formatDate(session.at)}</td><td><b>${session.learner}</b></td><td>${session.label}${session.incomplete?' • غير مكتمل':''}</td><td>${session.total}</td><td>${session.scored?session.correct:'—'}</td><td>${session.scored?session.wrong:'—'}</td><td>${session.scored?`${pct(session.correct,session.total)}%`:'نمائي'}</td></tr>`).join('');
  return`<h2>آخر الجلسات</h2><p class="muted">مرتبة من الأحدث إلى الأقدم، مع الحفاظ على اختلاف أسلوب التقييم بين المراحل.</p><div class="table-scroll"><table class="table-report"><thead><tr><th>الوقت</th><th>الطفل</th><th>النشاط</th><th>أنشطة/محاولات</th><th>صحيح</th><th>أخطاء</th><th>التقييم</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
