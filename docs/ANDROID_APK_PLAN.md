# Optional Android APK plan (not implemented)

A future Capacitor package can bundle the Vite `dist/` essential library inside the APK and use a native filesystem for exported / imported documents. Keep the public API as static relative assets and client-only data modules. Configure a consistent secure local origin, bundle the reader worker / fonts / WASM and remove service-worker registration in the native wrapper: the packaged assets provide the offline shell.

Before shipping: confirm current Capacitor / Android version requirements, build and sign with owner-controlled keys, test permission-minimal file selection, safe share / export handling, WebView CSP, browser-to-wrapper data migration, upgrades preserving SQLite / IndexedDB data, accessibility, PDF rendering and cold airplane-mode startup after device reboot. Native packaging strengthens essential asset retention but does not replace data backups or content review.

Optional AI is separate. Evaluate a maintained local inference runtime only on target Android hardware; use an explicit model-size / licensing / battery disclosure and a user-initiated optional download. Retrieval must cite bundled guide sections and refuse to invent medical, chemical or utility-repair instructions. No such implementation or compatibility claim is included in v1.
