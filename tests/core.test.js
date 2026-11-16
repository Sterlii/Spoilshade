import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/core/defaults.js';
import '../src/core/matcher.js';
import '../src/core/settings.js';

const namespace = () => globalThis.Spoilshade;
const load = (file) => import(`../src/core/${file}.js`);

test('default settings are immutable, enabled and independent of callers', async () => {
  await load('defaults');
  assert.deepEqual(namespace().DEFAULT_SETTINGS, {
    version: 1, enabled: true, presetsEnabled: true, customKeywords: [],
  });
  assert.ok(Object.isFrozen(namespace().DEFAULT_SETTINGS));
  assert.ok(Object.isFrozen(namespace().DEFAULT_SETTINGS.customKeywords));
});

test('default keywords are the six frozen GTA variants', async () => {
  await load('defaults');
  assert.deepEqual(namespace().DEFAULT_KEYWORDS, [
    'GTA 6', 'GTA6', 'GTA VI', 'GTAVI', 'Grand Theft Auto 6', 'Grand Theft Auto VI',
  ]);
  assert.ok(Object.isFrozen(namespace().DEFAULT_KEYWORDS));
});

test('entry normalization trims, NFKC-folds, collapses whitespace and bounds Unicode length', async () => {
  await load('matcher');
  const { normalizeEntry, entryKey } = namespace();
  assert.equal(normalizeEntry(' \t Ｊａｓｏｎ\n  Lucia\u00a0 '), 'Jason Lucia');
  assert.equal(normalizeEntry('Cafe\u0301'), 'Café');
  assert.equal(normalizeEntry('C++ / [a-z].*?'), 'C++ / [a-z].*?');
  assert.equal(normalizeEntry('🦄'.repeat(120)), '🦄'.repeat(120));
  for (const invalid of ['', ' \n ', null, undefined, 9, {}, [], 'a'.repeat(121), '🦄'.repeat(121)]) {
    assert.equal(normalizeEntry(invalid), '');
  }
  assert.equal(entryKey('  ＪＡＳＯＮ\n Lucia '), entryKey('jason lucia'));
});

test('Greek final-sigma duplicate keys agree with Unicode case-insensitive matching', () => {
  const { entryKey, sanitizeSettings, createMatcher } = namespace();
  assert.equal(createMatcher({ presetsEnabled: false, customKeywords: ['ΟΣ'] })('οσ'), true);
  assert.equal(entryKey('ΟΣ'), entryKey('οσ'));
  assert.deepEqual(sanitizeSettings({ customKeywords: ['ΟΣ', 'οσ', 'ος'] }).customKeywords, ['ΟΣ']);
});

test('sanitization rejects corrupted fields and returns independent safe settings', async () => {
  await load('settings');
  const { sanitizeSettings, DEFAULT_SETTINGS } = namespace();
  for (const corrupt of [undefined, null, false, 42, 'broken json', [], { enabled: 'false', presetsEnabled: 0, customKeywords: {} }]) {
    assert.deepEqual(sanitizeSettings(corrupt), DEFAULT_SETTINGS);
  }
  const input = { version: 999, enabled: false, presetsEnabled: true, customKeywords: ['  Jason ', 'Lucia'], extra: 'discard' };
  const clean = sanitizeSettings(input);
  assert.deepEqual(clean, { version: 1, enabled: false, presetsEnabled: true, customKeywords: ['Jason', 'Lucia'] });
  clean.customKeywords.push('changed');
  assert.deepEqual(input.customKeywords, ['  Jason ', 'Lucia']);
  const first = sanitizeSettings(null);
  first.customKeywords.push('one');
  assert.deepEqual(sanitizeSettings(null), DEFAULT_SETTINGS);
});

test('sanitization deduplicates normalized case-insensitive entries and caps accepted entries at 200', () => {
  const customKeywords = ['', null, {}, 'a'.repeat(121), 'Jason', ' ＪＡＳＯＮ ', 'Jason\n ', 'Lucia'];
  customKeywords.push(...Array.from({ length: 210 }, (_, index) => `Term ${index}`));
  const result = namespace().sanitizeSettings({ customKeywords });
  assert.equal(result.customKeywords.length, 200);
  assert.deepEqual(result.customKeywords.slice(0, 4), ['Jason', 'Lucia', 'Term 0', 'Term 1']);
  assert.equal(result.customKeywords.at(-1), 'Term 197');
});

test('custom matching is case-insensitive with Unicode word boundaries and possessives', () => {
  const matches = namespace().createMatcher({ presetsEnabled: false, customKeywords: ['Jason', 'Lucia', 'Café', '英雄'] });
  for (const title of ['JASON revealed', "Jason's story", 'Jason’s fate', '(lucia)', 'The Café ending', '英雄!']) {
    assert.equal(matches(title), true, title);
  }
  for (const title of ['Jasonville', 'NotJason', 'éJason', 'Jasoné', 'Jason2', '2Jason', '英雄伝', 'Luciana', '', null, undefined, 42]) {
    assert.equal(matches(title), false, String(title));
  }
});

test('Unicode combining marks cannot split a word at a keyword boundary', () => {
  const matches = namespace().createMatcher({ presetsEnabled: false, customKeywords: ['Jason'] });
  assert.equal(matches('Jason\u0338ville'), false);
  assert.equal(matches('\u0338Jason'), false);
  assert.equal(matches('Jason!'), true);
});

test('custom phrases normalize title whitespace and compatibility characters without regex interpretation', () => {
  const matches = namespace().createMatcher({ presetsEnabled: false, customKeywords: [
    'C++', '[a-z].*?', 'a/b\\c', 'Jason\n  Lucia', 'Café',
  ] });
  for (const title of ['Learn C++ today', 'The [a-z].*? reveal', 'a/b\\c!', 'Ｊａｓｏｎ\n\tＬｕｃｉａ', 'Jason\u00a0Lucia', 'Cafe\u0301 ending']) {
    assert.equal(matches(title), true, title);
  }
  for (const title of ['C+ guide', 'xyz', 'a/bc', 'Jason and Lucia', 'Jason-Lucia']) {
    assert.equal(matches(title), false, title);
  }
});

test('built-in presets cover GTA spelling and punctuation variants without other numbered games', () => {
  const matches = namespace().createMatcher();
  for (const title of [...namespace().DEFAULT_KEYWORDS,
    'gta-6 reveal', 'GTA:VI trailer', 'GTA.VI!', 'gTa / 6', 'GTA—6', 'GTA_6', 'GTA+VI',
    'Grand-Theft-Auto:6', 'grand.theft.auto.vi', 'Grand / Theft / Auto — VI', 'ＧＴＡ６',
  ]) assert.equal(matches(title), true, title);
  for (const title of ['GTA V', 'GTAV', 'GTA VII', 'GTAVII', 'GTA60', 'GTA 60', 'GTA 6th',
    'GTA VIII', 'GTA IV', 'Grand Theft Auto V', 'Grand Theft Auto VII', 'Grand Theft Auto 60',
    'NotGTA6', 'GTA6é', 'gta vice', 'GTA 16', 'GTA 6A', 'Grand theft automotive 6',
  ]) assert.equal(matches(title), false, title);
});

test('master and preset toggles are independent and custom keywords remain usable with presets off', () => {
  for (const enabled of [false, true]) {
    for (const presetsEnabled of [false, true]) {
      const settings = { enabled, presetsEnabled, customKeywords: ['Jason'] };
      const matches = namespace().createMatcher(settings);
      assert.equal(matches('Jason trailer'), enabled, JSON.stringify(settings));
      assert.equal(matches('GTA 6 trailer'), enabled && presetsEnabled, JSON.stringify(settings));
      assert.deepEqual(settings.customKeywords, ['Jason']);
    }
  }
  assert.equal(namespace().createMatcher({ presetsEnabled: false })('GTA 6'), false);
});

// Only the WebExtension storage boundary is faked; core logic always runs unchanged.
function fakeBrowser(initial = {}) {
  const data = structuredClone(initial);
  const listeners = new Set();
  const calls = [];
  const emit = (changes, area = 'local') => {
    for (const listener of [...listeners]) listener(structuredClone(changes), area);
  };
  const api = {
    storage: {
      local: {
        async get(key) {
          calls.push(['get', key]);
          return Object.hasOwn(data, key) ? { [key]: structuredClone(data[key]) } : {};
        },
        async set(values) {
          calls.push(['set', structuredClone(values)]);
          const changes = {};
          for (const [key, value] of Object.entries(values)) {
            changes[key] = { oldValue: structuredClone(data[key]), newValue: structuredClone(value) };
            data[key] = structuredClone(value);
          }
          emit(changes);
        },
      },
      onChanged: {
        addListener(listener) { listeners.add(listener); },
        removeListener(listener) { listeners.delete(listener); },
      },
    },
  };
  return { api, emit, calls, listeners };
}

test('settings store loads safe defaults from local storage without writing on read', async () => {
  const fake = fakeBrowser();
  const store = namespace().createSettingsStore(fake.api);
  assert.deepEqual(await store.load(), namespace().DEFAULT_SETTINGS);
  assert.deepEqual(fake.calls, [['get', 'settings']]);
  const corrupt = namespace().createSettingsStore(fakeBrowser({ settings: 'corrupt data' }).api);
  assert.deepEqual(await corrupt.load(), namespace().DEFAULT_SETTINGS);
});

test('saving sanitizes settings and persists custom additions and removals across store instances', async () => {
  const fake = fakeBrowser();
  const store = namespace().createSettingsStore(fake.api);
  const input = { enabled: false, presetsEnabled: false, customKeywords: [' Jason ', 'JASON', 'Lucia'] };
  const expected = { version: 1, enabled: false, presetsEnabled: false, customKeywords: ['Jason', 'Lucia'] };
  const saved = await store.save(input);
  assert.deepEqual(saved, expected);
  assert.deepEqual(await namespace().createSettingsStore(fake.api).load(), expected);
  saved.customKeywords.push('mutated result');
  input.customKeywords.push('mutated input');
  assert.deepEqual(await store.load(), expected);
  const removed = await store.save({ ...expected, customKeywords: ['Lucia'] });
  assert.deepEqual(removed.customKeywords, ['Lucia']);
  const reloaded = await namespace().createSettingsStore(fake.api).load();
  assert.deepEqual(reloaded, { ...expected, customKeywords: ['Lucia'] });
  assert.equal(namespace().createMatcher({ ...reloaded, enabled: true })('Jason'), false);
  assert.equal(namespace().createMatcher({ ...reloaded, enabled: true })('Lucia'), true);
  assert.ok(fake.calls.every(([method, value]) => method === 'get' ? value === 'settings' : Object.keys(value).join() === 'settings'));
});

test('local storage events notify all pages with isolated sanitized snapshots and unsubscribe stops delivery', async () => {
  const fake = fakeBrowser();
  const popup = namespace().createSettingsStore(fake.api);
  const page = namespace().createSettingsStore(fake.api);
  const popupValues = [];
  const pageValues = [];
  const offPopup = popup.subscribe((settings) => {
    popupValues.push(settings);
    settings.customKeywords.push('subscriber mutation');
  });
  const offPage = page.subscribe((settings) => pageValues.push(settings));
  assert.equal(fake.listeners.size, 2);
  const saved = await popup.save({ presetsEnabled: false, customKeywords: ['Jason'] });
  assert.deepEqual(pageValues, [saved]);
  assert.deepEqual(await page.load(), saved);
  fake.emit({ settings: { newValue: { enabled: false } } }, 'sync');
  fake.emit({ unrelated: { newValue: true } });
  assert.equal(pageValues.length, 1);
  offPopup();
  offPopup();
  await page.save({ customKeywords: ['Lucia'] });
  assert.equal(popupValues.length, 1);
  assert.equal(pageValues.length, 2);
  offPage();
  assert.equal(fake.listeners.size, 0);
});

// Acceptance audits for branches implemented in the preceding RED/GREEN slices.
test('storage deletion and corrupted change values notify subscribers with safe defaults', () => {
  const fake = fakeBrowser();
  const values = [];
  const stop = namespace().createSettingsStore(fake.api).subscribe((settings) => values.push(settings));
  for (const change of [{ oldValue: { enabled: false } }, { newValue: null }, { newValue: 'broken' },
    { newValue: { enabled: 'no', presetsEnabled: 7, customKeywords: [null, ' ', 'a'.repeat(121)] } },
  ]) fake.emit({ settings: change });
  assert.equal(values.length, 4);
  for (const value of values) assert.deepEqual(value, namespace().DEFAULT_SETTINGS);
  values[0].customKeywords.push('caller mutation');
  assert.deepEqual(values[1], namespace().DEFAULT_SETTINGS);
  stop();
});

test('independent toggles round-trip without rewriting the other toggle or custom list', async () => {
  const fake = fakeBrowser();
  const store = namespace().createSettingsStore(fake.api);
  for (const enabled of [false, true]) {
    for (const presetsEnabled of [false, true]) {
      const expected = { version: 1, enabled, presetsEnabled, customKeywords: ['Jason'] };
      await store.save(expected);
      assert.deepEqual(await namespace().createSettingsStore(fake.api).load(), expected);
    }
  }
});

test('settings store defaults to Promise browser API, then modern Promise chrome API', async (t) => {
  const originals = ['browser', 'chrome'].map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]);
  t.after(() => {
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  const firefox = fakeBrowser({ settings: { customKeywords: ['Firefox'] } });
  const chromium = fakeBrowser({ settings: { customKeywords: ['Chromium'] } });
  Object.defineProperty(globalThis, 'browser', { configurable: true, value: firefox.api });
  Object.defineProperty(globalThis, 'chrome', { configurable: true, value: chromium.api });
  assert.deepEqual((await namespace().createSettingsStore().load()).customKeywords, ['Firefox']);
  delete globalThis.browser;
  const chromeStore = namespace().createSettingsStore();
  assert.deepEqual((await chromeStore.load()).customKeywords, ['Chromium']);
  await chromeStore.save({ customKeywords: ['Updated'] });
  assert.deepEqual((await chromeStore.load()).customKeywords, ['Updated']);
});

test('storage failures reject instead of reporting an unpersisted success', async () => {
  const fake = fakeBrowser({ settings: { customKeywords: ['Original'] } });
  const store = namespace().createSettingsStore(fake.api);
  const readError = new Error('Storage read denied');
  const writeError = new Error('Quota exceeded');
  fake.api.storage.local.get = async () => { throw readError; };
  await assert.rejects(store.load(), (error) => error === readError);
  fake.api.storage.local.set = async () => { throw writeError; };
  await assert.rejects(store.save({ customKeywords: ['Unsaved'] }), (error) => error === writeError);
  await assert.rejects(namespace().createSettingsStore({}).load(), TypeError);
});

test('matcher snapshots settings and produces stable repeated results', () => {
  const settings = { customKeywords: ['Jason'] };
  const matches = namespace().createMatcher(settings);
  settings.enabled = false;
  settings.customKeywords[0] = 'Lucia';
  for (let index = 0; index < 20; index++) {
    assert.equal(matches('Jason'), true);
    assert.equal(matches('Lucia'), false);
    assert.equal(matches('GTA6'), true);
  }
});

test('maximum keyword workload and adversarial literal input stay within a generous performance budget', (t) => {
  const customKeywords = Array.from({ length: 199 }, (_, index) => `Lore term ${index}`);
  customKeywords.push('(a+)+$');
  const start = performance.now();
  const matches = namespace().createMatcher({ customKeywords });
  let positives = 0;
  const iterations = 20000;
  for (let index = 0; index < iterations; index++) {
    const title = index % 2 === 0 ? 'Lore term 198 reveal' : 'A harmless video about cooking';
    positives += Number(matches(title));
  }
  assert.equal(positives, iterations / 2);
  assert.equal(matches('GTA' + '-'.repeat(100000) + 'VII'), false);
  assert.equal(matches('a'.repeat(100000) + '!'), false);
  assert.equal(matches(' '.repeat(200) + 'GTA 6'), true, 'title text must not use the keyword length limit');
  const elapsed = performance.now() - start;
  t.diagnostic(`${iterations} title matches, 200 keywords, and long adversarial titles: ${elapsed.toFixed(2)} ms`);
  assert.ok(elapsed < 2000, `matcher took ${elapsed.toFixed(2)} ms; budget is 2000 ms`);
});
