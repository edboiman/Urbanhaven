import { useState } from "react";
import directory from "../content/radio-stations.json";
import { useLiveQuery } from "../storage/idb";
import { db, todayISO } from "../storage/db";
import {
  PageTitle,
  Callout,
  Field,
  useHaven,
  errorMessage,
} from "../components/shared";
type Log = { saved: string[]; heard: Record<string, string> };
export function Radio() {
  const { toast } = useHaven();
  const [band, setBand] = useState("all"),
    [query, setQuery] = useState(""),
    [savedOnly, setSavedOnly] = useState(false);
  const saved = useLiveQuery(() => db.plans.get("radio-log"), []);
  const log = (saved?.data || { saved: [], heard: {} }) as Log;
  const all = [...directory.weather, ...directory.broadcast];
  const stations = all.filter(
    (s) =>
      (band === "all" || s.band === band) &&
      (!savedOnly || log.saved.includes(s.id)) &&
      `${s.name} ${s.area} ${s.frequency}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const update = async (next: Log) => {
    try {
      await db.plans.put({
        id: "radio-log",
        data: next,
        updated: new Date().toISOString(),
      });
    } catch (e) {
      toast(errorMessage(e));
    }
  };
  return (
    <>
      <PageTitle
        eyebrow="MICHIGAN RADIO DIRECTORY"
        title="Tune a real radio. Save what you hear."
        description="Bundled NOAA Weather Radio and selected Michigan AM/FM frequencies for your hand-crank or battery receiver. This page does not stream audio or monitor stations."
      />
      <Callout>
        <strong>No station is guaranteed to remain on air.</strong>
        <p>
          Power, transmitter damage and reception affect coverage. Test your
          local frequencies before an emergency and keep alternatives. A hand
          crank describes the power source: your receiver needs a separate WX /
          WB band to receive NOAA. An AM/FM-only set cannot tune it.
        </p>
      </Callout>
      <section className="panel">
        <div className="form-grid">
          <Field label="Radio band">
            <select value={band} onChange={(e) => setBand(e.target.value)}>
              <option value="all">All bands</option>
              <option value="WX">NOAA weather (WX / WB)</option>
              <option value="AM">AM</option>
              <option value="FM">FM</option>
            </select>
          </Field>
          <Field label="Town, station or frequency">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Detroit, Marquette, 162.550…"
            />
          </Field>
        </div>
        <label className="check-label">
          <input
            type="checkbox"
            checked={savedOnly}
            onChange={(e) => setSavedOnly(e.target.checked)}
          />
          My saved stations only
        </label>
        <p>
          {stations.length} stations · reviewed {directory.reviewed}. Area
          labels describe transmitter areas, not reception guarantees.
        </p>
        <div className="station-grid">
          {stations.map((s) => (
            <article className="station-card" key={s.id}>
              <p className="eyebrow">
                {s.band === "WX" ? "NOAA WEATHER" : s.band}
              </p>
              <h2>
                {s.frequency.replace(/\s*(MHz|kHz)$/i, "")}{" "}
                <small>{s.band === "AM" ? "kHz" : "MHz"}</small>
              </h2>
              <h3>{s.name}</h3>
              <p>{s.area}</p>
              <p className="small">{s.notes}</p>
              <div className="action-row">
                <button
                  className="button secondary compact"
                  onClick={() =>
                    void update({
                      ...log,
                      saved: log.saved.includes(s.id)
                        ? log.saved.filter((id) => id !== s.id)
                        : [...log.saved, s.id],
                    })
                  }
                >
                  {log.saved.includes(s.id) ? "Unsave" : "Save"} {s.name}
                </button>
                <button
                  className="button secondary compact"
                  onClick={() =>
                    void update({
                      ...log,
                      heard: { ...log.heard, [s.id]: todayISO() },
                    })
                  }
                >
                  Heard today
                </button>
              </div>
              {log.heard[s.id] && (
                <p className="small">
                  Your last reception check: {log.heard[s.id]} (not live
                  status).
                </p>
              )}
              <a
                className="small"
                href={s.url}
                target="_blank"
                rel="noreferrer"
              >
                Station source (opens online)
              </a>
            </article>
          ))}
        </div>
        {!stations.length && (
          <p>No matching stations. Clear the search or show all bands.</p>
        )}
      </section>
      <section className="panel">
        <h2>Use your receiver offline</h2>
        <ul className="article-list">
          {directory.tips.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
        <p>
          <strong>Seven NOAA frequencies:</strong> 162.400, 162.425, 162.450,
          162.475, 162.500, 162.525 and 162.550 MHz. Scan for the clearest local
          broadcast. Channel numbering differs by receiver; use its manual.
        </p>
        <p>
          Weather transmitters carry weather and some official hazard messages;
          they do not replace local news or emergency instructions. Keep spare
          batteries where supported and test the crank and antenna before you
          need them.
        </p>
        <button className="button secondary" onClick={() => window.print()}>
          Print radio list
        </button>
      </section>
    </>
  );
}
