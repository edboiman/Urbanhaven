# Edition 2.2 additions

ChecklistState accepts optional prepared (boolean) and preparedOn (date). computeRow preserves computed inventory quantities but uses an explicit confirmation for ready/not-ready status. Shopping gaps and water/calorie quantities remain based on supplies. Old records without a confirmation retain automatic readiness. Backup validation preserves true and false and rejects other types. No new database store/version or backup schema is needed.

The local recipe catalog normalizes the existing two collections plus 24 imported recipes without replacing saved-plan IDs. CookingDetails is shared by old deep links and the new browser. Nutrition/oxalate data are bundled, not requested from an API. Recipe step/gathering checks are temporary and reset on leaving the detail screen.

# Edition 2.1.1 audit additions

`src/storage/dates.ts` separates quality, expiry and review dates and calculates six-calendar-month rotation only for explicitly self-filled water. Optional `dateKind` and `waterType` fields preserve existing records and backup compatibility. `src/pages/StorageDates.tsx` bundles food, water, seed, medicine and pet-food references. Fall transplant plans now distinguish seed starting from the outdoor target. See SOURCE_AUDIT.md and TEST_RESULTS.md.

# Edition 2.1 additions

Waypoint paths, radio reception logs and pet profiles reuse the existing plans store. Marker photo and caption fields are optional. Database name and native version 20 are unchanged; schema-1/2 backups remain accepted with new record validation. All new directories and guidance are bundled into the app; source links are optional online references. See V2.1_CHANGES.md and TEST_RESULTS.md for scope and verification.

# Architecture (2.0)

## Runtime

Everything runs on the device. React 19 renders the UI (hash routes, so GitHub Pages needs no server rewrites). Styles are plain CSS with theme tokens (`src/styles/app.css`, `v2.css`, `map.css`). Icons are inline SVG generated from Lucide geometry. Text uses system fonts. Runtime dependencies: React, React DOM, PDF.js.

| Area | Code |
|---|---|
| App shell, routing, update bar | `src/App.tsx`, `src/components/route.ts` |
| Checklist model (templates, scaling, statuses, shopping, reminders, CSV) | `src/checklist/model.ts`, `sources.ts`; UI `src/pages/Checklist.tsx` |
| Inventory + usage log | `src/pages/Supplies.tsx` |
| Water | `src/pages/Water.tsx`, guides in `src/content/health.json` |
| Map: data decode/search/coordinates, packs, renderer, page | `src/map/data.ts`, `packs.ts`, `render.ts`, `src/pages/MapPage.tsx` |
| Meals | `src/meals/recipes.ts`, `planner.ts`, `src/pages/Meals.tsx` |
| Garden | `src/content/crops.json`, `frost-stations.json`, `src/garden/plan.ts`, `src/pages/Garden.tsx` |
| Guides, search, scenarios, calculators, Today, Urgent | `src/pages/Core.tsx`, `src/search`, `src/calculators` |
| Notebook, documents/PDF reader, offline setup, settings | `src/pages/Personal.tsx` |

## Single source of truth for quantities

Owned quantities exist only in inventory records (`supplies`). A checklist row counts records explicitly linked to it (`checklistId`) or, for drinking water and food energy, records of that category with no explicit link. Only records that are **Ready** and **not past their date** count; damaged, unchecked and past-date records are listed and flagged. Past quality dates require review rather than proving a food unsafe. Household numbers (people, infants, pets, pet water per day, days, kcal per person, needs) live in settings and are read by the checklist, Water page, calculators and meal planner. Checklist state stores only choices: custom amounts, N/A, inspection flags, notes, task dates, custom items.

## Personal database

`src/storage/idb.ts` is a small IndexedDB wrapper (no Dexie). It opens the **same database** v1.0.0 used (`urban-haven-personal`). Dexie stored v1's `version(1)` as native version 10; 2.0 opens native version **20** and only *adds* stores and indexes:

* v1 stores (unchanged): `supplies`, `notes`, `garden`, `documents`, `settings`, `favorites`, `recents`
* v2 stores: `checklist`, `consumption`, `markers`, `mapPacks`, `seeds`, `harvests`, `plans`

New fields on existing records are optional, so v1 records stay valid. Rules for future versions: bump `DB_VERSION`, only add stores/indexes, never delete or recreate the database. Writes notify live queries in the same tab and other tabs (BroadcastChannel). Atomic multi-store writes (restore, usage logging, delete-all) use one IndexedDB transaction.

Backups: JSON schema 2 (`src/storage/backup.ts`). Import accepts schema 1 and 2, reconstructs only known fields with type, range, length and enum checks, rejects duplicate IDs, and writes everything in one transaction. PDFs and map packs are excluded and the file says so.

## Offline build and service worker

1. `scripts/build.mjs` cleans `dist/`, copies `public/` and PDF.js assets, bundles with esbuild (code-split PDF.js), writes `index.html`.
2. It hashes every deployed file (SHA-256 + size), excluding optional map packs, into `offline-manifest.json`, and generates `sw.js` from `src/sw/sw.template.js` with the list embedded.
3. The service worker installs into a new cache `urban-haven-core-<edition>-<scope>`, verifying each file's hash and size; any failure aborts the install and the previous edition keeps running. Interrupted installs reuse already-verified entries.
4. A waiting edition activates only after **Update & reload** (`SKIP_WAITING`). Activation deletes older core caches and v1's Workbox caches for the same scope; it never touches map caches or IndexedDB.
5. The Offline page reads every cached file and checks its hash before showing “verified”. Repair downloads with `?__network=` (bypassing the service worker), re-checks, then stores.

## Map

See `MAP_DATA.md`. Overview data are precached with the core; regional packs are separate, chunked, hash-checked downloads in `urban-haven-maps-v1-<scope>` with metadata in IndexedDB. The canvas renderer draws land, water, parks, rivers, county/state lines and roads by class, then places labels with collision avoidance, user markers and the optional location dot.

## Tests

* `npm test` — Node's test runner on esbuild-bundled TypeScript (`tests/*.test.ts`): checklist acceptance, calculators, backup validation (v1 and v2), search, map data/hash/coordinates, garden dates, meal planner.
* `npm run test:e2e` — Playwright + Chromium against the production build (`e2e/*.e2e.mjs`): checklist acceptance via UI, map offline acceptance, map pack interruption/corruption/resume/delete, offline cold start + damaged cache + quota + pause + repair, v1→v2 upgrade (when `V1_DIST` is given) + failed update + A→B update, backup round trip.
