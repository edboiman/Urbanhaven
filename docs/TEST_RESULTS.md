# Test results — Urban Haven 2.0.0 (2026-10-31)

## Environment

Linux container; Node.js 22.23.4; TypeScript 6.0.3; esbuild 0.28.2; Playwright 1.63.0 with its bundled Chromium; React 19.2.8; pdfjs-dist 6.2.108. The package registry (npm/PyPI) was **not reachable**, so the v1.0.0 toolchain (Vite, Workbox, Vitest, Dexie) could not be installed; 2.0 was rebuilt on tools that were available and could be verified. GitHub was reachable only via `git`.

## What was run

| Check | Result |
|---|---|
| `node scripts/check-content.mjs` | PASS — 67 guides, 10 categories, source metadata, related IDs; 19 crop profiles (required fields, sourced, tender crops never before last frost); 78 frost stations (dates ordered) |
| TypeScript strict (`tsc -p .` and `tsc -p tsconfig.tests.json`) | PASS, no errors |
| Unit tests (`npm test`, Node test runner) | **33 / 33 passed** in 4 files |
| Production build | PASS — edition `48ff449aeb8c`: 214 core files, 5.81 MB precached (map packs excluded); 224 files in `dist/` |
| Browser tests (`npm run test:e2e` with `V1_DIST` = original 1.0.0 `dist/`) | **6 / 6 suites passed** (log excerpt below) |

### Unit tests (33)

* **Checklist (11):** the acceptance test (1 → 2 people × 14 days: water 53.0 → 106.0 L, food 28,000 → 56,000 kcal, flashlights 1 → 2; shopping gaps 14 gal / 28,000 kcal / 1 light); consuming one jug turns *ready* into *partially stocked*; expired → *needs inspection* and not counted; damaged not counted; explicit links beat category matching; pet/infant items N/A without pets/infants and never get invented amounts; tasks done/overdue/N/A; custom items, removal, edited amounts; multi-unit packs; unique IDs and explanations; CSV formula neutralization; 6-month water-rotation reminder.
* **Core (8):** water/food/power/fuel arithmetic and invalid input; v1 backup accepted with v2 defaults; v2 backup with every new record type; 12 hostile/malformed backup variants rejected; markup kept as plain data; saved settings never overwritten by defaults; guide search incl. new well guide.
* **Map (7):** bundled overview matches catalog SHA-256 and covers both peninsulas + Isle Royale; search finds Marquette, Ironwood, Sault Ste. Marie, Copper Harbor, Mackinac Island, St. James (Beaver Island), Traverse City, Kalamazoo, Detroit, Bad Axe with correct counties, and “saint ignace”; every place inside Michigan's box; projection round-trip; coordinate parser (decimal, hemisphere letters, DMS, invalid); every pack part and whole pack hash-checks and decodes; non-map data rejected.
* **Garden & meals (7):** regional frost dates differ (Detroit city Apr 24, Vanderbilt Jun 20, Alpena city earlier than Alpena airport); crop date math (pea fall sowing, tomato indoor start); beans tender vs peas hardy; germination math; pantry matching excludes expired food; 14-day plan respects no-cook and vegan filters and reports gaps; every recipe states water and leftovers.

### Browser tests (Chromium, production build served under `/urban-haven/`)

```
PASS checklist acceptance     – UI: 14 gal for 1 person = ready; 2 people → 53.0 of 106.0 L, need 14 gal; shopping list 14 gal / 56,000 kcal;
                                use 1 jug → partially stocked, need 1.0 gal; “needs checking” → needs inspection; task done → ready; print view
PASS map offline acceptance   – 2 packs installed + 2 markers online; browser closed; reopened OFFLINE; Marquette (UP pack, no warning),
                                Ironwood, Paradise, Kalamazoo (SLP pack), Traverse City (NLP pack missing → warning shown), St. James;
                                markers open; pinch z9 → z11; zero external requests; zero failed requests
PASS map packs                – HTTP 503 mid-download → “partly downloaded — resume”; corrupted part rejected; resume fetched only the 2
                                missing of 3 parts; manual verify; delete leaves no stored parts
PASS offline core             – 214/214 files verified (5.81 MB); offline restart: 15 routes + bundled PDF rendered; damaged CSS detected
                                offline; offline repair fails with a clear message; simulated QuotaExceededError reported; pause; online repair
PASS upgrades                 – real v1.0.0 build: data + v1 backup created → 2.0 update offered while v1 kept running → after Update & reload:
                                supplies, note with markup (as text), 3-person household, water counted; IndexedDB native version 20;
                                Workbox caches removed. Update with a failing asset: no update offered, old edition still verified.
                                Good update A → B only after Update & reload; marker kept
PASS backups                  – v2 export excludes sensitive note, includes marker + checklist state; 3 hostile files rejected with no writes;
                                restore on a second profile; real v1.0.0 backup file imports
ALL BROWSER TESTS PASSED
```

Visual checks (screenshots reviewed): Today, Urgent, Checklist (collapsed/expanded), Supplies, Water (advisory answer), Map (statewide, Marquette, Mackinac, Kalamazoo, Beaver Island), Meals (make-now, plan), Garden (season plan, crop card), dark theme, emergency mode — at 1280 px and 390 px. No horizontal overflow on 10 main routes at 390 px; no console errors.

## What was NOT tested

* **Physical Android**: install prompt, home-screen launch, airplane mode + force-close + reboot on a device, Android storage eviction, native file pickers (backup/PDF), GPS fix, real touch performance on low-end phones, TalkBack. See `OFFLINE_TESTING.md` for the manual steps.
* **Real GitHub Pages deployment** (no repository was created). The local server mimics the `/repository/` path; GitHub Pages headers and caching were not exercised.
* **`npm audit`** — not runnable without registry access. Runtime dependencies were reduced to React, React DOM and PDF.js; CI runs the audit.
* **Lockfile** — none could be generated; see `FINDINGS.md` R1.
* Screen-reader and contrast audit by an accessibility specialist; content review by clinicians, food-safety or water-utility professionals.
* Firefox and Safari/iOS.
