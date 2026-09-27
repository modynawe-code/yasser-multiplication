import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createMashaalDailyMission,listMashaalDailyMissionActivityIds,mashaalLocalDayKey } from '../src/modules/mashaal/application/daily-mission.js';
import { createMashaalDigitalAttempt } from '../src/modules/mashaal/application/digital-attempt.js';
import { createMashaalActivityCompletion } from '../src/modules/mashaal/application/activity-completion.js';

const date=new Date('2026-09-27T12:00:00Z');

test('daily mission selects three unique playable experiences deterministically',()=>{
  const first=createMashaalDailyMission({evidenceLog:[]},{date});
  const second=createMashaalDailyMission({evidenceLog:[]},{date});
  assert.equal(first.total,3);
  assert.deepEqual(first.tasks,second.tasks);
  assert.equal(new Set(first.tasks.map(task=>task.activityId)).size,3);
  assert.ok(listMashaalDailyMissionActivityIds().includes('kg3-interactive-story-morning-01'));
  assert.ok(listMashaalDailyMissionActivityIds().includes('kg3-animal-maze-duck-01'));
  assert.ok(listMashaalDailyMissionActivityIds().includes('kg3-picture-puzzle-01'));
  assert.ok(listMashaalDailyMissionActivityIds().includes('kg3-open-animal-memory-01'));
  assert.ok(listMashaalDailyMissionActivityIds().includes('kg3-open-animal-count-01'));
  assert.ok(listMashaalDailyMissionActivityIds().includes('kg3-open-animal-puzzle-01'));
  assert.ok(listMashaalDailyMissionActivityIds().includes('kg3-open-animal-sort-01'));
  for(const id of ['kg3-open-nature-memory-01','kg3-open-tree-cycle-01','kg3-open-colors-nature-01','kg3-open-seed-journey-01','kg3-open-nature-puzzle-01'])assert.ok(listMashaalDailyMissionActivityIds().includes(id));
  for(const task of first.tasks)assert.ok(listMashaalDailyMissionActivityIds().includes(task.activityId));
  assert.equal(first.done,false);
});

test('daily mission counts only successful evidence for the same local day',()=>{
  const blank={evidenceLog:[]},initial=createMashaalDailyMission(blank,{date}),activity=initial.tasks[0];
  const wrong=createMashaalDigitalAttempt({evidenceId:'wrong',skillId:activity.skillId,activityId:activity.activityId,isCorrect:false,createdAt:'2026-09-27T12:00:00Z'});
  const wrongState={evidenceLog:[wrong]};
  assert.equal(createMashaalDailyMission(wrongState,{date}).completeCount,0);
  const correct=createMashaalDigitalAttempt({evidenceId:'correct',skillId:activity.skillId,activityId:activity.activityId,isCorrect:true,createdAt:'2026-09-27T12:01:00Z'});
  assert.equal(createMashaalDailyMission({evidenceLog:[wrong,correct]},{date}).completeCount,1);
  const completion=createMashaalActivityCompletion({evidenceId:'complete',skillId:activity.skillId,activityId:activity.activityId,activityType:'matching',createdAt:'2026-09-27T12:02:00Z'});
  assert.equal(completion.payload.activityId,activity.activityId);
  assert.equal(correct.payload.activityId,activity.activityId);
});

test('daily mission ignores successful evidence from a different day',()=>{
  const initial=createMashaalDailyMission({evidenceLog:[]},{date}),activity=initial.tasks[0];
  const evidence=createMashaalActivityCompletion({evidenceId:'old',skillId:activity.skillId,activityId:activity.activityId,activityType:'matching',createdAt:'2026-09-26T12:00:00Z'});
  assert.equal(createMashaalDailyMission({evidenceLog:[evidence]},{date}).completeCount,0);
  assert.equal(mashaalLocalDayKey(date),'2026-09-27');
});

test('Mashaal home exposes daily mission controls and controller routes mission tasks',async()=>{
  const shell=await readFile(new URL('../src/modules/mashaal/ui/mashaal-shell.js',import.meta.url),'utf8');
  const controller=await readFile(new URL('../src/modules/mashaal/ui/mashaal-controller.js',import.meta.url),'utf8');
  assert.match(shell,/id="mashaalDailyMission"/);
  assert.match(shell,/id="mashaalDailyStart"/);
  assert.match(controller,/createMashaalDailyMission/);
  assert.match(controller,/openMissionTask/);
  assert.match(controller,/dailyMissionActive/);
});
