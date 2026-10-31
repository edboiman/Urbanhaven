import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const guides = [];
for (const file of ["health", "infrastructure", "gardening"])
  guides.push(
    ...JSON.parse(await readFile(`src/content/${file}.json`, "utf8")),
  );
const ids = new Set(guides.map((g) => g.id));
assert.equal(ids.size, guides.length, "Duplicate guide IDs");
assert(guides.length >= 60);
const categories = [
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
];
for (const g of guides) {
  for (const key of ["title", "summary", "when", "region", "updated"])
    assert(
      typeof g[key] === "string" && g[key].length > 0,
      `${g.id}: missing ${key}`,
    );
  assert(categories.includes(g.category));
  for (const key of [
    "needs",
    "steps",
    "warnings",
    "mistakes",
    "alternatives",
    "quick",
    "sources",
  ])
    assert(
      Array.isArray(g[key]) && g[key].length > 0,
      `${g.id}: missing ${key}`,
    );
  assert(g.steps.length >= 3);
  assert(!/lorem ipsum|todo|placeholder/i.test(JSON.stringify(g)));
  for (const source of g.sources) {
    assert(new URL(source.url).protocol === "https:");
    assert(/^\d{4}-\d{2}-\d{2}$/.test(source.verified));
  }
  for (const related of g.related)
    assert(ids.has(related), `${g.id}: invalid related guide ${related}`);
}
assert(categories.every((c) => guides.some((g) => g.category === c)));
const crops = JSON.parse(await readFile("src/content/crops.json", "utf8"));
assert(crops.length >= 15, "at least 15 crop profiles");
for (const c of crops) {
  assert(c.harvestDays[0] > 0 && c.harvestDays[1] >= c.harvestDays[0], c.id);
  assert(new URL(c.sourceUrl).protocol === "https:");
  for (const k of ["start", "frost", "soilTemp", "light", "water", "medium", "containerDepth", "indoor", "container", "seedLife", "limits", "calories", "problems"])
    assert(typeof c[k] === "string" && c[k].length > 3, `${c.id}: missing ${k}`);
  assert(["sowing", "transplant", "planting"].includes(c.harvestFrom), c.id + " harvestFrom");
  assert(["hardy", "semi-hardy", "tender"].includes(c.frost), c.id + " frost");
  assert(c.sources.length > 0 && c.sources.every((s) => new URL(s.url).protocol === "https:"), c.id + " sources");
  if (c.frost === "tender") assert(c.springOffsetWeeks >= 0, c.id + ": tender crops must not be planted before last frost");
}
const frost = JSON.parse(await readFile("src/content/frost-stations.json", "utf8"));
assert(frost.stations.length > 50);
for (const r of ["slp", "nlp", "up"]) assert(frost.stations.some((s) => s.region === r), "frost stations for " + r);
for (const s of frost.stations) assert(s.first <= s.p75 && s.p75 <= s.p50 && s.p50 <= s.p25 && s.p25 <= s.last, s.name + " frost order");
console.log(
  `PASS: ${guides.length} complete guides, all 10 categories, source metadata, related IDs, and ${crops.length} crop profiles; ${frost.stations.length} frost stations. This checks structure, not independent subject-matter review.`,
);
