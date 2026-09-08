import { createLocalStorageRepository } from './infrastructure/storage/local-storage-repository.js';
import { createAppController } from './ui/app-controller.js';
import { registerServiceWorker } from './platform/pwa/register-service-worker.js';
import { ensureLearningShell } from './modules/hub/learning-shell.js';
import { hydrateLearnerHub } from './modules/hub/learner-hub-registry.js';
import { createHubController } from './modules/hub/hub-controller.js';
import { createKhaledRepository } from './modules/khaled/infrastructure/storage/local-storage-repository.js';
import { createKhaledController } from './modules/khaled/ui/khaled-controller.js';
import { createKhaledSceneController } from './modules/khaled/ui/khaled-scene-controller.js';
import { ensureMashaalShell } from './modules/mashaal/ui/mashaal-shell.js';
import { createMashaalController } from './modules/mashaal/ui/mashaal-controller.js';
import { createMashaalLocalStorageRepository } from './modules/mashaal/infrastructure/local-storage-repository.js';
import { createFamilyParentController } from './modules/parent/family-parent-controller.js';
import { createFamilyAuthClient } from './shared/sync/family-auth-client.js';
import { createFamilySyncService } from './shared/sync/family-sync-service.js';

ensureLearningShell();
ensureMashaalShell();
hydrateLearnerHub();

const yasserRepository=createLocalStorageRepository();
const khaledRepository=createKhaledRepository();
const mashaalRepository=createMashaalLocalStorageRepository();
const cloudAuth=createFamilyAuthClient();
const cloudSync=createFamilySyncService({authClient:cloudAuth,yasserRepository,khaledRepository,mashaalRepository});
const yasser=createAppController({repository:yasserRepository});
let yasserStarted=false;
let hub;

const khaled=createKhaledController({repository:khaledRepository,onExitToHub:()=>hub?.show()});
let khaledStarted=false;
const hubVisuals=createKhaledSceneController();
const mashaal=createMashaalController({repository:mashaalRepository,onExitToHub:()=>hub?.show()});
mashaal.start();

const familyParent=createFamilyParentController({
  getYasserState:()=>yasser.getState(),
  getKhaledState:()=>khaled.getState(),
  getMashaalState:()=>mashaal.getState(),
  cloudAuth,
  cloudSync,
  onCloudRestore:result=>{if(result?.requiresReload)window.location.reload();},
  onExitToHub:()=>hub?.show()
});

function enterYasser(){
  khaled.leave();mashaal.leave();familyParent.leave();document.body.classList.remove('hub-mode','khaled-mode','mashaal-mode','family-parent-mode');
  if(!yasserStarted){yasserStarted=true;yasser.start();return;}yasser.enterHome();
}
function enterKhaled(){
  yasser.leave();mashaal.leave();familyParent.leave();if(!khaledStarted){khaledStarted=true;khaled.start();return;}khaled.enter();
}
function enterMashaal(){
  yasser.leave();khaled.leave();familyParent.leave();mashaal.enter();
}
function enterLearner(learnerId){
  if(learnerId==='yasser')return enterYasser();
  if(learnerId==='khaled')return enterKhaled();
  if(learnerId==='mashaal')return enterMashaal();
  hub?.show();
}
function exitKhaledToHub(){khaled.leave();hub?.show();}

hub=createHubController({
  onBeforeShow:()=>{yasser.leave();khaled.leave();mashaal.leave();familyParent.leave();},
  onAfterShow:()=>hubVisuals.hub(),
  onSelectLearner:enterLearner
});

document.getElementById('khaledSessionToHub')?.addEventListener('click',exitKhaledToHub);
document.getElementById('khaledResultToHub')?.addEventListener('click',exitKhaledToHub);

familyParent.start();hubVisuals.warm();hub.start();registerServiceWorker();
