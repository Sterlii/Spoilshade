(() => {
  'use strict';
  const { DEFAULT_KEYWORDS, createSettingsStore, normalizeEntry, entryKey } = globalThis.Spoilshade;
  const store = createSettingsStore();
  const $ = id => document.getElementById(id);
  const controls = $('settings-controls');
  let settings;
  let busy = false;

  function announce(message, error = false) {
    $('status').textContent = message;
    $('status').dataset.error = String(error);
  }

  for (const keyword of DEFAULT_KEYWORDS) {
    const item = document.createElement('li');
    item.textContent = keyword;
    $('preset-keywords').append(item);
  }

  function render() {
    $('enabled').checked = settings.enabled;
    $('presets-enabled').checked = settings.presetsEnabled;
    document.body.dataset.enabled = String(settings.enabled);
    $('protection-state').textContent = settings.enabled ? 'Protection is on' : 'Protection paused';
    $('protection-description').textContent = settings.enabled
      ? 'Matching titles and thumbnails stay out of sight.'
      : 'Your feed is unfiltered. Your keywords are still saved.';
    document.querySelector('.presets-section').dataset.active = String(settings.presetsEnabled);
    $('preset-state').textContent = settings.presetsEnabled ? '6 built-in keywords' : 'Starter pack paused';
    $('custom-count').textContent = String(settings.customKeywords.length);
    $('empty-keywords').hidden = settings.customKeywords.length > 0;
    $('custom-keywords').replaceChildren();
    for (const keyword of settings.customKeywords) {
      const item = document.createElement('li');
      const label = document.createElement('span');
      label.className = 'keyword-text';
      label.textContent = keyword;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove-button';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Remove ${keyword}`);
      remove.addEventListener('click', async () => {
        await persist({ customKeywords: settings.customKeywords.filter(value => value !== keyword) }, 'Custom keyword removed.');
        $('keyword-input').focus();
      });
      item.append(label, remove);
      $('custom-keywords').append(item);
    }
    controls.disabled = busy;
  }

  async function persist(patch, message) {
    if (busy || !settings) return false;
    const previous = settings;
    settings = { ...settings, ...patch };
    busy = true;
    render();
    try {
      await store.save(settings);
      announce(message);
      return true;
    } catch {
      settings = previous;
      announce('Could not save. Your previous settings are unchanged. Please try again.', true);
      return false;
    } finally {
      busy = false;
      render();
    }
  }

  $('enabled').addEventListener('change', event => {
    const enabled = event.target.checked;
    void persist({ enabled }, enabled ? 'Spoiler protection enabled.' : 'Spoiler protection paused.');
  });
  $('presets-enabled').addEventListener('change', event => {
    const presetsEnabled = event.target.checked;
    void persist({ presetsEnabled }, presetsEnabled ? 'GTA VI starter pack enabled.' : 'GTA VI starter pack paused.');
  });
  $('restore-defaults').addEventListener('click', () => {
    void persist({ presetsEnabled: true }, 'Default starter pack restored. Your custom keywords are unchanged.');
  });

  $('keyword-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !settings) return;
    const input = $('keyword-input');
    const keyword = normalizeEntry(input.value);
    let error = '';
    if (!keyword) error = input.value.trim() ? 'Keep each keyword to 120 characters or fewer.' : 'Enter a keyword or phrase first.';
    else if (settings.presetsEnabled && DEFAULT_KEYWORDS.some(value => entryKey(value) === entryKey(keyword))) error = 'That keyword is already in the starter pack.';
    else if (settings.customKeywords.some(value => entryKey(value) === entryKey(keyword))) error = 'That keyword is already on your list.';
    else if (settings.customKeywords.length >= 200) error = 'Your list has reached 200 keywords. Remove one before adding another.';
    if (error) {
      input.setAttribute('aria-invalid', 'true');
      announce(error, true);
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid');
    const saved = await persist({ customKeywords: [...settings.customKeywords, keyword] }, 'Custom keyword added.');
    if (saved) $('keyword-input').value = '';
    $('keyword-input').focus();
  });
  $('keyword-input').addEventListener('input', () => $('keyword-input').removeAttribute('aria-invalid'));

  const unsubscribe = store.subscribe(value => {
    settings = value;
    render();
    if (!busy) announce('Settings updated from another page.');
  });
  window.addEventListener('pagehide', unsubscribe, { once: true });

  void store.load().then(value => {
    if (!settings) settings = value;
    render();
    announce('Changes save automatically on this device.');
  }).catch(() => {
    announce('Could not load your settings. Close and reopen Spoilshade to try again.', true);
  });
})();
