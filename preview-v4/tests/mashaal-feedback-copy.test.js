import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_FEEDBACK_COPY } from '../src/modules/mashaal/application/feedback-copy.js';

test('Mashaal retry feedback avoids punitive error wording',()=>{
  assert.ok(MASHAAL_FEEDBACK_COPY.retry.every(text=>!text.includes('خطأ')));
});
