import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_SOURCE_REGISTRY } from '../src/modules/mashaal/curriculum/source-registry.js';

test('Mashaal KG3 current structure and developmental indicators have authoritative provenance',()=>{
  const guide=MASHAAL_SOURCE_REGISTRY['saudi-curriculum-guide-2025'];
  assert.equal(guide.year,2025);
  assert.equal(guide.role,'current-structure');
  assert.ok(guide.supports.includes('kg3-six-learning-domains'));
  const standards=MASHAAL_SOURCE_REGISTRY['saudi-early-learning-standards-3-6-2015'];
  assert.equal(standards.year,2015);
  assert.equal(standards.role,'developmental-indicators');
  assert.match(standards.sourceUrl,/naeyc\.org/);
  assert.ok(standards.supports.includes('language-early-literacy'));
  assert.ok(standards.supports.includes('national-social-studies'));
  const currentPolicy=MASHAAL_SOURCE_REGISTRY['saudi-moe-early-childhood-current'];
  assert.equal(currentPolicy.role,'current-policy');
  assert.match(currentPolicy.sourceUrl,/moe\.gov\.sa/);
  assert.ok(currentPolicy.supports.includes('developmental-standards-age-3-6'));
});
