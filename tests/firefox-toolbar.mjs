import assert from 'node:assert/strict';
import {Builder,By} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {runtimeFingerprint,verifyBuild} from './helpers/fingerprint.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.env.SE_CACHE_PATH=path.join(root,'.test-cache','selenium');
const options=new firefox.Options().setBinary(process.env.FIREFOX_BINARY||'/usr/bin/firefox').addArguments('-headless');
const service=new firefox.ServiceBuilder().addArguments('--allow-system-access','--profile-root',path.join(root,'.test-cache'));
let driver;
const evidence={time:new Date().toISOString(),scope:'Actual Firefox toolbar action in a new isolated headless profile; interactions inside popup separately tested as extension-owned page.',verified:false};
try {
  evidence.runtime=await runtimeFingerprint(root);
  evidence.build=await verifyBuild(root,'firefox',evidence.runtime);
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(service).build();
  evidence.version=(await driver.getCapabilities()).get('browserVersion');
  const addonId=await driver.installAddon(path.join(root,'dist','firefox'),true);
  const widgetId=addonId.toLowerCase().replace(/[^a-z0-9_-]/g,'_');
  await driver.setContext('chrome');
  await driver.executeScript(`const ui=window.CustomizableUI; ui.addWidgetToArea(arguments[0],ui.AREA_NAVBAR);`,`${widgetId}-browser-action`);
  await driver.findElement(By.id(`${widgetId}-BAP`)).click();
  await driver.wait(async()=>driver.executeScript(`const b=document.querySelector('browser.webextension-popup-browser');return b?.closest('panel')?.state==='open'&&b.getBoundingClientRect().height>0;`),5000);
  evidence.popup=await driver.executeScript(`const b=document.querySelector('browser.webextension-popup-browser'),r=b.getBoundingClientRect(); return {width:r.width,height:r.height,panelState:b.closest('panel').state,viewType:b.getAttribute('webextension-view-type')};`);
  assert.equal(evidence.popup.width,380);assert.ok(evidence.popup.height>0&&evidence.popup.height<=600);assert.equal(evidence.popup.viewType,'popup');
  evidence.verified=true;
  // Popup geometry precedes asynchronous storage/render completion. Allow its first content frame to settle before capture.
  await driver.sleep(300);
  try {
    const dataURL=await driver.executeAsyncScript(`
      const done=arguments[arguments.length-1], b=document.querySelector('browser.webextension-popup-browser');
      b.browsingContext.currentWindowGlobal.drawSnapshot(new DOMRect(0,0,b.clientWidth,b.clientHeight),1,'#ffffff').then(bitmap=>{
        const canvas=document.createElementNS('http://www.w3.org/1999/xhtml','canvas');
        canvas.width=bitmap.width;canvas.height=bitmap.height;canvas.getContext('2d').drawImage(bitmap,0,0);bitmap.close();done(canvas.toDataURL('image/png'));
      }).catch(error=>done({error:String(error)}));
    `);
    assert.equal(typeof dataURL,'string',JSON.stringify(dataURL));
    await writeFile(path.join(root,'docs','screenshots','firefox-native-popup.png'),Buffer.from(dataURL.split(',')[1],'base64'));
    evidence.screenshotMethod='Firefox remote browsing-context snapshot; XUL element screenshot returned a blank embedding surface.';
    evidence.screenshot='screenshots/firefox-native-popup.png';
  } catch(error) {evidence.screenshotUnavailable=error.message;}
  console.log(JSON.stringify(evidence,null,2));
} catch(error) {evidence.error=error.message;process.exitCode=1;console.error(error);}
finally {
  await driver?.quit();
  await writeFile(path.join(root,'docs','FIREFOX-TOOLBAR-RESULT.json'),JSON.stringify(evidence,null,2)+'\n');
}
