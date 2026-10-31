import { sha256 } from "../storage/db";
export type OfflineState = {
  status: "checking" | "missing" | "ready" | "error";
  progress: number;
  total: number;
  bytes: number;
  version: string;
  message: string;
  checked: string;
};
export const initialOffline: OfflineState = {
  status: "checking",
  progress: 0,
  total: 0,
  bytes: 0,
  version: "",
  message: "Checking this device…",
  checked: "",
};
export type Manifest = {
  version: string;
  built?: string;
  files: { url: string; sha256: string; size: number }[];
};
export const CORE_PREFIX = "urban-haven-core-";
export const baseURL = () => new URL(import.meta.env.BASE_URL, location.href);
/** Appended to requests that must bypass the service worker cache. */
export const NETWORK_FLAG = "__network";
let registration: ServiceWorkerRegistration | undefined;

export async function registerOffline(onUpdate: () => void) {
  if (!isSecureContext)
    throw new Error("Offline installation requires HTTPS (or localhost). This address cannot install the offline app.");
  if (!("serviceWorker" in navigator)) throw new Error("This browser does not support offline installation.");
  if (import.meta.env.DEV) return;
  const base = baseURL();
  registration = await navigator.serviceWorker.register(new URL("sw.js", base), { scope: base.pathname });
  if (registration.waiting && navigator.serviceWorker.controller) onUpdate();
  registration.addEventListener("updatefound", () => {
    const worker = registration?.installing;
    worker?.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) onUpdate();
    });
  });
  window.addEventListener("online", () => void registration?.update().catch(() => {}));
}

export function coreCacheName(version: string, base = baseURL()) {
  return CORE_PREFIX + version + "-" + base.href;
}

async function readManifest(base: URL): Promise<Manifest> {
  // Served by the active service worker from its own edition when installed.
  const res = await fetch(new URL("offline-manifest.json", base), { cache: "no-cache" });
  if (!res.ok) throw new Error("The offline manifest is unavailable. Open the published app while online once.");
  const m = (await res.json()) as Manifest;
  if (!m || typeof m.version !== "string" || !Array.isArray(m.files)) throw new Error("The offline manifest is damaged.");
  return m;
}

async function waitForController() {
  if (navigator.serviceWorker.controller) return;
  await Promise.race([
    new Promise<void>((resolve) =>
      navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true }),
    ),
    new Promise<void>((_, reject) =>
      setTimeout(
        () => reject(new Error("Offline setup has not finished installing. Stay online, reload this page, then try again.")),
        20000,
      ),
    ),
  ]);
}

/**
 * Reads every core file from the service worker's cache and checks its SHA-256
 * and length. With `repair`, missing or damaged files are downloaded again,
 * checked, and written back. Nothing is reported ready unless every file passes.
 */
export async function verifyOffline(update: (s: OfflineState) => void, repair = false, signal?: AbortSignal) {
  let state = { ...initialOffline };
  try {
    if (!isSecureContext || !("serviceWorker" in navigator) || typeof caches === "undefined")
      throw new Error("Offline installation requires HTTPS (or localhost) and service-worker support.");
    if (import.meta.env.DEV) throw new Error("Offline installation is available in the production build.");
    update({ ...state, message: "Waiting for the offline service worker…" });
    await waitForController();
    const base = baseURL();
    const m = await readManifest(base);
    state = { ...state, total: m.files.length, version: m.version, message: "Verifying local files…" };
    update(state);
    const name = coreCacheName(m.version, base);
    if (!(await caches.keys()).includes(name))
      throw new Error("The app cache for this edition is missing. Reconnect, reload, then select Download & verify.");
    const cache = await caches.open(name);
    for (const [i, f] of m.files.entries()) {
      if (signal?.aborted) throw new Error("Paused. Files checked so far are kept; select Download & verify to continue.");
      const url = new URL(f.url, base).href;
      let valid = false;
      const res = await cache.match(url);
      if (res) {
        const bytes = await res.clone().arrayBuffer();
        valid = bytes.byteLength === f.size && (await sha256(bytes)) === f.sha256;
      }
      if (!valid && repair) {
        const fresh = new URL(f.url, base);
        fresh.searchParams.set(NETWORK_FLAG, String(Date.now()));
        const downloaded = await fetch(fresh, { cache: "no-store", signal });
        if (!downloaded.ok) throw new Error(`Could not download ${f.url} (HTTP ${downloaded.status}).`);
        const bytes = await downloaded.clone().arrayBuffer();
        if (bytes.byteLength !== f.size || (await sha256(bytes)) !== f.sha256)
          throw new Error("A downloaded file failed its integrity check. Reload to get the current release, then retry.");
        await cache.put(url, new Response(bytes, { headers: downloaded.headers }));
        valid = true;
      }
      if (!valid)
        throw new Error(`Offline file missing or damaged: ${f.url}. Reconnect and select Download & verify.`);
      state = { ...state, progress: i + 1, bytes: state.bytes + f.size };
      update(state);
    }
    update({
      ...state,
      status: "ready",
      message: "Core app, guides, checklist and Michigan overview map verified on this device.",
      checked: new Date().toLocaleString(),
    });
  } catch (e) {
    const err = e as DOMException;
    update({
      ...state,
      status: "error",
      message:
        err?.name === "QuotaExceededError"
          ? "Not enough device storage to repair offline files. Free space, then retry."
          : err?.name === "AbortError"
            ? "Paused. Files checked so far are kept; select Download & verify to continue."
            : e instanceof TypeError
              ? "Could not reach the app's website — this device seems to be offline. Reconnect, then select Download & verify."
              : e instanceof Error
              ? e.message
              : "Offline verification failed.",
    });
  }
}
export function activateUpdate() {
  if (!registration?.waiting) return;
  let reloading = false;
  navigator.serviceWorker.addEventListener(
    "controllerchange",
    () => {
      if (!reloading) {
        reloading = true;
        location.reload();
      }
    },
    { once: true },
  );
  registration.waiting.postMessage({ type: "SKIP_WAITING" });
}
export async function storageInfo() {
  return {
    estimate: await navigator.storage?.estimate(),
    persistent: await navigator.storage?.persisted(),
  };
}
