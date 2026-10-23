import {build} from 'esbuild';import {writeFileSync,readFileSync,mkdirSync} from 'node:fs';
const worker=await build({entryPoints:['src/limit.worker.ts'],bundle:true,minify:true,write:false,format:'iife',target:'es2020'});
mkdirSync('dist',{recursive:true});await build({entryPoints:['src/main.tsx'],bundle:true,minify:true,outfile:'dist/app.js',format:'iife',target:'es2020',define:{__LIMIT_WORKER__:JSON.stringify(worker.outputFiles[0].text),'process.env.NODE_ENV':'"production"'}});
const js=readFileSync('dist/app.js','utf8'),css=readFileSync('src/style.css','utf8');writeFileSync('dist/index.html',`<!doctype html><html lang="ja"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Harmonic Keyboard</title><style>${css}</style><div id="root"></div><script>${js.replaceAll('</script','<\\/script')}</script></html>`);

writeFileSync("dist/offline.html",readFileSync("dist/index.html"));
