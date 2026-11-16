import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import fs from 'node:fs';

function fixture() {
  const dom = new JSDOM('<ytd-video-renderer><a id="thumbnail" href="/watch?v=abc"><img alt="GTA 6 ending"></a><h3><a id="video-title" title="GTA 6 ending" aria-label="GTA 6 ending" href="/watch?v=abc">GTA 6 ending</a></h3></ytd-video-renderer>', {runScripts:'outside-only'});
  dom.window.eval(fs.readFileSync(new URL('../src/youtube/redaction.js', import.meta.url),'utf8'));
  return {dom, document:dom.window.document, api:dom.window.Spoilshade};
}

test('title end-slot attributes are present in both reveal states and removed on destroy',()=>{
  const {document,api}=fixture();
  const card=document.querySelector('ytd-video-renderer'),title=card.querySelector('#video-title');
  const redaction=api.createRedaction(card,title,card.querySelector('#thumbnail'),{title:false,thumbnail:false},()=>{});
  assert.equal(title.hasAttribute('data-ss-title-reserved'),true);
  card.querySelector('[data-ss-control="title"]').click();
  assert.equal(title.hasAttribute('data-ss-title-reserved'),true);
  assert.equal(card.querySelector('#thumbnail').getAttribute('aria-hidden'),'true');
  redaction.destroy();
  assert.equal(title.hasAttribute('data-ss-title-reserved'),false);
  assert.equal(title.hasAttribute('data-ss-title-inline'),false);
});

test('page-owned tooltip updates are preserved when protection is destroyed',()=>{
  const {document,api}=fixture();
  const card=document.querySelector('ytd-video-renderer'), title=card.querySelector('#video-title');
  const redaction=api.createRedaction(card,title,card.querySelector('#thumbnail'),{title:false,thumbnail:false},()=>{});
  title.setAttribute('title','GTA 6 ending — new page label');
  redaction.refresh();
  assert.equal(title.hasAttribute('title'),false);
  redaction.destroy();
  assert.equal(title.getAttribute('title'),'GTA 6 ending — new page label');
});

test('thumbnail concealment suppresses hover-preview state independently of title reveal',()=>{
  const {document,api}=fixture();
  const card=document.querySelector('ytd-video-renderer');
  const redaction=api.createRedaction(card,card.querySelector('#video-title'),card.querySelector('#thumbnail'),{title:false,thumbnail:false},()=>{});
  assert.equal(card.hasAttribute('data-ss-thumbnail-hidden'),true);
  card.querySelector('[data-ss-control="title"]').click();
  assert.equal(card.hasAttribute('data-ss-thumbnail-hidden'),true);
  card.querySelector('[data-ss-control="thumbnail"]').click();
  assert.equal(card.hasAttribute('data-ss-thumbnail-hidden'),false);
  redaction.destroy();
  assert.equal(card.hasAttribute('data-ss-thumbnail-hidden'),false);
});

test('redaction independently reveals title and thumbnail, re-hides and restores attributes', () => {
  const {document, api} = fixture();
  const card = document.querySelector('ytd-video-renderer');
  const title = card.querySelector('#video-title'), thumbnail = card.querySelector('#thumbnail');
  let titleState=false, thumbnailState=false;
  const redaction=api.createRedaction(card, title, thumbnail, {title:false,thumbnail:false}, (kind,value)=>{
    if(kind==='title') titleState=value; else thumbnailState=value;
  });
  assert.equal(title.getAttribute('aria-hidden'),'true');
  assert.equal(title.hasAttribute('title'),false);
  assert.equal(title.hasAttribute('aria-label'),false);
  card.querySelector('[data-ss-control="title"]').click();
  assert.equal(titleState,true); assert.equal(thumbnailState,false);
  assert.equal(title.hasAttribute('aria-hidden'),false);
  assert.equal(thumbnail.getAttribute('aria-hidden'),'true');
  card.querySelector('[data-ss-control="thumbnail"]').click();
  assert.equal(thumbnailState,true);
  card.querySelector('[data-ss-control="title"]').click();
  assert.equal(title.getAttribute('aria-hidden'),'true');
  redaction.destroy();
  assert.equal(card.querySelector('[data-ss-ui]'),null);
  assert.equal(title.getAttribute('title'),'GTA 6 ending');
  assert.equal(title.getAttribute('aria-label'),'GTA 6 ending');
  assert.equal(thumbnail.hasAttribute('aria-hidden'),false);
});
