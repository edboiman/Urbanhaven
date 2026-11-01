// Canvas 2D renderer for the offline Michigan map. No network, no web fonts:
// labels use the device's system sans-serif font.
import type { Pack, Path, Poly, Place } from "./data";
import { xToLon, yToLat, lonToX, latToY } from "./data";

export type View = { x: number; y: number; z: number }; // center in world units (0..1), zoom level
export type MarkerDraw = {
  id: string;
  x: number;
  y: number;
  name: string;
  color: string;
  selected?: boolean;
};
export type Theme = {
  nodata: string;
  water: string;
  land: string;
  park: string;
  county: string;
  state: string;
  river: string;
  road: string[];
  casing: string;
  label: string;
  halo: string;
  waterLabel: string;
  countyLabel: string;
};
export const lightTheme: Theme = {
  nodata: "#dcdcd6",
  water: "#a9cbe0",
  land: "#f2efe4",
  park: "#d5e5c8",
  county: "#b9b2a0",
  state: "#8d7f74",
  river: "#86b4d1",
  road: ["#c8553d", "#d98f3e", "#c9a35a", "#b9b2a6", "#5c8bb0"],
  casing: "#fffaf0",
  label: "#1f2a24",
  halo: "rgba(255,253,246,0.92)",
  waterLabel: "#2e5f80",
  countyLabel: "#857b6d",
};
export const darkTheme: Theme = {
  nodata: "#30302e",
  water: "#1d3442",
  land: "#26302a",
  park: "#2c3f2d",
  county: "#5a5f55",
  state: "#8a8f80",
  river: "#3d6d8a",
  road: ["#e07a5f", "#e0a458", "#c9b27a", "#7d8277", "#7fa9cc"],
  casing: "#1a221d",
  label: "#eef1e6",
  halo: "rgba(20,28,23,0.9)",
  waterLabel: "#9cc3dd",
  countyLabel: "#a3a897",
};

export const worldSize = (z: number) => 256 * 2 ** z;
export function metersPerPixel(view: View) {
  const lat = yToLat(view.y);
  return (40075016.686 * Math.cos((lat * Math.PI) / 180)) / worldSize(view.z);
}

type Ctx = CanvasRenderingContext2D;
type Box = [number, number, number, number];

export class Renderer {
  constructor(private readonly canvas: HTMLCanvasElement) {}
  draw(
    view: View,
    overview: Pack,
    details: Pack[],
    markers: MarkerDraw[],
    here: { x: number; y: number; label: string } | null,
    theme: Theme,
    highlight?: { x: number; y: number } | null,
    route: { lat: number; lon: number; visited: boolean }[] = [],
  ) {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (
      this.canvas.width !== Math.round(w * dpr) ||
      this.canvas.height !== Math.round(h * dpr)
    ) {
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ws = worldSize(view.z);
    const ox = view.x * ws - w / 2;
    const oy = view.y * ws - h / 2;
    const vb: Box = [ox / ws, oy / ws, (ox + w) / ws, (oy + h) / ws];
    const px = (wx: number) => wx * ws - ox;
    const py = (wy: number) => wy * ws - oy;
    // Outside the data coverage: neutral "no data" fill, so it is never mistaken for water.
    ctx.fillStyle = theme.nodata;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = theme.water;
    ctx.fillRect(
      px(overview.world[0]),
      py(overview.world[1]),
      px(overview.world[2]) - px(overview.world[0]),
      py(overview.world[3]) - py(overview.world[1]),
    );
    const useDetail =
      view.z >= 8.5 ? details.filter((d) => overlap(d.world, vb)) : [];
    // Overview everywhere except inside installed detail packs (which draw themselves).
    ctx.save();
    if (useDetail.length) {
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      for (const d of useDetail)
        ctx.rect(
          px(d.world[2]),
          py(d.world[1]),
          px(d.world[0]) - px(d.world[2]),
          py(d.world[3]) - py(d.world[1]),
        );
      ctx.clip("evenodd");
    }
    this.layers(ctx, overview, view, vb, px, py, theme);
    ctx.restore();
    for (const d of useDetail) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(
        px(d.world[0]),
        py(d.world[1]),
        px(d.world[2]) - px(d.world[0]),
        py(d.world[3]) - py(d.world[1]),
      );
      ctx.clip();
      this.layers(ctx, d, view, vb, px, py, theme);
      ctx.restore();
    }
    this.labels(
      ctx,
      view,
      vb,
      px,
      py,
      theme,
      overview,
      useDetail.length ? useDetail : [overview],
      markers,
      w,
      h,
    );
    ctx.save();
    ctx.strokeStyle = "#a23c77";
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    route.forEach((p, i) => {
      const x = px(lonToX(p.lon)),
        y = py(latToY(p.lat));
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    route.forEach((p, i) => {
      const x = px(lonToX(p.lon)),
        y = py(latToY(p.lat));
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fillStyle = p.visited ? "#27643c" : "#a23c77";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#fff";
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(String(i + 1), x, y + 4);
    });
    ctx.restore();
    for (const m of markers)
      this.marker(ctx, px(m.x), py(m.y), m.color, m.selected);
    if (highlight) this.ring(ctx, px(highlight.x), py(highlight.y), "#c8553d");
    if (here) this.here(ctx, px(here.x), py(here.y));
  }
  private layers(
    ctx: Ctx,
    p: Pack,
    view: View,
    vb: Box,
    px: (x: number) => number,
    py: (y: number) => number,
    t: Theme,
  ) {
    const z = view.z;
    fillPolys(ctx, p.land, vb, px, py, t.land);
    if (z >= 6.5) fillPolys(ctx, p.parks, vb, px, py, t.park);
    fillPolys(ctx, p.water, vb, px, py, t.water);
    if (z >= 6.5)
      strokePaths(ctx, p.rivers, vb, px, py, t.river, z >= 9 ? 1.4 : 0.9);
    if (z >= 6) strokePolys(ctx, p.counties, vb, px, py, t.county, 0.8, [4, 3]);
    strokePolys(ctx, p.states, vb, px, py, t.state, 1.3, [7, 4]);
    // Roads: minor first, then major, with a light casing on major roads.
    const minClass = z < 6.5 ? 0 : z < 7.5 ? 1 : z < 8.5 ? 2 : 4;
    const width = (k: number) =>
      (k === 0 ? 1.4 : k === 1 ? 1.1 : k === 2 ? 0.9 : 0.7) *
      (z >= 10 ? 2 : z >= 8.5 ? 1.5 : 1);
    for (let k = minClass; k >= 0; k--) {
      const roads = p.roads.filter((r) => r.k === k && overlap(r.bb, vb));
      if (!roads.length) continue;
      if (k <= 1 && z >= 7)
        strokePaths(ctx, roads, vb, px, py, t.casing, width(k) + 2);
      strokePaths(
        ctx,
        roads,
        vb,
        px,
        py,
        t.road[k],
        width(k),
        k === 4 ? [5, 4] : undefined,
      );
    }
  }
  private labels(
    ctx: Ctx,
    view: View,
    vb: Box,
    px: (x: number) => number,
    py: (y: number) => number,
    t: Theme,
    overview: Pack,
    packs: Pack[],
    markers: MarkerDraw[],
    w: number,
    h: number,
  ) {
    const placed: Box[] = [];
    const free = (b: Box) => {
      if (b[0] < 2 || b[1] < 2 || b[2] > w - 2 || b[3] > h - 2) return false;
      for (const o of placed)
        if (b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1])
          return false;
      placed.push(b);
      return true;
    };
    const z = view.z;
    // Reserve marker spaces first so labels do not cover user pins.
    for (const m of markers)
      placed.push([px(m.x) - 10, py(m.y) - 28, px(m.x) + 10, py(m.y) + 2]);
    // Places by rank, then population.
    const maxRank =
      z < 6
        ? 0
        : z < 6.8
          ? 1
          : z < 7.6
            ? 2
            : z < 8.4
              ? 3
              : z < 9.2
                ? 4
                : z < 10.2
                  ? 5
                  : 6;
    const candidates: Place[] = overview.places.filter(
      (p) =>
        p.rank <= maxRank &&
        p.x >= vb[0] &&
        p.x <= vb[2] &&
        p.y >= vb[1] &&
        p.y <= vb[3],
    );
    candidates.sort((a, b) => a.rank - b.rank || b.pop - a.pop);
    for (const p of candidates.slice(0, 600)) {
      const size =
        p.rank === 0 ? 15 : p.rank <= 2 ? 13.5 : p.kind === 3 ? 11 : 12;
      const font = `${p.rank <= 1 ? "700" : p.kind === 3 ? "400 italic" : "600"} ${size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
      ctx.font = font.replace("400 italic", "italic 400");
      const tw = ctx.measureText(p.name).width;
      const x = px(p.x);
      const y = py(p.y);
      const box: Box = [x + 5, y - size / 2 - 2, x + 9 + tw, y + size / 2 + 2];
      if (!free(box)) continue;
      if (p.kind !== 3) {
        ctx.fillStyle = t.label;
        ctx.beginPath();
        ctx.arc(x, y, p.rank <= 1 ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      haloText(
        ctx,
        p.name,
        x + 7,
        y + size * 0.35,
        p.kind === 3 ? t.countyLabel : t.label,
        t.halo,
      );
    }
    // County names at mid zooms.
    if (z >= 6.5 && z < 9.5) {
      ctx.font = `600 11px system-ui, sans-serif`;
      for (const c of overview.countyLabels) {
        if (c.x < vb[0] || c.x > vb[2] || c.y < vb[1] || c.y > vb[3]) continue;
        const text = c.name.toUpperCase();
        const tw = ctx.measureText(text).width;
        const b: Box = [
          px(c.x) - tw / 2,
          py(c.y) - 7,
          px(c.x) + tw / 2,
          py(c.y) + 7,
        ];
        if (free(b))
          haloText(
            ctx,
            text,
            px(c.x) - tw / 2,
            py(c.y) + 4,
            t.countyLabel,
            t.halo,
          );
      }
    }
    // Water names.
    ctx.font = `italic 600 12px system-ui, sans-serif`;
    const waterRank = z < 6 ? 0 : z < 7 ? 2 : z < 8.5 ? 3 : 5;
    for (const l of overview.waterLabels) {
      if (
        l.rank > waterRank ||
        l.x < vb[0] ||
        l.x > vb[2] ||
        l.y < vb[1] ||
        l.y > vb[3]
      )
        continue;
      const tw = ctx.measureText(l.name).width;
      const b: Box = [
        px(l.x) - tw / 2,
        py(l.y) - 8,
        px(l.x) + tw / 2,
        py(l.y) + 8,
      ];
      if (free(b))
        haloText(
          ctx,
          l.name,
          px(l.x) - tw / 2,
          py(l.y) + 4,
          t.waterLabel,
          t.halo,
        );
    }
    // Route numbers on major roads.
    if (z >= 7.5) {
      ctx.font = `700 10.5px system-ui, sans-serif`;
      const seen = new Map<string, number>();
      for (const pack of packs)
        for (const r of pack.roads) {
          if (!r.n || r.k > (z >= 9 ? 2 : 1) || !overlap(r.bb, vb)) continue;
          const mid = Math.floor(r.pts.length / 4) * 2;
          const x = px(r.pts[mid]);
          const y = py(r.pts[mid + 1]);
          const n = seen.get(r.n) || 0;
          if (n >= 3) continue;
          const tw = ctx.measureText(r.n).width + 8;
          const b: Box = [x - tw / 2, y - 8, x + tw / 2, y + 8];
          if (!free(b)) continue;
          seen.set(r.n, n + 1);
          ctx.fillStyle = r.n.startsWith("I-")
            ? "#2a4e8a"
            : r.n.startsWith("US-")
              ? "#f7f7f2"
              : "#f7f7f2";
          ctx.strokeStyle = "#333";
          ctx.lineWidth = 1;
          roundRect(ctx, b[0], b[1], tw, 16, 4);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = r.n.startsWith("I-") ? "#fff" : "#1d1d1d";
          ctx.fillText(r.n, b[0] + 4, y + 4);
        }
    }
    // Marker names.
    ctx.font = `700 12px system-ui, sans-serif`;
    for (const m of markers) {
      const x = px(m.x);
      const y = py(m.y);
      const tw = ctx.measureText(m.name).width;
      const b: Box = [x + 10, y - 26, x + 14 + tw, y - 12];
      if (free(b)) haloText(ctx, m.name, x + 12, y - 15, t.label, t.halo);
    }
  }
  private marker(
    ctx: Ctx,
    x: number,
    y: number,
    color: string,
    selected?: boolean,
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-9, -12, -9, -24, 0, -24);
    ctx.bezierCurveTo(9, -24, 9, -12, 0, 0);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = selected ? 3 : 1.5;
    ctx.strokeStyle = selected ? "#000" : "#fff";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -16, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.restore();
  }
  private ring(ctx: Ctx, x: number, y: number, color: string) {
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  private here(ctx: Ctx, x: number, y: number) {
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(37,99,235,0.25)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = "#2563eb";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#fff";
    ctx.stroke();
  }
}

function overlap(a: Box, b: Box) {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}
function tracePath(
  ctx: Ctx,
  p: Path,
  px: (x: number) => number,
  py: (y: number) => number,
  close: boolean,
) {
  const pts = p.pts;
  if (pts.length < 4) return;
  ctx.moveTo(px(pts[0]), py(pts[1]));
  let lx = px(pts[0]);
  let ly = py(pts[1]);
  for (let i = 2; i < pts.length; i += 2) {
    const x = px(pts[i]);
    const y = py(pts[i + 1]);
    if (Math.abs(x - lx) + Math.abs(y - ly) < 0.6 && i < pts.length - 2)
      continue; // skip sub-pixel steps
    ctx.lineTo(x, y);
    lx = x;
    ly = y;
  }
  if (close) ctx.closePath();
}
function fillPolys(
  ctx: Ctx,
  polys: Poly[],
  vb: Box,
  px: (x: number) => number,
  py: (y: number) => number,
  color: string,
) {
  ctx.beginPath();
  for (const p of polys)
    if (overlap(p.bb, vb))
      for (const r of p.rings) tracePath(ctx, r, px, py, true);
  ctx.fillStyle = color;
  ctx.fill("evenodd");
}
function strokePolys(
  ctx: Ctx,
  polys: Poly[],
  vb: Box,
  px: (x: number) => number,
  py: (y: number) => number,
  color: string,
  width: number,
  dash?: number[],
) {
  ctx.beginPath();
  for (const p of polys)
    if (overlap(p.bb, vb))
      for (const r of p.rings)
        if (overlap(r.bb, vb)) tracePath(ctx, r, px, py, true);
  ctx.setLineDash(dash || []);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.setLineDash([]);
}
function strokePaths(
  ctx: Ctx,
  paths: Path[],
  vb: Box,
  px: (x: number) => number,
  py: (y: number) => number,
  color: string,
  width: number,
  dash?: number[],
) {
  ctx.beginPath();
  for (const p of paths)
    if (overlap(p.bb, vb)) tracePath(ctx, p, px, py, false);
  ctx.setLineDash(dash || []);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.setLineDash([]);
}
function haloText(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  color: string,
  halo: string,
) {
  ctx.lineJoin = "round";
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = halo;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
function roundRect(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
export const formatLatLon = (x: number, y: number) => {
  const lat = yToLat(y);
  const lon = xToLon(x);
  return `${Math.abs(lat).toFixed(5)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(5)}° ${lon >= 0 ? "E" : "W"}`;
};
