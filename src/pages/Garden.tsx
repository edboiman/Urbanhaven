import { useMemo, useState } from "react";
import { useLiveQuery } from "../storage/idb";
import { db, uid, setPreferences, todayISO } from "../storage/db";
import { crops } from "../content";
import {
  stations,
  frostSource,
  regionLabel,
  seasonYear,
  stationDate,
  cropDates,
  germinationRate,
  sowingAdvice,
  addDays,
  type Station,
} from "../garden/plan";
import type { Crop, GardenEntry, SeedLot, HarvestEntry } from "../types";
import {
  PageTitle,
  Field,
  Callout,
  Empty,
  useHaven,
  errorMessage,
} from "../components/shared";
import {
  Sprout,
  Plus,
  Save,
  X,
  Pencil,
  Trash2,
  Snowflake,
  Leaf,
  Info,
  Calendar,
} from "../components/icons";

import {
  growContexts,
  cropChoices,
  seedGroups,
  type GrowGoal,
} from "../garden/emergency";

const frostLabel = {
  hardy: "Frost-hardy",
  "semi-hardy": "Tolerates light frost",
  tender: "Frost-tender (killed by frost)",
};
const fmtDate = (iso: string) =>
  iso
    ? new Date(iso + "T12:00:00").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "—";

export function Garden() {
  const { settings, toast } = useHaven();
  const [tab, setTab] = useState<"plan" | "crops" | "seeds" | "plantings">(
    "crops",
  );
  const [selected, setSelected] = useState(crops[0].id);
  const today = todayISO();
  const year = seasonYear(today);
  const [stationName, prob] = (settings.gardenZone || "|p50").split("|") as [
    string,
    "p50" | "p25",
  ];
  const station = stations.find((s) => s.name === stationName);
  const lastFrost =
    settings.lastFrost ||
    (station ? stationDate(station, prob || "p50", year) : "");
  const firstFrost = settings.firstFrost;
  const set = (p: Parameters<typeof setPreferences>[0]) =>
    void setPreferences(p).catch((e) => toast(errorMessage(e)));
  return (
    <>
      <PageTitle
        eyebrow="GROW FOOD IN MICHIGAN"
        title="Food now. Growing for later."
        description="Start with your space, season and available water. Gardens take weeks or months; stored food covers the immediate emergency."
      />
      {tab === "plan" && (
        <Callout>
          <strong>
            <Info size={16} /> “Hardy” is not “carefree.”
          </strong>
          <p>
            Frost-hardy crops survive cold nights, but every crop still needs
            enough light, water, warmth to germinate, and protection from pests.
            Harvest timing and yields vary with weather, variety and care — this
            app makes no yield promises.
          </p>
        </Callout>
      )}
      <div className="tabs" role="tablist" aria-label="Garden views">
        {[
          ["crops", "Crop guide"],
          ["plan", "Season plan"],
          ["seeds", "Seed inventory"],
          ["plantings", "My plantings & harvest"],
        ].map(([k, l]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            className={tab === k ? "active" : ""}
            onClick={() => setTab(k as typeof tab)}
          >
            {l}
          </button>
        ))}
      </div>
      {tab === "plan" && (
        <>
          <section className="panel">
            <h2>Your frost dates</h2>
            <div className="form-grid">
              <Field
                label="Nearest weather station"
                hint="Spring dates from the Michigan State Climatologist table."
              >
                <select
                  value={stationName}
                  onChange={(e) =>
                    set({
                      gardenZone: `${e.target.value}|${prob || "p50"}`,
                      lastFrost: "",
                    })
                  }
                >
                  <option value="">Choose a station…</option>
                  {(["slp", "nlp", "up"] as const).map((r) => (
                    <optgroup key={r} label={regionLabel[r]}>
                      {stations
                        .filter((s) => s.region === r)
                        .map((s) => (
                          <option key={s.name} value={s.name}>
                            {s.name}
                            {s.lake ? " (lake-influenced)" : ""}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </Field>
              <Field
                label="How cautious?"
                hint="25% = only a 1-in-4 chance of a 32°F night after this date. Use it for tender crops."
              >
                <select
                  value={prob || "p50"}
                  onChange={(e) =>
                    set({
                      gardenZone: `${stationName}|${e.target.value}`,
                      lastFrost: "",
                    })
                  }
                >
                  <option value="p50">
                    Median (50% chance of later frost)
                  </option>
                  <option value="p25">Safer (25% chance of later frost)</option>
                </select>
              </Field>
              <Field
                label={`Last spring frost ${year} (override)`}
                hint={
                  station
                    ? `Station date: ${fmtDate(stationDate(station, prob || "p50", year))}. Clear to use it.`
                    : "Or type your own local date."
                }
              >
                <input
                  type="date"
                  value={settings.lastFrost}
                  onChange={(e) => set({ lastFrost: e.target.value })}
                />
              </Field>
              <Field
                label="First fall frost (your local estimate)"
                hint="Needed for fall sowing dates. Inland U.P. sites can frost in August; lake shores later."
              >
                <input
                  type="date"
                  value={settings.firstFrost}
                  onChange={(e) => set({ firstFrost: e.target.value })}
                />
              </Field>
            </div>
            {station && <StationFacts s={station} />}
            <RegionNotes />
          </section>
          <section className="panel">
            <h2>
              <Calendar size={18} /> {year} planting points
              {lastFrost ? ` (last frost ${fmtDate(lastFrost)})` : ""}
            </h2>
            {!lastFrost ? (
              <p>
                Choose a station or enter your last frost date to see dates. No
                single date works for the whole state.
              </p>
            ) : (
              <div className="plan-table-wrap">
                <table className="plan-table">
                  <thead>
                    <tr>
                      <th>Crop</th>
                      <th>Start indoors</th>
                      <th>Plant / sow outside</th>
                      <th>Approx. harvest</th>
                      <th>Fall seed start / planting target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crops.map((c) => {
                      const d = cropDates(c, lastFrost, firstFrost);
                      return (
                        <tr key={c.id}>
                          <td>
                            <button
                              className="text-link"
                              onClick={() => {
                                setSelected(c.id);
                                setTab("crops");
                              }}
                            >
                              {c.name}
                            </button>
                            <small className="muted block">
                              {frostLabel[c.frost]}
                            </small>
                          </td>
                          <td>
                            {d.indoorStart ? fmtDate(d.indoorStart) : "—"}
                          </td>
                          <td>
                            {fmtDate(d.outdoor)}
                            <small className="muted block">
                              {c.springOffsetWeeks < 0
                                ? `${-c.springOffsetWeeks} wk before frost`
                                : c.springOffsetWeeks > 0
                                  ? `${c.springOffsetWeeks} wk after frost`
                                  : "at last frost"}
                            </small>
                          </td>
                          <td>
                            {fmtDate(d.harvestFrom)}–{fmtDate(d.harvestTo)}
                            <small className="muted block">{d.note}</small>
                          </td>
                          <td>
                            {c.fallWeeksBeforeFrost === null
                              ? "not advised"
                              : firstFrost
                                ? `${fmtDate(d.fallSow)}${c.harvestFrom === "transplant" ? ` sow indoors; ${fmtDate(d.fallOutdoor)} transplant` : " sow outdoors"}`
                                : "enter fall frost"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="small muted">
              Planning points, not guarantees. Check soil temperature (cool
              crops germinate from about 40–55°F; warm crops establish best in
              warm soil) and the local forecast. Fall outdoor targets subtract
              maturity plus an app buffer of 14 days from the chosen frost date.
              For transplant crops, indoor sowing is earlier by the
              seedling-growing period; fall peas use their slower fall maturity.
              These are planning estimates. Your seed packet, harvest stage and
              local conditions take priority.
            </p>
          </section>
          <IndoorLimits />
        </>
      )}
      {tab === "crops" && (
        <>
          <EmergencyGrow
            lastFrost={lastFrost}
            firstFrost={firstFrost}
            selected={selected}
            setSelected={setSelected}
          />
        </>
      )}
      {tab === "seeds" && (
        <>
          <SeedReserve />
          <Seeds />
        </>
      )}
      {tab === "plantings" && (
        <Plantings lastFrost={lastFrost} firstFrost={firstFrost} />
      )}
    </>
  );
}

function StationFacts({ s }: { s: Station }) {
  return (
    <p className="small">
      <b>{s.name}</b> ({regionLabel[s.region]}
      {s.lake ? ", near a Great Lake" : ""}): chance of 32°F on or after — 75%:{" "}
      {fmtDate("2027-" + s.p75)}, 50%: {fmtDate("2027-" + s.p50)}, 25%:{" "}
      {fmtDate("2027-" + s.p25)}; latest on record in the table:{" "}
      {fmtDate("2027-" + s.last)}.{" "}
      <a href={frostSource.url} target="_blank" rel="noreferrer">
        Source table
      </a>{" "}
      <small className="muted">
        (checked {frostSource.verified}; {frostSource.note})
      </small>
    </p>
  );
}

function RegionNotes() {
  return (
    <details className="region-notes">
      <summary>Why dates differ across Michigan</summary>
      <ul className="article-list">
        <li>
          <b>Southern Lower Peninsula:</b> earliest springs (e.g. Detroit city
          median Apr 24, Lansing May 8 in the table). MSU's Lower Peninsula
          calendar is built on USDA Zone 6a with adjustments for 5a–6b.
        </li>
        <li>
          <b>Northern Lower Peninsula:</b> cold inland pockets frost late —
          Vanderbilt's median is Jun 20 and Gaylord-area sites have the shortest
          growing season in the state (MSU Geography).
        </li>
        <li>
          <b>Upper Peninsula:</b> MSU notes U.P. gardeners often cannot plant
          warm-season crops until early to mid-June, and should sow most fall
          crops in July or early August. Inland U.P. sites can frost in August.
        </li>
        <li>
          <b>Lake-influenced areas:</b> the Great Lakes delay fall frost and
          moderate spring on lee shores. Compare Alpena (city, lakeshore) median
          May 8 with Alpena WSO (inland airport) May 31 — a few miles can mean
          three weeks.
        </li>
      </ul>
      <p className="small muted">
        Sources: Michigan State Climatologist table via MSU Extension; MSU
        Extension calendar announcement (MSU Today, April 2026); MSU Geography
        “Growing season and frost” page. All checked 2026-10-31.
      </p>
    </details>
  );
}

function IndoorLimits() {
  return (
    <section className="panel">
      <h2>
        <Snowflake size={18} /> Indoor growing in a Michigan winter — and during
        an outage
      </h2>
      <ul className="article-list">
        <li>
          Leaf lettuce, herbs (basil, chives, parsley, thyme, oregano), green
          onions and microgreens are the realistic indoor crops.
        </li>
        <li>
          Light needs depend on crop, season and lamp output. A winter window
          may be insufficient. Supplemental grow lights require reliable power;
          follow crop guidance and the fixture instructions.
        </li>
        <li>
          Keep grow lights at the manufacturer’s specified distance. One spacing
          rule does not fit hot lamps and modern LEDs.
        </li>
        <li>
          <b>
            In a winter power outage, grow lights and heat mats stop; indoor
            temperatures may fall if heating is lost.
          </b>{" "}
          Windowsills near cold glass chill plants, growth slows to a crawl, and
          seedlings may die. Do not count indoor plants as emergency food. Never
          use a camp heater or grill indoors to keep plants warm.
        </li>
        <li>
          Indoor crops give fresh greens and morale, not meaningful calories.
          Raw microgreens can carry seed-borne germs; do not use treated or
          recalled seed. Read the microgreen food-safety guide before relying on
          a tray.
        </li>
      </ul>
    </section>
  );
}

function CropCard({
  crop: c,
  lastFrost,
  firstFrost,
}: {
  crop: Crop;
  lastFrost: string;
  firstFrost: string;
}) {
  const d = cropDates(c, lastFrost, firstFrost);
  const [adding, setAdding] = useState(false);
  return (
    <section className="panel crop-profile">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            {c.group.toUpperCase()} · {c.season.toUpperCase()} SEASON ·{" "}
            {frostLabel[c.frost].toUpperCase()}
          </p>
          <h2>{c.name}</h2>
        </div>
        <button className="button" onClick={() => setAdding(true)}>
          <Plus size={16} /> Add a planting
        </button>
      </div>
      <div className="crop-details">
        <div>
          <small>Start from</small>
          <strong>{c.start}</strong>
        </div>
        <div>
          <small>Where it grows</small>
          <strong>{c.environment}</strong>
        </div>
        <div>
          <small>Light</small>
          <strong>{c.light}</strong>
        </div>
        <div>
          <small>Temperature & soil</small>
          <strong>{c.soilTemp}</strong>
        </div>
        <div>
          <small>Water</small>
          <strong>{c.water}</strong>
        </div>
        <div>
          <small>Growing medium</small>
          <strong>{c.medium}</strong>
        </div>
        <div>
          <small>Container depth & drainage</small>
          <strong>{c.containerDepth} Containers need drainage holes.</strong>
        </div>
        <div>
          <small>Spacing</small>
          <strong>{c.spacing}</strong>
        </div>
        <div>
          <small>Approximate harvest</small>
          <strong>
            {c.harvestDays[0]}–{c.harvestDays[1]} days from {c.harvestFrom}
          </strong>
        </div>
        <div>
          <small>Your dates</small>
          <strong>
            {lastFrost
              ? `${d.indoorStart ? `start indoors ${fmtDate(d.indoorStart)}; ` : ""}outside ${fmtDate(d.outdoor)}${d.fallSow ? `; fall seed start ${fmtDate(d.fallSow)}${c.harvestFrom === "transplant" ? `; transplant ${fmtDate(d.fallOutdoor)}` : " outdoors"}` : ""}`
              : "Set frost dates on the Season plan tab"}
          </strong>
        </div>
      </div>
      <div className="crop-advice">
        <p>
          <strong>Harvest stage:</strong> {c.harvestStage}
        </p>
        <p>
          <strong>Indoors:</strong> {c.indoor}
        </p>
        <p>
          <strong>Containers:</strong> {c.container}
        </p>
        <p>
          <strong>Common failure points:</strong> {c.problems}
        </p>
        <p>
          <strong>Limits:</strong> {c.limits}
        </p>
        <p>
          <strong>Calories:</strong> {c.calories}
        </p>
        <p>
          <strong>Seed storage:</strong> {c.seedLife}
        </p>
        <p>
          <strong>Varieties:</strong> {c.varieties}
        </p>
      </div>
      <p className="small muted">
        Crop reference records (links open online):{" "}
        {c.sources.map((s, i) => (
          <span key={s.url}>
            {i > 0 && "; "}
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.organization}: {s.title}
            </a>
          </span>
        ))}
        . Minnesota and Wisconsin extension guidance is used where MSU pages
        could not be retrieved; adjust dates with your Michigan frost date.
      </p>
      {adding && (
        <PlantingForm
          entry={{
            id: uid(),
            cropId: c.id,
            name: c.name,
            location: "",
            planted: "",
            reminder: d.outdoor || "",
            seeds: 0,
            harvest: 0,
            notes: "",
            stage: "planned",
            method: c.start.split(".")[0],
          }}
          onClose={() => setAdding(false)}
        />
      )}
    </section>
  );
}

function PlantingForm({
  entry,
  onClose,
}: {
  entry: GardenEntry;
  onClose: () => void;
}) {
  const { toast } = useHaven();
  const lots = useLiveQuery(() => db.seeds.toArray(), [], []) || [];
  return (
    <form
      className="panel edit-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        try {
          const name = String(f.get("name") || "").trim();
          if (!name) throw new Error("Name the planting.");
          await db.garden.put({
            ...entry,
            name: name.slice(0, 120),
            location: String(f.get("location") || "").slice(0, 120),
            planted: String(f.get("planted") || ""),
            reminder: String(f.get("reminder") || ""),
            reminderNote: String(f.get("reminderNote") || "").slice(0, 300),
            stage: String(f.get("stage")) as GardenEntry["stage"],
            seedLotId: String(f.get("seedLotId") || ""),
            method: String(f.get("method") || "").slice(0, 60),
            notes: String(f.get("notes") || "").slice(0, 4000),
          });
          toast("Planting saved.");
          onClose();
        } catch (err) {
          toast(errorMessage(err));
        }
      }}
    >
      <div className="section-heading">
        <h2>Planting</h2>
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
        <Field label="Plant / variety">
          <input
            name="name"
            required
            maxLength={120}
            defaultValue={entry.name}
          />
        </Field>
        <Field label="Location">
          <input
            name="location"
            maxLength={120}
            defaultValue={entry.location}
            placeholder="South window, raised bed…"
          />
        </Field>
        <Field label="Stage">
          <select name="stage" defaultValue={entry.stage || "planned"}>
            {[
              "planned",
              "sown",
              "transplanted",
              "growing",
              "harvesting",
              "finished",
              "failed",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Sown / planted / transplanted">
          <input name="planted" type="date" defaultValue={entry.planted} />
        </Field>
        <Field label="Next reminder">
          <input name="reminder" type="date" defaultValue={entry.reminder} />
        </Field>
        <Field label="Reminder note">
          <input
            name="reminderNote"
            maxLength={300}
            defaultValue={entry.reminderNote || ""}
            placeholder="Harden off, thin, hill potatoes…"
          />
        </Field>
        <Field label="Seed lot used">
          <select name="seedLotId" defaultValue={entry.seedLotId || ""}>
            <option value="">—</option>
            {lots.map((l) => (
              <option key={l.id} value={l.id}>
                {l.variety} ({l.packedFor || "year?"})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Method">
          <input
            name="method"
            maxLength={60}
            defaultValue={entry.method || ""}
          />
        </Field>
      </div>
      <Field label="Growing notes">
        <textarea name="notes" maxLength={4000} defaultValue={entry.notes} />
      </Field>
      <button className="button">
        <Save size={15} /> Save planting
      </button>
    </form>
  );
}

function Plantings({ lastFrost }: { lastFrost: string; firstFrost: string }) {
  const { toast } = useHaven();
  const entries = useLiveQuery(() => db.garden.toArray(), [], []) || [];
  const harvests = useLiveQuery(() => db.harvests.toArray(), [], []) || [];
  const [editing, setEditing] = useState<GardenEntry | null>(null);
  const [logging, setLogging] = useState<GardenEntry | null>(null);
  const today = todayISO();
  const totals = useMemo(() => {
    const m = new Map<string, number>();
    for (const h of harvests)
      m.set(h.entryId, (m.get(h.entryId) || 0) + h.grams);
    return m;
  }, [harvests]);
  return (
    <>
      {editing && (
        <PlantingForm entry={editing} onClose={() => setEditing(null)} />
      )}
      {logging && (
        <form
          className="panel edit-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const grams = Number(f.get("grams"));
            try {
              if (!Number.isFinite(grams) || grams <= 0 || grams > 1e6)
                throw new Error("Enter grams harvested.");
              await db.harvests.put({
                id: uid(),
                entryId: logging.id,
                date: String(f.get("date") || today),
                grams,
                notes: String(f.get("notes") || "").slice(0, 1000),
              } as HarvestEntry);
              toast("Harvest logged.");
              setLogging(null);
            } catch (err) {
              toast(errorMessage(err));
            }
          }}
        >
          <div className="section-heading">
            <h2>Log harvest — {logging.name}</h2>
            <button
              type="button"
              className="icon-button"
              aria-label="Close"
              onClick={() => setLogging(null)}
            >
              <X />
            </button>
          </div>
          <div className="form-grid">
            <Field label="Date">
              <input type="date" name="date" defaultValue={today} />
            </Field>
            <Field
              label="Weight (grams)"
              hint="A kitchen scale, or estimate: 1 lb ≈ 454 g."
            >
              <input type="number" name="grams" min="0" step="any" autoFocus />
            </Field>
            <Field label="Notes">
              <input name="notes" maxLength={1000} />
            </Field>
          </div>
          <button className="button">
            <Save size={15} /> Save harvest
          </button>
        </form>
      )}
      {entries.length ? (
        <div className="notes-grid">
          {entries
            .slice()
            .sort((a, b) =>
              (a.reminder || "9999").localeCompare(b.reminder || "9999"),
            )
            .map((x) => {
              const total = (totals.get(x.id) || 0) + (x.harvest || 0);
              const due = x.reminder && x.reminder <= today;
              return (
                <article className="panel" key={x.id}>
                  <div className="section-heading">
                    <span className="eyebrow">
                      {(x.stage || "planned").toUpperCase()}
                    </span>
                    <button
                      className="icon-button"
                      aria-label={"Edit " + x.name}
                      onClick={() => setEditing(x)}
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                  <h3>{x.name}</h3>
                  <p className="small">
                    {x.location || "Location not recorded"} ·{" "}
                    {x.planted ? "planted " + x.planted : "not planted yet"}
                  </p>
                  {x.reminder && (
                    <p className={due ? "reminder-due" : "small"}>
                      Reminder {x.reminder}
                      {x.reminderNote ? `: ${x.reminderNote}` : ""}
                      {due ? " · due" : ""}
                    </p>
                  )}
                  <p className="small">
                    Harvested so far: <b>{total.toLocaleString()} g</b> (
                    {(total / 453.6).toFixed(1)} lb)
                  </p>
                  {x.notes && <p className="note-body">{x.notes}</p>}
                  <div className="action-row">
                    <button
                      className="button secondary compact"
                      onClick={() => setLogging(x)}
                    >
                      <Leaf size={15} /> Log harvest
                    </button>
                    <button
                      className="button secondary compact"
                      onClick={async () => {
                        if (
                          confirm("Delete this planting and its harvest log?")
                        ) {
                          await db
                            .transaction(
                              "rw",
                              ["garden", "harvests"],
                              async (t) => {
                                await t("garden").delete(x.id);
                                for (const h of harvests.filter(
                                  (h) => h.entryId === x.id,
                                ))
                                  await t("harvests").delete(h.id);
                              },
                            )
                            .catch((e) => toast(errorMessage(e)));
                        }
                      }}
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </article>
              );
            })}
        </div>
      ) : (
        <Empty title="No plantings yet.">
          Open the Crop guide and choose “Add a planting”. Reminders appear here
          and on Today.
        </Empty>
      )}
      {!lastFrost && (
        <p className="small muted">
          Tip: set frost dates on the Season plan tab so new plantings get a
          suggested first reminder.
        </p>
      )}
    </>
  );
}

function Seeds() {
  const { toast } = useHaven();
  const lots = useLiveQuery(() => db.seeds.toArray(), [], []) || [];
  const [editing, setEditing] = useState<SeedLot | null>(null);
  const [testing, setTesting] = useState<SeedLot | null>(null);
  const year = new Date().getFullYear();
  return (
    <>
      <div className="action-row">
        <button
          className="button"
          onClick={() =>
            setEditing({
              id: uid(),
              cropId: crops[0].id,
              variety: "",
              source: "",
              packedFor: String(year),
              quantity: 0,
              unit: "seeds",
              location: "",
              notes: "",
              tests: [],
            })
          }
        >
          <Plus size={15} /> Add seed packet / lot
        </button>
      </div>
      {editing && (
        <form
          className="panel edit-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            try {
              const variety = String(f.get("variety") || "").trim();
              const quantity = Number(f.get("quantity"));
              if (!variety)
                throw new Error("Enter the variety or packet name.");
              if (!Number.isFinite(quantity) || quantity < 0)
                throw new Error("Enter a valid quantity.");
              await db.seeds.put({
                ...editing,
                cropId: String(f.get("cropId")),
                variety: variety.slice(0, 120),
                source: String(f.get("source") || "").slice(0, 120),
                packedFor: String(f.get("packedFor") || "").slice(0, 20),
                quantity,
                unit: String(f.get("unit") || "seeds").slice(0, 30),
                location: String(f.get("location") || "").slice(0, 120),
                notes: String(f.get("notes") || "").slice(0, 4000),
              });
              toast("Seed lot saved.");
              setEditing(null);
            } catch (err) {
              toast(errorMessage(err));
            }
          }}
        >
          <div className="section-heading">
            <h2>Seed lot</h2>
            <button
              type="button"
              className="icon-button"
              aria-label="Close"
              onClick={() => setEditing(null)}
            >
              <X />
            </button>
          </div>
          <div className="form-grid">
            <Field label="Crop">
              <select name="cropId" defaultValue={editing.cropId}>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Variety / packet">
              <input
                name="variety"
                required
                maxLength={120}
                defaultValue={editing.variety}
              />
            </Field>
            <Field label="Packed for (year)">
              <input
                name="packedFor"
                maxLength={20}
                defaultValue={editing.packedFor}
              />
            </Field>
            <Field label="Quantity">
              <input
                name="quantity"
                type="number"
                min="0"
                step="any"
                defaultValue={editing.quantity}
              />
            </Field>
            <Field label="Unit">
              <input
                name="unit"
                maxLength={30}
                defaultValue={editing.unit}
                placeholder="seeds, grams, packets"
              />
            </Field>
            <Field label="Source">
              <input
                name="source"
                maxLength={120}
                defaultValue={editing.source}
              />
            </Field>
            <Field label="Stored where">
              <input
                name="location"
                maxLength={120}
                defaultValue={editing.location}
                placeholder="Sealed jar in fridge"
              />
            </Field>
          </div>
          <Field label="Notes">
            <textarea
              name="notes"
              maxLength={4000}
              defaultValue={editing.notes}
            />
          </Field>
          <button className="button">
            <Save size={15} /> Save
          </button>
        </form>
      )}
      {testing && (
        <form
          className="panel edit-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const sown = Number(f.get("sown"));
            const sprouted = Number(f.get("sprouted"));
            try {
              if (!(sown > 0) || sprouted < 0 || sprouted > sown)
                throw new Error(
                  "Sprouted seeds must be between 0 and the number tested.",
                );
              await db.seeds.put({
                ...testing,
                tests: [
                  ...testing.tests,
                  { date: String(f.get("date") || todayISO()), sown, sprouted },
                ],
              });
              toast(
                `Germination ${germinationRate(sown, sprouted)}% recorded.`,
              );
              setTesting(null);
            } catch (err) {
              toast(errorMessage(err));
            }
          }}
        >
          <div className="section-heading">
            <h2>Germination test — {testing.variety}</h2>
            <button
              type="button"
              className="icon-button"
              aria-label="Close"
              onClick={() => setTesting(null)}
            >
              <X />
            </button>
          </div>
          <ol className="steps">
            <li>
              Place 10 seeds on a damp paper towel, fold it, and put it in a
              plastic bag.
            </li>
            <li>
              Keep it warm and dark (unless the packet says the seed needs
              light). Check every other day.
            </li>
            <li>
              Use the packet’s temperature, light and germination period; many
              vegetables need one to three weeks, while some herbs take longer.
              Count sprouts when the full test period is complete (MSU). A
              10-seed sample changes by ten percentage points per seed; test
              more if the reserve matters.
            </li>
          </ol>
          <div className="form-grid">
            <Field label="Date">
              <input type="date" name="date" defaultValue={todayISO()} />
            </Field>
            <Field label="Seeds tested">
              <input type="number" name="sown" min="1" defaultValue={10} />
            </Field>
            <Field label="Seeds that sprouted">
              <input type="number" name="sprouted" min="0" autoFocus />
            </Field>
          </div>
          <button className="button">
            <Save size={15} /> Record result
          </button>
        </form>
      )}
      {lots.length ? (
        <div className="panel inventory-list">
          {lots.map((l) => {
            const last = l.tests[l.tests.length - 1];
            const rate = last
              ? germinationRate(last.sown, last.sprouted)
              : null;
            const age = /^\d{4}$/.test(l.packedFor)
              ? year - Number(l.packedFor)
              : null;
            return (
              <div className="inventory-row" key={l.id}>
                <span
                  className={
                    "inventory-dot " +
                    (rate === null ? "" : rate > 70 ? "good" : "warn")
                  }
                />
                <div className="inventory-name">
                  <strong>{l.variety}</strong>
                  <small>
                    {crops.find((c) => c.id === l.cropId)?.name} · {l.quantity}{" "}
                    {l.unit} · packed for {l.packedFor || "?"}
                    {age !== null && age >= 2
                      ? ` · ${age} years old — test before relying on it`
                      : ""}
                  </small>
                  <small>
                    {rate === null
                      ? "No germination test yet."
                      : `Last test ${last!.date}: ${rate}% — ${sowingAdvice(rate)}`}
                  </small>
                </div>
                <div className="row-actions">
                  <button
                    className="button secondary compact"
                    onClick={() => setTesting(l)}
                  >
                    Test
                  </button>
                  <button
                    className="icon-button"
                    aria-label={"Edit " + l.variety}
                    onClick={() => setEditing(l)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={"Delete " + l.variety}
                    onClick={async () => {
                      if (confirm("Delete this seed lot?"))
                        await db.seeds
                          .delete(l.id)
                          .catch((e) => toast(errorMessage(e)));
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty title="No seeds recorded.">
          Record packets with their year so you know which to test first.
        </Empty>
      )}
      <Callout>
        <strong>Storing seeds:</strong> keep them sealed in glass jars, cool and
        dry — UMN Extension notes 32–41°F is ideal, so a refrigerator works; add
        silica gel to absorb moisture. Label each lot with crop, variety and
        year. Older seed sprouts less and grows weaker; onion seed is
        particularly short-lived (about one year under ideal conditions, Iowa
        State). Run a germination test before relying on any packet.
      </Callout>
    </>
  );
}

export const gardenReminders = (
  entries: GardenEntry[],
  today: string,
  horizon = 14,
) =>
  entries
    .filter(
      (e) =>
        e.reminder &&
        e.reminder <= addDays(today, horizon) &&
        e.stage !== "finished" &&
        e.stage !== "failed",
    )
    .map((e) => ({
      id: "garden-" + e.id,
      text: `${e.name}${e.reminderNote ? ": " + e.reminderNote : ""}`,
      due: e.reminder,
      kind: "task" as const,
      link: "garden",
    }));

function EmergencyGrow({
  lastFrost,
  firstFrost,
  selected,
  setSelected,
}: {
  lastFrost: string;
  firstFrost: string;
  selected: string;
  setSelected: (id: string) => void;
}) {
  const [context, setContext] = useState("suburban");
  const [goal, setGoal] = useState<GrowGoal>("all");
  const choices = cropChoices(crops, context, goal);
  const c = choices.find((c) => c.id === selected) || choices[0];
  const ctx = growContexts.find((c) => c.id === context)!;
  return (
    <>
      <section className="panel grow-picker">
        <h2>Choose what you can realistically grow</h2>
        <div className="form-grid">
          <Field label="Growing space">
            <select
              value={context}
              onChange={(e) => setContext(e.target.value)}
            >
              {growContexts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Main goal">
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as GrowGoal)}
            >
              <option value="all">Practical food variety</option>
              <option value="cold">Cool-season / frost-tolerant</option>
              <option value="calories">More calories / protein</option>
            </select>
          </Field>
          <Field label="Vegetable / herb">
            <select
              value={c?.id || ""}
              disabled={!choices.length}
              onChange={(e) => setSelected(e.target.value)}
            >
              {!choices.length && (
                <option value="">No reliable match for this situation</option>
              )}
              {choices.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <p>{ctx.advice}</p>
        {!c && (
          <Callout>
            No suitable crop is listed for this goal and environment. Indoor
            greens cannot meet a household calorie budget. Use stored groceries,
            food assistance and safe cooking first.
          </Callout>
        )}
        {c && (
          <>
            <h3>{c.name}</h3>
            <dl className="reference-facts">
              <div>
                <dt>Start & season</dt>
                <dd>
                  {c.start} {c.season}; {frostLabel[c.frost]}.
                </dd>
              </div>
              <div>
                <dt>Harvest estimate</dt>
                <dd>
                  {c.harvestDays[0]}–{c.harvestDays[1]} days from{" "}
                  {c.harvestFrom}. {c.harvestStage} Weather and variety change
                  timing.
                </dd>
              </div>
              <div>
                <dt>Space & light</dt>
                <dd>
                  {c.containerDepth}. {c.light}
                </dd>
              </div>
              <div>
                <dt>Water</dt>
                <dd>{c.water}</dd>
              </div>
              <div>
                <dt>Food value</dt>
                <dd>{c.calories}</dd>
              </div>
              <div>
                <dt>What can go wrong</dt>
                <dd>{c.problems}</dd>
              </div>
            </dl>
            <details>
              <summary>Full planting instructions, varieties & sources</summary>
              <CropCard
                key={c.id}
                crop={c}
                lastFrost={lastFrost}
                firstFrost={firstFrost}
              />
            </details>
          </>
        )}
        <p className="small muted">
          The Season plan tab accounts for local Michigan frost dates. Indoor
          advice assumes safe living conditions, not emergency heating.
        </p>
      </section>
      <SeedReserve />
    </>
  );
}
function SeedReserve() {
  const [group, setGroup] = useState(seedGroups[0].id);
  const g = seedGroups.find((g) => g.id === group)!;
  const [seed, setSeed] = useState(g.ids[0]);
  const packet = crops.find(
    (c) => c.id === (g.ids.includes(seed) ? seed : g.ids[0]),
  )!;
  return (
    <section className="panel">
      <h2>A small seed reserve you can rotate</h2>
      <Field label="Seed packet group">
        <select value={group} onChange={(e) => setGroup(e.target.value)}>
          {seedGroups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </Field>
      <p>{g.why}</p>
      <p>
        <strong>Packet mix:</strong>{" "}
        {g.ids.map((id) => crops.find((c) => c.id === id)!.name).join(", ")}.
      </p>
      <Field label="Seed to inspect">
        <select value={packet.id} onChange={(e) => setSeed(e.target.value)}>
          {g.ids.map((id) => (
            <option key={id} value={id}>
              {crops.find((c) => c.id === id)!.name}
            </option>
          ))}
        </select>
      </Field>
      <p>
        <strong>Estimated planting viability:</strong> {packet.seedLife}
      </p>
      <p>
        <strong>Choose a variety:</strong> {packet.varieties}
      </p>
      <p>
        <strong>Food value:</strong> {packet.calories}
      </p>
      <details>
        <summary>How to buy, store and test packets</summary>
        <ol className="article-list">
          <li>
            Buy clearly labeled packets from a reputable supplier: crop,
            variety, packed-for year, germination information and days to
            maturity. Choose a short season suited to your part of Michigan. A
            mixed “survival seed” bucket does not guarantee a suitable harvest.
          </li>
          <li>
            Use open-pollinated varieties if saving seed true to type matters.
            Hybrid packets can be useful crops, but saved offspring may differ.
            Keep a few familiar crops you can practice with each year.
          </li>
          <li>
            Keep packets dry, labeled and in an airtight jar with desiccant in a
            cool location. Refrigeration can help when reliable; a hot shed or
            damp basement shortens life. Let a cold sealed jar warm before
            opening to reduce condensation.
          </li>
          <li>
            Rotate annually and test older packets on moist paper towels using
            the packet’s temperature and germination period. Count seeds sown
            and sprouted in Seed inventory; an age estimate does not guarantee
            germination.
          </li>
          <li>
            Primed or pelleted seed can have much shorter useful life; generally
            plan to use it within one growing season and follow its label. Store
            planting seed separately from food. Never eat treated seed or use it
            for sprouts. Certified seed potatoes need a separate seasonal
            storage and disease plan.
          </li>
        </ol>
        <p className="small">
          Storage and germination references (reviewed 2026-11-01, open online):{" "}
          <a
            href="https://extension.umn.edu/planting-and-growing-guides/saving-vegetable-seeds"
            target="_blank"
            rel="noreferrer"
          >
            UMN seed saving
          </a>
          ;{" "}
          <a
            href="https://yardandgarden.extension.iastate.edu/how-to/how-store-seeds-and-test-germination-rates"
            target="_blank"
            rel="noreferrer"
          >
            Iowa State storage and germination
          </a>
          ;{" "}
          <a
            href="https://migarden.msu.edu/uploads/files/containerGarden-VeggiesHerbs.pdf"
            target="_blank"
            rel="noreferrer"
          >
            MSU container growing
          </a>
          .
        </p>
      </details>
    </section>
  );
}
