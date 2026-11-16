# Spoilshade branding and artwork

## Identity

**Spoilshade.** — **Hide the spoilers. Keep the surprise.**

The original geometric mark combines a shield with an eye concealed by a diagonal shade. It uses a solid silhouette, rather than fine outlines, so the toolbar exports remain recognizable at 16 px. The charcoal rounded tile keeps the lime mark visible on light and dark browser toolbars. No game artwork, third-party logos, stock graphics, or remote resources are used.

- **Lime / primary accent:** `#c5ed87`
- **Charcoal / canvas:** `#111318`
- **Surface:** `#1a1e26`
- **Light text:** `#f3f5f7`
- **Muted text:** `#a4adbc`
- **Rule / border:** `#2d333e`

The popup uses the operating system's sans-serif font stack. Promotional raster exports use the locally installed DejaVu Sans font. No font is downloaded, bundled, or requested at runtime. Source SVG typography remains editable and can vary slightly if rasterized on another machine with a different fallback font; use DejaVu Sans for matching exports.

Original artwork and source files are covered by the project's MIT license. “YouTube” and game names are descriptive references, not claims of affiliation or endorsement.

## Delivered graphics

| File | Purpose |
| --- | --- |
| `assets/brand/logo.svg` | Editable 512 × 512 vector master; geometric shapes only |
| `assets/icons/icon-16.png` | Small toolbar icon |
| `assets/icons/icon-32.png` | High-density small toolbar icon |
| `assets/icons/icon-48.png` | Extension management / popup brand icon |
| `assets/icons/icon-64.png` | AMO listing icon export |
| `assets/icons/icon-96.png` | High-density extension management icon |
| `assets/icons/icon-128.png` | Chrome store / package icon, including transparent padding |
| `assets/icons/icon-256.png`, `icon-512.png` | Larger press/store exports with proportionate transparent padding |
| `assets/promo/promo-small-440x280.svg` and `.png` | Small promotional tile |
| `assets/promo/promo-marquee-1400x560.svg` and `.png` | Marquee promotional artwork |

**Promotional artwork is not a screenshot.** The two promotional compositions are original typographic/logo layouts, with no simulated browser, interface, review, usage metric, or certification. They must not be submitted in screenshot slots. Genuine screenshots of the completed extension are a separate release deliverable.

## Re-exporting

From the project root:

```sh
python3 scripts/assets.py
```

The script uses the system's `rsvg-convert` and ImageMagick `magick`. It has no Python package dependencies and performs no downloads. It renders all icons directly from the preserved SVG master, exports both promotional SVGs, strips export metadata, and checks every PNG's actual encoded dimensions. Icons are 8-bit RGBA PNGs; promotional exports are opaque 8-bit RGB PNGs.

Toolbar exports (16–96 px) use the canvas for legibility. The 128 px export is rendered at 96 px and centered in a transparent 128 px canvas, giving at least 16 px padding on each edge. The 256/512 px exports use the same padding proportion.

## Store image requirements checked

The official [Chrome Web Store image guidance](https://developer.chrome.com/docs/webstore/images) lists:

- A **128 × 128 PNG extension icon**, with a recommended **96 × 96 artwork area and 16 px transparent padding** per edge.
- A **440 × 280 small promotional image**.
- A **1400 × 560 marquee promotional image**.
- At least one **genuine screenshot**, **1280 × 800 or 640 × 400**, full bleed with square corners.

The supplied promotional exports match those two promotional dimensions. Store guidance and dashboard validation should be checked again at submission; this is not a store approval claim.

## Popup behavior and visual checks

`src/popup/popup.html` uses only local scripts and styles and references `../../assets/icons/icon-48.png`. The six default phrases come from the shared core module rather than a separate UI list.

- The master switch controls protection without deleting saved phrases.
- The starter-pack switch controls all six default phrases together.
- **Restore defaults** restores only the starter pack; it leaves the master switch and all custom entries unchanged.
- Custom phrases are normalized using the shared core functions. Empty, duplicate, over-120-character, and over-200-entry submissions show feedback without writing.
- Enter and Add use the same native form submission path. Remove buttons have phrase-specific accessible labels. Text is injected only using `textContent` and DOM creation.
- Changes save immediately through the shared settings store; `storage.onChanged` updates open popups. The UI reports load/save errors and rolls back a rejected save.
- Native keyboard-operable inputs, visible focus styles, a polite live region, reduced-motion handling, and forced-color focus support are included.

Focused checks run with `node --test tests/popup.test.js`. Those tests exercise the actual popup and core storage module in jsdom with an inert WebExtension storage boundary. Local popup fixtures support rendering checks but do not prove installed-extension behavior and are not store screenshots. See [TESTING.md](TESTING.md) for installed-extension coverage and screenshot provenance, and [TEST-RESULTS.json](TEST-RESULTS.json) for current results.
