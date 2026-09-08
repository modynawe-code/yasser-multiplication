import { createLocalStorageRepository } from './infrastructure/storage/local-storage-repository.js';
import { normalizeState,applyYasserAttemptEvent } from './domain/state-model.js';
import { createAppController } from './ui/app-controller.js';
import { registerServiceWorker } from './platform/pwa/register-service-worker.js';
import { ensureYasserHomeShell } from './modules/yasser/ui/yasser-home-shell.js';
import { ensureLearningShell } from './modules/hub/learning-shell.js';
import { hydrateLearnerHub } from './modules/hub/learner-hub-registry.js';
import { createHubController } from './modules/hub/hub-controller.js';
import { createLearnerRuntimeRegistry } from './modules/hub/learner-runtime-registry.js';
import { createKhaledRepository } from './modules/khaled/infrastructure/storage/local-storage-repository.js';
import { normalizeKhaledState,applyKhaledAttemptEvent } from './modules/khaled/domain/state-model.js';
import { createKhaledController } from './modules/khaled/ui/khaled-controller.js';
import { createKhaledSceneController } from './modules/khaled/ui/khaled-scene-controller.js';
import { ensureMashaalShell } from './modules/mashaal/ui/mashaal-shell.js';
import { createMashaalController } from './modules/mashaal/ui/mashaal-controller.js';
import { createMashaalLocalStorageRepository } from './modules/mashaal/infrastructure/local-storage-repository.js';
import { normalizeMashaalState } from './modules/mashaal/domain/state-model.js';
import { recordMashaalEvidence } from './modules/mashaal/application/progress-service.js';
import { createFamilyParentController } from './modules/parent/family-parent-controller.js';
import { createFamilyParentReportCapabilityRegistry } from './modules/parent/family-parent-report-capabilities.js';
import { hydrateFamilyParentLearners } from './modules/parent/family-parent-shell-registry.js';
import { familyYasserReport,familyKhaledReport,familyMashaalReport,familyYasserOverview,familyKhaledOverview,familyMashaalOverview,familyYasserSessions,familyKhaledSessions,familyMashaalSessions } from './modules/parent/family-parent-renderers.js';
import { createGamesController } from './modules/games/games-controller.js';
import { createGameLearningAdapter } from './modules/games/learning/game-learning-providers.js';
import { createFamilyAuthClient } from './shared/sync/family-auth-client.js';
import { createFamilySyncCapabilityRegistry } from './shared/sync/family-sync-capability-registry.js';
import { createFamilySyncService } from './shared/sync/family-sync-service.js';
import { appendCloudSession } from './shared/sync/session-sync.js';
import { createLocalBackupService } from './shared/backup/local-backup-service.js';
import { createRewardRepository } from './shared/rewards/reward-repository.js';
import { createLearningRewardService,createRewardingRepository } from './shared/rewards/learning-reward-service.js';
import { createRewardCapabilityRegistry } from './shared/rewards/reward-capability-registry.js';
import { renderLearningMotivation } from './shared/ui/learning-motivation.js';
import { createRewardCabinetController } from './shared/ui/reward-cabinet.js';

document.title='تعلم العائلة';
const localBackup=createLocalBackupService();
await localBackup.restoreIfFresh();

ensureYasserHomeShell();
ensureLearningShell();
ensureMashaalShell();
hydrateLearnerHub();
hydrateFamilyParentLearners();

const rewardRepository=createRewardRepository({storage:localBackup.storage});
const rewardService=createLearningRewardService({repository:rewardRepository});
const rewardCapabilities=createRewardCapabilityRegistry();
const parentReportCapabilities=createFamilyParentReportCapabilityRegistry();
const syncCapabilities=createFamilySyncCapabilityRegistry();
let cabinet=null,hub=null,games=null;
function presentLearningStatus(learnerId,result){
  const capability=rewardCapabilities.get(learnerId);
  if(capability?.mode!=='academic')return false;
  const rendered=renderLearningMotivation({learnerId,status:result,anchorSelector:capability.motivationAnchor});
  cabinet?.refresh(learnerId,result);return rendered;
}

const yasserBaseRepository=createLocalStorageRepository(localBackup.storage);
const khaledBaseRepository=createKhaledRepository(localBackup.storage);
const mashaalRepository=createMashaalLocalStorageRepository(localBackup.storage);
const yasserRepository=createRewardingRepository({learnerId:'yasser',repository:yasserBaseRepository,rewardService,onEvaluated:(learnerId,_state,result)=>presentLearningStatus(learnerId,result)});
const khaledRepository=createRewardingRepository({learnerId:'khaled',repository:khaledBaseRepository,rewardService,onEvaluated:(learnerId,_state,result)=>presentLearningStatus(learnerId,result)});

syncCapabilities.register('yasser',{
  repository:yasserRepository,
  normalizeState,
  getAttempts:state=>state.attemptLog||[],
  applyAttempt:applyYasserAttemptEvent,
  getSessions:state=>state.sessions||[],
  applySession:(state,session)=>appendCloudSession(state,session,{learnerId:'yasser'})
});
syncCapabilities.register('khaled',{
  repository:khaledRepository,
  normalizeState:normalizeKhaledState,
  getAttempts:state=>state.attemptLog||[],
  applyAttempt:applyKhaledAttemptEvent,
  getSessions:state=>state.sessions||[],
  applySession:(state,session)=>appendCloudSession(state,session,{learnerId:'khaled'})
});
syncCapabilities.register('mashaal',{
  repository:mashaalRepository,
  normalizeState:normalizeMashaalState,
  getEvidence:state=>state.evidenceLog||[],
  applyEvidence:(state,evidence)=>recordMashaalEvidence(state,{skillId:evidence.skillId,evidence}),
  getSessions:state=>state.sessions||[],
  applySession:(state,session)=>appendCloudSession(state,session,{learnerId:'mashaal'})
});

const cloudAuth=createFamilyAuthClient();
const cloudSync=createFamilySyncService({authClient:cloudAuth,capabilityRegistry:syncCapabilities});
const yasser=createAppController({repository:yasserRepository});
const khaled=createKhaledController({repository:khaledRepository});
const mashaal=createMashaalController({repository:mashaalRepository,onExitToHub:()=>hub?.show()});
const learnerRuntimes=createLearnerRuntimeRegistry();
const hubVisuals=createKhaledSceneController();
let yasserStarted=false,khaledStarted=false;

rewardCapabilities.register('yasser',{mode:'academic',getState:()=>yasser.getState(),onEnter:()=>yasser.enterHome(),motivationAnchor:'#homeView .yasser-home-focus'});
rewardCapabilities.register('khaled',{mode:'academic',getState:()=>khaled.getState(),onEnter:()=>khaled.enter(),motivationAnchor:'#khaledHomeView .khaled-stats'});
rewardCapabilities.register('mashaal',{mode:'developmental',getState:()=>mashaal.getState(),onEnter:()=>mashaal.enter()});

parentReportCapabilities.register('yasser',{reportType:'academic',getState:()=>yasser.getState(),renderReport:familyYasserReport,renderOverview:familyYasserOverview,listSessions:familyYasserSessions});
parentReportCapabilities.register('khaled',{reportType:'academic',getState:()=>khaled.getState(),renderReport:familyKhaledReport,renderOverview:familyKhaledOverview,listSessions:familyKhaledSessions});
parentReportCapabilities.register('mashaal',{reportType:'developmental',getState:()=>mashaal.getState(),renderReport:familyMashaalReport,renderOverview:familyMashaalOverview,listSessions:familyMashaalSessions});

cabinet=createRewardCabinetController({
  capabilityRegistry:rewardCapabilities,
  getStatus:learnerId=>{
    const capability=rewardCapabilities.get(learnerId);
    return capability?.mode==='academic'&&capability.getState?rewardService.evaluate(learnerId,capability.getState()):{};
  },
  onExit:learnerId=>rewardCapabilities.get(learnerId)?.onEnter?.()
});

const gameLearning=createGameLearningAdapter({
  getYasserState:()=>yasser.getState(),saveYasserState:state=>yasserRepository.save(state),
  getKhaledState:()=>khaled.getState(),saveKhaledState:state=>khaledRepository.save(state)
});

const familyParent=createFamilyParentController({
  reportCapabilities:parentReportCapabilities,
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
