# Verification — Urban Haven 2.2.0

Prepared 2026-11-01 America/Detroit. These results describe the current source and production output. Earlier-release browser observations are not counted as checks of this build.

| Check | Result |
|---|---|
| Content checker | PASS: 78 guides, 19 crops, 78 frost stations; required fields and related references |
| Strict TypeScript | PASS: application and tests |
| Unit tests | PASS: 60 / 60, including seven new UX/food regressions |
| Production build | PASS: edition faf1735e9574, 214 core files / 6.03 MB; 224 total files |
| Source JSON and build integrity | PASS: source JSON parses without duplicate keys; all 214 core sizes and SHA-256 hashes match production files |
| Oxalate source comparison | PASS: all 21 bundled food names, portions, numeric values and measurement flags match the primary Harvard workbook (trailing spaces normalized) |
| Update helper | PASS: all 145 listed source files copied into a clean synthetic 2.1.1 checkout; Git HEAD preserved; a second run rejected the dirty destination before copying |
| Browser interaction | Managed Chrome, production build under /Urbanhaven/, phone-frame and desktop observations below |
| Automated Chromium suites | NOT RUN here. Checklist, backup, upgrade and feature selectors updated; offline routes now include nutrition/oxalates. Syntax checks passed. Run npm run test:e2e in CI/local Chromium. |
| Real Android / cold offline / kitchen / radio / field checks | NOT PERFORMED in this update |

## New regression coverage

Manual confirmation sets ready without manufacturing inventory; explicit unchecking returns to needed; not-applicable items stay not applicable; backups preserve explicit false and validate types/dates; all 24 imported recipes retain amounts and separated steps; no-heat/no-fridge filters exclude unsuitable oat preparations and heat-dependent meals; the quick filter checks the upper end of time ranges; Harvard rows retain source/serving/preparation/estimate flags; ingredient links keep split peas distinct from green peas and do not invent values for unknown foods.

The prior storage, garden, route, pet, food-planner and backup regressions remain passing. These verify software and data structure, not a medically prescribed diet, precise food chemistry or actual recipe yield.

## Browser observations

- A quantity checklist item can be checked directly without adding a supply; the count changes, survives reload and can be unchecked. Details still show zero inventory and the actual gap. Opening Details is a separate action.
- The final checklist and pantry phone layouts were inspected visually after reducing wrapped navigation. Pantry search for beans narrows the groups; opening canned legumes displays the quality window, opened-food time limits and water/fuel notes.
- Searching red lentil finds the two new matching recipes. The stew renders its original amounts and four separate steps. Checking the first cooking step changes progress to 1 / 4. Its ingredient oxalate disclosure shows the boiled lentil reference with the half-cup serving and warns it is not a recipe measurement.
- Oxalate search for lentils and amount sorting work. The displayed value retains preparation and serving size.
- Daily calorie planning changes from 2,000 to a synthetic 2,200 kcal/person/day and persists after reload; the household total updates.
- A synthetic food record of 3 cans × 3 servings × 110 kcal displays 990 kcal, with the quantity, status and date fields kept in a separate inventory row.
- Phone-frame dimensions were 390 × 844. Checklist, expanded pantry, recipe detail, nutrition, oxalates and populated inventory measured client width = scroll width = 375 px (no horizontal document overflow in those inspected views).

- Desktop recipe grid inspected visually; Show more increases visible cards from 12 to 24. Document client/scroll widths both measured 1,348 px.

## Limits

The preview is HTTP on a non-localhost hostname. Secure APIs for service workers and map integrity are unavailable there, so no real offline installation, cold airplane-mode start or service-worker upgrade is claimed. Core content is bundled and production hashes are checked; actual device offline testing remains necessary. Browser checks use synthetic records and have no access to user medical, pet or location records.

No GitHub push or deployment was performed. The supplied update helper preserves the existing repository and leaves commit/push to the user. Recipes are original practical ideas, not kitchen-tested or calculated nutrient-complete rations. Oxalate source/interpretation limitations are documented in NUTRITION_OXALATE_SOURCES.md.
