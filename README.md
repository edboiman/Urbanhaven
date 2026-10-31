# Urban Haven 2.0 — Michigan preparedness, offline

An offline-first preparedness companion for Michigan households. It runs in the phone's browser, installs to the home screen, and keeps working with no signal.

**What it does**

* **Living 14-day checklist** — 62 built-in supplies and tasks across water, food, cooking, lighting, charging, communications, first aid, medication planning, sanitation, clothing, warmth, documents, cash, evacuation, household plans, pets and infants. Scales with household size, infants, pets, accessibility needs and duration. Owned quantities come from your inventory, so there is one number to maintain. Statuses: needed, partially stocked, ready, needs inspection, not applicable — each with the formula and reasons. Shopping list, print view, CSV, in-app maintenance reminders.
* **Water safety** — what boil / do-not-drink / do-not-use advisories mean, limits before treatment steps, CDC and EPA bleach tables, filters, Michigan private wells, winter storage, flooding, lead, washing and toilets without service.
* **Offline Michigan map** — both peninsulas and islands, 3,899 searchable towns, villages, townships and communities, roads, lakes, counties, your own markers, manual coordinates, optional GPS. Optional regional detail packs with verified, resumable downloads.
* **Pantry meals** — 13 no-cook / low-water recipes from ordinary groceries, “what can I make now” from your pantry, a 14-day plan with pantry gaps and recipe water, refrigerator/freezer outage and opened-package rules.
* **Grow food** — Michigan spring frost dates for 78 stations (median or cautious), regional and lake-effect differences, 19 sourced crop profiles, indoor limits during winter outages, seed inventory with germination tests, plantings, reminders and harvest log.
* Field guide (67 guides), emergency step-by-step checks, calculators, notebook, local PDF reader, portable JSON backups, light/dark themes, large text, emergency reading mode.

No accounts, tracking, cloud database, AI or remote API. Not encrypted. Not an emergency service and not professionally reviewed — see “Limits”.

## For a phone user

See **[docs/ANDROID_INSTALL.md](docs/ANDROID_INSTALL.md)** — plain-language steps to install, download map detail, test in airplane mode and back up.

## Build and run (developers)

Requires Node.js 20 or newer.

```sh
npm install          # first time; commit the generated package-lock.json
npm run check        # content checks + typecheck + 33 unit tests + production build
npm run preview      # http://localhost:4173/  (service worker works on localhost)
npm run dev          # rebuild on change, serve on http://localhost:5173/
```

Browser tests (Chromium via Playwright):

```sh
npx playwright install chromium
npm run test:e2e                         # all six browser suites
V1_DIST=/path/to/urban-haven-1.0.0/dist npm run test:e2e   # also runs the real v1.0.0 → 2.0 upgrade
```

| Command | Purpose |
|---|---|
| `npm run build` | esbuild bundle → `dist/` with SHA-256 offline manifest and service worker |
| `npm test` | Unit tests (Node test runner) |
| `npm run typecheck` | TypeScript strict check for app and tests |
| `npm run test:e2e` | Offline, upgrade, map, pack, backup and checklist tests in Chromium |
| `npm run map:data -- <natural-earth-vector> <us_geo>` | Rebuild map data (see `docs/MAP_DATA.md`) |

## Publish to GitHub Pages

1. Create a GitHub repository (e.g. `urban-haven`) and push this folder's contents, **including `.github/workflows/deploy.yml`**. Do not upload the ZIP itself, and do not commit `node_modules/` or `dist/`.
2. In the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Open **Actions**; the “Build, test and publish” workflow builds, runs checks and unit tests, audits runtime dependencies and deploys. A separate job runs the browser tests and reports its result.
4. Your app is at `https://YOUR-NAME.github.io/urban-haven/`. Follow `docs/ANDROID_INSTALL.md` on the phone.

The app uses relative paths and hash routes, so it works in a repository subfolder or at a domain root.

## Upgrading from 1.0.0

Existing data is kept. 2.0 opens the same browser database and only adds new storage areas. The previous edition keeps running until **Update & reload** is tapped. Old 1.0 backups can be imported. This was tested in Chromium by creating data with the original 1.0.0 build and upgrading (see `docs/TEST_RESULTS.md`).

## Limits

* Map: generalized 1:10,000,000-scale geometry; not street-level; no routing, closures or facility status. Markers are your notes, not verified places.
* Gardening: dates are planning points from historical climatology, not forecasts; no yield promises; indoor growing stops being reliable in a winter power outage.
* Checklist amounts marked “App assumption” are planning defaults, not official requirements. Medicines, pet food/water, cash, infant needs and medical equipment have no universal amounts — you enter them.
* Reminders appear only when the app is open; there are no notifications.
* Browser storage can be cleared by Android or by the user; keep backups off the phone. Imported PDFs and map packs are not in backups.
* Not tested on a physical Android phone yet. No clinical, food-safety, utility or emergency-management professional has reviewed the content. Follow local officials and your own clinicians.

## Documentation

`docs/FINDINGS.md` (audit) · `docs/REQUIREMENTS_MATRIX.md` · `docs/TEST_RESULTS.md` · `docs/SOURCES.md` · `docs/MAP_DATA.md` · `docs/ARCHITECTURE.md` · `docs/SECURITY_PRIVACY.md` · `docs/OFFLINE_TESTING.md` · `docs/ANDROID_INSTALL.md` · `THIRD_PARTY_NOTICES.md`
