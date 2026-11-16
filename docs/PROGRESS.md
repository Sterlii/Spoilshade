# Spoilshade progress

## Implemented

- Shared plain-JavaScript Firefox and Chromium Manifest V3 extension, without production dependencies or a background worker.
- Literal title matching, GTA 6 preset, custom phrases, independent master/preset switches and local settings updates.
- Independent title/thumbnail conceal, reveal and re-hide; dynamic discovery-card adapters, early guards and bounded per-document reveal memory.
- Popup controls, local-processing disclosure, original SVG/PNG branding and separate promotional artwork.
- Reproducible browser packages, source archive, checksums, automated tests and publication instructions.

## Verification

[TEST-RESULTS.json](TEST-RESULTS.json) records fresh test outcomes, exact tool versions and current runtime binding. [TESTING.md](TESTING.md) explains the boundaries between unit tests, installed-extension fixtures and live-site observations. Prior feature reviews concerned the implementation before publication-only cleanup; they do not independently approve later archive-packaging changes. See [REVIEWS.md](REVIEWS.md).

## Remaining tasks

- Complete live Home/Subscriptions/watch-sidebar, theme/navigation/hover, screen-reader, slow first-paint and long-duration performance checks in [MANUAL-TESTS.md](MANUAL-TESTS.md).
- Keep genuine controlled-fixture screenshots labeled; they are not live YouTube evidence.
- Confirm publisher identity, monitored support, public URL accessibility, applicable account/legal declarations and current store disclosure categories.
- Review final artifacts and listing screenshots; separately authorize store submission, fees and signing. No AMO or Chrome Web Store submission, approval or Mozilla signing is claimed.

## Known limitations

Filtering is title-based, not image or plot recognition. Unknown markup, non-card banners/descriptions, main watch title/player and comments are outside scope. Desktop `www.youtube.com` only; no guaranteed zero flashes. Reveal memory is bounded to 1000 video IDs within the document and does not survive hard reload/restart. Concealed originals remain inspectable in the DOM. The optional revealed-tooltip removal edge in [REVIEWS.md](REVIEWS.md) remains deferred.

For build/test commands and development-only dependency caveats, see [TESTING.md](TESTING.md). Do not infer current verification from earlier screenshots or review outcomes.
