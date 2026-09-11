import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflowUrl=new URL('../../.github/workflows/frontend-preview-deploy.yml',import.meta.url);

test('frontend preview workflow always publishes GitHub Pages while keeping optional Cloudflare deployment isolated',async()=>{
  const workflow=await readFile(workflowUrl,'utf8');
  assert.match(workflow,/cloudflare_available/);
  assert.match(workflow,/actions\/deploy-pages@v4/);
  assert.match(workflow,/actions\/upload-pages-artifact@v4/);
  assert.match(workflow,/pages:\s*write/);
  assert.match(workflow,/id-token:\s*write/);
  assert.match(workflow,/__FAMILY_API_DISABLED__=true/);
  assert.match(workflow,/"cloudSync": false/);
  assert.match(workflow,/wrangler@4\.129\.0 deploy/);
  assert.match(workflow,/if: needs\.build\.outputs\.cloudflare_available == 'true'/);
  assert.doesNotMatch(workflow,/github-pages:\s*[\s\S]*?if: needs\.build\.outputs\.cloudflare_available != 'true'/);
});