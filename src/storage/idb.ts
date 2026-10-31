// A small, dependency-free IndexedDB layer.
//
// v1.0.0 used Dexie with `version(1)`, which Dexie stores as native IndexedDB
// version 10. This module opens the same database ("urban-haven-personal") at a
// higher native version and only ever ADDS object stores / indexes. It never
// deletes or recreates stores, so records written by v1.0.0 stay readable.
import { useEffect, useRef, useState } from "react";

export type StoreSpec = { name: string; indexes?: string[] };
type Listener = (stores: string[]) => void;

function promisify<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Storage request failed."));
  });
}

export function storageError(error: unknown) {
  const e = error as DOMException | undefined;
  if (e?.name === "QuotaExceededError")
    return new Error("Device storage is full. Free space or delete map packs / PDFs, then try again. Nothing was saved.");
  if (e?.name === "VersionError")
    return new Error("This browser holds data from a newer Urban Haven release. Update the app before editing records.");
  if (e?.name === "InvalidStateError")
    return new Error("Browser storage is unavailable (private browsing or blocked site data). Allow site storage and reload.");
  return error instanceof Error ? error : new Error("Browser storage request failed.");
}

export class Table<T extends { id: string }> {
  constructor(private readonly database: Database, readonly name: string) {}
  private async store(mode: IDBTransactionMode) {
    const db = await this.database.open();
    const tx = db.transaction(this.name, mode);
    return { store: tx.objectStore(this.name), done: transactionDone(tx) };
  }
  async toArray(): Promise<T[]> {
    try {
      const { store } = await this.store("readonly");
      return (await promisify(store.getAll())) as T[];
    } catch (e) {
      throw storageError(e);
    }
  }
  async get(id: string): Promise<T | undefined> {
    try {
      const { store } = await this.store("readonly");
      return (await promisify(store.get(id))) as T | undefined;
    } catch (e) {
      throw storageError(e);
    }
  }
  async count(): Promise<number> {
    const { store } = await this.store("readonly");
    return promisify(store.count());
  }
  async put(value: T) {
    return this.write((s) => void s.put(value)).then(() => value.id);
  }
  async bulkPut(values: T[]) {
    return this.write((s) => values.forEach((v) => s.put(v)));
  }
  async delete(id: string) {
    return this.write((s) => void s.delete(id));
  }
  async bulkDelete(ids: string[]) {
    return this.write((s) => ids.forEach((id) => s.delete(id)));
  }
  async clear() {
    return this.write((s) => void s.clear());
  }
  /** Newest-first / oldest-first listing through an index. */
  async byIndex(index: string, direction: "next" | "prev" = "next", limit = Infinity): Promise<T[]> {
    const { store } = await this.store("readonly");
    const out: T[] = [];
    const source = store.indexNames.contains(index) ? store.index(index) : store;
    return new Promise((resolve, reject) => {
      const req = source.openCursor(null, direction);
      req.onerror = () => reject(storageError(req.error));
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor || out.length >= limit) return resolve(out);
        out.push(cursor.value as T);
        cursor.continue();
      };
    });
  }
  private async write(fn: (store: IDBObjectStore) => void) {
    try {
      const { store, done } = await this.store("readwrite");
      fn(store);
      await done;
      this.database.notify([this.name]);
    } catch (e) {
      throw storageError(e);
    }
  }
}

function transactionDone(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error || new DOMException("Transaction aborted", "AbortError"));
    tx.onerror = () => reject(tx.error || new Error("Transaction failed"));
  });
}

/** Operations that run inside one atomic IndexedDB transaction. */
export class TxTable<T extends { id: string }> {
  constructor(private readonly store: IDBObjectStore) {}
  put(value: T) {
    return promisify(this.store.put(value));
  }
  bulkPut(values: T[]) {
    return Promise.all(values.map((v) => promisify(this.store.put(v))));
  }
  delete(id: string) {
    return promisify(this.store.delete(id));
  }
  clear() {
    return promisify(this.store.clear());
  }
  get(id: string) {
    return promisify(this.store.get(id)) as Promise<T | undefined>;
  }
  getAll() {
    return promisify(this.store.getAll()) as Promise<T[]>;
  }
}

export class Database {
  private connection: Promise<IDBDatabase> | null = null;
  private listeners = new Set<Listener>();
  private channel: BroadcastChannel | null = null;
  constructor(
    readonly name: string,
    readonly nativeVersion: number,
    readonly stores: StoreSpec[],
  ) {
    if (typeof BroadcastChannel !== "undefined" && typeof window !== "undefined") {
      this.channel = new BroadcastChannel(name + "-changes");
      this.channel.onmessage = (e) => this.emit(e.data as string[]);
    }
  }
  table<T extends { id: string }>(name: string) {
    return new Table<T>(this, name);
  }
  open(): Promise<IDBDatabase> {
    if (this.connection) return this.connection;
    this.connection = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === "undefined")
        return reject(new Error("This browser does not provide IndexedDB storage."));
      const request = indexedDB.open(this.name, this.nativeVersion);
      request.onupgradeneeded = () => {
        const db = request.result;
        const tx = request.transaction!;
        for (const spec of this.stores) {
          const store = db.objectStoreNames.contains(spec.name)
            ? tx.objectStore(spec.name)
            : db.createObjectStore(spec.name, { keyPath: "id" });
          for (const index of spec.indexes || [])
            if (!store.indexNames.contains(index)) store.createIndex(index, index);
        }
      };
      request.onblocked = () =>
        reject(new Error("Another Urban Haven tab is using an older version. Close other Urban Haven tabs, then reload."));
      request.onerror = () => {
        this.connection = null;
        reject(storageError(request.error));
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          this.connection = null;
        };
        resolve(db);
      };
    });
    this.connection.catch(() => (this.connection = null));
    return this.connection;
  }
  close() {
    void this.connection?.then((db) => db.close()).catch(() => {});
    this.connection = null;
    this.channel?.close();
  }
  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }
  notify(stores: string[]) {
    this.emit(stores);
    try {
      this.channel?.postMessage(stores);
    } catch {
      /* channel closed */
    }
  }
  private emit(stores: string[]) {
    for (const l of [...this.listeners]) l(stores);
  }
  /** Run several reads/writes atomically. If `fn` throws, nothing is written. */
  async transaction<R>(
    mode: "r" | "rw",
    storeNames: string[],
    fn: (t: <T extends { id: string }>(name: string) => TxTable<T>) => Promise<R>,
  ): Promise<R> {
    const db = await this.open();
    const tx = db.transaction(storeNames, mode === "rw" ? "readwrite" : "readonly");
    const done = transactionDone(tx);
    let result: R;
    try {
      result = await fn(<T extends { id: string }>(name: string) => new TxTable<T>(tx.objectStore(name)));
    } catch (e) {
      try {
        tx.abort();
      } catch {
        /* already finished */
      }
      await done.catch(() => {});
      throw storageError(e);
    }
    try {
      await done;
    } catch (e) {
      throw storageError(e);
    }
    if (mode === "rw") this.notify(storeNames);
    return result;
  }
}

let sharedDatabase: Database | null = null;
export function bindLiveDatabase(db: Database) {
  sharedDatabase = db;
}

/**
 * Re-runs `query` after any local or cross-tab write. Returns `fallback`
 * until the first result arrives. Errors are surfaced through `onError`.
 */
export function useLiveQuery<T>(query: () => Promise<T>, deps: unknown[], fallback?: T): T | undefined {
  const [value, setValue] = useState<T | undefined>(fallback);
  const latest = useRef(query);
  latest.current = query;
  useEffect(() => {
    let alive = true;
    let run = 0;
    const load = () => {
      const id = ++run;
      latest
        .current()
        .then((v) => alive && id === run && setValue(v))
        .catch((e) => {
          if (alive) console.error("Urban Haven storage:", e);
          if (alive) liveErrorHandler?.(e instanceof Error ? e.message : String(e));
        });
    };
    load();
    const off = sharedDatabase?.subscribe(load);
    return () => {
      alive = false;
      off?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return value;
}
let liveErrorHandler: ((message: string) => void) | null = null;
export function onLiveQueryError(handler: (message: string) => void) {
  liveErrorHandler = handler;
}
