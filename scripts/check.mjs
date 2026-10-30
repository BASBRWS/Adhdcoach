import {readdir,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
async function files(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]))).flat();}
for(const file of (await files('app')).filter(f=>f.endsWith('.js'))){const p=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});if(p.status)process.exit(p.status);}
for(const file of ['package.json','app/manifest.webmanifest','.openai/hosting.json'])JSON.parse(await readFile(file,'utf8'));
const all=await files('app');for(const file of all.filter(f=>f.endsWith('.js'))){const text=await readFile(file,'utf8');for(const match of text.matchAll(/from\s+['"](\.[^'"]+)['"]/g))await readFile(path.resolve(path.dirname(file),match[1]));}
console.log('JavaScript, JSON en lokale imports gecontroleerd.');
