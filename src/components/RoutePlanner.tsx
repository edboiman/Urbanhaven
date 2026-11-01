import { useEffect, useState } from "react";
import { useLiveQuery } from "../storage/idb";
import { db, uid } from "../storage/db";
import {
  emptyRoute,
  readRoute,
  movePoint,
  routeLegs,
  routeGPX,
  type Waypoint,
  type WaypointRoute,
} from "../map/routes";
import type { MapMarker } from "../types";
import { Callout, Field, useHaven, errorMessage } from "./shared";

export function RoutePlanner({
  markers,
  center,
  onPoints,
  onShow,
}: {
  markers: MapMarker[];
  center: { lat: number; lon: number };
  onPoints: (p: Waypoint[]) => void;
  onShow: (p: Waypoint) => void;
}) {
  const { toast } = useHaven();
  const plans = useLiveQuery(() => db.plans.toArray(), [], []) || [];
  const paths = plans.filter((p) => p.id.startsWith("map-route-"));
  const [id, setId] = useState("map-route-primary");
  const [route, setRoute] = useState<WaypointRoute>(emptyRoute);
  const [markerId, setMarkerId] = useState("");
  const [busy, setBusy] = useState(false);
  const stored = paths.find((p) => p.id === id);
  useEffect(() => {
    try {
      const next = stored ? readRoute(stored.data) : emptyRoute();
      setRoute(next);
      onPoints(next.points);
    } catch (e) {
      toast(errorMessage(e));
    }
  }, [id, stored?.updated]);
  const persist = async (next: WaypointRoute) => {
    const previous = route;
    setBusy(true);
    setRoute(next);
    onPoints(next.points);
    try {
      readRoute(next);
      await db.plans.put({ id, data: next, updated: new Date().toISOString() });
      setRoute(next);
      onPoints(next.points);
    } catch (e) {
      setRoute(previous);
      onPoints(previous.points);
      toast(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const add = (p: {
    name: string;
    lat: number;
    lon: number;
    notes?: string;
  }) => {
    if (route.points.length >= 100)
      return toast("A path can have up to 100 stops.");
    void persist({
      ...route,
      points: [
        ...route.points,
        {
          id: uid(),
          name: p.name,
          lat: p.lat,
          lon: p.lon,
          notes: (p.notes || "").slice(0, 1000),
          visited: false,
        },
      ],
    });
  };
  const legs = routeLegs(route.points),
    km = legs.reduce((n, l) => n + l.km, 0);
  return (
    <section className="panel route-planner">
      <h2>Offline waypoint paths</h2>
      <Callout>
        <strong>Connect the stops you choose.</strong>
        <p>
          Dashed lines and distances are straight-line estimates. They can cross
          rivers, private land or impassable terrain. This map has no
          road-routing graph, safe-crossing checks, travel times or turn-by-turn
          directions. Bearings are true north, not magnetic compass headings.
        </p>
      </Callout>
      <div className="form-grid">
        <Field label="Saved path">
          <select
            value={id}
            disabled={busy}
            onChange={(e) => setId(e.target.value)}
          >
            <option value="map-route-primary">Primary path</option>
            {paths
              .filter((p) => p.id !== "map-route-primary")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {(p.data as WaypointRoute).name || "Saved path"}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Path name">
          <input
            maxLength={120}
            value={route.name}
            onChange={(e) => setRoute({ ...route, name: e.target.value })}
            onBlur={() => void persist(route)}
          />
        </Field>
      </div>
      <div className="action-row">
        <button
          className="button secondary"
          disabled={busy}
          onClick={async () => {
            const nextId = "map-route-" + uid();
            setBusy(true);
            try {
              await db.plans.put({
                id: nextId,
                data: emptyRoute(),
                updated: new Date().toISOString(),
              });
              setId(nextId);
            } catch (e) {
              toast(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          New path
        </button>
        <button
          className="button secondary"
          disabled={busy || route.points.length < 2}
          onClick={() =>
            void persist({ ...route, points: route.points.slice().reverse() })
          }
        >
          Reverse order
        </button>
        <button
          className="button secondary"
          disabled={!route.points.length}
          onClick={() => {
            const u = URL.createObjectURL(
              new Blob([routeGPX(route)], { type: "application/gpx+xml" }),
            );
            const a = document.createElement("a");
            a.href = u;
            a.download = "urban-haven-waypoints.gpx";
            a.click();
            setTimeout(() => URL.revokeObjectURL(u), 1000);
          }}
        >
          Export GPX
        </button>
      </div>
      <Field label="Path notes">
        <textarea
          maxLength={4000}
          value={route.notes}
          onChange={(e) => setRoute({ ...route, notes: e.target.value })}
          onBlur={() => void persist(route)}
          placeholder="Meeting instructions, alternate crossing, date checked…"
        />
      </Field>
      <div className="form-grid">
        <Field label="Add a saved marker">
          <select
            value={markerId}
            onChange={(e) => setMarkerId(e.target.value)}
          >
            <option value="">Choose a marker…</option>
            {markers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="action-row">
          <button
            className="button"
            disabled={busy || !markers.some((m) => m.id === markerId)}
            onClick={() => {
              const m = markers.find((m) => m.id === markerId);
              if (m) add(m);
            }}
          >
            Add marker to path
          </button>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() =>
              add({ ...center, name: `Stop ${route.points.length + 1}` })
            }
          >
            Add map center
          </button>
        </div>
      </div>
      <p>
        <strong>
          {route.points.length} stops · {km.toFixed(2)} km /{" "}
          {(km / 1.609344).toFixed(2)} mi
        </strong>{" "}
        straight-line total.
      </p>
      {!route.points.length && (
        <p className="muted">
          Save markers first, or pan to a location and add the map center.
          Reorder stops to sketch your own path.
        </p>
      )}
      <ol className="waypoint-list">
        {route.points.map((p, i) => (
          <li key={p.id}>
            <label className="check-label">
              <input
                type="checkbox"
                checked={p.visited}
                disabled={busy}
                onChange={(e) =>
                  void persist({
                    ...route,
                    points: route.points.map((q) =>
                      q.id === p.id ? { ...q, visited: e.target.checked } : q,
                    ),
                  })
                }
              />
              <strong>
                {i + 1}. {p.name}
              </strong>
            </label>
            <p className="small">
              {p.lat.toFixed(5)}, {p.lon.toFixed(5)}
              {i > 0 &&
                ` · ${legs[i - 1].km.toFixed(2)} km from previous · ${legs[i - 1].bearing === null ? "same point" : legs[i - 1].bearing!.toFixed(0) + "° true"}`}
            </p>
            <Field label={`Notes for stop ${i + 1}`}>
              <textarea
                maxLength={1000}
                value={p.notes}
                onChange={(e) =>
                  setRoute({
                    ...route,
                    points: route.points.map((q) =>
                      q.id === p.id ? { ...q, notes: e.target.value } : q,
                    ),
                  })
                }
                onBlur={() => void persist(route)}
              />
            </Field>
            <div className="action-row">
              <button
                className="button secondary compact"
                onClick={() => onShow(p)}
              >
                Show
              </button>
              <button
                aria-label={`Move stop ${i + 1} up`}
                className="button secondary compact"
                disabled={busy || i === 0}
                onClick={() =>
                  void persist({
                    ...route,
                    points: movePoint(route.points, i, -1),
                  })
                }
              >
                Up
              </button>
              <button
                aria-label={`Move stop ${i + 1} down`}
                className="button secondary compact"
                disabled={busy || i === route.points.length - 1}
                onClick={() =>
                  void persist({
                    ...route,
                    points: movePoint(route.points, i, 1),
                  })
                }
              >
                Down
              </button>
              <button
                className="button secondary compact"
                disabled={busy}
                onClick={() =>
                  void persist({
                    ...route,
                    points: route.points.filter((q) => q.id !== p.id),
                  })
                }
              >
                Remove stop
              </button>
            </div>
          </li>
        ))}
      </ol>
      <p className="small muted">
        Changes save on this device. Paths and private location notes are
        included in your unencrypted backup. GPX exports include coordinates and
        notes; share deliberately.
      </p>
    </section>
  );
}
