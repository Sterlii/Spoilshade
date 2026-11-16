# Revealed-title control layout

## Problem and correction

The re-hide control could overlap a revealed title or clip in a short title row.

- Reserve an 80px end slot in both concealed and revealed title rows.
- Use the parent row's available width rather than the title's intrinsic width.
- Convert initially inline title targets to block layout while preserving native title-clamp display styles.
- Use a 20px compact title control with sufficient CSS specificity to override general thumbnail-control sizing.
- Preserve independent thumbnail state and restore extension-owned layout attributes when protection is removed.

## Regression coverage

The browser regression reproduced overlap before correction; a 20px-row case also detected CSS-cascade clipping. Geometry checks cover inline and clamped titles, wide/narrow rows, vertical alignment and settled thumbnail bounds after resizing. Horizontal separation alone cannot establish settled layout.

`screenshots/firefox-title-revealed.png` and `screenshots/chromium-title-revealed.png` are genuine controlled-fixture captures, **not live YouTube**. The corresponding `*-title-narrow.png` images are 240px card crops, not store-size screenshots.

Earlier specification and quality reviews covered this feature fix before publication-only cleanup. They do not independently approve later archive-packaging changes. Current execution results and runtime binding belong in [TEST-RESULTS.json](TEST-RESULTS.json); see [REVIEWS.md](REVIEWS.md) for scope and the deferred tooltip issue. Manual acceptance gates remain open.
