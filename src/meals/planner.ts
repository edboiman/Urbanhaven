import { recipes, pantryTags, type Recipe } from "./recipes";
import type { Supply } from "../types";
import { isUsable } from "../checklist/model";

export const pantryTagOptions = pantryTags;
export type Diet = Recipe["diet"][number];
export type PlanFilters = { noCookOnly: boolean; diets: Diet[]; avoidTags: string[] };
export type PlanSlot = { recipeId: string; batches: number };
export type MealPlan = { days: number; people: number; slots: { breakfast: PlanSlot | null; main1: PlanSlot | null; main2: PlanSlot | null; snack: PlanSlot | null }[]; filters: PlanFilters; created: string };

/** Packages on hand per pantry tag, counting only usable records. */
export function pantryCounts(supplies: Supply[], today: string) {
  const counts = new Map<string, number>();
  for (const s of supplies)
    if (s.category === "food" && isUsable(s, today) && s.quantity > 0)
      for (const tag of s.pantryTags || []) counts.set(tag, (counts.get(tag) || 0) + s.quantity);
  return counts;
}

export function matchRecipe(r: Recipe, counts: Map<string, number>) {
  const required = r.ingredients.filter((i) => !i.optional && i.packages > 0);
  const missing = required.filter((i) => (counts.get(i.tag) || 0) < i.packages);
  // Staples measured in spoonfuls (oil, seasoning) have packages 0 and never block a match.
  return { recipe: r, missing, ready: missing.length === 0, have: required.length - missing.length, of: required.length };
}

export function allowed(r: Recipe, f: PlanFilters) {
  if (f.noCookOnly && r.cook === "heat-water") return false;
  if (f.diets.some((d) => !r.diet.includes(d))) return false;
  if (r.ingredients.some((i) => !i.optional && f.avoidTags.includes(i.tag))) return false;
  return true;
}

/**
 * Builds a rotating plan. Recipes that the pantry can already make are preferred;
 * the same main dish is not repeated on consecutive days when alternatives exist.
 */
export function buildPlan(days: number, people: number, filters: PlanFilters, supplies: Supply[], today: string): MealPlan {
  const counts = pantryCounts(supplies, today);
  const pool = recipes.filter((r) => allowed(r, filters));
  const rank = (meal: Recipe["meal"]) =>
    pool
      .filter((r) => r.meal === meal)
      .map((r) => ({ r, m: matchRecipe(r, counts) }))
      .sort((a, b) => Number(b.m.ready) - Number(a.m.ready) || b.m.have / b.m.of - a.m.have / a.m.of || a.r.name.localeCompare(b.r.name))
      .map((x) => x.r);
  const breakfasts = rank("breakfast");
  const mains = rank("lunch-dinner");
  const snacks = rank("snack");
  const batches = (r: Recipe) => Math.max(1, Math.ceil(people / r.serves));
  const pick = (list: Recipe[], i: number) => (list.length ? list[i % list.length] : null);
  const slots: MealPlan["slots"] = [];
  for (let d = 0; d < days; d++) {
    const b = pick(breakfasts, d);
    const m1 = pick(mains, d * 2);
    const m2 = pick(mains, d * 2 + 1);
    const s = pick(snacks, d);
    slots.push({
      breakfast: b && { recipeId: b.id, batches: batches(b) },
      main1: m1 && { recipeId: m1.id, batches: batches(m1) },
      main2: m2 && m2.id !== m1?.id ? { recipeId: m2.id, batches: batches(m2) } : m1 && { recipeId: m1.id, batches: batches(m1) },
      snack: s && { recipeId: s.id, batches: batches(s) },
    });
  }
  return { days, people, slots, filters, created: new Date().toISOString() };
}

export function planNeeds(plan: MealPlan, supplies: Supply[], today: string) {
  const counts = pantryCounts(supplies, today);
  const need = new Map<string, { tag: string; label: string; packages: number; size: string }>();
  let waterMl = 0;
  const groupsByDay: Set<string>[] = [];
  let heatMeals = 0;
  for (const day of plan.slots) {
    const groups = new Set<string>();
    for (const slot of Object.values(day)) {
      if (!slot) continue;
      const r = recipes.find((x) => x.id === slot.recipeId);
      if (!r) continue;
      waterMl += r.waterMl * slot.batches;
      if (r.cook === "heat-water") heatMeals++;
      for (const i of r.ingredients) {
        groups.add(i.group);
        if (i.optional || i.packages <= 0) continue;
        const cur = need.get(i.tag) || { tag: i.tag, label: i.label, packages: 0, size: i.size };
        cur.packages += i.packages * slot.batches;
        need.set(i.tag, cur);
      }
    }
    groupsByDay.push(groups);
  }
  const rows = [...need.values()]
    .map((x) => {
      const packages = Math.ceil(x.packages - 1e-9);
      const have = counts.get(x.tag) || 0;
      return { ...x, packages, have, gap: Math.max(0, packages - have) };
    })
    .sort((a, b) => b.gap - a.gap || a.label.localeCompare(b.label));
  return {
    rows,
    waterL: waterMl / 1000,
    heatMeals,
    daysWithFruitVeg: groupsByDay.filter((g) => g.has("fruit-veg")).length,
    daysWithProtein: groupsByDay.filter((g) => g.has("protein")).length,
    days: plan.slots.length,
  };
}

/** Pantry items whose label says refrigerate after opening. */
export function refrigerateAfterOpening(supplies: Supply[]) {
  return supplies.filter((s) => s.category === "food" && s.refrigerateAfterOpening && s.quantity > 0);
}
