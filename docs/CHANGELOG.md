# Release notes

## 1.0.0 — initial release candidate (unpublished)

- Firefox-first Manifest V3 extension with a shared Chromium build.
- Default, switchable GTA 6 keyword variants with case-insensitive, punctuation-tolerant matching.
- Custom words and literal whitespace-normalized phrases, Unicode word boundaries, duplicate prevention, and individual removal.
- Local settings persistence and immediate reevaluation of loaded YouTube cards.
- Separate opaque title and thumbnail shields, accessible reveal/re-hide buttons, and bounded per-document reveal memory.
- Document-start protective styles, dynamic-card observation, and recognition of current legacy/modern desktop discovery and Shorts preview markup.
- Original shield-eye identity, editable SVGs, exported toolbar/store icons and promotional artwork.
- MIT license, local-only privacy statement, reproducible install ZIPs, matching source ZIP, checksums, and publication documentation.

### Known limitations

Matching uses video titles only. Unmatched titles can still have spoiler thumbnails. Main watch title/player, descriptions, comments, topic banners and other non-card areas are outside scope. Desktop `www.youtube.com` only; markup experiments can escape protection. No absolute flash-free guarantee. Reveal memory survives in-page navigation within a document, not hard reload or browser restart.

See `TESTING.md` and `PROGRESS.md` for exact automated/live coverage and remaining release gates. No store approval or signing is implied.
