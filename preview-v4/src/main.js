import { createLocalStorageRepository } from './infrastructure/storage/local-storage-repository.js';
import { createAppController } from './ui/app-controller.js';
import { registerServiceWorker } from './platform/pwa/register-service-worker.js';
import { ensureLearningShell } from './modules/hub/learning-shell.js';
import { createHubController } from './modules/hub/hub-controller.js';
import { createKhaledRepository } from './modules/khaled/infrastructure/storage/local-storage-repository.js';
import { createKhaledController } from './modules/khaled/ui/khaled-controller.js';
import { createKhaledSceneController } from './modules/khaled/ui/khaled-scene-controller.js';
import { createFamilyParentController } from './modules/parent/family-parent-controller.js';
import { createFamilyAuthClient } from './shared/sync/family-auth-client.js';
import { createFamilySyncService } from './shared/sync/family-sync-service.js';

ensureLearningShell();

const yasserRepository=createLocalStorageRepository();
const khaledRepository=createKhaledRepository();
const cloudAuth=createFamilyAuthClient();
const cloudSync=createFamilySyncService({authClient:cloudAuth,yasserRepository,khaledRepository});
const yasser=createAppController({repository:yasserRepository});
let yasserStarted=false;
let hub;

const khaled=createKhaledController({repository:khaledRepository,onExitToHub:()=>hub?.show()});
let khaledStarted=false;
const hubVisuals=createKhaledSceneController();

const familyParent=createFamilyParentController({
  getYasserState:()=>yasser.getState(),
  getKhaledState:()=>khaled.getState(),
  cloudAuth,
  cloudSync,
  onCloudRestore:result=>{if(result?.requiresReload)window.location.reload();},
  onExitToHub:()=>hub?.show()
});

function enterYasser(){
  khaled.leave();familyParent.leave();document.body.classList.remove('hub-mode','khaled-mode','family-parent-mode');
  if(!yasserStarted){yasserStarted=true;yasser.start();return;}yasser.enterHome();
}
function enterKhaled(){
  yasser.leave();familyParent.leave();if(!khaledStarted){khaledStarted=true;khaled.start();return;}khaled.enter();
}
function exitKhaledToHub(){
  khaled.leave();hub?.show();
}

hub=createHubController({
  onBeforeShow:()=>{yasser.leave();khaled.leave();familyParent.leave();},
  onAfterShow:()=>hubVisuals.hub(),onSelectYasser:enterYasser,onSelectKhaled:enterKhaled
});

document.getElementById('khaledSessionToHub')?.addEventListener('click',exitKhaledToHub);
document.getElementById('khaledResultToHub')?.addEventListener('click',exitKhaledToHub);

familyParent.start();hubVisuals.warm();hub.start();registerServiceWorker();
