# Spoilshade

**Hide the spoilers. Keep the surprise.**

Spoilshade is a local-only browser extension that conceals matching video-card titles and thumbnails on desktop **www.youtube.com**. Firefox is the primary target; a separate Chromium Manifest V3 package is built from the same plain JavaScript source.

Version **1.0.0** is a release candidate, not a claim of store approval. See [publication gates](docs/PUBLISHING.md) and the [manual test checklist](docs/MANUAL-TESTS.md); only recorded results count as verification.

## What it does

- Matches video-card **titles**, then covers the title and thumbnail with separate opaque reveal controls.
- Includes a switchable GTA 6 preset: `GTA 6`, `GTA6`, `GTA VI`, `GTAVI`, `Grand Theft Auto 6`, and `Grand Theft Auto VI`, including common spacing/punctuation variations.
- Lets you add and remove custom words or phrases, for example `Jason`, without editing code. Matching is case-insensitive and uses word boundaries; `Jasonville` does not match `Jason`. Custom punctuation is literal, not a regular expression.
- Updates loaded cards when settings change and handles dynamically added cards and YouTube's in-page navigation.
- Lets you reveal a title without its thumbnail, or the thumbnail without its title. Reveal choices are temporary, per tab, not a saved viewing history.
- Stores your enable/preset switches and custom keywords locally in the browser profile, not in sync storage. No account, telemetry, analytics, remote code, or extension-operated server.

## Important limits

This is **title-based filtering, not spoiler recognition**. If a title contains none of your keywords, Spoilshade cannot detect a spoiler inside its thumbnail. It does not analyze images, audio, video, or story meaning. Generic names such as `Jason` can hide unrelated videos.

Protection targets recognized discovery-card markup on desktop `https://www.youtube.com/`. It is not a whole-page shield. YouTube experiments, unrecognized card types, and changed markup can escape filtering. The watch-page **player and main watch title are not protected**, even when recognized recommendation cards beside it are filtered. Comments, captions, notifications, embeds, mobile YouTube, other hosts, and other sites are outside the protection scope.

Early `document_start` CSS hides recognized card content pending evaluation to reduce first-paint exposure. This is not a guarantee that every spoiler is hidden or that no flash can ever occur. Reload existing YouTube tabs after installing or updating the extension.

## Build and local installation

From this repository, use Node.js 24, npm with the committed lockfile, and Python 3 (the build uses its standard-library `zipfile` module):

```sh
npm ci --include=dev
npm test
npm run build
npm run lint:firefox
```

The build produces `dist/firefox/`, `dist/chrome/`, and three archives under `release/`: `spoilshade-1.0.0-firefox.zip`, `spoilshade-1.0.0-chrome.zip`, and `spoilshade-1.0.0-source.zip`, with `SHA256SUMS`. Install ZIPs use fixed metadata for reproducible bytes. These are local build artifacts; a ZIP is not a Mozilla-signed add-on. The extension has no production dependencies or background worker. Development tools are installed by `npm ci --include=dev`.

### Firefox (primary; manifest minimum 142)

1. Open `about:debugging#/runtime/this-firefox`.
2. Choose **Load Temporary Add-on** and select `dist/firefox/manifest.json`.
3. Pin/open Spoilshade's toolbar popup; reload a desktop YouTube tab.

Temporary loading is for development, not persistent installation. Normal release distribution needs Mozilla signing; see [Publishing](docs/PUBLISHING.md).

### Chromium

1. Open `chrome://extensions` and enable **Developer mode**.
2. Choose **Load unpacked**, then select `dist/chrome/`.
3. Pin/open the toolbar popup and reload YouTube.

Use the Chromium package, not the Firefox manifest. Unpacked loading is for local development, not store publication.

## Use

Leave protection and the GTA preset enabled for the default filter. Add a custom keyword in the popup to cover another topic; remove it when you no longer need it. Changes apply to open YouTube pages. Use each card's title or thumbnail reveal button only when you want to see that part. Turn protection off to restore managed cards.

Custom entries are normalized and deduplicated; the settings contract allows up to 200 entries of up to 120 Unicode characters each. Restore defaults re-enables the starter pack without deleting custom entries or changing the master switch. Custom entries continue working with the starter pack off; even a preset spelling can then be added independently. No image recognition or regex syntax is provided.

## Development and evidence

- `npm test`: Node tests; not proof of live YouTube compatibility.
- `npm run test:browser`: actual Firefox then Chromium installations, extension-owned popup interactions, controlled discovery cards, parser-time CSS probes and separate live YouTube observations. See [testing details](docs/TESTING.md).
- `node tests/firefox-toolbar.mjs`: opens the actual Firefox toolbar action in an isolated headless profile and captures its popup browsing context.
- `npm run verify:release`: checks ZIP contents/source equality, permission scope, reviewable source contents, and byte-identical rebuilds.
- `npm run assets`: regenerates icons/promos from editable SVG using `rsvg-convert` and ImageMagick; not required for an ordinary build because exports are committed.
- [Architecture](docs/ARCHITECTURE.md): settings, matching, early guards, and integration contract.
- [Manual tests](docs/MANUAL-TESTS.md): live-site, accessibility, flash, and profiling checks.
- [Privacy](docs/PRIVACY.md), [store copy](docs/STORE-LISTING.md), and [publication checklist](docs/PUBLISHING.md).

Fresh test outcomes, exact tool versions and current runtime binding are recorded in [TEST-RESULTS.json](docs/TEST-RESULTS.json). Remaining gates are in the [release report](docs/RELEASE-REPORT.md), [review outcomes](docs/REVIEWS.md), and [progress/next steps](docs/PROGRESS.md). Do not present fixture screenshots as live YouTube evidence or mark unexecuted manual checks passed; logged-in feeds, full live visual coverage, screen-reader and prolonged profiling sign-off remain open.

## Project links

- Homepage: https://github.com/Sterlii/Spoilshade
- Support and privacy questions: https://github.com/Sterlii/Spoilshade/issues
- Privacy policy: https://github.com/Sterlii/Spoilshade/blob/main/docs/PRIVACY.md

## Permissions and license

`storage` saves local settings. Access to `https://www.youtube.com/*` lets the content scripts read card titles and modify matching cards. No all-sites, browsing-history, cookies, or network-interception permission is requested.

[MIT](LICENSE). Copyright 2026 Spoilshade contributors.

Independent project; not affiliated with or endorsed by YouTube, Google, Mozilla, Rockstar Games, or Take-Two Interactive.
