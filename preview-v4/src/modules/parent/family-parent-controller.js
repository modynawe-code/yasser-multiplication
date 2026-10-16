import { createParentAccessGate } from '../../shared/security/parent-access.js';
import { getLearnerProfile } from '../../shared/learners/learner-registry.js';
import { familyOverviewEntries,familySessionEntries,familyGenericLearnerReport } from './family-parent-renderers.js';

function byId(id){return document.getElementById(id);}
function all(selector){return[...document.querySelectorAll(selector)];}
function show(id){all('.view').forEach(view=>view.classList.toggle('active',view.id===id));window.scrollTo(0,0);}

export function createFamilyParentController({reportCapabilities,onExitToHub,cloudAuth=null,cloudSync=null,onCloudRestore=null}={}){
  let bound=false;
  const access=createParentAccessGate();

  function cloudPanel(content){
    const section=document.createElement('section');section.className='family-cloud-panel';section.id='familyCloudPanel';content.appendChild(section);
    if(!cloudAuth?.isConfigured?.()){
      section.innerHTML='<h3>الحفظ السحابي</h3><p class="muted">المزامنة السحابية غير مفعلة على هذا النشر. بيانات الجهاز والنسخة الاحتياطية المحلية مستمرة بالعمل.</p>';return;
    }
    const session=cloudAuth.getSession?.();
    if(!session?.token){
      section.innerHTML='<h3>الحفظ بين الأجهزة</h3><p class="muted">اربط الجهاز من «سجل العائلة» باستخدام رمز العائلة نفسه. بعدها يتزامن تقدم الأطفال تلقائيًا بدون بريد أو كلمة مرور.</p><div class="family-cloud-actions"><button class="small-btn" id="familyCloudReconnect">محاولة المزامنة الآن</button></div><p class="muted" id="familyCloudStatus"></p>';
      const status=byId('familyCloudStatus');
      byId('familyCloudReconnect').onclick=async()=>{try{status.textContent='جاري الاتصال…';await cloudAuth.reconnectFamily();const result=await cloudSync.sync();status.textContent='تم ربط التقدم بالسجل المشترك ✓';onCloudRestore?.(result);}catch{status.textContent='افتح سجل العائلة واربط هذا الجهاز برمز العائلة أولًا.';}};
      return;
    }
    section.innerHTML='<h3>الحفظ بين الأجهزة</h3><p class="muted">هذا الجهاز مربوط بسجل العائلة المشترك. التقدم والمحاولات والجلسات تُحفظ على السيرفر وتُستعاد على الأجهزة المرتبطة بنفس الرمز.</p><div class="family-cloud-actions"><button class="small-btn" id="familyCloudSync">مزامنة الآن</button><button class="small-btn" id="familyCloudRestore">استعادة من السحابة</button></div><p class="muted" id="familyCloudStatus"></p>';
    const status=byId('familyCloudStatus');
    byId('familyCloudSync').onclick=async()=>{try{status.textContent='جاري رفع السجل…';const result=await cloudSync.upload();status.textContent=`تمت المزامنة: ${result.attempts} محاولة، ${result.evidence||0} دليل تعلم، ${result.sessions||0} جلسة.`;}catch{status.textContent='تعذرت المزامنة الآن. البيانات المحلية لم تُحذف.';}};
    byId('familyCloudRestore').onclick=async()=>{try{status.textContent='جاري استعادة السجل…';const result=await cloudSync.restore();status.textContent=`تمت الاستعادة: ${result.attempts||0} محاولة، ${result.evidence||0} دليل تعلم، ${result.sessions||0} جلسة جديدة.`;onCloudRestore?.(result);}catch{status.textContent='تعذرت الاستعادة. لم يتم حذف البيانات المحلية.';}};
  }

  function resetPanel(content,capability){
    if(typeof capability?.resetProgress!=='function')return;
    const panel=document.createElement('section');panel.className='family-parent-reset-panel';
    const copy=document.createElement('div'),title=document.createElement('strong'),note=document.createElement('p'),status=document.createElement('p');
    title.textContent='إعادة ضبط التقدم';
    note.textContent='يعيد المستوى والمحاولات والجلسات والجوائز وتقدم الألعاب لهذا الطفل على هذا الجهاز فقط.';
    status.className='family-parent-reset-status';status.setAttribute('role','status');
    copy.append(title,note,status);
    const button=document.createElement('button');button.type='button';button.className='small-btn family-parent-reset-btn';button.textContent='إعادة ضبط تقدم الطفل';
    button.onclick=async()=>{
      const name=capability.profile?.displayName||'الطفل';
      const message=`متأكد تبي تعيد تقدم ${name} بالكامل؟\n\nسيتم تصفير المستوى والمحاولات والجلسات والجوائز وXP الألعاب لهذا الطفل على هذا الجهاز. لا يمكن التراجع.`;
      if(!(globalThis.confirm?.(message)??false))return;
      button.disabled=true;status.textContent='جاري إعادة الضبط…';
      try{await capability.resetProgress();status.textContent='تمت إعادة الضبط.';}catch{status.textContent='تعذرت إعادة الضبط. لم يتم حذف بيانات بقية الأطفال.';button.disabled=false;}
    };
    panel.append(copy,button);content.prepend(panel);
  }

  function reportForTab(tab){
    if(tab==='overview')return familyOverviewEntries(reportCapabilities?.overviewEntries?.()||[]);
    if(tab==='sessions')return familySessionEntries(reportCapabilities?.sessionEntries?.()||[]);
    const capability=reportCapabilities?.get?.(tab);
    if(capability)return capability.renderReport(capability.getState(),capability.profile);
    return familyGenericLearnerReport(getLearnerProfile(tab));
  }

  function render(tab='overview'){
    all('[data-family-parent-tab]').forEach(button=>button.classList.toggle('active',button.dataset.familyParentTab===tab));
    const content=byId('familyParentContent');if(!content)return;
    content.innerHTML=reportForTab(tab);
    const capability=reportCapabilities?.get?.(tab);if(capability)resetPanel(content,capability);
    if(tab==='overview')cloudPanel(content);
    const exportButton=byId('familyExportBtn');
    if(exportButton)exportButton.onclick=()=>{
      const payload={schemaVersion:4,type:'family-learning-backup',exportedAt:new Date().toISOString(),learners:reportCapabilities?.exportStates?.()||{}};
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');
      anchor.href=url;anchor.download=`family-learning-results-${new Date().toISOString().slice(0,10)}.json`;anchor.click();URL.revokeObjectURL(url);
    };
  }

  function enter(){document.body.classList.remove('hub-mode','intro-mode','khaled-mode','mashaal-mode');document.body.classList.add('family-parent-mode');render('overview');show('familyParentView');}
  function leave(){document.body.classList.remove('family-parent-mode');}
  function openModal(){const modal=byId('familyPinModal'),input=byId('familyPinInput');modal?.classList.add('show');if(input){input.value='';input.placeholder='';setTimeout(()=>input.focus(),30);}}
  async function verify(){const input=byId('familyPinInput'),result=await access.verify(input?.value||'');if(result.ok){byId('familyPinModal')?.classList.remove('show');enter();return;}if(input){input.value='';input.placeholder=result.locked?'محاولات كثيرة — انتظر قليلًا':'الرقم غير صحيح';}}
  function bind(){if(bound)return;bound=true;byId('familyParentBtn')?.addEventListener('click',openModal);byId('familyPinCancel')?.addEventListener('click',()=>byId('familyPinModal')?.classList.remove('show'));byId('familyPinSubmit')?.addEventListener('click',verify);byId('familyPinInput')?.addEventListener('keydown',event=>{if(event.key==='Enter')verify();});byId('familyParentHome')?.addEventListener('click',()=>{leave();onExitToHub?.();});all('[data-family-parent-tab]').forEach(button=>button.addEventListener('click',()=>render(button.dataset.familyParentTab)));}
  return{start(){bind();},enter,leave,render};
}
