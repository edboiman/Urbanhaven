# Audit findings — Urban Haven 1.0.0 → 2.0.0

Reviewed 2026-10-31 by reading the source, running the original v1.0.0 build in Chromium (with its service worker on localhost), and testing the upgrade path. Ranked by severity for a household relying on the app. “Fixed” items are covered by the tests listed in `TEST_RESULTS.md`.

| # | Severity | Finding (v1.0.0) | Status in 2.0.0 |
|---|---|---|---|
| 1 | High | **No real preparedness checklist.** Readiness was 8 checkpoints: water and calories from inventory, six self-reported checkboxes. No item-level quantities, no tasks, no 14-day target, no shopping list, no print, no explanation of what “ready” means beyond a criterion line. | Fixed: living checklist with 62 built-in items (quantities + tasks), household scaling, five statuses, explanations, shopping list, print, CSV, backup. v1 checkmarks are carried over once as task completions. |
| 2 | High | **No offline map.** The evacuation workflow told users an offline map “can help orient you”, but none existed. | Fixed: bundled statewide map, local search of 3,899 places, markers, manual location, optional verified regional packs. |
| 3 | High | **Dates used UTC.** `new Date().toISOString().slice(0,10)` gives tomorrow's date after 8 pm in Michigan (EDT). Supplies expiring “today” were treated as expired in the evening, and reminders shifted by a day. | Fixed: local calendar date (`todayISO`) for all status and reminder logic. |
| 4 | High | **Build not reproducible offline / heavy toolchain.** Vite + Workbox + Vitest pulled ~9 build-tool advisories (deepmerge, glob, minimatch, EJS/Jake chains), and the project could not be built without registry access. | Fixed by removing Vite, Workbox, Vitest, Dexie, dexie-react-hooks, lucide-react and fake-indexeddb. Runtime deps: React, React DOM, PDF.js. Build: esbuild + TypeScript. See residual risk R1. |
| 5 | Medium | Water guidance incomplete: no EPA 8.25% bleach row or chlorine-odor check, no lead warning (boiling does not remove lead), no private-well guidance (EGLE/CDC), filter guide without pore sizes, no Michigan winter storage note, CDC vs EPA altitude difference unexplained. Amounts that were present matched CDC. | Fixed: Water page with advisory decision tool, limits shown before treatment, CDC/EPA tables only, Michigan wells/winter/flood/lead sections; guides updated; new private-well guide. |
| 6 | Medium | Garden: one statewide frame, 10 crops, potatoes planned 6 weeks before last frost (UMN: plant when soil warms; foliage is frost-sensitive), no station data, no seed inventory or germination tests, no harvest log beyond a single number. | Fixed: 78-station Michigan frost table (50%/25%), lake-effect and regional explanations, 19 sourced crop profiles, seed lots with germination tests, plantings with reminders and harvest log. Potato offset is now 3 weeks before. |
| 7 | Medium | Food: guides only; no meal planning, no pantry matching, no opened-vs-unopened guidance in one place. | Fixed: 13 no-cook/low-water recipes, pantry tags, “make now”, 14-day planner with gaps and recipe water, food-safety tab. |
| 8 | Medium | Urgent help sat below a large hero image on phones (one scroll down). | Fixed: urgent strip first on Today, red “Urgent” button in the top bar on every screen, dedicated Urgent page. |
| 9 | Medium | Upgrade safety untested in a browser (v1 notes said so). | Fixed and tested: v1 → v2 upgrade with real v1 data; failed update keeps the old edition; update A → B only on “Update & reload”. |
| 10 | Medium | Inventory and checklist could disagree (no link between records and requirements; pets' water only in one calculator). | Fixed: one source of truth — quantities only in inventory; pet water and daily calories in household settings, read by checklist, calculator and Water page. |
| 11 | Low | Status badges used 9 px text; several touch targets < 44 px. | Fixed for new UI (badges 12 px, controls ≥ 44 px). Older pages kept their styles. |
| 12 | Low | The shipped `dist/` contained stale, unreferenced bundles from earlier builds (6 app bundles). | Fixed: build cleans `dist/` first. |
| 13 | Low | Re-selecting the same backup file did nothing (file input not reset). | Fixed. |
| 14 | Low | No consumption history; deleting an item was the only way to record use. | Fixed: “Use” action with reasons (used, damaged, expired, discarded) and a usage log. |

## Residual risks and limits (not fixed)

* **R1 — Lockfile.** The package registry was unreachable while building this release, so no new `package-lock.json` could be generated. Versions are pinned in `package.json`; CI resolves them with `npm install` until a lockfile is committed. Run `npm install` once online and commit the lockfile. `npm audit` could not be run here (see `TEST_RESULTS.md`).
* **R2 — Map detail.** Natural Earth 1:10m geometry: not street-level, positions off by up to ~1 km. Higher-detail sources were unreachable (see `MAP_DATA.md`).
* **R3 — MSU pages.** MSU Extension crop pages blocked automated retrieval; crop practices use UMN, UW, CSU, Illinois and Clemson extension pages plus retrievable MSU documents.
* **R4 — Ready.gov Pets** page could not be retrieved; pet items should be re-verified.
* **R5 — Physical Android** install, reboot, low-storage eviction, native file pickers, GPS and real touch ergonomics were not tested on a device.
* **R6 — Professional review.** No clinical, food-safety, water-utility or emergency-management professional reviewed the content.
* **R7 — Not encrypted.** IndexedDB records and JSON backups are plain text on the device.
