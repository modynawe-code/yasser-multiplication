import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const rootUrl=path=>new URL(`../../${path}`,import.meta.url);

test('root contains no unused legacy app bundle or stylesheet',async()=>{
  await assert.rejects(access(rootUrl('app.js')));
  await assert.rejects(access(rootUrl('style.css')));
});

test('repository documents main as the only current source of truth and release gates',async()=>{
  const readme=await readFile(rootUrl('README.md'),'utf8');
  const status=await readFile(rootUrl('docs/PROJECT-STATUS.md'),'utf8');
  assert.match(readme,/preview-v4\//);
  assert.match(status,/`main` is the only current source of truth/);
  assert.match(status,/Original Khaled PNG binaries/);
  assert.match(status,/Cloud production deployment/);
  assert.match(status,/Physical Galaxy Tab validation/);
});
