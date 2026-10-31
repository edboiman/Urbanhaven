import { test } from "node:test";
import assert from "node:assert/strict";
import { crops } from "../src/content";
import { cropDates, stations, stationDate, seasonYear, germinationRate, sowingAdvice } from "../src/garden/plan";
import { buildPlan, planNeeds, matchRecipe, pantryCounts } from "../src/meals/planner";
import { recipes } from "../src/meals/recipes";
import type { Supply } from "../src/types";

test("frost dates differ by region; no single statewide date", () => {
  const detroit = stations.find((s) => s.name === "Detroit city")!;
  const vanderbilt = stations.find((s) => s.name === "Vanderbilt")!;
  const alpenaCity = stations.find((s) => s.name === "Alpena")!;
  const alpenaAirport = stations.find((s) => s.name === "Alpena WSO")!;
  assert.equal(stationDate(detroit, "p50", 2027), "2027-04-24");
  assert.equal(stationDate(vanderbilt, "p50", 2027), "2027-06-20");
  assert.ok(alpenaCity.p50 < alpenaAirport.p50, "lakeshore earlier than inland airport");
  assert.equal(new Set(stations.map((s) => s.p50)).size > 20, true);
  assert.equal(seasonYear("2026-10-31"), 2027);
  assert.equal(seasonYear("2027-03-01"), 2027);
});
test("crop dates: tender crops after frost, hardy crops before; transplant vs sowing noted", () => {
  const pea = crops.find((c) => c.id === "pea")!;
  const tomato = crops.find((c) => c.id === "tomato")!;
  const d1 = cropDates(pea, "2027-05-08", "2027-10-01");
  assert.ok(d1.outdoor < "2027-05-08");
  assert.equal(d1.fallSow, "2027-07-09"); // Oct 1 − (70 + 14) days
  const d2 = cropDates(tomato, "2027-05-08", "2027-10-01");
  assert.ok(d2.outdoor > "2027-05-08");
  assert.equal(d2.indoorStart, "2027-04-03"); // transplant May 15 − 6 weeks
  assert.equal(d2.fallSow, "");
  assert.match(d2.note, /transplant/);
  for (const c of crops) if (c.frost === "tender") assert.ok(c.springOffsetWeeks >= 0, c.id);
});
test("beans are warm-season, peas are frost-hardy", () => {
  assert.equal(crops.find((c) => c.id === "green-bean")!.frost, "tender");
  assert.equal(crops.find((c) => c.id === "pea")!.frost, "hardy");
});
test("germination math and advice", () => {
  assert.equal(germinationRate(10, 7), 70);
  assert.match(sowingAdvice(70), /replacing/);
  assert.match(sowingAdvice(90), /Good/);
});
const food = (tags: string[], quantity = 4): Supply => ({ id: tags.join(), name: tags.join(), category: "food", quantity, unit: "can", location: "", expires: "", acquired: "", condition: "ready", notes: "", lowStock: 0, waterLiters: 0, servings: 2, calories: 200, pantryTags: tags });
test("meal suggestions use actual pantry inventory", () => {
  const pantry = [food(["tuna"]), food(["white-beans"]), food(["crackers"])];
  const counts = pantryCounts(pantry, "2026-10-31");
  const tuna = recipes.find((r) => r.id === "tuna-bean-salad")!;
  assert.equal(matchRecipe(tuna, counts).ready, true);
  const expired = [{ ...food(["tuna"]), expires: "2020-01-01" }, food(["white-beans"]), food(["crackers"])];
  assert.equal(matchRecipe(tuna, pantryCounts(expired, "2026-10-31")).ready, false, "expired food is not offered");
});
test("14-day plan: no-cook filter, variety and pantry gaps", () => {
  const plan = buildPlan(14, 2, { noCookOnly: true, diets: [], avoidTags: [] }, [], "2026-10-31");
  assert.equal(plan.slots.length, 14);
  const ids = plan.slots.flatMap((d) => Object.values(d)).filter(Boolean).map((s) => s!.recipeId);
  assert.ok(ids.every((id) => recipes.find((r) => r.id === id)!.cook !== "heat-water"));
  assert.ok(new Set(ids).size >= 6, "rotates recipes");
  const needs = planNeeds(plan, [], "2026-10-31");
  assert.equal(needs.waterL, 0);
  assert.ok(needs.rows.every((r) => r.gap === r.packages));
  assert.equal(needs.daysWithFruitVeg, 14);
  const veg = buildPlan(7, 1, { noCookOnly: false, diets: ["vegan"], avoidTags: [] }, [], "2026-10-31");
  for (const d of veg.slots) for (const s of Object.values(d)) if (s) assert.ok(recipes.find((r) => r.id === s.recipeId)!.diet.includes("vegan"));
});
test("every recipe states water, leftovers and equipment", () => {
  for (const r of recipes) {
    assert.ok(r.steps.length >= 1 && r.leftovers.length > 10 && r.serves > 0, r.id);
    if (r.cook === "heat-water") assert.ok(r.waterMl > 0, r.id);
  }
});
