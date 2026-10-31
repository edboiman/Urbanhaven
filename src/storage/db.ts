import { Database, bindLiveDatabase, type Table } from "./idb";
import type {
  Supply,
  Note,
  GardenEntry,
  LocalDocument,
  Settings,
  ChecklistState,
  ConsumptionEntry,
  MapMarker,
  MapPackRecord,
  SeedLot,
  HarvestEntry,
  PlanRecord,
} from "../types";

export const DB_NAME = "urban-haven-personal";
/**
 * Native IndexedDB version. v1.0.0 (Dexie `version(1)`) = 10. Schema v2 = 20.
 * Only additive changes are allowed: new stores and new indexes.
 */
export const DB_VERSION = 20;
export const storeSpecs = [
  // v1 stores (unchanged names, key path "id", indexes as created by v1.0.0)
  { name: "supplies", indexes: ["name", "category", "expires"] },
  { name: "notes", indexes: ["title"] },
  { name: "garden", indexes: ["cropId"] },
  { name: "documents" },
  { name: "settings" },
  { name: "favorites" },
  { name: "recents", indexes: ["date"] },
  // v2 stores
  { name: "checklist" },
  { name: "consumption", indexes: ["supplyId", "date"] },
  { name: "markers", indexes: ["kind"] },
  { name: "mapPacks" },
  { name: "seeds", indexes: ["cropId"] },
  { name: "harvests", indexes: ["entryId", "date"] },
  { name: "plans" },
];

export class HavenDB extends Database {
  supplies: Table<Supply>;
  notes: Table<Note>;
  garden: Table<GardenEntry>;
  documents: Table<LocalDocument>;
  settings: Table<Settings>;
  favorites: Table<{ id: string }>;
  recents: Table<{ id: string; date: number }>;
  checklist: Table<ChecklistState>;
  consumption: Table<ConsumptionEntry>;
  markers: Table<MapMarker>;
  mapPacks: Table<MapPackRecord>;
  seeds: Table<SeedLot>;
  harvests: Table<HarvestEntry>;
  plans: Table<PlanRecord>;
  constructor(name = DB_NAME) {
    super(name, DB_VERSION, storeSpecs);
    this.supplies = this.table("supplies");
    this.notes = this.table("notes");
    this.garden = this.table("garden");
    this.documents = this.table("documents");
    this.settings = this.table("settings");
    this.favorites = this.table("favorites");
    this.recents = this.table("recents");
    this.checklist = this.table("checklist");
    this.consumption = this.table("consumption");
    this.markers = this.table("markers");
    this.mapPacks = this.table("mapPacks");
    this.seeds = this.table("seeds");
    this.harvests = this.table("harvests");
    this.plans = this.table("plans");
  }
  /** Stores holding personal records (everything except downloaded map metadata). */
  get personalStores() {
    return storeSpecs.map((s) => s.name).filter((n) => n !== "mapPacks");
  }
}
export const db = new HavenDB();
bindLiveDatabase(db);

export const defaults: Settings = {
  id: "preferences",
  theme: "light",
  largeText: false,
  emergency: false,
  people: 1,
  pets: 0,
  petWaterLiters: 0,
  days: 14,
  dailyCalories: 2000,
  region: "Michigan / Great Lakes",
  lastFrost: "",
  firstFrost: "",
  checks: [],
  infants: 0,
  needs: [],
  hygieneLiters: 0,
  gardenZone: "",
  checklistMigrated: false,
};
/** Fill v2 fields for records written by v1.0.0. Never overwrites saved values. */
export function withDefaults(saved?: Partial<Settings> | null): Settings {
  return { ...defaults, ...(saved || {}), id: "preferences" } as Settings;
}
export const uid = () => {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};
export async function getPreferences() {
  return withDefaults(await db.settings.get("preferences"));
}
export async function setPreferences(patch: Partial<Settings>) {
  await db.settings.put({ ...(await getPreferences()), ...patch, id: "preferences" });
}
export async function sha256(data: BufferSource) {
  if (!crypto.subtle)
    throw new Error("File integrity checks require HTTPS (or localhost). Open the published secure app.");
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", data))]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
