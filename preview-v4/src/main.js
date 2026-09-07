import { createLocalStorageRepository } from './infrastructure/storage/local-storage-repository.js';
import { createAppController } from './ui/app-controller.js';
import { registerServiceWorker } from './platform/pwa/register-service-worker.js';
import { ensureLearningShell } from './modules/hub/learning-shell.js';
import { createHubController } from './modules/hub/hub-controller.js';
import { createKhaledRepository } from './modules/khaled/infrastructure/storage/local-storage-repository.js';
import { createKhaledController } from './modules/khaled/ui/khaled-controller.js';
import { createKhaledSceneController } from './modules/khaled/ui/khaled-scene-controller.js';
import { createFamilyParentController } from './modules/parent/family-parent-controller.js';
import { createGamesController } from './modules/games/games-controller.js';
import { createGameLearningAdapter } from './modules/games/learning/game-learning-providers.js';
import { createFamilyAuthClient } from './shared/sync/family-auth-client.js';
import { createFamilySyncService } from './shared/sync/family-sync-service.js';
import { createLearningRewardService,createRewardingRepository } from './shared/rewards/learning-reward-service.js';
import { renderLearningMotivation } from './shared/ui/learning-motivation.js';
import { createRewardCabinetController } from './shared/ui/reward-cabinet.js';

ensureLearningShell();

const rewardService=createLearningRewardService();
let cabinet=null;
function presentLearningStatus(learnerId,result){renderLearningMotivation({learnerId,status:result});cabinet?.refresh(learnerId,result);}
const yasserBaseRepository=createLocalStorageRepository();
const khaledBaseRepository=createKhaledRepository();
const yasserRepository=createRewardingRepository({learnerId:'yasser',repository:yasserBaseRepository,rewardService,onEvaluated:(learnerId,_state,result)=>presentLearningStatus(learnerId,result)});
const khaledRepository=createRewardingRepository({learnerId:'khaled',repository:khaledBaseRepository,rewardService,onEvaluated:(learnerId,_state,result)=>presentLearningStatus(learnerId,result)});
const cloudAuth=createFamilyAuthClient();
const cloudSync=createFamilySyncService({authClient:cloudAuth,yasserRepository,khaledRepository});
const yasser=createAppController({repository:yasserRepository});
let yasserStarted=false;
let hub,games;

const khaled=createKhaledController({repository:khaledRepository});
let khaledStarted=false;
const hubVisuals=createKhaledSceneController();

cabinet=createRewardCabinetController({
  getStatus:learnerId=>learnerId==='khaled'?rewardService.evaluate('khaled',khaled.getState()):rewardService.evaluate('yasser',yasser.getState()),
  onExit:learnerId=>learnerId==='khaled'?khaled.enter():yasser.enterHome()
});

const gameLearning=createGameLearningAdapter({
  getYasserState:()=>yasser.getState(),
  saveYasserState:state=>yasserRepository.save(state),
  getKhaledState:()=>khaled.getState(),
  saveKhaledState:state=>khaledRepository.save(state)
});

const familyParent=createFamilyParentController({
  getYasserState:()=>yasser.getState(),
  getKhaledState:()=>khaled.getState(),
  cloudAuth,
  cloudSync,
  onCloudRestore:result=>{if(result?.requiresReload)window.location.reload();},
  onExitToHub:()=>hub?.show()
});

function leaveLearningAreas(){
  cabinet?.leave();yasser.leave();khaled.leave();familyParent.leave();
}
function enterYasser(){
  games?.leave();cabinet?.leave();khaled.leave();familyParent.leave();
  document.body.classList.remove('hub-mode','khaled-mode','family-parent-mode');
  document.body.classList.remove('games-mode');
  if(!yasserStarted){yasserStarted=true;yasser.start();return;}yasser.enterHome();
}
function enterKhaled(){
  games?.leave();cabinet?.leave();yasser.leave();familyParent.leave();if(!khaledStarted){khaledStarted=true;khaled.start();return;}khaled.enter();
}
function exitKhaledToHub(){
  khaled.leave();hub?.show();
}

hub=createHubController({
  onBeforeShow:()=>{leaveLearningAreas();games?.leave();},
  onAfterShow:()=>hubVisuals.hub(),onSelectYasser:enterYasser,onSelectKhaled:enterKhaled
});

games=createGamesController({
  learningAdapter:gameLearning,
  onBeforeEnter:leaveLearningAreas,
  onExitToHub:()=>hub?.show()
});

for(const id of ['khaledIntroBack','khaledHomeToHub','khaledResultToHub']){
  document.getElementById(id)?.addEventListener('click',exitKhaledToHub);
}

presentLearningStatus('yasser',rewardService.evaluate('yasser',yasser.getState()));
presentLearningStatus('khaled',rewardService.evaluate('khaled',khaled.getState()));
cabinet.start();familyParent.start();games.start();hubVisuals.warm();hub.start();registerServiceWorker();
