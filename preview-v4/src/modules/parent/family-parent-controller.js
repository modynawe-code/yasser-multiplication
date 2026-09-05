import { createParentAccessGate } from '../../shared/security/parent-access.js';
import { familyOverview, familyYasserReport, familyKhaledReport, familySessions } from './family-parent-renderers.js';

function byId(id){return document.getElementById(id);}
function all(selector){return[...document.querySelectorAll(selector)];}
function show(id){all('.view').forEach(view=>view.classList.toggle('active',view.id===id));window.scrollTo(0,0);}

export function createFamilyParentController({getYasserState,getKhaledState,onExitToHub,cloudAuth=null,cloudSync=null,onCloudRestore=null}={}){
  let bound=false;
  const access=createParentAccessGate();

  function cloudPanel(content){
    const section=document.createElement('section');section.className='family-cloud-panel';section.id='familyCloudPanel';
    content.appendChild(section);
    if(!cloudAuth?.isConfigured?.()){
      section.innerHTML='<h3>الحفظ السحابي</h3><p class="muted">المزامنة السحابية غير مفعلة على هذا النشر. بيانات الجهاز والنسخة الاحتياطية المحلية مستمرة بالعمل.</p>';
      return;
    }
    const session=cloudAuth.getSession?.();
    if(!session?.token){
      section.innerHTML='<h3>حساب ولي الأمر</h3><p class="muted">الحساب السحابي يحمي سجل المحاولات حتى لو مُسحت بيانات الجهاز.</p><div class="family-cloud-auth"><input id="familyCloudEmail" type="email" autocomplete="username" placeholder="البريد الإلكتروني"><input id="familyCloudPassword" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="current-password" placeholder="الرقم السري (6 أرقام)"><div><button class="small-btn" id="familyCloudLogin">دخول</button><button class="small-btn" id="familyCloudRegister">إنشاء حساب</button></div><p class="muted" id="familyCloudStatus"></p></div>';
      const status=byId('familyCloudStatus'),credentials=()=>({email:byId('familyCloudEmail')?.value||'',password:byId('familyCloudPassword')?.value||''});
      const run=async mode=>{try{status.textContent='جاري الاتصال…';const c=credentials();if(!/^\d{6}$/.test(c.password)){status.textContent='الرقم السري يجب أن يكون 6 أرقام.';return;}if(mode==='login')await cloudAuth.login(c.email,c.password);else await cloudAuth.register(c.email,c.password);status.textContent='تم توثيق ولي الأمر.';render('overview');}catch(error){status.textContent=error.status===429?'محاولات كثيرة. حاول لاحقًا.':'تعذر تسجيل الدخول. تحقق من البيانات.';}};
      byId('familyCloudLogin').onclick=()=>run('login');byId('familyCloudRegister').onclick=()=>run('register');return;
    }
    section.innerHTML='<h3>الحفظ السحابي</h3><p class="muted">الحساب موثق. المحاولات على السيرفر سجل Append-only ولا يملك الطفل مسارًا لحذفها.</p><p class="family-cloud-account" id="familyCloudAccount"></p><div class="family-cloud-actions"><button class="small-btn" id="familyCloudSync">مزامنة الآن</button><button class="small-btn" id="familyCloudRestore">استعادة من السحابة</button><button class="small-btn" id="familyCloudLogout">تسجيل خروج</button></div><p class="muted" id="familyCloudStatus"></p>';
    byId('familyCloudAccount').textContent=session.email||'حساب ولي الأمر';
    const status=byId('familyCloudStatus');
    byId('familyCloudSync').onclick=async()=>{try{status.textContent='جاري رفع السجل…';const result=await cloudSync.upload();status.textContent=`تمت المزامنة: ${result.attempts} محاولة محفوظة.`;}catch{status.textContent='تعذرت المزامنة الآن. البيانات المحلية لم تُحذف.';}};
    byId('familyCloudRestore').onclick=async()=>{try{status.textContent='جاري استعادة السجل…';const result=await cloudSync.restore();status.textContent=`تمت الاستعادة. ياسر +${result.appliedYasser}، خالد +${result.appliedKhaled}.`;onCloudRestore?.(result);}catch{status.textContent='تعذرت الاستعادة. لم يتم حذف البيانات المحلية.';}};
    byId('familyCloudLogout').onclick=async()=>{await cloudAuth.logout();render('overview');};
  }

  function render(tab='overview'){
    const yasser=getYasserState(),khaled=getKhaledState();
    all('[data-family-parent-tab]').forEach(button=>button.classList.toggle('active',button.dataset.familyParentTab===tab));
    const content=byId('familyParentContent');if(!content)return;
    content.innerHTML=tab==='overview'?familyOverview(yasser,khaled):tab==='yasser'?familyYasserReport(yasser):tab==='khaled'?familyKhaledReport(khaled):familySessions(yasser,khaled);
    if(tab==='overview')cloudPanel(content);
    const exportButton=byId('familyExportBtn');
    if(exportButton)exportButton.onclick=()=>{
      const payload={schemaVersion:2,type:'family-learning-backup',exportedAt:new Date().toISOString(),yasser:getYasserState(),khaled:getKhaledState()};
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');
      anchor.href=url;anchor.download=`yasser-khaled-results-${new Date().toISOString().slice(0,10)}.json`;anchor.click();URL.revokeObjectURL(url);
    };
  }

  function enter(){document.body.classList.remove('hub-mode','intro-mode','khaled-mode');document.body.classList.add('family-parent-mode');render('overview');show('familyParentView');}
  function leave(){document.body.classList.remove('family-parent-mode');}
  function openModal(){const modal=byId('familyPinModal'),input=byId('familyPinInput');modal?.classList.add('show');if(input){input.value='';input.placeholder='';setTimeout(()=>input.focus(),30);}}
  async function verify(){const input=byId('familyPinInput'),result=await access.verify(input?.value||'');if(result.ok){byId('familyPinModal')?.classList.remove('show');enter();return;}if(input){input.value='';input.placeholder=result.locked?'محاولات كثيرة — انتظر قليلًا':'الرقم غير صحيح';}}
  function bind(){if(bound)return;bound=true;byId('familyParentBtn')?.addEventListener('click',openModal);byId('familyPinCancel')?.addEventListener('click',()=>byId('familyPinModal')?.classList.remove('show'));byId('familyPinSubmit')?.addEventListener('click',verify);byId('familyPinInput')?.addEventListener('keydown',event=>{if(event.key==='Enter')verify();});byId('familyParentHome')?.addEventListener('click',()=>{leave();onExitToHub?.();});all('[data-family-parent-tab]').forEach(button=>button.addEventListener('click',()=>render(button.dataset.familyParentTab)));}
  return{start(){bind();},enter,leave,render};
}
