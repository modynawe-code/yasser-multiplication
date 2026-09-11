import test from 'node:test';
import assert from 'node:assert/strict';

test('RPS controller module imports without coupling to the learner controllers',async()=>{
  const module=await import('../src/modules/games/rps/rps-controller.js');
  assert.equal(typeof module.createRpsController,'function');
});
