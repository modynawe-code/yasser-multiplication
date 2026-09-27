import test from 'node:test';
import assert from 'node:assert/strict';
import { getMashaalKg3Activity } from '../src/modules/mashaal/curriculum/kg3-activity-catalog.js';
import { createMashaalActivityViewModel } from '../src/modules/mashaal/ui/activity-view-model.js';
import { getActivityRendererContract } from '../src/shared/activities/activity-renderer-contracts.js';
import { addMashaalSequenceValue,buildMashaalMemoryDeck,mashaalTraceIsComplete } from '../src/modules/mashaal/ui/mashaal-interaction-engines.js';

test('memory deck creates exactly two cards per visual without losing pair identity',()=>{
  const deck=buildMashaalMemoryDeck(['apple','moon','ball'],{random:()=>0});
  assert.equal(deck.length,6);
  for(const pair of ['apple','moon','ball'])assert.equal(deck.filter(card=>card.pair===pair).length,2);
  assert.equal(new Set(deck.map(card=>card.id)).size,6);
});

test('drag sequence helper keeps one copy of each selected item',()=>{
  let order=[];
  order=addMashaalSequenceValue(order,'wake');
  order=addMashaalSequenceValue(order,'brush-teeth');
  order=addMashaalSequenceValue(order,'wake');
  assert.deepEqual(order,['wake','brush-teeth']);
});

test('trace completion requires reaching the end and enough checkpoints',()=>{
  assert.equal(mashaalTraceIsComplete(14,14),true);
  assert.equal(mashaalTraceIsComplete(10,14),false);
  assert.equal(mashaalTraceIsComplete(3,14),false);
});

test('Mashaal memory activity is releasable through the generic view model and renderer contract',()=>{
  const activity=getMashaalKg3Activity('kg3-memory-match-01');
  const model=createMashaalActivityViewModel(activity);
  assert.equal(model.activityType,'memory-match');
  assert.equal(model.completionOnly,true);
  assert.deepEqual(model.stimulus.items,['apple','moon','ball']);
  assert.deepEqual(getActivityRendererContract('memory-match'),{renderer:'memory-match',mode:'memory',hideStimulus:true});
});

test('ordered sequence and tracing are routed to interactive renderers',()=>{
  assert.equal(getActivityRendererContract('ordered-sequence').renderer,'drag-sequence');
  assert.equal(getActivityRendererContract('guided-tracing').renderer,'tracing-pad');
  assert.equal(getActivityRendererContract('guided-tracing').hideStimulus,true);
});
