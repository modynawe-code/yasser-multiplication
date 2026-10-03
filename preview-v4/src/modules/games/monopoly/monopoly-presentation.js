import { BOARD, PASS_START_BONUS, rentFor } from './monopoly-engine.js';

function player(state, id) {
  return state?.players?.find(item => item.id === id) || null;
}

function ownershipChanges(previous, next) {
  const indexes = new Set([...Object.keys(previous?.ownership || {}), ...Object.keys(next?.ownership || {})]);
  return [...indexes].map(index => ({
    index: Number(index),
    before: previous?.ownership?.[index] || null,
    after: next?.ownership?.[index] || null
  })).filter(change => change.before?.ownerId !== change.after?.ownerId);
}

function inferAction(previous, next, action) {
  if (action) return action;
  if (previous?.phase === 'roll' && next?.phase !== 'roll') return 'roll';
  if (previous?.phase === 'card' && next?.phase === 'end') return 'card';
  const changes = ownershipChanges(previous, next);
  if (changes.some(change => change.before && !change.after)) return 'sell';
  if (previous?.phase === 'property' && changes.some(change => !change.before && change.after)) return 'buy';
  if (previous?.phase === 'auction' && changes.some(change => !change.before && change.after)) return 'bid';
  if (changes.some(change => change.before && change.after)) return 'trade';
  return '';
}

export function deriveMonopolyEvent(previous, next, action = '', payload = {}) {
  if (!previous || !next || previous === next) return null;
  const kind = inferAction(previous, next, action);
  const actorBefore = previous.players?.[previous.turnIndex];
  const actorAfter = actorBefore && player(next, actorBefore.id);
  if (!actorBefore || !actorAfter) return null;
  const oldCash = Number(actorBefore.cash) || 0;
  const newCash = Number(actorAfter.cash) || 0;

  if (kind === 'roll') {
    const index = actorAfter.position;
    const space = BOARD[index];
    if (space?.type === 'tax') {
      const startBonus = actorAfter.position < actorBefore.position ? PASS_START_BONUS : 0;
      return {
        type: 'tax', title: 'تم دفع الضريبة', reason: space.name, amount: space.amount,
        transactions: [{ name: actorAfter.name, before: oldCash + startBonus, after: newCash }]
      };
    }
    const owner = next.ownership?.[index];
    if (owner && owner.ownerId !== actorAfter.id) {
      const ownerBefore = player(previous, owner.ownerId);
      const ownerAfter = player(next, owner.ownerId);
      const startBonus = actorAfter.position < actorBefore.position ? PASS_START_BONUS : 0;
      return {
        type: 'rent', title: 'تم دفع الإيجار', reason: space?.name || 'العقار', amount: rentFor(next, index),
        payerId: actorAfter.id, ownerId: owner.ownerId,
        transactions: [
          { name: actorAfter.name, role: 'الدافع', before: oldCash + startBonus, after: newCash },
          { name: ownerAfter?.name || 'المالك', role: 'استلم الإيجار', before: Number(ownerBefore?.cash) || 0, after: Number(ownerAfter?.cash) || 0 }
        ]
      };
    }
    return null;
  }

  if (kind === 'buy' || kind === 'bid') {
    const changed = ownershipChanges(previous, next).find(change => !change.before && change.after);
    if (!changed) return null;
    const space = BOARD[changed.index];
    const buyer = player(next, changed.after.ownerId);
    const before = player(previous, changed.after.ownerId);
    const amount = kind === 'bid' ? Number(previous.auction?.bid) || 0 : Number(space?.price) || 0;
    return {
      type: 'purchase', title: kind === 'bid' ? 'رسا المزاد' : 'تم الشراء', reason: space?.name || 'العقار', amount,
      transactions: [{ name: buyer?.name || 'المشتري', before: Number(before?.cash) || 0, after: Number(buyer?.cash) || 0 }]
    };
  }

  if (kind === 'sell') {
    const index = Number.isInteger(payload.index) ? payload.index : ownershipChanges(previous, next).find(change => change.before && !change.after)?.index;
    const space = BOARD[index];
    const ownership = previous.ownership?.[index];
    if (!space || !ownership || next.ownership?.[index]) return null;
    const development = ((ownership.houses || 0) + (ownership.hotel ? 1 : 0)) * Math.floor((space.build || 0) / 2);
    const propertyValue = Math.floor(space.price / 2);
    return {
      type: 'sale', title: 'تم البيع', reason: space.name, amount: newCash - oldCash,
      detail: `قيمة الأرض ${propertyValue} · المسترد من التطوير ${development}`,
      transactions: [{ name: actorAfter.name, before: oldCash, after: newCash }]
    };
  }

  if (kind === 'card') {
    const card = previous.pending?.card || null;
    const delta = newCash - oldCash;
    return {
      type: delta > 0 ? 'reward' : delta < 0 ? 'payment' : 'card',
      title: delta > 0 ? 'وصلتك جائزة' : delta < 0 ? 'تم خصم مبلغ البطاقة' : 'تم تطبيق البطاقة',
      reason: card?.text || next.lastCard || 'أثر البطاقة',
      amount: Math.abs(delta),
      transactions: [{ name: actorAfter.name, before: oldCash, after: newCash }]
    };
  }

  return null;
}

export function dicePips(value) {
  const positions = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
  }[Number(value)] || [];
  return Array.from({ length: 9 }, (_, index) => `<i class="mono-die-pip${positions.includes(index) ? ' is-visible' : ''}"></i>`).join('');
}
