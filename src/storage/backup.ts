import { db, withDefaults, HavenDB } from "./db";
import {
  supplyCategories,
  needsFlags,
  type Supply,
  type Note,
  type GardenEntry,
  type Settings,
  type ChecklistState,
  type ChecklistDefinition,
  type ConsumptionEntry,
  type MapMarker,
  type SeedLot,
  type HarvestEntry,
  type PlanRecord,
} from "../types";

import { readRoute, validMarkerPhoto } from "../map/routes";

import { readRadioLog } from "../radio/model";
import { readPet, readPetKit } from "../pets/model";

import { dateKinds, waterTypes } from "./dates";

export const BACKUP_SCHEMA = 2;
const MAX = 30 * 1024 * 1024;
const object = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
function text(x: unknown, max = 2000, field = "text") {
  if (typeof x !== "string" || x.length > max)
    throw new Error(`Backup contains invalid ${field}.`);
  return x;
}
function optText(x: unknown, max = 2000, field = "text") {
  return x === undefined ? undefined : text(x, max, field);
}
function num(x: unknown, max = 1e9, field = "number") {
  if (typeof x !== "number" || !Number.isFinite(x) || x < 0 || x > max)
    throw new Error(`Backup contains an invalid ${field}.`);
  return x;
}
function optNum(x: unknown, max = 1e9, field = "number") {
  return x === undefined || x === null ? undefined : num(x, max, field);
}
function date(x: unknown) {
  const s = text(x, 40, "date");
  if (
    s !== "" &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(s) ||
      Number.isNaN(new Date(s + "T12:00:00Z").getTime()) ||
      new Date(s + "T12:00:00Z").toISOString().slice(0, 10) !== s)
  )
    throw new Error("Invalid date in backup.");
  return s;
}
function optDate(x: unknown) {
  return x === undefined ? undefined : date(x);
}
function list(x: unknown, optional = false) {
  if (optional && x === undefined) return [];
  if (!Array.isArray(x) || x.length > 10000)
    throw new Error("Invalid or oversized backup list.");
  return x;
}
function row(x: unknown) {
  if (!object(x)) throw new Error("Invalid backup record.");
  return x;
}
function oneOf<T extends string>(
  x: unknown,
  allowed: readonly T[],
  field: string,
): T {
  if (!allowed.includes(x as T))
    throw new Error(`Backup contains an unknown ${field}.`);
  return x as T;
}
function latitude(x: unknown) {
  const v = typeof x === "number" ? x : NaN;
  if (!Number.isFinite(v) || v < -90 || v > 90)
    throw new Error("Backup contains an invalid latitude.");
  return v;
}
function longitude(x: unknown) {
  const v = typeof x === "number" ? x : NaN;
  if (!Number.isFinite(v) || v < -180 || v > 180)
    throw new Error("Backup contains an invalid longitude.");
  return v;
}

function validateDefinition(x: Record<string, unknown>): ChecklistDefinition {
  return {
    id: text(x.id, 100),
    section: text(x.section, 60),
    name: text(x.name, 160),
    kind: oneOf(x.kind, ["quantity", "task"] as const, "checklist kind"),
    basis: oneOf(
      x.basis,
      [
        "personDay",
        "personWeek",
        "person",
        "petDay",
        "pet",
        "infantDay",
        "day",
        "household",
        "householdWeek",
        "fixed",
      ] as const,
      "checklist basis",
    ),
    rate: x.rate === null ? null : num(x.rate, 1e7, "checklist amount"),
    unit: text(x.unit, 30),
    measure: oneOf(
      x.measure,
      ["liters", "kcal", "count"] as const,
      "checklist measure",
    ),
    category: text(x.category, 40),
    autoCategory: optText(x.autoCategory, 40),
    origin: "household",
    why: text(x.why ?? "", 2000),
    intervalDays: optNum(x.intervalDays, 3650, "interval"),
  };
}

export function validateBackup(input: unknown) {
  if (
    !object(input) ||
    input.format !== "urban-haven" ||
    (input.schema !== 1 && input.schema !== 2)
  )
    throw new Error("This is not an Urban Haven backup (schema 1 or 2).");
  const supplies = list(input.supplies).map((v) => {
    const x = row(v);
    return {
      id: text(x.id, 100),
      name: text(x.name, 120),
      category: oneOf(x.category, supplyCategories, "supply category"),
      quantity: num(x.quantity),
      unit: text(x.unit, 30),
      location: text(x.location, 120),
      expires: date(x.expires),
      dateKind:
        x.dateKind === undefined
          ? undefined
          : oneOf(x.dateKind, dateKinds, "date kind"),
      waterType:
        x.waterType === undefined
          ? undefined
          : oneOf(x.waterType, waterTypes, "water type"),
      acquired: date(x.acquired),
      condition: text(x.condition, 30),
      notes: text(x.notes, 4000),
      lowStock: num(x.lowStock),
      waterLiters: num(x.waterLiters),
      servings: num(x.servings),
      calories: num(x.calories),
      checklistId: optText(x.checklistId, 100),
      perUnit: optNum(x.perUnit, 1e6),
      pantryTags:
        x.pantryTags === undefined
          ? undefined
          : list(x.pantryTags).map((t) => text(t, 40)),
      sodiumMg: optNum(x.sodiumMg, 1e6),
      proteinG: optNum(x.proteinG, 1e5),
      refrigerateAfterOpening:
        x.refrigerateAfterOpening === undefined
          ? undefined
          : x.refrigerateAfterOpening === true,
    } as Supply;
  });
  const notes = list(input.notes).map((v) => {
    const x = row(v);
    return {
      id: text(x.id, 100),
      title: text(x.title, 160),
      body: text(x.body, 20000),
      tags: text(x.tags, 300),
      sensitive: x.sensitive === true,
      updated: text(x.updated, 50),
    } as Note;
  });
  const garden = list(input.garden).map((v) => {
    const x = row(v);
    return {
      id: text(x.id, 100),
      cropId: text(x.cropId, 100),
      name: text(x.name, 120),
      location: text(x.location, 120),
      planted: date(x.planted),
      reminder: date(x.reminder),
      seeds: num(x.seeds),
      harvest: num(x.harvest),
      notes: text(x.notes, 4000),
      method: optText(x.method, 60),
      stage:
        x.stage === undefined
          ? undefined
          : oneOf(
              x.stage,
              [
                "planned",
                "sown",
                "transplanted",
                "growing",
                "harvesting",
                "finished",
                "failed",
              ] as const,
              "garden stage",
            ),
      seedLotId: optText(x.seedLotId, 100),
      reminderNote: optText(x.reminderNote, 300),
    } as GardenEntry;
  });
  const favorites = list(input.favorites).map((v) => ({
    id: text(row(v).id, 100),
  }));
  const p = row(input.settings);
  const settings: Settings = withDefaults({
    theme: p.theme === "dark" ? "dark" : "light",
    largeText: p.largeText === true,
    emergency: p.emergency === true,
    people: Math.max(1, Math.round(num(p.people, 1000, "household size"))),
    pets: num(p.pets, 1000),
    petWaterLiters:
      p.petWaterLiters === undefined ? 0 : num(p.petWaterLiters, 10000),
    days: num(p.days, 365) || 14,
    dailyCalories: num(p.dailyCalories, 20000) || 2000,
    region: text(p.region, 100),
    lastFrost: date(p.lastFrost),
    firstFrost: date(p.firstFrost),
    checks: list(p.checks).map((v) => text(v, 80)),
    infants: p.infants === undefined ? 0 : num(p.infants, 100),
    needs:
      p.needs === undefined
        ? []
        : list(p.needs).map((v) => oneOf(v, needsFlags, "household need")),
    hygieneLiters:
      p.hygieneLiters === undefined ? 0 : num(p.hygieneLiters, 100),
    gardenZone: p.gardenZone === undefined ? "" : text(p.gardenZone, 60),
    checklistMigrated: p.checklistMigrated === true,
  });
  const checklist = list(input.checklist, true).map((v) => {
    const x = row(v);
    return {
      id: text(x.id, 100),
      custom:
        x.custom === undefined ? undefined : validateDefinition(row(x.custom)),
      rate: optNum(x.rate, 1e7, "checklist amount"),
      name: optText(x.name, 160),
      prepared:
        x.prepared === undefined ? undefined : validatePrepared(x.prepared),
      preparedOn: optDate(x.preparedOn),
      na: x.na === true || undefined,
      inspect: x.inspect === true || undefined,
      hidden: x.hidden === true || undefined,
      notes: optText(x.notes, 4000),
      lastDone: optDate(x.lastDone),
      intervalDays: optNum(x.intervalDays, 3650, "interval"),
      updated: text(x.updated ?? "", 50),
    } as ChecklistState;
  });
  const consumption = list(input.consumption, true).map((v) => {
    const x = row(v);
    return {
      id: text(x.id, 100),
      supplyId: text(x.supplyId, 100),
      supplyName: text(x.supplyName, 120),
      date: date(x.date),
      amount: num(x.amount),
      unit: text(x.unit, 30),
      reason: oneOf(
        x.reason,
        [
          "used",
          "damaged",
          "expired",
          "discarded",
          "restocked",
          "corrected",
        ] as const,
        "consumption reason",
      ),
      note: text(x.note ?? "", 500),
    } as ConsumptionEntry;
  });
  const markers = list(input.markers, true).map((v) => {
    const x = row(v);
    return {
      id: text(x.id, 100),
      name: text(x.name, 120),
      kind: oneOf(
        x.kind,
        [
          "meeting",
          "contact",
          "supply",
          "water",
          "farm",
          "medical",
          "shelter",
          "other",
        ] as const,
        "marker type",
      ),
      photo:
        x.photo === undefined || x.photo === ""
          ? undefined
          : validMarkerPhoto(x.photo)
            ? x.photo
            : (() => {
                throw new Error("Invalid marker photo in backup.");
              })(),
      photoCaption: optText(x.photoCaption, 300),
      lat: latitude(x.lat),
      lon: longitude(x.lon),
      notes: text(x.notes ?? "", 4000),
      created: text(x.created ?? "", 50),
      updated: text(x.updated ?? "", 50),
    } as MapMarker;
  });
  const seeds = list(input.seeds, true).map((v) => {
    const x = row(v);
    return {
      id: text(x.id, 100),
      cropId: text(x.cropId, 100),
      variety: text(x.variety, 120),
      source: text(x.source ?? "", 120),
      packedFor: text(x.packedFor ?? "", 20),
      quantity: num(x.quantity),
      unit: text(x.unit ?? "seeds", 30),
      location: text(x.location ?? "", 120),
      notes: text(x.notes ?? "", 4000),
      tests: list(x.tests ?? [], true).map((t) => {
        const y = row(t);
        const sown = num(y.sown, 1e5);
        const sprouted = num(y.sprouted, 1e5);
        if (sprouted > sown)
          throw new Error("Germination test shows more sprouts than seeds.");
        return { date: date(y.date), sown, sprouted };
      }),
    } as SeedLot;
  });
  const harvests = list(input.harvests, true).map((v) => {
    const x = row(v);
    return {
      id: text(x.id, 100),
      entryId: text(x.entryId, 100),
      date: date(x.date),
      grams: num(x.grams, 1e7),
      notes: text(x.notes ?? "", 1000),
    } as HarvestEntry;
  });
  const plans = list(input.plans, true).map((v) => {
    const x = row(v);
    const json = JSON.stringify(x.data ?? null);
    if (json.length > 200000)
      throw new Error("A saved plan in the backup is too large.");
    const id = text(x.id, 100);
    return {
      id,
      data: id.startsWith("map-route-")
        ? readRoute(x.data)
        : id.startsWith("pet-profile-")
          ? readPet(x.data)
          : id === "radio-log"
            ? readRadioLog(x.data)
            : id === "pet-kit"
              ? readPetKit(x.data)
              : JSON.parse(json),
      updated: text(x.updated ?? "", 50),
    } as PlanRecord;
  });
  for (const arr of [
    supplies,
    notes,
    garden,
    favorites,
    checklist,
    consumption,
    markers,
    seeds,
    harvests,
    plans,
  ])
    if (new Set(arr.map((x) => x.id)).size !== arr.length)
      throw new Error("Duplicate record IDs.");
  return {
    schema: input.schema as number,
    supplies,
    notes,
    garden,
    favorites,
    settings,
    checklist,
    consumption,
    markers,
    seeds,
    harvests,
    plans,
  };
}
export type ValidBackup = ReturnType<typeof validateBackup>;

export async function exportBackup(sensitive: boolean, database: HavenDB = db) {
  return {
    format: "urban-haven",
    schema: BACKUP_SCHEMA,
    exported: new Date().toISOString(),
    app: "Urban Haven 2.2.0",
    supplies: await database.supplies.toArray(),
    notes: (await database.notes.toArray()).filter(
      (x) => sensitive || !x.sensitive,
    ),
    garden: await database.garden.toArray(),
    favorites: await database.favorites.toArray(),
    settings: withDefaults(await database.settings.get("preferences")),
    checklist: await database.checklist.toArray(),
    consumption: await database.consumption.toArray(),
    markers: await database.markers.toArray(),
    seeds: await database.seeds.toArray(),
    harvests: await database.harvests.toArray(),
    plans: await database.plans.toArray(),
    documentsIncluded: false,
    mapDataIncluded: false,
    note: "Imported PDFs and downloaded map packs are not included. Map markers, local photos, waypoint paths, radio presets and pet plans are included. This file is not encrypted.",
  };
}

const restoreStores = [
  "supplies",
  "notes",
  "garden",
  "favorites",
  "settings",
  "checklist",
  "consumption",
  "markers",
  "seeds",
  "harvests",
  "plans",
];
export async function restoreParsed(
  parsed: ValidBackup,
  database: HavenDB = db,
) {
  await database.transaction("rw", restoreStores, async (t) => {
    await t<Supply>("supplies").bulkPut(parsed.supplies);
    await t<Note>("notes").bulkPut(parsed.notes);
    await t<GardenEntry>("garden").bulkPut(parsed.garden);
    await t<{ id: string }>("favorites").bulkPut(parsed.favorites);
    await t<Settings>("settings").put(parsed.settings);
    await t<ChecklistState>("checklist").bulkPut(parsed.checklist);
    await t<ConsumptionEntry>("consumption").bulkPut(parsed.consumption);
    await t<MapMarker>("markers").bulkPut(parsed.markers);
    await t<SeedLot>("seeds").bulkPut(parsed.seeds);
    await t<HarvestEntry>("harvests").bulkPut(parsed.harvests);
    await t<PlanRecord>("plans").bulkPut(parsed.plans);
  });
  return parsed;
}
export async function restoreBackup(file: File, database: HavenDB = db) {
  if (file.size > MAX) throw new Error("Backup exceeds the 30 MB limit.");
  let json: unknown;
  try {
    json = JSON.parse(await file.text());
  } catch {
    throw new Error(
      "This file is not valid JSON. Choose an Urban Haven backup file.",
    );
  }
  return restoreParsed(validateBackup(json), database);
}
export async function deleteAllPersonalData(database: HavenDB = db) {
  await database.transaction("rw", database.personalStores, async (t) => {
    for (const name of database.personalStores) await t(name).clear();
  });
}
export function saveFile(data: Blob, name: string) {
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function validatePrepared(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("Invalid prepared checkbox");
  return value;
}
