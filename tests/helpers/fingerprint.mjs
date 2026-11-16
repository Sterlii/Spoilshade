import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function runtimeFingerprint(root) {
  const files={};
  async function visit(relative) {
    for(const entry of (await readdir(path.join(root,relative),{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name,'en'))) {
      const file=path.posix.join(relative,entry.name);
      if(entry.isDirectory())await visit(file);
      else if(entry.isFile())files[file]=sha256(await readFile(path.join(root,file)));
    }
  }
  for(const directory of ['src','assets/icons'])await visit(directory);
  for(const file of ['scripts/build.mjs','scripts/archive.py','package.json'])files[file]=sha256(await readFile(path.join(root,file)));
  const sorted=Object.fromEntries(Object.entries(files).sort(([a],[b])=>a<b?-1:a>b?1:0));
  return {algorithm:'sha256',files:sorted,sha256:sha256(JSON.stringify(sorted))};
}
export async function verifyBuild(root,browser,snapshot) {
  const directory=path.join(root,'dist',browser), bytes=await readFile(path.join(directory,'manifest.json'));
  const manifest=JSON.parse(bytes);
  for(const [file,digest] of Object.entries(snapshot.files)) {
    if(file.startsWith('src/') || Object.values(manifest.icons).includes(file))assert.equal(sha256(await readFile(path.join(directory,file))),digest,`Stale ${browser} build: ${file}. Run npm run build.`);
  }
  return {manifestSha256:sha256(bytes)};
}
