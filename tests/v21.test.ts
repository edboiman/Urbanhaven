import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyRoute,
  readRoute,
  leg,
  routeGPX,
  movePoint,
  validMarkerPhoto,
  type Waypoint,
} from "../src/map/routes";
import { blankPet, readPet, petTargets } from "../src/pets/model";
import { cropChoices } from "../src/garden/emergency";
import { crops, guides } from "../src/content";
import { defaults } from "../src/storage/db";
import { validateBackup } from "../src/storage/backup";
import radio from "../src/content/radio-stations.json";
import rivers from "../src/content/michigan-river-references.json";
import pantry from "../src/content/pantry-reference.json";
import stove from "../src/content/stove-recipes.json";
import pets from "../src/content/pet-preparedness.json";
const a: Waypoint = {
  id: "a",
  name: "Start & <home>",
  lat: 42,
  lon: -84,
  notes: 'Go "carefully"',
  visited: false,
};
const b: Waypoint = {
  ...a,
  id: "b",
  name: "Destination",
  lat: 42.1,
  visited: true,
};
const path = () => ({ ...emptyRoute(), points: [{ ...a }, { ...b }] });
const backup = () => ({
  format: "urban-haven",
  schema: 2,
  supplies: [],
  notes: [],
  garden: [],
  favorites: [],
  settings: { ...defaults },
  markers: [],
  plans: [],
});
test("waypoint distance and true bearings use coordinates, including coincident points", () => {
  const r = leg(a, b);
  assert.ok(Math.abs(r.km - 11.1195) < 0.001);
  assert.equal(r.bearing, 0);
  assert.equal(leg(a, a).bearing, null);
  assert.equal(leg(a, a).km, 0);
  assert.ok(leg(b, a).bearing! > 179.99);
});
test("route parser rejects nonfinite, extreme, duplicate and oversized stops", () => {
  for (const patch of [
    { lat: Infinity },
    { lat: 86 },
    { lon: -181 },
    { notes: "x".repeat(1001) },
    { visited: "yes" },
  ])
    assert.throws(() => readRoute({ ...path(), points: [{ ...a, ...patch }] }));
  assert.throws(() => readRoute({ ...path(), points: [a, a] }));
  assert.throws(() =>
    readRoute({
      ...path(),
      points: Array.from({ length: 101 }, (_, i) => ({ ...a, id: String(i) })),
    }),
  );
  assert.deepEqual(readRoute(path()), path());
});
test("reordering preserves waypoint coordinates and leaves source order unchanged", () => {
  const p = path().points;
  assert.deepEqual(
    movePoint(p, 1, -1).map((x) => x.id),
    ["b", "a"],
  );
  assert.deepEqual(
    p.map((x) => x.id),
    ["a", "b"],
  );
  assert.deepEqual(movePoint(p, 0, -1), p);
});
test("GPX escapes private text and retains explicit waypoint coordinates", () => {
  const g = routeGPX(path());
  assert.match(g, /Start &amp; &lt;home&gt;/);
  assert.match(g, /Go &quot;carefully&quot;/);
  assert.match(g, /lat="42.1" lon="-84"/);
  assert.equal((g.match(/<rtept /g) || []).length, 2);
});
test("marker photos accept bounded raster data only", () => {
  assert.ok(validMarkerPhoto("data:image/jpeg;base64,YWJj"));
  assert.equal(validMarkerPhoto("data:image/svg+xml;base64,YWJj"), false);
  assert.equal(validMarkerPhoto("https://example.com/a.jpg"), false);
  assert.equal(
    validMarkerPhoto("data:image/png;base64," + "A".repeat(600000)),
    false,
  );
});
test("backups preserve farm photos, routes and pet records and validate their fields", () => {
  const b = {
    ...backup(),
    markers: [
      {
        ...a,
        kind: "farm",
        created: "",
        updated: "",
        photo: "data:image/jpeg;base64,YWJj",
        photoCaption: "Gate",
      },
    ],
    plans: [
      { id: "map-route-primary", data: path(), updated: "" },
      {
        id: "pet-profile-primary",
        data: { ...blankPet(), name: "Cat", species: "Cat" },
        updated: "",
      },
    ],
  };
  const r = validateBackup(b);
  assert.equal(r.markers[0].kind, "farm");
  assert.equal(r.markers[0].photoCaption, "Gate");
  assert.deepEqual(r.plans[0].data, path());
  assert.equal((r.plans[1].data as { name: string }).name, "Cat");
  assert.throws(() =>
    validateBackup({
      ...b,
      markers: [{ ...b.markers[0], photo: "data:text/html;base64,YWJj" }],
    }),
  );
  assert.throws(() =>
    validateBackup({
      ...b,
      plans: [
        { ...b.plans[0], data: { ...path(), points: [{ ...a, lat: NaN }] } },
      ],
    }),
  );
});
test("indoor outage and indoor calorie goals offer no misleading food crop", () => {
  assert.equal(cropChoices(crops, "outage", "all").length, 0);
  assert.equal(cropChoices(crops, "indoor", "calories").length, 0);
  assert.ok(cropChoices(crops, "urban", "all").some((c) => c.id === "lettuce"));
  assert.ok(
    cropChoices(crops, "suburban", "cold").every((c) => c.frost !== "tender"),
  );
});
test("pet targets use the household-entered ration and reject invalid records", () => {
  const p = {
    ...blankPet(),
    name: "Example",
    dailyFoodGrams: 220,
    dailyWaterLiters: 0.8,
  };
  assert.equal(petTargets(p, 14).foodGrams, 3080);
  assert.ok(Math.abs(petTargets(p, 14).waterLiters - 11.2) < 1e-9);
  assert.throws(() => readPet({ ...p, dailyWaterLiters: -1 }));
  assert.throws(() => petTargets(p, 0));
  assert.throws(() => petTargets(p, 1.5));
  assert.throws(() => readPet({ ...p, medications: 23 }));
});
test("radio directory has unique stations, valid weather frequencies and explicit limits", () => {
  const all = [...radio.weather, ...radio.broadcast];
  assert.equal(radio.weather.length, 28);
  assert.equal(new Set(all.map((s) => s.id)).size, all.length);
  const freqs = [
    "162.400",
    "162.425",
    "162.450",
    "162.475",
    "162.500",
    "162.525",
    "162.550",
  ];
  assert.ok(
    radio.weather.every(
      (s) => freqs.includes(s.frequency.split(" ")[0]) && s.band === "WX",
    ),
  );
  assert.ok(radio.broadcast.length >= 15);
  assert.ok(all.every((s) => new URL(s.url).protocol === "https:"));
});
test("river references are six sourced Michigan geography points, never facility status", () => {
  assert.equal(rivers.length, 6);
  assert.equal(new Set(rivers.map((r) => r.id)).size, 6);
  assert.ok(
    rivers.every(
      (r) =>
        r.lat > 41.6 &&
        r.lat < 48.3 &&
        r.lon > -90.5 &&
        r.lon < -82.1 &&
        new URL(r.sourceUrl).hostname === "waterdata.usgs.gov" &&
        r.notes.length > 100,
    ),
  );
});
test("new reference content has complete pantry, cooking, health and pet guidance", () => {
  assert.equal(pantry.filter((f) => f.tier === "Core").length, 9);
  assert.equal(pantry.filter((f) => f.tier === "Useful extra").length, 6);
  assert.ok(
    pantry.every((f) => f.unopenedLife && f.afterOpening && f.waterFuel),
  );
  assert.equal(stove.length, 10);
  assert.ok(
    stove.every(
      (r) =>
        r.ingredients.length >= 3 &&
        r.steps.length >= 3 &&
        r.safety.length > 0 &&
        r.water &&
        r.leftovers,
    ),
  );
  assert.ok(stove.some((r) => r.tags.includes("vegetarian")));
  assert.ok(stove.some((r) => r.tags.includes("one-pot")));
  assert.equal(
    guides.filter((g) => g.id.startsWith("medical-prolonged-")).length,
    10,
  );
  assert.equal(pets.sections.length, 8);
  assert.equal(pets.kit.length, 12);
});

test("new radio and pet kit backup records reject malformed values", () => {
  for (const [id, data] of [
    ["radio-log", { saved: "bad", heard: {} }],
    ["radio-log", { saved: [], heard: { x: "yesterday" } }],
    ["pet-kit", { checks: [{}] }],
    ["pet-profile-bad", { ...blankPet(), dailyFoodGrams: -1 }],
  ])
    assert.throws(() =>
      validateBackup({ ...backup(), plans: [{ id, data, updated: "" }] }),
    );
  const plans = [
    {
      id: "radio-log",
      data: { saved: ["wx-kec63"], heard: { "wx-kec63": "2026-10-31" } },
      updated: "",
    },
    { id: "pet-kit", data: { checks: ["pet-food"] }, updated: "" },
  ];
  assert.deepEqual(validateBackup({ ...backup(), plans }).plans, plans);
});
