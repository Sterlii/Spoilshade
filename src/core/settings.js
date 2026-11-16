(() => {
  'use strict';
  const core = globalThis.Spoilshade ||= {};

  function sanitizeSettings(raw) {
    const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const customKeywords = [];
    const seen = new Set();
    if (Array.isArray(source.customKeywords)) {
      for (const value of source.customKeywords) {
        const entry = core.normalizeEntry(value);
        const key = core.entryKey(entry);
        if (!entry || seen.has(key)) continue;
        seen.add(key);
        customKeywords.push(entry);
        if (customKeywords.length === 200) break;
      }
    }
    return {
      version: 1,
      enabled: typeof source.enabled === 'boolean' ? source.enabled : core.DEFAULT_SETTINGS.enabled,
      presetsEnabled: typeof source.presetsEnabled === 'boolean' ? source.presetsEnabled : core.DEFAULT_SETTINGS.presetsEnabled,
      customKeywords,
    };
  }

  function createSettingsStore(api = globalThis.browser || globalThis.chrome) {
    return {
      async load() {
        const result = await api.storage.local.get('settings');
        return sanitizeSettings(result?.settings);
      },
      async save(settings) {
        const clean = sanitizeSettings(settings);
        await api.storage.local.set({ settings: clean });
        return clean;
      },
      subscribe(callback) {
        const listener = (changes, areaName) => {
          if (areaName === 'local' && Object.hasOwn(changes, 'settings')) {
            callback(sanitizeSettings(changes.settings.newValue));
          }
        };
        api.storage.onChanged.addListener(listener);
        return () => api.storage.onChanged.removeListener(listener);
      },
    };
  }

  core.createSettingsStore = createSettingsStore;
  core.sanitizeSettings = sanitizeSettings;
})();
