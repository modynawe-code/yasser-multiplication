export function ensureLearningShell(){
  const main=document.querySelector('main');
  if(!main||document.getElementById('hubView'))return;

  if(!document.querySelector('link[data-learning-hub]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='src/modules/hub/learning-hub.css';
    link.dataset.learningHub='true';
    document.head.appendChild(link);
  }

  const topbar=document.querySelector('.topbar');
  if(topbar&&!document.getElementById('switchLearnerBtn')){
    const button=document.createElement('button');
    button.className='icon-btn';
    button.id='switchLearnerBtn';
    button.textContent='اختيار الطفل';
    topbar.appendChild(button);
  }

  const shell=document.createElement('div');
  shell.innerHTML=`
    <section id="hubView" class="view">
      <div class="learner-hub">
        <div class="hub-heading"><div class="kicker">اختر رحلتك</div><h1>مين بيتعلم اليوم؟</h1><p>لكل واحد مساره ومستواه وتقدمه الخاص.</p></div>
        <div class="learner-grid">
          <button class="learner-card yasser-card" id="hubYasser">
            <div class="learner-placeholder" aria-hidden="true"><span>×</span><span>÷</span></div>
            <div><strong>ياسر</strong><span>جدول الضرب 1–10</span><small>تدريب • اختبار • إتقان</small></div>
          </button>
          <button class="learner-card khaled-card" id="hubKhaled">
            <div class="learner-placeholder khaled" aria-hidden="true"><span>+</span><span>−</span></div>
            <div><strong>خالد</strong><span>رياضيات أول ابتدائي</span><small>عد • مقارنة • أنماط • جمع</small></div>
          </button>
        </div>
      </div>
    </section>

    <section id="khaledHomeView" class="view">
      <div class="khaled-wrap">
        <div class="khaled-head"><div><div class="kicker">رياضيات خالد</div><h2>نتعلم بالأرقام والصور</h2><p>أنشطة قصيرة مناسبة للصف الأول الابتدائي.</p></div><button class="icon-btn" id="khaledHomeToHub">اختيار الطفل</button></div>
        <div class="khaled-stats"><div><span>المحاولات</span><strong id="khaledAttempts">0</strong></div><div><span>الأخطاء المسجلة</span><strong id="khaledErrors">0</strong></div></div>
        <div class="khaled-skill-list" id="khaledSkillList"></div>
      </div>
    </section>

    <section id="khaledSessionView" class="view">
      <div class="khaled-session-wrap">
        <div class="session-head"><div><h2 id="khaledSessionTitle">رياضيات خالد</h2><p id="khaledSessionMeta"></p></div><button class="icon-btn" id="khaledExitSession">خروج</button></div>
        <div class="progress-line"><i id="khaledSessionProgress" style="width:0%"></i></div>
        <div class="card khaled-question-card">
          <button class="hear-question" id="hearKhaledQuestion" aria-label="اسمع السؤال">🔊 اسمع السؤال</button>
          <h3 id="khaledPrompt">اختر الإجابة</h3>
          <div class="khaled-visual" id="khaledVisual"></div>
          <div class="khaled-answers" id="khaledAnswers"></div>
          <div class="khaled-feedback" id="khaledFeedback"></div>
        </div>
      </div>
    </section>

    <section id="khaledResultView" class="view">
      <div class="result khaled-result"><div class="card result-card">
        <div class="khaled-result-symbol" aria-hidden="true">+ −</div>
        <h2 id="khaledResultTitle">أحسنت يا خالد</h2><p id="khaledResultSkill"></p>
        <div class="score-ring"><strong id="khaledResultPct">0%</strong></div>
        <div class="result-metrics"><div class="result-metric"><span>صحيح</span><strong id="khaledResultCorrect">0</strong></div><div class="result-metric"><span>أخطاء</span><strong id="khaledResultWrong">0</strong></div></div>
        <div class="result-actions"><button class="btn primary" id="khaledRetry">مرة ثانية</button><button class="btn secondary" id="khaledResultHome">مهارات خالد</button></div>
      </div></div>
    </section>`;

  const fragment=document.createDocumentFragment();
  while(shell.firstElementChild)fragment.appendChild(shell.firstElementChild);
  main.prepend(fragment);
}
