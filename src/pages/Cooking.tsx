import { useState } from "react";
import recipes from "../content/stove-recipes.json";
import { PageTitle, Callout, Field } from "../components/shared";
export function Cooking() {
  const [filter, setFilter] = useState("all"),
    [id, setId] = useState(recipes[0]?.id || "");
  const choices = recipes.filter(
    (r) => filter === "all" || r.tags.includes(filter),
  );
  const r = choices.find((r) => r.id === id) || choices[0];
  return (
    <>
      <PageTitle
        eyebrow="OUTDOOR COOKING"
        title="Simple meals. One safe heat source."
        description="Pantry recipes for an outdoor camp stove or a stable grate over a small, permitted campfire. Start with safe water and a no-cook backup."
      />
      <Callout danger>
        <strong>Camp stoves and fires stay outdoors.</strong>
        <p>
          Never cook with these inside, in a tent, garage or enclosed porch,
          even with an open window. Keep away from doors, windows, vents and
          combustibles; follow the stove maker’s instructions and local fire
          restrictions. Keep water and a lid ready; supervise children and pets.
          Never heat a sealed can or refuel a hot stove. If weather or
          conditions prevent safe outdoor cooking, use a no-cook meal.
        </p>
      </Callout>
      <section className="panel">
        <div className="form-grid">
          <Field label="Recipe type">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All stove recipes</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="one-pot">One pot</option>
            </select>
          </Field>
          <Field label="Choose a recipe">
            <select value={r?.id || ""} onChange={(e) => setId(e.target.value)}>
              {choices.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {r ? (
          <>
            <p className="eyebrow">
              SERVES {r.servings} · ABOUT {r.minutes} MINUTES
            </p>
            <h2>{r.name}</h2>
            <h3>Ingredients</h3>
            <ul className="article-list">
              {r.ingredients.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p>
              <strong>Equipment:</strong> {r.equipment.join("; ")}
            </p>
            <h3>Cook</h3>
            <ol className="article-list">
              {r.steps.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ol>
            <dl className="reference-facts">
              <div>
                <dt>Water</dt>
                <dd>{r.water}</dd>
              </div>
              <div>
                <dt>Fuel & heat</dt>
                <dd>{r.fuel}</dd>
              </div>
              <div>
                <dt>Leftovers</dt>
                <dd>{r.leftovers}</dd>
              </div>
            </dl>
            <Callout danger>
              <ul className="article-list">
                {r.safety.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </Callout>
            <p className="small muted">
              Original app recipe; safety source:{" "}
              <a href={r.sourceUrl} target="_blank" rel="noreferrer">
                official guidance (opens online)
              </a>
              . Label ingredients, allergies and local conditions take priority.
            </p>
          </>
        ) : (
          <p>No recipes match this filter.</p>
        )}
      </section>
      <p>
        <a href="#/meals">Pantry priorities & no-cook meals</a>
      </p>
    </>
  );
}
