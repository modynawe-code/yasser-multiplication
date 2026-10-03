import test from 'node:test';
import assert from 'node:assert/strict';
import { buyProperty, createMonopolyState, drawCard, endTurn, rollDice } from '../src/modules/games/monopoly/monopoly-engine.js';
import { deriveMonopolyEvent, dicePips } from '../src/modules/games/monopoly/monopoly-presentation.js';

const players = [{ id: 'a', name: 'أ' }, { id: 'b', name: 'ب' }];

test('rent event reports both player balances and the calculated rent', () => {
  let state = createMonopolyState(players);
  state = rollDice(state, [1, 2]);
  state = buyProperty(state);
  state = endTurn(state);
  const before = state;
  const after = rollDice(state, [1, 2]);
  const event = deriveMonopolyEvent(before, after, 'roll');
  assert.equal(event.type, 'rent');
  assert.equal(event.reason, 'طريف');
  assert.equal(event.amount, 4);
  assert.deepEqual(event.transactions.map(row => [row.before, row.after]), [[1500, 1496], [1440, 1444]]);
});

test('tax event reports the exact fee and the payer balance before and after', () => {
  const before = createMonopolyState(players);
  const after = rollDice(before, [2, 2]);
  const event = deriveMonopolyEvent(before, after, 'roll');
  assert.equal(event.type, 'tax');
  assert.equal(event.amount, 200);
  assert.deepEqual(event.transactions[0], { name: 'أ', before: 1500, after: 1300 });
});

test('dice faces have nine positions and expected visible pip counts', () => {
  for (let value = 1; value <= 6; value += 1) {
    assert.equal((dicePips(value).match(/is-visible/g) || []).length, value);
  }
});

test('purchase receipt is derived from the confirmed ownership and price', () => {
  let before = createMonopolyState(players);
  before = rollDice(before, [1, 2]);
  const after = buyProperty(before);
  const event = deriveMonopolyEvent(before, after, 'buy');
  assert.equal(event.type, 'purchase');
  assert.equal(event.amount, 60);
  assert.deepEqual(event.transactions[0], { name: 'أ', before: 1500, after: 1440 });
});

test('sale receipt separates property value from development refund', async () => {
  const { sellProperty } = await import('../src/modules/games/monopoly/monopoly-engine.js');
  const before = createMonopolyState(players);
  before.phase = 'end';
  before.ownership[3] = { ownerId: 'a', houses: 2 };
  const after = sellProperty(before, 3);
  const event = deriveMonopolyEvent(before, after, 'sell', { index: 3 });
  assert.equal(event.type, 'sale');
  assert.equal(event.amount, 80);
  assert.equal(event.detail, 'قيمة الأرض 30 · المسترد من التطوير 50');
});

test('revealed reward card reports its text and balance change', () => {
  const before = createMonopolyState(players);
  before.phase = 'card';
  before.pending = { type: 'card', card: { text: 'مكافأة عائلية', cash: 100 } };
  const after = drawCard(before);
  const event = deriveMonopolyEvent(before, after);
  assert.equal(event.type, 'reward');
  assert.equal(event.reason, 'مكافأة عائلية');
  assert.equal(event.amount, 100);
  assert.deepEqual(event.transactions[0], { name: 'أ', before: 1500, after: 1600 });
});

test('online state transition infers a tax event without local action metadata', () => {
  const before = createMonopolyState(players);
  const after = rollDice(before, [2, 2]);
  const event = deriveMonopolyEvent(before, after);
  assert.equal(event.type, 'tax');
  assert.equal(event.transactions[0].after, 1300);
});
