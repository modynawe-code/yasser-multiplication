function ensureStyle(){
  if(document.querySelector('link[data-module-style="interactive-games"]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='src/modules/interactive-games/interactive-games.css?v=20260929-1';link.dataset.moduleStyle='interactive-games';document.head.appendChild(link);
}

export function ensureInteractiveGamesShell(){
  const main=document.querySelector('main');
  if(!main)return;
  ensureStyle();
  const actions=document.querySelector('#hubView .hub-heading-actions');
  if(actions&&!document.getElementById('independentGamesOpenBtn')){
    const button=document.createElement('button');
    button.className='icon-btn hub-action independent-games-open';
    button.id='independentGamesOpenBtn';
    button.innerHTML='<span class="hub-action-copy"><strong>ألعاب مستقلة</strong><small>بدون ملفات أطفال</small></span>';
    button.setAttribute('aria-label','فتح الألعاب المستقلة غير المرتبطة بملفات الأطفال');
    actions.appendChild(button);
  }
  if(document.getElementById('independentGamesView'))return;
  const shell=document.createElement('section');
  shell.id='independentGamesView';shell.className='view';
  shell.innerHTML=`
    <div class="independent-games-shell">
      <header class="independent-games-header">
        <button class="icon-btn" id="independentGamesBack">رجوع</button>
        <div><div class="kicker">مساحة مستقلة</div><h1>ألعاب تفاعلية</h1><p>قائمة الأسماء والمجموعات مستقلة ومحفوظة محليًا ولا ترتبط بملفات التعلّم أو نتائج الأطفال.</p></div>
      </header>
      <section class="independent-setup card" aria-labelledby="independentSetupTitle">
        <div class="independent-setup-copy"><div><h2 id="independentSetupTitle">جهّز المشاركين</h2><p>أدخل اسمًا في كل سطر. تقدر تعدّل القائمة متى ما بغيت.</p></div><strong class="independent-count" id="independentParticipantCount">٠ مشاركين</strong></div>
        <form id="independentParticipantForm" class="independent-add-form"><label class="sr-only" for="independentParticipantInput">اسم مشارك</label><input id="independentParticipantInput" maxlength="32" autocomplete="off" placeholder="اكتب اسم المشارك" /><button class="btn primary" type="submit">أضف</button></form>
        <div id="independentParticipants" class="independent-participants" aria-live="polite"></div>
        <details class="independent-groups"><summary>مجموعات عجلة الحظ</summary><p>اكتب اسم كل مجموعة في سطر. هذه القائمة مستقلة عن ملفات الأطفال.</p><form id="independentGroupForm"><label>أسماء المجموعات<textarea id="independentGroupInput" rows="3" placeholder="المجموعة الأولى&#10;المجموعة الثانية"></textarea></label><button class="btn secondary" type="submit">حفظ المجموعات</button></form><p id="independentGroupSummary" aria-live="polite"></p></details>
        <label class="independent-draw-count"><span>عدد الأسماء في سحبة النرد</span><input id="independentDrawCount" type="number" min="1" value="1" inputmode="numeric" /></label>
        <label class="independent-toggle"><input id="independentNoRepeat" type="checkbox" checked /><span><strong>منع تكرار الاختيار</strong><small>يتاح الاسم أو المجموعة من جديد بعد مرور الدور على الجميع</small></span></label>
        <p id="independentGamesStatus" class="independent-status" role="status" aria-live="polite"></p>
        <details class="independent-question-bank"><summary>بنك أسئلة الألعاب <span id="independentQuestionCount">٠ سؤال</span></summary><p>أضف الأسئلة بالطريقة اليدوية المتاحة في وافي. تُستخدم هنا داخل الألعاب فقط.</p><form id="independentQuestionForm"><label>السؤال<input id="independentQuestionText" maxlength="240" required placeholder="اكتب السؤال" /></label><label>الإجابة (اختياري)<input id="independentQuestionAnswer" maxlength="160" placeholder="اكتب الإجابة" /></label><button class="btn secondary" type="submit">أضف السؤال</button></form><ol id="independentQuestionList"></ol></details>
      </section>
      <section class="independent-catalog" aria-label="الألعاب المتاحة">
        <div class="independent-catalog-head"><h2>ألعاب تفاعلية</h2><strong>٥</strong></div>
        <div class="independent-game-grid">
          <a class="independent-game-card" aria-label="عجلة الحظ" href="#game-wheel" data-independent-game="wheel"><span class="independent-game-art wheel-art" aria-hidden="true"><img src="assets/wafy-games/tilewheel.png" alt="" /></span><span class="independent-game-copy"><strong>عجلة الحظ</strong><small>أدرها للاختيار من أسماء المشاركين أو المجموعات.</small></span><span class="independent-play">ابدأ</span></a>
          <a class="independent-game-card" aria-label="خريطة الكنز" href="#game-treasure" data-independent-game="treasure"><span class="independent-game-art treasure-art" aria-hidden="true"><img src="assets/wafy-games/tiletreasure.png" alt="" /></span><span class="independent-game-copy"><strong>خريطة الكنز</strong><small>أكمل محطات الخريطة بالإجابة عن الأسئلة.</small></span><span class="independent-play">ابدأ</span></a>
          <a class="independent-game-card" aria-label="أكمل المربع" href="#game-dots" data-independent-game="dots"><span class="independent-game-art dots-art" aria-hidden="true"><img src="assets/wafy-games/tileboxes.png" alt="" /></span><span class="independent-game-copy"><strong>أكمل المربع</strong><small>فريقان، أسئلة وأضلاع؛ اجمع خمسة مربعات للفوز.</small></span><span class="independent-play">ابدأ</span></a>
          <div class="independent-game-card independent-game-soon" aria-label="قريبًا"><span class="independent-game-art" aria-hidden="true"><img src="assets/wafy-games/tilesoon.png" alt="" /></span></div>
          <a class="independent-game-card" aria-label="تحدي الحروف" href="#game-letters" data-independent-game="letters"><span class="independent-game-art letters-art" aria-hidden="true"><img src="assets/wafy-games/tileletters.png" alt="" /></span><span class="independent-game-copy"><strong>تحدي الحروف</strong><small>العب بلوحة الحروف ومسار الفريق.</small></span><span class="independent-play">ابدأ</span></a>
          <a class="independent-game-card" aria-label="النرد" href="#game-dice" data-independent-game="dice"><span class="independent-game-art dice-art" aria-hidden="true"><img src="assets/wafy-games/tiledice.png" alt="" /></span><span class="independent-game-copy"><strong>النرد</strong><small>ارم النرد أو رج الجهاز لاختيار الاسم.</small></span><span class="independent-play">ابدأ</span></a>
        </div>
    </div>`;
  main.appendChild(shell);
  const gameView=document.createElement('section');
  gameView.id='independentGameView';gameView.className='view';
  gameView.innerHTML=`
    <div class="independent-games-shell">
      <section id="independentPlayView" class="independent-play-view card" aria-live="polite">
        <div class="independent-play-head"><button class="icon-btn" id="independentPlayBack">الألعاب</button><div><div class="kicker" id="independentPlayKicker">اختيار عشوائي</div><h2 id="independentPlayTitle">النرد العشوائي</h2></div></div>
        <div class="independent-stage" id="independentStage"></div>
        <div class="independent-result" id="independentResult" role="status" aria-live="polite"><span>النتيجة تظهر هنا</span></div>
        <div class="independent-play-actions"><button class="btn primary" id="independentDrawButton">ارمِ النرد</button><button class="btn secondary" id="independentResetCycle">ابدأ دورة جديدة</button></div>
        <div class="independent-history-wrap" id="independentHistoryWrap"><strong>آخر الاختيارات</strong><ol id="independentHistory" class="independent-history"></ol></div>
      </section>
    </div>`;
  main.appendChild(gameView);
}
