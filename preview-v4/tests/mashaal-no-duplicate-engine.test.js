import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_MODULE_CONTRACT } from '../src/modules/mashaal/module-contract.js';

test('Mashaal foundation requires shared activity primitives rather than duplicated engines',()=>assert.equal(MASHAAL_MODULE_CONTRACT.reusesSharedActivityPrimitives,true));
