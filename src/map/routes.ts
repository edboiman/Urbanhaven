export type Waypoint = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  notes: string;
  visited: boolean;
};
export type WaypointRoute = {
  type: "waypoint-route";
  name: string;
  notes: string;
  points: Waypoint[];
};
export const emptyRoute = (): WaypointRoute => ({
  type: "waypoint-route",
  name: "My path",
  notes: "",
  points: [],
});
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const bounded = (v: unknown, n: number) =>
  typeof v === "string" && v.length <= n;
export function readRoute(v: unknown): WaypointRoute {
  if (
    !record(v) ||
    v.type !== "waypoint-route" ||
    !bounded(v.name, 120) ||
    !bounded(v.notes, 4000) ||
    !Array.isArray(v.points) ||
    v.points.length > 100
  )
    throw new Error("Invalid waypoint path.");
  const ids = new Set<string>();
  for (const p of v.points) {
    if (
      !record(p) ||
      !bounded(p.id, 100) ||
      !p.id ||
      ids.has(p.id as string) ||
      !bounded(p.name, 120) ||
      !bounded(p.notes, 1000) ||
      typeof p.visited !== "boolean" ||
      typeof p.lat !== "number" ||
      !Number.isFinite(p.lat) ||
      Math.abs(p.lat) > 85 ||
      typeof p.lon !== "number" ||
      !Number.isFinite(p.lon) ||
      Math.abs(p.lon) > 180
    )
      throw new Error("Invalid waypoint coordinates or notes.");
    ids.add(p.id as string);
  }
  return JSON.parse(JSON.stringify(v)) as WaypointRoute;
}
export function leg(
  a: Pick<Waypoint, "lat" | "lon">,
  b: Pick<Waypoint, "lat" | "lon">,
) {
  const r = Math.PI / 180;
  const dl = (b.lon - a.lon) * r,
    dp = (b.lat - a.lat) * r;
  const h =
    Math.sin(dp / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dl / 2) ** 2;
  const km = 6371.0088 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
  const y = Math.sin(dl) * Math.cos(b.lat * r);
  const x =
    Math.cos(a.lat * r) * Math.sin(b.lat * r) -
    Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos(dl);
  return {
    km,
    bearing: km < 0.000001 ? null : (Math.atan2(y, x) / r + 360) % 360,
  };
}
export const routeLegs = (points: Waypoint[]) =>
  points.slice(1).map((p, i) => leg(points[i], p));
export function movePoint(points: Waypoint[], i: number, delta: number) {
  const out = points.slice(),
    j = i + delta;
  if (i >= 0 && i < out.length && j >= 0 && j < out.length)
    [out[i], out[j]] = [out[j], out[i]];
  return out;
}
const xml = (s: string) =>
  s.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
export function routeGPX(input: WaypointRoute) {
  const r = readRoute(input);
  return `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="Urban Haven" xmlns="http://www.topografix.com/GPX/1/1"><rte><name>${xml(r.name)}</name><desc>${xml("Straight-line planning waypoints only. " + r.notes)}</desc>${r.points.map((p) => `<rtept lat="${p.lat}" lon="${p.lon}"><name>${xml(p.name)}</name><desc>${xml(p.notes)}</desc></rtept>`).join("")}</rte></gpx>`;
}
export const validMarkerPhoto = (v: unknown): v is string =>
  typeof v === "string" &&
  v.length <= 600000 &&
  /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(v);
