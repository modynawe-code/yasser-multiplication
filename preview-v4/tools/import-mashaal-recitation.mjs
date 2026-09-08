import { createHash } from 'node:crypto';
import { mkdir, open, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

const EOCD_SIGNATURE=0x06054b50;
const CENTRAL_SIGNATURE=0x02014b50;
const LOCAL_SIGNATURE=0x04034b50;
const MAX_EOCD_SCAN=22+0xffff;
const TARGET_SURAH=112;
const EXPECTED_PACKAGE_NAME='akhdar-sura.zip';
const SOURCE_ID='kfgqpc-ibrahim-al-akhdar-hafs';
const SOURCE_PACKAGE_URL='https://download.qurancomplex.gov.sa/new-sounds/akhdar/hafs/akhdar-sura.zip';
const OUTPUT_FILE_NAME='ibrahim-al-akhdar-hafs-112-al-ikhlas.mp3';
const DEFAULT_OUTPUT=fileURLToPath(new URL(`../assets/recitation/${OUTPUT_FILE_NAME}`,import.meta.url));
const DEFAULT_DATA=fileURLToPath(new URL('../src/modules/mashaal/curriculum/recitation-media-data.js',import.meta.url));

function assertSafeUInt32(value,label){
  if(value===0xffffffff)throw new Error(`${label}: ZIP64 archives are not supported by this importer.`);
  return value;
}

async function readExact(handle,length,position){
  const buffer=Buffer.alloc(length);
  const {bytesRead}=await handle.read(buffer,0,length,position);
  if(bytesRead!==length)throw new Error(`Unexpected end of ZIP at offset ${position}.`);
  return buffer;
}

async function findCentralDirectory(handle){
  const {size}=await handle.stat();
  if(size<22)throw new Error('Not a valid ZIP archive: file is too small.');
  const tailLength=Math.min(size,MAX_EOCD_SCAN);
  const tail=await readExact(handle,tailLength,size-tailLength);
  let offset=-1;
  for(let i=tail.length-22;i>=0;i--){
    if(tail.readUInt32LE(i)===EOCD_SIGNATURE){offset=i;break;}
  }
  if(offset<0)throw new Error('Not a valid ZIP archive: EOCD record was not found.');
  const totalEntries=tail.readUInt16LE(offset+10);
  const centralSize=assertSafeUInt32(tail.readUInt32LE(offset+12),'central-directory-size');
  const centralOffset=assertSafeUInt32(tail.readUInt32LE(offset+16),'central-directory-offset');
  if(centralOffset+centralSize>size)throw new Error('Invalid ZIP archive: central directory exceeds file size.');
  return{totalEntries,centralSize,centralOffset};
}

export async function listZipEntries(zipPath){
  const handle=await open(zipPath,'r');
  try{
    const directory=await findCentralDirectory(handle);
    const buffer=await readExact(handle,directory.centralSize,directory.centralOffset);
    const entries=[];
    let cursor=0;
    while(cursor<buffer.length){
      if(cursor+46>buffer.length||buffer.readUInt32LE(cursor)!==CENTRAL_SIGNATURE)throw new Error('Invalid ZIP central-directory entry.');
      const flags=buffer.readUInt16LE(cursor+8);
      const compressionMethod=buffer.readUInt16LE(cursor+10);
      const compressedSize=assertSafeUInt32(buffer.readUInt32LE(cursor+20),'compressed-size');
      const uncompressedSize=assertSafeUInt32(buffer.readUInt32LE(cursor+24),'uncompressed-size');
      const fileNameLength=buffer.readUInt16LE(cursor+28);
      const extraLength=buffer.readUInt16LE(cursor+30);
      const commentLength=buffer.readUInt16LE(cursor+32);
      const localHeaderOffset=assertSafeUInt32(buffer.readUInt32LE(cursor+42),'local-header-offset');
      const end=cursor+46+fileNameLength+extraLength+commentLength;
      if(end>buffer.length)throw new Error('Invalid ZIP central-directory lengths.');
      const name=buffer.subarray(cursor+46,cursor+46+fileNameLength).toString('utf8').replaceAll('\\','/');
      entries.push(Object.freeze({name,flags,compressionMethod,compressedSize,uncompressedSize,localHeaderOffset}));
      cursor=end;
    }
    if(directory.totalEntries!==0xffff&&entries.length!==directory.totalEntries)throw new Error(`ZIP entry count mismatch: expected ${directory.totalEntries}, found ${entries.length}.`);
    return Object.freeze(entries);
  }finally{await handle.close();}
}

function hasSurah112Token(name){
  const normalized=String(name||'').replaceAll('\\','/');
  return/(^|[^0-9])0*112([^0-9]|$)/.test(normalized);
}

export function selectSurah112Entry(entries,{entryName=null}={}){
  const mp3Entries=(entries||[]).filter(entry=>/\.mp3$/i.test(entry?.name||''));
  if(entryName){
    const normalized=String(entryName).replaceAll('\\','/');
    const exact=mp3Entries.find(entry=>entry.name===normalized);
    if(!exact)throw new Error(`Requested MP3 entry was not found: ${normalized}`);
    if(!hasSurah112Token(exact.name))throw new Error(`Requested entry does not identify Surah 112: ${exact.name}`);
    return exact;
  }
  const candidates=mp3Entries.filter(entry=>hasSurah112Token(entry.name));
  if(candidates.length===1)return candidates[0];
  if(candidates.length===0){
    const sample=mp3Entries.slice(0,8).map(entry=>entry.name).join(', ');
    throw new Error(`Could not identify Surah 112 automatically. Use --entry with the exact MP3 path after inspecting the official archive.${sample?` MP3 sample: ${sample}`:''}`);
  }
  throw new Error(`Multiple Surah 112 MP3 candidates were found: ${candidates.map(entry=>entry.name).join(', ')}. Use --entry to choose the exact official entry.`);
}

export async function extractZipEntry(zipPath,entry){
  if(!entry||typeof entry!=='object')throw new Error('ZIP entry metadata is required.');
  if(entry.flags&0x1)throw new Error('Encrypted ZIP entries are not supported.');
  if(entry.compressionMethod!==0&&entry.compressionMethod!==8)throw new Error(`Unsupported ZIP compression method: ${entry.compressionMethod}`);
  const handle=await open(zipPath,'r');
  try{
    const local=await readExact(handle,30,entry.localHeaderOffset);
    if(local.readUInt32LE(0)!==LOCAL_SIGNATURE)throw new Error('Invalid local ZIP header.');
    const fileNameLength=local.readUInt16LE(26),extraLength=local.readUInt16LE(28);
    const dataOffset=entry.localHeaderOffset+30+fileNameLength+extraLength;
    const compressed=await readExact(handle,entry.compressedSize,dataOffset);
    const output=entry.compressionMethod===0?compressed:inflateRawSync(compressed);
    if(output.length!==entry.uncompressedSize)throw new Error(`Extracted-size mismatch for ${entry.name}.`);
    return output;
  }finally{await handle.close();}
}

export function looksLikeMp3(buffer){
  if(!Buffer.isBuffer(buffer)||buffer.length<1024)return false;
  if(buffer.subarray(0,3).toString('ascii')==='ID3')return true;
  const limit=Math.min(buffer.length-1,4096);
  for(let i=0;i<limit;i++)if(buffer[i]===0xff&&(buffer[i+1]&0xe0)===0xe0)return true;
  return false;
}

export function sha256Hex(buffer){return createHash('sha256').update(buffer).digest('hex');}

export function createRecitationRecord({sha256,byteLength}){
  if(!/^[a-f0-9]{64}$/i.test(String(sha256||'')))throw new Error('A verified SHA-256 value is required.');
  return Object.freeze({
    id:'kfgqpc-ibrahim-al-akhdar-hafs-112',
    sourceId:SOURCE_ID,
    sourcePackage:SOURCE_PACKAGE_URL,
    localPath:`./assets/recitation/${OUTPUT_FILE_NAME}`,
    sha256:String(sha256).toLowerCase(),
    byteLength:Number(byteLength)||0,
    mimeType:'audio/mpeg',
    surahNumber:TARGET_SURAH,
    surahNameAr:'الإخلاص',
    humanVoice:true
  });
}

export function renderRecitationMediaData(record){
  return`// Plain-script data source shared by the browser modules and the classic service worker.\n// Generated only after extracting the approved KFGQPC Al-Ikhlas audio and verifying SHA-256.\nglobalThis.__FAMILY_LEARNING_RECITATION_MEDIA__=Object.freeze([\n  Object.freeze(${JSON.stringify(record,null,2).replaceAll('\n','\n  ')})\n]);\n`;
}

export async function importMashaalRecitation({zipPath,entryName=null,outputPath=DEFAULT_OUTPUT,dataPath=DEFAULT_DATA,dryRun=false}={}){
  if(!zipPath)throw new Error('Path to the official akhdar-sura.zip archive is required.');
  const absoluteZip=resolve(zipPath);
  if(basename(absoluteZip).toLowerCase()!==EXPECTED_PACKAGE_NAME)throw new Error(`Expected the official package filename ${EXPECTED_PACKAGE_NAME}. Refusing to import ${basename(absoluteZip)}.`);
  const entries=await listZipEntries(absoluteZip);
  const target=selectSurah112Entry(entries,{entryName});
  if(dryRun)return Object.freeze({zipPath:absoluteZip,entry:target.name,mp3Entries:entries.filter(item=>/\.mp3$/i.test(item.name)).length});
  const audio=await extractZipEntry(absoluteZip,target);
  if(!looksLikeMp3(audio))throw new Error(`Selected entry does not look like a valid MP3 file: ${target.name}`);
  const sha256=sha256Hex(audio),record=createRecitationRecord({sha256,byteLength:audio.length});
  await mkdir(dirname(outputPath),{recursive:true});
  await writeFile(outputPath,audio);
  await mkdir(dirname(dataPath),{recursive:true});
  await writeFile(dataPath,renderRecitationMediaData(record),'utf8');
  return Object.freeze({zipPath:absoluteZip,entry:target.name,outputPath,sha256,byteLength:audio.length,record});
}

function printUsage(){
  console.log(`Usage:\n  node tools/import-mashaal-recitation.mjs <path-to-akhdar-sura.zip> [--entry <zip-entry>] [--dry-run]\n\nOfficial source package:\n  ${SOURCE_PACKAGE_URL}\n\nThe importer extracts only Surah 112, verifies MP3 structure, computes SHA-256, writes:\n  assets/recitation/${OUTPUT_FILE_NAME}\n  src/modules/mashaal/curriculum/recitation-media-data.js`);
}

function parseCli(argv){
  let zipPath=null,entryName=null,dryRun=false;
  for(let i=0;i<argv.length;i++){
    const arg=argv[i];
    if(arg==='--help'||arg==='-h')return{help:true};
    if(arg==='--dry-run'){dryRun=true;continue;}
    if(arg==='--entry'){entryName=argv[++i];if(!entryName)throw new Error('--entry requires an exact ZIP entry path.');continue;}
    if(arg.startsWith('--'))throw new Error(`Unknown option: ${arg}`);
    if(zipPath)throw new Error('Only one ZIP path may be provided.');
    zipPath=arg;
  }
  return{zipPath,entryName,dryRun,help:false};
}

const invokedPath=process.argv[1]?resolve(process.argv[1]):'';
if(invokedPath===fileURLToPath(import.meta.url)){
  try{
    const args=parseCli(process.argv.slice(2));
    if(args.help||!args.zipPath){printUsage();process.exitCode=args.help?0:2;}
    else{
      const result=await importMashaalRecitation(args);
      if(args.dryRun)console.log(`Verified archive candidate: ${result.entry} (${result.mp3Entries} MP3 entries found).`);
      else console.log(`Imported ${result.entry}\nSHA-256: ${result.sha256}\nBytes: ${result.byteLength}\nOutput: ${result.outputPath}`);
    }
  }catch(error){console.error(`Recitation import failed: ${error.message}`);process.exitCode=1;}
}
