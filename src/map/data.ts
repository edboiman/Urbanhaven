// Offline map data: decoding, projection and local place search.
export type RawPack = {
  format: "urban-haven-map";
  schema: 1;
  id: string;
  name: string;
  version: string;
  bbox: [number, number, number, number];
  scale: number;
  toleranceMeters: number;
  minZoom: number;
  maxZoom: number;
  layers: {
    land: number[][][];
    water: number[][][];
    rivers: { c: number[]; n: string }[];
    parks: { n: string; p: number[][][] }[];
    states: number[][][];
    counties: number[][][];
    roads: { c: number[]; k: number; n: string }[];
  };
  labels: { water: [string, number, number, number][]; counties: [string, number, number][]; parks: string[] };
  places?: [string, number, number, number, number, number, string][];
};
/** A path in world units (0..1 Web Mercator) with its bounding box. */
export type Path = { pts: Float64Array; bb: [number, number, number, number] };
export type Poly = { rings: Path[]; bb: [number, number, number, number] };
export type Road = Path & { k: number; n: string };
export type Place = { name: string; kind: number; x: number; y: number; rank: number; pop: number; county: string; norm: string };
export type Pack = {
  id: string;
  name: string;
  version: string;
  bbox: [number, number, number, number];
  world: [number, number, number, number];
  minZoom: number;
  maxZoom: number;
  toleranceMeters: number;
  land: Poly[];
  water: Poly[];
  parks: Poly[];
  states: Poly[];
  counties: Poly[];
  rivers: Path[];
  roads: Road[];
  waterLabels: { name: string; x: number; y: number; rank: number }[];
  countyLabels: { name: string; x: number; y: number }[];
  places: Place[];
};
export const placeKinds = ["City", "Village", "Census place", "Township", "Community"];

export const lonToX = (lon: number) => (lon + 180) / 360;
export const latToY = (lat: number) => {
  const s = Math.sin((lat * Math.PI) / 180);
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
};
export const xToLon = (x: number) => x * 360 - 180;
export const yToLat = (y: number) => (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI;

function decodePath(delta: number[], scale: number): Path {
  const pts = new Float64Array(delta.length);
  let x = 0;
  let y = 0;
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for (let i = 0; i < delta.length; i += 2) {
    x += delta[i];
    y += delta[i + 1];
    const px = x / scale;
    const py = y / scale;
    pts[i] = px;
    pts[i + 1] = py;
    if (px < a) a = px;
    if (py < b) b = py;
    if (px > c) c = px;
    if (py > d) d = py;
  }
  return { pts, bb: [a, b, c, d] };
}
function decodePoly(rings: number[][], scale: number): Poly {
  const rs = rings.map((r) => decodePath(r, scale));
  return {
    rings: rs,
    bb: rs.reduce<[number, number, number, number]>((m, r) => [Math.min(m[0], r.bb[0]), Math.min(m[1], r.bb[1]), Math.max(m[2], r.bb[2]), Math.max(m[3], r.bb[3])], [Infinity, Infinity, -Infinity, -Infinity]),
  };
}
export const normalizeName = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\bsaint\b/g, "st")
    .replace(/\bst\.\b/g, "st")
    .replace(/\bmount\b/g, "mt")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function validateRaw(raw: unknown): RawPack {
  const r = raw as RawPack;
  if (!r || r.format !== "urban-haven-map" || r.schema !== 1 || !r.layers || typeof r.scale !== "number")
    throw new Error("Map data is not in the expected format.");
  return r;
}

export function decodePack(raw: RawPack): Pack {
  const s = raw.scale;
  const [w, south, e, n] = raw.bbox;
  return {
    id: raw.id,
    name: raw.name,
    version: raw.version,
    bbox: raw.bbox,
    world: [lonToX(w), latToY(n), lonToX(e), latToY(south)],
    minZoom: raw.minZoom,
    maxZoom: raw.maxZoom,
    toleranceMeters: raw.toleranceMeters,
    land: raw.layers.land.map((p) => decodePoly(p, s)),
    water: raw.layers.water.map((p) => decodePoly(p, s)),
    parks: raw.layers.parks.flatMap((p) => p.p.map((q) => decodePoly(q, s))),
    states: raw.layers.states.map((p) => decodePoly(p, s)),
    counties: raw.layers.counties.map((p) => decodePoly(p, s)),
    rivers: raw.layers.rivers.map((r) => decodePath(r.c, s)),
    roads: raw.layers.roads.map((r) => ({ ...decodePath(r.c, s), k: r.k, n: r.n })),
    waterLabels: raw.labels.water.map(([name, x, y, rank]) => ({ name, x: x / s, y: y / s, rank })),
    countyLabels: raw.labels.counties.map(([name, x, y]) => ({ name, x: x / s, y: y / s })),
    places: (raw.places || []).map(([name, kind, x, y, rank, pop, county]) => ({ name, kind, x: x / s, y: y / s, rank, pop, county, norm: normalizeName(name) })),
  };
}

export async function gunzipJSON(bytes: ArrayBuffer | Uint8Array): Promise<unknown> {
  if (typeof DecompressionStream === "undefined")
    throw new Error("This browser cannot unpack offline map data. Update Chrome / Android System WebView.");
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("gzip"));
  const text = await new Response(stream).text();
  return JSON.parse(text);
}

export type SearchHit = { label: string; detail: string; x: number; y: number; zoom: number; kind: "place" | "county" | "water" | "marker"; id?: string };
export function searchPlaces(query: string, places: Place[], extra: SearchHit[] = [], limit = 12): SearchHit[] {
  const q = normalizeName(query);
  if (!q) return [];
  const scored: { hit: SearchHit; score: number }[] = [];
  for (const p of places) {
    let score = -1;
    if (p.norm === q) score = 100;
    else if (p.norm.startsWith(q)) score = 80;
    else if (p.norm.split(" ").some((w) => w.startsWith(q))) score = 60;
    else if (q.length >= 3 && p.norm.includes(q)) score = 40;
    if (score < 0) continue;
    score += (6 - p.rank) * 2 + Math.min(10, Math.log10(p.pop + 1) * 2);
    scored.push({
      hit: { label: p.name, detail: `${placeKinds[p.kind]}${p.county ? ` · ${p.county} County` : ""}`, x: p.x, y: p.y, zoom: p.kind >= 3 ? 11 : p.rank <= 1 ? 10 : 11, kind: "place" },
      score,
    });
  }
  for (const h of extra) {
    const n = normalizeName(h.label);
    const score = n === q ? 110 : n.startsWith(q) ? 90 : n.includes(q) ? 50 : -1;
    if (score >= 0) scored.push({ hit: h, score });
  }
  return scored.sort((a, b) => b.score - a.score || a.hit.label.localeCompare(b.hit.label)).slice(0, limit).map((s) => s.hit);
}

/** Parses "45.85, -84.62", "45.85 N 84.62 W" or degrees-minutes-seconds. */
export function parseCoordinates(input: string): { lat: number; lon: number } | null {
  const s = input.trim().toUpperCase().replace(/[°º]/g, " ").replace(/[′']/g, " ").replace(/[″"]/g, " ");
  const parts = s.split(/[,;]|\s(?=[-+]?\d+(?:\.\d+)?\s*[EW]?\s*$)/);
  const parseOne = (t: string, pos: string, neg: string) => {
    const hemi = t.includes(neg) ? -1 : 1;
    const nums = (t.match(/[-+]?\d+(?:\.\d+)?/g) || []).map(Number);
    if (!nums.length || nums.length > 3) return NaN;
    const [d, m = 0, sec = 0] = nums;
    if (m < 0 || m >= 60 || sec < 0 || sec >= 60) return NaN;
    const sign = d < 0 ? -1 : 1;
    return hemi * sign * (Math.abs(d) + m / 60 + sec / 3600) * (t.includes(pos) ? 1 : 1);
  };
  let a: string, b: string;
  const ns = s.match(/^(.*?[NS])\s*,?\s*(.*[EW])$/);
  if (ns) [a, b] = [ns[1], ns[2]];
  else if (parts.length === 2) [a, b] = parts;
  else {
    const nums = s.match(/[-+]?\d+(?:\.\d+)?/g);
    if (!nums || nums.length !== 2) return null;
    [a, b] = nums;
  }
  const lat = parseOne(a, "N", "S");
  const lon = parseOne(b, "E", "W");
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat: Math.round(lat * 1e6) / 1e6, lon: Math.round(lon * 1e6) / 1e6 };
}
