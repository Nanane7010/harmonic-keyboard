import {copyFileSync,mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('../docs',{recursive:true});
for(const name of ['index.html','offline.html'])copyFileSync('dist/'+name,'../docs/'+name);
writeFileSync('../docs/.nojekyll','');
console.log('Updated ../docs. Commit docs/ to publish.');
