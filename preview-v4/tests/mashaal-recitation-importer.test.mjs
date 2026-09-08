import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createRecitationRecord,
  extractZipEntry,
  importMashaalRecitation,
  listZipEntries,
  looksLikeMp3,
  renderRecitationMediaData,
  selectSurah112Entry,
  sha256Hex
} from '../tools/import-mashaal-recitation.mjs';

function makeStoredZip(name,data){
  const fileName=Buffer.from(name,'utf8');
  const local=Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50,0);
  local.writeUInt16LE(20,4);
  local.writeUInt16LE(0,6);
  local.writeUInt16LE(0,8);
  local.writeUInt32LE(0,14);
  local.writeUInt32LE(data.length,18);
  local.writeUInt32LE(data.length,22);
  local.writeUInt16LE(fileName.length,26);
  local.writeUInt16LE(0,28);

  const central=Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50,0);
  central.writeUInt16LE(20,4);
  central.writeUInt16LE(20,6);
  central.writeUInt16LE(0,8);
  central.writeUInt16LE(0,10);
  central.writeUInt32LE(0,16);
  central.writeUInt32LE(data.length,20);
  central.writeUInt32LE(data.length,24);
  central.writeUInt16LE(fileName.length,28);
  central.writeUInt16LE(0,30);
  central.writeUInt16LE(0,32);
  central.writeUInt32LE(0,42);

  const centralOffset=local.length+fileName.length+data.length;
  const centralSize=central.length+fileName.length;
  const eocd=Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50,0);
  eocd.writeUInt16LE(1,8);
  eocd.writeUInt16LE(1,10);
  eocd.writeUInt32LE(centralSize,12);
  eocd.writeUInt32LE(centralOffset,16);
  return Buffer.concat([local,fileName,data,central,fileName,eocd]);
}

test('recitation importer identifies only the Surah 112 MP3 entry',()=>{
  const entries=[
    {name:'001.mp3'},
    {name:'surahs/112.mp3'},
    {name:'114.mp3'}
  ];
  assert.equal(selectSurah112Entry(entries).name,'surahs/112.mp3');
  assert.throws(()=>selectSurah112Entry([{name:'112.mp3'},{name:'folder/112-alt.mp3'}]),/Multiple Surah 112/);
  assert.throws(()=>selectSurah112Entry([{name:'111.mp3'}]),/Could not identify Surah 112/);
  assert.throws(()=>selectSurah112Entry(entries,{entryName:'001.mp3'}),/does not identify Surah 112/);
});

test('recitation importer reads a ZIP central directory and extracts the selected MP3 without loading unrelated files',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'mashaal-recitation-'));
  const zipPath=join(dir,'akhdar-sura.zip');
  const audio=Buffer.concat([Buffer.from('ID3'),Buffer.alloc(2048,7)]);
  await writeFile(zipPath,makeStoredZip('surahs/112.mp3',audio));
  const entries=await listZipEntries(zipPath);
  assert.equal(entries.length,1);
  assert.equal(entries[0].name,'surahs/112.mp3');
  const extracted=await extractZipEntry(zipPath,entries[0]);
  assert.deepEqual(extracted,audio);
  assert.equal(looksLikeMp3(extracted),true);
  assert.match(sha256Hex(extracted),/^[a-f0-9]{64}$/);
});

test('full importer writes only the local Al-Ikhlas asset and generated integrity manifest',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'mashaal-recitation-import-'));
  const zipPath=join(dir,'akhdar-sura.zip'),outputPath=join(dir,'assets','recitation','ikhlas.mp3'),dataPath=join(dir,'recitation-media-data.js');
  const audio=Buffer.concat([Buffer.from('ID3'),Buffer.alloc(4096,11)]);
  await writeFile(zipPath,makeStoredZip('112.mp3',audio));
  const result=await importMashaalRecitation({zipPath,outputPath,dataPath});
  assert.equal(result.entry,'112.mp3');
  assert.deepEqual(await readFile(outputPath),audio);
  assert.equal(result.sha256,sha256Hex(audio));
  const generated=await readFile(dataPath,'utf8');
  assert.match(generated,/kfgqpc-ibrahim-al-akhdar-hafs-112/);
  assert.match(generated,/"surahNumber": 112/);
  assert.match(generated,new RegExp(result.sha256));
  assert.match(generated,/"humanVoice": true/);
});

test('manifest record keeps approved source identity and local-only playback path',()=>{
  const hash='a'.repeat(64),record=createRecitationRecord({sha256:hash,byteLength:12345});
  assert.equal(record.sourceId,'kfgqpc-ibrahim-al-akhdar-hafs');
  assert.equal(record.surahNumber,112);
  assert.equal(record.sha256,hash);
  assert.match(record.localPath(/^|$)/?null:/^\.\/assets\/recitation\//);
  const source=renderRecitationMediaData(record);
  assert.match(source,/Object\.freeze/);
  assert.equal(looksLikeMp3(Buffer.from('not-mp3')),false);
});
