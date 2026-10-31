import { test } from "node:test";
import assert from "node:assert/strict";
import { computeChecklist, shoppingList, computeRow, templates, household, reminders, toCSV } from "../src/checklist/model";
import { withDefaults } from "../src/storage/db";
import type { Supply } from "../src/types";
const today = "2026-10-31";
const supply = (p: Partial<Supply>): Supply => ({
  id: "s" + Math.random(), name: "x", category: "water", quantity: 1, unit: "item", location: "", expires: "", acquired: today,
  condition: "ready", notes: "", lowStock: 0, waterLiters: 0, servings: 0, calories: 0, ...p,
});
const row = (r: ReturnType<typeof computeChecklist>, id: string) => r.rows.find((x) => x.def.id === id)!;

test("ACCEPTANCE: one person -> two people for 14 days updates requirements and shopping gaps", () => {
  const supplies = [
    supply({ id: "w", name: "Gallon jugs", quantity: 14, unit: "jug", waterLiters: 3.785411784 }),
    supply({ id: "f", name: "Canned chili", category: "food", quantity: 40, servings: 2, calories: 350 }),
    supply({ id: "l", name: "Headlamp", category: "lighting", quantity: 1, checklistId: "light-flashlight" }),
  ];
  const one = computeChecklist(withDefaults({ people: 1, days: 14 }), supplies, [], today);
  assert.equal(row(one, "water-drinking").status, "ready");
  assert.ok(Math.abs(row(one, "water-drinking").required - 14 * 3.785411784) < 1e-6);
  assert.equal(row(one, "food-calories").required, 28000);
  assert.equal(row(one, "food-calories").status, "ready");
  assert.equal(row(one, "light-flashlight").status, "ready");
  assert.ok(!shoppingList(one.rows).some((x) => x.id === "water-drinking"));

  const two = computeChecklist(withDefaults({ people: 2, days: 14 }), supplies, [], today);
  const w = row(two, "water-drinking");
  assert.ok(Math.abs(w.required - 28 * 3.785411784) < 1e-6, "water doubles");
  assert.equal(w.status, "partial");
  assert.ok(Math.abs(w.gap - 14 * 3.785411784) < 1e-6, "gap = 14 more gallons");
  assert.equal(row(two, "food-calories").required, 56000);
  assert.equal(row(two, "food-calories").gap, 28000);
  assert.equal(row(two, "light-flashlight").required, 2);
  assert.equal(row(two, "light-flashlight").status, "partial");
  const shop = shoppingList(two.rows);
  assert.ok(shop.find((x) => x.id === "water-drinking")!.gap > 52.9);
  assert.equal(shop.find((x) => x.id === "food-calories")!.gap, 28000);
  assert.equal(shop.find((x) => x.id === "light-flashlight")!.gap, 1);
  assert.match(w.explanation, /2 people × 14 days/);
});

test("ACCEPTANCE: consuming a supply changes completion status", () => {
  const settings = withDefaults({ people: 1, days: 14 });
  const jugs = supply({ id: "w", quantity: 14, waterLiters: 3.785411784 });
  assert.equal(row(computeChecklist(settings, [jugs], [], today), "water-drinking").status, "ready");
  const after = { ...jugs, quantity: 13 };
  const r = row(computeChecklist(settings, [after], [], today), "water-drinking");
  assert.equal(r.status, "partial");
  assert.ok(Math.abs(r.gap - 3.785411784) < 1e-6);
});

test("expired and damaged records are not counted and trigger inspection", () => {
  const s = withDefaults({ people: 1, days: 3 });
  const r = row(computeChecklist(s, [supply({ quantity: 3, waterLiters: 3.79, expires: "2026-10-01" })], [], today), "water-drinking");
  assert.equal(r.owned, 0);
  assert.equal(r.status, "inspect");
  const d = row(computeChecklist(s, [supply({ quantity: 3, waterLiters: 3.79, condition: "damaged" })], [], today), "water-drinking");
  assert.equal(d.owned, 0);
  assert.equal(d.status, "needed");
});

test("explicit links win over automatic category matching", () => {
  const s = withDefaults({ people: 1, days: 1 });
  const flush = supply({ quantity: 2, waterLiters: 18.9, checklistId: "water-flush" });
  const r = computeChecklist(s, [flush], [{ id: "water-flush", rate: 37.8, updated: "" }], today);
  assert.equal(row(r, "water-drinking").owned, 0);
  assert.equal(row(r, "water-flush").status, "ready");
});

test("pet and infant items apply only when the household has them; amounts are never invented", () => {
  const none = computeChecklist(withDefaults({}), [], [], today);
  assert.equal(row(none, "pet-food").status, "na");
  assert.equal(row(none, "infant-formula").status, "na");
  const pets = computeChecklist(withDefaults({ pets: 2 }), [], [], today);
  assert.equal(row(pets, "pet-food").rate, null);
  assert.equal(row(pets, "pet-food").status, "needed");
  assert.equal(row(pets, "water-pets").rate, null);
  const withRate = computeChecklist(withDefaults({ pets: 2, petWaterLiters: 1.5, days: 14 }), [], [], today);
  assert.equal(row(withRate, "water-pets").required, 21);
});

test("tasks: done, overdue and not-applicable", () => {
  const s = withDefaults({});
  const r = computeChecklist(s, [], [{ id: "warm-alarms", lastDone: "2026-10-20", updated: "" }, { id: "light-test", lastDone: "2026-01-01", updated: "" }, { id: "comm-radio", na: true, updated: "" }], today);
  assert.equal(row(r, "warm-alarms").status, "ready");
  assert.equal(row(r, "light-test").status, "inspect");
  assert.equal(row(r, "comm-radio").status, "na");
  assert.equal(row(r, "plan-meeting").status, "needed");
  assert.ok(reminders(r.rows, [], today).some((x) => x.id === "task-warm-alarms"));
});

test("custom items, removal and editable amounts", () => {
  const s = withDefaults({ people: 3, days: 14 });
  const states = [
    { id: "custom-1", custom: { id: "custom-1", section: "food", name: "Peanut butter jars", kind: "quantity" as const, basis: "personWeek" as const, rate: 1, unit: "jar", measure: "count" as const, category: "food", origin: "household" as const, why: "" }, updated: "" },
    { id: "san-tp", hidden: true, updated: "" },
    { id: "light-batteries", rate: 4, updated: "" },
  ];
  const r = computeChecklist(s, [supply({ category: "food", quantity: 2, checklistId: "custom-1" })], states, today);
  assert.equal(row(r, "custom-1").required, 6);
  assert.equal(row(r, "custom-1").gap, 4);
  assert.equal(row(r, "san-tp"), undefined);
  assert.equal(r.hidden[0].id, "san-tp");
  assert.equal(row(r, "light-batteries").required, 12);
});

test("multi-unit packs count by units per pack", () => {
  const s = withDefaults({ people: 2, days: 14 });
  const r = computeChecklist(s, [supply({ category: "batteries", quantity: 1, perUnit: 4, checklistId: "light-batteries" })], [], today);
  assert.equal(row(r, "light-batteries").owned, 4);
  assert.equal(row(r, "light-batteries").status, "ready");
});

test("template ids are unique and every quantity item explains its basis", () => {
  assert.equal(new Set(templates.map((t) => t.id)).size, templates.length);
  for (const t of templates) assert.ok(t.why.length > 10, t.id);
  const h = household(withDefaults({ people: 2 }));
  assert.equal(h.people, 2);
});

test("CSV export neutralizes spreadsheet formulas", () => {
  const r = computeChecklist(withDefaults({}), [], [{ id: "comm-radio", notes: "=HYPERLINK(1)", updated: "" }], today);
  assert.match(toCSV(r.rows), /'=HYPERLINK/);
});

test("rotation reminder for self-filled water older than six months", () => {
  const r = computeChecklist(withDefaults({}), [], [], today);
  const rem = reminders(r.rows, [supply({ name: "Refilled jugs", acquired: "2026-03-01", quantity: 4, waterLiters: 3.785 })], today);
  assert.ok(rem.some((x) => x.kind === "rotation"));
});
