import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import fs from 'node:fs';

const card=(title,id)=>`<ytd-video-renderer><a id="thumbnail" href="/watch?v=${id}"><img alt="${title}"></a><h3><a id="video-title" title="${title}" href="/watch?v=${id}">${title}</a></h3></ytd-video-renderer>`;
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
async function setup(html) {
  const dom=new JSDOM(html,{url:'https://www.youtube.com/',runScripts:'outside-only'});
  let listener;
  const settings={enabled:true,presetsEnabled:true,customKeywords:[]};
  dom.window.Spoilshade={createMatcher:s=>text=>(s.presetsEnabled&&/\bGTA\s*6\b/i.test(text))||s.customKeywords.some(word=>new RegExp(`\\b${word}\\b`,'i').test(text))};
  for(const file of ['redaction','integration']) dom.window.eval(fs.readFileSync(new URL(`../src/youtube/${file}.js`,import.meta.url),'utf8'));
  const controller=dom.window.Spoilshade.createYouTubeIntegration({document:dom.window.document,store:{load:async()=>settings,subscribe:fn=>{listener=fn;return()=>{listener=null;};}}});
  await controller.start(); await tick();
  return {dom,doc:dom.window.document,controller,update:async patch=>{listener({...settings,...patch});await tick();}};
}

test('page reconciliation restores removed or misparented controls without losing independent reveals',async()=>{
  const {doc,controller,dom}=await setup(card('GTA 6 ending','retained'));
  const title=doc.querySelector('#video-title');
  doc.querySelector('[data-ss-control="thumbnail"]').click();
  title.parentElement.replaceChildren(title);
  await tick();
  assert.equal(doc.querySelectorAll('[data-ss-ui="title"]').length,1);
  assert.equal(doc.querySelectorAll('[data-ss-ui="thumbnail"]').length,1);
  assert.equal(title.getAttribute('aria-hidden'),'true');
  assert.equal(doc.querySelector('#thumbnail').hasAttribute('aria-hidden'),false);
  const control=doc.querySelector('[data-ss-ui="title"]');
  doc.body.append(control);await tick();
  assert.equal(control.parentElement,title.parentElement);
  for(let i=0;i<20;i++)controller.rescan();await tick();
  assert.equal(doc.querySelectorAll('[data-ss-ui="title"]').length,1);
  assert.equal(controller.stats().processed,1);
  doc.querySelector('[data-ss-control="title"]').click();
  assert.equal(title.hasAttribute('aria-hidden'),false);
  assert.equal(doc.querySelector('#thumbnail').hasAttribute('aria-hidden'),false);
  controller.stop();dom.window.close();
});

test('a previously redacted wrapper becoming nested retires its record and fully restores on disable',async()=>{
  const {doc,controller,update,dom}=await setup(card('GTA 6 wrapper','outer'));
  const outer=doc.querySelector('ytd-video-renderer');
  const inner=doc.createElement('yt-lockup-view-model');
  inner.innerHTML='<a id="thumbnail" href="/watch?v=inner"><img></a><h3><a id="video-title" href="/watch?v=inner">GTA 6 nested</a></h3>';
  outer.append(inner);await tick();
  assert.equal(doc.querySelectorAll('[data-ss-ui]').length,2);
  assert.equal(controller.stats().tracked,1);
  await update({enabled:false});
  assert.equal(doc.querySelectorAll('[data-ss-ui],[inert],[data-ss-concealed]').length,0);
  controller.stop();dom.window.close();
});

test('changed title on the same video revokes both reveal permissions',async()=>{
  const {doc,controller,dom}=await setup(card('GTA 6 old title','same'));
  doc.querySelector('[data-ss-control="title"]').click();
  doc.querySelector('[data-ss-control="thumbnail"]').click();
  doc.querySelector('#video-title').textContent='GTA 6 newly changed spoiler title';
  await tick();
  assert.equal(doc.querySelector('#video-title').getAttribute('aria-hidden'),'true');
  assert.equal(doc.querySelector('#thumbnail').getAttribute('aria-hidden'),'true');
  controller.stop();dom.window.close();
});

test('all supported discovery adapters and late-arriving metadata are evaluated',async()=>{
  const tags=['ytd-rich-grid-media','ytd-compact-video-renderer','ytd-grid-video-renderer','ytd-reel-item-renderer','ytd-playlist-video-renderer'];
  const html=tags.map((tag,i)=>card('GTA 6 story',`surface-${i}`).replaceAll('ytd-video-renderer',tag)).join('')+
    '<ytm-shorts-lockup-view-model><a class="shortsLockupViewModelHostThumbnailContainer" href="/shorts/short-a"><img></a><h3 class="shortsLockupViewModelHostMetadataTitle"><a href="/shorts/short-a">GTA 6 reveal</a></h3></ytm-shorts-lockup-view-model>';
  const {doc,controller,dom}=await setup(html);
  assert.equal(doc.querySelectorAll('[data-ss-ui="title"]').length,6);
  const late=doc.createElement('ytd-video-renderer');doc.body.append(late);await tick();
  assert.equal(late.hasAttribute('data-ss-ready'),false);
  late.innerHTML='<a id="thumbnail" href="/watch?v=late"><img></a><h3><a id="video-title" href="/watch?v=late">GTA 6 late title</a></h3>';
  await tick();assert.equal(late.querySelectorAll('[data-ss-ui="title"]').length,1);
  controller.stop();dom.window.close();
});

test('nested legacy wrappers and modern lockups never duplicate redaction controls',async()=>{
  const nested='<ytd-rich-grid-media>'+card('GTA 6 story','nested')+'</ytd-rich-grid-media>';
  const {doc,controller,dom}=await setup(nested);
  assert.equal(doc.querySelectorAll('[data-ss-ui="title"]').length,1);
  assert.equal(doc.querySelectorAll('[data-ss-ui="thumbnail"]').length,1);
  controller.stop();dom.window.close();
});

test('dynamic cards, repeated processing, identity recycling, and detached-card cleanup',async()=>{
  const {doc,controller,dom}=await setup(card('GTA 6 ending','a'));
  const first=doc.querySelector('ytd-video-renderer');
  first.querySelector('[data-ss-control="title"]').click();
  for(let i=0;i<20;i++) controller.rescan();
  await tick();
  assert.equal(first.querySelectorAll('[data-ss-ui="title"]').length,1);
  assert.equal(first.querySelector('#video-title').hasAttribute('aria-hidden'),false);
  assert.equal(first.querySelector('#thumbnail').hasAttribute('aria-hidden'),true);
  assert.equal(controller.stats().processed,1);
  doc.body.insertAdjacentHTML('beforeend',card('GTA 6 new video','b'));
  await tick();
  assert.equal(doc.querySelectorAll('[data-ss-ui="title"]').length,2);
  first.querySelector('#video-title').textContent='GTA 6 different video';
  first.querySelector('#video-title').setAttribute('href','/watch?v=c');
  await tick();
  assert.equal(first.querySelector('#video-title').getAttribute('aria-hidden'),'true');
  first.remove();await tick();
  assert.equal(controller.stats().tracked,1);
  assert.equal(controller.stats().queued,0);
  controller.stop();dom.window.close();
});

test('reveal memory survives removal and reinsertion of the same video in this document',async()=>{
  const {doc,controller,dom}=await setup(card('GTA 6 ending','a'));
  doc.querySelector('[data-ss-control="thumbnail"]').click();
  doc.body.replaceChildren();await tick();
  doc.body.insertAdjacentHTML('beforeend',card('GTA 6 ending','a'));
  await tick();
  assert.equal(doc.querySelector('#thumbnail').hasAttribute('aria-hidden'),false);
  assert.equal(doc.querySelector('#video-title').getAttribute('aria-hidden'),'true');
  controller.stop();dom.window.close();
});

test('live custom additions/removal and disabled protection restore already-loaded cards',async()=>{
  const {doc,controller,update,dom}=await setup(card('Jason gameplay','a')+card('GTA 6 ending','b'));
  assert.equal(doc.querySelectorAll('[data-ss-ui="title"]').length,1);
  await update({customKeywords:['Jason']});
  assert.equal(doc.querySelectorAll('[data-ss-ui="title"]').length,2);
  await update({customKeywords:[]});
  assert.equal(doc.querySelectorAll('[data-ss-ui="title"]').length,1);
  await update({enabled:false});
  assert.equal(doc.querySelector('[data-ss-ui]'),null);
  assert.equal(doc.querySelectorAll('[inert]').length,0);
  assert.equal(doc.documentElement.hasAttribute('data-ss-disabled'),true);
  controller.stop();dom.window.close();
});
