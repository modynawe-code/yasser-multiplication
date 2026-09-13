import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {expectedDominoAssetNames} from '../tools/import-domino-reference-assets.mjs';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ASSET_DIR=path.resolve(HERE,'../assets/domino/tiles');

test('local MIT domino reference set contains exactly all 28 Double-Six SVGs',async()=>{
  const expected=[...expectedDominoAssetNames()].sort();
  const actual=(await readdir(ASSET_DIR)).filter(name=>name.endsWith('.svg')).sort();
  assert.equal(expected.length,28);
  assert.deepEqual(actual,expected);
  for(const name of expected){
    const svg=await readFile(path.join(ASSET_DIR,name),'utf8');
    assert.match(svg,/^<svg\b/i,`${name} must be an SVG`);
    assert.match(svg,/viewBox="0 0 64 122"/,`${name} must keep the upstream tile geometry`);
  }
});
