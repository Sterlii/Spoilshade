# Spoilshade privacy policy

Applies to Spoilshade 1.0.0. Last updated: 2026-11-16.

## Local processing, no transmission by Spoilshade

Spoilshade reads recognized video-card titles and video links/identifiers on desktop `https://www.youtube.com/` to decide which titles and thumbnails to conceal. It compares titles with the built-in preset and your custom keywords locally in the browser. It changes the page's presentation; it does not analyze the contents of thumbnail images, audio, or videos.

Spoilshade does not send page contents, keywords, video identifiers, reveal actions, browsing activity, or other user data to its contributors or to third parties. It has no analytics, telemetry, advertising, remote matching service, account system, or remotely loaded executable code. It does not sell or transfer user data. Data is used only to provide the local filtering controls.

This does **not** mean that no data is accessed: local access and storage are described below. YouTube still makes its own network requests and operates under its own policies. Browser/store update checks and store-site data practices are separate from Spoilshade's filtering code.

## What stays on your device

| Data | Purpose and retention |
| --- | --- |
| Enabled switch, preset switch, and custom keywords | Saved under the `settings` key in extension `storage.local` in your browser profile, until changed or extension data is removed. Not stored in `storage.sync`. |
| Card titles, links/video identifiers, and redaction state | Processed in the open page to match and manage cards. Not saved as browsing history or transmitted by the extension. |
| Separate title/thumbnail reveal choices | Bounded per-tab memory used to retain temporary choices while handling cards; not persisted across browser restarts. |

Local extension storage is not a password vault. Do not put secrets or sensitive personal information in keyword entries. Spoilshade adds no independent encryption layer to browser-profile storage; access to your device, profile backups, and browser security affect its protection.

## Permissions

- **`storage`**: save your local settings and propagate changes to open YouTube tabs.
- **`https://www.youtube.com/*` site access**: run the card-filtering content scripts and early CSS on that host. The URL match is broad enough for YouTube navigation; protection remains limited to recognized discovery cards, not all content on every matching page.

No browsing-history, cookies, all-sites, or network-interception permission is requested. No background worker is required.

## Your controls and deletion

Use the popup to remove custom entries or change the enable/preset switches. Turning protection off restores managed page content but does **not** erase saved preferences. Remove the extension's local data through the browser, or uninstall it, to remove its stored settings; reload open YouTube pages to clear their existing injected presentation and transient state. Browser backups may retain older profile data under your backup policy.

## Changes and contact

A future change that adds transmission or materially changes data handling requires this policy and the corresponding store disclosures to be updated before release.

For support and privacy questions, use https://github.com/Sterlii/Spoilshade/issues. Issues are public: do not include private browsing data, sensitive keywords, credentials or account details.

Project homepage: https://github.com/Sterlii/Spoilshade

Public policy URL: https://github.com/Sterlii/Spoilshade/blob/main/docs/PRIVACY.md

Before store submission, the publisher must verify these URLs are publicly accessible, monitor support and complete any store-required identity/contact declarations accurately.
