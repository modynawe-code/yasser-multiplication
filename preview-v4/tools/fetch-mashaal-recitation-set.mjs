import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_ID='kfgqpc-ibrahim-al-akhdar-hafs';
const SOURCE_PACKAGE='https://download.qurancomplex.gov.sa/new-sounds/akhdar/hafs/akhdar-sura.zip';
const SOURCE_ARCHIVE_SHA256='dfbbd1f3fc3fd36bf54b970dcdf64cbb48065fe4d89b5c7b4aa24df049bcb777';
const MIRROR_METADATA_COMMIT='925b94346c2bd6a82df92a5ba3cfbec0bc63c512';
const MIRROR_METADATA_URL=`https://raw.githubusercontent.com/quran-ws/kfgqpc-resources/${MIRROR_METADATA_COMMIT}/resources/quran-audios/akhdar-sura/metadata.json`;
const QURAN_SVG_COMMIT='b91d39e1065b57bdda3e94aca8ecf3575e50e1e6';
const SVG_BASE=`https://cdn.jsdelivr.net/gh/quranpedia/quran-svg@${QURAN_SVG_COMMIT}/mushafs/hafs/kfqc/svg`;
const RAW_SVG_BASE=`https://raw.githubusercontent.com/quranpedia/quran-svg/${QURAN_SVG_COMMIT}/mushafs/hafs/kfqc/svg`;
const ASSET_DIR=fileURLToPath(new URL('../assets/recitation/',import.meta.url));
const DATA_PATH=fileURLToPath(new URL('../src/modules/mashaal/curriculum/recitation-media-data.js',import.meta.url));

const TARGETS=Object.freeze([
  Object.freeze({surahNumber:1,surahNameAr:'الفاتحة',slug:'al-fatiha',pageNumber:1,focusRegion:null}),
  Object.freeze({surahNumber:114,surahNameAr:'الناس',slug:'an-nas',pageNumber:604,focusRegion:Object.freeze({top:.63,height:.37})}),
  Object.freeze({surahNumber:113,surahNameAr:'الفلق',slug:'al-falaq',pageNumber:604,focusRegion:Object.freeze({top:.29,height:.34})}),
  Object.freeze({surahNumber:112,surahNameAr:'الإخلاص',slug:'al-ikhlas',pageNumber:604,focusRegion:Object.freeze({top:0,height:.29})}),
  Object.freeze({surahNumber:111,surahNameAr:'المسد',slug:'al-masad',pageNumber:603,focusRegion:Object.freeze({top:.64,height:.36})})
]);

function sha256Hex(buffer){return createHash('sha256').update(buffer).digest('hex');}
function looksLikeMp3(buffer){
  if(!Buffer.isBuffer(buffer)||buffer.length<1024)return false;
  if(buffer.subarray(0,3).toString('ascii')==='ID3')return true;
  const limit=Math.min(buffer.length-1,4096);
  for(let i=0;i<limit;i++)if(buffer[i]===0xff&&(buffer[i+1]&0xe0)===0xe0)return true;
  return false;
}
async function fetchJson(url){
  const response=await fetch(url,{headers:{'user-agent':'FamilyLearning-MashaalRecitationImporter/2.0'}});
  if(!response.ok)throw new Error(`Metadata fetch failed: HTTP ${response.status}`);
  return response.json();
}
async function fetchBuffer(url){
  const response=await fetch(url,{headers:{'user-agent':'FamilyLearning-MashaalRecitationImporter/2.0'}});
  if(!response.ok)throw new Error(`Asset fetch failed: HTTP ${response.status} (${url})`);
  return Buffer.from(await response.arrayBuffer());
}
function validateMetadata(metadata){
  if(metadata?.download?.url!==SOURCE_PACKAGE)throw new Error('Pinned metadata does not point to the approved KFGQPC package.');
  if(metadata?.checksums?.computed?.sha256!==SOURCE_ARCHIVE_SHA256)throw new Error('Pinned KFGQPC archive checksum changed.');
  if(metadata?.archive_extracted!==true||metadata?.file_count!==114)throw new Error('Pinned metadata does not describe the reviewed 114-surah archive.');
}
function targetEntry(metadata,surahNumber){
  const code=String(surahNumber).padStart(3,'0');
  const archiveEntry=`sura/10-${code}D00-A02.mp3`;
  const entry=(metadata.files||[]).find(file=>file?.path===archiveEntry);
  if(!entry)throw new Error(`Pinned metadata is missing ${archiveEntry}.`);
  if(!Number.isInteger(entry.size_bytes)||entry.size_bytes<1024)throw new Error(`Invalid byte length for ${archiveEntry}.`);
  if(typeof entry.url!=='string'||!entry.url.startsWith('https://cdn.quran.ws/KFGQPC/resources/quran-audios/akhdar-sura/'))throw new Error(`Unapproved transport URL for ${archiveEntry}.`);
  return {entry,archiveEntry};
}
function mushafPageFor(target){
  const focusRegion=target.focusRegion?{
    surahNumber:target.surahNumber,
    top:target.focusRegion.top,
    height:target.focusRegion.height,
    labelAr:`سورة ${target.surahNameAr}`
  }:null;
  return {
    sourceId:'kfgqpc-hafs-madinah-svg',
    publisher:'King Fahd Glorious Quran Printing Complex',
    publisherAr:'مجمع الملك فهد لطباعة المصحف الشريف',
    riwayah:'Hafs from Asim',
    riwayahAr:'حفص عن عاصم',
    pageNumber:target.pageNumber,
    imagePath:`./assets/recitation/kfqc-hafs-page-${target.pageNumber}.svg`,
    imageUrl:`${SVG_BASE}/${target.pageNumber}.svg`,
    fallbackImageUrls:[`${RAW_SVG_BASE}/${target.pageNumber}.svg`],
    distributionRepository:'https://github.com/quranpedia/quran-svg',
    distributionCommit:QURAN_SVG_COMMIT,
    sourceNotice:'https://github.com/quranpedia/quran-svg/blob/main/NOTICE.md',
    offlineBundled:true,
    imageAspectRatio:.6272727273,
    ...(focusRegion?{focusRegion}:{})
  };
}
function renderData(records){
  const serialized=records.map(record=>`  Object.freeze(${JSON.stringify(record,null,2).replaceAll('\n','\n  ')})`).join(',\n');
  return `// Plain-script data source shared by browser modules and the classic service worker.\n// Five-surah Mashaal set copied from Khaled's KFGQPC/Quranpedia sources and bundled for offline use.\nglobalThis.__FAMILY_LEARNING_RECITATION_MEDIA__=Object.freeze([\n${serialized}\n]);\n`;
}

export async function fetchMashaalRecitationSet(){
  const metadata=await fetchJson(MIRROR_METADATA_URL);validateMetadata(metadata);
  await mkdir(ASSET_DIR,{recursive:true});
  const pageNumbers=[...new Set(TARGETS.map(target=>target.pageNumber))];
  for(const pageNumber of pageNumbers){
    const svg=await fetchBuffer(`${RAW_SVG_BASE}/${pageNumber}.svg`);
    const text=svg.toString('utf8');
    if(!/<svg[\s>]/i.test(text)||text.length<1000)throw new Error(`Mushaf page ${pageNumber} is not a valid SVG candidate.`);
    await writeFile(resolve(ASSET_DIR,`kfqc-hafs-page-${pageNumber}.svg`),svg);
  }
  const records=[];
  for(const target of TARGETS){
    const {entry,archiveEntry}=targetEntry(metadata,target.surahNumber);
    const audio=await fetchBuffer(entry.url);
    if(audio.length!==entry.size_bytes)throw new Error(`Byte length mismatch for Surah ${target.surahNumber}: expected ${entry.size_bytes}, received ${audio.length}.`);
    if(!looksLikeMp3(audio))throw new Error(`Surah ${target.surahNumber} payload is not a valid MP3 candidate.`);
    const fileName=`ibrahim-al-akhdar-hafs-${target.surahNumber}-${target.slug}.mp3`;
    await writeFile(resolve(ASSET_DIR,fileName),audio);
    records.push({
      id:`kfgqpc-ibrahim-al-akhdar-hafs-${target.surahNumber}`,
      sourceId:SOURCE_ID,
      sourcePackage:SOURCE_PACKAGE,
      localPath:`./assets/recitation/${fileName}`,
      sha256:sha256Hex(audio),
      byteLength:audio.length,
      mimeType:'audio/mpeg',
      surahNumber:target.surahNumber,
      surahNameAr:target.surahNameAr,
      humanVoice:true,
      mushafPage:mushafPageFor(target),
      retrieval:{
        sourceAuthority:'King Fahd Glorious Quran Printing Complex',
        sourcePackage:SOURCE_PACKAGE,
        sourceArchiveSha256:SOURCE_ARCHIVE_SHA256,
        transport:'quran-ws-kfgqpc-extracted-mirror',
        transportMetadata:MIRROR_METADATA_URL,
        transportUrl:entry.url,
        archiveEntry,
        mirrorMetadataCommit:MIRROR_METADATA_COMMIT
      }
    });
  }
  await writeFile(DATA_PATH,renderData(records),'utf8');
  return Object.freeze(records.map(record=>Object.freeze({surahNumber:record.surahNumber,localPath:record.localPath,sha256:record.sha256,byteLength:record.byteLength})));
}

const invokedPath=process.argv[1]?resolve(process.argv[1]):'';
if(invokedPath===fileURLToPath(import.meta.url)){
  try{
    const records=await fetchMashaalRecitationSet();
    console.log(`Imported ${records.length} verified Mashaal recitations.`);
    for(const record of records)console.log(`${record.surahNumber}: ${record.sha256} (${record.byteLength} bytes)`);
  }catch(error){console.error(`Five-surah import failed: ${error.message}`);process.exitCode=1;}
}
