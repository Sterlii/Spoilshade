import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,cp,rm,access,readdir} from 'node:fs/promises';
import {homedir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Builder,By,Key} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {chromium} from 'playwright';
import {createHash} from 'node:crypto';
import {runtimeFingerprint,verifyBuild} from './helpers/fingerprint.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cache=path.join(root,'.test-cache');
process.env.SE_CACHE_PATH=path.join(cache,'selenium');
await mkdir(cache,{recursive:true});
const screenshots=path.join(root,'docs','screenshots');await mkdir(screenshots,{recursive:true});
const evidence={started:new Date().toISOString(),fixture:'Loopback representative DOM; test-only manifest adds localhost. Not live YouTube.',browsers:[],liveYouTube:[]};
const server=createServer(async(req,res)=>{
  try {
    const image=req.url==='/thumbnail.svg';
    res.setHeader('Content-Type',image?'image/svg+xml':'text/html');
    res.end(await readFile(path.join(root,'tests','fixtures',image?'thumbnail.svg':'discovery.html')));
  } catch {res.statusCode=500;res.end('Fixture unavailable');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const fixtureURL=`http://127.0.0.1:${server.address().port}/discovery.html`;

async function prepare(browser) {
  const target=path.join(cache,`${browser}-extension`);
  await rm(target,{recursive:true,force:true});await cp(path.join(root,'dist',browser),target,{recursive:true});
  const manifest=JSON.parse(await readFile(path.join(target,'manifest.json'),'utf8'));
  manifest.host_permissions.push('http://127.0.0.1/*');
  manifest.content_scripts[0].matches.push('http://127.0.0.1/*');
  await writeFile(path.join(target,'manifest.json'),JSON.stringify(manifest));
  return target;
}
async function wait(api,predicate,message) {
  const deadline=Date.now()+10000;
  while(Date.now()<deadline) {
    if(await api.evaluate(predicate)) return;
    await new Promise(resolve=>setTimeout(resolve,30));
  }
  throw new Error(`Timeout: ${message}`);
}
async function runFixture(api,name,popupURL) {
  const cases=[],metrics={};
  async function check(label,fn) {await fn();cases.push(label);console.log(`${name}: PASS ${label}`);}
  await api.goto(fixtureURL);
  await wait(api,()=>document.querySelectorAll('[data-ss-ui="title"]').length===2,'initial preset redaction');
  const fixtureTab=await api.tab();
  await check('document-start guards conceal matching content at parser-time before first paint',async()=>{
    assert.deepEqual(await api.evaluate(()=>window.__spoilshadeFirstPaintProbe),['hidden','hidden']);
  });
  await check('presets redact legacy and modern cards without blocking GTA V',async()=>{
    assert.equal(await api.evaluate(()=>document.querySelector('[data-test="gta"] #video-title').getAttribute('aria-hidden')),'true');
    assert.equal(await api.evaluate(()=>document.querySelector('[data-test="gtav"] [data-ss-ui]')===null),true);
    assert.equal(await api.evaluate(()=>document.querySelector('[data-test="safe"] #video-title').getBoundingClientRect().height>0),true);
  });
  const initialGeometry=await api.evaluate(()=>{const r=document.querySelector('[data-test="gta"]').getBoundingClientRect();return {width:r.width,height:r.height};});
  await check('independent reveal, keyboard control and no video navigation',async()=>{
    await api.click('[data-test="gta"] [data-ss-control="title"]');
    assert.equal(await api.evaluate(()=>document.querySelector('[data-test="gta"] #video-title').hasAttribute('aria-hidden')),false);
    assert.equal(await api.evaluate(()=>document.querySelector('[data-test="gta"] #thumbnail').getAttribute('aria-hidden')),'true');
    const titleLayout=await api.evaluate(()=>{
      const title=document.querySelector('[data-test="gta"] #video-title'),button=document.querySelector('[data-test="gta"] [data-ss-control="title"]');
      const t=title.getBoundingClientRect(),b=button.getBoundingClientRect(),p=title.parentElement.getBoundingClientRect();
      return {titleRight:t.right,buttonLeft:b.left,buttonRight:b.right,parentRight:p.right,buttonBottom:b.bottom,controlBottom:button.parentElement.getBoundingClientRect().bottom};
    });
    assert.ok(titleLayout.titleRight+4<=titleLayout.buttonLeft,'Hide title must have a separate right-hand slot, not overlay the title');
    assert.ok(titleLayout.buttonRight<=titleLayout.parentRight+1,'Hide title stays inside the title row');
    assert.ok(titleLayout.buttonBottom<=titleLayout.controlBottom+1,'Hide title is not clipped');
    await api.screenshot(path.join(screenshots,`${name}-title-revealed.png`));
    assert.equal(await api.evaluate(()=>document.querySelector('[data-test="modern"] .yt-lockup-metadata-view-model__title').getAttribute('aria-hidden')),'true');
    assert.equal(await api.evaluate(()=>location.pathname),'/discovery.html');
    await api.key('[data-test="gta"] [data-ss-control="thumbnail"]','Enter');
    assert.equal(await api.evaluate(()=>document.querySelector('[data-test="gta"] #thumbnail').hasAttribute('aria-hidden')),false);
    await api.click('[data-test="gta"] [data-ss-control="title"]');
    await api.click('[data-test="gta"] [data-ss-control="thumbnail"]');
    const now=await api.evaluate(()=>{const r=document.querySelector('[data-test="gta"]').getBoundingClientRect();return {width:r.width,height:r.height};});
    assert.deepEqual(now,initialGeometry);
  });
  await check('right-hand title controls stay separate for inline and clamped titles at wide and narrow widths',async()=>{
    for(const variant of ['inline','modern']) {
      await api.evaluate(variant=>{
        const source=document.querySelector(variant==='inline'?'[data-test="gta"]':'[data-test="modern"]');
        const card=source.cloneNode(true);
        for(const ui of card.querySelectorAll('[data-ss-ui]'))ui.remove();
        for(const el of [card,...card.querySelectorAll('*')])for(const attr of [...el.attributes])if(attr.name.startsWith('data-ss-')||['aria-hidden','inert'].includes(attr.name))el.removeAttribute(attr.name);
        card.dataset.test='layout';card.style.gridColumn='1 / -1';card.style.width='700px';card.style.alignSelf='start';
        const title=card.querySelector(variant==='inline'?'#video-title':'.yt-lockup-metadata-view-model__title');
        title.textContent='GTA 6 launch trailer with a deliberately long title to check wrapping and separation from the hide control';
        const link=variant==='inline'?title:document.createElement('a');
        link.href='/watch?v=layout-'+variant;
        if(variant==='modern') {link.textContent=title.textContent;title.replaceChildren(link);title.style.display='-webkit-box';title.style.webkitLineClamp='2';title.style.webkitBoxOrient='vertical';title.style.maxHeight='40px';}
        else title.style.display='inline';
        title.style.lineHeight='20px';title.style.minHeight='40px';
        document.querySelector('#cards').prepend(card);
      },variant);
      await wait(api,()=>!!document.querySelector('[data-test="layout"] [data-ss-control="title"]'),'layout sample redacted');
      await api.click('[data-test="layout"] [data-ss-control="title"]');
      for(const width of [700,360,240]) {
        await api.evaluate(width=>{
          const card=document.querySelector('[data-test="layout"]'),title=card.querySelector('[data-ss-title-reserved]');
          card.style.width=width+'px';
          card.querySelector('#thumbnail').style.height=(width*9/16)+'px';
          title.style.height=title.style.minHeight=title.style.maxHeight=(width===700?20:40)+'px';
        },width);
        await wait(api,()=>{
          const card=document.querySelector('[data-test="layout"]'),title=card.querySelector('[data-ss-title-reserved]'),button=card.querySelector('[data-ss-control="title"]');
          const t=title.getBoundingClientRect(),b=button.getBoundingClientRect(),p=title.parentElement.getBoundingClientRect(),u=button.parentElement.getBoundingClientRect();
          const thumbnail=card.querySelector('#thumbnail').getBoundingClientRect(),cover=card.querySelector('[data-ss-ui="thumbnail"]').getBoundingClientRect();
          return t.right+4<=b.left&&b.right<=p.right+1&&b.bottom<=u.bottom+1&&b.top>=t.top-1&&b.bottom<=t.bottom+1&&Math.abs(u.top-t.top)<1&&Math.abs(u.height-Math.max(t.height,20))<1&&Math.abs(cover.top-thumbnail.top)<1&&Math.abs(cover.height-thumbnail.height)<1;
        },`${variant} title separation at ${width}px`);
      }
      (metrics.titleLayouts ||= []).push({variant,geometry:await api.evaluate(()=>{
        const card=document.querySelector('[data-test="layout"]');
        return Object.fromEntries([['card',card],['thumbnail',card.querySelector('#thumbnail')],['title',card.querySelector('[data-ss-title-reserved]')],['control',card.querySelector('[data-ss-ui="title"]')],['button',card.querySelector('[data-ss-control="title"]')]].map(([name,node])=>{const r=node.getBoundingClientRect();return [name,{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,display:getComputedStyle(node).display,overflow:getComputedStyle(node).overflow}];}));
      })});
      if(variant==='inline')await api.screenshot(path.join(screenshots,`${name}-title-narrow.png`),'[data-test="layout"]');
      await api.evaluate(()=>document.querySelector('[data-test="layout"]').remove());
      await wait(api,()=>document.querySelectorAll('[data-ss-ui="title"]').length===2,'layout sample cleanup');
    }
  });
  await check('page reconciliation recovers retained-node controls and independent reveal state',async()=>{
    await api.click('[data-test="gta"] [data-ss-control="thumbnail"]');
    await api.evaluate(()=>{const title=document.querySelector('[data-test="gta"] #video-title');title.parentElement.replaceChildren(title);});
    await wait(api,()=>!!document.querySelector('[data-test="gta"] [data-ss-control="title"]'),'reconciled title control recovered');
    assert.equal(await api.evaluate(()=>document.querySelector('[data-test="gta"] #video-title').getAttribute('aria-hidden')),'true');
    assert.equal(await api.evaluate(()=>document.querySelector('[data-test="gta"] #thumbnail').hasAttribute('aria-hidden')),false);
    await api.evaluate(()=>document.body.append(document.querySelector('[data-test="gta"] [data-ss-ui="title"]')));
    await wait(api,()=>document.querySelector('[data-test="gta"] [data-ss-ui="title"]')?.parentElement===document.querySelector('[data-test="gta"] #video-title').parentElement,'misparented title control recovered');
    assert.equal(await api.evaluate(()=>document.querySelectorAll('[data-ss-ui="title"]').length),2);
    await api.click('[data-test="gta"] [data-ss-control="thumbnail"]');
  });
  await check('concealed titles removed from page tooltips/accessibility attributes',async()=>{
    assert.equal(await api.evaluate(()=>document.querySelector('[data-test="gta"] [title]')===null),true);
    assert.equal(await api.evaluate(()=>document.querySelector('[data-test="gta"] [aria-label*="GTA"]')===null),true);
    assert.equal(await api.evaluate(()=>document.querySelector('[data-test="gta"] img').hasAttribute('alt')),false);
    assert.equal(await api.evaluate(()=>getComputedStyle(document.querySelector('[data-test="gta"] #video-title')).visibility),'hidden');
    assert.equal(await api.evaluate(()=>getComputedStyle(document.querySelector('[data-test="gta"] [data-ss-ui="thumbnail"]')).backgroundColor),'rgb(18, 23, 34)');
  });
  const popupTab=await api.newTab(popupURL);
  await wait(api,()=>!!document.querySelector('input[type="text"]'),'popup input');
  await check('popup adds Jason with Enter and persisted local settings',async()=>{
    await api.enter('input[type="text"]','Jason');
    await wait(api,()=>document.body.textContent.includes('Jason'),'custom list updated');
    const saved=await api.evaluate(async()=>await (globalThis.browser||globalThis.chrome).storage.local.get('settings'));
    assert.deepEqual(saved.settings.customKeywords,['Jason']);
    await api.switchTab(fixtureTab);
    await wait(api,()=>document.querySelectorAll('[data-ss-ui="title"]').length===3,'live Jason redaction');
    assert.equal(await api.evaluate(()=>document.querySelector('[data-test="boundary"] [data-ss-ui]')===null),true);
  });
  await api.screenshot(path.join(screenshots,`${name}-fixture-dark.png`));
  await api.evaluate(()=>document.body.classList.add('light'));
  await api.screenshot(path.join(screenshots,`${name}-fixture-light.png`));
  await api.evaluate(()=>document.body.classList.remove('light'));
  await check('dynamic cards and same-ID replacement retain only individual reveal state',async()=>{
    await api.click('[data-test="jason"] [data-ss-control="title"]');
    const insertedGuard=await api.evaluate(()=>{
      const card=document.querySelector('[data-test="gta"]');
      const clone=card.cloneNode(true);
      for(const ui of clone.querySelectorAll('[data-ss-ui]'))ui.remove();
      for(const el of clone.querySelectorAll('[inert],[data-ss-concealed],[aria-hidden]')){el.removeAttribute('inert');el.removeAttribute('data-ss-concealed');el.removeAttribute('aria-hidden');}
      clone.removeAttribute('data-ss-ready');clone.dataset.test='dynamic';
      clone.querySelector('#video-title').textContent='GTA 6 fresh discovery';
      for(const a of clone.querySelectorAll('a'))a.setAttribute('href','/watch?v=dynamic-a');
      document.querySelector('#cards').append(clone);
      const jason=document.querySelector('[data-test="jason"]');
      // Replace a card through representative page DOM, not extension methods.
      const replacement=jason.cloneNode(true);
      for(const ui of replacement.querySelectorAll('[data-ss-ui]'))ui.remove();
      for(const el of replacement.querySelectorAll('[inert],[data-ss-concealed],[aria-hidden]')){el.removeAttribute('inert');el.removeAttribute('data-ss-concealed');el.removeAttribute('aria-hidden');}
      replacement.removeAttribute('data-ss-ready');jason.replaceWith(replacement);
      return ['#video-title','#thumbnail'].map(selector=>getComputedStyle(clone.querySelector(selector)).visibility);
    });
    assert.deepEqual(insertedGuard,['hidden','hidden']);
    await wait(api,()=>document.querySelectorAll('[data-ss-ui="title"]').length===4,'dynamic filtering');
    assert.equal(await api.evaluate(()=>document.querySelector('[data-test="jason"] #video-title').hasAttribute('aria-hidden')),false);
    assert.equal(await api.evaluate(()=>document.querySelector('[data-test="jason"] #thumbnail').getAttribute('aria-hidden')),'true');
    await api.evaluate(()=>{document.querySelector('[data-test="jason"] #video-title').textContent='Jason brand new details';});
    await wait(api,()=>document.querySelector('[data-test="jason"] #video-title').getAttribute('aria-hidden')==='true','new title revokes old reveal');
    assert.equal(await api.evaluate(()=>document.querySelector('[data-test="jason"] #thumbnail').getAttribute('aria-hidden')),'true');
  });
  await api.switchTab(popupTab);
  await api.screenshot(path.join(screenshots,`${name}-popup.png`),'body');
  await check('popup duplicate prevention and persisted reload',async()=>{
    await api.enter('input[type="text"]','jAsOn');
    const saved=await api.evaluate(async()=>await (globalThis.browser||globalThis.chrome).storage.local.get('settings'));
    assert.equal(saved.settings.customKeywords.length,1);
    await api.goto(popupURL);
    await wait(api,()=>document.body.textContent.includes('Jason'),'persisted entry after popup reopen');
  });
  await check('removing Jason restores already-loaded cards',async()=>{
    const selector=await api.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(b=>/remove.*jason/i.test(b.getAttribute('aria-label')||b.textContent));if(!b)return null;b.dataset.testRemove='';return '[data-test-remove]';});
    assert.ok(selector,'individual remove button with accessible label');await api.click(selector);
    await api.switchTab(fixtureTab);
    await wait(api,()=>document.querySelector('[data-test="jason"] [data-ss-ui]')===null,'Jason removed live');
    assert.equal(await api.evaluate(()=>document.querySelector('[data-test="jason"] #video-title').hasAttribute('aria-hidden')),false);
  });
  await api.switchTab(popupTab);
  await check('multi-word phrase, preset independence and restore defaults through popup',async()=>{
    await api.enter('input[type="text"]','quiet   drive');
    await wait(api,()=>document.querySelector('#custom-keywords').textContent.includes('quiet drive'),'phrase added');
    await api.switchTab(fixtureTab);
    await wait(api,()=>!!document.querySelector('[data-test="safe"] [data-ss-ui]'),'phrase filters loaded title');
    await api.switchTab(popupTab);await api.click('#presets-enabled');
    await api.switchTab(fixtureTab);
    await wait(api,()=>document.querySelectorAll('[data-ss-ui="title"]').length===1,'custom phrase independent of disabled presets');
    assert.ok(await api.evaluate(()=>!!document.querySelector('[data-test="safe"] [data-ss-ui]')));
    await api.switchTab(popupTab);await api.click('#restore-defaults');
    await api.switchTab(fixtureTab);await wait(api,()=>document.querySelectorAll('[data-ss-ui="title"]').length===4,'restored defaults retain phrase');
    await api.switchTab(popupTab);
    const remove=await api.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(b=>/remove.*quiet drive/i.test(b.getAttribute('aria-label')||b.textContent));if(!b)return null;b.dataset.testPhraseRemove='';return '[data-test-phrase-remove]';});
    assert.ok(remove);await api.click(remove);
    await api.switchTab(fixtureTab);await wait(api,()=>document.querySelectorAll('[data-ss-ui="title"]').length===3,'phrase removal');
    await api.switchTab(popupTab);
  });
  await check('master toggle restores normal content and re-enables protection',async()=>{
    const selector=await api.evaluate(()=>{const el=document.querySelector('input[type="checkbox"]');if(!el)return null;el.dataset.testMaster='';return '[data-test-master]';});
    assert.ok(selector);await api.click(selector);
    await api.switchTab(fixtureTab);await wait(api,()=>document.querySelector('[data-ss-ui]')===null,'master disabled');
    assert.equal(await api.evaluate(()=>document.querySelectorAll('[inert]').length),0);
    await api.switchTab(popupTab);await api.click(selector);
    await api.switchTab(fixtureTab);await wait(api,()=>document.querySelectorAll('[data-ss-ui="title"]').length===3,'master re-enabled');
  });
  await check('bulk dynamic insertion and removal leave no orphan controls',async()=>{
    const started=Date.now();
    await api.evaluate(()=>{
      const fragment=document.createDocumentFragment();
      for(let i=0;i<200;i++) {
        const card=document.createElement('ytd-video-renderer');card.dataset.testBulk='';
        const thumbnail=document.createElement('a');thumbnail.id='thumbnail';thumbnail.href=`/watch?v=bulk-${i}`;
        const image=document.createElement('img');image.src='/thumbnail.svg';thumbnail.append(image);
        const h3=document.createElement('h3'),title=document.createElement('a');title.id='video-title';title.href=thumbnail.href;title.textContent=`GTA 6 sample ${i}`;h3.append(title);card.append(thumbnail,h3);fragment.append(card);
      }
      document.querySelector('#cards').append(fragment);
    });
    await wait(api,()=>document.querySelectorAll('[data-test-bulk] [data-ss-ui="title"]').length===200,'bulk redaction');
    const elapsedMs=Date.now()-started;assert.ok(elapsedMs<10000,`bulk filtering ${elapsedMs}ms`);
    await api.evaluate(()=>{for(const card of document.querySelectorAll('[data-test-bulk]'))card.remove();});
    await wait(api,()=>document.querySelectorAll('[data-ss-ui="title"]').length===3,'bulk cleanup');
    metrics.bulk200ElapsedMs=elapsedMs;
  });
  return {name,cases,passed:cases.length,metrics,popupURL:'Extension-owned page, private test profile'};
}

async function liveCheck(api,browser) {
  const result={browser,url:'https://www.youtube.com/results?search_query=GTA+6',status:'not-tested'};
  try {
    await api.goto(result.url);
    await new Promise(resolve=>setTimeout(resolve,7000));
    Object.assign(result,await api.evaluate(()=>{
      const cardSelector='ytd-rich-grid-media,ytd-video-renderer,ytd-compact-video-renderer,ytd-grid-video-renderer,yt-lockup-view-model,ytd-reel-item-renderer,ytm-shorts-lockup-view-model,ytd-playlist-video-renderer';
      const body=document.body?.innerText||'';
      return {url:location.href,title:document.title,cards:document.querySelectorAll(cardSelector).length,protected:document.querySelectorAll('[data-ss-ui="title"]').length,ready:document.querySelectorAll('[data-ss-ready]').length,consentRedirect:/consent.youtube.com/.test(location.hostname),consentDialog:body.includes('Before you continue to YouTube'),bodyExcerpt:body.slice(0,350)};
    }));
    assert.ok(result.protected<=result.ready && result.ready<=result.cards,'live card/overlay counters are internally consistent');
    result.status=result.protected>0?'live-redaction-observed':result.cards>0?'live-cards-without-redaction':'blocked-or-no-discovery-cards';
    await api.screenshot(path.join(screenshots,`${browser}-live-youtube.png`));
  } catch(error) {result.status='navigation-failed';result.error=error.message;}
  evidence.liveYouTube.push(result);console.log('Live check',JSON.stringify(result));
}

async function chromiumBinary() {
  if(process.env.CHROMIUM_BINARY)return process.env.CHROMIUM_BINARY;
  const candidates=[chromium.executablePath()];
  const browserCache=process.env.PLAYWRIGHT_BROWSERS_PATH||path.join(homedir(),'.cache','ms-playwright');
  const entries=await readdir(browserCache).catch(()=>[]);
  for(const name of entries.filter(name=>/^chromium-\d+$/.test(name)).sort().reverse())candidates.push(path.join(browserCache,name,'chrome-linux64','chrome'));
  for(const candidate of candidates)try {await access(candidate);return candidate;} catch {}
  throw new Error('Chromium is unavailable. Set CHROMIUM_BINARY or install an isolated browser using npx playwright install chromium.');
}
let driver,context;
try {
  evidence.runtime=await runtimeFingerprint(root);
  evidence.builds={};
  for(const browser of ['firefox','chrome'])evidence.builds[browser]=await verifyBuild(root,browser,evidence.runtime);
  const firefoxPath=await prepare('firefox');
  const options=new firefox.Options().setBinary(process.env.FIREFOX_BINARY||'/usr/bin/firefox').addArguments('-headless');
  options.setPreference('browser.shell.checkDefaultBrowser',false);
  options.setPreference('extensions.webextensions.optionalPermissionPrompts',false);
  const service=new firefox.ServiceBuilder().addArguments('--allow-system-access','--profile-root',cache);
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(service).build();
  await driver.manage().window().setRect({width:1280,height:960});
  const chromeHeight=await driver.executeScript('return window.outerHeight-window.innerHeight');
  await driver.manage().window().setRect({width:1280,height:800+chromeHeight});
  const id=await driver.installAddon(firefoxPath,true);
  await driver.setContext('chrome');
  const popupURL=await driver.executeScript('return WebExtensionPolicy.getByID(arguments[0]).getURL("src/popup/popup.html")',id);
  await driver.setContext('content');
  const ff={
    goto:url=>driver.get(url),evaluate:(fn,...args)=>driver.executeScript(fn,...args),
    click:selector=>driver.findElement(By.css(selector)).click(),
    key:(selector,key)=>driver.findElement(By.css(selector)).sendKeys(key==='Enter'?Key.ENTER:key),
    enter:async(selector,text)=>{const el=await driver.findElement(By.css(selector));await el.clear();await el.sendKeys(text,Key.ENTER);},
    tab:()=>driver.getWindowHandle(),newTab:async url=>{await driver.switchTo().newWindow('tab');await driver.get(url);return driver.getWindowHandle();},switchTab:tab=>driver.switchTo().window(tab),
    screenshot:async(file,selector)=>writeFile(file,Buffer.from(selector?await driver.findElement(By.css(selector)).takeScreenshot(true):await driver.takeScreenshot(),'base64'))
  };
  evidence.browsers.push({...await runFixture(ff,'firefox',popupURL),version:(await driver.getCapabilities()).get('browserVersion')});
  await driver.uninstallAddon(id);
  await driver.installAddon(path.join(root,'dist','firefox'),true);
  await liveCheck(ff,'firefox');
  await driver.quit();driver=null;

  const chromePath=await prepare('chrome');
  const profile=path.join(cache,'chromium-profile');await rm(profile,{recursive:true,force:true});
  context=await chromium.launchPersistentContext(profile,{
    executablePath:await chromiumBinary(),
    headless:true,viewport:{width:1280,height:800},
    args:[`--disable-extensions-except=${chromePath}`,`--load-extension=${chromePath}`,'--no-first-run']
  });
  const extensionId=[...createHash('sha256').update(chromePath).digest().subarray(0,16)].map(b=>String.fromCharCode(97+(b>>4),97+(b&15))).join('');
  let page=context.pages()[0];
  const cr={
    goto:url=>page.goto(url,{timeout:30000,waitUntil:'domcontentloaded'}),evaluate:(fn,...args)=>page.evaluate(fn,args.length?args[0]:undefined),
    click:selector=>page.locator(selector).click(),key:(selector,key)=>page.locator(selector).press(key),
    enter:async(selector,text)=>{await page.locator(selector).fill(text);await page.locator(selector).press('Enter');},
    tab:async()=>page,newTab:async url=>{page=await context.newPage();await page.goto(url);return page;},switchTab:async tab=>{page=tab;},
    screenshot:(file,selector)=>selector?page.locator(selector).screenshot({path:file}):page.screenshot({path:file})
  };
  evidence.browsers.push({...await runFixture(cr,'chromium',`chrome-extension://${extensionId}/src/popup/popup.html`),version:context.browser()?.version()||'persistent Chromium'});
  await liveCheck(cr,'chromium');
  evidence.completed=new Date().toISOString();evidence.success=true;
} catch(error) {
  evidence.success=false;evidence.error=error.stack;process.exitCode=1;console.error(error);
} finally {
  await driver?.quit();await context?.close();server.close();
  await writeFile(path.join(root,'docs','BROWSER-RESULTS.json'),JSON.stringify(evidence,null,2)+'\n');
}
