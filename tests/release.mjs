import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const version=JSON.parse(readFileSync(new URL('../package.json',import.meta.url))).version;
const hash=data=>createHash('sha256').update(data).digest('hex');
function archive(file) {
  return JSON.parse(execFileSync('python3',['-c',"import zipfile,sys,json,hashlib; z=zipfile.ZipFile(sys.argv[1]); print(json.dumps({'files':{n:hashlib.sha256(z.read(n)).hexdigest() for n in z.namelist()},'manifest':json.loads(z.read('manifest.json')) if 'manifest.json' in z.namelist() else None}))",file],{encoding:'utf8'}));
}
test('browser archives exactly match shipped source and minimal permissions',()=>{
  for(const browser of ['firefox','chrome']) {
    const {files,manifest}=archive(`release/spoilshade-${version}-${browser}.zip`);
    assert.equal(manifest.version,version);assert.equal(manifest.manifest_version,3);
    assert.deepEqual(manifest.permissions,['storage']);assert.deepEqual(manifest.host_permissions,['https://www.youtube.com/*']);
    assert.deepEqual(manifest.content_scripts[0].matches,['https://www.youtube.com/*']);
    assert.equal(manifest.content_scripts[0].run_at,'document_start');
    assert.equal(manifest.background,undefined);
    for(const [name,digest] of Object.entries(files)) {
      assert.ok(name==='manifest.json'||name==='LICENSE'||name.startsWith('src/')||/^assets\/icons\/icon-\d+\.png$/.test(name),`unexpected archive payload ${name}`);
      if(name!=='manifest.json')assert.equal(digest,hash(readFileSync(name)),name);
    }
    for(const file of [...manifest.content_scripts[0].js,...manifest.content_scripts[0].css,manifest.action.default_popup,...Object.values(manifest.icons)])assert.ok(files[file],`missing ${file}`);
    if(browser==='firefox') {
      assert.equal(manifest.browser_specific_settings.gecko.id,'spoilshade@sterlii.github.io');
      assert.deepEqual(manifest.browser_specific_settings.gecko.data_collection_permissions.required,['none']);
    }
    else assert.equal(manifest.browser_specific_settings,undefined);
  }
});
test('reviewable source archive includes sources, assets, lockfile, tests and build instructions without private caches',()=>{
  const {files}=archive(`release/spoilshade-${version}-source.zip`);
  for(const name of ['README.md','LICENSE','package.json','package-lock.json','scripts/build.mjs','src/core/matcher.js','src/youtube/integration.js','tests/browser.mjs','assets/brand/logo.svg'])assert.ok(files[name],`missing source ${name}`);
  for(const name of Object.keys(files)) {
    assert.ok(!/(^|\/)(\.git|node_modules|\.test-cache|\.test-profiles|release|dist)(\/|$)/.test(name),name);
    assert.ok(!name.startsWith('Images/')&&!name.startsWith('docs/evidence/'),name);
    assert.ok(!/(^|\/)(BROWSER-RESULTS\.json|FIREFOX-TOOLBAR-RESULT\.json|\.env[^/]*|\.npmrc|\.git-credentials|PRIVATE-[^/]*)$/.test(name),name);
    assert.ok(!/(-live-youtube\.png|\.(key|pem|p12|pfx))$/.test(name),name);
  }
});
test('build produces byte-identical install archives from unchanged sources',()=>{
  const names=['firefox','chrome'].map(browser=>`release/spoilshade-${version}-${browser}.zip`);
  const before=names.map(name=>hash(readFileSync(name)));
  execFileSync(process.execPath,['scripts/build.mjs']);
  assert.deepEqual(names.map(name=>hash(readFileSync(name))),before);
});
