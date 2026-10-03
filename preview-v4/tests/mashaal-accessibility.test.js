import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MASHAAL_ACCESSIBILITY_CONTRACT } from '../src/modules/mashaal/ui/accessibility-contract.js';

test('Mashaal KG3 UI requires spoken instructions and non-color-only meaning',()=>{
  assert.equal(MASHAAL_ACCESSIBILITY_CONTRACT.spokenInstructions,true);
  assert.equal(MASHAAL_ACCESSIBILITY_CONTRACT.noColorOnlyMeaning,true);
  assert.equal(MASHAAL_ACCESSIBILITY_CONTRACT.largeTouchTargets,true);
  assert.equal(MASHAAL_ACCESSIBILITY_CONTRACT.visibleFocus,true);
  assert.equal(MASHAAL_ACCESSIBILITY_CONTRACT.reducedMotionCompatible,true);
});

test('Mashaal tablet UI implements focus, reduced motion and landscape rules',async()=>{
  const css=await readFile(new URL('../src/modules/mashaal/ui/mashaal.css',import.meta.url),'utf8');
  assert.match(css,/:focus-visible/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/orientation:landscape/);
  assert.match(css,/min-height:60px/);
  assert.match(css,/data-domain-id=/);
});

test('Mashaal ordered and multi-select choices expose pressed state accessibly',async()=>{
  const controller=await readFile(new URL('../src/modules/mashaal/ui/mashaal-controller.js',import.meta.url),'utf8');
  assert.match(controller,/aria-pressed/);
  assert.match(controller,/setAttribute\('aria-pressed','true'\)/);
  assert.match(controller,/setAttribute\('aria-pressed','false'\)/);
});
