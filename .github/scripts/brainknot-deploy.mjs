// Runs inside the public Pages repository's Actions job. Credentials are environment-only.
import { readFile, writeFile, mkdir, rm, readdir, lstat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const token=process.env.BRAINKNOT_RELEASE_TOKEN;
const deployment=JSON.parse(process.env.BRAINKNOT_DEPLOYMENT_INPUT||'null');
const owner=JSON.parse(process.env.BRAINKNOT_OWNER||'null'),latest=JSON.parse(process.env.BRAINKNOT_LATEST||'null');
if(!deployment || deployment.schema!==1 || deployment.identity!=='brainknot-deployment' || JSON.stringify(deployment.owner)!==JSON.stringify(owner) || deployment.version!==latest?.version)throw new Error('Stale or unowned deployment rejected.');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function api(path,raw=false){const response=await fetch('https://api.github.com'+path,{headers:{authorization:'Bearer '+token,accept:raw?'application/octet-stream':'application/vnd.github+json','x-github-api-version':'2022-11-28'}});if(!response.ok)throw new Error(`Private release fetch failed (${response.status}).`);return raw?new Uint8Array(await response.arrayBuffer()):response.json();}
async function extract(kind,target){
  const ref=deployment[kind];if(!ref||ref.tag!==`studio-${kind}-${ref.fingerprint}`||!/^[a-f0-9]{64}$/.test(ref.fingerprint))throw new Error('Invalid payload reference.');
  const base='/repos/eaverdeg/202610-Brainknot',release=await api(base+'/releases/tags/'+ref.tag);
  const asset=name=>{const found=release.assets.find(a=>a.name===name);if(!found)throw new Error('Incomplete immutable release.');return api(base+'/releases/assets/'+found.id,true);};
  const integrity=JSON.parse(Buffer.from(await asset('integrity.json')).toString());
  if(integrity.kind!==kind||integrity.fingerprint!==ref.fingerprint||sha(JSON.stringify(integrity.files))!==ref.fingerprint)throw new Error('Payload identity mismatch.');
  for(const file of integrity.files)if(!file.path || file.path.startsWith('/') || file.path.includes('\\') || file.path.split('/').includes('..') || /(?:^|\/)manufacturing(?:\/|$)/i.test(file.path))throw new Error('Unsafe/public-private payload path.');
  const archive=resolve(kind+'.tar.gz');await writeFile(archive,await asset('payload.tar.gz'));
  const names=execFileSync('tar',['-tzf',archive],{encoding:'utf8'}).split('\n').filter(Boolean);
  if(names.some(name=>name.startsWith('/')||name.split('/').includes('..')))throw new Error('Unsafe archive entry.');
  await mkdir(target,{recursive:true});execFileSync('tar',['-xzf',archive,'-C',target]);
  for(const file of integrity.files){const path=join(target,file.path),info=await lstat(path);if(!info.isFile()||info.isSymbolicLink())throw new Error('Non-file in payload.');const bytes=await readFile(path);if(bytes.length!==file.size||sha(bytes)!==file.sha256)throw new Error('Payload integrity failed.');}
}
const site=resolve('_site'),bk=join(site,'bk');
await rm(bk,{recursive:true,force:true});await mkdir(bk,{recursive:true});
await extract('frontend',bk);await extract('library',join(bk,'library'));await extract('runtime',bk);
const cataloguePath=join(bk,'library','catalogue.json'),catalogue=JSON.parse(await readFile(cataloguePath,'utf8'));
catalogue.publishedAt=deployment.libraryPublishedAt||new Date().toISOString();await writeFile(cataloguePath,JSON.stringify(catalogue));
await writeFile(join(bk,'deployment.json'),JSON.stringify({schema:1,identity:'brainknot-deployment',version:deployment.version,owner:deployment.owner,frontend:deployment.frontend.fingerprint,library:deployment.library.fingerprint,runtime:deployment.runtime.fingerprint,publishedAt:new Date().toISOString()}));
async function size(path){let sum=0;for(const entry of await readdir(path,{withFileTypes:true})){const name=join(path,entry.name);if(entry.isDirectory())sum+=await size(name);else{const info=await lstat(name);if(!info.isFile())throw new Error('Unexpected site filesystem entry.');sum+=info.size;}}return sum;}
if(await size(site)>1_000_000_000)throw new Error('Assembled site exceeds Pages 1 GB limit.');
for(const path of ['index.html','maze/index.html','runtime.json','library/catalogue.json'])await readFile(join(bk,path));
console.log('Verified Studio payloads, ownership, entry files and assembled-site size.');
