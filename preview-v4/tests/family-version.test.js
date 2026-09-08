import test from 'node:test';
import assert from 'node:assert/strict';
import { FAMILY_ARCHITECTURE_VERSION } from '../src/shared/family/version.js';

test('family architecture foundation is versioned',()=>assert.equal(FAMILY_ARCHITECTURE_VERSION,1));
