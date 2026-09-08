import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_RELEASE_GATE } from '../src/modules/mashaal/release-gate.js';
import { isMashaalReleaseReady } from '../src/modules/mashaal/release-status.js';

test('foundation branch is not considered Mashaal production ready',()=>assert.equal(isMashaalReleaseReady(MASHAAL_RELEASE_GATE),false));
