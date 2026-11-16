# Architecture and integration contract

Version 1.0.0. Plain JavaScript; no production dependencies or background service worker.

## Shared global modules
Content scripts execute in order: `core/defaults.js`, `core/matcher.js`, `core/settings.js`, `youtube/redaction.js`, `youtube/integration.js`. Each is an IIFE attaching to `globalThis.Spoilshade`. Node tests load them via import side effects.

- `DEFAULT_KEYWORDS`: frozen array of six strings: GTA 6, GTA6, GTA VI, GTAVI, Grand Theft Auto 6, Grand Theft Auto VI.
- `normalizeEntry(value)` -> string, trimmed, NFKC, whitespace collapsed. Entry maximum 120 Unicode characters; reject empty. Custom punctuation is literal; whitespace normalized; case insensitive; Unicode letter/number boundaries apply to whole words/phrase endpoints. Do not treat Jasonville as Jason.
- `entryKey(value)` -> case-insensitive normalized duplicate key.
- `createMatcher(settings)` -> function(title) -> boolean. Settings `{version:1, enabled:true, presetsEnabled:true, customKeywords:[]}`. Built-in GTA variants allow punctuation/spacing between GTA and 6/VI and between full-name words, NOT GTA V, GTA VII or GTA60.
- `DEFAULT_SETTINGS`, `sanitizeSettings(raw)` -> independent validated settings object. Invalid fields revert to safe defaults, string entries deduplicated with maximum 200 entries.
- `createSettingsStore(api = globalThis.browser || globalThis.chrome)` -> `{load(), save(settings), subscribe(callback)}`. Async load/save use `storage.local` key `settings`; subscribe returns unsubscribe. Storage onChanged drives all open pages. Browser API wrapper supports Promise APIs in Firefox and modern Chromium. No sync storage.

## Popup integration

Popup loads defaults, matcher, settings then popup script. Icon reference `../../assets/icons/icon-48.png` in source popup; build preserves src/ and assets/ directory trees, manifest popup path `src/popup/popup.html`.

## Protection strategy
Manifest document_start CSS guards recognized card title/thumbnail content until evaluated, not the whole page. Each card receives evaluated state. Titles and thumbnail get independent opaque controls; original content remains hidden with visibility and aria-hidden/inert while concealed. Strip/restore title and aria-label attributes that contain concealed title; neutralize accessible linking labels without copying titles into extension labels. Maintain bounded per-tab in-memory video-ID reveal map (no persistence across restarts). Recycled cards reset on video identity/title changes. Observe subtree mutations and navigation; batch roots, avoid own-DOM mutation loops, prune detached records. Unknown markup limitations explicitly documented. Fail closed if settings cannot load; disabling restores all managed DOM and disables early guards.

## Verification and release
TDD with node:test. Real headless Firefox temporary add-on install first; local YouTube-shaped fixture tests are labeled separately from real youtube.com tests. Chromium persistent test profile loads same source with generated manifest. Genuine screenshots captured from real rendering; controlled fixture screenshots labeled as such, never represented as live YouTube. MIT licensed. No AMO or Chrome Web Store submission or approval is claimed. See TEST-RESULTS.json for current execution results and runtime binding, and PUBLISHING.md for store requirements.
