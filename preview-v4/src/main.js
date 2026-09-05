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

function enterYasser(){
  khaled.leave();
  if(!yasserStarted){yasserStarted=true;yasser.start();return;}
  yasser.enterHome();
}

function enterKhaled(){
  yasser.leave();
  if(!khaledStarted){khaledStarted=true;khaled.start();return;}
  khaled.enter();
}

const hub=createHubController({
  onBeforeShow:()=>{
    yasser.leave();
    khaled.leave();
  },
  onSelectYasser:enterYasser,
  onSelectKhaled:enterKhaled
});

hub.start();
registerServiceWorker();
