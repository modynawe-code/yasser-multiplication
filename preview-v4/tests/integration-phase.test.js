import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_INTEGRATION_PHASE } from '../src/modules/mashaal/integration-phase.js';

test('Mashaal integration phase is explicit',()=>assert.equal(MASHAAL_INTEGRATION_PHASE,'inspect-and-wire'));
