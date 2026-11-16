# Publication checklist — Spoilshade 1.0.0

Requirements researched **2026-11-16** from the official sources below. Recheck them at submission time. This is preparation, **not** a store submission, signing result, or certification of browser compatibility. No account was registered, fee paid, package uploaded, or listing published for this research.

## Publisher decisions still required

- [ ] Choose the actual publisher/account owner, display name, and monitored support/privacy contact. “Spoilshade contributors” is the MIT copyright attribution, not an invented company.
- [ ] Verify anonymous access to the homepage https://github.com/Sterlii/Spoilshade, support https://github.com/Sterlii/Spoilshade/issues and privacy policy https://github.com/Sterlii/Spoilshade/blob/main/docs/PRIVACY.md; monitor support before submission.
- [ ] Approve the final name after the limited conflict search below. This is not trademark clearance.
- [x] Permanent Firefox add-on ID selected for first submission: `spoilshade@sterlii.github.io`. Keep it unchanged for future updates. This is an identifier, not a support email or a claim that a website is hosted there. Firefox MV3 submissions need an explicit unique ID; AMO checks uniqueness.[19]
- [ ] Choose AMO-listed versus signed self-distribution, and Chrome distribution countries/visibility. Authorize submission separately.
- [ ] Complete store account verification, agreements, and any jurisdiction-specific trader/contact declarations honestly; do not infer a legal status from the project name.

## Local release gates

Checked items summarize earlier release preparation, not a substitute for current execution. Use [TEST-RESULTS.json](TEST-RESULTS.json) for fresh outcomes and runtime binding; publication-only packaging changes require their own verification.

- [x] Complete a clean lockfile install, Node tests, build, and Firefox lint. Preserve the actual output and artifact hashes.
- [x] Inspect both generated manifests and ZIPs: `manifest.json` at archive root; version `1.0.0`; only `storage` and `https://www.youtube.com/*` host access; content-script match `https://www.youtube.com/*`; `document_start` CSS; no background worker, remote code, or production dependencies.
- [x] Validate that `dist/firefox/`, `dist/chrome/`, and browser ZIPs under `release/` correspond to the same source. Exclude secrets, profiles, `node_modules`, test recordings, and unrelated development files from install ZIPs.
- [x] Record **separate** results for Node/DOM tests, real Firefox/Chromium extension loading against controlled fixtures, and actual `www.youtube.com` behavior. A fixture pass is not a live YouTube pass.
- [ ] Complete [manual checks](MANUAL-TESTS.md), including light/dark, independent reveals, loaded-card keyword updates, navigation, accessibility, first-paint exposure, and performance profiling. Record blockers rather than filling unchecked boxes optimistically.
- [x] Review the final code against [Privacy](PRIVACY.md) and the store disclosures. Confirm no keyword/title/identifier leaves the extension, and no sensitive titles leak via injected accessible labels.
- [ ] Prepare genuine, safe-to-publish screenshots. Keep controlled fixture captures visibly labeled and separate from live-site captures; never describe them as live YouTube verification.
- [x] Reconcile [store text](STORE-LISTING.md) with measured behavior and known limitations; do not promise complete spoiler prevention or zero flash.

Build prerequisites: Node.js 24, npm, and Python 3 with its standard-library `zipfile` module. `npm run build` writes `dist/firefox/`, `dist/chrome/`, `release/spoilshade-1.0.0-firefox.zip`, and `release/spoilshade-1.0.0-chrome.zip`. Commands declared by this project, to run from the repository root:

```sh
npm ci --include=dev
npm test
npm run build
npm run lint:firefox
npm run test:browser
```

These commands are not a record that they passed. Browser execution may require installed browser binaries and a suitable test environment; use [TESTING.md](TESTING.md) for prerequisites and [TEST-RESULTS.json](TEST-RESULTS.json) for current results and runtime binding.

## Firefox / AMO (primary)

### Manifest and privacy

The separate Firefox manifest must keep:

```json
"browser_specific_settings": {
  "gecko": {
    "id": "spoilshade@sterlii.github.io",
    "strict_min_version": "142.0",
    "data_collection_permissions": {
      "required": ["none"]
    }
  }
}
```

The ID above is finalized for this first submission; do not change it for later versions. `142.0` is this project's conservative **desktop minimum**, not Mozilla's minimum for the consent feature: Mozilla documents built-in consent from desktop Firefox 140 and Android 142. New extensions have had to adopt the built-in system since **November 3, 2025**, including an explicit `required: ["none"]` when they do not collect/transmit data.[1]

Mozilla's policy defines transmission as handling outside the add-on or local browser. Spoilshade's local title matching and `storage.local` settings are consistent with the proposed `none` declaration only while nothing is transmitted. Do not reuse that declaration if telemetry or a remote service is added.[1][17]

Desktop scope only: do not claim Firefox for Android/mobile YouTube support. The minimum version is a manifest constraint, not proof that this exact browser version was tested.

### Submission, signing, and updates

1. Use the publisher's Mozilla account and AMO developer profile; set the AMO display name explicitly (it does not sync from the Mozilla account).[15]
2. Read the active Add-on Policies and Distribution Agreement. Select **On this site** for a listed extension, or **On your own** for unlisted self-distribution; upload the Firefox archive and resolve validation findings.[2]
3. Complete name/unique slug, summary, description, desktop platforms, categories, support, **MIT**, privacy text, and reviewer notes. AMO's current upload documentation states a **200 MB** package limit.[2]
4. Resolve source-submission requirements below, then submit only with owner approval. Review/signing is not guaranteed merely by a local lint pass.[2][9]
5. Normal release/beta installation requires Mozilla signing, including self-distributed extensions. Retain the signed XPI from AMO; do not rename an unsigned ZIP and advertise it as signed.[9]
6. For listed updates, increase the version and upload through the existing add-on's version page, keeping the same add-on ID. AMO-listed updates are delivered by Firefox. For unlisted automatic updates, configure and operate the separate update-manifest/update-URL mechanism before promising automatic updates.[2][9]

**Date boundary:** the active policy page advertises replacement policies for **December 1, 2026**. Those are previews on this research date, not current rules. Re-read the active policy and agreement if submission happens on/after that date.[17]

### Reviewable source package

Plain readable JavaScript is shipped directly; do not claim that every JavaScript extension must upload a second source archive. Mozilla specifically requires matching sources and reproducible instructions for minified, bundled, templated, or otherwise preprocessed/generated code; its source guide includes custom preprocessing tools.[3]

Because this build generates manifests and may generate assets, prepare a matching source archive for review rather than assuming that “no bundler” exempts every generated file. Include original sources/assets, manifests or their generator, scripts, `package.json`, `package-lock.json`, LICENSE, and build instructions. The source ZIP excludes credentials, browser profiles, `node_modules`, raw logs and browser receipts, personal screenshots, symlinks and unrelated artifacts; these exclusions supplement `.gitignore`. Keep the public test summary rather than private raw captures. Supply the sources with **each** version that needs them; do not substitute a link to a moving repository branch.[3]

Reproduce with Node.js 24, Python 3 and npm using the committed lockfile. [TEST-RESULTS.json](TEST-RESULTS.json) records exact tool versions, fresh execution results and current runtime binding. Reviewer instructions must provide the installation steps, commands, generated output locations and any relevant environment differences; supply any additional platform details required for review without publishing personal machine identifiers. Mozilla requires rebuildable output matching the submitted extension and a package-manager lockfile.[3]

### AMO artwork

Mozilla recommends **1280×800** screenshots (or the **1.6:1** ratio for other sizes), each demonstrating a key feature. This is listing guidance, not a mandatory exact pixel-size rule. Its listing guide describes **32×32 and 64×64** PNG/JPEG icon uploads; check the current submission UI as well as the manifest's packaged icons.[10]

## Chrome Web Store

### Account, fees, and review

- A CWS developer registration and **one-time registration fee** are required. The official text retrieved does not state the current amount; the owner must verify the actual amount/currency in the dashboard before approving payment. Do not rely on third-party “$5” articles as a verified current charge. No payment is authorized by this checklist.[6]
- Set a publisher name and verify the contact email. The setup guide requires a physical address for items offering purchases/features/subscriptions; follow any additional verification or local-law prompts that apply to the actual publisher.[12]
- Enable **2-Step Verification** before publishing or updating.[16]
- Upload the **Chrome ZIP**, complete Store Listing, Privacy, Distribution, and reviewer test instructions; submit for review only with approval. Use deferred publishing if the owner wants approval without immediate public release. Review acceptance/timing is not guaranteed.[4]
- Publish updates under the existing store item with an increased version, not a duplicate listing.[4]

### Single purpose and disclosure worksheet

The dashboard requires a narrow single purpose, permission explanations, remote-code declaration, data-use disclosures/certifications, and privacy-policy link.[7]

Suggested single purpose: **Locally conceal recognized desktop YouTube video-card titles and thumbnails when their titles match the user's spoiler keywords.**

Permission explanations:

- **`storage`:** persist the enabled/preset switches and custom keywords locally and notify open YouTube tabs when settings change.
- **`https://www.youtube.com/*`:** read recognized video-card titles/links and conceal or restore matching title/thumbnail elements on desktop YouTube; no other sites are needed.
- **Remote code:** **No**; JavaScript, styles, and extension assets are packaged locally. Reconfirm against the final ZIP before checking the box.

**Do not translate Firefox's `none` into “does not handle user data” on Chrome.** Google's current FAQ explicitly says **local-only processing/storage still requires disclosure**, and local-only user-information handling still requires a posted privacy policy. It includes website content and browsed/interacted-with URLs among user data.[8]

Before submission, reconcile the current dashboard's definitions against the final code: disclose local **website content** (card titles/links), current video URL/identifier handling under the applicable **web history/browsing activity** definition, and local keyword/reveal interactions under any applicable input/activity category. State that these are used only for filtering, are not transmitted, and do not form a persisted browsing-history log. Do not falsely assert that a content script never accesses website content simply because the publisher receives none. The publisher must resolve any ambiguous category with the current dashboard/reviewer, rather than selecting “no data” by default.[7][8]

Keep the policy, listing, dashboard, and UI consistent. Google's disclosure policy requires transparency and affirmative informed consent; its FAQ also discusses prominent in-product disclosure. Verify the packaged UI adequately explains local title access/settings use before declaring compliance; if it does not, treat that as a release blocker, not something a README alone fixes.[8][18]

### Chrome artwork

Use a **128×128 PNG** store icon and **1–5 screenshots at 1280×800**. The dashboard guide calls for 1280×800; the separate image guide also permits 640×400, so use 1280×800 to satisfy both. Screenshots should show the actual experience, with square corners and no added padding.[5][11]

A **440×280** small promotional tile, **1400×560** marquee tile, and promotional YouTube video are optional in the current dashboard documentation—not universal prerequisites. Keep promotional art separate from screenshots. The icon image guide recommends padding/visual-weight rules; check the final icon against it.[5][11]

## Name-conflict check (limited; 2026-11-16)

| Surface | Observed result |
| --- | --- |
| General web search | Exact `"Spoilshade"` and broader `Spoilshade extension YouTube spoiler` searches returned no results in the configured search backend. |
| AMO | Indexed `site:addons.mozilla.org "Spoilshade"` search returned no results. The HTML search hit a client challenge; AMO's public search API returned `count: 0`, `results: []` for `q=Spoilshade&type=extension`.[13][20] |
| Chrome Web Store | Indexed `site:chromewebstore.google.com "Spoilshade"` search returned no results. After rejecting optional Google cookies, the live store search displayed **“No search results.”**[14] |

No conflicting listing was found in these searches. That does **not** reserve a store slug/ID, establish trademark rights, cover unlisted/unindexed products, or clear similar-sounding names. No trademark registry or legal clearance search was performed. Repeat before submission; obtain legal advice if needed. Keep YouTube/GTA references descriptive and avoid implying endorsement.

## Sources

[1] https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent
[2] https://extensionworkshop.com/documentation/publish/submitting-an-add-on
[3] https://extensionworkshop.com/documentation/publish/source-code-submission
[4] https://developer.chrome.com/docs/webstore/publish
[5] https://developer.chrome.com/docs/webstore/images
[6] https://developer.chrome.com/docs/webstore/register
[7] https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
[8] https://developer.chrome.com/docs/webstore/program-policies/user-data-faq
[9] https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview
[10] https://extensionworkshop.com/documentation/develop/create-an-appealing-listing
[11] https://developer.chrome.com/docs/webstore/cws-dashboard-listing
[12] https://developer.chrome.com/docs/webstore/set-up-account
[13] https://addons.mozilla.org/en-US/firefox/search/?q=Spoilshade
[14] https://chromewebstore.google.com/search/Spoilshade
[15] https://extensionworkshop.com/documentation/publish/developer-accounts
[16] https://developer.chrome.com/docs/webstore/program-policies/two-step-verification
[17] https://extensionworkshop.com/documentation/publish/add-on-policies
[18] https://developer.chrome.com/docs/webstore/program-policies/disclosure-requirements
[19] https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id
[20] https://addons.mozilla.org/api/v5/addons/search/?q=Spoilshade&type=extension
