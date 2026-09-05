import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/domain/state-model.js';
import { renderParentDetails, renderReportTable, renderSessions } from '../src/ui/renderers.js';

test('mobile overview includes compact cards without removing desktop report',()=>{
  const state=createInitialState();
  state.tables[2].attempts=3;
  state.tables[2].correct=2;
  state.tables[2].wrong=1;
  const html=renderReportTable(state);
  assert.match(html,/report-table-desktop/);
  assert.match(html,/mobile-table-list/);
  assert.match(html,/جدول 2/);
  assert.match(html,/محاولات/);
  assert.match(html,/إتقان/);
});

test('details expand only tables with attempts and summarize unstarted tables',()=>{
  const state=createInitialState();
  state.tables[2].attempts=1;
  state.tables[2].facts[1].attempts=1;
  state.tables[2].facts[1].correct=1;
  state.tables[2].facts[1].recent=[true];
  const html=renderParentDetails(state);
  assert.match(html,/table-detail-section/);
  assert.match(html,/جدول 2/);
  assert.match(html,/جداول لم يبدأ بها بعد/);
  assert.match(html,/جدول 1/);
  assert.doesNotMatch(html,/1 × 10/);
});

test('sessions provide mobile cards with complete selected table names',()=>{
  const state=createInitialState();
  state.sessions=[{mode:'exam',selected:[2,3],endedAt:'2026-09-05T10:00:00.000Z',completed:30,correct:22,wrong:8,bestStreak:6,incomplete:false,answers:[]}];
  const html=renderSessions(state);
  assert.match(html,/session-list-mobile/);
  assert.match(html,/جدول 2 \+ جدول 3/);
  assert.match(html,/محاولات/);
  assert.match(html,/22/);
});
