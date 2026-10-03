import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/domain/state-model.js';
import { renderParentOverview, renderParentDetails, renderSessions } from '../src/ui/renderers.js';

test('parent overview explains accuracy versus confirmed mastery',()=>{
  const state=createInitialState();
  const html=renderParentOverview(state);
  assert.match(html,/الدقة الحالية/);
  assert.match(html,/الإتقان المؤكد/);
  assert.match(html,/قد يكون أقل من الدقة/);
});

test('parent details expose semantic fact states',()=>{
  const state=createInitialState();
  const fact=state.tables[2].facts[8];
  fact.attempts=4;fact.correct=1;fact.wrong=3;fact.recent=[false,true,false,false];
  state.tables[2].attempts=4;state.tables[2].correct=1;state.tables[2].wrong=3;
  const html=renderParentDetails(state);
  assert.match(html,/fact-status-card review/);
  assert.match(html,/يحتاج مراجعة/);
  assert.match(html,/3 خطأ تاريخي/);
});

test('sessions view includes compact summary metrics',()=>{
  const state=createInitialState();
  state.sessions=[{mode:'practice',selected:[2,3],endedAt:new Date('2026-09-05T09:00:00Z').toISOString(),completed:10,correct:8,wrong:2,incomplete:false}];
  const html=renderSessions(state);
  assert.match(html,/الجلسات المعروضة/);
  assert.match(html,/المكتملة/);
  assert.match(html,/80%/);
});
