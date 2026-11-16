# Spoilshade 1.0.0 release-candidate notes

## Product and artifacts

A Firefox-first local-only YouTube discovery spoiler filter, with separate Firefox and Chromium Manifest V3 packages from shared plain JavaScript. Features include GTA 6 defaults, custom literal phrases, local settings updates, independent title/thumbnail reveal controls, dynamic-card handling, early protective CSS and bounded per-document reveal memory. Licensed under MIT, copyright Spoilshade contributors.

- `release/spoilshade-1.0.0-firefox.zip`: unsigned Firefox development/upload package, not a signed persistent installation.
- `release/spoilshade-1.0.0-chrome.zip`: Chromium development/upload package.
- `release/spoilshade-1.0.0-source.zip`: readable sources, editable artwork, lockfile and build/test instructions.
- `release/SHA256SUMS`: checksums from the final build; regenerate after included source/documentation changes.
- `docs/screenshots/`: genuine popup and controlled-fixture rendering. Fixture captures are **not live YouTube screenshots**; popup/card crops are not store-size screenshots.

Source packaging excludes raw logs/receipts, the local `Images/` directory, common credential-file names, browser profiles, dependencies and symlinks; these safeguards supplement `.gitignore`.

## Verification

[TEST-RESULTS.json](TEST-RESULTS.json) is the public summary of fresh execution, exact tool versions and current runtime binding. [TESTING.md](TESTING.md) explains the scope of Node tests, installed-browser fixture checks, the actual Firefox toolbar path and release verification. Earlier feature reviews predate publication-only cleanup and do not independently approve later archive-packaging changes; see [REVIEWS.md](REVIEWS.md).

Earlier anonymous live YouTube observations detected redacted discovery cards, but consent dialogs prevented full visual/interaction acceptance. Controlled-fixture results do not close that limitation or prove logged-in feeds, every theme or every YouTube experiment.

## Local installation

Build using the [README](../README.md). Firefox: `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → `dist/firefox/manifest.json`. Chromium: `chrome://extensions` → Developer mode → **Load unpacked** → `dist/chrome/`. Reload existing YouTube tabs after installation or update.

## Limitations and remaining gates

Detection uses titles, not image/plot recognition; unmatched titles can still have spoiler thumbnails. Protection covers recognized desktop `www.youtube.com` discovery markup, not the main watch title/player, descriptions, banners or comments. Changed markup can escape filtering; zero flashes are not guaranteed. Reveal memory does not survive hard reload/restart. Hidden originals remain inspectable in the DOM.

Complete [manual checks](MANUAL-TESTS.md) for live Home/Subscriptions/watch-sidebar feeds, themes/navigation/hover, screen readers, slow startup and long-duration performance. The optional revealed-tooltip removal issue remains deferred in [REVIEWS.md](REVIEWS.md).

Before store submission, verify public links and monitored support, complete actual publisher/account/legal declarations, reconcile local-only data disclosures, select safe genuine screenshots and review final artifact checksums. Follow [PUBLISHING.md](PUBLISHING.md). No AMO or Chrome Web Store submission, approval, registration payment or Mozilla signing is claimed by this report.
