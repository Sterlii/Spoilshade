import {mkdir,cp,readFile,writeFile,rm,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {version}=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
const common={
  manifest_version:3,
  name:'Spoilshade',version,
  description:'Hide the spoilers. Keep the surprise. Local keyword-based YouTube title and thumbnail protection.',
  permissions:['storage'],
  host_permissions:['https://www.youtube.com/*'],
  icons:Object.fromEntries([16,32,48,96,128].map(size=>[size,`assets/icons/icon-${size}.png`])),
  action:{default_title:'Spoilshade — spoiler protection',default_popup:'src/popup/popup.html',default_icon:{16:'assets/icons/icon-16.png',32:'assets/icons/icon-32.png',48:'assets/icons/icon-48.png'}},
  content_scripts:[{
    matches:['https://www.youtube.com/*'],
    run_at:'document_start',all_frames:false,
    css:['src/youtube/guard.css'],
    js:['src/core/defaults.js','src/core/matcher.js','src/core/settings.js','src/youtube/redaction.js','src/youtube/integration.js']
  }],
  content_security_policy:{extension_pages:"script-src 'self'; object-src 'none'"}
};
await mkdir(path.join(root,'release'),{recursive:true});
for(const browser of ['firefox','chrome']) {
  const dest=path.join(root,'dist',browser);
  await rm(dest,{recursive:true,force:true}); await mkdir(dest,{recursive:true});
  await cp(path.join(root,'src'),path.join(dest,'src'),{recursive:true});
  await mkdir(path.join(dest,'assets','icons'),{recursive:true});
  for(const file of await readdir(path.join(root,'assets','icons'))) if(/^icon-(16|32|48|96|128)\.png$/.test(file)) await cp(path.join(root,'assets','icons',file),path.join(dest,'assets','icons',file));
  await cp(path.join(root,'LICENSE'),path.join(dest,'LICENSE'));
  const manifest=structuredClone(common);
  if(browser==='firefox') manifest.browser_specific_settings={gecko:{id:'spoilshade@sterlii.github.io',strict_min_version:'142.0',data_collection_permissions:{required:['none']}}};
  else manifest.minimum_chrome_version='120';
  await writeFile(path.join(dest,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  const output=path.join(root,'release',`spoilshade-${version}-${browser}.zip`);
  // Python's zipfile is available on the target system; no bundler/minification or hidden downloaded code.
  execFileSync('python3',[path.join(root,'scripts','archive.py'),dest,output]);
  console.log(`${browser}: ${output}`);
}
const source=path.join(root,'release',`spoilshade-${version}-source.zip`);
execFileSync('python3',[path.join(root,'scripts','archive.py'),root,source,'.gitignore','README.md','LICENSE','package.json','package-lock.json','src','assets','docs','scripts','tests']);
const checksums=[];
for(const browser of ['firefox','chrome','source']) {
  const filename=`spoilshade-${version}-${browser}.zip`;
  const digest=createHash('sha256').update(await readFile(path.join(root,'release',filename))).digest('hex');
  checksums.push(`${digest}  ${filename}`);
}
await writeFile(path.join(root,'release','SHA256SUMS'),checksums.join('\n')+'\n');
console.log(`source: ${source}`);
