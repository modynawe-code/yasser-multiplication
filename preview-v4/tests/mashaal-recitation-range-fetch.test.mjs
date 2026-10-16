import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fetchOfficialMashaalRecitation } from '../tools/fetch-mashaal-recitation-official.mjs';
import { SOURCE_PACKAGE_URL, sha256Hex } from '../tools/import-mashaal-recitation.mjs';

function storedZip(entries){
  const locals=[];
  const centrals=[];
  let offset=0;
  for(const {name,data} of entries){
    const nameBytes=Buffer.from(name,'utf8');
    const local=Buffer.alloc(30+nameBytes.length);
    local.writeUInt32LE(0x04034b50,0);
    local.writeUInt16LE(20,4);
    local.writeUInt16LE(0,6);
    local.writeUInt16LE(0,8);
    local.writeUInt32LE(0,10);
    local.writeUInt32LE(0,14);
    local.writeUInt32LE(data.length,18);
    local.writeUInt32LE(data.length,22);
    local.writeUInt16LE(nameBytes.length,26);
    local.writeUInt16LE(0,28);
    nameBytes.copy(local,30);
    locals.push(local,data);

    const central=Buffer.alloc(46+nameBytes.length);
    central.writeUInt32LE(0x02014b50,0);
    central.writeUInt16LE(20,4);
    central.writeUInt16LE(20,6);
    central.writeUInt16LE(0,8);
    central.writeUInt16LE(0,10);
    central.writeUInt32LE(0,12);
    central.writeUInt32LE(0,16);
    central.writeUInt32LE(data.length,20);
    central.writeUInt32LE(data.length,24);
    central.writeUInt16LE(nameBytes.length,28);
    central.writeUInt16LE(0,30);
    central.writeUInt16LE(0,32);
    central.writeUInt16LE(0,34);
    central.writeUInt16LE(0,36);
    central.writeUInt32LE(0,38);
    central.writeUInt32LE(offset,42);
    nameBytes.copy(central,46);
    centrals.push(central);
    offset+=local.length+data.length;
  }
  const centralOffset=offset;
  const centralBuffer=Buffer.concat(centrals);
  const eocd=Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50,0);
  eocd.writeUInt16LE(0,4);
  eocd.writeUInt16LE(0,6);
  eocd.writeUInt16LE(entries.length,8);
  eocd.writeUInt16LE(entries.length,10);
  eocd.writeUInt32LE(centralBuffer.length,12);
  eocd.writeUInt32LE(centralOffset,16);
  eocd.writeUInt16LE(0,20);
  return Buffer.concat([...locals,centralBuffer,eocd]);
}

function rangeFetchFor(buffer){
  const calls=[];
  const fetchImpl=async(url,options={})=>{
    assert.equal(url,SOURCE_PACKAGE_URL);
    const raw=options?.headers?.Range||options?.headers?.range;
    calls.push(raw);
    const match=/^bytes=(\d+)-(\d+)$/.exec(String(raw||''));
    assert.ok(match,`expected Range header, got ${raw}`);
    const start=Number(match[1]);
    const requestedEnd=Number(match[2]);
    const end=Math.min(requestedEnd,buffer.length-1);
    if(start<0||start>=buffer.length||end<start)return new Response(null,{status:416});
    return new Response(buffer.subarray(start,end+1),{status:206,headers:{'content-range':`bytes ${start}-${end}/${buffer.length}`,'content-length':String(end-start+1),'accept-ranges':'bytes'}});
  };
  return{fetchImpl,calls};
}

test('official range importer fetches only Surah 112 and generates verified media data',async()=>{
  const fake111=Buffer.concat([Buffer.from('ID3'),Buffer.alloc(1500,0x11)]);
  const fake112=Buffer.concat([Buffer.from('ID3'),Buffer.alloc(4096,0x22)]);
  const archive=storedZip([
    {name:'sura/10-111D00-A02.mp3',data:fake111},
    {name:'sura/10-112D00-A02.mp3',data:fake112}
  ]);
  const {fetchImpl,calls}=rangeFetchFor(archive);
  const dir=await mkdtemp(join(tmpdir(),'mashaal-range-'));
  try{
    const outputPath=join(dir,'al-ikhlas.mp3');
    const dataPath=join(dir,'recitation-media-data.js');
    const result=await fetchOfficialMashaalRecitation({fetchImpl,outputPath,dataPath});
    assert.equal(result.entry,'sura/10-112D00-A02.mp3');
    assert.equal(result.byteLength,fake112.length);
    assert.equal(result.sha256,sha256Hex(fake112));
    assert.deepEqual(await readFile(outputPath),fake112);
    const generated=await readFile(dataPath,'utf8');
    assert.match(generated,/"surahNumber": 112/);
    assert.match(generated,new RegExp(result.sha256));
    assert.ok(calls.length>=5,'range importer should probe, read ZIP tail/central directory/header/data');
    assert.ok(calls.every(value=>String(value).startsWith('bytes=')));
    const totalRequested=calls.reduce((sum,value)=>{
      const match=/bytes=(\d+)-(\d+)/.exec(value);return sum+(Number(match[2])-Number(match[1])+1);
    },0);
    assert.ok(totalRequested<archive.length*3,'range importer must not behave like a full archive download');
  }finally{await rm(dir,{recursive:true,force:true});}
});
