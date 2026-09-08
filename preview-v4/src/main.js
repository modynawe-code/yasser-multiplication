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
import { createGamesController } from './modules/games/games-controller.js';
import { createGameLearningAdapter } from './modules/games/learning/game-learning-providers.js';
import { createFamilyAuthClient } from './shared/sync/family-auth-client.js';
import { createFamilySyncService } from './shared/sync/family-sync-service.js';
import { createLocalBackupService } from './shared/backup/local-backup-service.js';
import { createRewardRepository } from './shared/rewards/reward-repository.js';
import { createLearningRewardService,createRewardingRepository } from './shared/rewards/learning-reward-service.js';
import { renderLearningMotivation } from './shared/ui/learning-motivation.js';
import { createRewardCabinetController } from './shared/ui/reward-cabinet.js';

document.title='تعلم العائلة';
const localBackup=createLocalBackupService();
await localBackup.restoreIfFresh();

ensureLearningShell();
ensureMashaalShell();
hydrateLearnerHub();
hydrateFamilyParentLearners();

const rewardRepository=createRewardRepository({storage:localBackup.storage});
const rewardService=createLearningRewardService({repository:rewardRepository});
let cabinet=null,hub=null,games=null;
function presentLearningStatus(learnerId,result){renderLearningMotivation({learnerId,status:result});cabinet?.refresh(learnerId,result);}

const yasserBaseRepository=createLocalStorageRepository(localBackup.storage);
const khaledBaseRepository=createKhaledRepository(localBackup.storage);
const mashaalRepository=createMashaalLocalStorageRepository(localBackup.storage);
const yasserRepository=createRewardingRepository({learnerId:'yasser',repository:yasserBaseRepository,rewardService,onEvaluated:(learnerId,_state,result)=>presentLearningStatus(learnerId,result)});
const khaledRepository=createRewardingRepository({learnerId:'khaled',repository:khaledBaseRepository,rewardService,onEvaluated:(learnerId,_state,result)=>presentLearningStatus(learnerId,result)});

const cloudAuth=createFamilyAuthClient();
const cloudSync=createFamilySyncService({authClient:cloudAuth,yasserRepository,khaledRepository,mashaalRepository});
const yasser=createAppController({repository:yasserRepository});
const khaled=createKhaledController({repository:khaledRepository});
const mashaal=createMashaalController({repository:mashaalRepository,onExitToHub:()=>hub?.show()});
const learnerRuntimes=createLearnerRuntimeRegistry();
const hubVisuals=createKhaledSceneController();
let yasserStarted=false,khaledStarted=false;

cabinet=createRewardCabinetController({
  getStatus:learnerId=>learnerId==='khaled'?rewardService.evaluate('khaled',khaled.getState()):rewardService.evaluate('yasser',yasser.getState()),
  onExit:learnerId=>learnerId==='khaled'?khaled.enter():yasser.enterHome()
});

const gameLearning=createGameLearningAdapter({
  getYasserState:()=>yasser.getState(),saveYasserState:state=>yasserRepository.save(state),
  getKhaledState:()=>khaled.getState(),saveKhaledState:state=>khaledRepository.save(state)
});

const familyParent=createFamilyParentController({
  getYasserState:()=>yasser.getState(),getKhaledState:()=>khaled.getState(),getMashaalState:()=>mashaal.getState(),
  cloudAuth,cloudSync,onCloudRestore:result=>{if(result?.requiresReload)window.location.reload();},onExitToHub:()=>hub?.show()
});

function leaveLearningAreas(){cabinet?.leave();yasser.leave();khaled.leave();mashaal.leave();familyParent.leave();}

learnerRuntimes.register('yasser',{leave:()=>yasser.leave(),enter:()=>{games?.leave();cabinet?.leave();khaled.leave();mashaal.leave();familyParent.leave();document.body.classList.remove('hub-mode','khaled-mode','mashaal-mode','family-parent-mode','games-mode');if(!yasserStarted){yasserStarted=true;yasser.start();return;}yasser.enterHome();}});
learnerRuntimes.register('khaled',{leave:()=>khaled.leave(),enter:()=>{games?.leave();cabinet?.leave();yasser.leave();mashaal.leave();familyParent.leave();if(!khaledStarted){khaledStarted=true;khaled.start();return;}khaled.enter();}});
learnerRuntimes.register('mashaal',{leave:()=>mashaal.leave(),enter:()=>{games?.leave();cabinet?.leave();yasser.leave();khaled.leave();familyParent.leave();mashaal.enter();}});

function enterLearner(learnerId){if(!learnerRuntimes.activate(learnerId))hub?.show();}

hub=createHubController({onBeforeShow:()=>{learnerRuntimes.leaveAll();leaveLearningAreas();games?.leave();},onAfterShow:()=>hubVisuals.hub(),onSelectLearner:enterLearner});

games=createGamesController({learningAdapter:gameLearning,onBeforeEnter:()=>{learnerRuntimes.leaveAll();leaveLearningAreas();},onExitToHub:()=>hub?.show()});

function exitKhaledToHub(){
  khaled.leave();
  hub?.show();
}
for(const id of ['khaledIntroBack','khaledHomeToHub','khaledResultToHub'])document.getElementById(id)?.addEventListener('click',exitKhaledToHub);

mashaal.start();
presentLearningStatus('yasser',rewardService.evaluate('yasser',yasser.getState()));
presentLearningStatus('khaled',rewardService.evaluate('khaled',khaled.getState()));
cabinet.start();familyParent.start();games.start();hubVisuals.warm();hub.start();registerServiceWorker();
void localBackup.flush();
globalThis.addEventListener?.('pagehide',()=>{void localBackup.flush();});
globalThis.addEventListener?.('visibilitychange',()=>{if(globalThis.document?.visibilityState==='hidden')void localBackup.flush();});
