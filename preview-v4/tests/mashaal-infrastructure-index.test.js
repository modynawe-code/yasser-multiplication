import test from 'node:test';
import assert from 'node:assert/strict';
import * as infrastructure from '../src/modules/mashaal/infrastructure/index.js';

test('Mashaal infrastructure API exposes isolated persistence',()=>assert.equal(typeof infrastructure.createMashaalLocalStorageRepository,'function'));
