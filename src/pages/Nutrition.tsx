import { useState } from "react";
import data from "../content/oxalates.json";
import { ingredientOxalates } from "../meals/oxalates";
import {
  PageTitle,
  Callout,
  Field,
  useHaven,
  errorMessage,
} from "../components/shared";
import { setPreferences } from "../storage/db";
import { parseRoute } from "../components/route";
export const oxalateSource =
  "https://hsph.harvard.edu/wp-content/uploads/2024/07/OXALATE-TABLE-1.xlsx";
const sourcePage =
  "https://hsph.harvard.edu/department/nutrition/nutrition-questionnaire-service-center/";
const foodName = (s: string) =>
  s.toLowerCase().replace(/(^|, )\w/g, (x) => x.toUpperCase());
function OxalateRows({ rows }: { rows: typeof data }) {
  return (
    <div className="oxalate-list">
      {rows.map((r) => (
        <div className="oxalate-row" key={r.sourceRow}>
          <div>
            <strong>{foodName(r.food)}</strong>
            <small>
              {r.serving}
              {r.directlyMeasured
                ? ""
                : " · source estimate, not directly measured"}
            </small>
          </div>
          <span>
            <b>{r.oxalateMg}</b> mg
          </span>
        </div>
      ))}
    </div>
  );
}
export function IngredientOxalates({ ingredients }: { ingredients: string[] }) {
  const rows = ingredientOxalates(ingredients);
  return (
    <details className="ingredient-reference">
      <summary>Oxalate references for these ingredients</summary>
      <p className="small">
        These are comparison foods, not measurements of this recipe. Match the
        exact preparation and portion; cooked/drained values do not establish
        values for canned foods or soups where cooking liquid is eaten. Unlisted
        ingredients are unknown, not zero. No recipe total is calculated.
      </p>
      {rows.length ? (
        <OxalateRows rows={rows} />
      ) : (
        <p>No matching reference entries. This does not mean oxalate-free.</p>
      )}
      <a href="#/oxalates">Full Harvard reference & source</a>
    </details>
  );
}
export function Oxalates() {
  const [query, setQuery] = useState(parseRoute().params.get("q") || "");
  const [order, setOrder] = useState("name");
  const rows = data
    .filter((r) => r.food.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) =>
      order === "amount"
        ? a.oxalateMg - b.oxalateMg
        : a.food.localeCompare(b.food),
    );
  return (
    <>
      <PageTitle
        eyebrow="INGREDIENT REFERENCE · HARVARD 2023 TABLE"
        title="Oxalates, with the portion attached."
        description="Compare 21 foods by their listed preparation and serving. A smaller number does not make every product or whole recipe suitable for your diet."
      />
      <div className="food-nav">
        <a href="#/nutrition">Daily nutrition</a>
        <a href="#/meals">Pantry</a>
        <a href="#/cooking">Recipes</a>
      </div>
      <Callout>
        <strong>Preparation matters.</strong>
        <p>
          Values vary with food, preparation and portion. Do not substitute
          canned, raw or soup ingredients for boiled/drained entries. These are
          reference mg per listed serving, not tests of your food or a daily
          oxalate prescription.
        </p>
      </Callout>
      <div className="simple-filters">
        <input
          aria-label="Search oxalate foods"
          placeholder="Find lentils, rice, peas…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Sort oxalates"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
        >
          <option value="name">Food name</option>
          <option value="amount">Lowest amount per listed serving</option>
        </select>
      </div>
      <p className="small muted">
        {rows.length} reference entries · serving sizes differ; this is not a
        per-gram ranking.
      </p>
      <section className="panel">
        <OxalateRows rows={rows} />
        {!rows.length && (
          <p>No entries match. Missing data never means zero.</p>
        )}
      </section>
      <details className="panel">
        <summary>Source, clinical context & limits</summary>
        <p>
          Selected values from Harvard Nutrition Questionnaire Service Center’s
          November 2023 table. Amounts are commonly interpreted as mg per listed
          portion; the source spreadsheet labels its numeric column “Oxalate
          value” without printing a unit. Two entries here are source estimates
          rather than directly measured values, as marked. Other lists and older
          editions may differ.
        </p>
        <p>
          <a href={sourcePage} target="_blank" rel="noreferrer">
            Harvard source page
          </a>{" "}
          ·{" "}
          <a href={oxalateSource} target="_blank" rel="noreferrer">
            Original spreadsheet (online)
          </a>
        </p>
        <p>
          Kidney-stone advice depends on stone type and individual history. Keep
          appropriate calcium foods in your diet; do not restrict calcium simply
          because a stone contains calcium. Follow your clinician’s fluid,
          sodium, protein and oxalate advice, especially with kidney disease or
          fluid restrictions.
        </p>
        <a
          href="https://www.niddk.nih.gov/health-information/urologic-diseases/kidney-stones/eating-diet-nutrition"
          target="_blank"
          rel="noreferrer"
        >
          NIDDK kidney-stone nutrition guidance (online)
        </a>
      </details>
    </>
  );
}
export function Nutrition() {
  const { settings, toast } = useHaven();
  const [target, setTarget] = useState(String(settings.dailyCalories));
  return (
    <>
      <PageTitle
        eyebrow="EVERYDAY FOOD · EMERGENCY PLAN"
        title="Enough energy. A balanced pantry."
        description="Plan food you can safely prepare and already know you can eat. Calories matter, and so do protein, fat, fiber and micronutrients."
      />
      <div className="food-nav">
        <a href="#/meals">Pantry</a>
        <a href="#/cooking">Recipes</a>
        <a href="#/oxalates">Oxalate reference</a>
      </div>
      <section className="panel energy-card">
        <span className="eyebrow">YOUR PLANNING AMOUNT</span>
        <strong>
          {settings.dailyCalories.toLocaleString()}
          <small> kcal / person / day</small>
        </strong>
        <p>
          For {settings.people} {settings.people === 1 ? "person" : "people"}{" "}
          over {settings.days} days:{" "}
          <b>
            {(
              settings.dailyCalories *
              settings.people *
              settings.days
            ).toLocaleString()}{" "}
            kcal
          </b>{" "}
          total. This is a planning estimate, not a complete-diet assessment.
        </p>
        <p className="small">
          2,000 kcal/day is a general nutrition-label reference, not a universal
          requirement or minimum. Needs vary with age, body size, activity,
          pregnancy and health. Children need their own age-appropriate plan;
          one household average cannot prescribe everyone’s needs.
        </p>
        <details>
          <summary>Adjust daily calories</summary>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const value = Number(target);
              if (!Number.isFinite(value) || value < 500 || value > 20000) {
                toast(
                  "Enter a planning amount between 500 and 20,000 kcal. This is a software range, not dietary advice.",
                );
                return;
              }
              try {
                await setPreferences({ dailyCalories: value });
                toast("Planning amount updated.");
              } catch (e) {
                toast(errorMessage(e));
              }
            }}
          >
            <Field label="Planning kcal per person per day">
              <input
                type="number"
                min="500"
                max="20000"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </Field>
            <button className="button">Save planning amount</button>
          </form>
          <p className="small">
            <a
              href="https://www.nal.usda.gov/human-nutrition-and-food-safety/dri-calculator"
              target="_blank"
              rel="noreferrer"
            >
              USDA personal DRI calculator (online)
            </a>
          </p>
        </details>
      </section>
      <h2>Build each day around these</h2>
      <div className="nutrition-grid">
        {[
          [
            "Energy + useful fats",
            "Rice, oats, pasta, potatoes or crackers, with suitable oil or spread. Keep no-cook alternatives when fuel is scarce.",
          ],
          [
            "Protein at meals",
            "Canned fish or chicken, cooked/canned beans and lentils, or suitable nut/seed butter. Dry beans need considerable water and fuel.",
          ],
          [
            "Fruit, vegetables + fiber",
            "Rotate canned fruit, vegetables and pulses. Include variety; add fiber gradually and keep safe water available.",
          ],
          [
            "Calcium + other micronutrients",
            "Shelf-stable milk, a suitable fortified alternative, or other label-verified sources. Look for calcium, vitamin D, iron and potassium; calories alone do not cover them.",
          ],
          [
            "Safe water + diet needs",
            "Reserve potable water for drinking, cooking and cleaning. Keep allergy-safe and prescribed-diet options; fluid or potassium restrictions require individual advice.",
          ],
          [
            "Sodium awareness",
            "Choose no-salt-added or lower-sodium foods where possible. Compare labels before adding bouillon or salt; sodium is not something to maximize.",
          ],
        ].map(([name, desc]) => (
          <article className="panel" key={name}>
            <h3>{name}</h3>
            <p>{desc}</p>
          </article>
        ))}
      </div>
      <details className="panel">
        <summary>Useful label reference numbers</summary>
        <p>
          FDA label Daily Values are comparison references, not personalized
          emergency rations: protein 50 g; fiber 28 g; calcium 1,300 mg; vitamin
          D 20 mcg; potassium 4,700 mg. Sodium is a limit of less than 2,300 mg,
          not a target. Individual requirements and prescribed restrictions may
          differ.
        </p>
        <p>
          <a
            href="https://www.fda.gov/food/nutrition-facts-label/daily-value-nutrition-and-supplement-facts-labels"
            target="_blank"
            rel="noreferrer"
          >
            FDA Daily Values
          </a>{" "}
          ·{" "}
          <a
            href="https://www.fda.gov/food/nutrition-facts-label/how-understand-and-use-nutrition-facts-label"
            target="_blank"
            rel="noreferrer"
          >
            FDA calories & serving sizes
          </a>{" "}
          (online)
        </p>
      </details>
      <Callout>
        Recipe portions are meal ideas, not calculated daily nutrition totals.
        Use actual package serving counts and labels to check your reserve.
      </Callout>
    </>
  );
}
