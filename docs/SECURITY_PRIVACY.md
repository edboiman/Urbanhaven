# Security and privacy (2.0)

## Data handling

* No accounts, analytics, advertising, cloud database, AI model or remote API. Personal records stay in the browser's IndexedDB on the device.
* Location: requested **only** when the person taps the map's GPS button; used on the device to draw a dot; saved only if they save a marker. Manual coordinates or a town search work without GPS.
* Hosting: the web host (e.g. GitHub Pages) receives ordinary requests when the app or a map pack is downloaded or updated.
* Nothing is encrypted by the app — not IndexedDB, not backups. Sensitive notebook entries are omitted from backups unless the person opts in. Inventory notes, markers and checklist notes are always included.

## Controls

* React renders all user text as text. No `dangerouslySetInnerHTML`, no HTML import. Tested with script/markup in names and notes (unit and browser tests).
* CSP (meta tag): same-origin scripts/connections, no plugins, `wasm-unsafe-eval` for PDF.js, blob/data images. Hosts that can send headers should also send `frame-ancestors 'none'`.
* Backup import: 30 MB cap, ≤10,000 rows per list, known fields only, string length limits, numeric ranges, enums (categories, statuses, marker types, needs), latitude/longitude ranges, germination counts consistent, duplicate-ID rejection, single atomic transaction.
* CSV export prefixes cells starting with `= + - @` to prevent spreadsheet formula injection.
* Integrity: SHA-256 + length for every core file and every map-pack part and whole pack. This detects corruption, not a compromised host that rewrites both files and manifest; HTTPS and a trusted repository protect delivery.
* PDF import: 20 MB cap, PDF signature check, hash checked on open, PDF.js with XFA disabled and local assets.

## Dependencies

2.0 removed Vite, Workbox, Vitest, Dexie, dexie-react-hooks, lucide-react and fake-indexeddb. Shipped code: React, React DOM, PDF.js plus app code. Build/test: esbuild, TypeScript, Playwright, type packages. **`npm audit` could not be run while preparing this release** (no package-registry access); the CI workflow runs `npm audit --omit=dev --audit-level=high` on every build. Commit a `package-lock.json` (run `npm install` once) for reproducible installs.

## Not claimed

No encryption, live alerts, emergency calling, shelter or facility status, hardware control, background notifications, offline AI, or professional certification.
