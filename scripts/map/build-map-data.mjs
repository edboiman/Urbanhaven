// Builds the offline Michigan map data from openly licensed sources.
//
//   node scripts/map/build-map-data.mjs <natural-earth-vector dir> <us_geo dir>
//
// Inputs (see docs/MAP_DATA.md for exact commits and licenses):
//   - Natural Earth 10m vector (public domain): land, minor islands, lakes, rivers,
//     North America roads (shapefile), counties, parks, state/province lines.
//   - U.S. Census Bureau 2025 Gazetteer places and county subdivisions (public domain)
//     and USGS GNIS populated places (public domain), via the us_geo repository.
// Outputs (committed to the repository so the app build does not need the sources):
//   public/maps/overview.json.gz    bundled, precached statewide overview + search index
//   public/maps/packs/<id>/<version>/part-NNN.bin   optional regional detail packs (gzip, chunked)
//   public/maps/catalog.json        pack catalog with sizes, versions and SHA-256 values
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { readShapefile } from "./shapefile.mjs";

const [NE, USGEO] = process.argv.slice(2);
if (!NE || !USGEO) throw new Error("Usage: node scripts/map/build-map-data.mjs <natural-earth-vector> <us_geo>");
const OUT = "public/maps";
const DATA_VERSION = "2026.10.31-1";
const SCALE = 2 ** 22; // integer Web Mercator units across the world (~6.7 m per unit at 45°N)

// ---------- projection ----------
const mx = (lon) => Math.round(((lon + 180) / 360) * SCALE);
const my = (lat) => {
  const s = Math.sin((lat * Math.PI) / 180);
  return Math.round((0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * SCALE);
};
const metersPerUnitAt45 = (40075016.686 * Math.cos(Math.PI / 4)) / SCALE;
const tol = (meters) => meters / metersPerUnitAt45;

// ---------- geometry helpers (projected integer space) ----------
function project(coords) {
  return coords.map(([lon, lat]) => [mx(lon), my(lat)]);
}
function dp(points, tolerance) {
  if (points.length <= 2 || tolerance <= 0) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  const t2 = tolerance * tolerance;
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let maxD = -1;
    let idx = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      let d;
      if (len2 === 0) d = (px - ax) ** 2 + (py - ay) ** 2;
      else {
        const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
        d = (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2;
      }
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > t2) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}
function ringArea(r) {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]);
  return Math.abs(a / 2);
}
// Sutherland–Hodgman clip of a ring to an axis-aligned rectangle.
function clipRing(ring, [x0, y0, x1, y1]) {
  const edges = [
    (p) => p[0] >= x0, (p) => p[0] <= x1, (p) => p[1] >= y0, (p) => p[1] <= y1,
  ];
  const inter = [
    (a, b) => [x0, a[1] + ((b[1] - a[1]) * (x0 - a[0])) / (b[0] - a[0])],
    (a, b) => [x1, a[1] + ((b[1] - a[1]) * (x1 - a[0])) / (b[0] - a[0])],
    (a, b) => [a[0] + ((b[0] - a[0]) * (y0 - a[1])) / (b[1] - a[1]), y0],
    (a, b) => [a[0] + ((b[0] - a[0]) * (y1 - a[1])) / (b[1] - a[1]), y1],
  ];
  let out = ring;
  for (let e = 0; e < 4 && out.length; e++) {
    const input = out;
    out = [];
    for (let i = 0; i < input.length; i++) {
      const cur = input[i];
      const prev = input[(i + input.length - 1) % input.length];
      const ci = edges[e](cur);
      const pi = edges[e](prev);
      if (ci) {
        if (!pi) out.push(inter[e](prev, cur));
        out.push(cur);
      } else if (pi) out.push(inter[e](prev, cur));
    }
  }
  return out.map(([x, y]) => [Math.round(x), Math.round(y)]);
}
// Cohen–Sutherland style: split a polyline into the pieces inside the rectangle.
function clipLine(line, [x0, y0, x1, y1]) {
  const inside = ([x, y]) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
  const pieces = [];
  let cur = [];
  for (let i = 0; i < line.length; i++) {
    const p = line[i];
    if (inside(p)) {
      if (!cur.length && i > 0) cur.push(line[i - 1]); // keep the edge crossing
      cur.push(p);
    } else if (cur.length) {
      cur.push(p);
      pieces.push(cur);
      cur = [];
    }
  }
  if (cur.length > 1) pieces.push(cur);
  return pieces.filter((p) => p.length > 1);
}
const bboxOf = (pts) => {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for (const [x, y] of pts) {
    if (x < a) a = x;
    if (y < b) b = y;
    if (x > c) c = x;
    if (y > d) d = y;
  }
  return [a, b, c, d];
};
const overlaps = (p, q) => p[0] <= q[2] && p[2] >= q[0] && p[1] <= q[3] && p[3] >= q[1];
const delta = (pts) => {
  const out = [];
  let px = 0, py = 0;
  for (const [x, y] of pts) {
    out.push(x - px, y - py);
    px = x;
    py = y;
  }
  return out;
};
const lonlatBox = ([w, s, e, n]) => [mx(w), my(n), mx(e), my(s)]; // projected y grows southward

// ---------- regions ----------
const REGIONS = {
  overview: { name: "Michigan statewide overview", bbox: [-92.6, 40.9, -80.4, 49.0] },
  up: { name: "Upper Peninsula & Isle Royale", bbox: [-90.7, 45.0, -83.2, 48.45] },
  nlp: { name: "Northern Lower Peninsula", bbox: [-87.3, 43.55, -82.3, 46.05] },
  slp: { name: "Southern Lower Peninsula", bbox: [-87.3, 41.55, -82.1, 43.95] },
};

// ---------- sources ----------
const gj = async (name) => JSON.parse(await readFile(join(NE, "geojson", name), "utf8")).features.filter((f) => f.geometry);
const polysOf = (g) => (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []);
const linesOf = (g) => (g.type === "LineString" ? [g.coordinates] : g.type === "MultiLineString" ? g.coordinates : []);
const STATES = new Set(["US-MI", "US-WI", "US-MN", "US-IL", "US-IN", "US-OH", "US-PA", "US-NY", "CA-ON"]);

const land = (await gj("ne_10m_land.geojson")).flatMap((f) => polysOf(f.geometry));
const islands = (await gj("ne_10m_minor_islands.geojson")).flatMap((f) => polysOf(f.geometry));
const lakes = [...(await gj("ne_10m_lakes.geojson")), ...(await gj("ne_10m_lakes_north_america.geojson"))];
const rivers = [...(await gj("ne_10m_rivers_lake_centerlines.geojson")), ...(await gj("ne_10m_rivers_north_america.geojson"))];
const states = (await gj("ne_10m_admin_1_states_provinces.geojson")).filter((f) => STATES.has(f.properties.iso_3166_2));
const counties = (await gj("ne_10m_admin_2_counties.geojson")).filter((f) => f.properties.REGION === "MI");
const parks = await gj("ne_10m_parks_and_protected_lands_area.geojson");
const roads = (await readShapefile(join(NE, "10m_cultural/ne_10m_roads_north_america"))).filter((f) =>
  ["United States", "Canada"].includes(f.properties.country),
);

// Roads: class 0 = interstate/freeway/tollway, 1 = primary, 2 = secondary, 3 = other paved/unpaved, 4 = ferry
const roadClass = (p) =>
  p.type === "Ferry" ? 4 : /Freeway|Tollway/.test(p.type) || p.class === "Interstate" ? 0 : p.type === "Primary" ? 1 : p.type === "Secondary" ? 2 : 3;
const routeName = (p) => {
  if (!p.number) return "";
  if (p.prefix === "I") return "I-" + p.number;
  if (p.prefix === "US") return "US-" + p.number;
  if (p.state === "Michigan") return "M-" + p.number;
  return "";
};

// ---------- places (Census Gazetteer + GNIS) ----------
const pipe = async (file) => {
  const lines = (await readFile(join(USGEO, file), "utf8")).trim().split(/\r?\n/);
  const head = lines[0].split("|").map((h) => h.trim());
  return lines.slice(1).map((l) => Object.fromEntries(l.split("|").map((v, i) => [head[i], v.trim()])));
};
const csv = async (file) => {
  const lines = (await readFile(join(USGEO, file), "utf8")).trim().split(/\r?\n/);
  const head = lines[0].split(",");
  return lines.slice(1).map((l) => {
    const cells = l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"'));
    return Object.fromEntries(head.map((h, i) => [h, cells[i]]));
  });
};
const popPlaces = new Map(
  JSON.parse(await readFile(join(USGEO, "data/raw/demographics/place_2023.json"), "utf8"))
    .slice(1)
    .filter((r) => r[3] === "26")
    .map((r) => ["26" + r[4], Number(r[1])]),
);
const popCousubs = new Map(
  JSON.parse(await readFile(join(USGEO, "data/raw/demographics/county_subdivision_2023.json"), "utf8"))
    .slice(1)
    .filter((r) => r[3] === "26")
    .map((r) => [r[3] + r[4] + r[5], Number(r[1])]),
);
const countyName = new Map(counties.map((c) => [String(c.properties.CODE_LOCAL || c.properties.FIPS || "").slice(-3), c.properties.NAME]));
// kinds: 0 city, 1 village, 2 CDP, 3 township, 4 community (GNIS)
const places = [];
for (const r of await pipe("data/raw/gazetteer/2025_Gaz_place_national.txt")) {
  if (r.USPS !== "MI") continue;
  const kind = / city$/.test(r.NAME) ? 0 : / village$/.test(r.NAME) ? 1 : 2;
  const name = r.NAME.replace(/ (city|village|CDP)$/, "");
  places.push({ name, kind, lat: +r.INTPTLAT, lon: +r.INTPTLONG, pop: popPlaces.get(r.GEOID) || 0, src: "census-place" });
}
for (const r of await pipe("data/raw/gazetteer/2025_Gaz_cousubs_national.txt")) {
  if (r.USPS !== "MI" || !/township$/.test(r.NAME)) continue;
  places.push({
    name: r.NAME.replace(/ charter township$/, " Charter Twp").replace(/ township$/, " Twp"),
    kind: 3, lat: +r.INTPTLAT, lon: +r.INTPTLONG, pop: popCousubs.get(r.GEOID) || 0, county: countyName.get(r.GEOID.slice(2, 5)) || "", src: "census-cousub",
  });
}
for (const r of await csv("data/processed/gnis_non_census_places.csv")) {
  if (r.State !== "MI") continue;
  places.push({ name: r.Name, kind: 4, lat: +r.Latitude, lon: +r.Longitude, pop: 0, src: "gnis" });
}
// County names by point-in-polygon against Natural Earth county shapes (coarse; used only to disambiguate search results).
const countyShapes = counties.map((f) => ({ name: f.properties.NAME, polys: polysOf(f.geometry), bb: f.bbox }));
function inRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function countyAt(lon, lat) {
  let best = "";
  let bestD = Infinity;
  for (const c of countyShapes) {
    for (const p of c.polys) if (inRing(lon, lat, p[0])) return c.name;
    const [w, s, e, n] = c.bb || [0, 0, 0, 0];
    const d = Math.hypot(Math.max(w - lon, 0, lon - e), Math.max(s - lat, 0, lat - n));
    if (d < bestD) {
      bestD = d;
      best = c.name;
    }
  }
  return bestD < 0.15 ? best : "";
}
for (const p of places) if (!p.county) p.county = countyAt(p.lon, p.lat);
// Deduplicate identical names at nearly identical points.
const seen = new Set();
const placeRows = places
  .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon) && p.name)
  .sort((a, b) => a.kind - b.kind || b.pop - a.pop)
  .filter((p) => {
    const k = p.name.toLowerCase() + "@" + p.lat.toFixed(2) + "," + p.lon.toFixed(2);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
// Label rank 0 (always) … 6 (only when zoomed in close)
const rank = (p) =>
  p.kind === 4 ? 6 : p.kind === 3 ? 5 : p.pop >= 100000 ? 0 : p.pop >= 30000 ? 1 : p.pop >= 10000 ? 2 : p.pop >= 3000 ? 3 : 4;

// Hand-placed water labels (positions chosen by the app authors for readability).
const waterLabels = [
  ["Lake Superior", 47.45, -87.3, 0], ["Lake Michigan", 43.9, -87.0, 0], ["Lake Huron", 44.6, -82.6, 0], ["Lake Erie", 41.95, -82.4, 1],
  ["Lake St. Clair", 42.45, -82.72, 2], ["Saginaw Bay", 43.95, -83.55, 2], ["Green Bay", 45.1, -87.65, 2], ["Grand Traverse Bay", 45.0, -85.5, 3],
  ["Little Traverse Bay", 45.41, -85.04, 4], ["Whitefish Bay", 46.62, -84.75, 3], ["Keweenaw Bay", 46.85, -88.35, 3], ["Thunder Bay", 45.03, -83.33, 4],
  ["Straits of Mackinac", 45.81, -84.8, 3], ["Bay de Noc", 45.75, -86.95, 4], ["Les Cheneaux Islands", 45.97, -84.35, 5],
];

// ---------- layer builders ----------
function buildRegion(id, { tolerance, roadMaxClass, riverMinRank, placesIncluded }) {
  const box = lonlatBox(REGIONS[id].bbox);
  const outPolys = (polys, minArea = 0) => {
    const out = [];
    for (const poly of polys) {
      const rings = [];
      for (const ring of poly) {
        const pr = project(ring);
        const bb = bboxOf(pr);
        if (!overlaps(bb, box)) continue;
        const clipped = clipRing(pr, box);
        if (clipped.length < 3) continue;
        // Small rings (islands, small lakes) keep more detail so they are not erased by simplification.
        const [a, b, c, d] = bboxOf(clipped);
        const small = Math.hypot(c - a, d - b) < tolerance * 25;
        const s = dp(clipped, small ? tolerance / 5 : tolerance);
        if (s.length < 3 || ringArea(s) < minArea) continue;
        rings.push(delta(s));
      }
      if (rings.length) out.push(rings);
    }
    return out;
  };
  const outLines = (lines) => {
    const out = [];
    for (const l of lines) {
      const pl = project(l);
      if (!overlaps(bboxOf(pl), box)) continue;
      for (const piece of clipLine(pl, box)) {
        const s = dp(piece, tolerance);
        if (s.length > 1) out.push(s);
      }
    }
    return out;
  };
  const minArea = (tolerance * 0.6) ** 2;
  const layer = {};
  layer.land = outPolys([...land, ...islands], minArea);
  layer.water = outPolys(lakes.flatMap((f) => polysOf(f.geometry)), minArea);
  layer.rivers = rivers
    .filter((f) => (f.properties.scalerank ?? 10) <= riverMinRank)
    .flatMap((f) => outLines(linesOf(f.geometry)).map((s) => ({ c: delta(s), n: f.properties.name || "" })));
  layer.parks = parks
    .filter((f) => overlaps(bboxOf(project(polysOf(f.geometry)[0]?.[0] || [[0, 0]])), box))
    .map((f) => ({ n: f.properties.name || "", p: outPolys(polysOf(f.geometry), minArea) }))
    .filter((x) => x.p.length);
  // State/province and county boundaries are drawn as polygon outlines.
  layer.states = states.map((f) => outPolys(polysOf(f.geometry))).flat();
  layer.counties = counties.map((f) => outPolys(polysOf(f.geometry))).flat();
  layer.roads = roads
    .filter((f) => roadClass(f.properties) <= roadMaxClass)
    .flatMap((f) => outLines(f.geometry.coordinates).map((s) => ({ c: delta(s), k: roadClass(f.properties), n: routeName(f.properties) })));
  const labels = {
    water: [
      ...waterLabels.map(([n, lat, lon, r]) => [n, mx(lon), my(lat), r]),
      ...lakes
        .filter((f) => f.properties.name && !/^Lake (Superior|Michigan|Huron|Erie|Ontario|St\.? Clair|Saint Clair)$/.test(f.properties.name) && !waterLabels.some((w) => w[0] === f.properties.name))
        .map((f) => {
          const ring = project(polysOf(f.geometry)[0][0]);
          const [a, b, c, d] = bboxOf(ring);
          return [f.properties.name, Math.round((a + c) / 2), Math.round((b + d) / 2), (f.properties.scalerank ?? 9) <= 6 ? 3 : 5];
        })
        .filter(([, x, y]) => x >= box[0] && x <= box[2] && y >= box[1] && y <= box[3]),
    ],
    counties: counties
      .map((f) => {
        const ring = project(polysOf(f.geometry).sort((p, q) => q[0].length - p[0].length)[0][0]);
        const [a, b, c, d] = bboxOf(ring);
        return [f.properties.NAME + " Co.", Math.round((a + c) / 2), Math.round((b + d) / 2)];
      })
      .filter(([, x, y]) => x >= box[0] && x <= box[2] && y >= box[1] && y <= box[3]),
    parks: layer.parks.map((p) => p.n).filter(Boolean),
  };
  const pack = {
    format: "urban-haven-map",
    schema: 1,
    id,
    name: REGIONS[id].name,
    version: DATA_VERSION,
    bbox: REGIONS[id].bbox,
    scale: SCALE,
    toleranceMeters: Math.round(tolerance * metersPerUnitAt45),
    layers: layer,
    labels,
  };
  if (placesIncluded)
    pack.places = placeRows.map((p) => [p.name, p.kind, mx(p.lon), my(p.lat), rank(p), p.pop, p.county || ""]);
  return pack;
}

await rm(OUT, { recursive: true, force: true });
await mkdir(join(OUT, "packs"), { recursive: true });
const sha = (b) => createHash("sha256").update(b).digest("hex");
const overview = buildRegion("overview", { tolerance: tol(450), roadMaxClass: 2, riverMinRank: 8, placesIncluded: true });
overview.minZoom = 5;
overview.maxZoom = 9;
const overviewGz = gzipSync(JSON.stringify(overview), { level: 9 });
await writeFile(join(OUT, "overview.json.gz"), overviewGz);
const PART = 16 * 1024; // small parts so an interrupted download loses little and resumes part by part
const catalog = {
  format: "urban-haven-map-catalog",
  schema: 1,
  version: DATA_VERSION,
  built: new Date().toISOString().slice(0, 10),
  overview: { file: "overview.json.gz", bytes: overviewGz.length, sha256: sha(overviewGz), places: placeRows.length, zoom: [5, 9] },
  packs: [],
  attribution: [
    "Natural Earth (public domain) — land, water, rivers, roads, counties, parks",
    "U.S. Census Bureau 2025 Gazetteer (public domain) — places and townships",
    "USGS Geographic Names Information System (public domain) — small communities",
  ],
};
for (const id of ["up", "nlp", "slp"]) {
  const pack = buildRegion(id, { tolerance: tol(35), roadMaxClass: 4, riverMinRank: 12, placesIncluded: false });
  pack.minZoom = 8;
  pack.maxZoom = 12;
  const gz = gzipSync(JSON.stringify(pack), { level: 9 });
  const dir = join(OUT, "packs", id, DATA_VERSION);
  await mkdir(dir, { recursive: true });
  const parts = [];
  for (let i = 0, n = 0; i < gz.length; i += PART, n++) {
    const chunk = gz.subarray(i, i + PART);
    const file = `packs/${id}/${DATA_VERSION}/part-${String(n).padStart(3, "0")}.bin`;
    await writeFile(join(OUT, file), chunk);
    parts.push({ file, bytes: chunk.length, sha256: sha(chunk) });
  }
  const counts = Object.fromEntries(Object.entries(pack.layers).map(([k, v]) => [k, v.length]));
  catalog.packs.push({
    id, name: REGIONS[id].name, bbox: REGIONS[id].bbox, version: DATA_VERSION, zoom: [8, 12], bytes: gz.length, sha256: sha(gz),
    parts, features: counts, toleranceMeters: pack.toleranceMeters,
  });
  console.log(`pack ${id}: ${(gz.length / 1024).toFixed(0)} KB gz, ${parts.length} parts`, counts);
}
await writeFile(join(OUT, "catalog.json"), JSON.stringify(catalog, null, 2));
const o = Object.fromEntries(Object.entries(overview.layers).map(([k, v]) => [k, v.length]));
console.log(`overview: ${(overviewGz.length / 1024).toFixed(0)} KB gz, ${placeRows.length} places`, o);
console.log("place kinds:", [0, 1, 2, 3, 4].map((k) => placeRows.filter((p) => p.kind === k).length).join(" / "), "(city/village/CDP/township/community)");
