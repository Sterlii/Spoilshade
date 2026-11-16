(() => {
  'use strict';
  const core = globalThis.Spoilshade ||= {};
  core.DEFAULT_SETTINGS = Object.freeze({
    version: 1,
    enabled: true,
    presetsEnabled: true,
    customKeywords: Object.freeze([]),
  });
  core.DEFAULT_KEYWORDS = Object.freeze([
    'GTA 6', 'GTA6', 'GTA VI', 'GTAVI', 'Grand Theft Auto 6', 'Grand Theft Auto VI',
  ]);
})();
