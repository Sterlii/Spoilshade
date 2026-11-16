# Testing and evidence

## Reproduce

```sh
npm ci --include=dev
npm test
npm run build
npm run lint:firefox
npm run test:browser
node tests/firefox-toolbar.mjs
npm run verify:release
```

Linux browser harness prerequisites: Firefox on `/usr/bin/firefox` (override with `env FIREFOX_BINARY=/path/to/firefox npm run test:browser`) and an extension-capable Chromium. The harness prefers `CHROMIUM_BINARY`, then Playwright's installed binary, then an existing Linux Playwright Chromium cache. To obtain an isolated Chromium where needed, explicitly run `npx playwright install chromium`. Branded Chrome can reject command-line unpacked extensions; use Chromium for automation, then manually verify the final Google Chrome release.

Selenium Manager downloads geckodriver into this repository's ignored `.test-cache/selenium/` if needed. All Firefox sessions use newly created profiles; Chromium uses an ignored disposable `.test-cache/chromium-profile/`. No regular browser profile is opened or modified. Firefox's privileged automation flag is only passed to the local test driver, never shipped in the extension.

Controlled-page testing adds loopback permissions to an ignored **test-only copy** of each manifest. Production manifests/ZIPs only permit `https://www.youtube.com/*`. The browser harness verifies the installed build matches current runtime files and stores their SHA-256 fingerprint in its result. The Firefox live check reinstalls the unmodified production manifest; the Chromium live check uses the same runtime payload with its test manifest still allowing loopback. Tests do not upload keywords, titles, screenshots or results anywhere.

## Public results

[TEST-RESULTS.json](TEST-RESULTS.json) records fresh execution results, exact tool versions and current runtime binding. Prior feature reviews predate publication-only cleanup; they do not independently approve later archive-packaging changes. Raw browser receipts, logs and personal/live-site captures are not public release evidence. Running a harness locally may generate ignored raw results; publish only a sanitized summary.

## What each evidence layer establishes

| Layer | Coverage | Not established |
| --- | --- | --- |
| `npm test` | Real core matcher, settings boundary, popup DOM, dynamic adapters, redaction/restoration and cleanup | Actual website/browser rendering or every YouTube experiment |
| Installed-browser fixture checks summarized in `TEST-RESULTS.json` | Installed Firefox/Chromium extension, genuine storage events, popup Add/Enter/remove/reopen, phrases/preset independence, keyboard reveals, geometry, parser-time guards, dynamic updates and 200-card insertion/removal | A universal zero-flash guarantee, screen-reader audit or long-duration heap profile |
| Separate live-site observations summarized in `TEST-RESULTS.json` when run | Actual anonymous YouTube search results, recognized cards and redaction controls | Full live visual/interaction sign-off when consent dialog is present; logged-in subscription feed |
| Firefox toolbar check summarized in `TEST-RESULTS.json` | Actual toolbar action opens an extension popup with measured bounds | Physical desktop interaction on the user's regular profile |
| `npm run verify:release` | Manifest permissions, archive contents/source hashes, source-package privacy exclusions and deterministic install-archive rebuilds | Store approval, signing or policy certification |

The parser-time probe is a synchronous page script reading computed visibility before the first ordinary render opportunity; dynamic insertion is sampled synchronously before the content-script observer handles the added card. These tests prove the recognized fixture is already guarded at those times, **not** every native paint/compositor race on the live site.

## Screenshot provenance

- `screenshots/firefox-popup.png`, `chromium-popup.png`: genuine extension-owned popup page with a saved custom entry, captured by that browser; not simulated designs.
- `screenshots/firefox-native-popup.png`: genuine toolbar-popup remote browsing-context snapshot. Firefox's ordinary screenshot of its XUL browser element captured a blank embedding surface, so the harness uses Firefox's native `drawSnapshot` to capture the actual remote content instead. No UI is repainted or fabricated.
- `screenshots/*-fixture-dark.png`, `*-fixture-light.png`: real extension rendering over the clearly labeled local Discovery lab fixture. Full-page captures target 1280×800. These are **not live YouTube screenshots**.
- Published popup and card-layout captures use genuine extension rendering with controlled content; they are **not live YouTube evidence**. Live-site observations must be recorded separately, with consent or access blockers left explicit.
- `assets/promo/*.png`: generated promotional artwork, not screenshots.

Do not upload a cropped 380px popup alone to a store requiring 1280×800 screenshots. Choose suitable unedited full-page captures, or capture the genuine browser experience at the required resolution. The controlled fixture label must remain visible if those images are used.

## Outstanding manual coverage

Use `MANUAL-TESTS.md` for sign-off on real Home/Subscriptions/watch-sidebar feeds, logged-in layouts, continued scrolling and Back/Forward, YouTube's own theme modes, screen-reader labels, zoom/forced colors, native pointer hover previews, slow startup/frame-by-frame flash checks and long-duration memory/performance profiles. Controlled fixture light/dark rendering is not a claim that all live YouTube themes were tested.

The source ZIP excludes raw logs/receipts, the local `Images/` directory, common credential-file names, browser profiles, dependencies and symlinks, in addition to the repository ignore rules. Install ZIPs contain only the allowlisted runtime payload.

## Development dependencies

The shipped extension has **no runtime dependencies**. Use `npm audit --omit=dev` to check production exposure. The previously recorded development linter chain had three low-severity advisories (`web-ext` → `addons-linter` → `deepmerge`, GHSA-gcqx-w48m-w2h4). Do not force-downgrade to an obsolete web-ext merely to silence this; monitor upstream. They are not packaged into either extension ZIP. Run `npm audit --include=dev` to check current development-tool exposure explicitly; audit results can change over time.
