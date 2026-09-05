import { createLocalStorageRepository } from './infrastructure/storage/local-storage-repository.js';
import { createAppController } from './ui/app-controller.js';
import { registerServiceWorker } from './platform/pwa/register-service-worker.js';
import { ensureLearningShell } from './modules/hub/learning-shell.js';
import { createHubController } from './modules/hub/hub-controller.js';
import { createKhaledRepository } from './modules/khaled/infrastructure/storage/local-storage-repository.js';
import { createKhaledController } from './modules/khaled/ui/khaled-controller.js';

ensureLearningShell();

const yasser=createAppController({repository:createLocalStorageRepository()});
let yasserStarted=false;

const khaled=createKhaledController({
  repository:createKhaledRepository(),
  onExitToHub:()=>hub.show()
});
let khaledStarted=false;

function showView(id){
  document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id===id));
  document.body.classList.remove('hub-mode','intro-mode');
  window.scrollTo(0,0);
}

function enterYasser(){
  khaled.leave();
  if(!yasserStarted){yasserStarted=true;yasser.start();return;}
  showView('homeView');
}

function enterKhaled(){
  const session=document.getElementById('sessionView');
  if(session?.classList.contains('active'))document.getElementById('exitSession')?.click();
  if(!khaledStarted){khaledStarted=true;khaled.start();return;}
  khaled.enter();
}

const hub=createHubController({onSelectYasser:enterYasser,onSelectKhaled:enterKhaled});
hub.start();
registerServiceWorker();
