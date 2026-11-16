import {Builder} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
const options=new firefox.Options().setBinary('/usr/bin/firefox').addArguments('-headless');
const service=new firefox.ServiceBuilder().addArguments('--allow-system-access');
options.setPreference('browser.shell.checkDefaultBrowser',false);
let driver;
try {
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(service).build();
  const caps=await driver.getCapabilities(); console.log(caps.get('browserName'),caps.get('browserVersion'));
  await driver.get('data:text/html,<h1>Spoilshade isolated browser check</h1>');
  console.log(await driver.getTitle());
} finally {await driver?.quit();}
