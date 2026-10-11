import { ensureLearningShell } from './modules/hub/learning-shell.js';
import { hydrateLearnerHub } from './modules/hub/learner-hub-registry.js';
import { createHubController } from './modules/hub/hub-controller.js';
import { createKhaledSceneController } from './modules/khaled/ui/khaled-scene-controller.js';

let ready=false,pendingButton=null;
ensureLearningShell();
hydrateLearnerHub();
createHubController().show();
createKhaledSceneController().hub();
const status=document.createElement('p');
status.id='startupStatus';
status.setAttribute('role','status');
status.textContent='جاري تجهيز الأنشطة…';
document.querySelector('.hub-heading')?.appendChild(status);
function queueSelection(event){
  if(ready)return;
  const button=event.target.closest?.('#hubView button');
  if(!button)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  pendingButton=button;
  status.textContent='جاري تجهيز اختيارك…';
}
document.addEventListener('click',queueSelection,true);
export function finishStartupShell(){
  ready=true;
  document.removeEventListener('click',queueSelection,true);
  status.remove();
  if(pendingButton?.isConnected)pendingButton.click();
}
