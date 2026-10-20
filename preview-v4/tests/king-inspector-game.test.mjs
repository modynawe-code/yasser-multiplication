import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('computer demo keeps the inspector secret until they claim the role',async()=>{
  const source=await readFile(new URL('../src/modules/games/king-inspector/king-inspector-controller.js',import.meta.url),'utf8');
  const ask=source.match(/if\(type==='ask-inspector'\)\{([^}]*)\}/)?.[1]||'';
  const claim=source.match(/else if\(type==='claim-inspector'\)\{([^}]*)\}/)?.[1]||'';
  assert.match(ask,/phase='inspector-claim'/);
  assert.doesNotMatch(ask,/inspectorRevealedId|publicRoles/);
  assert.match(claim,/inspectorRevealedId/);
  assert.match(claim,/publicRoles/);
  assert.match(source,/actorId=turn\.playerId\|\|\(s\.phase==='inspector-claim'\?s\.roles\.inspectorPlayerId:null\)/);
});

test('the challenge target sees their turn, and players get a live phase tracker',async()=>{
  const source=await readFile(new URL('../src/modules/games/king-inspector/king-inspector-controller.js',import.meta.url),'utf8');
  assert.match(source,/s\.phase==='challenge'&&s\.penaltyTargetId===id/);
  assert.match(source,/نفّذ التحدي أو تخطّه/);
  assert.match(source,/id="kiStepper" aria-label="مراحل الجولة"/);
  for(const label of ['الملك يسأل','المفتش يعرّف بنفسه','أمر الملك','المفتش يختار','التحدي والنتيجة'])assert.ok(source.includes(label),label);
  assert.match(source,/renderTurn\(\);renderStepper\(\);/);
  assert.match(source,/dataset\.activePhase!==phase/);
});
