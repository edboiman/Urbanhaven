// Optional regional map packs: chunked download, per-part SHA-256 checks,
// resumable after interruption, stored in Cache Storage (separate from app
// caches, so app updates never delete them), with metadata in IndexedDB.
import { db, sha256 } from "../storage/db";
import { baseURL, NETWORK_FLAG } from "../services/offline";
import { decodePack, gunzipJSON, validateRaw, type Pack } from "./data";

export type PackPart = { file: string; bytes: number; sha256: string };
export type CatalogPack = {
  id: string;
  name: string;
  bbox: [number, number, number, number];
  version: string;
  zoom: [number, number];
  bytes: number;
  sha256: string;
  parts: PackPart[];
  features: Record<string, number>;
  toleranceMeters: number;
};
export type Catalog = {
  format: "urban-haven-map-catalog";
  version: string;
  built: string;
  overview: { file: string; bytes: number; sha256: string; places: number; zoom: [number, number] };
  packs: CatalogPack[];
  attribution: string[];
};
export type InstalledPack = {
  id: string;
  version: string;
  sha256: string;
  bytes: number;
  installed: string;
  verified: string;
  name?: string;
  bbox?: [number, number, number, number];
  parts?: PackPart[];
};
export const MAP_CACHE_PREFIX = "urban-haven-maps-v1-";
export const mapCacheName = () => MAP_CACHE_PREFIX + baseURL().href;
const url = (file: string) => new URL("maps/" + file, baseURL()).href;

export async function loadCatalog(): Promise<Catalog> {
  const res = await fetch(new URL("maps/catalog.json", baseURL()));
  if (!res.ok) throw new Error("The map catalog is missing from this installation. Reconnect and run Offline setup.");
  const c = (await res.json()) as Catalog;
  if (c.format !== "urban-haven-map-catalog" || !Array.isArray(c.packs)) throw new Error("The map catalog is damaged.");
  return c;
}

let overviewCache: Promise<Pack> | null = null;
export function loadOverview(catalog: Catalog): Promise<Pack> {
  if (overviewCache) return overviewCache;
  overviewCache = (async () => {
    const res = await fetch(new URL("maps/" + catalog.overview.file, baseURL()));
    if (!res.ok) throw new Error("The bundled Michigan overview map is missing. Run Offline setup → Download & verify.");
    const bytes = await res.arrayBuffer();
    if (bytes.byteLength !== catalog.overview.bytes || (await sha256(bytes)) !== catalog.overview.sha256)
      throw new Error("The bundled overview map failed its integrity check. Run Offline setup → Download & verify.");
    return decodePack(validateRaw(await gunzipJSON(bytes)));
  })();
  overviewCache.catch(() => (overviewCache = null));
  return overviewCache;
}

export type Progress = { done: number; total: number; bytes: number; totalBytes: number; message: string };

/** Downloads (or resumes) a pack. Parts already stored and verified are not downloaded again. */
export async function installPack(p: CatalogPack, onProgress: (x: Progress) => void, signal?: AbortSignal) {
  if (typeof caches === "undefined") throw new Error("Map packs need a secure (HTTPS) installation with offline storage.");
  const cache = await caches.open(mapCacheName());
  let bytes = 0;
  const report = (done: number, message: string) => onProgress({ done, total: p.parts.length, bytes, totalBytes: p.bytes, message });
  try {
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      if (est.quota && est.usage !== undefined && est.quota - est.usage < p.bytes * 3)
        throw new Error("Not enough free browser storage for this pack. Free space or delete other packs/PDFs.");
    }
    for (const [i, part] of p.parts.entries()) {
      if (signal?.aborted) throw new DOMException("Paused", "AbortError");
      const key = url(part.file);
      const existing = await cache.match(key);
      if (existing) {
        const b = await existing.arrayBuffer();
        if (b.byteLength === part.bytes && (await sha256(b)) === part.sha256) {
          bytes += part.bytes;
          report(i + 1, `Part ${i + 1} of ${p.parts.length} already stored and verified.`);
          continue;
        }
        await cache.delete(key);
      }
      report(i, `Downloading part ${i + 1} of ${p.parts.length}…`);
      const fresh = new URL(key);
      fresh.searchParams.set(NETWORK_FLAG, String(Date.now()));
      const res = await fetch(fresh, { cache: "no-store", signal });
      if (!res.ok) throw new Error(`Download failed (HTTP ${res.status}). Check your connection and retry; finished parts are kept.`);
      const b = await res.arrayBuffer();
      if (b.byteLength !== part.bytes || (await sha256(b)) !== part.sha256)
        throw new Error("A downloaded part failed its integrity check and was discarded. Retry; if it repeats, reload the app.");
      await cache.put(key, new Response(b, { headers: { "Content-Type": "application/octet-stream" } }));
      bytes += part.bytes;
      report(i + 1, `Stored part ${i + 1} of ${p.parts.length}.`);
    }
    const pack = await readPack(p.id, p.version, p.parts, p.sha256);
    const now = new Date().toISOString();
    await db.mapPacks.put({ id: p.id, version: p.version, sha256: p.sha256, bytes: p.bytes, installed: now, verified: now, name: p.name, bbox: p.bbox, parts: p.parts } as InstalledPack);
    report(p.parts.length, "Installed and verified.");
    return pack;
  } catch (e) {
    const err = e as DOMException;
    if (err?.name === "QuotaExceededError") throw new Error("Device storage is full. Delete other packs or PDFs and retry. Finished parts are kept.");
    if (err?.name === "AbortError") throw new Error("Paused. Finished parts are kept — select Resume to continue.");
    if (e instanceof TypeError) throw new Error("Could not reach the server — you appear to be offline. Finished parts are kept; Resume when connected.");
    throw e;
  }
}

/** Reads all parts from the map cache, checks every hash, and decodes the pack. */
export async function readPack(id: string, version: string, parts: PackPart[], whole: string): Promise<Pack> {
  const cache = await caches.open(mapCacheName());
  const chunks: Uint8Array[] = [];
  for (const part of parts) {
    const res = await cache.match(url(part.file));
    if (!res) throw new Error(`Map pack “${id}” is incomplete on this device (missing part). Download it again.`);
    const b = new Uint8Array(await res.arrayBuffer());
    if (b.byteLength !== part.bytes || (await sha256(b)) !== part.sha256) throw new Error(`Map pack “${id}” is damaged on this device. Download it again.`);
    chunks.push(b);
  }
  const all = new Uint8Array(chunks.reduce((n, c) => n + c.byteLength, 0));
  let o = 0;
  for (const c of chunks) {
    all.set(c, o);
    o += c.byteLength;
  }
  if ((await sha256(all)) !== whole) throw new Error(`Map pack “${id}” failed its whole-file integrity check. Download it again.`);
  const raw = validateRaw(await gunzipJSON(all));
  if (raw.id !== id || raw.version !== version) throw new Error(`Map pack “${id}” does not match its catalog entry.`);
  return decodePack(raw);
}

export async function verifyInstalled(rec: InstalledPack) {
  if (!rec.parts) throw new Error("Pack metadata is incomplete. Delete and download it again.");
  const pack = await readPack(rec.id, rec.version, rec.parts, rec.sha256);
  await db.mapPacks.put({ ...rec, verified: new Date().toISOString() } as InstalledPack);
  return pack;
}

export async function deletePack(rec: { id: string; parts?: PackPart[] }) {
  if (typeof caches !== "undefined") {
    const cache = await caches.open(mapCacheName());
    for (const k of await cache.keys()) if (k.url.includes(`/maps/packs/${rec.id}/`)) await cache.delete(k);
  }
  await db.mapPacks.delete(rec.id);
}

/** Bytes of map parts present in the cache for a pack (complete or partial). */
export async function storedBytes(id: string) {
  if (typeof caches === "undefined") return 0;
  const cache = await caches.open(mapCacheName());
  let n = 0;
  for (const k of await cache.keys())
    if (k.url.includes(`/maps/packs/${id}/`)) n += (await (await cache.match(k))?.arrayBuffer())?.byteLength || 0;
  return n;
}
