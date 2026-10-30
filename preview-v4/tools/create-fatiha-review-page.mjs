/**
 * Builds a stand-alone offline HTML *review instrument*.
 * Audio streams only from an immutable GitHub commit containing the existing
 * verified Ibrahim Al-Akhdar Fatiha MP3. Not used by the children app.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';

const source=process.argv[2],output=process.argv[3];
if(!source||!output)throw new Error('Usage: node tools/create-fatiha-review-page.mjs <acoustic-report.json> <out.html>');
const report=JSON.parse(await readFile(source,'utf8'));
if(report.status!=='REQUIRES_HUMAN_AUDIO_REVIEW'
  ||!Array.isArray(report.proposedReviewCues)||report.proposedReviewCues.length!==7
  ||!(/^[a-f0-9]{64}$/).test(report.audioSha256)){
  throw new Error('Only seven unapproved, SHA-checked Al-Fatiha cues are accepted.');
}
const MP3='https://raw.githubusercontent.com/modynawe-code/yasser-multiplication/4ffab2627f49cd3d19ab67625018c0e934c05934/preview-v4/assets/recitation/ibrahim-al-akhdar-hafs-1-al-fatiha.mp3';
const html=String.raw`<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>مراجعة حدود آيات الفاتحة — غير معتمدة</title>
<style>
:root{font-family:system-ui,"Segoe UI",sans-serif;color:#172a22;background:#f6faf7}
*{box-sizing:border-box}body{margin:0;padding:18px}
main{max-width:850px;margin:auto;display:grid;gap:16px}
section{border:1px solid #bed9c8;border-radius:18px;background:white;padding:16px}
h1{font-size:clamp(23px,4vw,32px);margin:0}p{line-height:1.75}
.notice{border-inline-start:5px solid #ba8438;padding:12px;background:#fff6de}
audio{width:100%;margin-block:10px}button,select,input{font:inherit;min-height:48px}
button{background:#e4f5eb;border:1px solid #6f9f81;border-radius:12px;color:#17442d;padding:10px 14px;font-weight:700;cursor:pointer}
button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #4d70b6;outline-offset:3px}
.buttons{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px}
button[aria-pressed="true"]{background:#267544;color:white}
fieldset{border:1px solid #d6e1d9;border-radius:12px;padding:14px}
label{display:grid;gap:6px;font-weight:700}
.inputs{display:grid;grid-template-columns:1fr 1fr;gap:12px}
input,select{min-width:0;border-radius:9px;border:1px solid #9aad9e;padding:8px;background:white}
.small{font-size:13px;color:#536b5b;overflow-wrap:anywhere}
#status{min-height:24px}footer{margin-bottom:30px}
@media(max-width:520px){.inputs{grid-template-columns:1fr}}
</style></head><body><main>
<header><h1>مراجعة صوتية لآيات الفاتحة</h1>
<p class="notice"><strong>توقيتات تجريبية، غير معتمدة.</strong>
الوقفات مستخرجة من تحليل الصوت ولا تعني بالضرورة نهاية الآيات. الاستماع والتحقق من أول وآخر كلمة لكل آية إلزامي.</p></header>
<section><h2>تلاوة إبراهيم الأخضر — حفص</h2>
<p class="small">يُحمّل الصوت من نسخة ثابتة موجودة في مستودع التطبيق؛ لا تُرسل بيانات الأطفال إلى أي خدمة.</p>
<audio id="audio" controls preload="metadata"></audio>
<div id="status" role="status" aria-live="polite">اختر آية للاستماع من موضع مقترح.</div></section>
<section><h2>اختر الآية</h2><div id="buttons" class="buttons"></div></section>
<section><h2>مراجعة الآية <span id="current">1</span></h2>
<fieldset><legend>عدّل البداية والنهاية بعد الاستماع فقط</legend>
<div class="inputs">
<label>البداية (بالثواني)<input id="start" type="number" step="0.01" min="0"></label>
<label>النهاية (بالثواني)<input id="end" type="number" step="0.01" min="0"></label>
</div></fieldset>
<p><label>نتيجة المراجعة
<select id="decision">
<option value="unreviewed">لم تُراجع</option>
<option value="pass">سمعت الآية كاملة دون قص أو تداخل</option>
<option value="fail">تحتاج تصحيح</option>
</select></label></p>
<p><label>ملاحظات المراجع
<input id="notes" type="text" maxlength="400" placeholder="بداية كلمة ناقصة، وقفة داخل آية..."></label></p>
<div class="buttons">
<button id="play" type="button">استمع للآية المحددة</button>
<button id="previous" type="button">الآية السابقة</button>
<button id="next" type="button">الآية التالية</button>
</div></section>
<section><h2>تصدير نتيجة المراجعة</h2><p>التصدير ملف على جهازك فقط، ولا يعتمد أي توقيت تلقائيًا.</p>
<button type="button" id="export">تصدير JSON للمراجعة النهائية</button>
<p class="small" id="sha"></p></section>
<footer class="small">المراجعة الصوتية خطوة بشرية. الاعتماد النهائي يتطلب أيضًا الاختبارات على Galaxy Tab والآيباد، ومراجعة حفظ التقدم وسلامة المناهج.</footer>
</main><script>
const report=/*__REVIEW_REPORT__*/;
const src=/*__AUDIO_URL__*/;
const audio=document.getElementById('audio');
audio.src=src;
const rows=report.proposedReviewCues.map(c=>({...c,reviewStatus:'unreviewed',notes:''}));
let active=0,segmentPlayback=false;
const el=id=>document.getElementById(id);
const seconds=ms=>(ms/1000).toFixed(2);
const asNumber=value=>Number.parseFloat(value);
function saveInputs(){
  const row=rows[active];
  const start=asNumber(el('start').value),end=asNumber(el('end').value);
  if(Number.isFinite(start)&&Number.isFinite(end)&&start>=0&&start<end&&end<=report.durationSeconds+0.2){
    row.startMs=Math.round(start*1000);row.endMs=Math.round(end*1000);
  }
  row.reviewStatus=el('decision').value;
  row.notes=el('notes').value;
}
function buttons(){
  const host=el('buttons');host.replaceChildren();
  rows.forEach((row,index)=>{
    const button=document.createElement('button');button.type='button';
    button.textContent='الآية '+(index+1)+(row.reviewStatus==='pass'?' ✓':row.reviewStatus==='fail'?' !':'');
    button.setAttribute('aria-pressed',String(index===active));
    button.onclick=()=>select(index);
    host.append(button);
  });
}
function select(index){
  if(index!==active)saveInputs();
  active=Math.max(0,Math.min(6,index));audio.pause();segmentPlayback=false;
  el('current').textContent=String(active+1);
  el('start').value=seconds(rows[active].startMs);
  el('end').value=seconds(rows[active].endMs);
  el('decision').value=rows[active].reviewStatus;
  el('notes').value=rows[active].notes;
  buttons();
}
async function playSegment(){
  saveInputs();buttons();
  const row=rows[active];
  if(!(row.endMs>row.startMs&&row.endMs<=report.durationSeconds*1000+200)){
    el('status').textContent='حدود التوقيت المدخلة غير سليمة';return;
  }
  segmentPlayback=true;
  try{
    audio.pause();audio.currentTime=row.startMs/1000;
    await audio.play();
    el('status').textContent='تستمع الآن للآية '+(active+1)+' — حدّد هل تبدأ وتنتهي بالكلمات الصحيحة';
  }catch{
    segmentPlayback=false;
    el('status').textContent='تعذر تشغيل الصوت. تحقق من اتصال الإنترنت وتوفر الملف الأصلي.';
  }
}
audio.addEventListener('timeupdate',()=>{
  if(segmentPlayback&&audio.currentTime*1000>=rows[active].endMs-50){
    audio.pause();segmentPlayback=false;el('status').textContent='انتهى المقطع المقترح؛ راجع صحة البداية والنهاية';
  }
});
audio.addEventListener('error',()=>{el('status').textContent='تعذر تحميل الملف الصوتي الأصلي من GitHub';});
el('play').onclick=playSegment;
el('previous').onclick=()=>select(active-1);
el('next').onclick=()=>select(active+1);
el('decision').onchange=()=>{saveInputs();buttons();};
el('export').onclick=()=>{
  saveInputs();
  const output={...report,status:'REQUIRES_EXPERT_APPROVAL_AND_DEVICE_TESTS',
    humanReview:rows.map(x=>({...x})),
    allReviewed:rows.every(x=>x.reviewStatus==='pass')};
  const blob=new Blob([JSON.stringify(output,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download='fatiha-human-review-not-approved.json';
  document.body.append(link);link.click();link.remove();
  URL.revokeObjectURL(url);
};
el('sha').textContent='SHA-256 للملف الأصلي: '+report.audioSha256;
select(0);
</script></body></html>`;
const escaped=JSON.stringify(report).replaceAll('<','\\u003c').replaceAll('>','\\u003e');
const built=html.replace('/*__REVIEW_REPORT__*/',escaped).replace('/*__AUDIO_URL__*/',JSON.stringify(MP3));
await mkdir(dirname(resolve(output)),{recursive:true});
await writeFile(output,built,'utf8');
console.log('Human-only audio review page created:',output,'cues:',report.proposedReviewCues.length);
