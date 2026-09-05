import { createParentAccessGate } from '../../shared/security/parent-access.js';
import { familyOverview, familyYasserReport, familyKhaledReport, familySessions } from './family-parent-renderers.js';

function byId(id){return document.getElementById(id);}
function all(selector){return[...document.querySelectorAll(selector)];}
function show(id){all('.view').forEach(view=>view.classList.toggle('active',view.id===id));window.scrollTo(0,0);}

export function createFamilyParentController({getYasserState,getKhaledState,onExitToHub}={}){
  let bound=false;
  const access=createParentAccessGate();

  function render(tab='overview'){
    const yasser=getYasserState();
    const khaled=getKhaledState();
    all('[data-family-parent-tab]').forEach(button=>button.classList.toggle('active',button.dataset.familyParentTab===tab));
    const content=byId('familyParentContent');
    if(!content)return;
    content.innerHTML=tab==='overview'
      ?familyOverview(yasser,khaled)
      :tab==='yasser'
        ?familyYasserReport(yasser)
        :tab==='khaled'
          ?familyKhaledReport(khaled)
          :familySessions(yasser,khaled);

    const exportButton=byId('familyExportBtn');
    if(exportButton)exportButton.onclick=()=>{
      const payload={
        schemaVersion:1,
        type:'family-learning-backup',
        exportedAt:new Date().toISOString(),
        yasser:getYasserState(),
        khaled:getKhaledState()
      };
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob);
      const anchor=document.createElement('a');
      anchor.href=url;
      anchor.download=`yasser-khaled-results-${new Date().toISOString().slice(0,10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    };
  }

  function enter(){
    document.body.classList.remove('hub-mode','intro-mode','khaled-mode');
    document.body.classList.add('family-parent-mode');
    render('overview');
    show('familyParentView');
  }

  function leave(){document.body.classList.remove('family-parent-mode');}

  function openModal(){
    const modal=byId('familyPinModal');
    const input=byId('familyPinInput');
    modal?.classList.add('show');
    if(input){input.value='';input.placeholder='';setTimeout(()=>input.focus(),30);}
  }

  async function verify(){
    const input=byId('familyPinInput');
    const result=await access.verify(input?.value||'');
    if(result.ok){byId('familyPinModal')?.classList.remove('show');enter();return;}
    if(input){input.value='';input.placeholder=result.locked?'محاولات كثيرة — انتظر قليلًا':'الرقم غير صحيح';}
  }

  function bind(){
    if(bound)return;
    bound=true;
    byId('familyParentBtn')?.addEventListener('click',openModal);
    byId('familyPinCancel')?.addEventListener('click',()=>byId('familyPinModal')?.classList.remove('show'));
    byId('familyPinSubmit')?.addEventListener('click',verify);
    byId('familyPinInput')?.addEventListener('keydown',event=>{if(event.key==='Enter')verify();});
    byId('familyParentHome')?.addEventListener('click',()=>{leave();onExitToHub?.();});
    all('[data-family-parent-tab]').forEach(button=>button.addEventListener('click',()=>render(button.dataset.familyParentTab)));
  }

  return{start(){bind();},enter,leave,render};
}
