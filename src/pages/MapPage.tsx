import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "../storage/idb";
import { db, uid } from "../storage/db";
import {
  PageTitle,
  Field,
  Callout,
  useHaven,
  errorMessage,
} from "../components/shared";
import {
  Plus,
  Minus,
  LocateFixed,
  MapPin,
  Search,
  X,
  Download,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Navigation,
  Pencil,
  Save,
  Info,
  Layers,
} from "../components/icons";
import {
  lonToX,
  latToY,
  xToLon,
  yToLat,
  searchPlaces,
  parseCoordinates,
  placeKinds,
  type Pack,
  type SearchHit,
} from "../map/data";
import {
  loadCatalog,
  loadOverview,
  installPack,
  readPack,
  verifyInstalled,
  deletePack,
  storedBytes,
  type Catalog,
  type CatalogPack,
  type InstalledPack,
  type Progress,
} from "../map/packs";
import {
  Renderer,
  lightTheme,
  darkTheme,
  metersPerPixel,
  worldSize,
  formatLatLon,
  type View,
  type MarkerDraw,
} from "../map/render";
import type { MapMarker } from "../types";

import { RoutePlanner } from "../components/RoutePlanner";
import { validMarkerPhoto, type Waypoint } from "../map/routes";
import riverReferences from "../content/michigan-river-references.json";

const MIN_Z = 5;
const MAX_Z = 12;
const OVERVIEW_DETAIL_LIMIT = 9;
const MICHIGAN: View = { x: lonToX(-85.6), y: latToY(44.9), z: 6 };
export const markerKinds: {
  id: MapMarker["kind"];
  label: string;
  color: string;
}[] = [
  { id: "meeting", label: "Meeting place", color: "#c8553d" },
  { id: "contact", label: "Contact / family", color: "#6b3f8f" },
  { id: "supply", label: "Supply location", color: "#2f6b3d" },
  { id: "water", label: "River / water reference", color: "#2e6f9e" },
  { id: "farm", label: "Farm / garden (permission needed)", color: "#627338" },
  { id: "medical", label: "Medical / pharmacy", color: "#b42318" },
  { id: "shelter", label: "Possible shelter / warming site", color: "#8a5a12" },
  { id: "other", label: "Other", color: "#4b5563" },
];
const kindOf = (k: string) =>
  markerKinds.find((m) => m.id === k) || markerKinds[markerKinds.length - 1];
const VIEW_KEY = "urban-haven-map-view";
function savedView(): View {
  try {
    const v = JSON.parse(localStorage.getItem(VIEW_KEY) || "null");
    if (v && [v.x, v.y, v.z].every(Number.isFinite))
      return { x: v.x, y: v.y, z: Math.min(MAX_Z, Math.max(MIN_Z, v.z)) };
  } catch {
    /* storage unavailable */
  }
  return MICHIGAN;
}

export function MapPage() {
  const { settings, toast } = useHaven();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const viewRef = useRef<View>(savedView());
  const [view, setView] = useState<View>(viewRef.current);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [overview, setOverview] = useState<Pack | null>(null);
  const [details, setDetails] = useState<Record<string, Pack>>({});
  const [loadError, setLoadError] = useState("");
  const installed = useLiveQuery(() => db.mapPacks.toArray(), [], []) as
    | InstalledPack[]
    | undefined;
  const markers = useLiveQuery(() => db.markers.toArray(), [], []) || [];
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [editing, setEditing] = useState<MapMarker | null>(null);
  const [here, setHere] = useState<{
    x: number;
    y: number;
    label: string;
  } | null>(null);
  const frame = useRef(0);
  const [routePoints, setRoutePoints] = useState<Waypoint[]>([]);
  const [riverId, setRiverId] = useState(riverReferences[0]?.id || "");

  // Load bundled catalog + overview, then installed detail packs.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const c = await loadCatalog();
        if (!alive) return;
        setCatalog(c);
        const o = await loadOverview(c);
        if (alive) setOverview(o);
      } catch (e) {
        if (alive) setLoadError(errorMessage(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!installed) return;
    let alive = true;
    (async () => {
      const next: Record<string, Pack> = {};
      for (const rec of installed) {
        try {
          next[rec.id] =
            details[rec.id]?.version === rec.version
              ? details[rec.id]
              : await readPack(
                  rec.id,
                  rec.version,
                  rec.parts || [],
                  rec.sha256,
                );
        } catch (e) {
          toast(errorMessage(e));
        }
      }
      if (alive) setDetails(next);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installed?.map((r) => r.id + r.version).join(",")]);

  const markerDraws: MarkerDraw[] = useMemo(
    () =>
      markers.map((m) => ({
        id: m.id,
        x: lonToX(m.lon),
        y: latToY(m.lat),
        name: m.name,
        color: kindOf(m.kind).color,
        selected: m.id === selected,
      })),
    [markers, selected],
  );
  const draw = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      if (!canvasRef.current || !overview) return;
      rendererRef.current ||= new Renderer(canvasRef.current);
      rendererRef.current.draw(
        viewRef.current,
        overview,
        Object.values(details),
        markerDraws,
        here,
        settings.theme === "dark" ? darkTheme : lightTheme,
        highlight,
        routePoints,
      );
    });
  }, [
    overview,
    details,
    markerDraws,
    here,
    highlight,
    settings.theme,
    routePoints,
  ]);
  useEffect(draw, [draw]);
  const commit = useCallback(
    (v: View) => {
      const clamped = {
        x: Math.min(lonToX(-80.4), Math.max(lonToX(-92.6), v.x)),
        y: Math.min(latToY(40.9), Math.max(latToY(49), v.y)),
        z: Math.min(MAX_Z, Math.max(MIN_Z, v.z)),
      };
      viewRef.current = clamped;
      draw();
      setView(clamped);
      try {
        localStorage.setItem(VIEW_KEY, JSON.stringify(clamped));
      } catch {
        /* ignore */
      }
    },
    [draw],
  );
  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  // ---- gestures: drag, pinch, wheel, double-tap, keyboard ----
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    moved: boolean;
    startDist: number;
    startZ: number;
    lastMid: { x: number; y: number };
  } | null>(null);
  const zoomAbout = (
    v: View,
    nz: number,
    sx: number,
    sy: number,
    w: number,
    h: number,
  ): View => {
    nz = Math.min(MAX_Z, Math.max(MIN_Z, nz));
    const ws = worldSize(v.z);
    const wx = v.x + (sx - w / 2) / ws;
    const wy = v.y + (sy - h / 2) / ws;
    const ws2 = worldSize(nz);
    return { x: wx - (sx - w / 2) / ws2, y: wy - (sy - h / 2) / ws2, z: nz };
  };
  const local = (e: { clientX: number; clientY: number }) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - r.left,
      y: e.clientY - r.top,
      w: r.width,
      h: r.height,
    };
  };
  const onPointerDown = (e: React.PointerEvent) => {
    canvasRef.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, local(e));
    const pts = [...pointers.current.values()];
    gesture.current = {
      moved: false,
      startDist:
        pts.length === 2
          ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
          : 0,
      startZ: viewRef.current.z,
      lastMid:
        pts.length === 2
          ? { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }
          : pts[0],
    };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    const prev = pointers.current.get(e.pointerId)!;
    const cur = local(e);
    pointers.current.set(e.pointerId, cur);
    const pts = [...pointers.current.values()];
    let v = viewRef.current;
    if (pts.length === 1) {
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      if (Math.abs(dx) + Math.abs(dy) > 0.5) gesture.current.moved = true;
      const ws = worldSize(v.z);
      v = { ...v, x: v.x - dx / ws, y: v.y - dy / ws };
    } else if (pts.length >= 2) {
      gesture.current.moved = true;
      const mid = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
      };
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ws = worldSize(v.z);
      v = {
        ...v,
        x: v.x - (mid.x - gesture.current.lastMid.x) / ws,
        y: v.y - (mid.y - gesture.current.lastMid.y) / ws,
      };
      gesture.current.lastMid = mid;
      if (gesture.current.startDist > 0)
        v = zoomAbout(
          v,
          gesture.current.startZ + Math.log2(dist / gesture.current.startDist),
          mid.x,
          mid.y,
          cur.w,
          cur.h,
        );
    }
    viewRef.current = v;
    draw();
  };
  const lastTap = useRef(0);
  const onPointerUp = (e: React.PointerEvent) => {
    const g = gesture.current;
    const p = local(e);
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 1) {
      const rest = [...pointers.current.values()][0];
      gesture.current = {
        moved: true,
        startDist: 0,
        startZ: viewRef.current.z,
        lastMid: rest,
      };
      return;
    }
    gesture.current = null;
    commit(viewRef.current);
    if (g && !g.moved) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        commit(
          zoomAbout(viewRef.current, viewRef.current.z + 1, p.x, p.y, p.w, p.h),
        );
        lastTap.current = 0;
        return;
      }
      lastTap.current = now;
      const ws = worldSize(viewRef.current.z);
      const wx = viewRef.current.x + (p.x - p.w / 2) / ws;
      const wy = viewRef.current.y + (p.y - p.h / 2) / ws;
      if (placing) {
        setPlacing(false);
        setEditing(newMarker(yToLat(wy), xToLon(wx)));
        return;
      }
      const hit = markerDraws.find(
        (m) => Math.hypot((m.x - wx) * ws, (m.y - wy) * ws - 12) < 22,
      );
      setSelected(hit ? hit.id : null);
    }
  };
  const onWheel = (e: React.WheelEvent) => {
    const p = local(e);
    commit(
      zoomAbout(
        viewRef.current,
        viewRef.current.z - e.deltaY / 300,
        p.x,
        p.y,
        p.w,
        p.h,
      ),
    );
  };
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const stop = (e: Event) => e.preventDefault();
    c.addEventListener("wheel", stop, { passive: false });
    c.addEventListener("touchmove", stop, { passive: false });
    return () => {
      c.removeEventListener("wheel", stop);
      c.removeEventListener("touchmove", stop);
    };
  }, [overview]);
  const onKey = (e: React.KeyboardEvent) => {
    const v = viewRef.current;
    const step = 80 / worldSize(v.z);
    const map: Record<string, View> = {
      ArrowLeft: { ...v, x: v.x - step },
      ArrowRight: { ...v, x: v.x + step },
      ArrowUp: { ...v, y: v.y - step },
      ArrowDown: { ...v, y: v.y + step },
      "+": { ...v, z: v.z + 1 },
      "=": { ...v, z: v.z + 1 },
      "-": { ...v, z: v.z - 1 },
    };
    if (map[e.key]) {
      e.preventDefault();
      commit(map[e.key]);
    }
  };
  const zoomBy = (d: number) =>
    commit({
      ...viewRef.current,
      z: Math.round((viewRef.current.z + d) * 2) / 2,
    });
  const goTo = (x: number, y: number, z: number) => commit({ x, y, z });

  // ---- coverage / warnings ----
  const centerLon = xToLon(view.x);
  const centerLat = yToLat(view.y);
  const covering =
    catalog?.packs.filter(
      (p) =>
        centerLon >= p.bbox[0] &&
        centerLon <= p.bbox[2] &&
        centerLat >= p.bbox[1] &&
        centerLat <= p.bbox[3],
    ) || [];
  const coveredInstalled = covering.filter((p) => details[p.id]);
  const inMichiganArea =
    centerLon > -92 &&
    centerLon < -81.5 &&
    centerLat > 41.4 &&
    centerLat < 48.6;
  const mpp = metersPerPixel(view);
  const scale = scaleBar(mpp);

  const extra: SearchHit[] = useMemo(
    () => [
      ...riverReferences.map((r) => ({
        label: r.name,
        detail: "USGS river reference · not an access point",
        x: lonToX(r.lon),
        y: latToY(r.lat),
        zoom: 9,
        kind: "water" as const,
      })),
      ...markers.map((m) => ({
        label: m.name,
        detail: "Your marker · " + kindOf(m.kind).label,
        x: lonToX(m.lon),
        y: latToY(m.lat),
        zoom: 11,
        kind: "marker" as const,
        id: m.id,
      })),
      ...(overview?.countyLabels || []).map((c) => ({
        label: c.name.replace(" Co.", " County"),
        detail: "County",
        x: c.x,
        y: c.y,
        zoom: 8.5,
        kind: "county" as const,
      })),
      ...(overview?.waterLabels || []).map((c) => ({
        label: c.name,
        detail: "Water",
        x: c.x,
        y: c.y,
        zoom: c.rank <= 1 ? 6.5 : 9,
        kind: "water" as const,
      })),
    ],
    [markers, overview],
  );
  const hits =
    overview && query.trim() ? searchPlaces(query, overview.places, extra) : [];
  const coords = query.trim() ? parseCoordinates(query) : null;
  const selectedMarker = markers.find((m) => m.id === selected);

  function newMarker(lat: number, lon: number): MapMarker {
    const now = new Date().toISOString();
    return {
      id: uid(),
      name: "",
      kind: "meeting",
      lat: Math.round(lat * 1e6) / 1e6,
      lon: Math.round(lon * 1e6) / 1e6,
      notes: "",
      created: now,
      updated: now,
    };
  }
  const useGPS = () => {
    if (!("geolocation" in navigator))
      return toast(
        "This device does not offer location services. Enter coordinates instead.",
      );
    toast(
      "Asking your device for its location… GPS can work without data, but may take a minute outdoors.",
    );
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const x = lonToX(longitude);
        const y = latToY(latitude);
        setHere({ x, y, label: `GPS ±${Math.round(accuracy)} m` });
        goTo(x, y, Math.max(viewRef.current.z, 10));
      },
      (err) =>
        toast(
          err.code === 1
            ? "Location permission was denied. You can enter coordinates or pick a town instead."
            : "Could not get a location fix. Try outdoors, or enter coordinates.",
        ),
      { enableHighAccuracy: true, timeout: 60000, maximumAge: 120000 },
    );
  };

  return (
    <>
      <PageTitle
        eyebrow="OFFLINE MAP · BOTH PENINSULAS & ISLANDS"
        title="Michigan map."
        description="Plan ordered waypoint paths, save local river and farm notes, and attach your own photos. GPS is optional."
      />
      {loadError && (
        <Callout danger>
          <strong>The map data could not be opened.</strong>
          <p>{loadError}</p>
          <p>Saved markers and paths can still be edited below.</p>
        </Callout>
      )}
      <div className="map-search">
        <Search size={18} />
        <input
          aria-label="Search Michigan towns, townships, counties, lakes or your markers"
          placeholder="Search a town, township, county, lake — or type coordinates"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && hits[0]) {
              goTo(hits[0].x, hits[0].y, hits[0].zoom);
              setHighlight({ x: hits[0].x, y: hits[0].y });
              setQuery("");
            }
          }}
        />
        {query && (
          <button
            className="icon-button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
          >
            <X size={16} />
          </button>
        )}
        {query.trim() && (
          <ul className="map-results" role="listbox">
            {coords && (
              <li>
                <button
                  onClick={() => {
                    const x = lonToX(coords.lon);
                    const y = latToY(coords.lat);
                    goTo(x, y, 11);
                    setHighlight({ x, y });
                    setQuery("");
                  }}
                >
                  <strong>
                    Go to {coords.lat}, {coords.lon}
                  </strong>
                  <small>
                    {coords.lon > 0
                      ? "Positive longitude is east of Greenwich — Michigan longitudes are negative (W)."
                      : "Coordinates"}
                  </small>
                </button>
              </li>
            )}
            {coords && (
              <li>
                <button
                  onClick={() => {
                    const x = lonToX(coords.lon);
                    const y = latToY(coords.lat);
                    setHere({ x, y, label: "entered by hand" });
                    goTo(x, y, 11);
                    setQuery("");
                  }}
                >
                  <strong>Set as my location (manual)</strong>
                  <small>
                    Shows a “you are here” dot without GPS. Not saved.
                  </small>
                </button>
              </li>
            )}
            {hits.map((h, i) => (
              <li key={h.label + h.detail + i}>
                <button
                  onClick={() => {
                    goTo(h.x, h.y, h.zoom);
                    setHighlight(
                      h.kind === "marker" ? null : { x: h.x, y: h.y },
                    );
                    if (h.kind === "marker" && h.id) setSelected(h.id);
                    setQuery("");
                  }}
                >
                  <strong>{h.label}</strong>
                  <small>{h.detail}</small>
                </button>
              </li>
            ))}
            {!hits.length && !coords && (
              <li className="muted small">
                No match in the offline index. Try a shorter name.
              </li>
            )}
          </ul>
        )}
      </div>
      {!loadError && (
        <div className="map-frame">
          {!overview ? (
            <div className="map-loading" role="status">
              Opening the offline map…
            </div>
          ) : null}
          <canvas
            ref={canvasRef}
            className={"map-canvas" + (placing ? " placing" : "")}
            tabIndex={0}
            role="application"
            aria-label={`Offline map of Michigan. Center ${formatLatLon(view.x, view.y)}, zoom ${view.z.toFixed(1)}. Use arrow keys to pan and plus or minus to zoom.`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
            onKeyDown={onKey}
          />
          <div className="map-controls">
            <button
              className="map-btn"
              aria-label="Zoom in"
              onClick={() => zoomBy(1)}
              disabled={view.z >= MAX_Z}
            >
              <Plus size={20} />
            </button>
            <button
              className="map-btn"
              aria-label="Zoom out"
              onClick={() => zoomBy(-1)}
              disabled={view.z <= MIN_Z}
            >
              <Minus size={20} />
            </button>
            <button
              className="map-btn"
              aria-label="Show all of Michigan"
              onClick={() => commit(MICHIGAN)}
            >
              <Layers size={18} />
            </button>
            <button
              className="map-btn"
              aria-label="Use GPS location (optional)"
              onClick={useGPS}
            >
              <LocateFixed size={18} />
            </button>
          </div>
          {placing && (
            <div className="map-banner">
              Tap the map where the marker belongs.{" "}
              <button onClick={() => setPlacing(false)}>Cancel</button>
            </div>
          )}
          {!placing &&
            view.z > OVERVIEW_DETAIL_LIMIT &&
            !coveredInstalled.length &&
            inMichiganArea && (
              <div className="map-banner warn" role="status">
                <AlertTriangle size={15} /> Detail for{" "}
                {covering[0]?.name || "this area"} is not downloaded. Showing
                the overview (roads simplified ≈ 450 m).{" "}
                <a href="#packs">Download</a>
              </div>
            )}
          {!placing && !inMichiganArea && (
            <div className="map-banner warn">
              Outside the Michigan coverage area.
            </div>
          )}
          {view.z >= MAX_Z && (
            <div className="map-banner bottom">
              Maximum zoom. Map data are generalized (≈1:10,000,000 source
              scale); no street-level detail.
            </div>
          )}
          <div className="map-status">
            <span className="scale" style={{ width: scale.px }}>
              {scale.label}
            </span>
            <span>
              z{view.z.toFixed(1)} · {formatLatLon(view.x, view.y)}
            </span>
          </div>
          <div className="map-attrib">
            Natural Earth · US Census · USGS GNIS
          </div>
        </div>
      )}
      {here && (
        <p className="small">
          <Navigation size={14} /> “You are here” marker:{" "}
          {formatLatLon(here.x, here.y)} ({here.label}). It is not saved.{" "}
          <button className="text-link" onClick={() => setHere(null)}>
            Clear
          </button>{" "}
          <button
            className="text-link"
            onClick={() =>
              setEditing(newMarker(yToLat(here.y), xToLon(here.x)))
            }
          >
            Save as marker
          </button>
        </p>
      )}
      {selectedMarker && (
        <section className="panel marker-card">
          <div className="section-heading">
            <h2>
              <MapPin size={18} color={kindOf(selectedMarker.kind).color} />{" "}
              {selectedMarker.name}
            </h2>
            <button
              className="icon-button"
              aria-label="Close"
              onClick={() => setSelected(null)}
            >
              <X size={16} />
            </button>
          </div>
          <p className="small muted">
            {kindOf(selectedMarker.kind).label} · {selectedMarker.lat},{" "}
            {selectedMarker.lon}
          </p>
          {selectedMarker.notes && (
            <p className="note-body">{selectedMarker.notes}</p>
          )}
          {selectedMarker.photo && (
            <figure>
              <img
                className="marker-photo"
                src={selectedMarker.photo}
                alt={selectedMarker.photoCaption || selectedMarker.name}
              />
              <figcaption>{selectedMarker.photoCaption}</figcaption>
            </figure>
          )}
          <div className="action-row">
            <button
              className="button secondary"
              onClick={() => setEditing(selectedMarker)}
            >
              <Pencil size={15} /> Edit
            </button>
            <button
              className="button secondary"
              onClick={async () => {
                if (!confirm(`Delete marker “${selectedMarker.name}”?`)) return;
                await db.markers
                  .delete(selectedMarker.id)
                  .catch((e) => toast(errorMessage(e)));
                setSelected(null);
              }}
            >
              <Trash2 size={15} /> Delete
            </button>
          </div>
        </section>
      )}
      {editing && (
        <MarkerForm
          key={editing.id}
          marker={editing}
          onClose={() => setEditing(null)}
          onSaved={(m) => {
            setSelected(m.id);
            goTo(lonToX(m.lon), latToY(m.lat), Math.max(view.z, 9));
          }}
        />
      )}
      <section className="panel">
        <div className="section-heading">
          <h2>Your markers ({markers.length})</h2>
          <div className="action-row">
            <button
              className="button"
              onClick={() => {
                setPlacing(true);
                window.scrollTo({
                  top: canvasRef.current?.offsetTop
                    ? canvasRef.current.offsetTop - 80
                    : 0,
                  behavior: "smooth",
                });
              }}
            >
              <MapPin size={15} /> Place on map
            </button>
            <button
              className="button secondary"
              onClick={() =>
                setEditing(newMarker(yToLat(view.y), xToLon(view.x)))
              }
            >
              <Plus size={15} /> At map center / by coordinates
            </button>
          </div>
        </div>
        {markers.length ? (
          <ul className="marker-list">
            {markers
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => {
                      setSelected(m.id);
                      goTo(lonToX(m.lon), latToY(m.lat), Math.max(view.z, 10));
                      canvasRef.current?.scrollIntoView({
                        block: "center",
                        behavior: "smooth",
                      });
                    }}
                  >
                    <span
                      className="dot"
                      style={{ background: kindOf(m.kind).color }}
                    />
                    <strong>{m.name}</strong>
                    <small>
                      {kindOf(m.kind).label} · {m.lat.toFixed(4)},{" "}
                      {m.lon.toFixed(4)}
                    </small>
                  </button>
                </li>
              ))}
          </ul>
        ) : (
          <p className="muted">
            Save your household meeting places, relatives' homes, supply caches
            and water distribution points you were told about.
          </p>
        )}
        <p className="small muted">
          Markers are your own notes. They do not confirm that a shelter,
          hospital, road or water point is open, accessible, operational or
          safe. Markers are included in backups.
        </p>
      </section>
      <RoutePlanner
        markers={markers}
        center={{ lat: centerLat, lon: centerLon }}
        onPoints={setRoutePoints}
        onShow={(p) => {
          goTo(lonToX(p.lon), latToY(p.lat), 10);
          setHighlight({ x: lonToX(p.lon), y: latToY(p.lat) });
          canvasRef.current?.scrollIntoView({ block: "center" });
        }}
      />
      <section className="panel">
        <h2>River references & local farms</h2>
        <p>
          These bundled USGS river coordinates are geographic references, not
          drinking-water sources, safe banks, crossings or legal public access
          points. Some are historical monitoring locations. Check the source
          notes and conditions locally.
        </p>
        <Field label="Michigan river reference">
          <select value={riverId} onChange={(e) => setRiverId(e.target.value)}>
            {riverReferences.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
        {riverReferences
          .filter((r) => r.id === riverId)
          .map((r) => (
            <div key={r.id}>
              <p>{r.notes}</p>
              <p className="small">
                <a href={r.sourceUrl} target="_blank" rel="noreferrer">
                  USGS source (opens online)
                </a>{" "}
                · checked {r.checked}
              </p>
              <div className="action-row">
                <button
                  className="button secondary"
                  onClick={() => {
                    goTo(lonToX(r.lon), latToY(r.lat), 9);
                    setHighlight({ x: lonToX(r.lon), y: latToY(r.lat) });
                    canvasRef.current?.scrollIntoView({ block: "center" });
                  }}
                >
                  Show river
                </button>
                <button
                  className="button"
                  onClick={() =>
                    setEditing({
                      ...newMarker(r.lat, r.lon),
                      name: r.name,
                      kind: "water",
                      notes: (r.notes + " Source: " + r.sourceUrl).slice(
                        0,
                        4000,
                      ),
                    })
                  }
                >
                  Save river marker
                </button>
              </div>
            </div>
          ))}
        <p>
          <strong>Farms:</strong> add a Farm / garden marker at coordinates you
          know, then attach a local picture and notes about permission, contact
          and last confirmation. The app does not invent operating farms or food
          availability. Get permission before entering or collecting food.
        </p>
        <p className="small muted">
          Photos remain on your device and are included in backups. There is no
          bundled photo database or live availability feed.
        </p>
      </section>
      <PackManager catalog={catalog} installed={installed || []} />
      <section className="panel">
        <h2>
          <Info size={18} /> What this map shows — and doesn't
        </h2>
        <ul className="article-list">
          <li>
            <b>Coverage:</b> all of Michigan — Upper and Lower Peninsulas, Isle
            Royale, Beaver, Mackinac, Drummond, Bois Blanc and other islands
            present in the source data — plus neighboring shorelines for
            context.
          </li>
          <li>
            <b>Bundled overview</b> (always offline): land, Great Lakes and
            inland lakes, major rivers, county and state lines,
            interstate/US/major state highways, and{" "}
            {overview?.places.length.toLocaleString() || "~3,900"} searchable
            place names: cities, villages, census places, townships and small
            communities.
          </li>
          <li>
            <b>Zoom:</b> overview detail to zoom 9 (≈ county / town level).
            Optional regional packs add minor paved roads, ferries and
            less-simplified shapes for zoom 9–12. Maximum zoom 12 (≈ 1:150,000
            on a phone screen).
          </li>
          <li>
            <b>Accuracy:</b> roads, shorelines and lakes come from Natural Earth
            at roughly 1:10,000,000 source scale — positions can be off by
            hundreds of meters to about a kilometer. Place points come from
            Census and USGS coordinates. Not for navigation.
          </li>
          <li>
            <b>Not included:</b> street-level maps, addresses, turn-by-turn
            routing, road closures, current conditions, or the status of any
            facility.
          </li>
        </ul>
        <MapSources catalog={catalog} />
      </section>
    </>
  );
}

function scaleBar(mpp: number) {
  const steps = [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
  const target = 110 * mpp;
  const m = steps.reduce((best, s) => (s <= target ? s : best), steps[0]);
  const miles = m / 1609.344;
  return {
    px: Math.max(30, m / mpp),
    label:
      m >= 1000
        ? `${m / 1000} km (${miles.toFixed(miles < 2 ? 1 : 0)} mi)`
        : `${m} m`,
  };
}

function MarkerForm({
  marker,
  onClose,
  onSaved,
}: {
  marker: MapMarker;
  onClose: () => void;
  onSaved: (m: MapMarker) => void;
}) {
  const { toast } = useHaven();
  const [coordText, setCoordText] = useState(`${marker.lat}, ${marker.lon}`);
  const parsed = parseCoordinates(coordText);
  const [photo, setPhoto] = useState(marker.photo || "");
  const [photoCaption, setPhotoCaption] = useState(marker.photoCaption || "");
  const [photoBusy, setPhotoBusy] = useState(false);
  const loadPhoto = async (file?: File) => {
    if (!file) return;
    setPhotoBusy(true);
    try {
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 10 * 1024 * 1024
      )
        throw new Error("Choose a JPG, PNG or WebP picture under 10 MB.");
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 960 / bitmap.width, 720 / bitmap.height);
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(bitmap.width * scale));
      c.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("Photo processing unavailable.");
      ctx.drawImage(bitmap, 0, 0, c.width, c.height);
      bitmap.close();
      const data = c.toDataURL("image/jpeg", 0.7);
      if (!validMarkerPhoto(data))
        throw new Error("Picture is too detailed; choose a smaller photo.");
      setPhoto(data);
    } catch (e) {
      toast(errorMessage(e));
    } finally {
      setPhotoBusy(false);
    }
  };
  return (
    <form
      className="panel edit-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        try {
          const name = String(f.get("name") || "").trim();
          if (!name) throw new Error("Give the marker a name.");
          if (!parsed)
            throw new Error(
              "Enter coordinates like 46.5436, -87.3954 or 46°32′37″N 87°23′43″W.",
            );
          const m: MapMarker = {
            ...marker,
            photo: photo || undefined,
            photoCaption,
            name: name.slice(0, 120),
            kind: String(f.get("kind")) as MapMarker["kind"],
            lat: parsed.lat,
            lon: parsed.lon,
            notes: String(f.get("notes") || "").slice(0, 4000),
            updated: new Date().toISOString(),
          };
          await db.markers.put(m);
          toast("Marker saved on this device.");
          onSaved(m);
          onClose();
        } catch (err) {
          toast(errorMessage(err));
        }
      }}
    >
      <div className="section-heading">
        <h2>{marker.name ? "Edit marker" : "New marker"}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Close"
          onClick={onClose}
        >
          <X />
        </button>
      </div>
      <div className="form-grid">
        <Field label="Name">
          <input
            name="name"
            required
            maxLength={120}
            defaultValue={marker.name}
            autoFocus
            placeholder="e.g. Family meeting place — library lot"
          />
        </Field>
        <Field label="Type">
          <select name="kind" defaultValue={marker.kind}>
            {markerKinds.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Coordinates (latitude, longitude)"
          hint={
            parsed
              ? `Reads as ${parsed.lat}, ${parsed.lon}${parsed.lon > 0 ? " — east longitude! Michigan is west (negative)." : ""}`
              : "Not recognized yet. Example: 46.5436, -87.3954"
          }
        >
          <input
            value={coordText}
            onChange={(e) => setCoordText(e.target.value)}
            inputMode="text"
          />
        </Field>
      </div>
      <Field
        label="Local photo (optional)"
        hint="JPG, PNG or WebP under 10 MB. Resized and saved only on this device; no upload."
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={photoBusy}
          onChange={(e) => void loadPhoto(e.target.files?.[0])}
        />
      </Field>
      {photo && (
        <div>
          <img
            className="marker-photo"
            src={photo}
            alt={photoCaption || "Marker photo preview"}
          />
          <button
            type="button"
            className="button secondary compact"
            onClick={() => setPhoto("")}
          >
            Remove photo
          </button>
        </div>
      )}
      <Field label="Photo caption">
        <input
          maxLength={300}
          value={photoCaption}
          onChange={(e) => setPhotoCaption(e.target.value)}
        />
      </Field>
      <Field label="Notes (address, who, when, instructions)">
        <textarea name="notes" maxLength={4000} defaultValue={marker.notes} />
      </Field>
      <div className="action-row">
        <button className="button" disabled={photoBusy}>
          <Save size={15} /> {photoBusy ? "Processing photo…" : "Save marker"}
        </button>
        <button type="button" className="button secondary" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function PackManager({
  catalog,
  installed,
}: {
  catalog: Catalog | null;
  installed: InstalledPack[];
}) {
  const { toast } = useHaven();
  const [progress, setProgress] = useState<
    Record<string, Progress | undefined>
  >({});
  const [busy, setBusy] = useState<string | null>(null);
  const [partial, setPartial] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<Record<string, string>>({});
  const abort = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!catalog) return;
    void (async () => {
      const out: Record<string, number> = {};
      for (const p of catalog.packs)
        out[p.id] = await storedBytes(p.id).catch(() => 0);
      setPartial(out);
    })();
  }, [catalog, installed.length, busy]);
  if (!catalog) return null;
  const run = async (p: CatalogPack) => {
    setBusy(p.id);
    abort.current = new AbortController();
    try {
      await installPack(
        p,
        (x) => setProgress((s) => ({ ...s, [p.id]: x })),
        abort.current.signal,
      );
      toast(`${p.name} downloaded and verified. It works offline now.`);
    } catch (e) {
      setStatus((s) => ({ ...s, [p.id]: errorMessage(e) }));
    } finally {
      setBusy(null);
    }
  };
  return (
    <section className="panel" id="packs">
      <h2>
        <Download size={18} /> Regional detail packs
      </h2>
      <p className="small">
        The statewide overview ({(catalog.overview.bytes / 1024).toFixed(0)} KB)
        is part of the core offline install. Packs are optional extra detail;
        download them while online, then they work offline. Map data version{" "}
        {catalog.version}, built {catalog.built}.
      </p>
      <div className="pack-list">
        {catalog.packs.map((p) => {
          const rec = installed.find((r) => r.id === p.id);
          const pr = progress[p.id];
          const outdated = rec && rec.version !== p.version;
          const stored = partial[p.id] || 0;
          return (
            <div className="pack" key={p.id}>
              <div>
                <strong>{p.name}</strong>
                <small>
                  {(p.bytes / 1024).toFixed(0)} KB · zoom {p.zoom[0]}–
                  {p.zoom[1]} · {p.bbox[1]}°–{p.bbox[3]}°N,{" "}
                  {Math.abs(p.bbox[0])}°–{Math.abs(p.bbox[2])}°W · version{" "}
                  {p.version}
                </small>
                <small>
                  {p.features.roads?.toLocaleString()} road segments ·{" "}
                  {p.features.water} lake shapes · generalized to ≈
                  {p.toleranceMeters} m
                </small>
                <span
                  className={
                    "status-badge " +
                    (rec ? "st-ready" : stored ? "st-partial" : "st-na")
                  }
                >
                  {rec
                    ? `Installed · verified ${new Date(rec.verified).toLocaleDateString()}${outdated ? " · update available" : ""}`
                    : stored
                      ? `Partly downloaded (${(stored / 1024).toFixed(0)} KB) — resume`
                      : "Not downloaded"}
                </span>
                {pr && busy === p.id && (
                  <>
                    <progress
                      max={pr.total}
                      value={pr.done}
                      aria-label={`${p.name} download progress`}
                    />
                    <small>{pr.message}</small>
                  </>
                )}
                {status[p.id] && (
                  <p className="error small" role="alert">
                    {status[p.id]}
                  </p>
                )}
              </div>
              <div className="pack-actions">
                {(!rec || outdated) && (
                  <button
                    className="button"
                    disabled={!!busy}
                    onClick={() => void run(p)}
                  >
                    <Download size={15} />{" "}
                    {stored && !rec
                      ? "Resume"
                      : outdated
                        ? "Update"
                        : "Download"}
                  </button>
                )}
                {busy === p.id && (
                  <button
                    className="button secondary"
                    onClick={() => abort.current?.abort()}
                  >
                    Pause
                  </button>
                )}
                {rec && (
                  <button
                    className="button secondary"
                    disabled={!!busy}
                    onClick={async () => {
                      try {
                        await verifyInstalled(rec);
                        setStatus((s) => ({ ...s, [p.id]: "" }));
                        toast(
                          `${p.name}: every part present and SHA-256 verified.`,
                        );
                      } catch (e) {
                        setStatus((s) => ({ ...s, [p.id]: errorMessage(e) }));
                      }
                    }}
                  >
                    <RefreshCw size={15} /> Verify
                  </button>
                )}
                {(rec || stored > 0) && (
                  <button
                    className="button secondary"
                    disabled={!!busy}
                    onClick={async () => {
                      if (
                        !confirm(
                          `Delete ${p.name} from this device? The overview map stays.`,
                        )
                      )
                        return;
                      try {
                        await deletePack(rec || { id: p.id });
                        setStatus((s) => ({ ...s, [p.id]: "" }));
                        toast(`${p.name} deleted.`);
                        setPartial((x) => ({ ...x, [p.id]: 0 }));
                      } catch (e) {
                        toast(errorMessage(e));
                      }
                    }}
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="small muted">
        Each pack is split into parts with SHA-256 checks; an interrupted
        download resumes from the last verified part. Packs are kept when the
        app updates, are not included in JSON backups, and must be downloaded
        again on a new phone.
      </p>
    </section>
  );
}

function MapSources({ catalog }: { catalog: Catalog | null }) {
  return (
    <details>
      <summary>Data sources & licenses (available offline)</summary>
      <ul className="article-list small">
        <li>
          Natural Earth 1:10m vector data (land, minor islands, lakes, rivers,
          North America roads, counties, parks, state/province lines),
          repository commit ca96624 (June 2022), version 5.2.0-pre. Public
          domain — naturalearthdata.com.
        </li>
        <li>
          U.S. Census Bureau 2025 Gazetteer Files: places and county
          subdivisions (townships), internal-point coordinates. Public domain
          (U.S. government work).
        </li>
        <li>
          American Community Survey 2023 5-year population (B01003), used only
          to rank labels. Public domain.
        </li>
        <li>
          USGS Geographic Names Information System populated places not in the
          Census list. Public domain.
        </li>
        <li>
          Census and GNIS files were obtained through the open-source us_geo
          project (MIT-licensed code) on GitHub; the data themselves remain
          public domain.
        </li>
        <li>
          Water-body label positions were placed by the app authors. No
          OpenStreetMap tiles or data are used.
        </li>
      </ul>
      {catalog && (
        <p className="small muted">{catalog.attribution.join(" · ")}</p>
      )}
    </details>
  );
}

export { placeKinds };
