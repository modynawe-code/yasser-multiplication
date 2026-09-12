import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('games platform is composed as an isolated feature module',async()=>{
  const main=await read('src/main.js');
  assert.match(main,/createGamesController/);
  assert.match(main,/createGameLearningAdapter/);
  assert.match(main,/learningAdapter:gameLearning/);
  assert.match(main,/games\.start\(\)/);
  assert.match(main,/games\?\.leave\(\)/);
});

test('games shell exposes a clear registry-hydrated local vs online XO lobby without learner hardcoding',async()=>{
  const shell=await read('src/modules/games/ui/games-shell.js');
  assert.match(shell,/gamesOpenBtn/);
  assert.match(shell,/id="gamesHomeView"/);
  assert.match(shell,/اختر اللعبة اللي تبغاها وابدأ التحدي/);
  assert.doesNotMatch(shell,/النظام قابلًا للتوسع/);
  assert.match(shell,/id="xoLobbyView"/);
  assert.match(shell,/على نفس الجهاز/);
  assert.match(shell,/اختاروا لاعبين/);
  assert.match(shell,/data-xo-lobby-mode-button="local"/);
  assert.match(shell,/data-xo-lobby-mode-button="online"/);
  assert.match(shell,/data-xo-lobby-panel="online"[^>]*hidden/);
  assert.match(shell,/مين يلعب من هذا الجهاز/);
  assert.match(shell,/id="xoLocalPlayers"/);
  assert.match(shell,/id="xoOnlinePlayers"/);
  assert.match(shell,/id="xoLocalStart"/);
  assert.match(shell,/id="xoOnlineCreate"/);
  assert.match(shell,/id="xoOnlineJoin"/);
  assert.match(shell,/maxlength="6"/);
  assert.match(shell,/id="xoGameView"/);
  assert.match(shell,/id="xoMatchTitle"/);
  assert.match(shell,/data-xo-player-slot="0"/);
  assert.match(shell,/data-xo-player-slot="1"/);
  assert.match(shell,/class="xo-layout"/);
  assert.match(shell,/id="xoChallenge"/);
  assert.match(shell,/id="xoHearChallenge"/);
  assert.match(shell,/games-open-family\.css/);
  assert.doesNotMatch(shell,/assets\/visual\/original\/yasser/);
  assert.doesNotMatch(shell,/assets\/visual\/original\/khaled/);
  assert.doesNotMatch(shell,/data-xo-learner="(?:yasser|khaled)"/);
  assert.doesNotMatch(shell,/تُحفظ المحاولات التعليمية/);
});

test('game participant registry owns optional approved artwork while the XO shell stays learner-neutral',async()=>{
  const registry=await read('src/modules/games/core/game-participant-registry.js');
  assert.match(registry,/listLearnerProfiles/);
  assert.match(registry,/getLearnerProfile/);
  assert.match(registry,/createPlayerContext/);
  assert.match(registry,/presentation\?\.symbol/);
  assert.match(registry,/presentation\?\.avatar/);
  assert.match(registry,/assets\/visual\/original\/yasser\/welcome\.png/);
  assert.match(registry,/assets\/visual\/original\/khaled\/khaled-point-thumbsup\.png/);
  assert.match(registry,/yasser\/celebrate\.png/);
  assert.match(registry,/khaled\/khaled-celebration\.png/);
  assert.match(registry,/avatar=artwork\.avatar\|\|profileAvatar\|\|null/);
});

test('XO controller uses registry participants, online room and learning boundaries without learner-controller coupling',async()=>{
  const controller=await read('src/modules/games/games-controller.js');
  assert.match(controller,/getGameParticipant/);
  assert.match(controller,/listGameParticipants/);
  assert.match(controller,/gameParticipantMarkup/);
  assert.match(controller,/learningAdapter\?\.supports/);
  assert.match(controller,/data-xo-local-learner/);
  assert.match(controller,/data-xo-online-learner/);
  assert.match(controller,/createXoState/);
  assert.match(controller,/passXoTurn/);
  assert.match(controller,/playXoMove/);
  assert.match(controller,/createGameRoomClient/);
  assert.match(controller,/createXoOnlineSession/);
  assert.match(controller,/normalizeOnlineXoRoom/);
  assert.match(controller,/createSpeechService/);
  assert.match(controller,/learningAdapter\?\.recordChallenge/);
  assert.match(controller,/onlineSession\.hasResume\(\)/);
  assert.match(controller,/onlineSession\.resume\(\)/);
  assert.match(controller,/بانتظار اللاعب الثاني…/);
  assert.match(controller,/انتظر شوي…/);
  assert.match(controller,/rematchReady/);
  assert.match(controller,/xoReset.*hidden/);
  assert.match(controller,/xoPlayAgain/);
  assert.doesNotMatch(controller,/players:\s*\['yasser','khaled'\]/);
  assert.doesNotMatch(controller,/اختر ياسر أو خالد/);
  assert.doesNotMatch(controller,/khaled-controller/);
  assert.doesNotMatch(controller,/app-controller/);
  assert.doesNotMatch(controller,/local-storage-repository/);
});

test('RPS is lazy-loaded as an independent fun-game module',async()=>{
  const catalog=await read('src/modules/games/game-catalog.js');
  const controller=await read('src/modules/games/games-controller.js');
  const shell=await read('src/modules/games/rps/rps-shell.js');
  assert.match(catalog,/rock-paper-scissors/);
  assert.match(catalog,/load:\(\)=>import\('\.\/rps\/rps-controller\.js'\)/);
  assert.match(controller,/gameRegistry\.get\('rock-paper-scissors'\)/);
  assert.match(controller,/rpsController\.start\(\)/);
  assert.match(shell,/id="rpsGameView"/);
  assert.match(shell,/أول لاعب يجمع 3 نقاط يفوز/);
  assert.match(shell,/data-rps-choice="rock"/);
  assert.match(shell,/data-rps-choice="paper"/);
  assert.match(shell,/data-rps-choice="scissors"/);
});

test('RPS presentation is a full arena rather than a page card',async()=>{
  const shell=await read('src/modules/games/rps/rps-shell.js');
  const controller=await read('src/modules/games/rps/rps-controller.js');
  const css=await read('src/modules/games/rps/rps.css');
  assert.match(shell,/class="rps-hud"/);
  assert.match(shell,/class="rps-arena-grid"/);
  assert.match(shell,/class="rps-turn-player"/);
  assert.match(shell,/class="rps-handoff-visual"/);
  assert.match(shell,/class="rps-battle"/);
  assert.match(shell,/id="rpsPointPop"/);
  assert.match(shell,/id="rpsFinalScore"/);
  assert.match(controller,/setStageState\('choosing'\)/);
  assert.match(controller,/setStageState\('handoff'\)/);
  assert.match(controller,/setStageState\('reveal'\)/);
  assert.match(controller,/setStageState\('finish'\)/);
  assert.match(controller,/createRpsAudio/);
  assert.doesNotMatch(controller,/createSpeechService/);
  assert.match(css,/height:100dvh/);
  assert.match(css,/width:min\(1180px,100%\)/);
  assert.match(css,/rpsMoveInLeft/);
  assert.match(css,/rpsMoveInRight/);
  assert.match(css,/rpsImpact/);
});

test('XO tablet landscape is one-screen and lobby is compact at laptop/tablet heights',async()=>{
  const css=await read('src/modules/games/ui/games.css');
  const openFamilyCss=await read('src/modules/games/ui/games-open-family.css');
  assert.match(css,/body\.games-mode \.topbar\{display:none\}/);
  assert.match(css,/body\.xo-game-mode\{overflow:hidden\}/);
  assert.match(css,/height:100dvh/);
  assert.match(css,/grid-template-columns:minmax\(340px/);
  assert.match(css,/\.xo-token\{width:82%;height:82%/);
  assert.match(css,/\.xo-lobby-shell\{height:100dvh/);
  assert.match(css,/\.xo-local-choice/);
  assert.match(openFamilyCss,/xo-local-players/);
  assert.match(openFamilyCss,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(openFamilyCss,/@media\(orientation:landscape\) and \(min-width:850px\) and \(max-height:820px\)/);
});

test('PWA shell includes resumable games, registry participants and the shared natural voice architecture',async()=>{
  const serviceWorker=await read('service-worker.js');
  assert.match(serviceWorker,/shell-\d+/);
  for(const path of [
    'src/shared/audio/human-voice-assets.js',
    'src/shared/audio/human-voice-policy.js',
    'src/shared/audio/natural-voice-profile.js',
    'src/shared/audio/voice-manifest.js',
    'src/shared/audio/voice-service.js',
    'src/shared/audio/providers/local-audio-provider.js',
    'src/shared/audio/providers/cloud-tts-provider.js',
    'src/shared/audio/providers/native-tts-provider.js',
    'src/shared/audio/providers/browser-tts-provider.js',
    'src/shared/audio/speech-service.js',
    'src/modules/games/games-controller.js',
    'src/modules/games/core/game-participant-registry.js',
    'src/modules/games/learning/game-learning-providers.js',
    'src/modules/games/online/game-room-client.js',
    'src/modules/games/online/game-room-resume-store.js',
    'src/modules/games/xo/xo-online-session.js',
    'src/modules/games/ui/games-shell.js',
    'src/modules/games/ui/games.css',
    'src/modules/games/ui/games-open-family.css',
    'src/modules/games/xo/xo-engine.js',
    'src/modules/games/rps/rps-engine.js',
    'src/modules/games/rps/rps-graphics.js',
    'src/modules/games/rps/rps-audio.js',
    'src/modules/games/rps/rps-controller.js',
    'src/modules/games/rps/rps-shell.js',
    'src/modules/games/rps/rps.css'
  ])assert.ok(serviceWorker.includes(`./${path}`),`missing ${path}`);
});
