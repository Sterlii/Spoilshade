import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const script=fileURLToPath(new URL('../scripts/archive.py',import.meta.url));
function fixture(run) {
  const directory=mkdtempSync(path.join(tmpdir(),'spoilshade-archive-'));
  const root=path.join(directory,'tree');mkdirSync(root);
  const write=(name,value='synthetic fixture')=>{const target=path.join(root,name);mkdirSync(path.dirname(target),{recursive:true});writeFileSync(target,value);};
  try {run({directory,root,write});} finally {rmSync(directory,{recursive:true,force:true});}
}
function list(root,output) {
  execFileSync('python3',[script,root,output]);
  return JSON.parse(execFileSync('python3',['-c','import zipfile,json,sys;print(json.dumps(zipfile.ZipFile(sys.argv[1]).namelist()))',output],{encoding:'utf8'}));
}
test('source packaging excludes private captures, receipts, credentials and development caches',()=>fixture(({directory,root,write})=>{
  for(const name of ['README.md','docs/screenshots/firefox-fixture-dark.png','.git/config','node_modules/tool/index.js','.test-cache/profile/data','release/build.zip','dist/output.js','docs/__pycache__/cache.pyc','Images/raw.png','docs/evidence/build.log','docs/BROWSER-RESULTS.json','docs/FIREFOX-TOOLBAR-RESULT.json','docs/screenshots/firefox-live-youtube.png','.env','docs/.env.local','docs/.npmrc','docs/private.key','docs/private.pem','docs/PRIVATE-AUDIT.md'])write(name);
  assert.deepEqual(list(root,path.join(directory,'source.zip')),['README.md','docs/screenshots/firefox-fixture-dark.png']);
}));
test('source packaging excludes symlinks rather than reading outside the source tree',()=>fixture(({directory,root,write})=>{
  write('README.md');writeFileSync(path.join(directory,'private.txt'),'synthetic private fixture');
  symlinkSync(path.join(directory,'private.txt'),path.join(root,'linked.txt'));
  assert.deepEqual(list(root,path.join(directory,'source.zip')),['README.md']);
}));
