(() => {
  'use strict';
  const core = globalThis.Spoilshade ||= {};

  function normalizeEntry(value) {
    if (typeof value !== 'string') return '';
    const normalized = value.normalize('NFKC').trim().replace(/\s+/gu, ' ');
    return [...normalized].length <= 120 ? normalized : '';
  }

  function createMatcher(settings) {
    const clean = core.sanitizeSettings(settings);
    if (!clean.enabled) return () => false;
    const alternatives = clean.customKeywords.map((entry) => entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (clean.presetsEnabled) {
      const separator = '[\\p{P}\\p{S}\\s]';
      alternatives.push(`(?:GTA${separator}*|Grand${separator}+Theft${separator}+Auto${separator}*)(?:6|VI)`);
    }
    if (!alternatives.length) return () => false;
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}\\p{M}])(?:${alternatives.join('|')})(?![\\p{L}\\p{N}\\p{M}])`, 'iu');
    return (title) => typeof title === 'string' && pattern.test(title.normalize('NFKC').replace(/\s+/gu, ' '));
  }

  core.createMatcher = createMatcher;
  core.normalizeEntry = normalizeEntry;
  // Unicode regex /iu treats both lowercase sigma forms as the same letter.
  core.entryKey = (value) => normalizeEntry(value).toLowerCase().replace(/ς/g, 'σ');
})();
