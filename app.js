(()=>{
'use strict';
const APP_KEY='yasser_mul_v3';
const LEGACY_KEY='yasser_mul_v1';
const PARENT_PIN='2580';
const tables=[1,2,3,4,5,6,7,8,9,10];
const $=id=>document.getElementById(id);
const views=['homeView','learnView','sessionView','resultView','parentView'];

function blankFact(){return{attempts:0,correct:0,wrong:0,recent:[],last:null}}
function blankTable(){const facts={};for(let m=1;m<=10;m++)facts[m]=blankFact();return{attempts:0,correct:0,wrong:0,facts}}
function newState(){const ts={};tables.forEach(t=>ts[t]=blankTable());return{selected:[2,3],tables:ts,sessions:[],totalAttempts:0,totalCorrect:0,totalWrong:0}}
function normalize(s){
  if(!s||typeof s!=='object')s=newState();
  if(!Array.isArray(s.selected)||!s.selected.length)s.selected=[2,3];
  if(!s.tables)s.tables={};
  tables.forEach(t=>{
    if(!s.tables[t])s.tables[t]=blankTable();
    if(!s.tables[t].facts)s.tables[t].facts={};
    for(let m=1;m<=10;m++){
      if(!s.tables[t].facts[m])s.tables[t].facts[m]=blankFact();
      const f=s.tables[t].facts[m];
      if(!Array.isArray(f.recent))f.recent=[];
      f.attempts=Number(f.attempts||0);f.correct=Number(f.correct||0);f.wrong=Number(f.wrong||0);
    }
    s.tables[t].attempts=Number(s.tables[t].attempts||0);s.tables[t].correct=Number(s.tables[t].correct||0);s.tables[t].wrong=Number(s.tables[t].wrong||0);
  });
  s.sessions=Array.isArray(s.sessions)?s.sessions:[];
  s.totalAttempts=Number(s.totalAttempts||0);s.totalCorrect=Number(s.totalCorrect||0);s.totalWrong=Number(s.totalWrong||0);
  return s;
}
function load(){
  try{
    let raw=localStorage.getItem(APP_KEY);
    if(!raw){
      const old=localStorage.getItem(LEGACY_KEY);
      if(old){
        const legacy=JSON.parse(old);raw=JSON.stringify(legacy);
      }
    }
    return normalize(raw?JSON.parse(raw):newState());
  }catch{return newState()}
}
let state=load();
function save(){try{localStorage.setItem(APP_KEY,JSON.stringify(state))}catch{}}
function show(id){views.forEach(v=>$(v).classList.toggle('active',v===id));window.scrollTo(0,0)}
function selectedText(){return state.selected.map(n=>`جدول ${n}`).join(' + ')}
function factMastered(f){return f.attempts>=4 && f.recent.slice(-3).length===3 && f.recent.slice(-3).every(Boolean) && (f.correct/f.attempts)>=.75}
function tableMastery(t){let n=0;for(let m=1;m<=10;m++)if(factMastered(state.tables[t].facts[m]))n++;return n*10}
function tableAccuracy(t){const d=state.tables[t];return d.attempts?Math.round(d.correct/d.attempts*100):0}

function renderHome(){
  document.querySelectorAll('.table-chip').forEach(b=>b.classList.toggle('selected',state.selected.includes(Number(b.dataset.table))));
  $('focusSummary').textContent=selectedText();
  $('miniAttempts').textContent=state.totalAttempts;
  $('miniErrors').textContent=state.totalWrong;
  $('progressList').innerHTML=tables.map(t=>{const m=tableMastery(t);const shown=state.tables[t].attempts?`${m}%`:'—';return`<div class="progress-item"><b>${t}</b><div class="bar"><i style="width:${m}%"></i></div><span class="pct">${shown}</span></div>`}).join('');
}

document.querySelectorAll('.table-chip').forEach(b=>b.addEventListener('click',()=>{
  const t=Number(b.dataset.table);
  if(state.selected.includes(t)){if(state.selected.length===1)return;state.selected=state.selected.filter(x=>x!==t)}else state.selected=[...state.selected,t].sort((a,b)=>a-b);
  save();renderHome();
}));

function renderLearn(){
  $('learnMeta').textContent=selectedText();
  $('learnTables').innerHTML=state.selected.map(t=>`<section class="learn-table"><h3>جدول ${t}</h3><div class="facts">${Array.from({length:10},(_,i)=>{const m=i+1;return`<div class="fact"><span>${t} × ${m} =</span><span class="ans">${t*m}</span></div>`}).join('')}</div></section>`).join('');
  $('toggleAnswers').textContent='اخفِ النتائج';
}
$('startLearn').onclick=()=>{renderLearn();show('learnView')};
$('learnHome').onclick=()=>show('homeView');
$('toggleAnswers').onclick=()=>{const hidden=[...document.querySelectorAll('.facts')].some(x=>!x.classList.contains('hidden'));document.querySelectorAll('.facts').forEach(x=>x.classList.toggle('hidden',hidden));$('toggleAnswers').textContent=hidden?'أظهر النتائج':'اخفِ النتائج'};
$('learnToPractice').onclick=()=>startSession('practice');

function allFacts(ts){const a=[];ts.forEach(t=>{for(let m=1;m<=10;m++)a.push({t,m})});return a}
function shuffle(a){const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x}
function weakness(q){const f=state.tables[q.t].facts[q.m];return 2+(f.wrong*3)+Math.max(0,4-f.correct)+(factMastered(f)?-4:0)}
function adaptiveQuestions(count){const pool=allFacts(state.selected);const bag=[];pool.forEach(q=>{for(let i=0;i<Math.max(1,Math.min(9,weakness(q)));i++)bag.push(q)});const out=[];while(out.length<count){const q=bag[Math.floor(Math.random()*bag.length)];if(out.length&&out.at(-1).t===q.t&&out.at(-1).m===q.m)continue;out.push({...q})}return out}
function examQuestions(){
  const base=allFacts(state.selected);const out=[];
  while(out.length<30){const round=shuffle(base);for(const q of round){out.push({...q});if(out.length===30)break}}
  return out;
}
let session=null;
function startSession(mode,custom=null){
  session={mode,questions:custom|| (mode==='exam'?examQuestions():adaptiveQuestions(15)),index:0,correct:0,wrong:0,streak:0,bestStreak:0,answers:[],startedAt:new Date().toISOString(),locked:false,lastWeak:[]};
  $('sessionTitle').textContent=mode==='exam'?'الاختبار المكثف':'تدريب اليوم';show('sessionView');renderQuestion();
}
$('startPractice').onclick=()=>startSession('practice');$('startExam').onclick=()=>startSession('exam');
function renderQuestion(){
  if(!session||session.index>=session.questions.length){finishSession();return}
  session.locked=false;const q=session.questions[session.index],correct=q.t*q.m;
  $('sessionMeta').textContent=`${selectedText()} • ${session.index+1} من ${session.questions.length}`;
  $('sessionProgress').style.width=`${session.index/session.questions.length*100}%`;
  $('streakBadge').textContent=`🔥 ${session.streak} متتالية`;$('questionText').textContent=`${q.t} × ${q.m} = ؟`;$('feedback').textContent='';$('feedback').className='feedback';
  $('answers').innerHTML='';$('freeAnswer').style.display='none';
  const useFree=session.mode==='exam'||session.index%4!==0;
  if(useFree){$('freeAnswer').style.display='flex';$('answerInput').value='';setTimeout(()=>$('answerInput').focus(),30)}
  else{
    const opts=new Set([correct]);const cand=shuffle([correct+q.t,correct-q.t,correct+q.m,correct-q.m,correct+2,correct-2,correct+3,correct-3].filter(n=>n>=0));cand.forEach(n=>{if(opts.size<4)opts.add(n)});while(opts.size<4)opts.add(correct+opts.size+1);
    shuffle([...opts]).forEach(n=>{const b=document.createElement('button');b.className='answer';b.textContent=n;b.onclick=()=>submit(n,b);$('answers').appendChild(b)})
  }
}
function record(q,ok){
  const d=state.tables[q.t],f=d.facts[q.m];d.attempts++;state.totalAttempts++;f.attempts++;f.last=new Date().toISOString();f.recent.push(ok);f.recent=f.recent.slice(-5);
  if(ok){d.correct++;state.totalCorrect++;f.correct++}else{d.wrong++;state.totalWrong++;f.wrong++}save();
}
function submit(value,button){
  if(!session||session.locked)return;const n=Number(value);if(!Number.isFinite(n))return;
  const q=session.questions[session.index],correct=q.t*q.m,ok=n===correct;session.locked=true;record(q,ok);session.answers.push({t:q.t,m:q.m,answer:n,correct,ok});
  if(ok){session.correct++;session.streak++;session.bestStreak=Math.max(session.bestStreak,session.streak)}else{session.wrong++;session.streak=0}
  if(session.mode==='exam'){session.index++;setTimeout(renderQuestion,150);return}
  if(ok){$('feedback').textContent='ممتاز ✓';$('feedback').className='feedback good';if(button)button.classList.add('good')}
  else{$('feedback').textContent=`الصحيح ${q.t} × ${q.m} = ${correct} — برجع لك عليها`; $('feedback').className='feedback bad';if(button)button.classList.add('bad');const at=Math.min(session.questions.length,session.index+3+Math.floor(Math.random()*3));session.questions.splice(at,0,{...q})}
  $('streakBadge').textContent=`🔥 ${session.streak} متتالية`;session.index++;setTimeout(renderQuestion,ok?430:1000);
}
$('submitAnswer').onclick=()=>submit($('answerInput').value);$('answerInput').addEventListener('keydown',e=>{if(e.key==='Enter')submit(e.target.value)});
function sessionRecord(incomplete=false){return{mode:session.mode,selected:[...state.selected],startedAt:session.startedAt,endedAt:new Date().toISOString(),completed:session.answers.length,correct:session.correct,wrong:session.wrong,bestStreak:session.bestStreak,incomplete,answers:session.answers}}
function finishSession(){
  if(!session)return;state.sessions.unshift(sessionRecord(false));state.sessions=state.sessions.slice(0,100);save();
  const completed=session.answers.length,pct=completed?Math.round(session.correct/completed*100):0;
  $('resultPct').textContent=pct+'%';$('resultCorrect').textContent=session.correct;$('resultWrong').textContent=session.wrong;$('resultStreak').textContent=session.bestStreak;$('resultTitle').textContent=pct>=90?'ممتاز يا ياسر 🏆':pct>=75?'تقدم ممتاز يا ياسر':'نكمل تدريب ونرفع المستوى';
  const map={};session.answers.filter(a=>!a.ok).forEach(a=>{const k=`${a.t}×${a.m}`;map[k]=(map[k]||0)+1});const weak=Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,6);session.lastWeak=weak.map(([k])=>{const[t,m]=k.split('×').map(Number);return{t,m}});$('weakTags').innerHTML=weak.length?weak.map(([k,v])=>`<span class="tag">${k} • ${v} خطأ</span>`).join(''):'<span class="tag">بدون أخطاء ✓</span>';renderHome();show('resultView');
}
$('exitSession').onclick=()=>{if(session?.answers.length){state.sessions.unshift(sessionRecord(true));state.sessions=state.sessions.slice(0,100);save()}session=null;renderHome();show('homeView')};
$('backHome').onclick=()=>{session=null;show('homeView')};
$('retryWeak').onclick=()=>{const weak=session?.lastWeak||[];if(!weak.length){show('homeView');return}const q=[];weak.forEach(x=>{q.push({...x},{...x},{...x})});startSession('practice',shuffle(q))};

function tableRows(){return tables.map(t=>{const d=state.tables[t],m=tableMastery(t),acc=tableAccuracy(t);const status=d.attempts===0?['لم يبدأ','none']:m>=80?['متقن','master']:m>=40?['يتقدم','practice']:['يحتاج تدريب','practice'];return`<tr><td><b>جدول ${t}</b></td><td>${d.attempts}</td><td>${d.wrong}</td><td>${acc}%</td><td>${m}%</td><td class="level ${status[1]}">${status[0]}</td></tr>`}).join('')}
function reportTable(){return`<div style="overflow:auto"><table class="table-report"><thead><tr><th>الجدول</th><th>المحاولات</th><th>الأخطاء</th><th>الدقة</th><th>الإتقان</th><th>الحالة</th></tr></thead><tbody>${tableRows()}</tbody></table></div>`}
function overview(){const acc=state.totalAttempts?Math.round(state.totalCorrect/state.totalAttempts*100):0,mastered=tables.filter(t=>tableMastery(t)>=80).length;return`<h2>تقرير ياسر</h2><p class="muted">سجل تراكمي محفوظ على هذا الجهاز.</p><div class="parent-tools"><button class="small-btn" id="exportBtn">تنزيل نسخة احتياطية</button></div><div class="parent-cards"><div class="parent-card"><span>إجمالي المحاولات</span><strong>${state.totalAttempts}</strong></div><div class="parent-card"><span>الدقة العامة</span><strong>${acc}%</strong></div><div class="parent-card"><span>الأخطاء التاريخية</span><strong>${state.totalWrong}</strong></div><div class="parent-card"><span>جداول متقنة</span><strong>${mastered}/10</strong></div></div>${reportTable()}`}
function detail(){return`<h2>تفاصيل الجداول</h2><p class="muted">الخطأ التاريخي لا ينقص بعد الإجابة الصحيحة.</p>${tables.map(t=>`<section style="margin:16px 0 20px"><h3 style="margin-bottom:8px">جدول ${t} • إتقان ${tableMastery(t)}%</h3><div class="weak-tags">${Array.from({length:10},(_,i)=>{const m=i+1,f=state.tables[t].facts[m];return`<span class="tag">${t}×${m} • ${f.wrong} خطأ / ${f.attempts} محاولة</span>`}).join('')}</div></section>`).join('')}`}
function sessions(){if(!state.sessions.length)return`<h2>آخر الجلسات</h2><p class="muted">لا توجد جلسات بعد.</p>`;return`<h2>آخر الجلسات</h2><div style="overflow:auto"><table class="table-report"><thead><tr><th>الوقت</th><th>النوع</th><th>الجداول</th><th>محاولات</th><th>صحيح</th><th>أخطاء</th><th>الدقة</th></tr></thead><tbody>${state.sessions.slice(0,20).map(s=>{const pct=s.completed?Math.round(s.correct/s.completed*100):0;return`<tr><td>${new Date(s.endedAt).toLocaleString('ar-SA')}</td><td>${s.mode==='exam'?'اختبار':'تدريب'}${s.incomplete?' • غير مكتمل':''}</td><td>${s.selected.join(' + ')}</td><td>${s.completed}</td><td>${s.correct}</td><td>${s.wrong}</td><td>${pct}%</td></tr>`}).join('')}</tbody></table></div>`}
function renderParent(tab='overview'){
  document.querySelectorAll('[data-parent-tab]').forEach(b=>b.classList.toggle('active',b.dataset.parentTab===tab));$('parentContent').innerHTML=tab==='overview'?overview():tab==='tables'?detail():sessions();
  const ex=$('exportBtn');if(ex)ex.onclick=exportBackup;
}
function exportBackup(){const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),data:state},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`yasser-progress-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
document.querySelectorAll('[data-parent-tab]').forEach(b=>b.onclick=()=>renderParent(b.dataset.parentTab));$('parentHome').onclick=()=>{renderHome();show('homeView')};
const modal=$('pinModal');$('parentBtn').onclick=()=>{modal.classList.add('show');$('pinInput').value='';setTimeout(()=>$('pinInput').focus(),30)};$('pinCancel').onclick=()=>modal.classList.remove('show');$('pinSubmit').onclick=()=>{if($('pinInput').value===PARENT_PIN){modal.classList.remove('show');renderParent();show('parentView')}else{$('pinInput').value='';$('pinInput').placeholder='الرقم غير صحيح'}};

renderHome();
})();
