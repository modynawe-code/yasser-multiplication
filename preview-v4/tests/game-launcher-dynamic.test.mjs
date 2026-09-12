import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameLauncher } from '../src/modules/games/core/game-launcher.js';

test('game launcher can lazy-load a registered game module without controller-specific wiring',async()=>{
  let launches=0;
  const game={id:'domino',load:async()=>({launchGame:()=>{launches+=1;return'opened';}})};
  const registry={has:id=>id==='domino',get:id=>id==='domino'?game:null};
  const launcher=createGameLauncher({registry});
  assert.equal(launcher.canLaunch('domino'),true);
  const result=await launcher.launch('domino');
  assert.equal(result.ok,true);
  assert.equal(result.result,'opened');
  assert.equal(launches,1);
});
