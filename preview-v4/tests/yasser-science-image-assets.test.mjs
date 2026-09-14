import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const ASSETS=[
  'cell-comparison-exam.webp',
  'organization-levels-exam.webp',
  'meiosis-exam.webp',
  'heart-exam.webp'
];

const readAsset=name=>readFile(new URL(`../assets/science/yasser/${name}`,import.meta.url));

test('Yasser science exam WebP assets are complete RIFF files',async()=>{
  for(const name of ASSETS){
    const data=await readAsset(name);
    assert.ok(data.length>4000,`${name}: unexpectedly small`);
    assert.equal(data.subarray(0,4).toString('ascii'),'RIFF',`${name}: RIFF header`);
    assert.equal(data.subarray(8,12).toString('ascii'),'WEBP',`${name}: WEBP signature`);
    const declaredLength=data.readUInt32LE(4)+8;
    assert.equal(data.length,declaredLength,`${name}: truncated or malformed WebP`);
  }
});
