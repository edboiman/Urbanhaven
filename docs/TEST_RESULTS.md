# Verification — Urban Haven 2.1.1

Prepared 2026-11-01 America/New_York. These results describe this audited package. Prior-release observations are not counted as checks of this build.

| Check | Result |
|---|---|
| Content checker | PASS: 78 guides across 10 categories; required fields, sources and related IDs; 19 crop profiles and 78 frost stations |
| Strict TypeScript, app and tests | PASS |
| Unit tests | PASS: 53 / 53, including eight new audit regressions |
| Production build | PASS: edition 074e753858e8, 214 core files / 5.99 MB; 224 total files |
| Built-file integrity | PASS: all 214 offline-manifest file sizes and SHA-256 values match the production files |
| Source JSON | PASS: all source JSON files parse without duplicate keys |
| Dependency audit | npm audit reported zero vulnerabilities, including development dependencies, on the audit date |
| Update helper | PASS: all 135 listed source files copied to a clean synthetic 2.1.0 repository; Git HEAD preserved; dirty destination rejected before copying |
| Browser interaction checks | Managed Chrome against the production build under /Urbanhaven/; observations below |
| Automated Chromium suites | NOT RUN here. Existing suites retained and storage route added to offline-core coverage. Run npm run test:e2e in local/CI Chromium before release reliance. |
| Physical Android / radio / kitchen / field test | NOT PERFORMED |

## New regression coverage

Calendar-month rotation with month-end and leap-year handling; automatic rotation only for explicitly self-filled water; earlier explicit dates cannot postpone rotation; conservative quality-date readiness; source-aware water reminders; optional date/type backup fields and rejection of nonexistent dates; fall-transplant seed-start versus outdoor dates; ordinary oats excluded from the no-cook cereal recipe; couscous package arithmetic. Existing garden tests now exercise fall pea maturity and the revised germination interpretation.

These checks verify software behavior and content structure. The source audit in SOURCE_AUDIT.md separately evaluates factual claims; passing code tests does not establish clinical safety, actual crop yields or broadcast uptime.

## Browser observations for this build

- Storage & shelf lives renders its water reference and topic selector. The seed selector displays crop-specific storage/germination guidance and conditional viability estimates.
- A synthetic self-filled water record with fill date 2026-04-30 displays a rotation date of 2026-10-30 and a refill/rotation-due status. It contributes zero usable liters after that date. Saving and reloading preserves the record and status.
- The water reference was inspected at 390 × 844 phone-frame dimensions. Document client and scroll widths both measured 375 px: no horizontal page overflow in that view. Text and controls were inspected visually.

## Limits

The managed preview is HTTP on a non-localhost hostname. Secure browser APIs required for service-worker installation and map integrity checks are unavailable there. This audit therefore does not claim a real airplane-mode cold start, map-pack installation, canvas path rendering, GPX download, local-photo import/restore, or service-worker upgrade check for this build. The other 2.1 feature checks documented in the previous release were not repeated and are not claimed here.

Use HTTPS GitHub Pages or localhost for those checks. Verify files, install needed regional packs, close and reopen in airplane mode on the actual device. The audit used synthetic records and did not access user medical, pet or location records. No push or deployment was performed.
