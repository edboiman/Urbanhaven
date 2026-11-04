import { useEffect, useState } from "react";
import basics from "../content/cooking-basics.json";
import {
  cookingRecipes,
  filterCookingRecipes,
  type CookingRecipe,
} from "../meals/catalog";
import { PageTitle, Callout } from "../components/shared";
import { parseRoute, go } from "../components/route";
import { IngredientOxalates } from "./Nutrition";
export function CookingSafety() {
  return (
    <div className="cooking-safety">
      <strong>Combustion cooking stays outdoors.</strong>
      <p>
        Gas/propane stoves, charcoal and campfires: outdoors only, away from
        doors, windows and vents. Never in a home, tent, garage or vehicle.
        Carbon monoxide can kill. Use potable water; cooking food does not make
        chemically contaminated water safe.
      </p>
    </div>
  );
}
function LeftoverRule() {
  return (
    <p className="small safety-note">
      Refrigerate perishables at 40°F / 4°C or below within 2 hours (1 hour
      above 90°F / 32°C). Without safe refrigeration, make only what you will
      eat and discard the rest. Never heat a sealed can.
    </p>
  );
}
export function Cooking() {
  const [query, setQuery] = useState("");
  const [heat, setHeat] = useState("all");
  const [fridge, setFridge] = useState(false);
  const [tab, setTab] = useState("recipes");
  const [limit, setLimit] = useState(12);
  const id = parseRoute().params.get("recipe");
  const recipe = cookingRecipes.find((r) => r.id === id);
  const choices = filterCookingRecipes(query, heat, fridge);
  if (recipe) return <CookingDetail key={recipe.id} r={recipe} />;
  return (
    <>
      <PageTitle
        eyebrow="PANTRY TO POT"
        title="Good food, simpler cooking."
        description="Find a familiar meal by ingredient, time or the heat you have. All amounts are per batch; portions and cook times are approximate."
      />
      <div className="food-nav">
        <a href="#/meals">Pantry</a>
        <a href="#/nutrition">Daily nutrition</a>
        <a href="#/oxalates">Oxalates</a>
      </div>
      <CookingSafety />
      <div className="tabs" role="tablist" aria-label="Cooking views">
        {[
          ["recipes", "Recipes"],
          ["basics", "Cooking basics"],
          ["safety", "Safety"],
        ].map(([id, name]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {name}
          </button>
        ))}
      </div>
      {tab === "recipes" && (
        <>
          <div className="simple-filters">
            <input
              aria-label="Search recipes and ingredients"
              placeholder="Try lentils, rice, tuna…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(12);
              }}
            />
            <select
              aria-label="Recipe cooking filter"
              value={heat}
              onChange={(e) => {
                setHeat(e.target.value);
                setLimit(12);
              }}
            >
              <option value="all">Any cooking time</option>
              <option value="none">No heat needed</option>
              <option value="quick">Up to 15 minutes</option>
            </select>
          </div>
          <label className="check-label open-filter">
            <input
              type="checkbox"
              checked={fridge}
              onChange={(e) => setFridge(e.target.checked)}
            />
            I have safe refrigeration — include chilled recipes
          </label>
          <p className="small muted">
            {choices.length} recipes · chilled oats are hidden unless safe
            refrigeration is available.
          </p>
          <div className="cooking-catalog">
            {choices.slice(0, limit).map((r) => (
              <a
                className="panel cooking-card"
                href={"#/cooking?recipe=" + r.id}
                key={r.id}
              >
                <span className="eyebrow">
                  {r.heat ? "COOK / HOT WATER" : "NO HEAT"}
                  {r.fridge ? " · REFRIGERATION" : ""}
                </span>
                <h2>{r.name}</h2>
                <p className="recipe-meta">
                  {r.minutes} · serves {r.servings}
                </p>
                <p className="small muted">
                  {r.ingredients.slice(0, 3).join(" · ")}
                </p>
                <span className="recipe-open">Open recipe →</span>
              </a>
            ))}
          </div>
          {!choices.length && (
            <div className="empty">
              <h2>No matching recipes.</h2>
              <p>Try another ingredient or cooking filter.</p>
            </div>
          )}
          {limit < choices.length && (
            <button
              className="button secondary"
              onClick={() => setLimit(limit + 12)}
            >
              Show more recipes
            </button>
          )}
          <LeftoverRule />
        </>
      )}
      {tab === "basics" && (
        <>
          <p>
            Choose a staple. Follow the exact product’s directions when they
            differ; keep drinking and cleanup water separate.
          </p>
          <div className="basics-list">
            {basics.map((b) => (
              <details className="panel" key={b.name}>
                <summary>{b.name}</summary>
                {b.paragraphs.map((p, i) =>
                  p.startsWith("Steps:") ? (
                    <ol className="article-list" key={i}>
                      {p
                        .replace(/^Steps: /, "")
                        .split(/\s*\(\d+\)\s*/)
                        .filter(Boolean)
                        .map((step, n) => (
                          <li key={n}>{step}</li>
                        ))}
                    </ol>
                  ) : (
                    <p key={i}>{p}</p>
                  ),
                )}
              </details>
            ))}
          </div>
          <Callout danger>
            <strong>Dried kidney beans need a separate safety step.</strong>
            <p>
              Soak at least 5 hours, discard that water, and vigorously boil in
              fresh water for at least 30 minutes; continue until fully tender.
              Never use a low-temperature slow cooker for dried kidney beans.
              Commercial canned kidney beans are already cooked. Choose canned
              beans when safe water or fuel is scarce.
            </p>
          </Callout>
        </>
      )}
      {tab === "safety" && (
        <section className="panel">
          <h2>Before lighting a stove</h2>
          <ul className="article-list">
            <li>
              Use a stable, outdoor location and suitable cookware. Follow the
              appliance instructions and local burn bans.
            </li>
            <li>
              Keep children and pets clear. Have a lid, water and heat-resistant
              tools ready. Never refuel a hot stove.
            </li>
            <li>
              Use known-potable or appropriately treated water. Boiling cannot
              remove fuel or other chemicals.
            </li>
            <li>
              Wash hands with soap and safe water. Keep can tops, utensils and
              preparation surfaces clean.
            </li>
            <li>
              Discard bulging, leaking, deeply dented, badly rusted or
              flood-contaminated cans. Do not taste-test suspect food.
            </li>
            <li>
              Do not substitute dry beans for cooked/canned beans. Instant
              couscous and instant rice differ from ordinary grains.
            </li>
          </ul>
          <LeftoverRule />
          <h3>Safety and technique sources</h3>
          <ul className="article-list">
            <li>
              <a
                href="https://www.usarice.com/thinkrice/how-to/how-to-cook-rice"
                target="_blank"
                rel="noreferrer"
              >
                USA Rice cooking methods
              </a>
            </li>
            <li>
              <a
                href="https://spendsmart.extension.iastate.edu/pantry-picks/lentils/"
                target="_blank"
                rel="noreferrer"
              >
                Iowa State lentil preparation
              </a>
            </li>
            <li>
              <a
                href="https://extension.colostate.edu/resource/cooking-dry-beans/"
                target="_blank"
                rel="noreferrer"
              >
                Colorado State dry beans
              </a>
            </li>
            <li>
              <a
                href="https://www.fda.gov/files/food/published/Bad-Bug-Book-2nd-Edition-(PDF).pdf"
                target="_blank"
                rel="noreferrer"
              >
                FDA kidney-bean toxin guidance (PDF)
              </a>
            </li>
            <li>
              <a
                href="https://www.foodsafety.gov/keep-food-safe/food-safety-in-disaster-or-emergency"
                target="_blank"
                rel="noreferrer"
              >
                FoodSafety.gov emergency food safety
              </a>
            </li>
          </ul>
          <p className="small muted">
            Source links require a connection. Recipes, steps and guidance are
            bundled offline; recipes have not had kitchen or
            nutrition-laboratory testing.
          </p>
        </section>
      )}
    </>
  );
}
export function CookingDetail({ r }: { r: CookingRecipe }) {
  const [steps, setSteps] = useState<number[]>([]);
  const [ingredients, setIngredients] = useState<number[]>([]);
  const toggle = (n: number, list: number[], set: (x: number[]) => void) =>
    set(list.includes(n) ? list.filter((x) => x !== n) : [...list, n]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [r.id]);
  return (
    <article className="cook-detail">
      <div className="action-row recipe-actions">
        <button className="button secondary" onClick={() => go("cooking")}>
          ← All recipes
        </button>
        <button className="button secondary" onClick={() => window.print()}>
          Print
        </button>
      </div>
      <PageTitle
        eyebrow={r.heat ? "STOVE / SAFE OUTDOOR HEAT" : "NO HEAT NEEDED"}
        title={r.name}
        description={`${r.minutes} · serves ${r.servings} · one batch`}
      />
      <CookingSafety />
      {r.fridge && (
        <Callout danger>
          <strong>Safe refrigeration required.</strong>
          <p>
            Keep at 40°F / 4°C or below throughout. This is not a
            no-refrigeration outage meal.
          </p>
        </Callout>
      )}
      <div className="recipe-facts panel">
        <div>
          <span>Water for cooking</span>
          <p>{r.water}</p>
        </div>
        <div>
          <span>Fuel / heat</span>
          <p>{r.fuel}</p>
        </div>
      </div>
      <div className="cook-columns">
        <section className="panel">
          <h2>Gather ingredients</h2>
          <p className="small muted">
            Check as you gather. Amounts are for one batch.
          </p>
          <ul className="gather-list">
            {r.ingredients.map((x, i) => (
              <li key={i}>
                <label>
                  <input
                    type="checkbox"
                    checked={ingredients.includes(i)}
                    onChange={() => toggle(i, ingredients, setIngredients)}
                  />
                  <span>{x}</span>
                </label>
              </li>
            ))}
          </ul>
          <details>
            <summary>Equipment</summary>
            <ul>
              {r.equipment.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </details>
          <IngredientOxalates ingredients={r.ingredients} />
        </section>
        <section className="panel">
          <div className="step-heading">
            <h2>Cook, step by step</h2>
            <span className="small">
              {steps.length} / {r.steps.length}
            </span>
          </div>
          <ol className="cook-steps">
            {r.steps.map((x, i) => (
              <li key={i} className={steps.includes(i) ? "step-done" : ""}>
                <label>
                  <input
                    type="checkbox"
                    checked={steps.includes(i)}
                    onChange={() => toggle(i, steps, setSteps)}
                  />
                  <span>
                    <b>Step {i + 1}</b>
                    {x}
                  </span>
                </label>
              </li>
            ))}
          </ol>
          <p className="small muted">
            Cooking checks reset when you leave this recipe.
          </p>
          <LeftoverRule />
        </section>
      </div>
      <details className="panel" open={r.fridge}>
        <summary>Substitutions, food safety & notes</summary>
        <ul className="article-list">
          {r.notes.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
        <p className="small muted">
          {r.source}. Exact ingredient labels and allergies take priority.
          Recipe portions are not verified calorie or nutrient totals.
        </p>
      </details>
    </article>
  );
}
