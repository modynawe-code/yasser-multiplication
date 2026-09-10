import test from 'node:test';
import assert from 'node:assert/strict';
import { isTrackedLearningBackupKey } from '../src/shared/backup/local-backup-service.js';

test('local backup includes game reward progress for every learner',()=>{
  assert.equal(isTrackedLearningBackupKey('family-learning-game-reward-progress-v1:mashaal'),true);
  assert.equal(isTrackedLearningBackupKey('family-learning-game-reward-progress-v1:future-child'),true);
});
