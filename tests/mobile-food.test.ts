import { test } from "node:test";
import assert from "node:assert/strict";
import { computeChecklist } from "../src/checklist/model";
import { withDefaults } from "../src/storage/db";
import { validateBackup } from "../src/storage/backup";
import { cookingRecipes, filterCookingRecipes } from "../src/meals/catalog";
import oxalates from "../src/content/oxalates.json";
import pack from "../src/content/emergency-recipes.json";
const today = "2026-11-01";
const find = (states: any[]) =>
  computeChecklist(
    withDefaults({ people: 1, days: 14 }),
    [],
    states,
    today,
  ).rows.find((r) => r.def.id === "water-drinking")!;
test("direct readiness confirmation works without inventing water inventory", () => {
  const r = find([
    { id: "water-drinking", prepared: true, preparedOn: today, updated: today },
  ]);
  assert.equal(r.status, "ready");
  assert.equal(r.owned, 0);
  assert.ok(r.gap > 50);
  assert.match(r.reasons[0], /Marked ready by you/);
  assert.equal(
    find([{ id: "water-drinking", prepared: false, updated: today }]).status,
    "needed",
  );
  assert.equal(find([]).status, "needed");
});
test("ready checkbox cannot make a not-applicable item apply", () => {
  const r = find([
    { id: "water-drinking", prepared: true, na: true, updated: today },
  ]);
  assert.equal(r.status, "na");
});
test("backups preserve explicit false readiness and validate readiness type", () => {
  const base = {
    format: "urban-haven",
    schema: 2,
    supplies: [],
    notes: [],
    garden: [],
    favorites: [],
    settings: withDefaults({}),
    checklist: [
      {
        id: "water-drinking",
        prepared: false,
        preparedOn: today,
        updated: today,
      },
    ],
  };
  assert.equal(validateBackup(base).checklist[0].prepared, false);
  assert.equal(validateBackup(base).checklist[0].preparedOn, today);
  assert.throws(() =>
    validateBackup({
      ...base,
      checklist: [{ id: "water-drinking", prepared: "yes", updated: today }],
    }),
  );
});
test("all 24 uploaded recipes retain ingredients and separately rendered steps", () => {
  assert.equal(pack.length, 24);
  assert.equal(
    new Set(cookingRecipes.map((r) => r.id)).size,
    cookingRecipes.length,
  );
  for (const r of pack) {
    assert.ok(r.ingredients.length >= 3, r.id);
    assert.ok(r.steps.length >= 2, r.id);
    assert.ok(r.water, r.id);
  }
  assert.match(
    pack.find((r) => r.id === "pack-r03")!.ingredients.join(" "),
    /3½ cups/,
  );
  assert.match(
    pack.find((r) => r.id === "pack-r11")!.notes.join(" "),
    /peanuts/i,
  );
});
test("no-heat / no-fridge filters never admit chilled oats or boiling-water recipes", () => {
  const list = filterCookingRecipes("", "none", false);
  assert.ok(list.length >= 2);
  assert.ok(list.every((r) => !r.heat && !r.fridge));
  assert.ok(
    !list.some(
      (r) => r.id === "pack-r18" || r.id === "pack-r19" || r.id === "pack-r08",
    ),
  );
  assert.ok(
    filterCookingRecipes("overnight", "none", true).some(
      (r) => r.id === "pack-r18",
    ),
  );
  assert.ok(
    !filterCookingRecipes("", "quick", false).some((r) => r.id === "pack-r10"),
  ); // 12–18 min is not <=15
});
test("oxalate reference retains exact portion/preparation, provenance and numeric values", () => {
  assert.equal(oxalates.length, 21);
  assert.ok(
    oxalates.every(
      (r) => r.serving && r.sourceRow > 0 && Number.isFinite(r.oxalateMg),
    ),
  );
  const lentils = oxalates.find((r) => r.food.startsWith("LENTILS"))!;
  assert.equal(lentils.serving, "1/2 cup");
  assert.equal(lentils.oxalateMg, 2.4);
  assert.match(lentils.food, /BOILED, UNSALTED/);
  assert.equal(
    oxalates.find((r) => r.food.startsWith("BEANS, NAVY"))!.oxalateMg,
    96.3,
  );
  assert.equal(oxalates.filter((r) => !r.directlyMeasured).length, 2);
});

// Unmatched ingredients are not treated as zero or mapped to a different legume.
import { ingredientOxalates } from "../src/meals/oxalates";
test("ingredient links keep split peas distinct from green peas and missing data unknown", () => {
  assert.equal(ingredientOxalates(["1 cup dry split peas"]).length, 0);
  assert.equal(
    ingredientOxalates(["1 can peas, drained"])[0].food,
    "PEAS, GREEN, BOILED, DRAINED, UNSALTED",
  );
  assert.equal(
    ingredientOxalates(["1 cup dry white rice"])[0].serving,
    "1 cup",
  );
  assert.equal(ingredientOxalates(["unknown prepared meal"]).length, 0);
});
