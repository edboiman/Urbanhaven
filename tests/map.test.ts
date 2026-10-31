import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { decodePack, validateRaw, searchPlaces, parseCoordinates, lonToX, latToY, xToLon, yToLat, normalizeName } from "../src/map/data";

const catalog = JSON.parse(readFileSync("public/maps/catalog.json", "utf8"));
const overviewBytes = readFileSync("public/maps/" + catalog.overview.file);
const overview = decodePack(validateRaw(JSON.parse(gunzipSync(overviewBytes).toString("utf8"))));

test("bundled overview matches its catalog hash and covers both peninsulas", () => {
  assert.equal(createHash("sha256").update(overviewBytes).digest("hex"), catalog.overview.sha256);
  assert.equal(overviewBytes.length, catalog.overview.bytes);
  const [w, s, e, n] = overview.bbox;
  assert.ok(w <= -90.42 && e >= -82.4 && s <= 41.7 && n >= 48.3, "Michigan incl. Isle Royale inside bbox");
  assert.ok(overview.places.length > 3500);
  assert.ok(overview.land.length > 0 && overview.water.length > 10 && overview.roads.length > 500);
});
test("search finds towns in both peninsulas and on islands", () => {
  for (const [q, county] of [["Marquette", "Marquette"], ["Ironwood", "Gogebic"], ["Sault Ste. Marie", "Chippewa"], ["Copper Harbor", "Keweenaw"], ["Mackinac Island", "Mackinac"], ["St. James", "Charlevoix"], ["Traverse City", "Grand Traverse"], ["Kalamazoo", "Kalamazoo"], ["Detroit", "Wayne"], ["Bad Axe", "Huron"]] as const) {
    const hit = searchPlaces(q, overview.places)[0];
    assert.ok(hit, q);
    assert.equal(normalizeName(hit.label), normalizeName(q), q);
    assert.match(hit.detail, new RegExp(county), q);
  }
  assert.ok(searchPlaces("saint ignace", overview.places)[0].label.startsWith("St. Ignace"));
  assert.equal(searchPlaces("zzzz", overview.places).length, 0);
});
test("every place lies inside Michigan's bounding box", () => {
  for (const p of overview.places) {
    const lon = xToLon(p.x);
    const lat = yToLat(p.y);
    assert.ok(lon > -90.5 && lon < -82.1 && lat > 41.6 && lat < 48.3, p.name);
  }
});
test("projection round-trips", () => {
  for (const [lon, lat] of [[-85.6, 44.9], [-88.9, 48.0], [-83.0, 42.3]]) {
    assert.ok(Math.abs(xToLon(lonToX(lon)) - lon) < 1e-9);
    assert.ok(Math.abs(yToLat(latToY(lat)) - lat) < 1e-9);
  }
});
test("manual coordinate entry accepts common formats", () => {
  assert.deepEqual(parseCoordinates("46.5436, -87.3954"), { lat: 46.5436, lon: -87.3954 });
  assert.deepEqual(parseCoordinates("46.5436 -87.3954"), { lat: 46.5436, lon: -87.3954 });
  assert.deepEqual(parseCoordinates("46.5436 N, 87.3954 W"), { lat: 46.5436, lon: -87.3954 });
  const dms = parseCoordinates(`42°17'30"N 85°35'10"W`)!;
  assert.ok(Math.abs(dms.lat - 42.291667) < 1e-5 && Math.abs(dms.lon + 85.586111) < 1e-5);
  assert.equal(parseCoordinates("north pole"), null);
  assert.equal(parseCoordinates("95, -87"), null);
  assert.equal(parseCoordinates("45, 61, 3"), null);
});
test("detail packs: catalog parts are consistent and decode", () => {
  assert.equal(catalog.packs.length, 3);
  for (const p of catalog.packs) {
    const parts = p.parts.map((x: { file: string }) => readFileSync("public/maps/" + x.file));
    p.parts.forEach((x: { sha256: string; bytes: number }, i: number) => {
      assert.equal(parts[i].length, x.bytes);
      assert.equal(createHash("sha256").update(parts[i]).digest("hex"), x.sha256);
    });
    const whole = Buffer.concat(parts);
    assert.equal(createHash("sha256").update(whole).digest("hex"), p.sha256);
    const pack = decodePack(validateRaw(JSON.parse(gunzipSync(whole).toString("utf8"))));
    assert.equal(pack.id, p.id);
    assert.ok(pack.roads.length > 50, p.id);
    assert.ok(p.parts.length >= 2, "packs are chunked so downloads can resume");
  }
});
test("rejects data that is not an Urban Haven map", () => {
  assert.throws(() => validateRaw({ format: "geojson" }));
});
