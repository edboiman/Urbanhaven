# Offline acceptance checklist

## Automated (Chromium)

`npm run test:e2e` (add `V1_DIST=<v1 dist>` to include the real 1.0.0 upgrade). Each suite uses a fresh browser profile and a local server with the `/urban-haven/` path GitHub Pages uses.

| Suite | Covers |
|---|---|
| `e2e/offline-core.e2e.mjs` | Install + per-file SHA-256 verification; browser closed and reopened **offline**; 15 routes + bundled PDF render; damaged cached file detected offline; repair while offline fails cleanly; simulated `QuotaExceededError`; pause; online repair and re-verify |
| `e2e/upgrade.e2e.mjs` | v1.0.0 data → 2.0 (records, markup, settings, DB version, Workbox caches removed); update with a failing file keeps the old edition; update A → B only on “Update & reload”; data kept |
| `e2e/map-offline.e2e.mjs` | Map acceptance test: packs installed, markers saved, offline restart, searches in both peninsulas and Beaver Island, missing-pack warning, markers open, pinch zoom, **no external or failed requests** |
| `e2e/packs.e2e.mjs` | HTTP 503 mid-download, corrupted part rejected, resume fetches only missing parts, verify, delete |
| `e2e/backup.e2e.mjs` | Export → import on a second profile; v1 backup import; malformed/negative/out-of-range files rejected with no writes; markup inert |
| `e2e/checklist.e2e.mjs` | Checklist acceptance test through the UI |

Chromium's offline mode and service worker on `localhost` are a close stand-in but not identical to an installed Android PWA.

## Manual — required on the target Android phone

1. Publish over HTTPS; open in Chrome; Offline setup → **Download & verify** → all files checked. Request persistent storage.
2. Install to the home screen. Open from the icon.
3. Map: download your region's pack(s); add two markers.
4. Supplies: add water and food; Checklist: confirm counts; Notebook: add a sensitive note; Documents: import a trusted PDF and open it.
5. **Airplane mode → force-close → reopen from icon.** Check Today, Checklist, Water, Map (search, markers, pinch), Meals, Garden, a guide, the PDF.
6. **Reboot with airplane mode on**; repeat step 5.
7. Export a backup; restore it on a second phone or a fresh Chrome profile; confirm counts; download map packs again there.
8. When a new edition is published: confirm the update bar appears online, the old edition works offline until you tap Update & reload, and records survive.
9. Low storage: with the phone nearly full, check whether Android evicts the site; record what happens.
10. Accessibility: TalkBack pass over Urgent, Checklist and Water; large system font size; dark theme.

Record device model, Android version, Chrome version and results. Do not mark Android compatibility as verified without these.
