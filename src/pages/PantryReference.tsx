import { useState } from "react";
import foods from "../content/pantry-reference.json";
import { Callout, Field } from "../components/shared";
export function PantryReference() {
  const [tier, setTier] = useState("Core"),
    [id, setId] = useState(foods[0]?.id || "");
  const choices = foods.filter((f) => f.tier === tier),
    f = choices.find((f) => f.id === id) || choices[0];
  return (
    <section className="panel">
      <h2>Buy the essentials first</h2>
      <p className="small">
        <a href="#/storage">Understand quality dates, expiry and rotation</a>
      </p>
      <p>
        Build meals your household already eats: energy, protein, fat, fruit /
        vegetables and suitable calcium sources. Have a no-cook option for every
        day. Stock enough familiar food for your household plan, then add
        variety. Use Supplies and the 14-day checklist to track amounts.
      </p>
      <div className="form-grid">
        <Field label="Shopping priority">
          <select value={tier} onChange={(e) => setTier(e.target.value)}>
            <option>Core</option>
            <option>Useful extra</option>
          </select>
        </Field>
        <Field label="Food group">
          <select value={f?.id || ""} onChange={(e) => setId(e.target.value)}>
            {choices.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {f && (
        <>
          <h3>{f.name}</h3>
          <p>{f.role}</p>
          <p>
            <strong>Look for:</strong> {f.examples.join("; ")}
          </p>
          <dl className="reference-facts">
            <div>
              <dt>Unopened shelf life</dt>
              <dd>{f.unopenedLife}</dd>
            </div>
            <div>
              <dt>Once opened</dt>
              <dd>{f.afterOpening}</dd>
            </div>
            <div>
              <dt>Storage</dt>
              <dd>{f.storage}</dd>
            </div>
            <div>
              <dt>Water & fuel</dt>
              <dd>{f.waterFuel}</dd>
            </div>
          </dl>
          <p>{f.notes}</p>
          <p className="small muted">
            <a href={f.sourceUrl} target="_blank" rel="noreferrer">
              Source (opens online)
            </a>{" "}
            · reviewed {f.checked}{" "}
            {f.additionalSources.map((url) => (
              <span key={url}>
                {" "}
                ·{" "}
                <a href={url} target="_blank" rel="noreferrer">
                  Additional storage source
                </a>
              </span>
            ))}
          </p>
        </>
      )}
      <details>
        <summary>Compact core shopping list</summary>
        <ul className="article-list">
          {foods
            .filter((f) => f.tier === "Core")
            .map((f) => (
              <li key={f.id}>
                <strong>{f.name}:</strong> {f.examples.join("; ")}
              </li>
            ))}
        </ul>
        <p>
          Include a manual can opener, safe drinking and cooking water,
          allergy-safe alternatives and any prescribed diet or infant feeding
          needs. Buy small packs you can finish without refrigeration.
        </p>
      </details>
      <Callout>
        <strong>Shelf life is not a safety guarantee.</strong>
        <p>
          Quality ranges assume intact packages stored as directed, cool and
          dry. Follow product instructions. Discard leaking, bulging, deeply
          dented or badly rusted cans and flood-contaminated food. Never taste
          food to decide if it is safe. Without refrigeration, plan to finish
          opened wet foods at one meal.
        </p>
      </Callout>
      <p>
        <a href="#/cooking">Outdoor stove recipes</a> ·{" "}
        <a href="#/checklist">14-day amounts</a> ·{" "}
        <a href="#/supplies">Record your supplies</a>
      </p>
    </section>
  );
}
