import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialMashaalState } from '../src/modules/mashaal/domain/state-model.js';
import { summarizeMashaalProgress,buildMashaalParentSummary } from '../src/modules/mashaal/application/parent-summary.js';
import { getMashaalRecitationMediaStatus } from '../src/modules/mashaal/curriculum/recitation-source-registry.js';

test('Mashaal parent summary reports developmental states rather than percentages',()=>{
  const state=createInitialMashaalState();
  state.skills.patterns.status='mastered';
  state.skills['count-and-quantity'].status='developing';
  const summary=summarizeMashaalProgress(state);
  assert.equal(summary.mastered,1);
  assert.equal(summary.developing,1);
  assert.ok(summary['not-started']>0);
  assert.equal('percentage' in summary,false);
});

test('detailed parent summary exposes all verified skills and derives the recitation blocker from verified media',()=>{
  const state=createInitialMashaalState();
  state.skills.patterns.status='mastered';
  const media=getMashaalRecitationMediaStatus();
  const summary=buildMashaalParentSummary(state);
  assert.equal(summary.totalSkills,25);
  assert.equal(summary.readySkills,media.localMediaReady?25:24);
  assert.equal(summary.blockedSkills,media.localMediaReady?0:1);
  assert.equal(summary.awaitingApprovedHumanAudio,media.localMediaReady?0:1);
  assert.equal(summary.domains.length,6);
  const skills=summary.domains.flatMap(domain=>domain.skills);
  assert.equal(skills.length,25);
  assert.equal(skills.find(skill=>skill.id==='patterns').statusLabel,'متقنة');
  const recitation=skills.find(skill=>skill.id==='listen-repeat');
  assert.equal(recitation.contentReady,media.localMediaReady);
  assert.equal(recitation.contentState,media.localMediaReady?'ready':'awaiting-approved-human-audio');
  assert.equal(recitation.contentLabel,media.localMediaReady?'نشاط جاهز':'بانتظار صوت تلاوة معتمد');
});
