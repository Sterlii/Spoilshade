# Manual release checks — Spoilshade 1.0.0

**Checklist, not a pass report.** All items are unverified until a tester records a result and evidence. Automated fixture results, actual YouTube results, screenshots, and profiling traces must be identified separately. Passing a local fixture does not demonstrate support for YouTube's current live markup.

## Record for every run

Date; source revision/artifact hash; browser and exact version; OS; clean/test profile; extension package/installation method; display scale/zoom; YouTube theme/language; signed-in/out state (no account identifiers); page URL/surface; live-site versus controlled fixture; expected/actual outcome; evidence path; pass/fail/blocked/not-run and reason.

Use an isolated test profile, not a personal signed-in browsing session. Do not publish private recommendations/account details. First test safely with non-spoiling controlled titles/images; only then use live YouTube with a tester who accepts possible spoiler exposure. Use already-public, non-sensitive search topics if actual GTA 6 content is undesirable.

## Installation and settings

- [ ] **Firefox first:** build and load `dist/firefox/manifest.json` as a temporary add-on. Record the real browser version and extension errors. Minimum declared version 142 is not a tested-version claim.
- [ ] Load `dist/chrome/` in a separate Chromium test profile; record that browser/version too. Do not assume a Firefox result covers Chromium.
- [ ] Confirm install permissions are only local storage and `www.youtube.com`; deny/withhold site access and verify no broad-site fallback is requested. Re-grant and reload to test filtering.
- [ ] Fresh settings: protection and GTA preset enabled, custom list empty. Close/reopen popup and restart/reinstall as appropriate to verify local persistence; distinguish temporary-install data behavior from a signed release installation.
- [ ] Toggle preset off/on while matching cards are loaded. Disable protection, ensure all managed content and links/accessibility attributes restore; re-enable and ensure cards are reevaluated.
- [ ] Keep two YouTube tabs open; change settings in the popup and verify both update without a manual page reload.
- [ ] Test empty/whitespace entry, case/spacing duplicates, Unicode normalization, maximum entry length/count, keyboard add/remove, and visible validation/error feedback. Ensure unsafe-looking text renders as text rather than markup.

## Matching and already-loaded cards

Use controlled content for deterministic boundary/negative cases; identify it as a fixture.

- [ ] Positive preset titles: `GTA 6 trailer`, `GTA6 news`, `GTA VI news`, `GTAVI news`, `Grand Theft Auto 6`, `Grand Theft Auto VI`, and punctuation/spacing variants such as `GTA-6` and `GTA: VI`.
- [ ] Negative controls: `GTA V`, `GTA VII`, `GTA60`, unrelated videos, and keyword-like substrings without proper boundaries. They must not be hidden solely by the GTA 6 preset.
- [ ] **Jason on loaded cards:** with a visible recognized card titled `Jason update` and a negative card `Jasonville update`, add `Jason` in the popup. The former's title/thumbnail conceal without reload; the latter remains visible. Remove `Jason` and verify the newly matched card restores. Repeat in an actual live session when suitable cards exist; record unavailable content as blocked, not a fixture pass.
- [ ] Custom phrases match case-insensitively with normalized whitespace; punctuation is literal (`A+B` is not regex). Confirm unrelated generic-name matches are a documented tradeoff.
- [ ] A spoiler-looking thumbnail paired with an unrelated, nonmatching title remains unfiltered. This proves the stated limitation; do not label it image recognition.

## Actual www.youtube.com coverage

Repeat in **YouTube light and dark** themes, Firefox then Chromium. Record which markup/layout variants actually appear.

- [ ] Home feed recognized cards: matching title and thumbnail concealed; nonmatches and unrelated controls usable.
- [ ] Search results: filter recognized videos; scroll to lazy-loaded results and check newly added cards. Note unsupported/unknown renderers rather than claiming every result type is protected.
- [ ] Test recognized recommendation/sidebar cards on a watch page without claiming the **main player or main watch title** is protected. Do not start spoiler content merely to test a cover.
- [ ] Observe any Shorts, channel, subscription, playlist, or other discovery surfaces available in the current layout. Document supported recognized cards and unsupported renderers separately; do not infer universal support from one card type.
- [ ] Navigate home → search → watch → back/forward without full page reload; repeat search and scroll. Covers must not duplicate or remain on unrelated recycled cards.
- [ ] Change a card's video identity/title and remove/reinsert cards (controlled fixture if necessary). Old reveal decisions must not expose a different video; stale controls and hidden accessibility attributes must not remain attached to a nonmatching card.
- [ ] Visit mobile/embedded/other-host examples in the test profile; confirm there is no injection beyond `www.youtube.com` and no claim of protection there.

## Independent reveal and usable cards

- [ ] Both matching title and thumbnail start concealed by opaque controls, not a readable blur.
- [ ] Reveal **title only**: thumbnail stays hidden. On another card reveal **thumbnail only**: title stays hidden. Test title → thumbnail and thumbnail → title sequences.
- [ ] Reveal buttons do not navigate or play a video. After explicit reveal, expected normal card navigation still works.
- [ ] Other cards' reveal states remain independent. Test duplicate video cards and recycled cards; record per-tab behavior and bounded-state limitations without promising cross-tab or restart persistence.
- [ ] Refresh/new tab/browser restart: no saved reveal-history record exists. Do not require persistence of transient reveal choices.
- [ ] Disable protection after a partial reveal; verify original links, visibility, titles/tooltips, and labels restore, without leftover extension covers.

## Accessibility and layout

- [ ] Keyboard only: popup controls and reveal buttons reachable in logical order; visible focus; Space/Enter activate buttons; no focus trap or accidental navigation. Verify behavior after reveal removes/replaces a focused control.
- [ ] Screen reader/accessibility inspector: unrevealed titles are absent from exposed names, tooltips, link `aria-label`s, and hidden-subtree navigation. Extension control labels do not repeat the concealed title. Check thumbnail alt text and nested links too.
- [ ] Revealing one part does not expose the other through accessible names. Disabling restores the original semantics.
- [ ] Readable popup/errors/covers at 200% zoom, narrow viewport, light/dark themes, OS high contrast/forced colors where available, and reduced motion. No cropped keyword controls or invisible focus indicators.
- [ ] Hover matching cards and focus their links: no concealed title leaks through a tooltip or preview label. Check any hover preview on recognized thumbnail areas; record leaks.

## Flash and performance — require traces, not impressions

- [ ] Capture first navigation and hard reload with browser filmstrip/video/screenshots enabled. Include a cold cache and slowed CPU/network case. Inspect from the first rendered card, not only the final settled screenshot. Record any readable matching title/image frame.
- [ ] Repeat for in-page navigation and newly appended/recycled cards. Early CSS protects recognized markup only; record any unknown renderer gap explicitly.
- [ ] Simulate slow/failing settings load in a controlled test. Confirm recognized unevaluated content stays guarded (fail closed); disabling must restore managed content. Label this a fixture/fault-injection test, not a live-site outage.
- [ ] Profile the same scroll/navigation workload with extension disabled and enabled. Record browser/version, card count, timings, long tasks, CPU, and memory; compare traces. Do not claim “zero overhead” from subjective browsing.
- [ ] Let a settled page idle; verify there is no extension-created mutation loop or continuous rescanning. Long-scroll, remove cards, and navigate repeatedly; inspect retained detached nodes/listeners and reveal-map bounds. Preserve a trace or measurements.
- [ ] Check page and extension consoles for errors. Separate YouTube's own failures and third-party extensions from Spoilshade failures.

## Privacy and packaging

- [ ] Inspect extension/page network initiators and source for extension-originated requests; confirm no external analytics, matching API, remote code, title/keyword/identifier transmission, or sync writes. YouTube's normal requests are not extension telemetry.
- [ ] Inspect `storage.local`: only settings, not accumulated titles, URLs, or reveal history. Remove a keyword; verify persisted removal and open-tab changes. Uninstall/clear extension data and reload to check deletion/restoration.
- [ ] Test a signed/staged release artifact after signing/store review when available; temporary/unpacked tests do not prove the final distributed artifact works.
- [ ] Review screenshots: live and controlled-fixture provenance explicit; dimensions checked; personal details absent; no mock interface presented as actual behavior.

## Release sign-off

| Evidence category | Status at checklist creation | Evidence to attach |
| --- | --- | --- |
| Unit/DOM tests | Not asserted here | Actual command output, source revision |
| Firefox fixture extension run | Not asserted here | Browser/version, report, labeled captures |
| Chromium fixture extension run | Not asserted here | Browser/version, report, labeled captures |
| Live YouTube light/dark and navigation | Not asserted here | Surface/theme-specific observations, actual URLs, captures |
| Screen-reader and keyboard checks | Not asserted here | Reader/browser versions and results |
| Flash/performance profiling | Not asserted here | Filmstrip/traces and measured comparisons |
| Signed/store artifact and listing | Pending publisher | Signing/review outcome and installation evidence |

The release owner replaces these neutral statuses with actual evidence. A blocked live check must remain a visible release caveat; a controlled screenshot does not close it.
