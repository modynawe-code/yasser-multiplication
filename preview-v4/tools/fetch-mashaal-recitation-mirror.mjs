import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SOURCE_PACKAGE_URL,
  DEFAULT_OUTPUT,
  DEFAULT_DATA,
  looksLikeMp3,
  sha256Hex,
  createRecitationRecord,
  renderRecitationMediaData
} from './import-mashaal-recitation.mjs';

const MIRROR_METADATA_COMMIT='925b94346c2bd6a82df92a5ba3cfbec0bc63c512';
const MIRROR_METADATA_URL=`https://raw.githubusercontent.com/quran-ws/kfgqpc-resources/${MIRROR_METADATA_COMMIT}/resources/quran-audios/akhdar-sura/metadata.json`;
const EXPECTED_ARCHIVE_SHA256='dfbbd1f3fc3fd36bf54b970dcdf64cbb48065fe4d89b5c7b4aa24df049bcb777';
const EXPECTED_ENTRY='sura/10-112D00-A02.mp3';
const EXPECTED_BYTES=238696;

async function fetchJson(url,{fetchImpl=fetch}={}){
  const response=await fetchImpl(url,{headers:{'user-agent':'FamilyLearning-MashaalRecitationImporter/1.0'}});
  if(!response.ok)throw new Error(`Mirror metadata fetch failed: HTTP ${response.status}.`);
  return response.json();
}

function validatePinnedMetadata(metadata){
  if(metadata?.download?.url!==SOURCE_PACKAGE_URL)throw new Error('Pinned mirror metadata does not point to the approved KFGQPC package URL.');
  if(metadata?.checksums?.computed?.sha256!==EXPECTED_ARCHIVE_SHA256)throw new Error('Pinned mirror metadata archive SHA-256 does not match the reviewed value.');
  if(metadata?.archive_extracted!==true||metadata?.file_count!==114)throw new Error('Pinned mirror metadata does not describe the expected 114-file extracted archive.');
  const target=(metadata.files||[]).find(file=>file?.path===EXPECTED_ENTRY);
  if(!target)throw new Error(`Pinned mirror metadata is missing ${EXPECTED_ENTRY}.`);
  if(target.size_bytes!==EXPECTED_BYTES)throw new Error(`Pinned mirror metadata has an unexpected Surah 112 byte length: ${target.size_bytes}.`);
  if(typeof target.url!=='string'||!target.url.startsWith('https://cdn.quran.ws/KFGQPC/resources/quran-audios/akhdar-sura/'))throw new Error('Pinned mirror transport URL is outside the reviewed KFGQPC mirror namespace.');
  return target;
}

export async function fetchMirrorMashaalRecitation({outputPath=DEFAULT_OUTPUT,dataPath=DEFAULT_DATA,fetchImpl=fetch}={}){
  const metadata=await fetchJson(MIRROR_METADATA_URL,{fetchImpl});
  const target=validatePinnedMetadata(metadata);
  const response=await fetchImpl(target.url,{headers:{'user-agent':'FamilyLearning-MashaalRecitationImporter/1.0'}});
  if(!response.ok)throw new Error(`Mirror Surah 112 fetch failed: HTTP ${response.status}.`);
  const audio=Buffer.from(await response.arrayBuffer());
  if(audio.length!==EXPECTED_BYTES)throw new Error(`Mirror Surah 112 byte length mismatch: expected ${EXPECTED_BYTES}, received ${audio.length}.`);
  if(!looksLikeMp3(audio))throw new Error('Mirror Surah 112 payload is not a valid MP3 candidate.');
  const sha256=sha256Hex(audio);
  const base=createRecitationRecord({sha256,byteLength:audio.length});
  const record=Object.freeze({...base,retrieval:Object.freeze({
    sourceAuthority:'King Fahd Glorious Quran Printing Complex',
    sourcePackage:SOURCE_PACKAGE_URL,
    sourceArchiveSha256:EXPECTED_ARCHIVE_SHA256,
    transport:'quran-ws-kfgqpc-extracted-mirror',
    transportMetadata:MIRROR_METADATA_URL,
    transportUrl:target.url,
    archiveEntry:EXPECTED_ENTRY,
    mirrorMetadataCommit:MIRROR_METADATA_COMMIT
  })});
  await mkdir(dirname(outputPath),{recursive:true});
  await writeFile(outputPath,audio);
  await mkdir(dirname(dataPath),{recursive:true});
  await writeFile(dataPath,renderRecitationMediaData(record),'utf8');
  return Object.freeze({outputPath,dataPath,sha256,byteLength:audio.length,record});
}

const invokedPath=process.argv[1]?resolve(process.argv[1]):'';
if(invokedPath===fileURLToPath(import.meta.url)){
  try{
    const result=await fetchMirrorMashaalRecitation();
    console.log(`Imported KFGQPC-derived Surah 112 through the pinned quran-ws transport mirror.\nSHA-256: ${result.sha256}\nBytes: ${result.byteLength}\nOutput: ${result.outputPath}`);
  }catch(error){
    console.error(`Pinned mirror recitation import failed: ${error.message}`);
    process.exitCode=1;
  }
}
