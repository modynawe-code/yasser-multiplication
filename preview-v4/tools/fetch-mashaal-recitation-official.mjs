import { inflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import {
  SOURCE_PACKAGE_URL,
  DEFAULT_OUTPUT,
  DEFAULT_DATA,
  parseCentralDirectory,
  selectSurah112Entry,
  writeVerifiedRecitationAudio
} from './import-mashaal-recitation.mjs';

const EOCD_SIGNATURE=0x06054b50;
const LOCAL_SIGNATURE=0x04034b50;
const MAX_EOCD_SCAN=22+0xffff;

function parseContentRange(value){
  const match=/^bytes\s+(\d+)-(\d+)\/(\d+)$/.exec(String(value||''));
  if(!match)throw new Error(`Invalid Content-Range header: ${value||'<missing>'}`);
  return{start:Number(match[1]),end:Number(match[2]),size:Number(match[3])};
}

async function fetchRange(url,start,end,{fetchImpl=fetch}={}){
  const response=await fetchImpl(url,{headers:{Range:`bytes=${start}-${end}`,'user-agent':'FamilyLearning-MashaalRecitationImporter/1.0'}});
  if(response.status!==206){
    try{await response.body?.cancel?.();}catch{}
    throw new Error(`Official package server must support HTTP Range. Expected 206, received ${response.status}.`);
  }
  const range=parseContentRange(response.headers.get('content-range'));
  if(range.start!==start||range.end!==end)throw new Error(`Unexpected byte range: requested ${start}-${end}, received ${range.start}-${range.end}.`);
  const buffer=Buffer.from(await response.arrayBuffer());
  const expected=end-start+1;
  if(buffer.length!==expected)throw new Error(`Range length mismatch: expected ${expected}, received ${buffer.length}.`);
  return{buffer,totalSize:range.size};
}

async function probeSize(url,{fetchImpl=fetch}={}){
  const response=await fetchImpl(url,{headers:{Range:'bytes=0-0','user-agent':'FamilyLearning-MashaalRecitationImporter/1.0'}});
  if(response.status!==206){
    try{await response.body?.cancel?.();}catch{}
    throw new Error(`Official package server does not expose byte ranges (status ${response.status}).`);
  }
  const range=parseContentRange(response.headers.get('content-range'));
  try{await response.body?.cancel?.();}catch{}
  if(range.size<22)throw new Error('Official ZIP package is unexpectedly small.');
  return range.size;
}

function findEocd(tail,tailStart,totalSize){
  let offset=-1;
  for(let i=tail.length-22;i>=0;i--){
    if(tail.readUInt32LE(i)===EOCD_SIGNATURE){offset=i;break;}
  }
  if(offset<0)throw new Error('Could not locate ZIP EOCD in official package tail.');
  const totalEntries=tail.readUInt16LE(offset+10);
  const centralSize=tail.readUInt32LE(offset+12);
  const centralOffset=tail.readUInt32LE(offset+16);
  if(totalEntries===0xffff||centralSize===0xffffffff||centralOffset===0xffffffff)throw new Error('ZIP64 official archive is not supported by this range importer.');
  if(centralOffset+centralSize>totalSize)throw new Error('Official ZIP central directory exceeds package size.');
  const absoluteEocd=tailStart+offset;
  if(centralOffset+centralSize>absoluteEocd)throw new Error('Official ZIP central directory overlaps EOCD.');
  return{totalEntries,centralSize,centralOffset};
}

async function fetchTargetAudio(url,{fetchImpl=fetch}={}){
  const totalSize=await probeSize(url,{fetchImpl});
  const tailLength=Math.min(totalSize,MAX_EOCD_SCAN);
  const tailStart=totalSize-tailLength;
  const {buffer:tail}=await fetchRange(url,tailStart,totalSize-1,{fetchImpl});
  const directory=findEocd(tail,tailStart,totalSize);
  const {buffer:central}=await fetchRange(url,directory.centralOffset,directory.centralOffset+directory.centralSize-1,{fetchImpl});
  const entries=parseCentralDirectory(central,directory.totalEntries);
  const target=selectSurah112Entry(entries);
  if(target.flags&0x1)throw new Error('Official Surah 112 entry is encrypted.');
  if(target.compressionMethod!==0&&target.compressionMethod!==8)throw new Error(`Unsupported official ZIP compression method: ${target.compressionMethod}`);

  const {buffer:local}=await fetchRange(url,target.localHeaderOffset,target.localHeaderOffset+29,{fetchImpl});
  if(local.readUInt32LE(0)!==LOCAL_SIGNATURE)throw new Error('Invalid local ZIP header for official Surah 112 entry.');
  const fileNameLength=local.readUInt16LE(26),extraLength=local.readUInt16LE(28);
  const dataOffset=target.localHeaderOffset+30+fileNameLength+extraLength;
  const {buffer:compressed}=await fetchRange(url,dataOffset,dataOffset+target.compressedSize-1,{fetchImpl});
  const audio=target.compressionMethod===0?compressed:inflateRawSync(compressed);
  if(audio.length!==target.uncompressedSize)throw new Error(`Official Surah 112 extracted-size mismatch: expected ${target.uncompressedSize}, received ${audio.length}.`);
  return{audio,target,totalSize,entryCount:entries.length};
}

export async function fetchOfficialMashaalRecitation({url=SOURCE_PACKAGE_URL,outputPath=DEFAULT_OUTPUT,dataPath=DEFAULT_DATA,fetchImpl=fetch}={}){
  if(url!==SOURCE_PACKAGE_URL)throw new Error('Only the approved KFGQPC Ibrahim Al-Akhdar Hafs package URL is accepted.');
  const fetched=await fetchTargetAudio(url,{fetchImpl});
  const written=await writeVerifiedRecitationAudio(fetched.audio,{outputPath,dataPath});
  return Object.freeze({
    sourcePackage:url,
    archiveBytes:fetched.totalSize,
    archiveEntries:fetched.entryCount,
    entry:fetched.target.name,
    ...written
  });
}

const invokedPath=process.argv[1]?resolve(process.argv[1]):'';
if(invokedPath===fileURLToPath(import.meta.url)){
  try{
    const result=await fetchOfficialMashaalRecitation();
    console.log(`Imported official KFGQPC Surah 112 by HTTP Range.\nEntry: ${result.entry}\nArchive bytes: ${result.archiveBytes}\nSHA-256: ${result.sha256}\nBytes: ${result.byteLength}\nOutput: ${result.outputPath}`);
  }catch(error){
    console.error(`Official recitation range import failed: ${error.message}`);
    process.exitCode=1;
  }
}
