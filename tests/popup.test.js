import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const root = new URL('../', import.meta.url);
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
async function setup(initial = {}, { failLoad = false, failSave = false } = {}) {
  const html = await readFile(new URL('src/popup/popup.html', root), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://extension.invalid/popup.html' });
  const { window } = dom;
  for (const name of ['defaults', 'matcher', 'settings']) {
    window.eval(await readFile(new URL(`src/core/${name}.js`, root), 'utf8'));
  }
  let current = { version: 1, enabled: true, presetsEnabled: true, customKeywords: [], ...initial };
  const listeners = new Set();
  const saves = [];
  const emit = () => {
    for (const listener of listeners) listener({ settings: { newValue: structuredClone(current) } }, 'local');
  };
  window.chrome = { storage: {
    local: {
      async get() { if (failLoad) throw Error('Unavailable'); return { settings: structuredClone(current) }; },
      async set({ settings }) {
        if (failSave) throw Error('Quota');
        current = structuredClone(settings);
        saves.push(current);
        emit();
      }
    },
    onChanged: {
      addListener(listener) { listeners.add(listener); },
      removeListener(listener) { listeners.delete(listener); }
    }
  } };
  window.eval(await readFile(new URL('src/popup/popup.js', root), 'utf8'));
  await tick();
  return {
    window, document: window.document, saves,
    external(value) { current = { ...current, ...value }; emit(); },
    close() { window.close(); }
  };
}

test('a preset spelling can be used as an independent custom entry when presets are disabled',async t=>{
  const ui=await setup({presetsEnabled:false});t.after(()=>ui.close());
  ui.document.querySelector('#keyword-input').value='GTA6';
  ui.document.querySelector('#keyword-form').requestSubmit();await tick();
  assert.deepEqual(ui.saves.at(-1)?.customKeywords,['GTA6']);
  assert.equal(ui.saves.at(-1)?.presetsEnabled,false);
});

test('popup prominently explains local title processing and no transmission',async t=>{
  const ui=await setup();t.after(()=>ui.close());
  const help=ui.document.querySelector('#keyword-help').textContent;
  assert.match(help,/titles.*on-device/i);assert.match(help,/no data sent/i);
});

test('master, preset and restore controls persist without changing custom keywords', async t => {
  const ui = await setup({ customKeywords: ['Lucia'] });
  t.after(() => ui.close());
  ui.document.querySelector('#enabled').click();
  await tick();
  assert.equal(ui.saves.at(-1)?.enabled, false);
  assert.equal(ui.saves.at(-1)?.presetsEnabled, true);
  ui.document.querySelector('#presets-enabled').click();
  await tick();
  assert.equal(ui.saves.at(-1)?.presetsEnabled, false);
  assert.equal(ui.document.querySelector('#preset-state').textContent, 'Starter pack paused');
  ui.document.querySelector('#restore-defaults').click();
  await tick();
  assert.equal(ui.saves.at(-1)?.presetsEnabled, true);
  assert.equal(ui.saves.at(-1)?.enabled, false, 'Restoring starter pack must not toggle master protection');
  assert.deepEqual(ui.saves.at(-1)?.customKeywords, ['Lucia']);
  assert.match(ui.document.querySelector('#status').textContent, /restored/i);
});

test('custom phrases are normalized, safely rendered, immediately saved and removable', async t => {
  const ui = await setup();
  t.after(() => ui.close());
  const input = ui.document.querySelector('#keyword-input');
  input.value = '  <img src=x onerror=alert(1)>   Jason  ';
  ui.document.querySelector('#keyword-form').requestSubmit();
  await tick();
  const keyword = '<img src=x onerror=alert(1)> Jason';
  assert.deepEqual(ui.saves.at(-1)?.customKeywords, [keyword]);
  assert.equal(ui.document.querySelector('#custom-keywords img'), null);
  assert.equal(ui.document.querySelector('.keyword-text').textContent, keyword);
  assert.equal(input.value, '');
  assert.equal(ui.document.querySelector('#custom-count').textContent, '1');
  assert.equal(ui.document.querySelector('#empty-keywords').hidden, true);
  ui.document.querySelector('.remove-button').click();
  await tick();
  assert.deepEqual(ui.saves.at(-1)?.customKeywords, []);
  assert.equal(ui.document.querySelector('#custom-keywords').children.length, 0);
  assert.equal(ui.document.querySelector('#empty-keywords').hidden, false);
});

test('empty, duplicate, overlong and excess custom entries receive feedback without a write', async t => {
  const ui = await setup({ customKeywords: ['Lucia'] });
  t.after(() => ui.close());
  const input = ui.document.querySelector('#keyword-input');
  for (const [value, feedback] of [
    ['   ', /enter a keyword/i], ['  LUCIA ', /already/i], ['GTA 6', /starter pack/i],
    ['x'.repeat(121), /120/]
  ]) {
    input.value = value;
    ui.document.querySelector('#keyword-form').requestSubmit();
    await tick();
    assert.equal(ui.saves.length, 0);
    assert.match(ui.document.querySelector('#status').textContent, feedback);
    assert.equal(input.getAttribute('aria-invalid'), 'true');
  }
  const full = await setup({ customKeywords: Array.from({ length: 200 }, (_, i) => `Character ${i}`) });
  t.after(() => full.close());
  full.document.querySelector('#keyword-input').value = 'Another';
  full.document.querySelector('#keyword-form').requestSubmit();
  await tick();
  assert.equal(full.saves.length, 0);
  assert.match(full.document.querySelector('#status').textContent, /200/);
});

test('external storage changes update both switches and the keyword list accessibly', async t => {
  const ui = await setup();
  t.after(() => ui.close());
  ui.external({ enabled: false, presetsEnabled: false, customKeywords: ['Jason'] });
  assert.equal(ui.document.querySelector('#enabled').checked, false);
  assert.equal(ui.document.querySelector('#presets-enabled').checked, false);
  assert.equal(ui.document.querySelector('.keyword-text').textContent, 'Jason');
  assert.match(ui.document.querySelector('#status').textContent, /updated/i);
  assert.equal(ui.document.querySelector('#status').getAttribute('aria-live'), 'polite');
  assert.equal(ui.saves.length, 0);
});

test('failed storage loads keep controls locked and show accessible recovery feedback', async t => {
  const ui = await setup({}, { failLoad: true });
  t.after(() => ui.close());
  assert.equal(ui.document.querySelector('#settings-controls').disabled, true);
  assert.match(ui.document.querySelector('#status').textContent, /could not load/i);
  assert.equal(ui.document.querySelector('#status').dataset.error, 'true');
});

test('failed saves roll back UI state and retain an unsaved custom entry for retry', async t => {
  const ui = await setup({}, { failSave: true });
  t.after(() => ui.close());
  ui.document.querySelector('#enabled').click();
  await tick();
  assert.equal(ui.document.querySelector('#enabled').checked, true);
  assert.equal(ui.document.querySelector('#settings-controls').disabled, false);
  assert.match(ui.document.querySelector('#status').textContent, /could not save/i);
  ui.document.querySelector('#keyword-input').value = 'Lucia';
  ui.document.querySelector('#keyword-form').requestSubmit();
  await tick();
  assert.equal(ui.document.querySelector('#keyword-input').value, 'Lucia');
  assert.equal(ui.document.querySelector('#custom-count').textContent, '0');
  assert.equal(ui.saves.length, 0);
});

test('popup displays the six shared presets and the saved master state', async t => {
  const ui = await setup({ enabled: false });
  t.after(() => ui.close());
  assert.equal(ui.document.querySelector('#enabled').checked, false);
  assert.equal(ui.document.querySelector('#protection-state').textContent, 'Protection paused');
  assert.deepEqual([...ui.document.querySelectorAll('#preset-keywords li')].map(n => n.textContent),
    ['GTA 6', 'GTA6', 'GTA VI', 'GTAVI', 'Grand Theft Auto 6', 'Grand Theft Auto VI']);
  assert.equal(ui.document.querySelector('#settings-controls').disabled, false);
});
