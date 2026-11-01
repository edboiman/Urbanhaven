import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addCalendarMonths,
  supplyReviewDate,
  pastDateText,
} from "../src/storage/dates";
import { isUsable, computeChecklist, reminders } from "../src/checklist/model";
import { defaults } from "../src/storage/db";
import { validateBackup } from "../src/storage/backup";
import { crops } from "../src/content";
import { cropDates, addDays } from "../src/garden/plan";
import { recipes } from "../src/meals/recipes";
import { matchRecipe, pantryCounts } from "../src/meals/planner";
import type { Supply } from "../src/types";
const item = (patch: Partial<Supply> = {}): Supply => ({
  id: "a",
  name: "Stored supply",
  category: "water",
  quantity: 1,
  unit: "jug",
  location: "closet",
  expires: "",
  acquired: "2026-05-01",
  condition: "ready",
  notes: "",
  lowStock: 0,
  waterLiters: 4,
  servings: 0,
  calories: 0,
  ...patch,
});
const backup = (supplies: Supply[]) => ({
  format: "urban-haven",
  schema: 2,
  supplies,
  notes: [],
  garden: [],
  favorites: [],
  settings: { ...defaults },
});
test("six calendar months respect leap years and end-of-month boundaries", () => {
  assert.equal(addCalendarMonths("2026-08-31", 6), "2027-02-28");
  assert.equal(addCalendarMonths("2023-08-31", 6), "2024-02-29");
  assert.equal(addCalendarMonths("2026-05-01", 6), "2026-11-01");
  assert.equal(addCalendarMonths("2026-02-30", 6), "");
});
test("only identified self-filled water gets an automatic refill date", () => {
  assert.equal(
    supplyReviewDate(item({ waterType: "self-filled" })),
    "2026-11-01",
  );
  assert.equal(supplyReviewDate(item({ waterType: "commercial" })), "");
  assert.equal(supplyReviewDate(item({ waterType: "unknown" })), "");
  assert.equal(supplyReviewDate(item()), "");
});
test("an entered date cannot postpone the self-filled six-month rotation", () => {
  assert.equal(
    supplyReviewDate(item({ waterType: "self-filled", expires: "2027-01-01" })),
    "2026-11-01",
  );
  assert.equal(
    supplyReviewDate(item({ waterType: "self-filled", expires: "2026-08-01" })),
    "2026-08-01",
  );
  assert.match(
    pastDateText(item({ dateKind: "quality", expires: "2026-08-01" })),
    /Quality date passed/,
  );
});
test("readiness conservatively excludes due-for-review stock without calling quality dates unsafe", () => {
  const food = item({
    category: "food",
    dateKind: "quality",
    expires: "2026-10-01",
    servings: 10,
    calories: 200,
  });
  assert.equal(isUsable(food, "2026-11-01"), false);
  assert.equal(
    isUsable(item({ waterType: "self-filled" }), "2026-11-02"),
    false,
  );
  assert.equal(isUsable(item({ waterType: "commercial" }), "2026-11-02"), true);
  const row = computeChecklist(
    { ...defaults },
    [food],
    [],
    "2026-11-01",
  ).rows.find((r) => r.def.id === "food-calories")!;
  assert.equal(row.owned, 0);
  assert.equal(row.status, "inspect");
  assert.ok(
    row.reasons.some((r) => r.includes("quality date alone does not prove")),
  );
});
test("reminders distinguish unknown water from commercial and self-filled sources", () => {
  const rows = computeChecklist({ ...defaults }, [], [], "2026-11-02").rows;
  assert.equal(
    reminders(rows, [item({ waterType: "commercial" })], "2026-11-02").length,
    0,
  );
  assert.ok(
    reminders(rows, [item()], "2026-11-02").some((r) =>
      r.text.includes("confirm water type"),
    ),
  );
  assert.ok(
    reminders(rows, [item({ waterType: "self-filled" })], "2026-11-02").some(
      (r) => r.text.includes("Refill / rotation due"),
    ),
  );
});
test("date meaning and water source survive backup and invalid dates or enums fail", () => {
  const record = item({ dateKind: "review", waterType: "self-filled" });
  assert.deepEqual(
    validateBackup(backup([record])).supplies[0].waterType,
    "self-filled",
  );
  assert.equal(validateBackup(backup([record])).supplies[0].dateKind, "review");
  for (const patch of [
    { dateKind: "safe-forever" },
    { waterType: "river" },
    { expires: "2026-02-30" },
    { acquired: "2026-13-01" },
  ])
    assert.throws(() =>
      validateBackup(backup([{ ...record, ...patch } as Supply])),
    );
});
test("fall cabbage includes indoor seedling time before the transplant-based harvest window", () => {
  const c = crops.find((c) => c.id === "cabbage")!;
  const d = cropDates(c, "2027-05-08", "2027-10-01");
  assert.equal(d.fallOutdoor, "2027-06-19");
  assert.equal(d.fallSow, "2027-05-08");
  assert.equal(addDays(d.fallSow, c.seedStartWeeks * 7), d.fallOutdoor);
});
test("no-cook breakfast rejects ordinary oats and couscous package arithmetic covers the measured weight", () => {
  const r = recipes.find((r) => r.id === "soaked-oats")!;
  const ingredients = [
    item({ category: "food", pantryTags: ["oats"], quantity: 2 }),
    item({
      id: "b",
      category: "food",
      pantryTags: ["shelf-stable-milk"],
      quantity: 2,
    }),
    item({
      id: "c",
      category: "food",
      pantryTags: ["canned-fruit"],
      quantity: 2,
    }),
  ];
  assert.equal(
    matchRecipe(r, pantryCounts(ingredients, "2026-11-01")).ready,
    false,
  );
  assert.equal(
    matchRecipe(
      r,
      pantryCounts(
        [
          { ...ingredients[0], pantryTags: ["ready-oat-cereal"] },
          ...ingredients.slice(1),
        ],
        "2026-11-01",
      ),
    ).ready,
    true,
  );
  const couscous = recipes
    .find((r) => r.id === "couscous-chickpea")!
    .ingredients.find((i) => i.tag === "couscous")!;
  assert.ok(couscous.packages * 283.495 >= 170);
  assert.ok(couscous.packages * 283.495 < 171);
});
