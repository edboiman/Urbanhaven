import { test } from "node:test";
import assert from "node:assert/strict";
import { water, food, power, fuel, LITERS_PER_GALLON } from "../src/calculators";
import { validateBackup } from "../src/storage/backup";
import { withDefaults, defaults } from "../src/storage/db";
import { guides } from "../src/content";
import { searchGuides } from "../src/search";

test("water uses the CDC 1-gallon baseline and adds household extras once per day", () => {
  const r = water(2, 3, 10, 1, 2);
  assert.ok(Math.abs(r.needed - (2 * LITERS_PER_GALLON + 3) * 3) < 1e-9);
  assert.ok(Math.abs(r.gap - (r.needed - 10)) < 1e-9);
  assert.equal(water(1, 1, 100).gap, 0);
  assert.throws(() => water(0, 7, 4));
  assert.throws(() => water(1, 7, NaN));
  assert.throws(() => water(1, 7, -1));
  assert.throws(() => water(1.5, 7, 1));
});
test("food, power and fuel arithmetic and input checks", () => {
  assert.equal(food(14000, 1, 2000).duration, 7);
  assert.throws(() => food(2, 1, 0));
  assert.deepEqual(power(100, 10, 20, 2), { usable: 80, runtime: 8, daily: 20, remaining: 60 });
  assert.equal(power(20, 10, 0, 5).remaining, 0);
  assert.throws(() => power(20, 10, 100, 1));
  assert.throws(() => power(20, 0, 10, 1));
  assert.throws(() => power(100, 10, 10, 25));
  assert.equal(fuel(100, 30, 14), 700);
  assert.throws(() => fuel(0, 30, 1));
  assert.throws(() => fuel(10, 2000, 1));
});
const supply = { id: "a", name: "water", category: "water", quantity: 24, unit: "bottle", location: "closet", expires: "", acquired: "2026-10-31", condition: "ready", notes: "", lowStock: 1, waterLiters: 0.5, servings: 0, calories: 0 };
const v1 = () => ({ format: "urban-haven", schema: 1, supplies: [{ ...supply }], notes: [], garden: [], favorites: [], settings: { ...defaults, people: 2, days: 7, checks: ["medical"] } });
test("v1.0.0 backups are accepted and gain v2 defaults", () => {
  const r = validateBackup(v1());
  assert.equal(r.schema, 1);
  assert.equal(r.settings.people, 2);
  assert.equal(r.settings.days, 7, "keeps the saved duration");
  assert.deepEqual(r.settings.needs, []);
  assert.deepEqual(r.checklist, []);
  assert.deepEqual(r.markers, []);
});
test("v2 backups validate every new record type", () => {
  const b = {
    ...v1(), schema: 2,
    checklist: [{ id: "water-hygiene", rate: 2, updated: "x" }, { id: "custom-1", custom: { id: "custom-1", section: "plans", name: "Generator fuel", kind: "quantity", basis: "fixed", rate: 10, unit: "gal", measure: "count", category: "other", origin: "household", why: "" }, updated: "" }],
    consumption: [{ id: "c1", supplyId: "a", supplyName: "water", date: "2026-10-30", amount: 1, unit: "bottle", reason: "used", note: "" }],
    markers: [{ id: "m1", name: "Meeting", kind: "meeting", lat: 46.5, lon: -87.4, notes: "", created: "", updated: "" }],
    seeds: [{ id: "s1", cropId: "pea", variety: "x", source: "", packedFor: "2026", quantity: 50, unit: "seeds", location: "", notes: "", tests: [{ date: "2026-10-01", sown: 10, sprouted: 9 }] }],
    harvests: [{ id: "h1", entryId: "g1", date: "2026-08-01", grams: 500, notes: "" }],
    plans: [{ id: "meal-plan", data: { days: 1 }, updated: "" }],
  };
  const r = validateBackup(b);
  assert.equal(r.markers[0].lat, 46.5);
  assert.equal(r.checklist[1].custom!.origin, "household");
});
test("untrusted backups are rejected", () => {
  const bad = (patch: object) => () => validateBackup({ ...v1(), ...patch });
  assert.throws(bad({ format: "other" }));
  assert.throws(bad({ schema: 3 }));
  assert.throws(bad({ supplies: [{ ...supply, quantity: -1 }] }));
  assert.throws(bad({ supplies: [{ ...supply, category: "weapons" }] }));
  assert.throws(bad({ supplies: [{ ...supply }, { ...supply }] }), /Duplicate/);
  assert.throws(bad({ supplies: [{ ...supply, name: "x".repeat(500) }] }));
  assert.throws(bad({ supplies: [{ ...supply, expires: "tomorrow" }] }));
  assert.throws(bad({ schema: 2, markers: [{ id: "m", name: "x", kind: "meeting", lat: 123, lon: 0 }] }), /latitude/);
  assert.throws(bad({ schema: 2, markers: [{ id: "m", name: "x", kind: "bunker", lat: 1, lon: 0 }] }));
  assert.throws(bad({ schema: 2, seeds: [{ id: "s", cropId: "x", variety: "x", quantity: 1, tests: [{ date: "", sown: 5, sprouted: 9 }] }] }));
  assert.throws(bad({ schema: 2, checklist: [{ id: "x", custom: { id: "x", section: "s", name: "n", kind: "magic", basis: "fixed", rate: 1, unit: "u", measure: "count", category: "c" } }] }));
  assert.throws(bad({ settings: { ...defaults, needs: ["telepathy"] } }));
});
test("markup in records stays plain data", () => {
  const r = validateBackup({ ...v1(), notes: [{ id: "n", title: "<img src=x onerror=alert(1)>", body: "<script>alert(1)</script>", tags: "", sensitive: false, updated: "" }] });
  assert.equal(r.notes[0].body, "<script>alert(1)</script>");
});
test("withDefaults never overwrites saved values", () => {
  const s = withDefaults({ people: 3, days: 7 });
  assert.equal(s.people, 3);
  assert.equal(s.days, 7);
  assert.equal(withDefaults(undefined).days, 14);
});
test("guide search keeps synonyms and finds the new well guide", () => {
  assert.equal(searchGuides(guides, "toilet stopped working")[0].id, "sanitation-emergency-toilet");
  assert.ok(searchGuides(guides, "flooded well").slice(0, 3).some((g) => g.id === "water-private-well"));
  assert.equal(searchGuides(guides, "")[0] !== undefined, true);
});
