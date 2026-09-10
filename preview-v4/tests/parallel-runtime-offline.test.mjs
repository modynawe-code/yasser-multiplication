import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile,access } from 'node:fs/promises';

const ROOT=new URL('../',import.meta.url);
const EXPECTED=[
  'src/composition/game-reward-runtime.js',
  'src/modules/games/core/challenge-presentation-registry.js',
  'src/modules/games/core/game-eligibility-service.js',
  'src/modules/games/core/game-event-bus.js',
  'src/modules/games/core/game-event-contract.js',
  'src/modules/games/xo/xo-events.js',
  'src/modules/games/rps/rps-events.js',
  'src/modules/games/ui/xo-challenge-presentation.js',
  'src/modules/games/ui/xo-challenge-presentation.css',
  'src/modules/mashaal/application/game-learning-provider.js',
  'src/modules/mashaal/encouragement/mashaal-encouragement-pack.js',
  'src/modules/mashaal/rewards/mashaal-reward-catalog.js',
  'src/modules/mashaal/rewards/mashaal-reward-rules.js',
  'src/modules/mashaal/ui/mashaal-game-challenge-presenter.js',
  'src/modules/mashaal/ui/mashaal-reward-graphics.js',
  'src/modules/mashaal/ui/mashaal-treasure-controller.js',
  'src/modules/mashaal/ui/mashaal-treasures.css',
  'src/shared/encouragement/encouragement-registry.js',
  'src/shared/rewards/event-reward-service.js',
  'src/shared/rewards/reward-catalog-registry.js',
  'src/shared/rewards/reward-rule-registry.js'
];

test('PWA registers the extension worker that preserves the existing service worker behavior',async()=>{
  const registration=await readFile(new URL('src/platform/pwa/register-service-worker.js',ROOT),'utf8');
  const runtime=await readFile(new URL('service-worker-runtime.js',ROOT),'utf8');
  assert.match(registration,/service-worker-runtime\.js/);
  assert.match(runtime,/importScripts\('\.\/service-worker\.js'\)/);
});

test('parallel runtime modules are explicitly precached for first-install offline use',async()=>{
  const runtime=await readFile(new URL('service-worker-runtime.js',ROOT),'utf8');
  for(const relative of EXPECTED){
    await access(new URL(relative,ROOT));
    assert.ok(runtime.includes(`'./${relative}'`),`missing extension precache path: ${relative}`);
  }
  assert.match(runtime,/EXTENSION_CACHE_VERSION/);
  assert.match(runtime,/Extension precache failed/);
});
