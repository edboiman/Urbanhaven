// The living preparedness checklist.
//
// Quantities owned are NEVER stored on checklist rows. They are always computed
// from inventory records (supplies), so there is a single source of truth.
// Checklist state only stores household choices: custom amounts, N/A, notes,
// task completion dates and custom items.
import type {
  Basis,
  ChecklistDefinition,
  ChecklistState,
  Settings,
  Supply,
} from "../types";
import {
  supplyReviewDate,
  pastDateText,
  addCalendarMonths,
} from "../storage/dates";
import { LITERS_PER_GALLON } from "../calculators";

export const sections = [
  { id: "water", label: "Water" },
  { id: "food", label: "Food" },
  { id: "cooking", label: "Cooking & eating" },
  { id: "lighting", label: "Lighting" },
  { id: "charging", label: "Charging & power" },
  { id: "communications", label: "Communications" },
  { id: "first-aid", label: "First aid" },
  { id: "medication", label: "Medication planning" },
  { id: "sanitation", label: "Sanitation & hygiene" },
  { id: "clothing", label: "Clothing" },
  { id: "warmth", label: "Temperature protection" },
  { id: "documents", label: "Documents" },
  { id: "cash", label: "Cash" },
  { id: "evacuation", label: "Evacuation supplies" },
  { id: "plans", label: "Household plans & tools" },
  { id: "pets", label: "Pets" },
  { id: "infants", label: "Infants & young children" },
] as const;
export const sectionLabel = (id: string) =>
  sections.find((s) => s.id === id)?.label || id;

type D = ChecklistDefinition;
const q = (
  d: Omit<D, "kind" | "measure"> & Partial<Pick<D, "measure">>,
): D => ({ kind: "quantity", measure: "count", ...d });
const t = (
  d: Omit<D, "kind" | "measure" | "basis" | "rate" | "unit"> & {
    intervalDays?: number;
  },
): D => ({
  kind: "task",
  measure: "count",
  basis: "household",
  rate: 1,
  unit: "task",
  ...d,
});

/** Built-in items. IDs are stable; never reuse an ID for a different meaning. */
export const templates: D[] = [
  // WATER
  q({
    id: "water-drinking",
    section: "water",
    name: "Drinking & basic-use water",
    basis: "personDay",
    rate: LITERS_PER_GALLON,
    unit: "L",
    measure: "liters",
    autoCategory: "water",
    category: "water",
    origin: "official",
    source: "cdc-water",
    why: "CDC and Ready.gov plan on at least 1 US gallon (3.785 L) per person per day for drinking and basic sanitation. CDC suggests a 2-week supply if possible. Add more for heat, illness, pregnancy or nursing.",
  }),
  q({
    id: "water-hygiene",
    section: "water",
    name: "Extra hygiene water (washing, dishes)",
    basis: "personDay",
    rate: null,
    unit: "L",
    measure: "liters",
    category: "water",
    origin: "app",
    why: "App planning allowance, not an official figure. The 1-gallon baseline is tight for washing during a long outage. Choose your own daily amount; it is kept separate from drinking water.",
  }),
  q({
    id: "water-pets",
    section: "water",
    name: "Pet drinking water (all pets combined)",
    basis: "day",
    rate: null,
    unit: "L",
    measure: "liters",
    category: "water",
    origin: "household",
    appliesWhen: "pets",
    source: "ready-pets",
    why: "No universal pet amount. Use your pets' usual intake and your veterinarian's advice; it is set once under household and used everywhere (checklist, calculator).",
  }),
  q({
    id: "water-flush",
    section: "water",
    name: "Non-drinking water for toilet flushing (only if sewer/septic works)",
    basis: "household",
    rate: null,
    unit: "L",
    measure: "liters",
    category: "water",
    origin: "app",
    source: "egle-wells",
    optional: true,
    why: "Optional. Homes on private wells lose water when the pump loses power; Michigan EGLE suggests a few 5-gallon pails of non-drinking water for flushing. Never flush if sewer service has failed.",
  }),
  q({
    id: "water-bleach",
    section: "water",
    name: "Fresh regular unscented 5–9% chlorine bleach + dropper (check label, age and storage)",
    basis: "household",
    rate: 1,
    unit: "set",
    category: "hygiene",
    origin: "official",
    source: "cdc-safe-water",
    why: "Backup disinfection when boiling is impossible. CDC: 8 drops per gallon for 5–9% sodium hypochlorite, double for cloudy or very cold water, wait 30 minutes. Does not remove chemicals.",
  }),
  q({
    id: "water-containers",
    section: "water",
    name: "Clean food-grade refill containers",
    basis: "household",
    rate: 2,
    unit: "container",
    category: "water",
    origin: "app",
    source: "cdc-water",
    why: "App suggestion so you can collect distributed water. CDC: food-grade, tight lid, not glass, never a chemical container.",
  }),
  // FOOD
  q({
    id: "food-calories",
    section: "food",
    name: "Shelf-stable food energy",
    basis: "personDay",
    rate: 2000,
    unit: "kcal",
    measure: "kcal",
    autoCategory: "food",
    category: "food",
    origin: "app",
    source: "ready-kit",
    why: "Ready.gov recommends “at least a several-day supply of non-perishable food.” The 2,000 kcal/person/day figure and the 14-day target are this app's planning assumptions; change the daily figure under Household. Calories alone do not guarantee nutrition.",
  }),
  q({
    id: "food-opener",
    section: "food",
    name: "Manual can opener",
    basis: "household",
    rate: 1,
    unit: "opener",
    category: "cooking",
    origin: "official",
    source: "ready-kit",
    why: "Listed in Ready.gov's basic kit.",
  }),
  t({
    id: "food-diet-review",
    section: "food",
    name: "Review allergies, diets and no-cook options",
    category: "food",
    origin: "app",
    intervalDays: 365,
    why: "Check that stored food suits everyone (allergies, sodium limits, texture needs) and that some meals need no cooking or water. The Meals planner can help.",
  }),
  // COOKING
  q({
    id: "cook-utensils",
    section: "cooking",
    name: "Plates, cups and utensils (reusable or disposable)",
    basis: "person",
    rate: 1,
    unit: "set",
    category: "cooking",
    origin: "official",
    source: "ready-kit",
    why: "Ready.gov lists mess kits, paper cups, plates, paper towels and plastic utensils. One set per person is an app default.",
  }),
  t({
    id: "cook-outdoor-plan",
    section: "cooking",
    name: "Decide how you will cook if the power is out",
    category: "cooking",
    origin: "app",
    why: "A no-cook plan is the safe default. Outdoor-only stoves, grills and generators must never be used indoors or in a garage. Fuel needs come only from your appliance's published consumption (Calculators → Fuel).",
  }),
  // LIGHTING
  q({
    id: "light-flashlight",
    section: "lighting",
    name: "Flashlight or headlamp",
    basis: "person",
    rate: 1,
    unit: "light",
    category: "lighting",
    origin: "official",
    source: "ready-kit",
    why: "Ready.gov lists a flashlight. One per person is an app default so nobody needs a candle.",
  }),
  q({
    id: "light-batteries",
    section: "lighting",
    name: "Spare battery sets for lights and radio",
    basis: "person",
    rate: 2,
    unit: "set",
    category: "batteries",
    origin: "app",
    source: "ready-kit",
    why: "Ready.gov lists extra batteries. Two spare sets per person is an app suggestion; runtime varies widely by device. Link battery packs with “units per pack”.",
  }),
  t({
    id: "light-test",
    section: "lighting",
    name: "Test lights and check battery dates",
    category: "lighting",
    origin: "app",
    intervalDays: 90,
    why: "App maintenance reminder every 3 months.",
  }),
  // CHARGING
  q({
    id: "power-bank",
    section: "charging",
    name: "Charged phone power bank",
    basis: "person",
    rate: 1,
    unit: "bank",
    category: "batteries",
    origin: "official",
    source: "ready-kit",
    why: "Ready.gov lists a cell phone with chargers and a backup battery. One per person is an app default; use the Power calculator for Wh.",
  }),
  q({
    id: "power-cables",
    section: "charging",
    name: "Charging cables / car or wall chargers",
    basis: "person",
    rate: 1,
    unit: "cable",
    category: "communication",
    origin: "official",
    source: "ready-kit",
    why: "Ready.gov: “Cell phone with chargers and a backup battery.”",
  }),
  t({
    id: "power-charge",
    section: "charging",
    name: "Recharge power banks",
    category: "batteries",
    origin: "app",
    intervalDays: 90,
    why: "Stored lithium packs self-discharge. App reminder every 3 months.",
  }),
  // COMMUNICATIONS
  q({
    id: "comm-radio",
    section: "communications",
    name: "Battery or hand-crank radio with NOAA Weather Radio (tone alert)",
    basis: "household",
    rate: 1,
    unit: "radio",
    category: "communication",
    origin: "official",
    source: "ready-kit",
    why: "Listed in Ready.gov's basic kit.",
  }),
  q({
    id: "comm-whistle",
    section: "communications",
    name: "Whistle to signal for help",
    basis: "person",
    rate: 1,
    unit: "whistle",
    category: "communication",
    origin: "official",
    source: "ready-kit",
    why: "Ready.gov lists a whistle. One per person is an app default.",
  }),
  q({
    id: "comm-maps",
    section: "communications",
    name: "Paper local / Michigan road map",
    basis: "household",
    rate: 1,
    unit: "map",
    category: "documents",
    origin: "official",
    source: "ready-kit",
    why: "Ready.gov lists local maps. The in-app map is a supplement, not a replacement.",
  }),
  t({
    id: "comm-plan",
    section: "communications",
    name: "Write a household communication plan",
    category: "documents",
    origin: "official",
    source: "ready-plan",
    intervalDays: 365,
    why: "Ready.gov's card: everyone's numbers, an in-case-of-emergency contact, an out-of-town contact, school/work plans and important numbers. Keep a paper copy.",
  }),
  // FIRST AID
  q({
    id: "aid-kit",
    section: "first-aid",
    name: "First aid kit",
    basis: "household",
    rate: 1,
    unit: "kit",
    category: "first aid",
    origin: "official",
    source: "ready-kit",
    why: "Listed in Ready.gov's basic kit.",
  }),
  t({
    id: "aid-otc",
    section: "first-aid",
    name: "Check non-prescription medicines and dates",
    category: "first aid",
    origin: "official",
    source: "ready-kit",
    intervalDays: 180,
    why: "Ready.gov lists pain relievers, anti-diarrhea medication, antacids and laxatives. Choose products with a pharmacist; the app sets no doses.",
  }),
  q({
    id: "aid-masks",
    section: "first-aid",
    name: "Dust masks",
    basis: "person",
    rate: 2,
    unit: "mask",
    category: "first aid",
    origin: "official",
    source: "ready-kit",
    why: "Ready.gov lists a dust mask. Two per person is an app default.",
  }),
  // MEDICATION
  t({
    id: "med-list",
    section: "medication",
    name: "Printed medication & allergy list",
    category: "medication",
    origin: "app",
    intervalDays: 180,
    why: "Names, doses, prescribers, pharmacy and allergies on paper for every person, so responders and pharmacies can help if phones are dead.",
  }),
  t({
    id: "med-supply-plan",
    section: "medication",
    name: "Ask your prescriber/pharmacist about an emergency supply",
    category: "medication",
    origin: "official",
    source: "ready-kit",
    appliesWhen: "prescriptions",
    intervalDays: 365,
    why: "Ready.gov lists prescription medications. Amounts, refills and storage (including refrigerated medicines) are individual decisions for your prescriber and pharmacist; this app sets no quantity.",
  }),
  t({
    id: "med-power-plan",
    section: "medication",
    name: "Backup plan for power-dependent medical equipment",
    category: "medication",
    origin: "app",
    appliesWhen: "power-medical",
    intervalDays: 365,
    why: "Know runtime, backup power options, where to relocate and whom to call. Ask your equipment supplier; tell your utility if it has a medical-needs program.",
  }),
  q({
    id: "med-glasses",
    section: "medication",
    name: "Spare glasses / contact lens solution",
    basis: "household",
    rate: 1,
    unit: "set",
    category: "medication",
    origin: "official",
    source: "ready-kit",
    appliesWhen: "glasses",
    why: "Listed in Ready.gov's additional supplies.",
  }),
  // SANITATION
  q({
    id: "san-bucket",
    section: "sanitation",
    name: "Bucket with tight lid for an emergency toilet",
    basis: "household",
    rate: 1,
    unit: "bucket",
    category: "hygiene",
    origin: "official",
    source: "king-county-toilet",
    why: "Public-health guidance for sewer outages: line a sturdy pail with two heavy bags and keep it covered.",
  }),
  q({
    id: "san-bags",
    section: "sanitation",
    name: "Heavy-duty garbage bags (toilet liners & trash)",
    basis: "personDay",
    rate: 1,
    unit: "bag",
    category: "hygiene",
    origin: "app",
    source: "ready-kit",
    why: "Ready.gov lists garbage bags and plastic ties. One bag per person per day is an app starting point; adjust after a trial.",
  }),
  q({
    id: "san-absorbent",
    section: "sanitation",
    name: "Absorbent for toilet waste (cat litter / sawdust)",
    basis: "householdWeek",
    rate: 1,
    unit: "bag",
    category: "hygiene",
    origin: "app",
    source: "king-county-toilet",
    why: "App starting point: one bag per household per week. Adjust to your bag size and household.",
  }),
  q({
    id: "san-tp",
    section: "sanitation",
    name: "Toilet paper",
    basis: "personWeek",
    rate: 2,
    unit: "roll",
    category: "hygiene",
    origin: "app",
    why: "App starting point: 2 rolls per person per week.",
  }),
  q({
    id: "san-soap",
    section: "sanitation",
    name: "Soap and hand sanitizer (≥60% alcohol)",
    basis: "household",
    rate: 2,
    unit: "item",
    category: "hygiene",
    origin: "official",
    source: "cdc-hygiene",
    why: "Ready.gov lists soap and sanitizer; CDC specifies at least 60% alcohol. Sanitizer works poorly on visibly dirty hands.",
  }),
  q({
    id: "san-wipes",
    section: "sanitation",
    name: "Moist towelettes / wipes",
    basis: "personWeek",
    rate: 1,
    unit: "pack",
    category: "hygiene",
    origin: "official",
    source: "ready-kit",
    why: "Ready.gov lists moist towelettes for sanitation. One pack per person per week is an app default.",
  }),
  q({
    id: "san-disinfect",
    section: "sanitation",
    name: "Disinfecting wipes or cleaner",
    basis: "household",
    rate: 1,
    unit: "item",
    category: "hygiene",
    origin: "official",
    source: "ready-kit",
    why: "Ready.gov: soap, hand sanitizer and disinfecting wipes. Never mix bleach with other cleaners.",
  }),
  t({
    id: "san-feminine",
    section: "sanitation",
    name: "Feminine and personal hygiene supplies",
    category: "hygiene",
    origin: "official",
    source: "ready-kit",
    why: "Listed in Ready.gov's additional supplies; amounts are personal.",
  }),
  // CLOTHING
  q({
    id: "cloth-change",
    section: "clothing",
    name: "Complete change of clothing",
    basis: "person",
    rate: 1,
    unit: "set",
    category: "clothing",
    origin: "official",
    source: "ready-kit",
    why: "Ready.gov: a complete change of clothing appropriate for your climate.",
  }),
  q({
    id: "cloth-shoes",
    section: "clothing",
    name: "Sturdy shoes",
    basis: "person",
    rate: 1,
    unit: "pair",
    category: "clothing",
    origin: "official",
    source: "ready-kit",
    why: "Listed in Ready.gov's additional supplies.",
  }),
  // WARMTH
  q({
    id: "warm-bedding",
    section: "warmth",
    name: "Sleeping bag or warm blanket",
    basis: "person",
    rate: 1,
    unit: "item",
    category: "shelter",
    origin: "official",
    source: "ready-kit",
    why: "Ready.gov: a sleeping bag or warm blanket for each person.",
  }),
  q({
    id: "warm-layers",
    section: "warmth",
    name: "Hat, gloves and warm layers for a Michigan winter outage",
    basis: "person",
    rate: 1,
    unit: "set",
    category: "clothing",
    origin: "app",
    why: "App item for Michigan winters. Never heat a home with an oven, grill, camp stove or generator; plan to relocate if indoor cold becomes unsafe.",
  }),
  t({
    id: "warm-alarms",
    section: "warmth",
    name: "Test smoke and carbon monoxide alarms",
    category: "shelter",
    origin: "official",
    source: "usfa-smoke",
    intervalDays: 30,
    why: "U.S. Fire Administration: test smoke alarms at least once a month. Test CO alarms with the same routine and follow the manufacturer's instructions.",
  }),
  // DOCUMENTS
  q({
    id: "doc-copies",
    section: "documents",
    name: "Copies of ID, insurance and bank records (waterproof container)",
    basis: "household",
    rate: 1,
    unit: "packet",
    category: "documents",
    origin: "official",
    source: "ready-kit",
    why: "Ready.gov lists important family documents; they may be kept electronically or in a waterproof, portable container.",
  }),
  q({
    id: "doc-paper",
    section: "documents",
    name: "Paper and pencil",
    basis: "household",
    rate: 1,
    unit: "set",
    category: "documents",
    origin: "official",
    source: "ready-kit",
    why: "Listed in Ready.gov's additional supplies.",
  }),
  // CASH
  q({
    id: "cash-small",
    section: "cash",
    name: "Cash in small bills",
    basis: "fixed",
    rate: null,
    unit: "USD",
    category: "documents",
    origin: "household",
    source: "ready-kit",
    why: "Ready.gov lists cash. There is no official amount; set a target that fits your household. Card readers and ATMs may not work in an outage.",
  }),
  // EVACUATION
  t({
    id: "evac-bag",
    section: "evacuation",
    name: "Pack a grab-and-go bag for each person",
    category: "evacuation",
    origin: "app",
    intervalDays: 365,
    why: "A portable subset: water, snacks, light, radio, first aid, medicines, document copies, cash, phone charger, clothing. Leaving early is safer than leaving late.",
  }),
  q({
    id: "evac-keys",
    section: "evacuation",
    name: "Spare house and car keys",
    basis: "household",
    rate: 1,
    unit: "set",
    category: "tools",
    origin: "app",
    why: "App item: a spare set kept with your go-bag avoids a lock-out when you leave in a hurry.",
  }),
  t({
    id: "evac-transport",
    section: "evacuation",
    name: "Arrange transportation if you have no vehicle or need assistance",
    category: "evacuation",
    origin: "app",
    appliesWhen: "no-vehicle",
    intervalDays: 365,
    why: "Agree with a neighbor, family member or local service before an emergency. Write the plan in your notebook.",
  }),
  t({
    id: "evac-mobility",
    section: "evacuation",
    name: "Plan accessible exits and mobility-aid backup",
    category: "evacuation",
    origin: "app",
    appliesWhen: "mobility",
    intervalDays: 365,
    why: "Spare batteries/charging for mobility devices, a helper network, and an exit route that works without an elevator.",
  }),
  // PLANS & TOOLS
  t({
    id: "plan-meeting",
    section: "plans",
    name: "Choose meeting places (indoor, neighborhood, out-of-town)",
    category: "documents",
    origin: "official",
    source: "ready-plan",
    intervalDays: 365,
    why: "Ready.gov's communication plan card asks for indoor, neighborhood, out-of-neighborhood and out-of-town meeting places. Save them as map markers too.",
  }),
  t({
    id: "plan-shutoffs",
    section: "plans",
    name: "Locate and label water and electrical shutoffs",
    category: "tools",
    origin: "app",
    intervalDays: 365,
    why: "Know where they are before you need them. Gas: only the utility or a qualified professional should restore service.",
  }),
  q({
    id: "plan-wrench",
    section: "plans",
    name: "Wrench or pliers (utility shutoffs)",
    basis: "household",
    rate: 1,
    unit: "tool",
    category: "tools",
    origin: "official",
    source: "ready-kit",
    why: "Listed in Ready.gov's basic kit.",
  }),
  q({
    id: "plan-sheeting",
    section: "plans",
    name: "Plastic sheeting, scissors and duct tape",
    basis: "household",
    rate: 1,
    unit: "set",
    category: "tools",
    origin: "official",
    source: "ready-kit",
    why: "Ready.gov: to shelter in place. Follow official instructions about which hazard needs sealing.",
  }),
  q({
    id: "plan-extinguisher",
    section: "plans",
    name: "Fire extinguisher",
    basis: "household",
    rate: 1,
    unit: "extinguisher",
    category: "tools",
    origin: "official",
    source: "ready-kit",
    why: "Listed in Ready.gov's additional supplies. Check the gauge as the label directs.",
  }),
  t({
    id: "plan-practice",
    section: "plans",
    name: "Review the kit and practice the plan",
    category: "documents",
    origin: "official",
    source: "ready-kit",
    intervalDays: 365,
    why: "Ready.gov: “Re-think your needs every year and update your kit as your family's needs change.”",
  }),
  t({
    id: "plan-rotate-water",
    section: "plans",
    name: "Replace self-filled stored water",
    category: "water",
    origin: "official",
    source: "cdc-water",
    intervalDays: 182,
    why: "CDC: replace stored water every six months; follow dates on commercially bottled water.",
  }),
  // PETS
  q({
    id: "pet-food",
    section: "pets",
    name: "Pet food (sealed, waterproof container)",
    basis: "petDay",
    rate: null,
    unit: "serving",
    category: "pets",
    origin: "household",
    appliesWhen: "pets",
    source: "ready-pets",
    why: "Ready.gov lists pet food. Enter servings per pet per day from your pet's normal diet; there is no universal amount.",
  }),
  t({
    id: "pet-records",
    section: "pets",
    name: "Pet medicines, vaccination records and photo",
    category: "pets",
    origin: "official",
    source: "ready-pets",
    appliesWhen: "pets",
    intervalDays: 365,
    why: "From Ready.gov's pet preparedness guidance.",
  }),
  q({
    id: "pet-carrier",
    section: "pets",
    name: "Carrier or leash, collar and ID tag",
    basis: "pet",
    rate: 1,
    unit: "set",
    category: "pets",
    origin: "official",
    source: "ready-pets",
    appliesWhen: "pets",
    why: "From Ready.gov's pet preparedness guidance.",
  }),
  q({
    id: "pet-sanitation",
    section: "pets",
    name: "Litter / waste bags",
    basis: "householdWeek",
    rate: null,
    unit: "pack",
    category: "pets",
    origin: "household",
    appliesWhen: "pets",
    why: "No universal amount — set what your animals use in a typical week.",
  }),
  // INFANTS
  q({
    id: "infant-formula",
    section: "infants",
    name: "Infant formula or food",
    basis: "infantDay",
    rate: null,
    unit: "serving",
    category: "food",
    origin: "household",
    appliesWhen: "infant",
    source: "ready-kit",
    why: "Ready.gov lists infant formula, bottles, diapers, wipes and diaper rash cream. Feeding amounts are individual; ask your pediatrician. Ready-to-feed formula needs no water.",
  }),
  q({
    id: "infant-diapers",
    section: "infants",
    name: "Diapers",
    basis: "infantDay",
    rate: null,
    unit: "diaper",
    category: "hygiene",
    origin: "household",
    appliesWhen: "infant",
    source: "ready-kit",
    why: "Enter your child's usual daily number.",
  }),
  q({
    id: "infant-bottles",
    section: "infants",
    name: "Bottles, wipes and diaper cream",
    basis: "household",
    rate: 1,
    unit: "set",
    category: "hygiene",
    origin: "official",
    appliesWhen: "infant",
    source: "ready-kit",
    why: "Listed in Ready.gov's additional supplies.",
  }),
];

export type Household = {
  people: number;
  infants: number;
  pets: number;
  days: number;
  needs: string[];
  dailyCalories: number;
  petWaterLiters: number;
};
export const household = (s: Settings): Household => ({
  people: Math.max(1, Math.round(s.people || 1)),
  infants: Math.max(0, Math.round(s.infants || 0)),
  pets: Math.max(0, Math.round(s.pets || 0)),
  days: Math.max(1, Math.round(s.days || 14)),
  needs: s.needs || [],
  dailyCalories: s.dailyCalories || 2000,
  petWaterLiters: s.petWaterLiters || 0,
});

export const basisLabel: Record<Basis, string> = {
  personDay: "per person per day",
  personWeek: "per person per week",
  person: "per person",
  petDay: "per pet per day",
  pet: "per pet",
  infantDay: "per infant per day",
  day: "per day (household)",
  household: "per household",
  householdWeek: "per household per week",
  fixed: "total",
};
export function multiplier(basis: Basis, h: Household) {
  const weeks = Math.ceil(h.days / 7);
  switch (basis) {
    case "personDay":
      return {
        n: h.people * h.days,
        text: `${h.people} ${h.people === 1 ? "person" : "people"} × ${h.days} days`,
      };
    case "personWeek":
      return {
        n: h.people * weeks,
        text: `${h.people} ${h.people === 1 ? "person" : "people"} × ${weeks} wk`,
      };
    case "person":
      return {
        n: h.people,
        text: `${h.people} ${h.people === 1 ? "person" : "people"}`,
      };
    case "petDay":
      return {
        n: h.pets * h.days,
        text: `${h.pets} pet${h.pets === 1 ? "" : "s"} × ${h.days} days`,
      };
    case "pet":
      return { n: h.pets, text: `${h.pets} pet${h.pets === 1 ? "" : "s"}` };
    case "infantDay":
      return {
        n: h.infants * h.days,
        text: `${h.infants} infant${h.infants === 1 ? "" : "s"} × ${h.days} days`,
      };
    case "day":
      return { n: h.days, text: `${h.days} days` };
    case "householdWeek":
      return { n: weeks, text: `${weeks} wk` };
    case "household":
    case "fixed":
      return { n: 1, text: "household" };
  }
}

export type Status = "ready" | "partial" | "needed" | "inspect" | "na";
export const statusLabel: Record<Status, string> = {
  ready: "Ready",
  partial: "Partially stocked",
  needed: "Needed",
  inspect: "Needs inspection",
  na: "Not applicable",
};
export type Row = {
  def: ChecklistDefinition;
  state?: ChecklistState;
  name: string;
  status: Status;
  rate: number | null;
  required: number;
  owned: number;
  gap: number;
  unit: string;
  linked: Supply[];
  usable: Supply[];
  locations: string[];
  nextExpiry: string;
  dueDate: string;
  reasons: string[];
  explanation: string;
};

export const fmt = (n: number, unit: string) => {
  if (unit === "L")
    return `${n.toFixed(1)} L (${(n / LITERS_PER_GALLON).toFixed(1)} gal)`;
  if (unit === "kcal") return `${Math.round(n).toLocaleString()} kcal`;
  if (unit === "USD") return `$${Math.round(n).toLocaleString()}`;
  return `${Math.round(n * 100) / 100} ${unit}`;
};
const addDays = (date: string, days: number) => {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export function supplyMeasure(
  s: Supply,
  measure: ChecklistDefinition["measure"],
) {
  if (measure === "liters")
    return s.quantity * (s.waterLiters > 0 ? s.waterLiters : s.perUnit || 0);
  if (measure === "kcal") return s.quantity * s.servings * s.calories;
  return s.quantity * (s.perUnit && s.perUnit > 0 ? s.perUnit : 1);
}
export const isUsable = (s: Supply, today: string) =>
  s.condition === "ready" &&
  (!supplyReviewDate(s) || supplyReviewDate(s) >= today);

export function applies(def: ChecklistDefinition, h: Household) {
  switch (def.appliesWhen) {
    case undefined:
      return true;
    case "pets":
      return h.pets > 0;
    case "infant":
      return h.infants > 0 || h.needs.includes("infant");
    default:
      return h.needs.includes(def.appliesWhen);
  }
}

/** Effective rate: household choice first, then special settings, then the template default. */
export function effectiveRate(
  def: ChecklistDefinition,
  state: ChecklistState | undefined,
  h: Household,
) {
  if (def.id === "water-pets")
    return h.petWaterLiters > 0 ? h.petWaterLiters : (state?.rate ?? null);
  if (def.id === "food-calories") return state?.rate ?? h.dailyCalories;
  return state?.rate ?? def.rate;
}

export function computeRow(
  def: ChecklistDefinition,
  state: ChecklistState | undefined,
  supplies: Supply[],
  h: Household,
  today: string,
): Row {
  const name = state?.name || def.name;
  const linked = supplies.filter((s) =>
    s.checklistId
      ? s.checklistId === def.id
      : !!def.autoCategory && s.category === def.autoCategory,
  );
  const usable = linked.filter((s) => isUsable(s, today));
  const expired = linked.filter(
    (s) => supplyReviewDate(s) && supplyReviewDate(s) < today && s.quantity > 0,
  );
  const unchecked = linked.filter(
    (s) => s.condition === "needs-check" && s.quantity > 0,
  );
  const damaged = linked.filter(
    (s) => s.condition === "damaged" && s.quantity > 0,
  );
  const locations = [...new Set(usable.map((s) => s.location).filter(Boolean))];
  const nextExpiry =
    usable
      .map((s) => supplyReviewDate(s))
      .filter(Boolean)
      .sort()[0] || "";
  const base = { def, state, name, linked, usable, locations, nextExpiry };
  const reasons: string[] = [];
  if (!applies(def, h) || state?.na) {
    return {
      ...base,
      status: "na",
      rate: null,
      required: 0,
      owned: 0,
      gap: 0,
      unit: def.unit,
      dueDate: "",
      reasons: [
        state?.na
          ? "Marked not applicable by you."
          : "Does not apply to your household settings.",
      ],
      explanation: "",
    };
  }
  if (def.kind === "task") {
    const interval = state?.intervalDays ?? def.intervalDays;
    const dueDate =
      state?.lastDone && interval ? addDays(state.lastDone, interval) : "";
    let status: Status = state?.lastDone ? "ready" : "needed";
    if (state?.lastDone) reasons.push(`Done ${state.lastDone}.`);
    else reasons.push("Not marked done yet.");
    if (dueDate && dueDate < today) {
      status = "inspect";
      reasons.push(`Overdue since ${dueDate} (repeat every ${interval} days).`);
    } else if (dueDate) reasons.push(`Next due ${dueDate}.`);
    if (state?.inspect) {
      status = "inspect";
      reasons.push("Flagged for inspection by you.");
    }
    return {
      ...base,
      status,
      rate: null,
      required: 1,
      owned: state?.lastDone ? 1 : 0,
      gap: 0,
      unit: "task",
      dueDate,
      reasons,
      explanation: "",
    };
  }
  const rate = effectiveRate(def, state, h);
  const m = multiplier(def.basis, h);
  const owned = usable.reduce((n, s) => n + supplyMeasure(s, def.measure), 0);
  if (rate === null && def.optional && owned === 0) {
    return {
      ...base,
      status: "na",
      rate,
      required: 0,
      owned,
      gap: 0,
      unit: def.unit,
      dueDate: "",
      reasons: [
        "Optional — set an amount (Edit amount) to include it in your plan.",
      ],
      explanation: "",
    };
  }
  if (rate === null) {
    return {
      ...base,
      status: owned > 0 ? "partial" : "needed",
      rate,
      required: 0,
      owned,
      gap: 0,
      unit: def.unit,
      dueDate: "",
      reasons: [
        "Set the amount your household needs — there is no universal figure for this item.",
      ],
      explanation: `Amount not set. Counted ${fmt(owned, def.unit)} from ${usable.length} usable inventory record${usable.length === 1 ? "" : "s"}.`,
    };
  }
  let required = rate * m.n;
  if (def.measure === "count") required = Math.ceil(required - 1e-9);
  const gap = Math.max(0, required - owned);
  let status: Status =
    required <= 0
      ? "ready"
      : owned >= required - 1e-9
        ? "ready"
        : owned > 0
          ? "partial"
          : "needed";
  const rateText =
    def.unit === "L"
      ? `${rate.toFixed(2)} L`
      : def.unit === "kcal"
        ? `${rate.toLocaleString()} kcal`
        : `${rate} ${def.unit}`;
  const excluded: string[] = [];
  if (expired.length)
    excluded.push(`${expired.length} past a label / review / rotation date`);
  if (unchecked.length) excluded.push(`${unchecked.length} needing a check`);
  if (damaged.length) excluded.push(`${damaged.length} damaged`);
  const explanation =
    `Required ${fmt(required, def.unit)} = ${rateText} ${basisLabel[def.basis]}${def.basis === "household" || def.basis === "fixed" ? "" : ` × ${m.text}`}. ` +
    `Counted ${fmt(owned, def.unit)} from ${usable.length} usable inventory record${usable.length === 1 ? "" : "s"}` +
    (excluded.length ? ` (not counted: ${excluded.join(", ")})` : "") +
    `. ${gap > 0 ? `Gap ${fmt(gap, def.unit)}.` : "No gap."}`;
  if (gap > 0) reasons.push(`Short by ${fmt(gap, def.unit)}.`);
  if (expired.length || unchecked.length || state?.inspect) {
    status = "inspect";
    if (expired.length)
      reasons.push(
        `${expired.length} linked record${expired.length > 1 ? "s are" : " is"} past a label or review date. They are excluded pending review; a food quality date alone does not prove it is unsafe.`,
      );
    if (unchecked.length)
      reasons.push(
        `${unchecked.length} linked record${unchecked.length > 1 ? "s need" : " needs"} checking.`,
      );
    if (state?.inspect) reasons.push("Flagged for inspection by you.");
  }
  if (damaged.length)
    reasons.push(
      `${damaged.length} damaged record${damaged.length > 1 ? "s" : ""} not counted.`,
    );
  return {
    ...base,
    status,
    rate,
    required,
    owned,
    gap,
    unit: def.unit,
    dueDate: "",
    reasons,
    explanation,
  };
}

export function allDefinitions(states: ChecklistState[]) {
  const custom = states.filter((s) => s.custom).map((s) => s.custom!);
  return [...templates, ...custom];
}

export function computeChecklist(
  settings: Settings,
  supplies: Supply[],
  states: ChecklistState[],
  today: string,
) {
  const h = household(settings);
  const byId = new Map(states.map((s) => [s.id, s]));
  const rows = allDefinitions(states)
    .filter((d) => !byId.get(d.id)?.hidden)
    .map((d) => computeRow(d, byId.get(d.id), supplies, h, today));
  const hidden = allDefinitions(states).filter((d) => byId.get(d.id)?.hidden);
  const count = (s: Status) => rows.filter((r) => r.status === s).length;
  const summary = {
    ready: count("ready"),
    partial: count("partial"),
    needed: count("needed"),
    inspect: count("inspect"),
    na: count("na"),
    applicable: rows.length - count("na"),
  };
  return { rows, hidden, summary, household: h };
}

export function shoppingList(rows: Row[]) {
  return rows
    .filter(
      (r) =>
        r.def.kind === "quantity" &&
        r.status !== "na" &&
        (r.gap > 0 || (r.rate === null && r.owned === 0)),
    )
    .map((r) => ({
      id: r.def.id,
      section: r.def.section,
      name: r.name,
      gap: r.gap,
      unit: r.unit,
      unset: r.rate === null,
    }));
}

export type Reminder = {
  id: string;
  text: string;
  due: string;
  kind: "task" | "expiry" | "rotation";
  link: string;
};
export function reminders(
  rows: Row[],
  supplies: Supply[],
  today: string,
  horizonDays = 30,
): Reminder[] {
  const horizon = addDays(today, horizonDays);
  const out: Reminder[] = [];
  for (const r of rows)
    if (
      r.def.kind === "task" &&
      r.dueDate &&
      r.dueDate <= horizon &&
      r.status !== "na"
    )
      out.push({
        id: "task-" + r.def.id,
        text: r.name,
        due: r.dueDate,
        kind: "task",
        link: "checklist",
      });
  for (const s of supplies) {
    if (s.quantity <= 0) continue;
    const due = supplyReviewDate(s);
    if (due && due <= horizon)
      out.push({
        id: "exp-" + s.id,
        text: `${s.name}: ${due < today ? pastDateText(s) : "label / review / rotation date approaching"}`,
        due,
        kind:
          !s.expires && s.waterType === "self-filled" ? "rotation" : "expiry",
        link: "supplies",
      });
    else if (
      s.category === "water" &&
      !s.expires &&
      (!s.waterType || s.waterType === "unknown") &&
      s.acquired &&
      addCalendarMonths(s.acquired, 6) <= horizon
    )
      out.push({
        id: "rot-" + s.id,
        text: `${s.name}: confirm water type and date. Self-filled water rotates every 6 months; commercial bottles follow the manufacturer’s date.`,
        due: addCalendarMonths(s.acquired, 6),
        kind: "rotation",
        link: "supplies",
      });
  }
  return out.sort((a, b) => a.due.localeCompare(b.due));
}

/** Maps v1.0.0 self-report checkpoints to checklist tasks (one time). */
export const v1CheckMap: Record<string, string[]> = {
  medical: ["med-list"],
  power: ["light-test", "power-charge"],
  sanitation: ["san-feminine"],
  communication: ["comm-plan"],
  shelter: ["warm-alarms"],
  "emergency planning": ["plan-meeting", "plan-practice"],
};

export function toCSV(rows: Row[]) {
  const esc = (v: string | number) => {
    const s = String(v);
    const safe = /^[=+\-@]/.test(s) ? "'" + s : s; // prevent spreadsheet formula injection
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const head = [
    "Section",
    "Item",
    "Type",
    "Status",
    "Required",
    "Owned",
    "Gap",
    "Unit",
    "Locations",
    "Next expiry/rotation",
    "Basis",
    "Origin",
    "Notes",
  ];
  const lines = rows.map((r) =>
    [
      sectionLabel(r.def.section),
      r.name,
      r.def.kind,
      statusLabel[r.status],
      r.def.kind === "task"
        ? ""
        : r.rate === null
          ? "not set"
          : Math.round(r.required * 100) / 100,
      r.def.kind === "task"
        ? r.state?.lastDone || ""
        : Math.round(r.owned * 100) / 100,
      r.def.kind === "task" ? "" : Math.round(r.gap * 100) / 100,
      r.unit,
      r.locations.join("; "),
      r.nextExpiry || r.dueDate,
      basisLabel[r.def.basis],
      r.def.origin === "official"
        ? "Official source"
        : r.def.origin === "app"
          ? "App assumption"
          : "Household amount",
      r.state?.notes || "",
    ]
      .map(esc)
      .join(","),
  );
  return [head.join(","), ...lines].join("\n");
}
