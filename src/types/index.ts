export const categories = [
  "water",
  "food",
  "farming",
  "sanitation",
  "power",
  "climate",
  "medical",
  "communications",
  "shelter",
  "repairs",
] as const;
export type Category = (typeof categories)[number];
export type Guide = {
  id: string;
  title: string;
  category: Category;
  summary: string;
  when: string;
  needs: string[];
  steps: string[];
  warnings: string[];
  mistakes: string[];
  alternatives: string[];
  quick: string[];
  sources: {
    organization: string;
    title: string;
    url: string;
    verified: string;
  }[];
  related: string[];
  region: string;
  updated: string;
  tags: string[];
};
export const supplyCategories = [
  "water",
  "food",
  "first aid",
  "medication",
  "batteries",
  "lighting",
  "cooking",
  "hygiene",
  "clothing",
  "shelter",
  "communication",
  "tools",
  "documents",
  "pets",
  "other",
] as const;
export type SupplyCategory = (typeof supplyCategories)[number];
export const conditions = ["ready", "needs-check", "damaged"] as const;
export type Supply = {
  id: string;
  name: string;
  category: SupplyCategory;
  quantity: number;
  unit: string;
  location: string;
  expires: string;
  acquired: string;
  condition: string;
  notes: string;
  lowStock: number;
  waterLiters: number;
  servings: number;
  calories: number;
  /** v2: checklist item this record counts toward ("" = automatic by category). */
  checklistId?: string;
  /** v2: how many checklist units one inventory unit provides (e.g. a 4-pack of batteries = 4). */
  perUnit?: number;
  /** v2: pantry tags used by the meal planner (e.g. "beans", "tuna"). */
  pantryTags?: string[];
  /** v2: optional nutrition fields from the label. */
  sodiumMg?: number;
  proteinG?: number;
  /** v2: food needs refrigeration once opened. */
  refrigerateAfterOpening?: boolean;
};
export type ConsumptionEntry = {
  id: string;
  supplyId: string;
  supplyName: string;
  date: string;
  amount: number;
  unit: string;
  reason: "used" | "damaged" | "expired" | "discarded" | "restocked" | "corrected";
  note: string;
};
export type Note = {
  id: string;
  title: string;
  body: string;
  tags: string;
  sensitive: boolean;
  updated: string;
};
export type GardenEntry = {
  id: string;
  cropId: string;
  name: string;
  location: string;
  planted: string;
  reminder: string;
  seeds: number;
  harvest: number;
  notes: string;
  /** v2 fields (optional so v1 records stay valid) */
  method?: string;
  stage?: "planned" | "sown" | "transplanted" | "growing" | "harvesting" | "finished" | "failed";
  seedLotId?: string;
  reminderNote?: string;
};
export type SeedLot = {
  id: string;
  cropId: string;
  variety: string;
  source: string;
  packedFor: string;
  quantity: number;
  unit: string;
  location: string;
  notes: string;
  tests: { date: string; sown: number; sprouted: number }[];
};
export type HarvestEntry = {
  id: string;
  entryId: string;
  date: string;
  grams: number;
  notes: string;
};
export type Crop = {
  id: string;
  name: string;
  group: string;
  environment: string;
  difficulty: string;
  light: string;
  water: string;
  containerDepth: string;
  harvestDays: number[];
  harvestFrom: "sowing" | "transplant" | "planting";
  season: string;
  problems: string;
  calories: string;
  calorieClass: "starch" | "moderate" | "low";
  springOffsetWeeks: number;
  fallWeeksBeforeFrost: number | null;
  seedStartWeeks: number;
  sourceUrl: string;
  /* v2 extension (all present in bundled data) */
  start: string;
  frost: "hardy" | "semi-hardy" | "tender";
  soilTemp: string;
  spacing: string;
  medium: string;
  indoor: string;
  container: string;
  seedLife: string;
  varieties: string;
  limits: string;
  sources: { organization: string; title: string; url: string; verified: string }[];
};
export type LocalDocument = {
  id: string;
  name: string;
  bytes: Blob;
  size: number;
  added: string;
  sha256: string;
};
export const needsFlags = [
  "infant",
  "child",
  "older-adult",
  "mobility",
  "power-medical",
  "prescriptions",
  "glasses",
  "hearing-vision",
  "dietary",
  "no-vehicle",
] as const;
export type NeedFlag = (typeof needsFlags)[number];
export type Settings = {
  id: "preferences";
  theme: "light" | "dark";
  largeText: boolean;
  emergency: boolean;
  people: number;
  pets: number;
  petWaterLiters: number;
  days: number;
  dailyCalories: number;
  region: string;
  lastFrost: string;
  firstFrost: string;
  checks: string[];
  /* v2 (optional; defaults applied on read) */
  infants?: number;
  needs?: NeedFlag[];
  hygieneLiters?: number;
  gardenZone?: string;
  checklistMigrated?: boolean;
};
export type ChecklistState = {
  id: string;
  custom?: ChecklistDefinition;
  rate?: number;
  name?: string;
  na?: boolean;
  inspect?: boolean;
  hidden?: boolean;
  notes?: string;
  lastDone?: string;
  intervalDays?: number;
  updated: string;
};
export type Basis =
  | "personDay"
  | "personWeek"
  | "person"
  | "petDay"
  | "pet"
  | "infantDay"
  | "day"
  | "household"
  | "householdWeek"
  | "fixed";
export type ChecklistDefinition = {
  id: string;
  section: string;
  name: string;
  kind: "quantity" | "task";
  basis: Basis;
  /** null means: the household must enter its own amount (no universal number). */
  rate: number | null;
  unit: string;
  measure: "liters" | "kcal" | "count";
  /** Supply category counted automatically when a record has no explicit link. */
  autoCategory?: string;
  /** Supply category suggested for new linked inventory. */
  category: string;
  origin: "official" | "app" | "household";
  why: string;
  source?: string;
  appliesWhen?: "pets" | "infant" | "prescriptions" | "glasses" | "power-medical" | "mobility" | "no-vehicle";
  intervalDays?: number;
  /** Optional items count as not applicable until the household sets an amount. */
  optional?: boolean;
};
export type MapMarker = {
  id: string;
  name: string;
  kind: "meeting" | "contact" | "supply" | "water" | "medical" | "shelter" | "other";
  lat: number;
  lon: number;
  notes: string;
  created: string;
  updated: string;
};
export type MapPackRecord = {
  id: string;
  version: string;
  sha256: string;
  bytes: number;
  installed: string;
  verified: string;
  name?: string;
  bbox?: [number, number, number, number];
  parts?: { file: string; bytes: number; sha256: string }[];
};
export type PlanRecord = { id: string; data: unknown; updated: string };
