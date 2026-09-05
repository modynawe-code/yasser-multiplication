import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Khaled count zero renders an explicit visual instead of an empty stage',async()=>{
  const controller=await read('src/modules/khaled/ui/khaled-controller.js');
  assert.match(controller,/count===0\?'<div class="khaled-zero-visual">/);
  assert.match(controller,/لا توجد دوائر/);
});

test('first wrong answer stays on the same question and is permanently recorded',async()=>{
  const controller=await read('src/modules/khaled/ui/khaled-controller.js');
  assert.match(controller,/recordKhaledAttempt\(state/);
  assert.match(controller,/session\.retryCount<2/);
  assert.match(controller,/جرّب مرة ثانية — الخطأ محفوظ ونتعلم منه/);
  assert.match(controller,/function advanceAfter/);
});

test('speech is blocked while feedback is pending so it cannot announce the next question early',async()=>{
  const controller=await read('src/modules/khaled/ui/khaled-controller.js');
  assert.match(controller,/if\(!feedbackPending&&active\?\.id===id\)speech\.speak/);
  assert.match(controller,/if\(feedbackPending\)return;const question=session\?\.questions/);
});

test('Khaled feedback is announced accessibly and touch layout has Galaxy Tab landscape rules',async()=>{
  const shell=await read('src/modules/hub/learning-shell.js');
  const css=await read('src/modules/khaled/ui/khaled-device-hardening.css');
  assert.match(shell,/id="khaledFeedback" role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(css,/touch-action:manipulation/);
  assert.match(css,/min-inline-size:48px/);
  assert.match(css,/@media \(orientation:landscape\) and \(min-width:700px\) and \(max-height:900px\)/);
  assert.match(css,/prefers-reduced-motion:reduce/);
});
