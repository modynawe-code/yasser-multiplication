import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGamePlayerService } from '../src/modules/games/core/game-player-service.js';
import { createGameLauncher } from '../src/modules/games/core/game-launcher.js';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('game player eligibility combines game contract rules with learning support',()=>{
  const service=createGamePlayerService({learningAdapter:{supports:learnerId=>learnerId!=='mashaal'}});
  const adaptive={learningMode:'adaptive',metadata:{eligibility:{}}};
  assert.deepEqual(service.listEligible(adaptive).map(item=>item.learnerId),['yasser','khaled']);

  const optional={learningMode:'optional',metadata:{eligibility:{allOf:['stage:kg3']}}};
  assert.deepEqual(service.listEligible(optional).map(item=>item.learnerId),['mashaal']);
  assert.equal(service.getCapabilities('mashaal').includes('stage:kg3'),true);
});

test('game launcher is registry-driven and supplies eligible participants to handlers',async()=>{
  const games=new Map([
    ['ready',{id:'ready',title:'Ready'}],
    ['locked',{id:'locked',title:'Locked'}]
  ]);
  const registry={get:id=>games.get(id)||null,has:id=>games.has(id)};
  const playerService={listEligible:game=>Object.freeze([{learnerId:`${game.id}-player`}])};
  const launcher=createGameLauncher({registry,playerService});
  let received=null;
  launcher.register('ready',context=>{received=context;return'opened';});

  assert.equal(launcher.canLaunch('ready'),true);
  assert.equal(launcher.canLaunch('locked'),false);
  assert.equal((await launcher.launch('locked')).reason,'unavailable');
  const result=await launcher.launch('ready',{source:'catalog'});
  assert.equal(result.ok,true);
  assert.equal(result.result,'opened');
  assert.equal(received.game.id,'ready');
  assert.equal(received.participants[0].learnerId,'ready-player');
  assert.equal(received.source,'catalog');
  assert.throws(()=>launcher.register('missing',()=>{}),/registered game is required/);
});

test('games controller launches catalog entries generically instead of wiring game ids in the catalog',async()=>{
  const source=await read('src/modules/games/games-controller.js');
  assert.match(source,/createGameLauncher/);
  assert.match(source,/querySelectorAll\('\[data-game-id\]'\)/);
  assert.doesNotMatch(source,/querySelector\('\[data-game-id="xo"\]'\)/);
  assert.doesNotMatch(source,/querySelector\('\[data-game-id="rock-paper-scissors"\]'\)/);
});
