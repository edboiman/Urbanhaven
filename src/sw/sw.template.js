/* Urban Haven service worker (generated from src/sw/sw.template.js by scripts/build.mjs).
 *
 * - Installs every core file into a NEW versioned cache and checks each file's
 *   SHA-256 and length before the install may succeed. A failed or interrupted
 *   install leaves the previous edition in place.
 * - A waiting update only activates after the person selects "Update & reload".
 * - Map packs live in their own caches ("urban-haven-maps-…") and are never
 *   deleted by app updates. Personal records live in IndexedDB, not here.
 */
const VERSION = "__VERSION__";
const FILES = __FILES__; // [relative url, sha256, size]
const MANIFEST_SHA = "__MANIFEST_SHA__";
const SCOPE = self.registration.scope;
const CORE = "urban-haven-core-" + VERSION + "-" + SCOPE;
const CORE_PREFIX = "urban-haven-core-";
const LEGACY_WORKBOX = "urban-haven-precache-"; // v1.0.0 (Workbox) precache names
const MAPS_PREFIX = "urban-haven-maps-";

async function digest(buffer) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", buffer));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function fetchVerified(url, sha, size) {
  const response = await fetch(new Request(url, { cache: "reload", credentials: "same-origin" }));
  if (!response.ok) throw new Error("HTTP " + response.status + " for " + url);
  const buffer = await response.clone().arrayBuffer();
  if (sha && (buffer.byteLength !== size || (await digest(buffer)) !== sha))
    throw new Error("Integrity check failed for " + url);
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CORE);
      const existing = new Set((await cache.keys()).map((r) => r.url));
      // Re-use already verified entries if a previous install attempt was interrupted.
      for (const [rel, sha, size] of FILES) {
        const url = new URL(rel, SCOPE).href;
        if (existing.has(url)) {
          const cached = await cache.match(url);
          const buffer = cached && (await cached.clone().arrayBuffer());
          if (buffer && buffer.byteLength === size && (await digest(buffer)) === sha) continue;
        }
        await cache.put(url, await fetchVerified(url, sha, size));
      }
      const manifestUrl = new URL("offline-manifest.json", SCOPE).href;
      const manifest = await fetchVerified(manifestUrl, "", 0);
      const body = await manifest.clone().arrayBuffer();
      if ((await digest(body)) !== MANIFEST_SHA) throw new Error("Offline manifest does not match this edition.");
      await cache.put(manifestUrl, manifest);
      await cache.put(new URL("__edition__", SCOPE).href, new Response(VERSION));
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        const ours = name.endsWith(SCOPE) && (name.startsWith(CORE_PREFIX) || name.startsWith(LEGACY_WORKBOX));
        if (ours && name !== CORE && !name.startsWith(MAPS_PREFIX)) await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(SCOPE)) return;
  if (url.searchParams.has("__network")) return; // explicit repair / map download: go to the network
  event.respondWith(
    (async () => {
      const core = await caches.open(CORE);
      if (request.mode === "navigate") {
        const shell = await core.match(new URL("index.html", SCOPE).href);
        if (shell) return shell;
        return fetch(request);
      }
      const clean = url.origin + url.pathname;
      const hit = (await core.match(clean)) || (await caches.match(clean, { ignoreSearch: true }));
      if (hit) return hit;
      return fetch(request);
    })(),
  );
});
