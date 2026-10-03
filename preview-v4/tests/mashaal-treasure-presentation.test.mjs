import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const controllerUrl=new URL('../src/modules/mashaal/ui/mashaal-treasure-controller.js',import.meta.url);
const cssUrl=new URL('../src/modules/mashaal/ui/mashaal-treasures.css',import.meta.url);
const tierCssUrl=new URL('../src/modules/mashaal/ui/mashaal-reward-tiers.css',import.meta.url);
const swUrl=new URL('../service-worker-runtime.js',import.meta.url);

test('Mashaal treasures expose durable states, tiers and visible earning requirements',async()=>{
  const [controller,css,tierCss]=await Promise.all([readFile(controllerUrl,'utf8'),readFile(cssUrl,'utf8'),readFile(tierCssUrl,'utf8')]);
  assert.match(controller,/data-reward-state=/);
  assert.match(controller,/data-reward-tier=/);
  assert.match(controller,/كيف تحصلين عليها؟/);
  assert.match(controller,/rewardRequirementProgress/);
  assert.match(controller,/viewState\?\.isNew\?\./);
  assert.match(controller,/mashaalRewardScopeCopy/);
  assert.match(css,/\.mashaal-treasure-card\.new/);
  assert.match(tierCss,/\.mashaal-treasure-tier\.premium/);
  assert.match(tierCss,/\.mashaal-reward-progress/);
  assert.match(tierCss,/@media\(min-width:900px\) and \(pointer:coarse\)/);
});

test('Mashaal treasure presentation dependencies and premium assets are available to first-install offline mode',async()=>{
  const sw=await readFile(swUrl,'utf8');
  assert.match(sw,/EXTENSION_CACHE_PREFIX='family-learning-runtime-extensions-'/);
  assert.match(sw,/EXTENSION_CACHE_VERSION=`\$\{EXTENSION_CACHE_PREFIX\}8`/);
  assert.match(sw,/game-reward-progress-tracker\.js/);
  assert.match(sw,/reward-requirement-progress\.js/);
  assert.match(sw,/mashaal-reward-tiers\.css/);
  assert.match(sw,/premium-crown\.webp/);
  assert.match(sw,/premium-treasure-chest\.webp/);
  assert.match(sw,/mashaal-character-state-pack\.js/);
});