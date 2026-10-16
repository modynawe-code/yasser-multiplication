function ensureStyle(){
  if(document.querySelector('link[data-module-style="ps1-game"]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='src/modules/games/ps1/ps1.css?v=psx-core-choice-1';link.dataset.moduleStyle='ps1-game';document.head.appendChild(link);
}

export function ensurePs1Shell(){
  if(document.getElementById('ps1GameView'))return;
  const main=document.querySelector('main');if(!main)return;
  ensureStyle();
  const host=document.createElement('div');
  host.innerHTML=`
    <section id="ps1GameView" class="view ps1-view">
      <div class="ps1-shell">
        <header class="ps1-header">
          <button type="button" class="ps1-back" id="ps1Back">رجوع للألعاب</button>
          <div class="ps1-title"><small>لعبة فردية · PlayStation</small><h1>ألعاب PS1</h1></div>
          <button type="button" class="ps1-fullscreen" id="ps1Fullscreen" aria-pressed="false">ملء الشاشة</button>
        </header>
        <div class="ps1-setup" id="ps1Setup">
          <div class="ps1-intro"><span aria-hidden="true">🎮</span><div><h2>شغّل لعبتك من جهازك</h2><p>اختر ملف اللعبة وBIOS مرة واحدة؛ سيُحفظ BIOS محليًا على هذا الجهاز.</p></div></div>
          <label class="ps1-file-field"><span>ملف اللعبة</span><small>ملف PSX on PSP بصيغة EBOOT.PBP يعمل عبر محاكي PS1؛ ويدعم أيضًا CHD وISO وBIN/CUE</small><input id="ps1RomFile" type="file" accept=".chd,.pbp,.iso,.bin,.cue,.zip,application/octet-stream"></label>
          <label class="ps1-file-field"><span>ملف BIOS</span><small>لنسخة اللعبة الأمريكية استخدم scph5501.bin. يُحفظ داخل متصفح هذا الجهاز فقط.</small><input id="ps1BiosFile" type="file" accept=".bin,application/octet-stream"></label>
          <label class="ps1-file-field"><span>نواة المحاكي</span><small>إذا بقيت الشاشة سوداء، جرّب النواة البديلة.</small><select id="ps1Core"><option value="pcsx_rearmed">PCSX ReARMed (الأساسية)</option><option value="mednafen_psx_hw">Mednafen PSX HW (بديلة)</option></select></label>
          <button type="button" id="ps1Start" class="ps1-start">تحميل اللعبة</button>
          <p class="ps1-setup-note">تحتاج اتصال إنترنت عند أول تشغيل لتحميل ملفات المحاكي. ملفات PS1 نفسها لا تُرفع إلى GitHub.</p>
          <p class="ps1-status" id="ps1Status" role="status" aria-live="polite"></p>
        </div>
        <div class="ps1-stage" id="ps1Stage" hidden>
          <div class="ps1-player" id="ps1Player" aria-label="شاشة لعبة PlayStation"></div>
          <p class="ps1-status ps1-stage-status" id="ps1StageStatus" role="status" aria-live="polite">نحمّل المحاكي…</p>
        </div>
      </div>
    </section>`;
  main.appendChild(host.firstElementChild);
}
