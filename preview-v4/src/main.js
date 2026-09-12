import { createLocalStorageRepository } from './infrastructure/storage/local-storage-repository.js';
import { createAppController } from './ui/app-controller.js';
import { registerServiceWorker } from './platform/pwa/register-service-worker.js';
import { ensureLearningShell } from './modules/hub/learning-shell.js';
import { hydrateLearnerHub } from './modules/hub/learner-hub-registry.js';
import { createHubController } from './modules/hub/hub-controller.js';
import { createLearnerRuntimeRegistry } from './modules/hub/learner-runtime-registry.js';
import { createKhaledRepository } from './modules/khaled/infrastructure/storage/local-storage-repository.js';
import { createKhaledController } from './modules/khaled/ui/khaled-controller.js';
import { createKhaledSceneController } from './modules/khaled/ui/khaled-scene-controller.js';
import { ensureMashaalShell } from './modules/mashaal/ui/mashaal-shell.js';
import { createMashaalController } from './modules/mashaal/ui/mashaal-controller.js';
import { createMashaalLocalStorageRepository } from './modules/mashaal/infrastructure/local-storage-repository.js';
import { createFamilyParentController } from './modules/parent/family-parent-controller.js';
import { hydrateFamilyParentLearners } from './modules/parent/family-parent-shell-registry.js';
import { createFamilyAuthClient } from './shared/sync/family-auth-client.js';
import { createFamilySyncService } from './shared/sync/family-sync-service.js';

document.title='تعلم العائلة';
ensureLearningShell();
ensureMashaalShell();
hydrateLearnerHub();
hydrateFamilyParentLearners();

const yasserRepository=createLocalStorageRepository();
const khaledRepository=createKhaledRepository();
const mashaalRepository=createMashaalLocalStorageRepository();
const cloudAuth=createFamilyAuthClient();
const cloudSync=createFamilySyncService({authClient:cloudAuth,yasserRepository,khaledRepository,mashaalRepository});
const yasser=createAppController({repository:yasserRepository});
const learnerRuntimes=createLearnerRuntimeRegistry();
let yasserStarted=false;
let khaledStarted=false;
let hub;

const khaled=createKhaledController({repository:khaledRepository,onExitToHub:()=>hub?.show()});
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

learnerRuntimes.register('yasser',{
  leave:()=>yasser.leave(),
  enter:()=>{
    document.body.classList.remove('hub-mode','khaled-mode','mashaal-mode','family-parent-mode');
    if(!yasserStarted){yasserStarted=true;yasser.start();return;}
    yasser.enterHome();
  }
});
learnerRuntimes.register('khaled',{
  leave:()=>khaled.leave(),
  enter:()=>{if(!khaledStarted){khaledStarted=true;khaled.start();return;}khaled.enter();}
});
learnerRuntimes.register('mashaal',{leave:()=>mashaal.leave(),enter:()=>mashaal.enter()});

function enterLearner(learnerId){
  familyParent.leave();
  if(!learnerRuntimes.activate(learnerId))hub?.show();
}

hub=createHubController({
  onBeforeShow:()=>{learnerRuntimes.leaveAll();familyParent.leave();},
  onAfterShow:()=>hubVisuals.hub(),
  onSelectLearner:enterLearner
});

document.getElementById('khaledSessionToHub')?.addEventListener('click',()=>hub?.show());
document.getElementById('khaledResultToHub')?.addEventListener('click',()=>hub?.show());

familyParent.start();hubVisuals.warm();hub.start();registerServiceWorker();
