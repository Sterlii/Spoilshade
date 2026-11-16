# Store listing draft — Spoilshade 1.0.0

**Preparation copy, not a published listing.** Approve this text only after the release gates in [Publishing](PUBLISHING.md) have evidence. Do not claim live YouTube tests or store approval on the strength of fixture tests.

## Name

Spoilshade

Optional descriptive listing title, if the publisher and store permit it: **Spoilshade — YouTube spoiler filter**. Keep the packaged name and listing consistent; no store/name reservation is implied.

## Short description / AMO summary

Hide YouTube spoilers with custom keywords, GTA 6 presets, and separate title and thumbnail reveal controls.

## Full description

Hide the spoilers. Keep the surprise.

Avoid unwanted spoilers while browsing YouTube. When a video's title matches one of your keywords, Spoilshade covers its title and thumbnail without removing the video from your feed.

Start with built-in GTA 6 protection, or add your own words and phrases for games, movies, shows, characters, and more. Just type a keyword in the toolbar popup and press Enter. Changes apply to already-loaded videos without refreshing the page.

Your feed, your choice

- GTA 6 protection enabled by default, including common GTA 6 and GTA VI title variations.
- Add and remove custom words and phrases directly in the popup.
- Case-insensitive matching with word boundaries: Jason matches Jason's, but not Jasonville.
- Reveal a title without revealing its thumbnail, or reveal the thumbnail while keeping the title hidden.
- Re-hide revealed content, pause all protection, or turn off the GTA 6 preset while keeping custom keywords active.
- Handles recognized desktop YouTube video cards in feeds, search results, recommendations, and supported Shorts previews.

Private by design

Filtering happens entirely in your browser. Your keywords and settings stay in local extension storage. Spoilshade does not transmit your keywords, inspected titles, or reveal choices. No accounts, tracking, analytics, external AI services, or remote processing.

Know the limits

Spoilshade matches video titles; it does not analyze images or understand story content. If a title contains none of your keywords, its thumbnail will not be filtered. Broad keywords can also hide unrelated videos.

Protection is limited to recognized video cards on desktop www.youtube.com. The main watch-page title and video player, comments, captions, notifications, embeds, and mobile YouTube are not protected. YouTube layout changes can affect filtering, and complete coverage or zero spoiler flashes cannot be guaranteed.

YouTube site access is used to inspect and modify video cards. Storage permission saves your preferences locally.

Independent project, not affiliated with YouTube, Google, Rockstar Games, or Take-Two Interactive. Licensed under MIT.

## Reviewer notes (not marketing copy)

- Version 1.0.0; Firefox primary, separate Firefox and Chrome MV3 manifests. No background worker or production dependencies; executable code is packaged locally.
- Content scripts match `https://www.youtube.com/*`. The URL scope supports in-page navigation; the feature scope is recognized desktop discovery cards. The main watch player/title is intentionally outside scope.
- Default switches: filtering enabled, GTA preset enabled, no custom entries. Inspect a recognized card whose title contains a GTA 6 variant. Expect **separate** title/thumbnail covers. Reveal one; the other should stay covered.
- With a recognized `Jason` card already loaded and not matching the preset, add `Jason` in the popup; it should conceal. Remove `Jason`; it should restore. `Jasonville` should not match.
- Exercise search/home navigation and lazy loading. Read [Manual tests](MANUAL-TESTS.md) for specific checks and record the actual available card types.
- No extension account or payment is needed. YouTube's own consent/sign-in prompts may affect which live content is available. Do not provide personal login credentials; record an access blocker instead.
- Firefox declaration: `browser_specific_settings.gecko.data_collection_permissions.required` is `["none"]` because filtering/settings remain local. Chrome's dashboard must separately disclose local data handling, as explained in [Publishing](PUBLISHING.md).
- Generated manifests/assets and readable source should be explained in the source submission; use the final build instructions and lockfile. The permanent Firefox ID is `spoilshade@sterlii.github.io`; keep it for future updates. AMO validation/signing has not yet occurred.
- Attach actual test results and known failures when submitting. Do not copy “all tests passed,” “tested on live YouTube,” or compatibility version claims unless the release evidence supports them.

## Screenshot plan and captions

Capture real rendering, with neutral/non-spoiling content where possible. Use 1280×800 for both stores. Asset requirements and official sources are in [Publishing](PUBLISHING.md).

| Capture | Suggested caption | Provenance rule |
| --- | --- | --- |
| Popup showing preset and a custom entry | “Choose a preset or add your own spoiler keywords.” | Real extension popup; identify whether the underlying page is live or a fixture. |
| Matching card with both parts concealed | “Matching card titles and thumbnails stay covered.” | Prefer a live YouTube capture after verification. A controlled fixture must say “Controlled demo fixture,” not “YouTube test passed.” |
| Same card with only its title revealed | “Reveal a title without revealing its thumbnail.” | Capture the actual interaction, not an edited mockup of a control. |
| Light/dark presentations | “Fits light and dark browsing.” | Publish only after both presentations have been exercised. |

Record source type, browser/version, theme, date, and tested interaction for each capture in the release evidence. Avoid account names, browsing recommendations, or unrelated personal data. A fixture's controlled content is useful for documentation but must never substitute for live-site compatibility evidence.

## Fields the publisher must finish

- Actual developer/publisher identity and support/privacy contact.
- Verify homepage https://github.com/Sterlii/Spoilshade, support https://github.com/Sterlii/Spoilshade/issues and privacy policy https://github.com/Sterlii/Spoilshade/blob/main/docs/PRIVACY.md are publicly accessible.
- Store categories, language, countries, visibility, and applicable declarations.
- Final store title/slug (the permanent package ID has already been selected).
- Final screenshots, release evidence, and privacy dashboard classifications.

Do not submit with these fields unresolved. Nothing in this file asserts that either store accepted the name or package.
