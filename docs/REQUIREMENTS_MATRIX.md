# Requirement matrix — Urban Haven 2.0.0

Status: **Done** (implemented and verified as stated), **Partial** (implemented with a stated gap), **Blocked** (could not be done in this environment). Evidence key: **U** = unit test (`npm test`), **B** = browser test in Chromium (`npm run test:e2e`), **S** = screenshot/visual check, **C** = code review only, **A** = needs a physical Android device (not done).

## 1. Living 14-day checklist

| Requirement | Status | Evidence |
|---|---|---|
| FEMA/Ready.gov-based, extended to 14 days; official vs app assumptions distinguished; no “certified kit” claim | Done | Item labels (Official / App assumption / Your amount), summary text, `docs/SOURCES.md`; S |
| Check off, uncheck, add, edit, remove items | Done | Tasks toggle; custom items; edit amount/name/notes; remove + restore; U (custom/hidden/rates), B (task toggle) |
| Persist offline across closures and updates | Done | IndexedDB `checklist` store; B (upgrade A→B keeps data; offline restart) |
| Adjust for household size, pets, accessibility needs, duration | Done | Household tab: people, infants, pets, pet water, days (3/7/14/30/custom), 10 needs flags; U, B |
| Required qty, owned, gap, unit, storage location, expiry/rotation, notes | Done | Row detail + linked inventory; location/expiry come from inventory records; U, S |
| Statuses: needed, partially stocked, ready, needs inspection, not applicable | Done | U (all five) |
| Explain requirements behind completion; no arbitrary percentages | Done | Per-row formula text, reasons list, “X of Y applicable items ready” with definition; U, B |
| Connected to inventory without duplicate quantities | Done | Owned is always computed from supplies (explicit link or category); U |
| Recalculate on consume / expire / damage / household change | Done | U (acceptance), B (acceptance through UI) |
| Shopping list, printable checklist, export/import, backup | Done | Shopping tab, print view, CSV (formula-safe), backup schema 2; U, B |
| Quantities separate from tasks | Done | `kind: quantity | task`, filter; S |
| In-app maintenance reminders only | Done | Reminders panel (tasks, expiries, 6-month water rotation); explicit “no background notifications”; U |
| Coverage of all listed areas (water … pets) | Done | 17 sections incl. infants; C |
| No invented universal amounts for medicines, pet water, fuel, medical equipment | Done | Those are tasks or “Your amount” (rate null); U |
| **Acceptance test** (1 → 2 people for 14 days; consume a supply) | Done | U `checklist.test.ts`; B `e2e/checklist.e2e.mjs` |

## 2. Water

| Requirement | Status | Evidence |
|---|---|---|
| Storage amounts, containers, handling, labeling, rotation | Done | Water page + updated guides; CDC 2025 |
| Separate allowances: drinking/basic, hygiene, pets | Done | Three checklist items, shared with calculator and Water page; U |
| Boil vs do-not-drink vs do-not-use | Done | Advisory tool with limits first; S |
| Boiling, chemical disinfection, filtration and limits | Done | Water page; guides; S |
| Exact doses only when verified for stated concentration | Done | CDC (5–9%) and EPA (6%, 8.25%) tables verbatim; no computed doses; C |
| What membrane filters do/don't remove | Done | CDC pore sizes; S |
| Chemically contaminated water warnings | Done | Critical-limits box before treatment; lead added |
| Michigan: wells, flooding, winter storage, utility interruptions | Done | Water page section + new private-well guide |
| Bathing, hand-washing, toilets without service | Done | Water page + linked sanitation guides |
| Concise, offline, limitations before steps | Done | B (offline route render), S |
| Consistent calculator/inventory/checklist/guide assumptions | Done | Single source (checklist rows/settings); U |
| Coverage not presented as guaranteed survival time | Done | Wording on Water, Calculators, Today |

## 3. Offline Michigan map

| Requirement | Status | Evidence |
|---|---|---|
| Locally stored map, both peninsulas + islands, town-level zoom | Done (generalized) | Natural Earth 1:10m + Census/GNIS; zoom 5–12; U (bbox, islands' towns), B, S |
| Pan, pinch, zoom buttons, readable labels, context | Done | B (pinch via touch events, buttons), S |
| Local town/city search | Done | 3,899 places + counties, lakes, markers; U, B |
| Roads, lakes/rivers, municipal labels | Done | Roads with route numbers, lakes, rivers, counties, townships; S |
| User markers with notes | Done | 7 types; backup included; B |
| Manual location; GPS optional | Done | Coordinate entry (decimal/DMS), “set as my location”, optional GPS button; U (parser) |
| Max zoom and coverage explained; no street-level or routing claims | Done | Map info panel, max-zoom banner |
| No claims about facility status | Done | Marker disclaimer |
| Appropriate format/renderer; GitHub Pages, range, memory, storage investigated | Done | `docs/MAP_DATA.md` |
| Size calculated and packaging explained; overview + optional packs | Done | `docs/MAP_DATA.md`; catalog |
| Per pack: coverage, size, zoom, version/date, progress, verified availability, delete | Done | Pack manager; B |
| Interrupted-download recovery, integrity verification | Done | B (503 interruption, corrupted part, resume fetches only missing parts) |
| Warning when region/detail not downloaded | Done | Banner; B |
| Licenses respected; no bulk OSM tiles; attribution offline | Done | `docs/MAP_DATA.md`, in-app sources |
| **Acceptance test** (install, offline, close/reopen, search both peninsulas, zoom, markers, no external requests) | Done in Chromium | B `e2e/map-offline.e2e.mjs`; A pending |
| Street-level detail | Not provided | Higher-detail sources unreachable; documented upgrade path (untested) |

## 4. Food

| Requirement | Status | Evidence |
|---|---|---|
| Configurable 14-day pantry/meal planner | Done | Planner uses household days and people, filters; U |
| No-cook / low-water meals from ordinary groceries | Done | 13 recipes (10 no-cook, 1 heat-optional, 2 low-water heated) |
| Servings, ingredients, equipment, steps, water needs, leftover storage | Done | Recipe detail; U |
| Suggestions linked to actual inventory | Done | Pantry tags on food records; expired/unready excluded; U |
| Variety and dietary filters incl. lower sodium | Done | 6 filters + per-recipe sodium tip; variety check in plan |
| Refrigerator/freezer outage safety; opened packages | Done | Food-safety tab (FoodSafety.gov/FSIS) |
| Fuel estimates only from appliance data | Done | Fuel calculator requires appliance rate |
| Indoor combustion warnings; no improvised heating | Done | Safety strip on Meals, Calculators, Urgent |
| Refrigerate-after-opening vs unopened distinction | Done | Recipe flags + supply flag + food-safety tab |
| Calorie/nutrient values per recipe | Not provided (by design) | Would require label data per product; totals come from inventory labels |

## 5. Michigan gardening

| Requirement | Status | Evidence |
|---|---|---|
| Extension-sourced, beginner-friendly section | Partial | UMN/UW/CSU/Illinois/Clemson + retrievable MSU docs; MSU crop pages blocked (R3) |
| Distinguish cold-tolerant / outdoor season / indoor / container / calorie crops | Done | Filters + labels |
| Peas, kale, cabbage, radishes, carrots, beets, lettuce, potatoes, beans, herbs (+ others) | Done | 19 crops |
| Per crop: material, conditions, windows, light, temp, water, medium, depth, drainage, space, harvest timing basis, failure points, indoor needs, seed storage, varieties only if supported | Done | Crop card; U (content check) |
| Hardy ≠ carefree; indoor winter-outage limits | Done | Callouts |
| Local frost inputs; regional differences; no single statewide date | Done | 78 stations, 50%/25%, manual overrides, region notes; U |
| Seed inventory, planting reminders, notes, harvest tracking | Done | Seeds (germination tests), plantings, harvest log, reminders on Today |
| No yield promises; supplement framing | Done | Copy |

## 6. Offline reliability, privacy, usability

| Requirement | Status | Evidence |
|---|---|---|
| Cold offline launch works | Done in Chromium | B (15 routes + PDF after browser restart offline); A pending |
| Verify actual cached bytes before “ready” | Done | SHA-256 + length per file; B |
| Protect records during updates | Done | B (v1→v2, A→B, failed update) |
| Interrupted downloads, quota failures, damaged files, cache upgrades | Done | B |
| Portable backups; PDFs/map data inclusion explained | Done | Settings text + backup `note`; B |
| Validate imports; render user content safely | Done | U, B |
| Dependency audit | Partial | Deps reduced to 3 runtime packages; `npm audit` not runnable here (R1) |
| Local fonts/icons/reader/map assets | Done | System fonts; generated SVG icons; B (no external requests) |
| Accessible controls, large text, themes, emergency mode | Partial | New UI ≥44 px targets, larger badges, dark theme tokens; no screen-reader audit (A/expert) |
| Urgent advice without long navigation | Done | Urgent strip, top-bar button |
| No false claims (encryption, live alerts, hardware, AI, shelter status) | Done | Copy reviewed; C |

## 7. Delivery

| Requirement | Status | Evidence |
|---|---|---|
| Findings ranked | Done | `docs/FINDINGS.md` |
| Updated source + GitHub Pages config | Done | `.github/workflows/deploy.yml` (lockfile caveat R1) |
| Test results and browser checks | Done | `docs/TEST_RESULTS.md` |
| Android tests outstanding listed | Done | `docs/TEST_RESULTS.md`, `docs/ANDROID_INSTALL.md` |
| Sources, dates, map licensing, provenance | Done | `docs/SOURCES.md`, `docs/MAP_DATA.md`, `THIRD_PARTY_NOTICES.md` |
| Nontechnical Android instructions | Done | `docs/ANDROID_INSTALL.md` |
| Updated ZIP | Done | Release archive |
