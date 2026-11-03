import {build} from 'esbuild';
import {resolve} from 'node:path';
const out=resolve(process.argv[2]||'preview-v4/monopoly-party/vendor/cinematic-scene.mjs');
await build({entryPoints:[new URL('./scene.mjs',import.meta.url).pathname],bundle:true,format:'esm',platform:'browser',target:['es2022'],minify:true,legalComments:'eof',outfile:out,logLevel:'info'});
console.log('Bundled local PixiJS + GSAP TV renderer:',out);
