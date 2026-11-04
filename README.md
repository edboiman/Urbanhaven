# Urban Haven 2.2 — Michigan preparedness, offline

A browser app / installable PWA for Michigan households. Complete Offline setup, verify files and test an airplane-mode cold start before relying on it without a connection. This is not an Android APK or an emergency service.

**Updating your existing Urbanhaven repository? Start with [UPDATE_FROM_2.0.0.md](UPDATE_FROM_2.0.0.md).** The helper copies source while preserving Git history; it does not commit, push or deploy.

## Phone UX and food update

Version 2.2 adds direct ready checkboxes, compact pantry groups, a unified 47-recipe library including the uploaded 24-recipe pack, seven cooking-basics references, daily nutrition planning and 21 Harvard oxalate references with portions/preparation. See [V2.2_UX_AND_FOOD.md](docs/V2.2_UX_AND_FOOD.md) and [NUTRITION_OXALATE_SOURCES.md](docs/NUTRITION_OXALATE_SOURCES.md).

Checking a checklist item is a household confirmation; it does not create inventory. Actual quantities, dates and shopping gaps remain separate. The new optional confirmation fields are included in backups.

## Accuracy and storage update (2.1.1)

The 2.1.1 source audit corrects water classification and rotation, flood-exposed containers, infant feeding, seed viability and fall planting, recipe handling and quantities, medical escalation and pet-food handling. **Storage & shelf lives** separates food quality, water rotation, seed viability and medicine expiry. See [SOURCE_AUDIT.md](docs/SOURCE_AUDIT.md), [SHELF_LIFE_REFERENCE.md](docs/SHELF_LIFE_REFERENCE.md) and [TEST_RESULTS.md](docs/TEST_RESULTS.md) for sources, conditions and verification limits.

## What changed

- **Offline waypoint paths:** named paths, ordered stops, visited checks, reordering, reversal, notes, straight-line distances / true bearings and GPX export. Farm markers and optional local photos; six sourced river reference points. No road routing, current access or facility status.
- **Focused growing guide:** space → goal → crop dropdowns for suburban beds, urban containers, supported indoor growing and indoor outages. Seed packet groups, storage life examples, varieties and nutrition purpose. The 78-station frost calendar, 19 detailed crop profiles, seed inventory, germination tests and planting / harvest logs remain available.
- **Pantry priorities:** nine core groups before six extras, with quality shelf lives, opened-package safety, storage and water / fuel needs. Existing 13 no-cook / low-water recipes, inventory matching and 14-day planner are retained.
- **Outdoor cooking:** ten original one-pot pantry recipes, eight vegetarian, with equipment, water, heat, steps and leftovers. Camp stoves and permitted fires are for outdoors only.
- **Expanded health:** ten new concern-based guides for disrupted access to care, with urgent signs, practical initial steps and limits. The field guide now has 78 guides.
- **Radio:** 28 Michigan NOAA weather transmitters and 20 selected AM/FM stations, searchable by area / frequency, with saved presets and a personal last-heard log. Check receiver bands; no reception or station uptime is guaranteed.
- **Pets:** a 12-item checkable kit, eight care / evacuation topics and multiple offline pet records. Food and water totals use your entered individual daily amounts. Store veterinary instructions, contacts, identification and transport plans.

The living 14-day checklist, inventory, water safety, emergency checks, notebook, local PDF reader, backups, dark theme, large text and emergency reading mode remain.

No accounts, tracking, cloud database or remote API is required for core features. Records are local and not encrypted. Photos, paths, radio logs and pet plans are included in backups; PDFs and downloaded map packs must be transferred separately. See [docs/V2.1_CHANGES.md](docs/V2.1_CHANGES.md) for detailed limits.

## Develop and verify

Requires Node.js 20 or newer. Dependency versions are locked in package-lock.json.

```bash
npm ci
npm run check       # content validation, strict TypeScript, 60 tests, production build
npm run preview     # localhost supports service workers
npm run dev
```

Browser suites for a normal local or CI environment:

```bash
npx playwright install chromium
npm run test:e2e
```

The seven browser suites cover checklist, map, resumable packs, offline core, upgrades, backups and new 2.1 interactions. They were authored / updated but not executed in this preparation session. See [docs/TEST_RESULTS.md](docs/TEST_RESULTS.md) for exactly what was verified. `V1_DIST=/path/to/original/dist npm run test:e2e` enables the optional real-v1 upgrade fixture.

## GitHub Pages

Push the source folder contents, including the workflow, lockfile, public map data and documents. Do not commit node_modules or dist. In GitHub Settings → Pages, choose GitHub Actions as the source. The workflow checks, builds, audits runtime dependencies and deploys. Browser tests are separate and non-blocking; check their result before relying on a release. Their job has a 20-minute ceiling.

Relative assets and hash routes support a repository subfolder or domain root. Keep your current repository name and app address to preserve the existing installation. This package has not been pushed or published.

## Sources and limits

Health and veterinary content is educational and has not had independent professional review. Recipes have not been kitchen tested in this session. Map shapes are generalized, paths are manual and radio listings are references, not live status.

Source notes: `docs/MEDICAL_PET_SOURCES_V21.md`, `docs/PANTRY_COOKING_SOURCES.md`, `docs/RADIO_SOURCES.md`, `docs/RIVER_REFERENCES.md`, `docs/GARDEN_V21_SOURCES.md` and the existing topic source files. Source links need a connection; the actual guidance is bundled.
