import './build.mjs';
import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('pages-deploy',{recursive:true});
await copyFile('dist/server/index.js','pages-deploy/_worker.js');
await copyFile('web/index.html','pages-deploy/index.html');
console.log('Upload the contents of pages-deploy to Cloudflare Pages; bind DB to a migrated D1 database.');
