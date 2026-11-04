import { useState } from "react";
import foods from "../content/pantry-reference.json";
import { IngredientOxalates } from "./Nutrition";
export function PantryReference() {
  const [tier, setTier] = useState("Core");
  const [query, setQuery] = useState("");
  const choices = foods.filter(
    (f) =>
      (tier === "All" || f.tier === tier) &&
      [f.name, ...f.examples]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <div className="pantry-guide">
      <section className="pantry-intro">
        <h2>Stock meals, not a pile of cans.</h2>
        <p>
          Energy, protein, produce, fats and calcium sources. Choose familiar
          foods and small packs, with a no-cook backup.
        </p>
        <a href="#/supplies" className="button secondary">
          Record what you have
        </a>
      </section>
      <div className="priority-tabs" role="group" aria-label="Pantry priority">
        {[
          ["Core", "Essentials"],
          ["Useful extra", "Useful extras"],
          ["All", "Everything"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={tier === id}
            className={tier === id ? "active" : ""}
            onClick={() => setTier(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <input
        className="pantry-search"
        aria-label="Search pantry foods"
        placeholder="Find rice, milk, beans…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <p className="small muted">
        {choices.length} food groups · expand one for shelf life and handling.
        Dates describe quality under suitable storage, not guaranteed safety.
      </p>
      <div className="pantry-grid">
        {choices.map((f, i) => (
          <details className="panel pantry-food" key={f.id}>
            <summary>
              <span className="pantry-number">
                {String(foods.indexOf(f) + 1).padStart(2, "0")}
              </span>
              <span>
                <strong>{f.name}</strong>
                <small>{f.examples.slice(0, 2).join(" · ")}</small>
              </span>
            </summary>
            <div className="pantry-food-detail">
              <p>{f.role}</p>
              <p className="small">
                <b>Choose:</b> {f.examples.join("; ")}
              </p>
              <dl className="storage-facts">
                <div>
                  <dt>Unopened · best quality</dt>
                  <dd>{f.unopenedLife}</dd>
                </div>
                <div>
                  <dt>After opening</dt>
                  <dd>{f.afterOpening}</dd>
                </div>
                <div>
                  <dt>Water + fuel</dt>
                  <dd>{f.waterFuel}</dd>
                </div>
                <div>
                  <dt>Store it</dt>
                  <dd>{f.storage}</dd>
                </div>
              </dl>
              <p className="small">{f.notes}</p>
              <IngredientOxalates ingredients={[f.name, ...f.examples]} />
              <p className="small muted">
                <a href={f.sourceUrl} target="_blank" rel="noreferrer">
                  Storage source
                </a>
                {f.additionalSources.map((url, i) => (
                  <span key={url}>
                    {" "}
                    ·{" "}
                    <a href={url} target="_blank" rel="noreferrer">
                      Additional source {i + 1}
                    </a>
                  </span>
                ))}{" "}
                · reviewed {f.checked}; links open online.
              </p>
            </div>
          </details>
        ))}
      </div>
      {!choices.length && (
        <p className="empty">
          No matching food groups. Try another search or priority.
        </p>
      )}
      <details className="panel">
        <summary>Safe storage & the equipment to remember</summary>
        <p>
          Keep a manual can opener, safe water, suitable outdoor cookware and
          allergy-safe options. Quality windows assume intact commercial
          packages stored as directed. Opened foods have different limits.
          Discard damaged or flood-contaminated cans; never taste-test suspect
          food.
        </p>
        <a href="#/storage">Full storage-date reference</a> ·{" "}
        <a href="#/checklist">Preparedness checklist</a>
      </details>
    </div>
  );
}
